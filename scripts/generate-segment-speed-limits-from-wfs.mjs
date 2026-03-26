#!/usr/bin/env node
/**
 * Generates segment_speed_limits.json by downloading speed limit data
 * directly from Digiroad WFS instead of requiring local shapefiles.
 *
 * Usage:
 *   node scripts/generate-segment-speed-limits-from-wfs.mjs
 *   node scripts/generate-segment-speed-limits-from-wfs.mjs --segments public/data/segments_mapping.json --output public/data/segment_speed_limits.json
 *
 * This is equivalent to generate-segment-speed-limits.mjs but fetches
 * speed limit data from the Väylävirasto Digiroad WFS API instead of
 * reading local shapefiles. The spatial matching logic is identical.
 */

import fs from "node:fs";
import path from "node:path";
import {
  CELL_SIZE_METERS,
  FALLBACK_DISTANCE_THRESHOLD_METERS,
  MATCH_DISTANCE_THRESHOLD_METERS,
  MAX_HEADING_DIFF_DEGREES,
  SAMPLE_STEP_METERS,
  TM35FIN,
  createGridIndex,
  degreesToRadians,
  getBBoxFromPoints,
  lonLatToMeters,
  matchSegmentSpeedLimit,
  roundNumber,
  tm35finToWgs84,
} from "./geometry.mjs";

const DEFAULT_SEGMENTS_PATH = "public/data/segments_mapping.json";
const DEFAULT_OUTPUT_PATH = "public/data/segment_speed_limits.json";

const WFS_BASE_URL =
  "https://avoinapi.vaylapilvi.fi/vaylatiedot/digiroad/wfs";
const WFS_LAYER = "digiroad:dr_nopeusrajoitus";
const WFS_BATCH_SIZE = 5000;

function parseArgs(argv) {
  const args = {
    segments: DEFAULT_SEGMENTS_PATH,
    output: DEFAULT_OUTPUT_PATH,
    bbox: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const nextValue = argv[index + 1];

    if (arg === "--segments" && nextValue) {
      args.segments = nextValue;
      index += 1;
      continue;
    }
    if (arg === "--output" && nextValue) {
      args.output = nextValue;
      index += 1;
      continue;
    }
    if (arg === "--bbox" && nextValue) {
      args.bbox = nextValue;
      index += 1;
      continue;
    }

    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  return args;
}

function wgs84ToTm35finApprox(lon, lat) {
  const flattening = 1 / TM35FIN.inverseFlattening;
  const eccentricitySquared = flattening * (2 - flattening);
  const latRad = degreesToRadians(lat);
  const lonRad = degreesToRadians(lon);
  const centralMeridianRad = degreesToRadians(TM35FIN.centralMeridianDegrees);

  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const tanLat = Math.tan(latRad);
  const n = TM35FIN.a / Math.sqrt(1 - eccentricitySquared * sinLat ** 2);
  const ePrimeSquared = eccentricitySquared / (1 - eccentricitySquared);
  const c = ePrimeSquared * cosLat ** 2;
  const t = tanLat ** 2;
  const a = cosLat * (lonRad - centralMeridianRad);

  const m =
    TM35FIN.a *
    ((1 -
      eccentricitySquared / 4 -
      (3 * eccentricitySquared ** 2) / 64 -
      (5 * eccentricitySquared ** 3) / 256) *
      latRad -
      ((3 * eccentricitySquared) / 8 +
        (3 * eccentricitySquared ** 2) / 32 +
        (45 * eccentricitySquared ** 3) / 1024) *
        Math.sin(2 * latRad) +
      ((15 * eccentricitySquared ** 2) / 256 +
        (45 * eccentricitySquared ** 3) / 1024) *
        Math.sin(4 * latRad) -
      ((35 * eccentricitySquared ** 3) / 3072) * Math.sin(6 * latRad));

  const x =
    TM35FIN.falseEasting +
    TM35FIN.scaleFactor *
      n *
      (a +
        ((1 - t + c) * a ** 3) / 6 +
        ((5 - 18 * t + t ** 2 + 72 * c - 58 * ePrimeSquared) * a ** 5) / 120);

  const y =
    TM35FIN.scaleFactor *
    (m +
      n *
        tanLat *
        (a ** 2 / 2 +
          ((5 - t + 9 * c + 4 * c ** 2) * a ** 4) / 24 +
          ((61 - 58 * t + t ** 2 + 600 * c - 330 * ePrimeSquared) * a ** 6) /
            720));

  return { x, y };
}

function computeBBoxFromSegments(segmentEntries) {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  for (const [, entry] of segmentEntries) {
    const coords = entry?.geometry?.coordinates;
    if (!Array.isArray(coords)) continue;
    for (const [lon, lat] of coords) {
      if (lon < minLon) minLon = lon;
      if (lat < minLat) minLat = lat;
      if (lon > maxLon) maxLon = lon;
      if (lat > maxLat) maxLat = lat;
    }
  }

  const padding = 0.02;
  const sw = wgs84ToTm35finApprox(minLon - padding, minLat - padding);
  const ne = wgs84ToTm35finApprox(maxLon + padding, maxLat + padding);

  return `${Math.floor(sw.x)},${Math.floor(sw.y)},${Math.ceil(ne.x)},${Math.ceil(ne.y)},EPSG:3067`;
}

async function fetchSpeedLimitsFromWfs(bbox) {
  const allFeatures = [];
  let offset = 0;

  while (true) {
    const url = new URL(WFS_BASE_URL);
    url.searchParams.set("service", "WFS");
    url.searchParams.set("request", "GetFeature");
    url.searchParams.set("version", "2.0.0");
    url.searchParams.set("typeName", WFS_LAYER);
    url.searchParams.set("outputFormat", "application/json");
    url.searchParams.set("bbox", bbox);
    url.searchParams.set("count", String(WFS_BATCH_SIZE));
    url.searchParams.set("startIndex", String(offset));

    console.log(`Fetching WFS offset=${offset}...`);
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(
        `WFS request failed: ${response.status} ${response.statusText} for URL: ${url.toString()}`,
      );
    }

    const data = await response.json();
    const features = data.features || [];
    console.log(`  Got ${features.length} features`);
    allFeatures.push(...features);

    if (features.length < WFS_BATCH_SIZE) break;
    offset += WFS_BATCH_SIZE;
  }

  console.log(`Total WFS features: ${allFeatures.length}`);
  return allFeatures;
}

function convertWfsFeatures(wfsFeatures) {
  const speedFeatures = [];

  for (let index = 0; index < wfsFeatures.length; index += 1) {
    const feature = wfsFeatures[index];
    const props = feature.properties;
    const speedLimit = Number(props.arvo);
    if (!Number.isFinite(speedLimit) || speedLimit <= 0) continue;

    const coords = feature.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) continue;

    // WFS returns TM35FIN coordinates — convert to WGS84 then to meters
    const partsMeters = [
      coords
        .map((coord) => {
          const wgs84 = tm35finToWgs84(coord[0], coord[1]);
          return lonLatToMeters([wgs84.lon, wgs84.lat]);
        })
        .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
    ].filter((part) => part.length >= 2);

    if (partsMeters.length === 0) continue;

    const bbox = getBBoxFromPoints(partsMeters.flat());
    speedFeatures.push({
      id: `wfs:${String(props.id ?? index)}`,
      speedLimit,
      directionCode: props.vaik_suunt ?? null,
      municipalityCode: props.kuntakoodi ?? null,
      linkId: props.link_id ? String(props.link_id) : null,
      bbox,
      partsMeters,
    });
  }

  return speedFeatures;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(args.segments)) {
    throw new Error(`Segments file not found: ${args.segments}`);
  }

  const segmentsJson = JSON.parse(fs.readFileSync(args.segments, "utf8"));
  const segmentEntries = Object.entries(segmentsJson.segmentId ?? {});
  console.log(`Loaded ${segmentEntries.length} segments`);

  const bbox = args.bbox ?? computeBBoxFromSegments(segmentEntries);
  console.log(`WFS BBOX: ${bbox}`);

  const wfsFeatures = await fetchSpeedLimitsFromWfs(bbox);
  const speedFeatures = convertWfsFeatures(wfsFeatures);
  console.log(`Valid speed features: ${speedFeatures.length}`);

  const gridIndex = createGridIndex(speedFeatures, CELL_SIZE_METERS);

  const matchedSegments = {};
  const unmatchedSegmentIds = [];
  let sampledOverlapCount = 0;
  let fallbackCount = 0;
  let lowCoverageCount = 0;

  for (const [segmentId, entry] of segmentEntries) {
    const coordinates = entry?.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      unmatchedSegmentIds.push(segmentId);
      continue;
    }

    const pointsMeters = coordinates.map((coordinate) =>
      lonLatToMeters(coordinate),
    );
    const bbox = getBBoxFromPoints(pointsMeters);
    const segment = { segmentId, pointsMeters, bbox };
    const match = matchSegmentSpeedLimit(segment, speedFeatures, gridIndex);

    if (!match) {
      unmatchedSegmentIds.push(segmentId);
      continue;
    }

    if (match.method === "sampled-overlap") {
      sampledOverlapCount += 1;
      if (match.coverage < 0.5) lowCoverageCount += 1;
    } else {
      fallbackCount += 1;
    }

    matchedSegments[segmentId] = {
      speedLimit: match.speedLimit,
      coverage: roundNumber(match.coverage, 4),
      matchedLengthMeters: roundNumber(match.matchedLengthMeters, 1),
      segmentLengthMeters: roundNumber(match.segmentLengthMeters, 1),
      sourceRecordCount: match.sourceRecordCount,
      method: match.method,
    };

    if (match.fallbackDistanceMeters !== undefined) {
      matchedSegments[segmentId].fallbackDistanceMeters = roundNumber(
        match.fallbackDistanceMeters,
        1,
      );
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    source: {
      wfsUrl: WFS_BASE_URL,
      wfsLayer: WFS_LAYER,
      segmentsPath: args.segments,
      speedRecordCount: speedFeatures.length,
      segmentCount: segmentEntries.length,
      parameters: {
        cellSizeMeters: CELL_SIZE_METERS,
        sampleStepMeters: SAMPLE_STEP_METERS,
        matchDistanceThresholdMeters: MATCH_DISTANCE_THRESHOLD_METERS,
        fallbackDistanceThresholdMeters: FALLBACK_DISTANCE_THRESHOLD_METERS,
        maxHeadingDiffDegrees: MAX_HEADING_DIFF_DEGREES,
      },
    },
    stats: {
      matchedSegments: Object.keys(matchedSegments).length,
      unmatchedSegments: unmatchedSegmentIds.length,
      sampledOverlapCount,
      fallbackCount,
      lowCoverageCount,
      unmatchedSampleSegmentIds: unmatchedSegmentIds.slice(0, 20),
    },
    segmentId: matchedSegments,
  };

  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, `${JSON.stringify(output, null, 2)}\n`);

  const coverageValues = Object.values(matchedSegments)
    .map((entry) => entry.coverage)
    .sort((a, b) => a - b);
  const coverageMedian =
    coverageValues.length === 0
      ? 0
      : coverageValues[Math.floor(coverageValues.length / 2)];

  console.log(`\nWrote ${args.output}`);
  console.log(`Speed features: ${speedFeatures.length}`);
  console.log(`Segments: ${segmentEntries.length}`);
  console.log(`Matched: ${output.stats.matchedSegments}`);
  console.log(`Unmatched: ${output.stats.unmatchedSegments}`);
  console.log(`Sampled overlap matches: ${sampledOverlapCount}`);
  console.log(`Midpoint fallback matches: ${fallbackCount}`);
  console.log(`Low coverage (< 0.5): ${lowCoverageCount}`);
  console.log(`Median coverage: ${roundNumber(coverageMedian, 4)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

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

const DEFAULT_SEGMENTS_PATH = "public/data/segments_mapping.json";
const DEFAULT_OUTPUT_PATH = "public/data/segment_speed_limits.json";

const WFS_BASE_URL =
  "https://avoinapi.vaylapilvi.fi/vaylatiedot/digiroad/wfs";
const WFS_LAYER = "digiroad:dr_nopeusrajoitus";
const WFS_BATCH_SIZE = 5000;

const CELL_SIZE_METERS = 250;
const MATCH_DISTANCE_THRESHOLD_METERS = 25;
const FALLBACK_DISTANCE_THRESHOLD_METERS = 60;
const SAMPLE_STEP_METERS = 15;
const MAX_HEADING_DIFF_DEGREES = 40;
const REF_LATITUDE_DEGREES = 60.3;

const TM35FIN = {
  a: 6378137.0,
  inverseFlattening: 298.257222101,
  falseEasting: 500000.0,
  scaleFactor: 0.9996,
  centralMeridianDegrees: 27.0,
};

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
      throw new Error(`WFS request failed: ${response.status} ${response.statusText}`);
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

// ── Geometry functions (identical to generate-segment-speed-limits.mjs) ──

function tm35finToWgs84(x, y) {
  const flattening = 1 / TM35FIN.inverseFlattening;
  const eccentricitySquared = flattening * (2 - flattening);
  const eccentricityPrimeSquared =
    eccentricitySquared / (1 - eccentricitySquared);
  const e1 =
    (1 - Math.sqrt(1 - eccentricitySquared)) /
    (1 + Math.sqrt(1 - eccentricitySquared));
  const centralMeridianRadians = degreesToRadians(
    TM35FIN.centralMeridianDegrees,
  );
  const meridionalArc = y / TM35FIN.scaleFactor;
  const mu =
    meridionalArc /
    (TM35FIN.a *
      (1 -
        eccentricitySquared / 4 -
        (3 * eccentricitySquared ** 2) / 64 -
        (5 * eccentricitySquared ** 3) / 256));

  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);

  const sinPhi1 = Math.sin(phi1);
  const cosPhi1 = Math.cos(phi1);
  const tanPhi1 = Math.tan(phi1);
  const n1 = TM35FIN.a / Math.sqrt(1 - eccentricitySquared * sinPhi1 ** 2);
  const r1 =
    (TM35FIN.a * (1 - eccentricitySquared)) /
    (1 - eccentricitySquared * sinPhi1 ** 2) ** 1.5;
  const t1 = tanPhi1 ** 2;
  const c1 = eccentricityPrimeSquared * cosPhi1 ** 2;
  const d = (x - TM35FIN.falseEasting) / (n1 * TM35FIN.scaleFactor);

  const latitudeRadians =
    phi1 -
    ((n1 * tanPhi1) / r1) *
      (d ** 2 / 2 -
        ((5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * eccentricityPrimeSquared) *
          d ** 4) /
          24 +
        ((61 +
          90 * t1 +
          298 * c1 +
          45 * t1 ** 2 -
          252 * eccentricityPrimeSquared -
          3 * c1 ** 2) *
          d ** 6) /
          720);

  const longitudeRadians =
    centralMeridianRadians +
    (d -
      ((1 + 2 * t1 + c1) * d ** 3) / 6 +
      ((5 -
        2 * c1 +
        28 * t1 -
        3 * c1 ** 2 +
        8 * eccentricityPrimeSquared +
        24 * t1 ** 2) *
        d ** 5) /
        120) /
      cosPhi1;

  return {
    lon: radiansToDegrees(longitudeRadians),
    lat: radiansToDegrees(latitudeRadians),
  };
}

function degreesToRadians(value) {
  return (value * Math.PI) / 180;
}

function radiansToDegrees(value) {
  return (value * 180) / Math.PI;
}

const metersPerDegreeLatitude =
  111132.92 -
  559.82 * Math.cos(2 * degreesToRadians(REF_LATITUDE_DEGREES)) +
  1.175 * Math.cos(4 * degreesToRadians(REF_LATITUDE_DEGREES)) -
  0.0023 * Math.cos(6 * degreesToRadians(REF_LATITUDE_DEGREES));
const metersPerDegreeLongitude =
  111412.84 * Math.cos(degreesToRadians(REF_LATITUDE_DEGREES)) -
  93.5 * Math.cos(3 * degreesToRadians(REF_LATITUDE_DEGREES)) +
  0.118 * Math.cos(5 * degreesToRadians(REF_LATITUDE_DEGREES));

function lonLatToMeters([lon, lat]) {
  return {
    x: lon * metersPerDegreeLongitude,
    y: lat * metersPerDegreeLatitude,
  };
}

function getBBoxFromPoints(points) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    if (point.x < minX) minX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.x > maxX) maxX = point.x;
    if (point.y > maxY) maxY = point.y;
  }

  return { minX, minY, maxX, maxY };
}

function expandBBox(bbox, padding) {
  return {
    minX: bbox.minX - padding,
    minY: bbox.minY - padding,
    maxX: bbox.maxX + padding,
    maxY: bbox.maxY + padding,
  };
}

function bboxesIntersect(a, b) {
  return !(
    a.maxX < b.minX ||
    a.minX > b.maxX ||
    a.maxY < b.minY ||
    a.minY > b.maxY
  );
}

function distanceBetweenPoints(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function createGridIndex(features, cellSize) {
  const cells = new Map();

  const addToCell = (cellX, cellY, featureIndex) => {
    const key = `${cellX}:${cellY}`;
    const existing = cells.get(key);
    if (existing) {
      existing.push(featureIndex);
      return;
    }
    cells.set(key, [featureIndex]);
  };

  features.forEach((feature, featureIndex) => {
    const minCellX = Math.floor(feature.bbox.minX / cellSize);
    const maxCellX = Math.floor(feature.bbox.maxX / cellSize);
    const minCellY = Math.floor(feature.bbox.minY / cellSize);
    const maxCellY = Math.floor(feature.bbox.maxY / cellSize);

    for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
      for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) {
        addToCell(cellX, cellY, featureIndex);
      }
    }
  });

  return { cellSize, cells };
}

function getCandidateFeatureIndexes(gridIndex, bbox) {
  const minCellX = Math.floor(bbox.minX / gridIndex.cellSize);
  const maxCellX = Math.floor(bbox.maxX / gridIndex.cellSize);
  const minCellY = Math.floor(bbox.minY / gridIndex.cellSize);
  const maxCellY = Math.floor(bbox.maxY / gridIndex.cellSize);

  const candidateIndexes = new Set();
  for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
    for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) {
      const key = `${cellX}:${cellY}`;
      const indexes = gridIndex.cells.get(key);
      if (!indexes) continue;
      for (const featureIndex of indexes) {
        candidateIndexes.add(featureIndex);
      }
    }
  }

  return candidateIndexes;
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

function lengthOfVector(vector) {
  return Math.hypot(vector.x, vector.y);
}

function getHeadingDifferenceDegrees(a, b) {
  const aLength = lengthOfVector(a);
  const bLength = lengthOfVector(b);
  if (aLength === 0 || bLength === 0) return 90;

  const cosine = Math.min(
    1,
    Math.max(-1, Math.abs(dot(a, b) / (aLength * bLength))),
  );
  return radiansToDegrees(Math.acos(cosine));
}

function getNearestDistanceToFeature(point, feature) {
  let best = {
    distanceMeters: Number.POSITIVE_INFINITY,
    heading: { x: 0, y: 0 },
  };

  for (const part of feature.partsMeters) {
    for (let index = 0; index < part.length - 1; index += 1) {
      const start = part[index];
      const end = part[index + 1];
      const segment = { x: end.x - start.x, y: end.y - start.y };
      const segmentLengthSquared = segment.x ** 2 + segment.y ** 2;
      if (segmentLengthSquared === 0) continue;

      const projectedT =
        ((point.x - start.x) * segment.x + (point.y - start.y) * segment.y) /
        segmentLengthSquared;
      const t = Math.min(1, Math.max(0, projectedT));
      const projectedPoint = {
        x: start.x + segment.x * t,
        y: start.y + segment.y * t,
      };
      const distanceMeters = distanceBetweenPoints(point, projectedPoint);
      if (distanceMeters < best.distanceMeters) {
        best = { distanceMeters, heading: segment };
      }
    }
  }

  return best;
}

function buildSamplesForSegment(pointsMeters, sampleStepMeters) {
  const samples = [];
  let totalLengthMeters = 0;

  for (let index = 0; index < pointsMeters.length - 1; index += 1) {
    const start = pointsMeters[index];
    const end = pointsMeters[index + 1];
    const segmentVector = { x: end.x - start.x, y: end.y - start.y };
    const segmentLengthMeters = lengthOfVector(segmentVector);
    if (segmentLengthMeters === 0) continue;

    totalLengthMeters += segmentLengthMeters;
    const sampleCount = Math.max(
      1,
      Math.ceil(segmentLengthMeters / sampleStepMeters),
    );
    const sampleWeightMeters = segmentLengthMeters / sampleCount;

    for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
      const t = (sampleIndex + 0.5) / sampleCount;
      samples.push({
        point: {
          x: start.x + segmentVector.x * t,
          y: start.y + segmentVector.y * t,
        },
        heading: segmentVector,
        weightMeters: sampleWeightMeters,
      });
    }
  }

  return { samples, totalLengthMeters };
}

function getMidpoint(pointsMeters) {
  if (pointsMeters.length === 0) return { x: 0, y: 0 };
  if (pointsMeters.length === 1) return pointsMeters[0];

  const { samples, totalLengthMeters } = buildSamplesForSegment(
    pointsMeters,
    Number.POSITIVE_INFINITY,
  );
  if (samples.length === 0 || totalLengthMeters === 0) {
    return pointsMeters[Math.floor(pointsMeters.length / 2)];
  }

  let traversed = 0;
  for (const sample of samples) {
    traversed += sample.weightMeters;
    if (traversed >= totalLengthMeters / 2) return sample.point;
  }

  return samples[samples.length - 1].point;
}

function chooseSpeedLimit(matchLengthsByLimit) {
  let bestLimit = null;
  let bestMatchedLength = Number.NEGATIVE_INFINITY;

  for (const [speedLimit, matchedLengthMeters] of matchLengthsByLimit.entries()) {
    if (
      matchedLengthMeters > bestMatchedLength ||
      (matchedLengthMeters === bestMatchedLength &&
        (bestLimit === null || speedLimit < bestLimit))
    ) {
      bestLimit = speedLimit;
      bestMatchedLength = matchedLengthMeters;
    }
  }

  return {
    speedLimit: bestLimit,
    matchedLengthMeters: Number.isFinite(bestMatchedLength)
      ? bestMatchedLength
      : 0,
  };
}

function matchSegmentSpeedLimit(segment, speedFeatures, gridIndex) {
  const { samples, totalLengthMeters } = buildSamplesForSegment(
    segment.pointsMeters,
    SAMPLE_STEP_METERS,
  );
  if (samples.length === 0 || totalLengthMeters === 0) return null;

  const expandedBBox = expandBBox(
    segment.bbox,
    FALLBACK_DISTANCE_THRESHOLD_METERS,
  );
  const candidateIndexes = [
    ...getCandidateFeatureIndexes(gridIndex, expandedBBox),
  ].filter((featureIndex) =>
    bboxesIntersect(expandedBBox, speedFeatures[featureIndex].bbox),
  );

  if (candidateIndexes.length === 0) return null;

  const matchLengthsByLimit = new Map();
  const matchedSourceIds = new Set();

  for (const sample of samples) {
    let bestMatch = null;

    for (const featureIndex of candidateIndexes) {
      const feature = speedFeatures[featureIndex];
      const nearest = getNearestDistanceToFeature(sample.point, feature);
      if (!Number.isFinite(nearest.distanceMeters)) continue;
      if (nearest.distanceMeters > MATCH_DISTANCE_THRESHOLD_METERS) continue;

      const headingDiffDegrees = getHeadingDifferenceDegrees(
        sample.heading,
        nearest.heading,
      );
      if (headingDiffDegrees > MAX_HEADING_DIFF_DEGREES) continue;

      const score = nearest.distanceMeters + headingDiffDegrees * 0.75;
      if (!bestMatch || score < bestMatch.score) {
        bestMatch = { feature, score };
      }
    }

    if (!bestMatch) continue;

    const previous = matchLengthsByLimit.get(bestMatch.feature.speedLimit) ?? 0;
    matchLengthsByLimit.set(
      bestMatch.feature.speedLimit,
      previous + sample.weightMeters,
    );
    matchedSourceIds.add(bestMatch.feature.id);
  }

  if (matchLengthsByLimit.size > 0) {
    const best = chooseSpeedLimit(matchLengthsByLimit);
    return {
      speedLimit: best.speedLimit,
      coverage: best.matchedLengthMeters / totalLengthMeters,
      matchedLengthMeters: best.matchedLengthMeters,
      segmentLengthMeters: totalLengthMeters,
      sourceRecordCount: matchedSourceIds.size,
      method: "sampled-overlap",
      candidateCount: candidateIndexes.length,
    };
  }

  const midpoint = getMidpoint(segment.pointsMeters);
  let bestFallback = null;
  for (const featureIndex of candidateIndexes) {
    const feature = speedFeatures[featureIndex];
    const nearest = getNearestDistanceToFeature(midpoint, feature);
    if (!Number.isFinite(nearest.distanceMeters)) continue;
    if (nearest.distanceMeters > FALLBACK_DISTANCE_THRESHOLD_METERS) continue;

    const score = nearest.distanceMeters;
    if (!bestFallback || score < bestFallback.score) {
      bestFallback = { feature, score, distanceMeters: nearest.distanceMeters };
    }
  }

  if (!bestFallback) return null;

  return {
    speedLimit: bestFallback.feature.speedLimit,
    coverage: 0,
    matchedLengthMeters: 0,
    segmentLengthMeters: totalLengthMeters,
    sourceRecordCount: 1,
    method: "midpoint-fallback",
    candidateCount: candidateIndexes.length,
    fallbackDistanceMeters: bestFallback.distanceMeters,
  };
}

function roundNumber(value, decimals = 3) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
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

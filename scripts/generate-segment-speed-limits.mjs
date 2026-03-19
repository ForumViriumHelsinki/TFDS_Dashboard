import fs from "node:fs";
import path from "node:path";

const DEFAULT_SPEED_DIR = "speed-limit-GIS";
const DEFAULT_SPEED_BASENAME = "DR_NOPEUSRAJOITUS";
const DEFAULT_SEGMENTS_PATH = "public/data/segments_mapping.json";
const DEFAULT_OUTPUT_PATH = "public/data/segment_speed_limits.json";

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
    speedDir: DEFAULT_SPEED_DIR,
    basename: DEFAULT_SPEED_BASENAME,
    segments: DEFAULT_SEGMENTS_PATH,
    output: DEFAULT_OUTPUT_PATH,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const nextValue = argv[index + 1];

    if (arg === "--speed-dir" && nextValue) {
      args.speedDir = nextValue;
      index += 1;
      continue;
    }
    if (arg === "--basename" && nextValue) {
      args.basename = nextValue;
      index += 1;
      continue;
    }
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

    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  return args;
}

function ensureFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
}

function resolveDatasetBasepaths(speedDir, basenamePrefix) {
  const entries = fs.readdirSync(speedDir, { withFileTypes: true });
  const basenames = new Set();

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".shp")) continue;
    if (!entry.name.startsWith(basenamePrefix)) continue;

    const basepath = path.join(speedDir, entry.name.slice(0, -4));
    if (
      fs.existsSync(`${basepath}.dbf`) &&
      fs.existsSync(`${basepath}.shp`) &&
      fs.existsSync(`${basepath}.shx`)
    ) {
      basenames.add(basepath);
    }
  }

  return [...basenames].sort((a, b) => a.localeCompare(b));
}

function readDbfRecords(filePath) {
  const buffer = fs.readFileSync(filePath);
  const recordCount = buffer.readUInt32LE(4);
  const headerLength = buffer.readUInt16LE(8);
  const recordLength = buffer.readUInt16LE(10);
  const fields = [];

  let offset = 32;
  while (offset < headerLength - 1 && buffer[offset] !== 0x0d) {
    const name = buffer
      .subarray(offset, offset + 11)
      .toString("ascii")
      .replace(/\u0000.*$/, "")
      .trim();
    const type = String.fromCharCode(buffer[offset + 11]);
    const length = buffer[offset + 16];
    const decimals = buffer[offset + 17];
    fields.push({ name, type, length, decimals });
    offset += 32;
  }

  const records = [];
  let deletedCount = 0;
  for (let index = 0; index < recordCount; index += 1) {
    const recordOffset = headerLength + index * recordLength;
    const deletionFlag = buffer[recordOffset];
    if (deletionFlag === 0x2a) {
      deletedCount += 1;
      continue;
    }

    let fieldOffset = recordOffset + 1;
    const record = {};
    for (const field of fields) {
      const raw = buffer
        .subarray(fieldOffset, fieldOffset + field.length)
        .toString("utf8")
        .trim();
      fieldOffset += field.length;

      if (field.type === "N") {
        record[field.name] = raw === "" ? null : Number.parseFloat(raw);
      } else {
        record[field.name] = raw;
      }
    }
    records.push(record);
  }

  return {
    fields,
    records,
    declaredRecordCount: recordCount,
    deletedCount,
  };
}

function readPolylineZRecords(filePath) {
  const buffer = fs.readFileSync(filePath);
  const shapeType = buffer.readInt32LE(32);
  if (shapeType !== 13) {
    throw new Error(
      `Unsupported shapefile type ${shapeType}. Expected PolyLineZ.`,
    );
  }

  const records = [];
  let offset = 100;
  while (offset < buffer.length) {
    const contentLengthWords = buffer.readInt32BE(offset + 4);
    const contentLength = contentLengthWords * 2;
    const contentOffset = offset + 8;
    const recordShapeType = buffer.readInt32LE(contentOffset);
    if (recordShapeType !== 13) {
      throw new Error(`Unsupported record shape type ${recordShapeType}.`);
    }

    const minX = buffer.readDoubleLE(contentOffset + 4);
    const minY = buffer.readDoubleLE(contentOffset + 12);
    const maxX = buffer.readDoubleLE(contentOffset + 20);
    const maxY = buffer.readDoubleLE(contentOffset + 28);
    const partCount = buffer.readInt32LE(contentOffset + 36);
    const pointCount = buffer.readInt32LE(contentOffset + 40);

    const partsOffset = contentOffset + 44;
    const pointsOffset = partsOffset + partCount * 4;
    const partIndices = [];
    for (let partIndex = 0; partIndex < partCount; partIndex += 1) {
      partIndices.push(buffer.readInt32LE(partsOffset + partIndex * 4));
    }

    const points = [];
    for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
      const xyOffset = pointsOffset + pointIndex * 16;
      points.push({
        x: buffer.readDoubleLE(xyOffset),
        y: buffer.readDoubleLE(xyOffset + 8),
      });
    }

    const parts = [];
    for (let partIndex = 0; partIndex < partCount; partIndex += 1) {
      const start = partIndices[partIndex];
      const end =
        partIndex + 1 < partIndices.length
          ? partIndices[partIndex + 1]
          : pointCount;
      parts.push(points.slice(start, end));
    }

    records.push({
      bbox: { minX, minY, maxX, maxY },
      parts,
    });

    offset += 8 + contentLength;
  }

  return records;
}

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

  return {
    cellSize,
    cells,
  };
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
  if (aLength === 0 || bLength === 0) {
    return 90;
  }

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
        best = {
          distanceMeters,
          heading: segment,
        };
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
    const segmentVector = {
      x: end.x - start.x,
      y: end.y - start.y,
    };
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
  if (pointsMeters.length === 0) {
    return { x: 0, y: 0 };
  }
  if (pointsMeters.length === 1) {
    return pointsMeters[0];
  }

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
    if (traversed >= totalLengthMeters / 2) {
      return sample.point;
    }
  }

  return samples[samples.length - 1].point;
}

function chooseSpeedLimit(matchLengthsByLimit) {
  let bestLimit = null;
  let bestMatchedLength = Number.NEGATIVE_INFINITY;

  for (const [
    speedLimit,
    matchedLengthMeters,
  ] of matchLengthsByLimit.entries()) {
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
  if (samples.length === 0 || totalLengthMeters === 0) {
    return null;
  }

  const expandedBBox = expandBBox(
    segment.bbox,
    FALLBACK_DISTANCE_THRESHOLD_METERS,
  );
  const candidateIndexes = [
    ...getCandidateFeatureIndexes(gridIndex, expandedBBox),
  ].filter((featureIndex) =>
    bboxesIntersect(expandedBBox, speedFeatures[featureIndex].bbox),
  );

  if (candidateIndexes.length === 0) {
    return null;
  }

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
        bestMatch = {
          feature,
          score,
        };
      }
    }

    if (!bestMatch) {
      continue;
    }

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
      bestFallback = {
        feature,
        score,
        distanceMeters: nearest.distanceMeters,
      };
    }
  }

  if (!bestFallback) {
    return null;
  }

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

function main() {
  const args = parseArgs(process.argv.slice(2));
  ensureFileExists(args.speedDir);
  ensureFileExists(args.segments);

  const datasetBasepaths = resolveDatasetBasepaths(
    args.speedDir,
    args.basename,
  );
  if (datasetBasepaths.length === 0) {
    throw new Error(
      `No shapefile datasets found in ${args.speedDir} for prefix ${args.basename}`,
    );
  }

  const speedFeatures = [];
  const datasetSummaries = [];
  for (const datasetBasepath of datasetBasepaths) {
    const dbfPath = `${datasetBasepath}.dbf`;
    const shpPath = `${datasetBasepath}.shp`;
    const dbf = readDbfRecords(dbfPath);
    const shapeRecords = readPolylineZRecords(shpPath);

    if (dbf.records.length !== shapeRecords.length) {
      throw new Error(
        `DBF/SHP record count mismatch for ${path.basename(datasetBasepath)}: ${dbf.records.length} vs ${shapeRecords.length}`,
      );
    }

    let validFeatureCount = 0;
    for (let index = 0; index < dbf.records.length; index += 1) {
      const record = dbf.records[index];
      const shape = shapeRecords[index];
      const speedLimit = Number(record.ARVO);
      if (!Number.isFinite(speedLimit) || speedLimit <= 0) {
        continue;
      }

      const partsMeters = shape.parts
        .map((part) =>
          part.map((point) =>
            lonLatToMeters(Object.values(tm35finToWgs84(point.x, point.y))),
          ),
        )
        .filter((part) => part.length >= 2);
      if (partsMeters.length === 0) {
        continue;
      }

      const bbox = getBBoxFromPoints(partsMeters.flat());
      speedFeatures.push({
        id: `${path.basename(datasetBasepath)}:${String(record.ID ?? index)}`,
        speedLimit,
        directionCode: record.VAIK_SUUNT ?? null,
        municipalityCode: record.KUNTAKOODI ?? null,
        linkId: record.LINK_ID ? String(record.LINK_ID) : null,
        bbox,
        partsMeters,
      });
      validFeatureCount += 1;
    }

    datasetSummaries.push({
      name: path.basename(datasetBasepath),
      recordCount: dbf.records.length,
      validFeatureCount,
    });
  }

  const segmentsJson = JSON.parse(fs.readFileSync(args.segments, "utf8"));
  const segmentEntries = Object.entries(segmentsJson.segmentId ?? {});
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
      if (match.coverage < 0.5) {
        lowCoverageCount += 1;
      }
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
      speedDir: args.speedDir,
      basenamePrefix: args.basename,
      datasets: datasetSummaries,
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

  console.log(`Wrote ${args.output}`);
  console.log(`Speed features: ${speedFeatures.length}`);
  console.log(`Segments: ${segmentEntries.length}`);
  console.log(`Matched: ${output.stats.matchedSegments}`);
  console.log(`Unmatched: ${output.stats.unmatchedSegments}`);
  console.log(`Sampled overlap matches: ${sampledOverlapCount}`);
  console.log(`Midpoint fallback matches: ${fallbackCount}`);
  console.log(`Low coverage (< 0.5): ${lowCoverageCount}`);
  console.log(`Median coverage: ${roundNumber(coverageMedian, 4)}`);
}

main();

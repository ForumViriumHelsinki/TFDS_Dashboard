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
  getBBoxFromPoints,
  lonLatToMeters,
  matchSegmentSpeedLimit,
  roundNumber,
  tm35finToWgs84,
} from "./geometry.mjs";

const DEFAULT_SPEED_DIR = "speed-limit-GIS";
const DEFAULT_SPEED_BASENAME = "DR_NOPEUSRAJOITUS";
const DEFAULT_SEGMENTS_PATH = "public/data/segments_mapping.json";
const DEFAULT_OUTPUT_PATH = "public/data/segment_speed_limits.json";

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

/**
 * Shared geometry utilities for speed limit generator scripts.
 *
 * Provides coordinate transforms (TM35FIN ↔ WGS84 ↔ meters), spatial
 * indexing, and segment-to-feature matching logic used by both:
 *   - generate-segment-speed-limits.mjs (shapefile source)
 *   - generate-segment-speed-limits-from-wfs.mjs (WFS source)
 */

export const TM35FIN = {
  a: 6378137.0,
  inverseFlattening: 298.257222101,
  falseEasting: 500000.0,
  scaleFactor: 0.9996,
  centralMeridianDegrees: 27.0,
};

export const CELL_SIZE_METERS = 250;
export const MATCH_DISTANCE_THRESHOLD_METERS = 25;
export const FALLBACK_DISTANCE_THRESHOLD_METERS = 60;
export const SAMPLE_STEP_METERS = 15;
export const MAX_HEADING_DIFF_DEGREES = 40;
export const REF_LATITUDE_DEGREES = 60.3;

export function degreesToRadians(value) {
  return (value * Math.PI) / 180;
}

export function radiansToDegrees(value) {
  return (value * 180) / Math.PI;
}

export const metersPerDegreeLatitude =
  111132.92 -
  559.82 * Math.cos(2 * degreesToRadians(REF_LATITUDE_DEGREES)) +
  1.175 * Math.cos(4 * degreesToRadians(REF_LATITUDE_DEGREES)) -
  0.0023 * Math.cos(6 * degreesToRadians(REF_LATITUDE_DEGREES));

export const metersPerDegreeLongitude =
  111412.84 * Math.cos(degreesToRadians(REF_LATITUDE_DEGREES)) -
  93.5 * Math.cos(3 * degreesToRadians(REF_LATITUDE_DEGREES)) +
  0.118 * Math.cos(5 * degreesToRadians(REF_LATITUDE_DEGREES));

export function tm35finToWgs84(x, y) {
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

export function lonLatToMeters([lon, lat]) {
  return {
    x: lon * metersPerDegreeLongitude,
    y: lat * metersPerDegreeLatitude,
  };
}

export function getBBoxFromPoints(points) {
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

export function expandBBox(bbox, padding) {
  return {
    minX: bbox.minX - padding,
    minY: bbox.minY - padding,
    maxX: bbox.maxX + padding,
    maxY: bbox.maxY + padding,
  };
}

export function bboxesIntersect(a, b) {
  return !(
    a.maxX < b.minX ||
    a.minX > b.maxX ||
    a.maxY < b.minY ||
    a.minY > b.maxY
  );
}

export function distanceBetweenPoints(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function createGridIndex(features, cellSize) {
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

export function getCandidateFeatureIndexes(gridIndex, bbox) {
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

export function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

export function lengthOfVector(vector) {
  return Math.hypot(vector.x, vector.y);
}

export function getHeadingDifferenceDegrees(a, b) {
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

export function getNearestDistanceToFeature(point, feature) {
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

export function buildSamplesForSegment(pointsMeters, sampleStepMeters) {
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

export function getMidpoint(pointsMeters) {
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

export function chooseSpeedLimit(matchLengthsByLimit) {
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

export function matchSegmentSpeedLimit(segment, speedFeatures, gridIndex) {
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
        bestMatch = { feature, score };
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

export function roundNumber(value, decimals = 3) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export const influxSegmentMeasurementFieldValues = [
  "currentSpeed",
  "typicalSpeed",
  "fcd_coverage",
  "confidence_level",
] as const;

export type InfluxSegmentMeasurementField =
  (typeof influxSegmentMeasurementFieldValues)[number];

export const segmentMeasurementFieldValues = [
  ...influxSegmentMeasurementFieldValues,
  "relativeSpeed",
] as const;

export type SegmentMeasurementField =
  (typeof segmentMeasurementFieldValues)[number];

export interface SegmentMeasurementFieldConfig {
  value: SegmentMeasurementField;
  label: string;
  yMax: number;
  ticks: number[];
  queryField: InfluxSegmentMeasurementField;
  rangeLabel?: string;
  legendRangeLabel?: string;
  tickFormatter?: (value: number) => string;
  unit?: string;
}

export const segmentMeasurementFieldConfigs: SegmentMeasurementFieldConfig[] = [
  {
    value: "currentSpeed",
    label: "Hetkellinen nopeus",
    yMax: 120,
    ticks: [0, 20, 40, 60, 80, 100, 120],
    queryField: "currentSpeed",
    rangeLabel: "0-120 km/h",
    unit: "km/h",
  },
  {
    value: "typicalSpeed",
    label: "Tyypillinen nopeus",
    yMax: 120,
    ticks: [0, 20, 40, 60, 80, 100, 120],
    queryField: "typicalSpeed",
    rangeLabel: "0-120 km/h",
    unit: "km/h",
  },
  {
    value: "fcd_coverage",
    label: "FCD-kattavuus",
    yMax: 10,
    ticks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    queryField: "fcd_coverage",
    rangeLabel: "0-10",
  },
  {
    value: "confidence_level",
    label: "Luotettavuus",
    yMax: 100,
    ticks: [0, 20, 40, 60, 80, 100],
    queryField: "confidence_level",
    rangeLabel: "0-100 %",
    tickFormatter: (value: number) => `${Math.round(value)} %`,
    unit: "%",
  },
  {
    value: "relativeSpeed",
    label: "Suhteellinen nopeus",
    yMax: 100,
    ticks: [0, 20, 40, 60, 80, 100],
    queryField: "currentSpeed",
    rangeLabel: "0-100 %",
    legendRangeLabel: "0-100 % (kartalla)",
    tickFormatter: (value: number) => `${Math.round(value)} %`,
    unit: "%",
  },
];

export const segmentMeasurementFieldOptions =
  segmentMeasurementFieldConfigs.map((config) => ({
    value: config.value,
    label: config.label,
  }));

export function getSegmentMeasurementFieldConfig(
  value: string | undefined,
): SegmentMeasurementFieldConfig | undefined {
  return segmentMeasurementFieldConfigs.find(
    (config) => config.value === value,
  );
}

export function getSegmentMeasurementFieldQueryField(
  value: string | undefined,
): InfluxSegmentMeasurementField {
  return getSegmentMeasurementFieldConfig(value)?.queryField ?? "currentSpeed";
}

export function isRelativeSpeedField(
  value: string | undefined,
): boolean {
  return value === "relativeSpeed";
}



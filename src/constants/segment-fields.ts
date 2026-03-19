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
  colorMaxValue?: number;
  usesSpeedLimit?: boolean;
}

export const segmentMeasurementFieldConfigs: SegmentMeasurementFieldConfig[] = [
  {
    value: "currentSpeed",
    label: "Hetkellinen nopeus",
    yMax: 120,
    ticks: [0, 20, 40, 60, 80, 100, 120],
    queryField: "currentSpeed",
    rangeLabel: "0-120 km/h",
    legendRangeLabel: "0-100 % nopeusrajoituksesta",
    colorMaxValue: 1,
    usesSpeedLimit: true,
  },
  {
    value: "typicalSpeed",
    label: "Tyypillinen nopeus",
    yMax: 120,
    ticks: [0, 20, 40, 60, 80, 100, 120],
    queryField: "typicalSpeed",
    rangeLabel: "0-120 km/h",
    legendRangeLabel: "0-100 % nopeusrajoituksesta",
    colorMaxValue: 1,
    usesSpeedLimit: true,
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

export function usesSpeedLimitBaseline(value: string | undefined): boolean {
  return Boolean(getSegmentMeasurementFieldConfig(value)?.usesSpeedLimit);
}

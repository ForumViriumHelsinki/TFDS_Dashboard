export const segmentMeasurementFieldValues = [
  "currentSpeed",
  "typicalSpeed",
  "fcd_coverage",
  "confidence_level",
] as const;

export type SegmentMeasurementField = (typeof segmentMeasurementFieldValues)[number];

export interface SegmentMeasurementFieldConfig {
  value: SegmentMeasurementField;
  label: string;
  yMax: number;
  ticks: number[];
}

export const segmentMeasurementFieldConfigs: SegmentMeasurementFieldConfig[] = [
  {
    value: "currentSpeed",
    label: "Hetkellinen nopeus",
    yMax: 120,
    ticks: [0, 20, 40, 60, 80, 100, 120],
  },
  {
    value: "typicalSpeed",
    label: "Tyypillinen nopeus",
    yMax: 120,
    ticks: [0, 20, 40, 60, 80, 100, 120],
  },
  {
    value: "fcd_coverage",
    label: "FCD-kattavuus",
    yMax: 10,
    ticks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
  {
    value: "confidence_level",
    label: "Luotettavuus",
    yMax: 100,
    ticks: [0, 20, 40, 60, 80, 100],
  }
];

export const segmentMeasurementFieldOptions = segmentMeasurementFieldConfigs.map(
  (config) => ({
    value: config.value,
    label: config.label,
  }),
);

export function getSegmentMeasurementFieldConfig(
  value: string | undefined,
): SegmentMeasurementFieldConfig | undefined {
  return segmentMeasurementFieldConfigs.find((config) => config.value === value);
}

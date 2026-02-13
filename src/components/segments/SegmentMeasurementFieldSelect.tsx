import { Select } from "@mantine/core";
import { useNavigate, useSearch } from "@tanstack/react-router";

export const measurementFieldOptions = [
  { value: "typicalSpeed", label: "Tyypillinen nopeus" },
  { value: "currentSpeed", label: "Nykyinen nopeus" },
  { value: "confidence_level", label: "Luotettavuus" },
  { value: "fcd_coverage", label: "FCD-kattavuus" },
];

export function SegmentMeasurementFieldSelect() {
  const navigate = useNavigate({ from: "/" });
  const { segmentMeasurementField } = useSearch({ from: "/" });

  return (
    <Select
      size="sm"
      variant="filled"
      label="Kartalla esitettävä muuttuja"
      placeholder="Valitse muuttuja"
      description="Valitse kartalla esitettävä muuttuja Influxista"
      data={measurementFieldOptions}
      value={segmentMeasurementField ?? null}
      onChange={(nextValue) => {
        navigate({
          search: (prev) => ({
            ...prev,
            segmentMeasurementField: nextValue ?? undefined,
          }),
          replace: true,
        });
      }}
    />
  );
}

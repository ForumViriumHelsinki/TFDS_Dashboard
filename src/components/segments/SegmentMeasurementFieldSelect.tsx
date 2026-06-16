import { Select } from "@mantine/core";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { segmentMeasurementFieldOptions } from "../../constants/segment-fields";

interface SegmentMeasurementFieldSelectProps {
  disabled?: boolean;
}

export function SegmentMeasurementFieldSelect({
  disabled = false,
}: SegmentMeasurementFieldSelectProps) {
  const navigate = useNavigate({ from: "/" });
  const { segmentMeasurementField } = useSearch({ from: "/" });

  return (
    <Select
      size="sm"
      variant="filled"
      label="Kartalla esitettävä muuttuja"
      placeholder="Valitse muuttuja"
      description="Valitse kartalla ja kuvaajassa esitettävä muuttuja."
      data={segmentMeasurementFieldOptions}
      value={segmentMeasurementField ?? null}
      disabled={disabled}
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

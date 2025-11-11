import { TextInput } from "@mantine/core";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function LandLeaseSearch() {
  const navigate = useNavigate({ from: "/" });
  const { landLeaseSearch } = useSearch({ from: "/" });
  const [inputValue, setInputValue] = useState(landLeaseSearch ?? "");

  // Debounce URL updates from input
  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = inputValue.trim();
      const nextValue = trimmed.length > 0 ? inputValue : undefined;
      // Avoid redundant navigation if value hasn't changed
      if ((landLeaseSearch ?? "") === (nextValue ?? "")) return;
      navigate({
        search: (prev) => ({
          ...prev,
          landLeaseSearch: nextValue,
        }),
        replace: true,
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [inputValue, navigate, landLeaseSearch]);

  return (
    <TextInput
      size="sm"
      variant="filled"
      label="Haku"
      placeholder="Syötä hakuehto"
      description="Hae osoitteella tai hakemuksen tunnuksella"
      value={inputValue}
      onChange={(event) => setInputValue(event.currentTarget.value)}
    />
  );
}


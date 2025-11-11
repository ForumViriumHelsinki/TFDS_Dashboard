import { TextInput } from "@mantine/core";
import { useState } from "react";

export function SegmentSearch() {
  const [searchValue, setSearchValue] = useState("");

  return (
    <TextInput
      size="sm"
      variant="filled"
      label="Haku"
      placeholder="Syötä hakuehto"
      description="Hae osoitteella tai hakemuksen tunnuksella"
      value={searchValue}
      onChange={(event) => setSearchValue(event.currentTarget.value)}
    />
  );
}


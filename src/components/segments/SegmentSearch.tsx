import { TextInput } from "@mantine/core";
import { useState } from "react";

export function SegmentSearch() {
  const [searchValue, setSearchValue] = useState("");

  return (
    <TextInput
      size="xs"
      variant="filled"
      label="Haku"
      placeholder="Syötä hakuehto"
      description="Hae tiesegmenttiä "
      value={searchValue}
      onChange={(event) => setSearchValue(event.currentTarget.value)}
    />
  );
}


import { NavLink } from "@mantine/core";
import { ChevronRight } from "lucide-react";
import { useAtom, useSetAtom } from "jotai";
import { selectedSegmentAtom } from "../../atoms/segments";
import { dataDisplayOpenedAtom } from "../../atoms/dataDisplay";
import { SegmentItem } from "./SegmentItem";

export function SegmentList() {
  const [selectedSegment, setSelectedSegment] = useAtom(selectedSegmentAtom);
  const setDataDisplayOpened = useSetAtom(dataDisplayOpenedAtom);

  const handleSegmentClick = (segmentId: string) => {
    setSelectedSegment(segmentId);
    setDataDisplayOpened(true);
  };

  return (
    <NavLink
      href="#required-for-focus"
      label="Tehtaankatu 1-40"
      description="Kaivuilmoitus"
      rightSection={<ChevronRight size={16} />}
      childrenOffset={0}
      defaultOpened
    >
      {Array(60)
        .fill(0)
        .map((_, index) => (
          <SegmentItem
            key={index}
            segmentId={`1195756141337706496${index + 1}`}
            segmentLabel={`IDEA Segment ${index + 1}`}
            isSelected={selectedSegment === `1195756141337706496${index + 1}`}
            onClick={() => handleSegmentClick(`1195756141337706496${index + 1}`)}
          />
        ))}
    </NavLink>
  );
}


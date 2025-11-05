import { NavLink } from "@mantine/core";
import { ChevronRight } from "lucide-react";
import { useNavigate, useSearch } from '@tanstack/react-router'
import { SegmentItem } from "./SegmentItem";

export function SegmentList() {
  const navigate = useNavigate({ from: '/' })
  const { selectedSegment } = useSearch({ from: '/' })

  const handleSegmentClick = (segmentId: string) => {
    navigate({ search: (prev) => ({ ...prev, selectedSegment: segmentId, dataPanelOpen: true }), replace: true })
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


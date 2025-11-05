
import { useNavigate, useSearch } from '@tanstack/react-router'
import { SegmentItem } from "./SegmentItem";
import { useQuery } from '@tanstack/react-query';
import { getListLandLeaseQueryOptions, landLeaseTypes } from '../../queries/land-leases';


export function SegmentList() {
  const navigate = useNavigate({ from: '/' })
  const { selectedSegment } = useSearch({ from: '/' })
  const { isPending, data, error } = useQuery(
    getListLandLeaseQueryOptions({ landLeaseType: landLeaseTypes.EXCAVATION_NOTICE_AREA }),
  );

  const handleSegmentClick = (segmentId: string) => {
    navigate({ search: (prev) => ({ ...prev, selectedSegment: segmentId, dataPanelOpen: true }), replace: true })
  };

  return (
    <>
      {isPending && <div style={{ padding: 8 }}>Ladataan…</div>}
      {error && (
        <div style={{ padding: 8, color: "#C92A2A" }}>
          Virhe: {error.message}
        </div>
      )}
      {data?.features.map((feature) => {   
        const id = String(feature.id);
        const label = (feature.properties?.osoite || "Kaivuilmoitus").trim();
        return (
          <SegmentItem
            key={id}
            segmentId={id}
            segmentLabel={label}
            isSelected={selectedSegment === id}
            onClick={() => handleSegmentClick(id)}
          />
        );
      })}
    </>
  );
}


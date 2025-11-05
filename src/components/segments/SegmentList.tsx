
import { useNavigate, useSearch } from '@tanstack/react-router'
import { SegmentItem } from "./SegmentItem";
import { useAtomValue } from "jotai";
import { disruptionsAtom } from "../../atoms/disruptions";

export function SegmentList() {
  const navigate = useNavigate({ from: '/' })
  const { selectedSegment } = useSearch({ from: '/' })
  const { kaivuilmoitukset, loading, error } = useAtomValue(disruptionsAtom);

  const handleSegmentClick = (segmentId: string) => {
    navigate({ search: (p) => ({ ...p, selectedSegment: segmentId, dataPanelOpen: true }), replace: true })
    console.log('segmentId', segmentId);
    console.log('selectedSegment', selectedSegment);
  };

  return (
    <>
      {loading && <div style={{ padding: 8 }}>Ladataan…</div>}
      {error && (
        <div style={{ padding: 8, color: "#C92A2A" }}>
          Virhe: {error.message}
        </div>
      )}
      {kaivuilmoitukset?.features.map((f) => {   
        const properties = f.properties as { hakemustunnus?: string; osoite?: string };
        const id = String(f.id ?? properties.hakemustunnus);
        const label = (properties.osoite || "Kaivuilmoitus").trim();
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


// Types for src/data/master_segment_history.json
// Example entry shape:
// {
//   "1195474666508615680": {
//     "current_geometry": { "type": "LineString", "coordinates": [[lng, lat], ...] },
//     "current_hash": "hex...",
//     "date_added": "YYYY-MM-DDTHH:mm:ss",
//     "history": []
//   },
//   ...
// }

export type LineStringGeometry = {
  type: "LineString";
  coordinates: [number, number][];
};

export interface MasterSegmentEntry {
  current_geometry: LineStringGeometry;
  current_hash: string;
  date_added: string;
  history: unknown[];
}

export type MasterSegmentsById = Record<string, MasterSegmentEntry>;



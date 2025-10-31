import { atom } from "jotai";

/**
 * Boolean for data display panel open/closed state
 * Shared across SegmentList (to open panel on segment click) and DataDisplayPanel
 */
export const dataDisplayOpenedAtom = atom<boolean>(false);


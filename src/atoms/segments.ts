import { atom } from "jotai";

/**
 * Currently selected IDEA segment
 * Shared across Sidebar (SegmentList) and DataDisplay components
 */
export const selectedSegmentAtom = atom<string | null>("");


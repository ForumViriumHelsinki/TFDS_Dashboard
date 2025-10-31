import { atom } from "jotai";

/**
 * Selected data sources from checkbox group in Header
 * (Aluevuokraukset, Kaivuilmoitukset, Ilmanlaatu)
 */
export const selectedDataSourcesAtom = atom<string[]>([]);
import { FAMILIES } from '../sections/catalog.js';
import { TRANSFER_FAMILIES } from '../transfer/index.js';
export const PRACTICE_FAMILIES = Object.fromEntries(Object.entries(FAMILIES).map(([id, families]) =>
  [id, [...families, ...(TRANSFER_FAMILIES[id] || []).map(({id, title, skill, levels}) => ({id,title,skill,levels}))]]));
export const practiceFamilyTitle = (section, family) => PRACTICE_FAMILIES[section]?.find((f) => f.id === family)?.title || family;

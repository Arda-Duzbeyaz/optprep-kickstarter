import { FAMILIES } from '../sections/catalog.js';
import { scenarioCatalog } from '../scenarios/catalog.js';
import { TRANSFER_FAMILIES } from '../transfer/index.js';
export const PRACTICE_FAMILIES = Object.fromEntries(Object.entries(FAMILIES).map(([id, families]) =>
  [id, [...families, ...(TRANSFER_FAMILIES[id] || []).map(({id, title, skill, levels}) => ({id,title,skill,levels})), ...(scenarioCatalog[id] ? [scenarioCatalog[id]] : [])]]));
export const practiceFamilyTitle = (section, family) => PRACTICE_FAMILIES[section]?.find((f) => f.id === family)?.title || family;

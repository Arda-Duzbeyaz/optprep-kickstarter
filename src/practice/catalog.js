import { FAMILIES } from '../sections/catalog.js';
import { modelCatalog } from '../scenarios/composite/catalog.js';
import { sequenceMeta } from '../scenarios/composite/sequences.js';
import { scenarioCatalog } from '../scenarios/catalog.js';
import { TRANSFER_FAMILIES } from '../transfer/index.js';
export const PRACTICE_FAMILIES = Object.fromEntries(Object.entries(FAMILIES).map(([id, families]) =>
  [id, [...families, ...(TRANSFER_FAMILIES[id] || []).map(({id, title, skill, levels}) => ({id,title,skill,levels})), ...(modelCatalog[id] || []), ...(id==="nl"?[sequenceMeta]:[]), ...(scenarioCatalog[id] ? [scenarioCatalog[id]] : [])]]));
export const practiceFamilyTitle = (section, family) => PRACTICE_FAMILIES[section]?.find((f) => f.id === family)?.title || family;

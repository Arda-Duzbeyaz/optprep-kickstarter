// One learning/practice library. Exam registries and fixed papers stay separate.
import { SECTION_MODULES } from '../sections/index.js';
import { TRANSFER_FAMILIES } from '../transfer/index.js';
export const PRACTICE_MODULES = Object.fromEntries(Object.entries(SECTION_MODULES).map(([id, section]) =>
  [id, { ...section, families: [...section.families, ...(TRANSFER_FAMILIES[id] || [])] }]));

import information from './families/information-protocols.js';
import shared from './families/shared-source.js';
import selection from './families/selection-weights.js';
import rates from './families/rates-weights.js';
// Deliberately separate from assessment generators and numbered libraries.
export const TRANSFER_FAMILIES = { bto: [information, shared], nl: [], ll: [selection], iv: [rates], ob: [] };
export const EXTRA_FAMILIES = Object.values(TRANSFER_FAMILIES).flat();

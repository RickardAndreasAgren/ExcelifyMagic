
import loadAll from './exelifyapi.js';
import loadPioneerMeta from './excelifyapi.js';

export function pioneerFromAll() {
  const allSets = loadAll();
  const pMeta = loadPioneerMeta();

}

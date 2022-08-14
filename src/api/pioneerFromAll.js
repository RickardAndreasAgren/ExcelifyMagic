
import {loadAll, loadPioneerMeta} from './excelifyapi.js';

export default function pioneerFromAll() {
  const allSets = loadAll();
  const pMeta = loadPioneerMeta();

  Object.keys(pMeta.data).forEach(setName => {
    pMeta.data[setName]['cards'] = allSets.data[setName].cards;
  });
  return pMeta;
}

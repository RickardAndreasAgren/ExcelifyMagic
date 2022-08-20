

import allsets from '../data/allsets.json';
import pioneermeta from '../data/pioneermeta.json';

export default function pioneerFromAll() {
  var pioneer = {data: {}};
  Object.keys(pioneermeta.data).forEach(setName => {
    pioneer.data[setName]['cards'] = allsets.data[setName].cards;
  });
  return pMeta;
}

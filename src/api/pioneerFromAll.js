



export default function pioneerFromAll() {

  Object.keys(pMeta.data).forEach(setName => {
    pMeta.data[setName]['cards'] = allSets.data[setName].cards;
  });
  return pMeta;
}

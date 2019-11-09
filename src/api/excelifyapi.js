
import pioneer from '../data/pioneerprints.json';

export async function buildSelector() {
  return 0;
}

export async function setOptions() {
  let pObject = pioneer;
  let setsList = [];
  for (let set in pObject) {
    console.log(set)
    setsList.push({ type: pObject[set].code, name: pObject[set].name });
  }
  setsList.sort();
  return setsList;
}

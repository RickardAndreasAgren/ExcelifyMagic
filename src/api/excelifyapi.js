import pioneer from '../data/pioneerprints.json';
import Sortkeeper from './sortkeeper.js';
import {logui} from '../util/printui.js';

var primaryKeeper;
var secondaryKeeper;

export async function initKeepers() {
  primaryKeeper = new Sortkeeper('primarysort');
  secondaryKeeper = new Sortkeeper('secondarysort');
  primaryKeeper.setOverride(secondaryKeeper.overrideOption);
  secondaryKeeper.setOverride(primaryKeeper.overrideOption);
}

export async function buildSelector() {
  return 0;
}

export async function setOptions() {
  let pObject = pioneer;
  let setsList = [];
  for (let set in pObject) {
    console.log(set);
    setsList.push({ type: pObject[set].code, name: pObject[set].name });
  }
  setsList.sort();
  return setsList;
}

export async function sortOptionsUpdate(option, add) {
  if (add) {
    primaryKeeper.addOption(option);
    secondaryKeeper.addOption(option);
  } else {
    primaryKeeper.removeOption(option);
    secondaryKeeper.removeOption(option);
  }
  return 0;
}

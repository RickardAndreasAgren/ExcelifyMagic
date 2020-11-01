
import pioneer from '../data/pioneercards.json';
import Sortkeeper from './sortkeeper.js';
import {logui} from '../util/printui.js';
import optionFromAPI from './optionAPI.js';

var primaryKeeper;
var secondaryKeeper;

export async function initKeepers() {
  primaryKeeper = new Sortkeeper('primarysort','psortactive');
  secondaryKeeper = new Sortkeeper('secondarysort','ssortactive');
  primaryKeeper.setOverride(secondaryKeeper.overrideOption);
  secondaryKeeper.setOverride(primaryKeeper.overrideOption);
}

export async function getSetData(set) {
  logui(typeof pioneer);
  logui(Array.isArray(pioneer));
  return pioneer[set];
}

export async function setOptions() {
  let pObject = pioneer;
  let setsList = [];
  for (let set in pObject) {
    // Logui(set);
    setsList.push({ type: pObject[set].code, name: pObject[set].name });
  }
  setsList.sort();
  return setsList;
}

export async function sortOptionsUpdate(option, add) {
  if (add) {
    primaryKeeper.addOption(option);
    secondaryKeeper.addOption(option);
    if (primaryKeeper.getSelected() === secondaryKeeper.getSelected()) {
      primaryKeeper.triggerOnChange(option);
    }
  } else {
    try {
      primaryKeeper.removeOption(option);
      secondaryKeeper.removeOption(option);
    } catch (error) {
      printui(error.message + ' Stack: ' + error.stack)
    }
  }
  return 0;
}
/*
  Cbname: 'name',
  cbcolor: 'colors',
  cbcmc: 'convertedManaCost',
  cbtype: 'type',
  cbsubtype: 'subtypes',

  argument: collector#
  composites: stats, supertype

  // Filter type as per MY standard
  //  -- add legendary, add sibling type to artirfact & enchantment
  // stats as Power & Toughness OR Loyalty
  // rarity?
  // insert set
  //     add "Count" field
  // Legendary == supertype
*/
export async function setupCard(cardinfo, useOptions, setname) {
  let cardAsArray = [];

  return cardAsArray;
}

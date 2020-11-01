import pioneer from '../data/pioneercards.json';
//Import allcards from '../data/allsets.json';
let allcards = {};
import Sortkeeper from './sortkeeper.js';
import { logui } from '../util/printui.js';
import optionFromAPI from './optionAPI.js';

var primaryKeeper;
var secondaryKeeper;

export async function initKeepers() {
  primaryKeeper = new Sortkeeper('primarysort', 'psortactive');
  secondaryKeeper = new Sortkeeper('secondarysort', 'ssortactive');
  primaryKeeper.setOverride(secondaryKeeper.overrideOption);
  secondaryKeeper.setOverride(primaryKeeper.overrideOption);
}

export async function getSetData(set) {
  logui(typeof format);
  if (format == 'pioneer') {
    logui(Array.isArray(pioneer));
    return pioneer.data[set];
  } else if (format == 'all') {
    logui(Array.isArray(allcards));
    return allcards.data[set];
  }
}

export async function setOptions(format) {
  var pObject = {};
  if (format == 'pioneer') {
    pObject = pioneer.data;
  } else if (format == 'all') {
    pObject = allcards.data;
  }
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
      printui(error.message + ' Stack: ' + error.stack);
    }
  }
  return 0;
}

function getColour(cardinfo) {
  let colour = '';
  for (let i = 0;i < cardinfo.colorIdentity.length;i++) {
    colour += cardinfo.colorIdentity[i];
  }
  return colour;
};

function mainType(fulltype) {
  let splitType = fulltype.split('-');
  return splitType[0].slice(0,-1);
}

function getType(cardinfo) {
  let name = '';
  if (cardinfo.supertypes.includes('Legendary')) {
    name = 'Legendary ' + mainType(cardinfo.type);
  } else {
    name = mainType(cardinfo.type);
  }
  return name;
};

function getStats(cardinfo) {
  let stats = '';
  if (cardinfo.types.includes('Planeswalker')) {
    stats = cardinfo.loyalty;
  } else if (cardinfo.types.includes('Creature')) {
    stats = cardinfo.power + '/' + cardinfo.toughness;
  }
  return stats
};

const CARDOPTIONS = {
  cbname: (cardinfo) => {return cardinfo.name},
  cbnumber: (cardinfo) => {return cardinfo.number},
  cbcolor: getColour,
  cbcmc: (cardinfo) => {return cardinfo.convertedManaCost},
  cbtype: getType,
  cbsubtype: (cardinfo) => {return cardinfo.subtypes},
  cbstats: getStats,
};

export async function setupCard(cardinfo, useOptions, setname) {
  let cardAsArray = [];
  for (let opt = 0;opt < useOptions.length; opt++) {
    cardAsArray.push(CARDOPTIONS[opt](cardinfo));
  }
  cardAsArray.push(setname);
  cardAsArray.push('0');
  return cardAsArray;
}

import pioneer from '../data/pioneercards.json';
//Import allcards from '../data/allsets.json';
let allcards = {};
import Sortkeeper from './sortkeeper.js';
import { logui } from '../util/printui.js';
import optionFromAPI from './optionAPI.js';

const preType = ['Legendary','Artifact', 'Enchantment'];

var primaryKeeper;
var secondaryKeeper;

export async function initKeepers() {
  primaryKeeper = new Sortkeeper('primarysort', 'psortactive');
  secondaryKeeper = new Sortkeeper('secondarysort', 'ssortactive');
  primaryKeeper.setOverride(secondaryKeeper.overrideOption);
  secondaryKeeper.setOverride(primaryKeeper.overrideOption);
}

export function getSetData(set, format) {
  if (format == 'pioneer') {
    return pioneer.data[set];
  } else if (format == 'all') {
    return allcards.data[set];
  }
}

export function getSetName(set, format) {
  if (format == 'pioneer') {
    return pioneer.data[set].name;
  } else if (format == 'all') {
    return allcards.data[set].name;
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
    setsList.push({ releaseDate: pObject[set].releaseDate,
      type: pObject[set].code, name: pObject[set].name, });
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
  let regex = /[A-Z]|[a-z]/;
  let colour = '';
  if (!cardinfo.manaCost) {
    return 'C';
  }
  let cArray = cardinfo.manaCost.match(regex);
  if (cArray && cArray.length > 0) {
    cArray.forEach(element => colour += element);
  } else {
    colour = 'C';
  }

  return colour;
};

function getType(cardinfo) {
  let fulltype = cardinfo.type;
  let splitType = fulltype.split(' ');
  if (splitType.length > 1) {
    if (preType.includes(splitType[0])) {
      if (splitType[1] == '—') {
        splitType.splice(1,1);
      }
      return splitType[0] + ' ' + splitType[1];
    } else {
      return splitType[0];
    }
  } else {
    return fulltype;
  }
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

export function setupCard(cardinfo, useOptions, setname) {
  return new Promise((resolve, reject) => {
    let cardAsArray = [];
    for (let opt = 0;opt < useOptions.length; opt++) {
      cardAsArray.push(CARDOPTIONS[useOptions[opt]](cardinfo));
    }
    cardAsArray.push(setname);
    cardAsArray.push('0');
    resolve(cardAsArray);
  });
}

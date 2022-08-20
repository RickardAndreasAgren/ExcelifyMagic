let allcards = {};
import Sortkeeper from './sortkeeper.js';
import { logui } from '../util/printui.js';
import pioneerFromAll from './pioneerFromAll.js'
var allsets = null;
var pioneer = null;

const preType = ['Legendary','Artifact', 'Enchantment'];

var primaryKeeper;
var secondaryKeeper;

export async function loadAll() {
  /*
  try {
    const loaded = await import('../data/allsets.json')
      .then(({default: allsets}) => {return allsets});
    return loaded;
  } catch (e) {
    logui(e.message);
    throw new Error('Import failed');
  }*/
}

export async function loadPioneerMeta() {
  /*
  try {
    const loaded = await require('../data/pioneermeta.json');
    return loaded;
  } catch (e) {
    logui(e.message);
    throw new Error('Import failed');
  }
  */
}

export async function loadPioneer() {
  /*
  try {
    const loaded = await require('../data/pioneercards.json');
    return loaded;
  } catch (e) {
    logui(e.message);
    throw new Error('Import failed');
  }
  */
}

export async function checkPioneerJson() {
  let pioneerCards, pioneerMeta;

  try {
    pioneerCards = await loadPioneer();
    pioneerMeta = await loadPioneerMeta();
  } catch (e) {
    console.log('No pioneer data available');
  }

  if(!!pioneerMeta.data || !!pioneerCards.data) {
    throw new Error('No meta data.');
  }
  return new Promise((resolve) => {
    let miss = false;
    Object.keys(pioneerCards.data).forEach(element => {
      let hit = pioneerMeta.data.find(metaset => {
        return metaset.code == element.code
      });
      if(!hit) {
        console.log('Missing set');
        miss = element.code;
      }
    });
    if(miss) {
      resolve({error: {message: `${miss} is missing`}});
    } else {
      resolve(pioneerCards);
    }
  });
}

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

export async function getWorkbooknames() {
  return await Excel.run(async context => {
    logui("Getting names");
    await context.workbook.names.load('name, type');
    await context.sync()
    const nameCollection = await context.workbook.names.items;
    logui(`Got collection of names sized ${nameCollection.length}`);
    var rangeList = [];
    nameCollection.forEach(nameItem => {
      if(nameItem.type == "Range") {
        rangeList.push(nameItem.name);
      }
    });
    return rangeList;
  })
  .catch(error => {
    console.log(error);
    logui(error.message);
  });
}

function scrubName(text) {
  return text.replace(/[^\w\s]/gi, '')
}

export function getSetName(set, format) {
  let name = '';
  if (format == 'pioneer') {
    name = pioneer.data[set].name;
  } else if (format == 'all') {
    name = allcards.data[set].name;
  }

  logui(name);
  return scrubName(name);
}

export async function setOptions(format) {
  var pObject = {};
  const pioneerValidated = await checkPioneerJson();

  if(pioneerValidated['error']) {
    pioneer = await pioneerFromAll();
  } else {
    pioneer = pioneerValidated;
  }

  if (format == 'pioneer') {
    pObject = pioneer.data;
  } else if (format == 'all') {
    pObject = allcards.data;
  }
  let setsList = [];
  for (let set in pObject) {
    setsList.push({ releaseDate: pObject[set].releaseDate,
      type: pObject[set].code, name: pObject[set].name });
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
  let regex = /[A-Z]|[a-z]/g;
  let colour = '';
  if (!cardinfo.manaCost) {
    return 'C';
  }
  let cArray = cardinfo.manaCost.match(regex);
  if (cArray && cArray.length > 0) {
    cArray.forEach(element => {
      if ((colour.length == 0) || (colour.slice(-1) !== element)) {
        colour += element;
      }
    });
  } else {
    colour = 'C';
  }

  return colour;
};

function getConvertedManaCost(cardinfo) {
  return cardinfo.manaValue;
}

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

function getRarity(cardinfo) {
  return cardinfo.rarity[0].toUpperCase() + cardinfo.rarity.substring(1);
}

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
  cbcmc: getConvertedManaCost,
  cbtype: getType,
  cbsubtype: (cardinfo) => {return cardinfo.subtypes},
  cbrarity: getRarity,
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

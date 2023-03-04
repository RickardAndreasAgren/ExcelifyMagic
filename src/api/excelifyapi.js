import Sortkeeper from "./sortkeeper.js";
import { logui } from "../util/printui.js";
//import allsets from "../data/allsets.json";
import pioneermeta from "../data/pioneermeta.json";
import pioneersets from "../data/pioneercards.json";
import pioneercustom from "../data/pioneercustom.json";
const allsets = {};

/* global Excel */

var pioneer = {};

const preType = ["Legendary", "Artifact", "Enchantment"];

var primaryKeeper;
var secondaryKeeper;

export async function checkPioneerJson() {
  if (!pioneermeta.data || !pioneersets) {
    throw new Error("No meta data.");
  }
  return new Promise((resolve) => {
    let miss = false;
    try {
      Object.keys(pioneersets).forEach((element) => {
        let hit = pioneermeta.data.find((metaset) => {
          return metaset.code == element.code;
        });
        if (!hit) {
          logui("Missing set");
          miss = element.code;
        }
      });
    } catch (error) {
      logui(error);
      miss = true;
    }

    if (miss) {
      pioneer = pioneercustom;
      resolve({
        error: { message: `${miss} is missing, used custom pioneer data` },
      });
    } else {
      pioneer = { data: pioneersets };
      resolve(false);
    }
  });
}

export async function initKeepers() {
  primaryKeeper = new Sortkeeper("primarysort", "psortactive");
  secondaryKeeper = new Sortkeeper("secondarysort", "ssortactive");
  primaryKeeper.setOverride(secondaryKeeper.overrideOption);
  secondaryKeeper.setOverride(primaryKeeper.overrideOption);
}

export function getSetData(set, format) {
  if (format == "pioneer") {
    return pioneer.data[set];
  } else if (format == "all") {
    return allsets.data[set];
  }
}

export async function getWorkbooknames() {
  return await Excel.run(async (context) => {
    logui("Getting names");
    await context.workbook.names.load("name, type");
    await context.sync();
    const nameCollection = await context.workbook.names.items;
    logui(`Got collection of names sized ${nameCollection.length}`);
    var rangeList = [];
    nameCollection.forEach((nameItem) => {
      if (nameItem.type == "Range") {
        rangeList.push(nameItem.name);
      }
    });
    return rangeList;
  }).catch((error) => {
    logui(error);
    logui(error.message);
  });
}

function scrubName(text) {
  return text.replace(/[^\w\s]/gi, "");
}

export function getSetName(set, format) {
  let name = "";
  if (format == "pioneer") {
    name = pioneer.data[set].name;
  } else if (format == "all") {
    name = allsets.data[set].name;
  }
  logui(name);
  return scrubName(name);
}

export async function setOptions(format) {
  var pObject = {};
  logui("Checking pioneer sources");
  await checkPioneerJson();

  if (format == "pioneer") {
    pObject = pioneer.data;
  } else if (format == "all") {
    pObject = allsets.data;
  }
  let setsList = [];
  for (let set in pObject) {
    setsList.push({
      releaseDate: pObject[set].releaseDate,
      type: pObject[set].code,
      name: pObject[set].name,
    });
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
      logui(error.message + " Stack: " + error.stack);
    }
  }
  return 0;
}

export function normalizeColour(colour) {
  const lt = colour.length;
  const combos = ["BG", "BR", "GR", "GU", "RU", "RW", "UW", "UB", "WB", "WG"];
  const threebos = [
    "BGR",
    "BGU",
    "GRU",
    "GRW",
    "RUW",
    "RUB",
    "UWB",
    "UWG",
    "WBG",
    "WBR",
  ];

  let regex = new RegExp(`[${colour}]{${lt}}`, "g");

  if (lt == 2) {
    return combos.find((element) => element.match(regex));
  } else if (lt == 3) {
    return threebos.find((element) => element.match(regex));
  }
}

function getColour(cardinfo) {
  const bside = cardinfo.bside ? " // " + getColour(cardinfo.bside) : "";
  let regex = /(?=[^X])[A-Z]\/*[A-Z]*|[a-z]\/*[a-z]*/g;
  let colour = "";
  if (!cardinfo.manaCost) {
    return "C" + bside;
  }
  let cArray = cardinfo.manaCost.match(regex);
  if (cArray && cArray.length > 0) {
    cArray.forEach((element) => {
      colour.length > 0 ? (colour += "|") : null;
      let toAdd =
        element.length > 1
          ? normalizeColour(`${element.replace("/", "")}`)
          : element;
      colour += `${toAdd}`;
    });
    if (colour[-1] == "|") {
      colour.splice(-1, 1);
    }
  } else {
    colour = "C";
  }

  return colour + bside;
}

function getConvertedManaCost(cardinfo) {
  const bside = cardinfo.bside
    ? " // " + getConvertedManaCost(cardinfo.bside)
    : "";
  let returner = cardinfo.faceConvertedManaCost
    ? cardinfo.faceConvertedManaCost
    : cardinfo.manaValue;
  // multi X?
  const regex = /[X]/g;
  const hits = cardinfo.manaCost ? cardinfo.manaCost.match(regex) : false;
  if (!!hits && hits.length > 0) {
    var xes = hits.length;
    while (xes > 0) {
      returner = returner + "X";
      xes--;
    }
  }
  return returner + bside;
}

function getType(cardinfo) {
  const bside = cardinfo.bside ? " // " + getType(cardinfo.bside) : "";
  let fulltype = cardinfo.type;
  let splitType = fulltype.split(" ");
  if (splitType.length > 1) {
    if (preType.includes(splitType[0])) {
      if (splitType[1] == "—") {
        splitType.splice(1, 1);
      }
      return splitType[0] + " " + splitType[1] + bside;
    } else {
      return splitType[0] + bside;
    }
  } else {
    return fulltype + bside;
  }
}

function getRarity(cardinfo) {
  const bside = cardinfo.bside ? " // " + getRarity(cardinfo.bside) : "";
  return (
    cardinfo.rarity[0].toUpperCase() + cardinfo.rarity.substring(1) + bside
  );
}

function getStats(cardinfo) {
  const bside = cardinfo.bside ? " // " + getStats(cardinfo.bside) : "";
  let stats = "";
  if (cardinfo.types.includes("Planeswalker")) {
    stats = cardinfo.loyalty;
  } else if (cardinfo.types.includes("Creature")) {
    stats = cardinfo.power + "/" + cardinfo.toughness;
  }
  return stats + bside;
}

function extractProp(prop, info) {
  if (!info.bside) {
    return info[prop];
  }
  if (prop === "name" && info.bside && info.bside.faceName && info.faceName) {
    return `${info["faceName"]} // ${info.bside["faceName"]}`;
  }
  if (info.bside) {
    return `${info[prop]} // ${info.bside[prop]}`;
  }
}

const CARDOPTIONS = {
  cbname: (cardinfo) => {
    return extractProp("name", cardinfo);
  },
  cbnumber: (cardinfo) => {
    return extractProp("number", cardinfo);
  },
  cbcolor: getColour,
  cbcmc: getConvertedManaCost,
  cbtype: getType,
  cbsubtype: (cardinfo) => {
    return extractProp("subtypes", cardinfo);
  },
  cbrarity: getRarity,
  cbstats: getStats,
};

export function setupCard(cardinfo, useOptions, setname, bside) {
  // colour ?
  cardinfo["bside"] = bside;
  return new Promise((resolve) => {
    let cardAsArray = [];
    for (let opt = 0; opt < useOptions.length; opt++) {
      cardAsArray.push(CARDOPTIONS[useOptions[opt]](cardinfo));
    }
    cardAsArray.push(setname);
    cardAsArray.push("0");
    resolve(cardAsArray);
  });
}

const BLOCKEDLAYOUTS = ["MELD"];

export function setupCardSet(cards, setData, setupArray) {
  var bsides = [];
  var cardsList = [];
  cards.forEach((card) => {
    if (!!card.side && card.side.toUpperCase() !== "A") {
      bsides.push(card);
      return;
    }
    if (!!card.layout && BLOCKEDLAYOUTS.contains(card.layout.toUpperCase())) {
      return;
    }
    cardsList.push(card);
  });
  cardsList.forEach((card) => {
    const bside = bsides.find((bcard) => bcard.uuid === card.otherFaceIds[0]);
    setupArray.push(setupCard(card, setData.props, setData.set.name, bside));
  });
  return setupArray;
}

import Sortkeeper from "./sortkeeper.js";
import { logui } from "../util/printui.js";
import { getTypeFromLayout } from "./models/models.js";
//import allsets from "../data/allsets.json";
import pioneermeta from "../data/pioneermeta.json";
import pioneersets from "../data/pioneercards.json";
import pioneercustom from "../data/pioneercustom.json";
const allsets = {};

/* global Excel */

var pioneer = {};

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
    if (!Object.keys(pioneer.data).includes(set)) {
      logui(`${set} missing in data.`);
    }
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

export async function getSelectedProps(selectedFields) {
  let activeProps = [];
  for (let i in selectedFields) {
    if (selectedFields[i]) {
      activeProps.push(i);
    }
  }
  return activeProps;
}

function getRarity(cardinfo) {
  const bside = cardinfo.bside ? "//" + getRarity(cardinfo.bside) : "";
  return (
    cardinfo.rarity[0].toUpperCase() + cardinfo.rarity.substring(1) + bside
  );
}

function extractProp(prop, info) {
  if (!info.bside) {
    return info[prop];
  }
  return `${info[prop]}//${info.bside[prop]}`;
}

const CARDOPTIONS = {
  cbname: (cardinfo) => {
    if (cardinfo.typeFormat) {
      // logui(`${cardinfo.typeFormat}`);
    } else {
      logui("===NO TYPEFORMAT===");
      logui(`${JSON.stringify(cardinfo)}`);
      logui("=========");
    }
    return cardinfo.typeFormat.formatName(cardinfo);
  },
  cbnumber: (cardinfo) => {
    return extractProp("number", cardinfo);
  },
  cbcolor: (cardinfo) => {
    return cardinfo.typeFormat.formatManaCost(cardinfo);
  },
  cbcmc: (cardinfo) => {
    return cardinfo.typeFormat.formatManaValue(cardinfo);
  },
  cbtype: (cardinfo) => {
    return cardinfo.typeFormat.formatType(cardinfo);
  },
  cbsubtype: (cardinfo) => {
    return extractProp("subtypes", cardinfo);
  },
  cbrarity: getRarity,
  cbstats: (cardinfo) => {
    return cardinfo.typeFormat.formatPt(cardinfo);
  },
};

export function setupCard(cardinfo, useOptions, setname, bside) {
  cardinfo["bside"] = bside;
  return new Promise((resolve) => {
    let cardAsArray = [];
    cardinfo.typeFormat = getTypeFromLayout(cardinfo.layout, cardinfo);
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
  logui("Filtering out b-sides.");

  cards.forEach((card) => {
    if (
      !!card.side &&
      card.side.toUpperCase() !== "A" &&
      !BLOCKEDLAYOUTS.includes(card.layout.toUpperCase())
    ) {
      logui(`B-saving ${card.name}`);
      logui(`${card}`);
      bsides.push(card);
      return;
    }
    
    cardsList.push(card);
  });

  logui("Adapting card data for excelifymagic.");
  logui(`using ${setData.props}`);
  cardsList.forEach((card) => {
    const bside = bsides.find((bcard) => {
      if (
        !Object.keys(bcard).includes("otherFaceIds") ||
        bcard.otherFaceIds.length < 1
      ) {
        return false;
      }
      const faceId =
        card.otherFaceIds && card.otherFaceIds.length > 0
          ? card.otherFaceIds[0]
          : -1;
      if (faceId === bcard.uuid) {
        logui(`Matching ${bcard.name} with ${card.name}`);
      }
      return faceId === bcard.uuid;
    });
    setupArray.push(setupCard(card, setData.props, setData.set.name, bside));
  });
  logui("setupCardSet promises complete");
  return setupArray;
}

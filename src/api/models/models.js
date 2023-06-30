const cmcEnum = {
  1: "_a_", // regular
  2: "_a_ + _b_", // combinable cost value; Fuse
  3: "_a_ // _b_", // alternative cost or CMC
  4: "_a_ // _face_", // alternative cost or CMC from other face
};

const ptEnum = {
  1: "_p/t_", // regular
  2: "_p/t_ _q/u_", // regular, alternative cast/transformed
  3: "_p/t_ _q/u_ _r/v_", // regular, leveled, leveled
};

const sideEnum = {
  1: "_a_", // regular naming
  2: "_a_ // _b_", // regular & alternative/flipped naming
  3: "acbc", // regular & transformed meld naming
};

export class typeFormat {
  typeFormat(
    name,
    manaCostFormat = cmcEnum[1],
    ptFormat = ptEnum[1],
    bside = false,
    sideFormat = sideEnum[1],
    blockedSide = "0"
  ) {
    this.name = name;
    this.manaCostFormat = manaCostFormat;
    this.ptFormat = ptFormat;
    this.bside = bside;
    this.sideFormat = sideFormat;
    this.blockedSide = blockedSide;
  }

  setBlockedSide(side) {
    this.blockedSide = side;
  }

  formatManaCost(card) {
    return getConvertedManaCost(card, this.manaCostFormat);
  }

  formatPt(card) {
    return getStats(card, this.ptFormat);
  }

  formatName(card) {
    return getName(card, this.sideFormat);
  }

  formatType(card) {
    return getType(card);
  }
}

function getSplitPt(card) {
  let pt = 0;
  if (
    -1 <
    card.types.findIndex((type) => {
      type.ToLower() === "creature" || type.ToLower() === "planeswalker";
    })
  ) {
    pt++;
  }
  if (
    -1 <
    card.bside.types.findIndex((type) => {
      type.ToLower() === "creature" || type.ToLower() === "planeswalker";
    })
  ) {
    pt++;
  }
  return pt === 2 ? ptEnum[2] : ptEnum[1];
}

const typeRegular = () => new typeFormat("normal");
const typeAdventure = () => new typeFormat("adventure");
const typeAftermath = () =>
  new typeFormat("aftermath", cmcEnum[3], undefined, true);

const typeClass = () => new typeFormat("class");
const typeFlip = () => new typeFormat("flip");
const typeFuse = (card) => {
  new typeFormat("fuse", cmcEnum[2], getSplitPt(card), true, sideEnum[2]);
};

const typeLeveler = () => new typeFormat("leveler", undefined, ptEnum[3]);
const typeMeld = () =>
  new typeFormat("meld", cmcEnum[4], ptEnum[2], true, sideEnum[3]);

const typePrototype = () => new typeFormat("prototype");
const typeSaga = () => new typeFormat("saga");
const typeSplit = (card) => {
  if (-1 < card.keywords.findIndex((k) => k.toLower() === "fuse")) {
    return typeFuse(card);
  }
  return new typeFormat(
    "split",
    cmcEnum[3],
    getSplitPt(card),
    true,
    sideEnum[2]
  );
};
const typeTransform = () => {
  new typeFormat("transform", cmcEnum[1], ptEnum[2], true, sideEnum[2]);
};

export const cardTypes = [
  { adventure: typeAdventure },
  { aftermath: typeAftermath },
  { class: typeClass },
  { flip: typeFlip },
  { fuse: typeFuse },
  { leveler: typeLeveler },
  { meld: typeMeld },
  { normal: typeRegular },
  { prototype: typePrototype },
  { saga: typeSaga },
  { split: typeSplit },
  { transform: typeTransform },
  { default: typeRegular },
];

export const getTypeFromLayout = (layout, card) => {
  if (Object.keys(cardTypes).includes(layout)) {
    return cardTypes[layout](card);
  }
  return cardTypes["default"]();
};

function getName(cardinfo, cardType) {
  if (cardType === sideEnum.side[2]) {
    return sideEnum.side[2]
      .replace("_a_", cardinfo["name"])
      .replace("_b_", cardinfo.bside["name"]);
  }
  if (cardType === sideEnum.side[3]) {
    return `${cardinfo["faceName"]}//${cardinfo.bside["faceName"]}`;
  }
  return cardinfo["name"];
}

function getConvertedManaCost(cardinfo, cardType) {
  const bside = cardinfo.bside
    ? getConvertedManaCost(cardinfo.bside, false)
    : "";
  const xses = (() => {
    let returner = "";
    const regex = /[X]/g;
    const hits = cardinfo.manaCost ? cardinfo.manaCost.match(regex) : false;
    if (!!hits && hits.length > 0) {
      var xes = hits.length;
      while (xes > 0) {
        returner = returner + "X";
        xes--;
      }
    }
  })();

  if (cardType === cmcEnum[2]) {
    return cmcEnum[2]
      .replace("_a_", xses + cardinfo["manaValue"])
      .replace("_b_", bside);
  }
  if (cardType === cmcEnum[3]) {
    return cmcEnum[3]
      .replace("_a_", xses + cardinfo["manaValue"])
      .replace("_b_", bside);
  }
  if (cardType === cmcEnum[4]) {
    return cmcEnum[4]
      .replace("_a_", xses + cardinfo["manaValue"])
      .replace("_face_", bside);
  }
  return cardinfo["manaValue"];
}

function getStats(cardinfo, cardType) {
  const bside = cardinfo.bside ? getStats(cardinfo.bside, false) : "";
  let stats = "";
  if (cardinfo.types.includes("Planeswalker")) {
    stats = cardinfo.loyalty;
  } else if (cardinfo.types.includes("Creature")) {
    stats = cardinfo.power + "/" + cardinfo.toughness;
  }

  if (cardType === ptEnum[2]) {
    return ptEnum[2].replace("_p/t_", stats).replace("_r/u_", bside);
  }

  if (cardType === ptEnum[3]) {
    const TODOleveled = stats;
    const TODOleveled2 = stats;
    return ptEnum[3]
      .replace("_p/t_", stats)
      .replace("_q/u_", TODOleveled)
      .replace("_r/v_", TODOleveled2);
  }
  return stats;
}

function getType(cardinfo) {
  const bside = cardinfo.bside ? "//" + getType(cardinfo.bside) : "";

  const prefix = cardinfo.supertypes.includes("Legendary ")
    ? "Legendary"
    : cardinfo.supertypes.includes("Basic ")
    ? "Basic"
    : "";
  let fulltype = cardinfo.type;
  let splitType = fulltype.split(" ");
  if (splitType.length > 1) {
    if (preType.includes(splitType[0])) {
      if (splitType[1] == "—") {
        splitType.splice(1, 1);
      }
      return prefix + splitType[0] + " " + splitType[1] + bside;
    } else {
      return prefix + splitType[0] + bside;
    }
  } else {
    return prefix + fulltype + bside;
  }
}

export const preType = ["Legendary", "Artifact", "Enchantment"];

export const combos = [
  "BG",
  "BR",
  "GR",
  "GU",
  "RU",
  "RW",
  "UW",
  "UB",
  "WB",
  "WG",
];
export const threebos = [
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
export const fourbos = ["BGRU", "GRUW", "RUWB", "UWBG", "WBGR"];

export default {
  getTypeFromLayout,
  combos,
  threebos,
  fourbos,
};

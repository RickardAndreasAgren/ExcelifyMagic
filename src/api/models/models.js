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

export const modelEnums = {
  cmc: cmcEnum,
  pt: ptEnum,
  side: sideEnum,
};

const typeCreater = (
  name,
  manaCostFormat = cmcEnum[1],
  ptFormat = ptEnum[1],
  bside = false,
  sideFormat = sideEnum[1],
  blockedSide = "0"
) => {
  return {
    name: name,
    manaCostFormat: manaCostFormat,
    ptFormat: ptFormat,
    bside: bside,
    sideFormat: sideFormat,
    blockedSide: blockedSide,
  };
};

const typeRegular = typeCreater("normal");
const typeAdventure = typeCreater("adventure");
const typeAftermath = typeCreater("aftermath", cmcEnum[3]);
const typeClass = typeCreater("class");
const typeFlip = typeCreater("flip");
const typeLeveler = typeCreater("leveler", undefined, ptEnum[3]);
const typeMeld = typeCreater("meld", cmcEnum[4], ptEnum[2], true, sideEnum[3]);
const typePrototype = typeCreater("prototype");
const typeSaga = typeCreater("saga");
const typeSplit = typeCreater("split");
const typeTransform = typeCreater(
  "transform",
  cmcEnum[1],
  ptEnum[2],
  true,
  sideEnum[2]
);

export const cardTypes = [
  { adventure: typeAdventure },
  { aftermath: typeAftermath },
  { class: typeClass },
  { flip: typeFlip },
  { leveler: typeLeveler },
  { meld: typeMeld },
  { normal: typeRegular },
  { prototype: typePrototype },
  { saga: typeSaga },
  { split: typeSplit },
  { transform: typeTransform },
  { default: typeRegular },
];

export const getTypeFromLayout = (layout) => {
  if (Object.keys(cardTypes).includes(layout)) {
    return cardTypes[layout];
  }
  return cardTypes["default"];
};

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

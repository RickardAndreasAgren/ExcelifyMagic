const cmcEnum = {
  1: "1", // regular
  2: "1 + 1", // combinable cost value; Fuse
  3: "1 // 1", // alternative cost or CMC
  4: "1 // face", // alternative cost or CMC from other face
};

const ptEnum = {
  1: "p/t", // regular
  2: "p/t p/t", // regular, alternative cast/transformed
  3: "p/t p/t p/t", // regular, leveled, leveled
};

const sideEnum = {
  1: "1", // regular naming
  2: "a // b", // regular & alternative/flipped naming
  3: "acbc", // regular & transformed meld naming
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

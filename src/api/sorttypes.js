import { combos, threebos, fourbos } from "./models/models.js";
import { logui } from "../util/printui.js";

function standardSort(a, b, key) {
  if (a[key] < b[key]) {
    return -1;
  }
  if (a[key] > b[key]) {
    return 1;
  }
}

function colourSort(a, b, key) {
  const sA = a[key].split("|");
  const sB = b[key].split("|");
  const len = sA.length > sB.length ? sB.length : sA.length;

  for (let i = 0; i < len; i++) {
    let cA = sA[i];
    let cB = sB[i];
    const innerlen = cA.length > cB.length ? cB.length : cA.length;
    for (let k = 0; k < innerlen; k++) {
      let kA = cA[k];
      let kB = cB[k];

      if (kA < kB) {
        return -1;
      }
      if (kA > kB) {
        return 1;
      }
    }
    if (cA.length < cB.length) {
      return -1;
    }
    if (cA.length > cB.length) {
      return 1;
    }
    if (cA < cB) {
      return -1;
    }
    if (cA > cB) {
      return 1;
    }
  }
  if (sA.length < sB.length) {
    return -1;
  }
  if (sA.length > sB.length) {
    return 1;
  }
  return 0;
}

function selectSort(a, b, key, selector) {
  if (selector == "cbcolor") {
    return colourSort(a, b, key);
  } else {
    return standardSort(a, b, key);
  }
}

export const threeSort = function (
  a,
  b,
  pSort,
  sSort,
  expansionIndex,
  chosenSorts
) {
  if (a[expansionIndex] < b[expansionIndex]) {
    return -1;
  }
  if (a[expansionIndex] > b[expansionIndex]) {
    return 1;
  }

  if (pSort && !!a[pSort] && !!b[pSort]) {
    return selectSort(a, b, pSort, chosenSorts.p);
  }
  if (sSort && !!a[sSort] && !!b[sSort]) {
    return selectSort(a, b, sSort, chosenSorts.s);
  }
  return 0;
};

export default {
  threeSort,
};

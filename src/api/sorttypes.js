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

function isMono(colorArray) {
  if (colorArray.length == 1) return true;
  let first = colorArray[0];
  for (let m = 1; m < colorArray.length; m++) {
    if (first != colorArray[m]) {
      return false;
    }
  }
  return true;
}

function colourSort(a, b, key) {
  let print = false;
  if (false) { //a[key] === "R|R" || a[key] === "RR" || a[key] === "{R}{R}") {
    print = true;
    logui(`Sorting a ${a[0]} against b ${b[0]}`);
  }
  const sA = a[key].split("|");
  const sB = b[key].split("|");
  const aL = sA.length;
  const bL = sB.length;
  const len = aL > bL ? bL : aL;

  for (let i = 0; i < len; i++) {
    if (print) logui(`FOR-L ${i}`);
    let cA = sA[i];
    let cB = sB[i];

    if (i > 0) {
      if (sA[0] == cA && cB !== cA) {
        if (print) logui("sA[0] == cA && cB !== cA -1");
        return -1;
      }
      if (sB[0] == cB && cA !== cB) {
        if (print) logui("sB[0] == cB && cA !== cB 1");
        return 1;
      }
      if (cA.length < cB.length && cA[0] === cB[0]) {
        if (print) logui("cA.length < cB.length -1");
        return -1;
      }
      if (cA.length > cB.length && cA[0] === cB[0]) {
        if (print) logui("cA.length > cB.length 1");
        return 1;
      }
    }
    if (cA < cB) {
      if (print) logui("cA < cB -1");
      return -1;
    }
    if (cA > cB) {
      if (print) logui("cA > cB 1");
      return 1;
    }
  }

  if (aL < bL) {
    if (print) logui("aL < bL -1");
    return -1;
  }
  if (aL > bL) {
    if (print) logui("aL > bL 1");
    return 1;
  }
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
    // logui(`Running sorter ${pSort}`);
    // logui(`by selector ${chosenSorts.p}`);
    let moving = selectSort(a, b, pSort, chosenSorts.p);
    if (moving === -1 || moving === 1) return moving;
  }
  if (sSort && !!a[sSort] && !!b[sSort]) {
    // logui(`Running sorter ${sSort}`);
    // logui(`by selector ${chosenSorts.s}`);
    let moving = selectSort(a, b, sSort, chosenSorts.s);
    if (moving === -1 || moving === 1) return moving;
  }
  return 0;
};

export default {
  threeSort,
};

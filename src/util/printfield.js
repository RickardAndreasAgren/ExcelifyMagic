import { numberToLetters } from "./columnconverter.js";
import { logui } from "../util/printui.js";
import {
  prepareSet,
  getSortPriorities,
  buildSet,
  getSetCode,
} from "../taskpane/taskpane.js";
import { threeSort } from "../api/sorttypes.js";
import { getSetData } from "../api/excelifyapi.js";
import { normalizeColour } from "../api/models/models.js";

/* global Excel */
/* global document */

export async function printfield(twoDimArray, newSheet, format) {
  try {
    await Excel.run(async (context) => {
      // let headers = Object.assign({}, twoDimArray[0]);
      let arraySizeX = twoDimArray[0].length;
      let arraySizeY = twoDimArray.length;
      let yTarget = arraySizeY;
      let xTarget = await numberToLetters(arraySizeX - 1);
      let setlist = document.getElementById("setselector");
      var name = setlist[setlist.selectedIndex].text;

      var currentWorkbook = context.workbook;
      var currentWorksheet = context.workbook.worksheets.getActiveWorksheet();

      var range = currentWorksheet.getUsedRange();
      range.load("columnCount", "address");
      await context.sync();
      var rangeString = "";

      var selectedRange = context.workbook.getSelectedRange();
      selectedRange.load([
        "values",
        "columnIndex",
        "rowIndex",
        "columnCount",
        "rowCount",
      ]);

      await context.sync();
      let selectionValid = await validSelection(
        selectedRange,
        arraySizeX,
        arraySizeY
      );
      if (newSheet) {
        logui("Fresh sheet!");
        arraySizeX = twoDimArray[0].length;
        arraySizeY = twoDimArray.length;
        rangeString = "A1:" + xTarget + yTarget;
        logui(`Using rangestring ${rangeString}`);
        range = currentWorksheet.getRange(rangeString);
        range.load(["values", "columnCount"]);
        await context.sync();
        // =======================================================
        /*
        if selection
          use selection
        */
      } else if (selectionValid) {
        logui(`Using a valid range selection`);
        range = selectedRange;
        await clearRange(context, selectedRange);
        // =======================================================
        /*
            sort existing sheet range on expansion
            flag saveCounts
        */
      } else {
        logui("Not a valid selection, looking up things");
        // Log anything that moves
        let blocks = await blockSheet(context, name, arraySizeX, arraySizeY);
        logui(`Type of result from blockcheck ${typeof blocks}`);
        if (blocks && Object.keys(blocks).length > 1) {
          logui("Proceeding with blocksheet logic");
          const saveName = name;
          for (const [key, value] of Object.entries(blocks)) {
            if (key != saveName) {
              logui(`Preparing ${key}`);
              const regex = /(\s)/i;
              let safeKey = key.replace(regex, "_");
              // check against sheet name, set name when found
              logui(`Transformed key to ${safeKey}`);
              let checkSheets =
                context.workbook.worksheets.getItemOrNullObject(safeKey);
              checkSheets.load();
              await context.sync();
              if (checkSheets.isNullObject && !checkSheets.isNullObject) {
                logui("Activating sheet");
                checkSheets.load("name");
                await context.sync();
                name = checkSheets.name;
                checkSheets.activate();
                currentWorksheet = checkSheets;
              }
              // get other sets
              let setCode = getSetCode(key);
              logui(`By code ${setCode}`);
              let extraSet = await buildSet(setCode)
                .then((data) => {
                  if (data) logui(`${setCode} set built`);
                  let setData = getSetData(data.set, format);
                  return { set: setData, props: data.props };
                })
                .then((data) => {
                  logui(`Running prepareSet`);
                  return prepareSet(data);
                });
              logui(`Extending data array with ${extraSet.length} rows`);
              twoDimArray = twoDimArray.concat(extraSet);
              logui(`Now at ${twoDimArray.length} rows.`);
            }
          }
          // link up all sets
          // xTarget, yTarget

          logui("A");
          // =======================================================
          /*else
            populate from A1
          */
        } else {
          logui("Fallback to basic selection");
          var usedRange = currentWorksheet.getUsedRange();
          usedRange.load([
            "values",
            "columnIndex",
            "rowIndex",
            "columnCount",
            "rowCount",
          ]);
          await context.sync();
          let yTarget = usedRange.rowCount;
          let xTarget = await numberToLetters(usedRange.columnCount - 1);
          rangeString = "A1:" + xTarget + yTarget;
          range = currentWorksheet.getRange(rangeString);
        }
        logui("B");
        logui(rangeString);
        range.load([
          "values",
          "columnIndex",
          "rowIndex",
          "columnCount",
          "rowCount",
        ]);
        logui("Saving counts");
        await context.sync();
        twoDimArray = await saveCounts(context, range, twoDimArray, xTarget);
        logui("C");

        let yTarget = twoDimArray.length;
        let xTarget = await numberToLetters(twoDimArray[0].length - 1);
        rangeString = "A1:" + xTarget + yTarget;
        await clearRange(context, range);
        logui("F");
        await context.sync();
      }

      logui(`Using rangestring ${rangeString}`);
      range = currentWorksheet.getRange(rangeString);
      range.load(["values", "columnCount"]);
      await context.sync();

      logui(`${typeof twoDimArray}`);
      logui(`${twoDimArray[0]}`);
      logui("Assigning values to sheet range");
      range.values = twoDimArray;
      currentWorksheet.load("name");
      await context.sync();
      logui("saving new OFFSET range");
      await saveRange(
        currentWorkbook,
        currentWorksheet.name,
        range.columnCount
      );
      await context.sync();
      return 0;
    });
  } catch (error) {
    logui("<<<<<<<<<< error caught >>>>>>>>>");
    logui(error.message);
    return 0;
  }
}

async function saveRange(currentWorkbook, name, end) {
  currentWorkbook.names.add(
    name,
    `=OFFSET(${name}!$A$1,0,0,COUNTA(${name}!$A:$A),${end})`
  );
  currentWorkbook.names.load("name, type");
  return 0;
}

async function validSelection(selectedRange, arraySizeX, arraySizeY) {
  // NOT selection smaller than array X && NOT selection smaller than array Y
  if (
    !(selectedRange.columnCount < arraySizeX) &&
    !(selectedRange.rowCount < arraySizeY)
  ) {
    return true;
  } else {
    return false;
  }
}

export async function clearRange(context, rangeBusy) {
  if (rangeBusy) {
    logui(`range is ${rangeBusy.toString()}`);
    rangeBusy.clear();
    rangeBusy.delete();
    logui("Removed existing targeted range");
    await context.sync();
  }
}

async function lookupSheetColumnCount(context, currentWorksheet, maxX) {
  let rangeString = `A1:${maxX}1`;
  logui("A");
  let range = currentWorksheet.getRange(rangeString);
  range.load("values", "columnCount");

  await context.sync();
  let usedRange;
}

async function blockSheet(context, name, arraySizeX, arraySizeY) {
  let ownerset = false;
  // check if block worksheet
  //  -more than one expansion name?
  // check expansion columns on worksheet
  let currentWorksheet = context.workbook.worksheets.getActiveWorksheet();
  currentWorksheet.load("name");
  await context.sync();
  if (currentWorksheet.name == name) {
    ownerset = true;
  }
  name = currentWorksheet.name;
  let column = false;
  let isLooking = 0;
  while (10 > isLooking && isLooking >= 0) {
    logui(`Checking headers`);
    let cell = currentWorksheet.getCell(0, isLooking);
    cell.load("values");
    await context.sync();
    logui(`${cell.values[0][0]}`);
    if (cell.values[0][0] == "Expansion") {
      column = isLooking;
      break;
    }
    isLooking++;
  }
  if (!column) {
    return false;
  }

  var columnRange = currentWorksheet.names.getItemOrNullObject(name);
  await context.sync();
  logui(`Got ${columnRange.toString()} from sheet names lookup`);
  if (columnRange.isNullObject || !ownerset) {
    logui(`Selecting used range`);
    columnRange = currentWorksheet.getUsedRange();
  } else {
    logui(`Selecting ${name}`);
  }

  columnRange.load("values");
  await context.sync();

  async function getUniqueValues(arr) {
    var obj = {};
    for (let i = 0; i < arr.length; i++) {
      if (
        !Object.keys(obj).includes(arr[i][column]) &&
        arr[i][column] !== "Expansion"
      ) {
        logui(`Adding ${arr[i][column]}`);
        obj[arr[i][column]] = true;
      }
    }
    return obj;
  }
  logui("Checking for unique values in expansion column");
  let expansions = await getUniqueValues(columnRange.values);

  logui(`Blocksheet check yielded ${Object.keys(expansions)}`);
  return expansions;
}

async function saveCounts(context, range, twoDimArray, arraySizeX) {
  // get sort priority, (always starts with expansion)
  range.load("values");
  await context.sync();
  let headers = twoDimArray.shift();
  let sorters = await getSortPriorities();
  let sheetValues = range.values;
  let sheetHeaders = null;
  if (sheetValues[0][0] == "Name") {
    sheetHeaders = sheetValues.shift();
  }
  let pSort =
    sorters.pst !== null || sorters.pst !== undefined ? sorters.pst : false;
  let sSort =
    sorters.sst !== null || sorters.sst !== undefined ? sorters.sst : false;
  let sortNames = {
    p:
      sorters.pname !== null || sorters.pname !== undefined
        ? sorters.pname
        : false,
    s:
      sorters.sname !== null || sorters.sname !== undefined
        ? sorters.sname
        : false,
  };
  let countIndexArray = headers.length - 1;
  let expansionIndexArray = countIndexArray - 1;
  let countIndexRange = sheetValues[0].length - 1;
  let expansionIndexRange = countIndexRange - 1;
  let expansionIndex = null;

  logui(
    `WorkArray is ${twoDimArray.length} long with ${
      countIndexArray + 1
    } columns`
  );
  logui(
    `Range to match is ${sheetValues.length} long with ${
      countIndexRange + 1
    } columns`
  );

  logui("Sorting setups complete");

  // add expansion sort
  logui("Sorting sheet values");
  expansionIndex = expansionIndexRange;
  sheetValues = await ensureColours(sheetValues, sheetHeaders);
  sheetValues.sort((a, b) => {
    return threeSort(a, b, pSort, sSort, expansionIndex, sortNames);
  });

  logui("Sorting value array");
  expansionIndex = expansionIndexArray;
  twoDimArray.sort((a, b) => {
    return threeSort(a, b, pSort, sSort, expansionIndex, sortNames);
  });

  logui("Saving count values");

  twoDimArray.forEach((element, index) => {
    let offset = 1;
    logui(`Checking ${index}`);
    if (
      sheetValues[index] &&
      (element[0] == sheetValues[index][0] ||
        element[0].replaceAll(" ", "") == sheetValues[index][0] ||
        element[0] == sheetValues[index][0].replaceAll(" ", "") ||
        element[0].replaceAll(" ", "") ==
          sheetValues[index][0].replaceAll(" ", ""))
    ) {
      logui(`${sheetValues[index]}`);
      logui(`${element}`);
      twoDimArray[index][countIndexArray] = sheetValues[index][countIndexRange];
    } else {
      logui(`${element} not matched`);
      logui(
        `Was compared to ${sheetValues[index]}, proceeding search forward at ${
          index + offset
        }`
      );
      while (offset + index < sheetValues.length) {
        if (
          element[0] == sheetValues[index + offset][0] ||
          element[0].replaceAll(" ", "") == sheetValues[index + offset][0] ||
          element[0] == sheetValues[index + offset][0].replaceAll(" ", "") ||
          element[0].replaceAll(" ", "") ==
            sheetValues[index + offset][0].replaceAll(" ", "")
        ) {
          twoDimArray[index][countIndexArray] =
            sheetValues[index + offset][countIndexRange];
          logui(`Hit at ${index + offset}`);
          return;
        }
        offset++;
      }
      offset = index > sheetValues.length ? 1 + index - sheetValues.length : 1;
      logui(`Searching backwards starting ${index - offset}`);
      while (index - offset > 1) {
        if (
          element[0] == sheetValues[index - offset][0] ||
          element[0].replaceAll(" ", "") == sheetValues[index - offset][0] ||
          element[0] == sheetValues[index - offset][0].replaceAll(" ", "") ||
          element[0].replaceAll(" ", "") ==
            sheetValues[index - offset][0].replaceAll(" ", "")
        ) {
          twoDimArray[index][countIndexArray] =
            sheetValues[index - offset][countIndexRange];
          logui(`Hit at ${index - offset}`);
          return;
        }
        offset++;
      }
      logui(`Leaving at 0`);
      twoDimArray[index][countIndexArray] = "0";
    }
  });
  logui("Restoring header to array");
  twoDimArray.splice(0, 0, headers);

  return twoDimArray;
}

export async function ensureColours(sheetValues, sheetHeaders) {
  const colourIndex = sheetHeaders.findIndex(
    (element) => element == "Colour" || element == "Color"
  );
  for (let i = 0; i < sheetValues; i++) {
    sheetValues[i][colourIndex] = normalizeColour(sheetValues[i][colourIndex]);
  }
  return sheetValues;
}

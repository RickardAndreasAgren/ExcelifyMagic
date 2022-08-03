import { numberToLetters, lettersToNumber } from './columnconverter.js';
import { logui } from '../util/printui.js';
import { prepareSet, getSortPriorities } from '../taskpane/taskpane.js';
import { getSetData } from '../api/excelifyapi.js';

export async function printfield(twoDimArray,newSheet) {
  try {
    await Excel.run(async context => {
      let headers = Object.assign({},twoDimArray[0]);
      let arraySizeX = twoDimArray[0].length;
      let arraySizeY = twoDimArray.length;
      let yTarget = arraySizeY;
      let xTarget = await numberToLetters(arraySizeX - 1);
      let setlist = document.getElementById('setselector');
      let name = setlist[setlist.selectedIndex].value;

      var currentWorkbook = context.workbook;
      var currentWorksheet = context.workbook.worksheets.getActiveWorksheet();

      let inUseRange = currentWorksheet.getUsedRange();
      inUseRange.load('columnCount','address');
      await context.sync();
      let rangeX = inUseRange.columnCount;

      var selectedRange = context.workbook.getSelectedRange();
      selectedRange.load([
          'values',
          'columnIndex',
          'rowIndex',
          'columnCount',
          'rowCount',
      ]);

      await context.sync();
      if(newSheet) {
        range = selectedRange;
        null;
        // =======================================================
        /*
        if selection
          use selection
        */
      } else if ((await validSelection(context,arraySizeX,arraySizeY))) {
        range = selectedRange;
        await clearRange(context,name);
        // =======================================================
        /*
            sort existing sheet range on expansion
            flag saveCounts
        */
      } else {
        let blocks = await blockSheet(context, name, arraySizeX,arraySizeY)
        if(blocks.length > 1) {
          const saveName = name;
          for (const [key, value] of Object.entries(expansions)) {
            if(key == name) {
              continue;
            }
            // check against sheet name, set name when found
            let checkSheets = context.workbook.worksheets.getItem(key);
            if(checkSheets) {
              name = checkSheets;
              checkSheets.activate();
            }
            // get other sets
            let extraSet = await buildSet()
            .then(data => {
              return { set: getSetData(data.set, format), props: data.props }
            })
            .then(data => {
              return prepareSet(data);
            })
            twoDimArray.concat(extraSet);
          }
          // link up all sets
          // xTarget, yTarget

          let arraySizeX = twoDimArray[0].length;
          let arraySizeY = twoDimArray.length;
          let yTarget = arraySizeY;
          let xTarget = await numberToLetters(arraySizeX - 1);

          let rangeString = 'A1:' + xTarget + yTarget;
          logui(rangeString);
          // =======================================================
          /*else
            populate from A1
          */
        } else {
          let rangeString = 'A1:' + xTarget + yTarget;
        }
        logui(rangeString);
        var range = currentWorksheet.getRange(rangeString);
        range.load([
          'values',
          'columnIndex',
          'rowIndex',
          'columnCount',
          'rowCount',
        ]);
        await context.sync();
        twoDimArray = await saveCounts(context, range, twoDimArray, currentRangeX);
        await clearRange(context,name);
        await context.sync();
      }

      // =======================================================
      /*
        printNewRange
        save
      */

      await context.sync();
      range.values = twoDimArray;
      await context.sync();
      await saveRange(currentWorkbook,name,range.columnCount);
      await context.sync();
      return 0;
    });
  } catch (error) {
    logui('<<<<<<<<<< error caught >>>>>>>>>');
    logui(error.message);
    return 0;
  }
}

async function saveRange(currentWorkbook,name,end) {
  currentWorkbook.names.add(name, `=OFFSET(${name}!$A$1,0,0,COUNTA(${name}!$A:$A),${end})`);
  currentWorkbook.names.load('name, type');
  return 0;
}

async function validSelection(selectedRange,arraySizeX,arraySizeY) {
  // NOT selection smaller than array X && NOT selection smaller than array Y
  if(!(selectedRange.columnCount < arraySizeX) && !(selectedRange.rowCount < arraySizeY)) {
    return true;
  } else {
    return false;
  }
}

async function clearRange(context, name) {
  let rangeBusy = context.workbook.names.getItemOrNullObject(name);
  if(rangeBusy) {
    rangeBusy.clear();
    rangeBusy.delete();
    logui('Replacing existing named range');
    await context.sync();
  }
}

async function blockSheet(context,name,arraySizeX,arraySizeY) {
  let ownerset = false;
  // check if block worksheet
  //  -more than one expansion name?
  // check expansion columns on worksheet
  let currentWorksheet = context.workbook.worksheets.getActiveWorksheet();
  if(currentWorksheet.name == name) {
    ownerset = true;
  }
  name = currentWorksheet.name;
  let column = false;
  let isLooking = 1;
  while(10 > isLooking > 1) {
    let cell = currentWorksheet.getCell(1,numberToLetters(isLooking));
    await cell.load('values');
    if(cell.values[0][0] == 'Expansion') {
      column = numberToLetters(isLooking);
      islooking = 0;
    }
  }
  let rangeString = `=OFFSET(${name}!$${column}$1,0,0,COUNTA(${name}!$${column}:$${column}),1)`;
  logui(rangeString);
  var columnRange = currentWorksheet.getRange(rangeString);
  await columnRange.load('values');
  let expansions = {};
  columnRange.values.forEach(rowWithColumn => expansionList[rowWithColumn[0]] = true);
  //
  return expansions;
}

async function saveCounts(context, range, twoDimArray, currentRangeX) {
  // get sort priority, (always starts with expansion)
  let sorters = await getSortPriorities();
  let pSort = sorters.pst ? sorters.pst : false;
  let sSort = sorters.sst ? sorters.sst : false;
  let countIndex = twoDimArray[0].length-1;

  const threeSort = (a, b) => {
    if (a[countIndex] < b[countIndex]) {
      return -1;
    }
    if (a[countIndex] > b[countIndex]) {
      return 1;
    }

    if (pSort && !!a[pSort] && !!b[pSort]) {
      if (a[pSort] < b[pSort]) {
        return -1;
      }
      if (a[pSort] > b[pSort]) {
        return 1;
      }
    }
    if (sSort && !!a[sSort] && !!b[sSort]) {
      if (a[sSort] < b[sSort]) {
        return -1;
      }
      if (a[sSort] > b[sSort]) {
        return 1;
      }
    }
    return 0;
  };

  let sheetValues = range.values;
  // add expansion sort
  sheetValues.sort(threeSort);
  twoDimArray.sort(threeSort);
  let sheetCountColumn = currentRangeX < 2 ? sheetValues[index].length - 1 : currentRangeX
  twoDimArray.forEach((element,index) => {
    twoDimArray[index][element.length-1] = sheetValues[index][sheetCountColumn]
  })

  return twoDimArray
}

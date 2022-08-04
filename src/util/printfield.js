import { numberToLetters, lettersToNumber } from './columnconverter.js';
import { logui } from '../util/printui.js';
import { prepareSet, getSortPriorities, buildSet, getSetCode} from '../taskpane/taskpane.js';
import { getSetData } from '../api/excelifyapi.js';

export async function printfield(twoDimArray, newSheet, format) {
  try {
    await Excel.run(async context => {
      let headers = Object.assign({},twoDimArray[0]);
      let arraySizeX = twoDimArray[0].length;
      let arraySizeY = twoDimArray.length;
      let yTarget = arraySizeY;
      let xTarget = await numberToLetters(arraySizeX - 1);
      let setlist = document.getElementById('setselector');
      var name = setlist[setlist.selectedIndex].value;

      var currentWorkbook = context.workbook;
      var currentWorksheet = context.workbook.worksheets.getActiveWorksheet();

      var inUseRange = currentWorksheet.getUsedRange();
      inUseRange.load('columnCount','address');
      await context.sync();
      let rangeX = inUseRange.columnCount;
      var range = currentWorksheet.getUsedRange();
      var rangeString = '';

      var selectedRange = context.workbook.getSelectedRange();
      selectedRange.load([
          'values',
          'columnIndex',
          'rowIndex',
          'columnCount',
          'rowCount',
      ]);

      await context.sync();
      let selectionValid = await validSelection(selectedRange,arraySizeX,arraySizeY);
      if(newSheet) {
        logui('Fresh sheet!')
        range = selectedRange;
        null;
        // =======================================================
        /*
        if selection
          use selection
        */
      } else if (selectionValid) {
        logui(`Using a valid range selection`);
        range = selectedRange;
        await clearRange(context,selectedRange);
        // =======================================================
        /*
            sort existing sheet range on expansion
            flag saveCounts
        */
      } else {
        logui('Not a valid selection, looking up things')
        // Log anything that moves
        let blocks = await blockSheet(context, name, arraySizeX,arraySizeY);
        logui(`Type of result from blockcheck ${typeof blocks}`);
        if(blocks && Object.keys(blocks).length > 1) {
          logui('Proceeding with blocksheet logic')
          const saveName = name;
          for (const [key, value] of Object.entries(blocks)) {
            if(key == name) {
              continue;
            }
            logui(`Preparing ${key}`)
            // check against sheet name, set name when found
            let checkSheets = context.workbook.worksheets.getItem(key);
            if(checkSheets) {
              name = checkSheets;
              checkSheets.activate();
            }
            // get other sets
            let setCode = getSetCode(key);
            let extraSet = await buildSet(setCode)
            .then(async data => {
              let setData = getSetData(data.set, format);
              return { set: setdata, props: data.props }
            })
            .then(data => {
              return prepareSet(data);
            })
            logui(`Extending data array with ${extraSet.length} rows`);
            twoDimArray.concat(extraSet);
            logui(`Now at ${twoDimArray.length} rows.`)
          }
          // link up all sets
          // xTarget, yTarget

          let arraySizeX = twoDimArray[0].length;
          let arraySizeY = twoDimArray.length;
          let yTarget = arraySizeY;
          let xTarget = await numberToLetters(arraySizeX - 1);

          rangeString = 'A1:' + xTarget + yTarget;
          logui(rangeString);
          // =======================================================
          /*else
            populate from A1
          */
        } else {
          logui('Fallback to basic selection');
          rangeString = 'A1:' + xTarget + yTarget;
        }
        logui(rangeString);
        range = currentWorksheet.getRange(rangeString);
        range.load([
          'values',
          'columnIndex',
          'rowIndex',
          'columnCount',
          'rowCount',
        ]);
        await context.sync();
        twoDimArray = await saveCounts(context, range, twoDimArray, xTarget);
        await clearRange(context,range);
        await context.sync();
      }

      // =======================================================
      /*
        printNewRange
        save
      */
      range.load([
        'values',
      ]);

      await context.sync();
      logui(`${range.values}`);
      logui(`${typeof twoDimArray}`);
      logui(`${twoDimArray[0]}`);
      logui('Assigning values to sheet range');
      range.values = twoDimArray;
      await context.sync();
      logui('saving new OFFSET range')
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

async function clearRange(context, rangeBusy) {
  if(rangeBusy) {
    logui(`range is ${rangeBusy.toString()}`)
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
  currentWorksheet.load('name');
  await context.sync();
  if(currentWorksheet.name == name) {
    ownerset = true;
  }
  name = currentWorksheet.name;
  let column = false;
  let isLooking = 0;
  while(10 > isLooking && isLooking >= 0) {
    logui(`Checking headers`);
    let cell = currentWorksheet.getCell(0,isLooking);
    cell.load('values');
    await context.sync();
    logui(`${cell.values[0][0]}`)
    if(cell.values[0][0] == 'Expansion') {
      column = isLooking;
      break;
    }
    isLooking++
  }
  if(!column) {
    return false;
  }

  var columnRange = currentWorksheet.names.getItemOrNullObject(name);
  if(!ownerset) {
    logui(`Selecting used range`);
    columnRange = currentWorksheet.getUsedRange();
  } else {
    logui(`Selecting ${name}`);
  }

  columnRange.load('values');
  await context.sync();

  async function getUniqueValues(arr) {
    var obj = {};
    for(let i = 0; i < arr.length; i++) {
      if(!Object.keys(obj).includes(arr[i][column]) && arr[i][column] !== 'Expansion') {
        logui(`Adding ${arr[i][column]}`)
        obj[arr[i][column]] = true;
      }
    }
    return obj;
  }
  let expansions = await getUniqueValues(columnRange.values);

  logui(`Blocksheet check yielded ${expansions}`)
  return expansions;
}

async function saveCounts(context, range, twoDimArray, arraySizeX) {
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
  let sheetCountColumn = arraySizeX < 2 ? sheetValues[index].length - 1 : arraySizeX
  twoDimArray.forEach((element,index) => {
    twoDimArray[index][element.length-1] = sheetValues[index][sheetCountColumn]
  })

  return twoDimArray
}

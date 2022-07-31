import { numberToLetters, lettersToNumber } from './columnconverter.js';
import { logui } from '../util/printui.js';

export async function printfield(twoDimArray, column = 0, row = 0) {
  try {
    await Excel.run(async context => {

      let overwriteMode = false;
      let blockMode = false;
      let startA1 = true;
      let arrayX = twoDimArray[0].length;
      logui(twoDimArray[0]);
      let arrayY = twoDimArray.length;
      let yTarget = arrayY;
      let xTarget = await numberToLetters(arrayX - 1);
      let setlist = document.getElementById('setselector');
      let activeSet = setlist[setlist.selectedIndex].value;
      var storedCount = [];

      var currentWorkbook = context.workbook;
      var currentWorksheet = context.workbook.worksheets.getActiveWorksheet();

      var range = context.workbook.getSelectedRange();
      range.load([
        'values',
        'columnIndex',
        'rowIndex',
        'columnCount',
        'rowCount',
      ]);
      await context.sync();
      let rangeX = range.columnCount;
      let rangeY = range.rowCount;

      /* OBS! Första set i block dikterar range namn
        check start
          check if worksheet match set name : flag A
          check if block worksheet
            sort existing range on expansion
            get workbook.names, foreach: shares workbook with current? : flag B & <var matchedname>
            if B : replace range part : flag R
          check if flag A
            just replace
          find start
            if <var matchedname>

            else

        set end

        fallback: populate from A1
      */

      // check if existing data in row 2; set overwriteMode
      if(range.rowIndex === 0) {
        startA1 = true;
      }

      let countColumnData = saveCount(rangeX, rangeY, range);

      logui('Selecting canvas\n');
      // NOT selected smaller X && NOT selected smaller Y
      if (!(rangeX < arrayX) && !(rangeY < arrayY)) {
        logui('Populating range\n');

        range.values = twoDimArray;
        return context.sync().then(() => {
          return saveRange(currentWorkbook,activeSet,range,arrayX);
        });
        // =======================================================
      } else {

        // fallback: populate from A1
        logui('Populating sheet\n');
        let rangeString = 'A1:' + xTarget + yTarget;
        logui(rangeString);
        var range = currentWorksheet.getRange(rangeString);
        range.load([
          'values',
          'columnIndex',
          'rowIndex',
          'columnCount',
          'rowCount',
        ]);
        logui('Loaded range properties');
        await context.sync();
        range.values = twoDimArray;
        return context.sync().then(() => {
          return saveRange(currentWorkbook,activeSet,range,arrayX);
        });
      }

      // =======================================================
      return 0;
    });
  } catch (error) {
    logui('<<<<<<<<<< error caught >>>>>>>>>');
    logui(error.message);
    return 0;
  }
}

async function saveRange(currentWorkbook,name,range,targetColumn) {
  let rangeBusy = currentWorkbook.names.getItemOrNullObject(name);
  await context.sync();
  if (rangeBusy) {
    let selectedToRemove = rangeBusy;
    if(rangeBusy.rowIndex === 0) {
      let column = await getLastColumn(rangeBusy);
      rangeBusy = rangeBusy.worksheet.getRange(`A2:${column}${(rangeBusy.rowCount - 1)}`);
    }
    rangeBusy.clear();
    rangeBusy.delete();
    logui('Replacing existing named range');
    await context.sync();
  }
  currentWorkbook.names.add(name, `=OFFSET(${name}!$A$1,0,0,COUNTA(${name}!$A:$A),${targetColumn})`);
  logui('Added named range: ' + name);
  const namedItems = currentWorkbook.names.load('name, type');
  return await context.sync()
}

async function getLastColumn(range) {
  let columns = range.columnCount;
  return await numberToLetters(columns - 1);
}

function saveCount(xl,yl, ) {
  // check if multiset-sheet; get full range; ensure sorted;
  // lookup:
  //  establish startpoint
  //  establish endpoint
  // select range by lookup
  return false;
}

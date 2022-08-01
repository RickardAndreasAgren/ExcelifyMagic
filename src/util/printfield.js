import { numberToLetters, lettersToNumber } from './columnconverter.js';
import { logui } from '../util/printui.js';

export async function printfield(twoDimArray,newSheet) {
  try {
    await Excel.run(async context => {
      let headers = Object.assign({},twoDimArray[0]);
      let sheetOwner = false;
      let arraySizeX = twoDimArray[0].length;
      let arraySizeY = twoDimArray.length;
      let yTarget = arraySizeY;
      let xTarget = await numberToLetters(arraySizeX - 1);
      let setlist = document.getElementById('setselector');
      let name = setlist[setlist.selectedIndex].value;
      var storedCount = [];

      var currentWorkbook = context.workbook;
      var currentWorksheet = context.workbook.worksheets.getActiveWorksheet();

      var selectedRange = context.workbook.getSelectedRange();
      selectedRange.load([
          'values',
          'columnIndex',
          'rowIndex',
          'columnCount',
          'rowCount',
      ]);
      await context.sync();

      /* OBS! Första set i block dikterar range namn*/
      let rangeBusy = currentWorkbook.names.getItemOrNullObject(name);
      //  check if worksheet match set name
      //    -get workbook.names, foreach: shares workbook with current

      await context.sync();
      if(newSheet) {
        null;
        // =======================================================
        /*
        if selection
          use selection
        */
      } else if ((await validSelection(context,arraySizeX,arraySizeY))) {

        await clearRange(context,name);
        // =======================================================
        /*
            sort existing sheet range on expansion
            if not first
              remove headers
            flag A
            find start
        */
      } else if((await blockSheet(context, name, arraySizeX,arraySizeY))) {
        // copy existing counts
        await clearRange(context,name);
        // =======================================================
        /*else
          populate from A1
        */
      } else {
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
        // copy existing counts
        await context.sync();
      }

      // =======================================================
      /*
        if flag A {
          select entire sheet
          get other sets with columns selected
          remove headers from not-top set
          apply sorting
          combine
        }
        set end
        select range
        take counts from sheet into new range
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
  await context.sync();
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
  var range = currentWorksheet.getRange(rangeString);
  // check for not-this value
  
}

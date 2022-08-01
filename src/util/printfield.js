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
        logui('Populating range\n');

        await clearRange(context,name);
        // =======================================================
        /*
          else check if block worksheet
            -more than one expansion name?
            sort existing range on expansion
            if not first
              remove headers
            flag A
            find start
        */
      } else if(blockSheet()) {


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
      if("flagA") {

      }

      range.values = twoDimArray;
      await context.sync();

      return saveRange(currentWorkbook,name,range.columnCount);
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
  // check expansion columns on worksheet
  // get y length+2
  // get expansions column, check for not-this value
}

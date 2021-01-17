import { numberToLetters, lettersToNumber } from './columnconverter.js';
import { logui } from '../util/printui.js';

export async function printfield(twoDimArray, column = 0, row = 0) {
  // Check if

  try {
    await Excel.run(async context => {
      let arrayX = twoDimArray[0].length;
      logui(twoDimArray[0]);
      let arrayY = twoDimArray.length;

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

      async function saveRange() {
        let setlist = document.getElementById('setselector');
        let activeSet = setlist[setlist.selectedIndex].value;
        let rangeBusy = currentWorksheet.names.getItemOrNullObject(activeSet);
        rangeBusy.load();
        await context.sync();
        if (rangeBusy) {
          rangeBusy.delete();
          logui('Replacing existing named range');
          await context.sync();
        }
        currentWorksheet.names.add(activeSet, range);
        logui('Added named range: ' + activeSet);
        const namedItems = currentWorksheet.names.load('name, type');
        return await context.sync()
      }

      logui('Selecting canvas\n');
      if (!(rangeX < arrayX) && !(rangeY < arrayY)) {
        logui('Populating range\n');

        range.values = twoDimArray;
        return context.sync().then(() => {
          return saveRange();
        });
        // =======================================================
      } else {
        logui('Populating sheet\n');
        let yTarget = arrayY;
        let xTarget = await numberToLetters(arrayX - 1);
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
          return saveRange();
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

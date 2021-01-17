import { numberToLetters, lettersToNumber } from './columnconverter.js';
import { logui } from '../util/printui.js';

export async function printfield(
  twoDimArray,
  column = 0,
  row = 0,
  context
) {
  // Check if

  try {
    let arrayX = twoDimArray[0].length;
    logui(twoDimArray[0]);
    let arrayY = twoDimArray.length;

    var currentWorksheet = context.workbook.worksheets.getActiveWorksheet();

    var range = context.workbook.getSelectedRange();
    range.load(['values', 'columnIndex', 'rowIndex','columnCount','rowCount']);
    await context.sync();
    let rangeX = range.columnCount;
    let rangeY = range.rowCount;

    function saveRange() {
      let setlist = document.getElementById('setselector');
      let activeSet = setlist[setlist.selectedIndex].value;
      let rangeBusy = currentWorksheet.names.getItem(activeSet);
      if (rangeBusy) {
        rangeBusy.delete();
        context.sync();
      }
      currentWorksheet.names.add(activeSet, range);
      const namedItems = currentWorksheet.names.load('name, type');

    }

    logui('Selecting canvas\n');
    if (!(rangeX < arrayX) && !(rangeY < arrayY)) {
      logui('Populating range\n');

      range.values = twoDimArray;
      saveRange();
      return context.sync().then(() => {return range});
      // =======================================================
    } else {
      logui('Populating sheet\n');
      let yTarget = arrayY;
      let xTarget = await numberToLetters(arrayX - 1);
      let rangeString = 'A1:' + xTarget + yTarget;
      logui(rangeString);
      var range = currentWorksheet.getRange(rangeString);
      range.load(['values', 'columnIndex', 'rowIndex','columnCount','rowCount']);
      logui('Loaded range properties');
      await context.sync()
      range.values = twoDimArray;
      saveRange();
      return context.sync().then(() => {return range});

      // =======================================================
    }
    return 0;
  } catch (error) {
    logui('<<<<<<<<<< error caught >>>>>>>>>');
    logui(error.message);
    return 0;
  }
}

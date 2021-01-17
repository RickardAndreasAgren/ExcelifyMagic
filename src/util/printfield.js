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

    logui('Selecting canvas\n');
    if (!(rangeX < arrayX) && !(rangeY < arrayY)) {
      logui('Populating range\n');

      twoWriteOn.values = twoDimArray;
      return context.sync();
      // =======================================================
    } else {
      logui('Populating sheet\n');
      let yTarget = arrayY;
      let xTarget = await numberToLetters(arrayX - 1);
      let rangeString = 'A1:' + xTarget + yTarget;
      logui(rangeString);
      var _range = currentWorksheet.getRange(rangeString);
      _range.load(['values', 'columnIndex', 'rowIndex','columnCount','rowCount']);
      logui('Loaded range properties');
      await context.sync()
      _range.values = twoDimArray;
      return context.sync();

      // =======================================================
    }
    return 0;
  } catch (error) {
    logui('<<<<<<<<<< error caught >>>>>>>>>');
    logui(error.message);
    return 0;
  }
}


import { numberToLetters, lettersToNumber } from '../util/printui.js';

export async function printfield(
  twoDimArray, toWriteOn, column = 0, row = 0, context) {
  // Check if
  var toPrint = '';
  if (typeof msg !== 'string') {
    toPrint = JSON.stringify(msg);
  } else {
    toPrint = msg;
  }

  let arrayX = twoDimArray[0].length;
  let arrayY = twoDimArray.length;

  if (toWriteOn instanceof Excel.Range) {
    let rangeX = toWriteOn.columnCount;
    let rangeY = toWriteOn.rowCount;
    toWriteOn.load(['values', 'columnIndex', 'rowIndex']);
    await context.sync();
    if (!(rangeX < arrayX) && !(rangeY < arrayY)) {
      twoWriteOn.values = twoDimArray;
      return context.sync();
    } else {
      throw new Error('Range too small');
    }
    // =======================================================
  } else if (toWriteOn instanceof Excel.Worksheet) {
    let xTarget = arrayY;
    let yTarget = numberToLetters(arrayX);

    var _range = toWriteOn.getRange('A1:' + xTarget + yTarget);
    _range.values = twoDimArray;

    // =======================================================
  } else {
    await Excel.run(async context => {
      return 'Could not write to range or worksheet';
    });
  }
  return 0;
}

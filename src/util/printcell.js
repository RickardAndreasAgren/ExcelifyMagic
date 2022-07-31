export async function printcell(msg, toWriteOn, column = 0, row = 0, context) {

  var toPrint = '';
  if (typeof msg !== 'string') {
    toPrint = JSON.stringify(msg);
  } else {
    toPrint = msg;
  }

  if (toWriteOn instanceof Excel.Range) {
    toWriteOn.load(['values', 'columnIndex', 'rowIndex']);
    await context.sync();
    var targetCol = toWriteOn.columnIndex;
    var targetRow = toWriteOn.rowIndex;

    var currentWorksheet = context.workbook.worksheets.getActiveWorksheet();
    var a1cell = currentWorksheet.getCell(0, 1);
    a1cell.values = [['Range: Trying... ' + targetCol + ' ' + targetRow]];

    var selectRange = currentWorksheet.getCell(targetRow, targetCol);

    selectRange.values = [['Range: ' + toPrint]];
    // =======================================================
  } else if (toWriteOn instanceof Excel.Worksheet) {
    var a1cell = toWriteOn.getCell(column, row);

    a1cell.values = [['Worksheet: ' + toPrint]];
    // =======================================================
  } else {
    await Excel.run(async context => {
      var currentWorksheet = context.workbook.worksheets.getActiveWorksheet();

      var a1cell = currentWorksheet.getCell(column, row);

      a1cell.values = [['Else: ' + toPrint]];
    });
  }

  // Print message
  return 0;
}

async function printcell(msg, toWriteOn, column = 0, row = 0, context) {
  // Check if:
  // worksheet get A1
  // range get first
  // cell, use it
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
    /*
    Var rangeRow =
      (row + 1) > toWriteOn.rowCount
        ? toWriteOn.rowIndex
        : toWriteOn.rowIndex + row;
    var rangeColumn =
      (column + 1) > toWriteOn.columnCount
        ? toWriteOn.columnIndex
        : toWriteOn.columnIndex + column; */

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

export default printcell;

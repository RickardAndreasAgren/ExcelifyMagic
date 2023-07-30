import { colorOrdering } from "./models/models";
import { lettersToNumber, numberToLetters } from "src/util/columnconverter";

/* global Office */
async function ensureMetasheet(context, sheets) {
  let ix = sheets.items.indexOf("Meta");
  if (-1 < ix) {
    return sheets.items[ix];
  } else {
    let newMeta = sheets.add("Meta");
    newMeta.load("name");
    await context.sync();
  }
}

async function selectColumnPoint(context, metaRange) {
  let headerCell = await searchForValueHeader(context, metaRange, "SortColor");
  if (headerCell === "") {
    let columnTarget = numberToLetters(metaRange.columnCount + 2);
    let cell = metaRange.getCell(columnTarget + "1");
    cell.load(["values", "address"]);
    await context.sync();
    cell.values[0][0] = "SortColor";
    headerCell = cell;
    await context.sync();
  }
  return headerCell.address;
}

async function searchForValueHeader(context, range, name) {
  let checkedIndexes = [];
  for (let i = 1; i < range.rowCount; i++) {
    for (let c = 1; c < range.columnCount; i++) {
      let xTarget = await numberToLetters(c);
      if (-1 < checkedIndexes.indexOf(xTarget)) continue;

      let value = range.values[i][c];
      if (value == name) return xTarget + i;
      if (value.length > 0) checkedIndexes.push(xTarget);
    }
  }
  return "";
}

function plusColumn(address) {
  if (address.length !== 2) {
    throw new Error("Bad address for plusColumn");
  }
  let letter = address.substring(0, 1);
  return `${numberToLetters(lettersToNumber(letter) + 1)}${address.substring(
    1
  )}`;
}

async function ensureSortColorTable(context, metaSheet) {
  let tableItems = metaSheet.tables.items;
  tableItems.load(["name"]);
  await context.sync();
  let tryTable = metaSheet.tables.getItemOrNullObject("SortColor");
  await context.sync();

  // eslint-disable-next-line office-addins/load-object-before-read
  if (tryTable.isNullObject) {
    var metaRange = metaSheet.getUsedRange();
    metaRange.load([
      "values",
      "columnIndex",
      "rowIndex",
      "columnCount",
      "rowCount",
    ]);
    await context.sync();
    let sortcoloraddressKey = selectColumnPoint(context, metaRange);
    let sortcoloraddressValue = plusColumn(sortcoloraddressKey);

    let sortcoloraddress = { 0: sortcoloraddressKey, 1: sortcoloraddressValue };
    const charcolorMap = colorOrdering;
    const headerstring = `${sortcoloraddress[0].substring(
      0,
      1
    )}1${sortcoloraddress[1].substring(0, 1)}1`;
    tryTable = metaSheet.tables.add(headerstring, true);
    tryTable.name = "SortColor";
    tryTable.getHeaderRowRange().values = ["Color", "Value"];
    tryTable.rows.add(null, charcolorMap);

    if (Office.context.requirements.isSetSupported("ExcelApi", "1.2")) {
      metaSheet.getUsedRange().format.autofitColumns();
      metaSheet.getUsedRange().format.autofitRows();
    }
    await context.sync();
  }

  return tryTable;
}

export async function tableSortColorMTG(context) {
  let sheets = context.workbook.worksheets;
  sheets.load("items/name");
  await context.sync();

  const metaSheet = ensureMetasheet(context, sheets);

  const metaTable = await ensureSortColorTable(context, metaSheet);

  const currentWorksheet = context.workbook.worksheets.getActiveWorksheet();

  // currentTable = false
  // get tables, load name, cycle for .toLowerCase() === "ztable") currentTable = <hit>; break;
  // if setTableMode == false) currentTable = createTable(context, currentWorksheet)
  // columnCount - 3
  // insert column
  // =TEXTJOIN("",,XLOOKUP(MID([@Text],ROW($A$1:INDEX($A:$A,LEN(A2))),1),Table2[My Alphabet],Table2[Key],0))
  // ** LEN(A2) is the ref to source value, with A is linked with $A:$A
  // ** Table2 => metaTable
  // ** 

  // At active sheet, process alphabetizing of colors, "|" = 0
  //   into new "color" column. ( columns-length -3) (-1 indexes to count, -2 indexes to expansion)
  // A-Z sorting should now work with that column.
}

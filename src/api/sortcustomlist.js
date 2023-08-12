import { colorOrdering } from "./models/models";
import { lettersToNumber, numberToLetters } from "../util/columnconverter";
import { logui } from "../util/printui";
import { printerror } from "../util/printui.js";

const colorAlphabetWorksheetName = "Meta";
const colorAlphabetTableName = "SortColor";

/* global Office */

async function ensureMetasheet(context, sheets) {
  let found = false;
  sheets.items.forEach(function (sheet) {
    if (sheet.name === "Meta") found = sheet;
  });
  if (!found) {
    let newMeta = sheets.add(colorAlphabetWorksheetName);
    newMeta.load("name");
    await context.sync();
    found = newMeta;
  }
  return found;
}

async function searchForValueHeader(context, range, name) {
  let checkedIndexes = [];
  for (let i = 1; i < range.rowCount; i++) {
    logui(`i: ${i}`);
    for (let c = 1; c < range.columnCount; c++) {
      logui(`c: ${c}`)
      let xTarget = await numberToLetters(c + 1);
      logui(`${xTarget}`);
      if (-1 < checkedIndexes.indexOf(xTarget)) continue;

      let value = range.values[i][c];
      logui(`${value}`);
      logui(`${xTarget + i}`);
      if (value == name) return `${xTarget + i}`;
      if (value.length > 0) checkedIndexes.push(xTarget);
    }
  }
  return "";
}

async function selectColumnPoint(context, metaRange) {
  let headerCell = await searchForValueHeader(
    context,
    metaRange,
    colorAlphabetTableName
  );
  logui("aa");
  if (headerCell === "") {
    let columnTarget = numberToLetters(metaRange.columnCount + 2);
    logui("ab");
    let cell = metaRange.getCell(columnTarget + "1");
    logui("ac");
    cell.load(["values", "address"]);
    await context.sync();
    cell.values[0][0] = colorAlphabetTableName;
    headerCell = cell;
    logui("ad");
    await context.sync();
  }
  return headerCell.address;
}

function plusColumn(address) {
  if (address && address.length !== 2) {
    throw new Error("Bad address for plusColumn");
  }
  let letter = address.substring(0, 1);
  return `${numberToLetters(lettersToNumber(letter) + 1)}${address.substring(
    1
  )}`;
}

async function createTable(context, workbook, worksheet) {
  let uRange = worksheet.getUsedRange();
  uRange.load(["address"]);
  await context.sync();

  let rangeString = `A2${uRange.address.substring(2)}`;

  return context.workbook.tables.add(rangeString, false);
}

async function ensureSortColorTable(context, metaSheet) {
  let tryTable = context.workbook.tables.getItemOrNullObject(
    colorAlphabetTableName
  );
  let metaRange = metaSheet.getUsedRange();
  metaRange.load([
    "values",
    "columnIndex",
    "rowIndex",
    "columnCount",
    "rowCount",
  ]);
  await context.sync();
  // eslint-disable-next-line office-addins/load-object-before-read
  if (tryTable.isNullObject) {
    let sortcoloraddressKey = await selectColumnPoint(context, metaRange);
    let sortcoloraddressValue = await plusColumn(sortcoloraddressKey);

    let sortcoloraddress = { 0: sortcoloraddressKey, 1: sortcoloraddressValue };
    const charcolorMap = colorOrdering;
    const headerstring = `${sortcoloraddress[0].substring(
      0,
      1
    )}1${sortcoloraddress[1].substring(0, 1)}1`;
    tryTable = metaSheet.tables.add(headerstring, true);
    tryTable.name = colorAlphabetTableName;
    logui("g");
    tryTable.getHeaderRowRange().values = ["Color", "Value"];
    tryTable.rows.add(null, charcolorMap);

    if (Office.context.requirements.isSetSupported("ExcelApi", "1.2")) {
      metaSheet.getUsedRange().format.autofitColumns();
      metaSheet.getUsedRange().format.autofitRows();
    }
    logui("h");
    await context.sync();
  }
  logui("f");
  return tryTable;
}

async function setupNewColumn(context, table, columnTarget) {
  let header = context.worksheet.getRange(`${columnTarget}1`);
  header.load("values");
  await context.sync();
  let newHeader = header.insert("Right");
  newHeader.load("values");
  newHeader.value = "SortColor";
  await context.sync();

  let range = table.getRange();
  range.load(["values", "columnIndex", "rowIndex", "columnCount", "rowCount"]);
  await context.sync();

  let rangeTarget = context.worksheet.getRange(
    `${columnTarget}2:${columnTarget}${table.rowCount + 1}`
  );

  return rangeTarget.insert("Right");
}

async function setColumnCellsFormula(context, sortColumnRange, columnColor) {
  sortColumnRange.load([
    "values",
    "columnIndex",
    "rowIndex",
    "columnCount",
    "rowCount",
  ]);
  await context.sync();
  const ccr = columnColor;

  for (let i = 0; i < sortColumnRange.rowCount; i++) {
    sortColumnRange.values[
      i
    ][0] = `=TEXTJOIN("",,XLOOKUP(MID([@Text],ROW($${ccr}$1:INDEX($${ccr}:$${ccr},LEN(${
      ccr + i.toString()
    }))),1),${colorAlphabetTableName}[Color],${colorAlphabetTableName}[Value],0))`;
  }
}

export async function tableSortColorMTG(context) {
  logui("a");
  let sheets = context.workbook.worksheets;
  sheets.load("items/name");
  await context.sync();

  logui("Ensuring metasheet");
  let metaSheet = await ensureMetasheet(context, sheets);

  logui(`${metaSheet?.name ?? "Nope"}`);
  logui("Ensuring SortColor table");
  let colorTable = await ensureSortColorTable(context, metaSheet).catch(
    (error) => {
      logui("error caught");
      printerror(`${error}`);
      printerror(`${error.message}`);
    }
  );

  let currentWorksheet = context.workbook.worksheets.getActiveWorksheet();
  currentWorksheet.load("name");

  let currentTable = false;
  let tables = context.workbook.getTables();
  tables.load("items/name");
  await context.sync();

  logui("Seeking for ztable");
  tables.items.forEach(function (table) {
    let checkSheet = table.worksheet;
    if (
      table.name.toLowerCase().includes("ztable") &&
      checkSheet.name === currentWorksheet.name
    ) {
      logui("Got table");
      currentTable = table;
    }
  });

  if (!currentTable) {
    logui("Creating ztable");
    currentTable = await createTable(context, currentWorksheet);
    currentTable.name = "ZTable" + currentWorksheet.name;
  }

  let hasColorColumn = false;
  let columnTarget = false;
  let columnColor = false;
  let headers = currentTable.getHeaderRowRange();
  headers.load(["columnIndex", "columnCount", "values"]);
  await context.sync();

  logui("Getting color column");
  for (let i = 1; i < headers.columnCount + 1; i++) {
    if (headers.values[0][i] === "Color") {
      columnColor = numberToLetters(i);
      break;
    }
  }
  if (!columnColor) {
    logui("Cant colorsort without color column");
    return false;
  }

  logui("Checking for existing ColorSort column.");
  if (headers[headers.columnCount - 3].value == "ColorSort") {
    hasColorColumn = true;
    columnTarget = numberToLetters(headers.columnCount - 3);
  }

  currentTable.load(["rowIndex", "rowCount", "address"]);
  await context.sync();
  let sortColumnRange;
  if (!hasColorColumn) {
    logui("Creating ColorSort column");
    sortColumnRange = await setupNewColumn(context, currentTable, columnTarget);
  } else {
    logui("Selecting ColorSort column");
    sortColumnRange = currentWorksheet.getRange(
      `${columnTarget}2:${columnTarget}${currentTable.rowCount + 1}`
    );
  }

  logui("Resizing table");
  currentTable.resize(
    `A2:${numberToLetters(headers.columnCount + 1)}${currentTable.rowCount + 1}`
  );
  await context.sync();

  logui("Filling column with formulas");
  await setColumnCellsFormula(context, sortColumnRange, columnColor);
  return true;
}

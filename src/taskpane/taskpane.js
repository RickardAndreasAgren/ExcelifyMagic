/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

/* global Office document Excel */

import { printcell } from "../util/printcell.js";
import { printfield } from "../util/printfield.js";
import { printerror } from "../util/printui.js";
import { logui } from "../util/printui.js";
import optionText from "../api/optionText.js";
import {
  sortOptionsUpdate,
  setOptions,
  initKeepers,
  getSetData,
  getSetName,
  setupCardSet,
  getWorkbooknames,
  getSelectedProps,
} from "../api/excelifyapi.js";

var format = "pioneer";

var newSheet = false;

var selectedFields = {
  cbname: false,
  cbnumber: false,
  cbcolor: false,
  cbcmc: false,
  cbtype: false,
  cbsubtype: false,
  cbrarity: false,
  cbstats: false,
};

var checkBoxes = [
  "cbname",
  "cbnumber",
  "cbcolor",
  "cbcmc",
  "cbtype",
  "cbsubtype",
  "cbrarity",
  "cbstats",
];

/******************************************
Importing logic above.

Set up when office application fires onReady.
Define variables and initial procedure and attach
functions to triggers & events.

 dot.html&css file represents active taskpane and
can be targeted by .js from this scope.
******************************************/

Office.onReady((info) => {
  if (info.host === Office.HostType.Excel) {
    startApp();
    return 0;
  }
});

function startApp() {
  document.getElementById("sideload-msg").style.display = "none";
  document.getElementById("app-body").style.display = "flex";
  document.getElementById("buildset").onclick = renderSetCards;
  document.getElementById("formatselector").onclick = selectFormat;
  document.getElementById("coloursort").onclick = runColourSort;

  setOptions(format)
    .then((setList) => {
      let options = setList.sort((a, b) => {
        let aDate = new Date(a.releaseDate);
        let bDate = new Date(b.releaseDate);
        if (aDate > bDate) {
          return 1;
        }
        if (aDate < bDate) {
          return -1;
        }
        return 0;
      });

      for (let set = 0; set < options.length; set++) {
        let newOption = document.createElement("option");
        newOption.value = options[set].type;
        newOption.text = options[set].name;
        //logui(`Got ${options[set].name}`)
        document.getElementById("setselector").add(newOption, null);
        document.getElementById("setselector").onchange = function () {
          setRows();
        };
      }
      logui("Getting ranges");
      getWorkbooknames().then((ranges) => {
        logui(ranges.length);
        for (
          let rangeOptions = 0;
          rangeOptions < ranges.length;
          rangeOptions++
        ) {
          let newOption = document.createElement("option");
          newOption.value = ranges[rangeOptions];
          newOption.text = ranges[rangeOptions];
          document.getElementById("rangeselector").add(newOption, null);
        }
        return 0;
      });

      document.getElementById("toberemoved").remove();
      document.getElementById("selectionpoint").innerHTML = "";
      setRows();
      document.getElementById("newsheet").onchange = function () {
        newSheet = document.getElementById("newsheet").checked;
      };
      initKeepers();
      return options;
    })
    .then((options) => {
      for (var i = 0; i < checkBoxes.length; i++) {
        let target = Object.assign({}, { name: checkBoxes[i] });
        document.getElementById(target.name).onchange = function () {
          selectedFields[target.name] = !selectedFields[target.name];
          let selections = 2;
          Object.keys(selectedFields).forEach((field) => {
            if (selectedFields[field]) {
              selections += 1;
            }
          });
          document.getElementById("printcolumns").innerHTML = selections;

          try {
            sortOptionsUpdate(target.name, !!selectedFields[target.name]);
          } catch (error) {
            document.getElementById("errorpoint").innerHTML = JSON.stringify({
              err: error.message,
              stack: error.stack,
            });
          }
        };
      }
      logui("Addin ready");
      return options;
    })
    .catch((error) => {
      document.getElementById("errorpoint").innerHTML =
        "Shit happened: " + error.message + " Stack: " + error.stack;
    });
}

/***************************
Define functions to be used by triggers
***************************/

export async function buildSet(setCode = null) {
  setCode ? logui(`Got ${setCode} for build set.`) : null;
  let setlist = document.getElementById("setselector");
  let activeSet = setCode ? setCode : setlist[setlist.selectedIndex].value;
  let name = getSetName(activeSet, format);
  return await getSelectedProps(selectedFields).then((props) => {
    return { set: activeSet, name: name, props: props };
  });
}

export async function selectFormat() {
  let formatChoice = document.getElementById("formatselector");
  if (formatChoice.value == "pioneer") {
    format = "pioneer";
  } else if (formatChoice.value == "all") {
    format = "all";
  }
}

function runColourSort() {
  // get the active range, see printfield
  // emulate psort = cbcolor
  // run threesort
  // paste back
}

function setRows() {
  let selectedSet = document.getElementById("setselector").value;
  let setData = getSetData(selectedSet, format);
  document.getElementById("printrows").innerHTML = setData.cards.length;
}

/*
function setRanges() {
  let selectedSet = document.getElementById("rangeselector").value;
}*/

export async function renderSetCards() {
  document.getElementById("logpoint").innerHTML = "";
  return buildSet()
    .then((data) => {
      return Excel.run(function (context) {
        if (newSheet) {
          var sheets = context.workbook.worksheets;
          logui(data.name);
          var sheet = sheets.add(data.name);
          sheet.activate();
          sheet.load("name, position");
          sheet.position = 0;
        }
        return context.sync().then(function () {
          return data;
        });
      });
    })
    .then((data) => {
      logui("Added sheet");
      return { set: getSetData(data.set, format), props: data.props };
    })
    .then((setData) => {
      logui("Fetched props");
      return prepareSet(setData);
    })
    .then((cardArray) => {
      logui("Sorting complete");
      try {
        return getSelectedProps(selectedFields).then((props) => {
          let headers = [];
          props.forEach((prop) => {
            headers.push(optionText[prop]);
          });
          headers.push("Expansion");
          headers.push("Count");
          cardArray.splice(0, 0, headers);
          logui(`Set headers of new range as following ${cardArray[0]}`);

          return printfield(cardArray, newSheet, format);
        });
      } catch (error) {
        logui("<<<<<<< error caught >>>>>>>>");
        logui(error.message);
        Excel.run(async (context) => {
          var currentWorksheet =
            context.workbook.worksheets.getActiveWorksheet();
          printcell(error.message, currentWorksheet);
          return context.sync();
        });
        printerror(error);
        throw error;
      }
    })
    .catch((error) => {
      if (error.code === "ItemAlreadyExists") {
        printerror("Worksheet name is occupied.");
      } else {
        printerror(error.message);
      }
    });
}

export async function prepareSet(setData) {
  var cardsList = setData.set.cards;
  var setupArray = [];
  let selectedFieldsCount = 0;
  logui(`Targeting fields`);
  Object.keys(selectedFields).forEach((field) => {
    if (selectedFields[field] == true) {
      logui(field);
      selectedFieldsCount += 1;
    }
  });
  if (selectedFieldsCount < 1) {
    throw new Error("No options selected");
  }

  logui(`Fetching cards data for set`);
  setupArray = await setupCardSet(cardsList, setData, setupArray);
  logui(`Setup produced ${setupArray.length} cards`);

  return Promise.all(setupArray)
    .then((results) => {
      return results;
    })
    .catch((error) => {
      logui("<<<<<<< rejection hit >>>>>>");
      printerror(error.message);
      throw error;
    })
    .then((cardArray) => {
      let pSort = false;
      let sSort = false;
      return new Promise((resolve) => {
        logui("---------------------setup complete");
        resolve(getSelectedProps(selectedFields));
      })
        .then((props) => {
          logui("Sorting next. Options are:");
          logui(props);
          logui("Primary sort is: ");
          logui(document.getElementById("psortactive").checked);
          if (document.getElementById("psortactive").checked) {
            let pVal = document.getElementById("primarysort").value;
            logui(pVal);
            pSort = props.indexOf(pVal);
            logui(pSort);
          }

          logui("Secondary sort is: ");
          logui(document.getElementById("ssortactive").checked);
          if (document.getElementById("ssortactive").checked) {
            let sVal = document.getElementById("secondarysort").value;
            logui(sVal);
            sSort = props.indexOf(sVal);
            logui(sSort);
          }
        })
        .then(() => {
          return cardArray.sort((a, b) => {
            if (pSort) {
              if (a[pSort] < b[pSort]) {
                return -1;
              }
              if (a[pSort] > b[pSort]) {
                return 1;
              }
            }
            if (sSort) {
              if (a[sSort] < b[sSort]) {
                return -1;
              }
              if (a[sSort] > b[sSort]) {
                return 1;
              }
            }
            return 0;
          });
        });
    })
    .catch((error) => {
      logui("<<<<<<< options and sorting failure >>>>>>");
      printerror(error.message);
      throw error;
    });
}

export async function getSortPriorities() {
  let props = await getSelectedProps(selectedFields);
  let pSort = null;
  let sSort = null;
  let pVal = null;
  let sVal = null;
  logui(document.getElementById("psortactive").checked);
  if (document.getElementById("psortactive").checked) {
    pVal = document.getElementById("primarysort").value;
    logui(pVal);
    pSort = props.indexOf(pVal);
    logui(pSort);
  }

  logui("Secondary sort is: ");
  logui(document.getElementById("ssortactive").checked);
  if (document.getElementById("ssortactive").checked) {
    sVal = document.getElementById("secondarysort").value;
    logui(sVal);
    sSort = props.indexOf(sVal);
    logui(sSort);
  }
  return { pst: pSort, sst: sSort, pname: pVal, sname: sVal };
}

export function getSetCode(name) {
  let setlistHtml = document.getElementById("setselector").options;
  let setCode = "";
  for (let i = 0; i < setlistHtml.length; i++) {
    if (setlistHtml[i].text == name) {
      setCode = setlistHtml[i].value;
    }
  }

  logui(`Divulged ${setCode}`);
  return setCode;
}

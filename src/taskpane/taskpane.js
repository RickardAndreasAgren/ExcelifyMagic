/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

import { printcellTest, printcell } from '../util/printcell.js';
import {printfield} from '../util/printfield.js';
import printerror from '../util/printui.js';
import { logui } from '../util/printui.js';
import optionText from '../api/optionText.js';
import {
  sortOptionsUpdate,
  buildSelector,
  setOptions,
  initKeepers,
  getSetData,
  setupCard
} from '../api/excelifyapi.js';

var checkBoxes = [];

var sets = [];

var format = 'pioneer';

var newSheet = false;

var selectedFields = {
  cbname: false,
  cbnumber: false,
  cbcolor: false,
  cbcmc: false,
  cbtype: false,
  cbsubtype: false,
  cbstats: false,
};

var checkBoxes = [
  'cbname',
  'cbnumber',
  'cbcolor',
  'cbcmc',
  'cbtype',
  'cbsubtype',
  'cbstats',
];

/******************************************
Importing logic above.

Set up when office application fires onReady.
Define variables and initial procedure and attach
functions to triggers & events.

 dot.html&css file represents active taskpane and
can be targeted by .js from this scope.
******************************************/

Office.onReady(info => {
  if (info.host === Office.HostType.Excel) {
    document.getElementById('sideload-msg').style.display = 'none';
    document.getElementById('app-body').style.display = 'flex';
    document.getElementById('buildset').onclick = renderSetCards;
    document.getElementById('formatselector').onclick = selectFormat;

    sets = setOptions(format)
      .then(options => {
        for (let set = 0; set < options.length; set++) {
          let newOption = document.createElement('option');
          newOption.value = options[set].type;
          newOption.text = options[set].name;
          document.getElementById('setselector').add(newOption, null);
          document.getElementById('setselector').onchange = function() {
            setRows();
          }
        }
        document.getElementById('toberemoved').remove();
        document.getElementById('selectionpoint').innerHTML = '';
        setRows();
        document.getElementById('newsheet').onchange = function() {
          newSheet = document.getElementById('newsheet').checked;
        }
        initKeepers();
        return options;
      })
      .then(options => {
        for (var i = 0; i < checkBoxes.length; i++) {
          let target = Object.assign({}, { name: checkBoxes[i] });
          document.getElementById(target.name).onchange = function() {
            selectedFields[target.name] = !selectedFields[target.name];
            let selections = 2;
            Object.keys(selectedFields).forEach(field => {
              if (selectedFields[field]) {
                selections += 1;}});
            document.getElementById('printcolumns').innerHTML = selections;

            try {
              sortOptionsUpdate(target.name, !!selectedFields[target.name]);
            } catch (error) {
              document.getElementById('errorpoint').innerHTML = JSON.stringify({
                err: error.message,
                stack: error.stack,
              });
            }
          };
        }
        return options;
      })
      .catch(error => {
        document.getElementById('errorpoint').innerHTML =
          'Shit happened: ' + error.message + ' Stack: ' + error.stack;
      });
  }
});

/***************************
Define functions to be used by triggers
***************************/

async function getSelectedProps() {
  let activeProps = [];
  for (let i in selectedFields) {
    if (selectedFields[i]) {
      activeProps.push(i);
    }
  }
  return activeProps;
}

async function buildSet() {
  let setlist = document.getElementById('setselector');
  var activeSet = setlist[setlist.selectedIndex].value;

  return getSelectedProps().then(props => {
    return { set: activeSet, props: props };
  });
}

export async function selectFormat() {
  let formatChoice = document.getElementById('formatselector');
  if (formatChoice.value == 'pioneer') {
    format = 'pioneer';
  } else if (formatChoice.value == 'all') {
    format = 'all';
  }
}

function setRows() {
  let selectedSet = document.getElementById('setselector').value;
  let setData = getSetData(selectedSet, format);
  document.getElementById('printrows').innerHTML = setData.cards.length;
}

export async function renderSetCards() {
  return buildSet()
    .then(data => {
      return Excel.run(function(context) {
        if (newSheet) {
          var sheets = context.workbook.worksheets;

          var sheet = sheets.add(data.set);
          sheet.activate();
          sheet.load('name, position');
          sheet.position = 0;
        }
        return context.sync().then(function() {
          return data;
        });
      });
    })
    .then(data => {
      return { set: getSetData(data.set, format), props: data.props };
    })
    .then(setData => {
      var cardsList = setData.set.cards;
      var setupArray = [];
      let selectedFieldsCount = 0;
      Object.keys(selectedFields).forEach(field => {
        if (selectedFields[field] == true) {
          logui(field);
          selectedFieldsCount += 1;
        }
      })
      if (selectedFieldsCount < 1) {
        throw new Error('No options selected');
      }
      cardsList.forEach(card => {
        setupArray.push(setupCard(card, setData.props, setData.set.name));
      });
      return Promise.all(setupArray)
        .then(results => {
          return results;
        })
        .catch(error => {
          logui('<<<<<<< rejection hit >>>>>>');
          logui(error.message);
          throw error;
        });
    })
    .then(cardArray => {
      logui('---------------------setup complete');
      let pSort = false;
      let sSort = false;
      getSelectedProps().then(props => {
        logui('Sorting next. Options are:');
        logui(props);
        logui('Primary sort is: ');
        logui(document.getElementById('psortactive').checked);
        if (document.getElementById('psortactive').checked) {
          let pVal = document.getElementById('primarysort').value;
          logui(pVal);
          pSort = props.indexOf(pVal);
          logui(pSort);
        }

        logui('Secondary sort is: ');
        logui(document.getElementById('ssortactive').checked);
        if (document.getElementById('ssortactive').checked) {
          let sVal = document.getElementById('secondarysort').value;
          logui(sVal);
          sSort = props.indexOf(sVal);
          logui(sSort);
        }
      });
      return new Promise((resolve, reject) => {
        resolve(
          cardArray.sort((a, b) => {
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
          })
        );
      });
    })
    .then(cardArray => {
      logui('Sorting complete');
      try {
        return getSelectedProps().then(props => {
          let headers = [];
          props.forEach(prop => {
            headers.push(optionText[prop]);
          });
          headers.push('Expansion');
          headers.push('Count');
          cardArray.splice(0, 0, headers);

          let run = Excel.run(async context => {
            logui('Printfield call');
            return await printfield(cardArray, 0, 0, context);
          })
          .catch(error => {
            printerror(error.message);
          });
          return 0;
        });
      } catch (error) {
        logui('<<<<<<< error caught >>>>>>>>');
        logui(error.message);
        let err = Excel.run(async context => {
          var currentWorksheet = context.workbook.worksheets.getActiveWorksheet();
          printcell(error.message, currentWorksheet);
          return context.sync();
        });
        console.error(error);
        throw error;
      }
    })
    .catch(error => {
      if (error.code === 'ItemAlreadyExists') {
        printerror('Worksheet name is occupied.');
      } else {
        printerror(error.message);
      }
    });
}

async function getSelectedPropsHTML() {
  let stringed = '';
  for (let i in selectedFields) {
    stringed += optionText[i] + ':' + selectedFields[i] + ', <br/>';
  }
  return stringed;
}

export async function propsOn() {
  return getSelectedPropsHTML()
    .then(printThis => {
      document.getElementById('selectionpoint').innerHTML = printThis;
      return 0;
    })
    .catch(error => {
      logui(error);
      return 0;
    });
}

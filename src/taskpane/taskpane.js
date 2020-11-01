/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

import { printcellTest, printcell } from '../util/printcell.js';
import printfield from '../util/printfield.js';
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

var selectedFields = {};

var checkBoxes = [];

var sets = [];

var format = 'pioneer';

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
        }
        document.getElementById('toberemoved').remove();
        document.getElementById('selectionpoint').innerHTML = '';
        initKeepers();
        return options;
      })
      .then(options => {
        for (var i = 0; i < checkBoxes.length; i++) {
          let target = Object.assign({}, { name: checkBoxes[i] });
          document.getElementById(target.name).onchange = function() {
            /* Document.getElementById('errorpoint').innerHTML = JSON.stringify(
              target.name
            );*/
            selectedFields[target.name] = !selectedFields[target.name];
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
        /*
        If (error.message === 'string') {
          document.getElementById('errorpoint').innerHTML = error.message;
        } else {
          document.getElementById('errorpoint').innerHTML = JSON.stringify(
            error.message
          );
        }*/
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

export async function renderSetCards() {
  return buildSet()
    .then(data => {
      return Excel.run(function(context) {
        var sheets = context.workbook.worksheets;

        var sheet = sheets.add(data.set);
        sheet.activate();
        sheet.load('name, position');
        sheet.position = 0;
        return context.sync().then(function() {
          logui(
            `Added worksheet named "${sheet.name}" in position ${sheet.position}`
          );
          return data;
        });
      });
    })
    .then(data => {
      return getSetData(data.set)
        .then(setData => {
          let cardsList = setData.cards;

          const cardPromises = [];
          for (let i = 0; i < cardsList.length; i++) {
            cardPromises.push(
              new Promise((resolve, reject) => {
                resolve(setupCard(processedCard, data.props, data.set.name));
              })
            );
          }

          return Promise.all(cardPromises);
        })
        .then(cardArray => {
          let headers = getSelectedProps();
          try {
            let run = Excel.run(async context => {
              var range = context.workbook.getSelectedRange();
              var currentWorksheet = context.workbook.worksheets.getActiveWorksheet();
              let selection = range ? range : currentWorksheet;
              printfield(cardArray, selection, 1, 1, context);
            });
            resolve(run);
          } catch (error) {
            let err = Excel.run(async context => {
              var currentWorksheet = context.workbook.worksheets.getActiveWorksheet();
              printcell(error.message, currentWorksheet);
              return context.sync();
            });
            console.error(error);
            reject(err);
          }
        });
      // Select starting point
      // check length, define range of inserted set
      /******
    }
    */
    })
    .catch(error => {
      if (error.code === 'ItemAlreadyExists') {
        printerror('Worksheet name is occupied.');
      } else {
        printerror(error);
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

export async function testchange() {
  try {
    await Excel.run(async context => {
      var range = context.workbook.getSelectedRange();

      var currentWorksheet = context.workbook.worksheets.getActiveWorksheet();

      await printcell('Fucks sake', currentWorksheet);
      await printcell('Fucks sake too', currentWorksheet, 3, 3);
      await printcell('derp', range, 2, 2, context);

      range.format.borders.getItem('EdgeBottom').style = 'Continuous';
      range.format.borders.getItem('EdgeLeft').style = 'Continuous';
      range.format.borders.getItem('EdgeRight').style = 'Continuous';
      range.format.borders.getItem('EdgeTop').style = 'Continuous';

      range.format.borders.getItem('EdgeBottom').color = 'Blue';
      range.format.borders.getItem('EdgeLeft').color = 'Blue';
      range.format.borders.getItem('EdgeRight').color = 'Blue';
      range.format.borders.getItem('EdgeTop').color = 'Blue';

      return context.sync();
    });
  } catch (error) {
    await Excel.run(async context => {
      var currentWorksheet = context.workbook.worksheets.getActiveWorksheet();
      printcell(error.message, currentWorksheet);
      return context.sync();
    });
    console.error(error);
  }
}

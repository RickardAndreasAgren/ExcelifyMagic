/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

import {printcellTest, printcell} from '../util/printcell.js';
import printui from '../util/printui.js';
import {logui} from '../util/printui.js';
import optionText from '../api/optionText.js';
import {
  sortOptionsUpdate,
  buildSelector,
  setOptions,
  initKeepers
} from '../api/excelifyapi.js';

var selectedFields = {};

var checkBoxes = [];

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
    selectedFields = {
      cbname: false,
      cbnumber: false,
      cbcolor: false,
      cbcmc: false,
      cbtype: false,
      cbsubtype: false,
      cbstats: false,
    };

    checkBoxes = [
      'cbname',
      'cbnumber',
      'cbcolor',
      'cbcmc',
      'cbtype',
      'cbsubtype',
      'cbstats',
    ];
    document.getElementById('sideload-msg').style.display = 'none';
    document.getElementById('app-body').style.display = 'flex';
    document.getElementById('testchange').onclick = testchange;
    document.getElementById('testactives').onclick = propsOn;


    logui('Testing the thing');

    let sets = setOptions()
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
      .then(() => {
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
              document.getElementById('errorpoint').innerHTML = JSON.stringify(
                {err: error.message, stack: error.stack})
            }
          };
        }
        return 0;
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
  let stringed = '';
  for (let i in selectedFields) {
    stringed += optionText[i] + ':' + selectedFields[i] + ', <br/>';
  }
  return stringed;
}

export async function propsOn() {
  return getSelectedProps()
  .then((printThis) => {
    document.getElementById('selectionpoint').innerHTML = printThis;
    return 0;
  })
  .catch(error => {
    logui(error);
    return 0;
  })
}

export async function buildSet() {

}

export async function testchange() {
  try {
    await Excel.run(async context => {
      var range = context.workbook.getSelectedRange();

      var currentWorksheet = context.workbook.worksheets.getActiveWorksheet();

      buildSelector();
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

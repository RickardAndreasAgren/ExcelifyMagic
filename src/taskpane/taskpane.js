/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

import printcell from '../util/printcell.js';
import {buildSelector} from '../api/excelifyapi.js';

Office.onReady(info => {
  if (info.host === Office.HostType.Excel) {
    document.getElementById('sideload-msg').style.display = 'none';
    document.getElementById('app-body').style.display = 'flex';
    document.getElementById('testchange').onclick = testchange;
  }
});

export async function testchange() {
  try {
    await Excel.run(async context => {
      var range = context.workbook.getSelectedRange();

      var currentWorksheet = context.workbook.worksheets.getActiveWorksheet();

      buildSelector();
      await printcell('Fucks sake', currentWorksheet)
      await printcell('Fucks sake too', currentWorksheet, 3, 3)
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

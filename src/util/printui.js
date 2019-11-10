
async function printui(msg) {
  var toPrint = '';
  if (typeof msg !== 'string') {
    toPrint = JSON.stringify(msg);
  } else {
    toPrint = msg;
  }

  document.getElementById('errorpoint').innerHTML = toPrint;
  return 0;
}

export async function logui(msg) {

  let existing = document.getElementById('logpoint').innerHTML;
  var toPrint = '';
  if (typeof msg !== 'string') {
    toPrint = JSON.stringify(msg);
  } else {
    toPrint = msg;
  }

  toPrint = existing + ' \n ' + toPrint;

  document.getElementById('logpoint').innerHTML = toPrint;
  return 0;
}

export default printui;

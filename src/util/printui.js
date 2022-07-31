
export async function printerror(msg) {
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

  let currentText = document.getElementById('logpoint').innerHTML;
  let existing = currentText ? currentText : "";
  var toPrint = '';
  if (typeof msg !== 'string') {
    toPrint = JSON.stringify(msg);
  } else {
    toPrint = msg;
  }

  console.log(toPrint);

  toPrint = existing + toPrint + '</br>';

  document.getElementById('logpoint').innerHTML = toPrint;
  return 0;
}

export default printerror;


// for counted calls, use -1 before calling for index offset
export async function numberToLetters(num) {
  let letters = '';
  while (num >= 0) {
    letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[num % 26] + letters;
    num = Math.floor(num / 26) - 1;
  }
  return letters;
}

export async function lettersToNumber(letters) {
  for (var p = 0, n = 0; p < letters.length; p++) {
    n = letters[p].charCodeAt() - 64 + n * 26;
  }
  return n;
}

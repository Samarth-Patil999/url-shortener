const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * WHY Base62: URL-safe characters only (no +, /, =).
 * WHY auto-increment ID as input: guarantees uniqueness — no collision possible.
 * 7 chars = 62^7 = 3.5 trillion unique URLs. Bitly-scale ke liye enough.
 */
function encode(num) {
  if (num === 0) return BASE62[0].padStart(7, '0');
  let result = '';
  while (num > 0) {
    result = BASE62[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result.padStart(7, '0');
}

function decode(str) {
  let num = 0;
  for (const char of str) {
    num = num * 62 + BASE62.indexOf(char);
  }
  return num;
}

module.exports = { encode, decode };

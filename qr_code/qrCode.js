// TODO:
// input length check to see if there's enough space in the QR matrix to support the input

// https://www.thonky.com/qr-code-tutorial/introduction
// https://www.qrcode.com/en/about/version.html

// tables

// https://www.thonky.com/qr-code-tutorial/character-capacities
// map QR version to error correction level + max char capacity
const characterCapacities = {
  1: {
    "L": 17, // only assuming byte mode atm
    "M": 14,
    "Q": 11,
    "H": 7,
  },
  2: {
    "L": 32,
    "M": 26,
    "Q": 20,
    "H": 14,
  },
  3: {
    "L": 53,
    "M": 42,
    "Q": 32,
    "H": 24,
  },
  4: {
    "L": 78,
    "M": 62,
    "Q": 46,
    "H": 34,
  },
  5: {
    "L": 106,
    "M": 84,
    "Q": 60,
    "H": 44,
  },
  6: {
    "L": 134,
    "M": 106,
    "Q": 74,
    "H": 58,
  },
  7: {
    "L": 154,
    "M": 122,
    "Q": 86,
    "H": 64,
  },
  8: {
    "L": 192,
    "M": 152,
    "Q": 108,
    "H": 84,
  },
  9: {
    "L": 230,
    "M": 180,
    "Q": 130,
    "H": 98,
  },
  10: {
    "L": 271,
    "M": 213,
    "Q": 151,
    "H": 119,
  },
  11: {
    "L": 321,
    "M": 251,
    "Q": 177,
    "H": 137,
  },
  12: {
    "L": 367,
    "M": 287,
    "Q": 203,
    "H": 155,
  },
  13: {
    "L": 425,
    "M": 331,
    "Q": 241,
    "H": 177,
  },
  14: {
    "L": 458,
    "M": 362,
    "Q": 258,
    "H": 194,
  },
  15: {
    "L": 520,
    "M": 412,
    "Q": 292,
    "H": 220,
  },
  16: {
    "L": 586,
    "M": 450,
    "Q": 322,
    "H": 250,
  },
  17: {
    "L": 644,
    "M": 504,
    "Q": 364,
    "H": 280,
  },
  18: {
    "L": 718,
    "M": 560,
    "Q": 394,
    "H": 310,
  },
  19: {
    "L": 792,
    "M": 624,
    "Q": 442,
    "H": 338,
  },
  20: {
    "L": 858,
    "M": 666,
    "Q": 482,
    "H": 382,
  },
  21: {
    "L": 929,
    "M": 711,
    "Q": 509,
    "H": 403,
  },
  22: {
    "L": 1003,
    "M": 779,
    "Q": 565,
    "H": 439,
  },
  23: {
    "L": 1091,
    "M": 857,
    "Q": 611,
    "H": 461,
  },
  24: {
    "L": 1171,
    "M": 911,
    "Q": 661,
    "H": 511,
  },
  25: {
    "L": 1273,
    "M": 997,
    "Q": 715,
    "H": 535,
  },
  26: {
    "L": 1367,
    "M": 1059,
    "Q": 751,
    "H": 593,
  },
  27: {
    "L": 1465,
    "M": 1125,
    "Q": 805,
    "H": 625,
  },
  28: {
    "L": 1528,
    "M": 1190,
    "Q": 868,
    "H": 658,
  },
  29: {
    "L": 1628,
    "M": 1264,
    "Q": 908,
    "H": 698,
  },
  30: {
    "L": 1732,
    "M": 1370,
    "Q": 982,
    "H": 742,
  },
  31: {
    "L": 1840,
    "M": 1452,
    "Q": 1030,
    "H": 790,
  },
  32: {
    "L": 1952,
    "M": 1538,
    "Q": 112,
    "H": 842,
  },
  33: {
    "L": 2068,
    "M": 1628,
    "Q": 1168,
    "H": 898,
  },
  34: {
    "L": 2188,
    "M": 1722,
    "Q": 1228,
    "H": 958,
  },
  35: {
    "L": 2303,
    "M": 1809,
    "Q": 1283,
    "H": 983,
  },
  36: {
    "L": 2431,
    "M": 1911,
    "Q": 1351,
    "H": 1051,
  },
  37: {
    "L": 2563,
    "M": 1989,
    "Q": 1423,
    "H": 1093,
  },
  38: {
    "L": 2699,
    "M": 2099,
    "Q": 1499,
    "H": 1139,
  },
  39: {
    "L": 2809,
    "M": 2213,
    "Q": 1579,
    "H": 1219,
  },
  40: {
    "L": 2953,
    "M": 2331,
    "Q": 1663,
    "H": 1273,
  },
};

// TODO: add error correction table
// atm we only care about level M for error correction
const errorCorrectionTable = {
  "1M": {
    "totalDataCodewords": 16,
    "ecCodewordsPerBlock": 10,
    "numBlocksGroup1": 1,
    "numDataCodewordsPerGroup1Block": 16,
    "numBlocksGroup2": 0,
    "numDataCodewordsPerGroup2Block": 0,
  },
  "2M": {
    "totalDataCodewords": 28,
    "ecCodewordsPerBlock": 16,
    "numBlocksGroup1": 1,
    "numDataCodewordsPerGroup1Block": 28,
    "numBlocksGroup2": 0,
    "numDataCodewordsPerGroup2Block": 0,
  },
  "3M": {
    "totalDataCodewords": 44,
    "ecCodewordsPerBlock": 26,
    "numBlocksGroup1": 1,
    "numDataCodewordsPerGroup1Block": 44,
    "numBlocksGroup2": 0,
    "numDataCodewordsPerGroup2Block": 0,
  },
  "4M": {
    "totalDataCodewords": 64,
    "ecCodewordsPerBlock": 18,
    "numBlocksGroup1": 2,
    "numDataCodewordsPerGroup1Block": 32,
    "numBlocksGroup2": 0,
    "numDataCodewordsPerGroup2Block": 0,
  },
  "5M": {
    "totalDataCodewords": 86,
    "ecCodewordsPerBlock": 24,
    "numBlocksGroup1": 2,
    "numDataCodewordsPerGroup1Block": 43,
    "numBlocksGroup2": 0,
    "numDataCodewordsPerGroup2Block": 0,
  },
  "6M": {
    "totalDataCodewords": 108,
    "ecCodewordsPerBlock": 16,
    "numBlocksGroup1": 4,
    "numDataCodewordsPerGroup1Block": 27,
    "numBlocksGroup2": 0,
    "numDataCodewordsPerGroup2Block": 0,
  },
  "7M": {
    "totalDataCodewords": 124,
    "ecCodewordsPerBlock": 18,
    "numBlocksGroup1": 4,
    "numDataCodewordsPerGroup1Block": 31,
    "numBlocksGroup2": 0,
    "numDataCodewordsPerGroup2Block": 0,
  },
  "8M": {
    "totalDataCodewords": 154,
    "ecCodewordsPerBlock": 22,
    "numBlocksGroup1": 2,
    "numDataCodewordsPerGroup1Block": 38,
    "numBlocksGroup2": 2,
    "numDataCodewordsPerGroup2Block": 39,
  },
  "9M": {
    "totalDataCodewords": 182,
    "ecCodewordsPerBlock": 22,
    "numBlocksGroup1": 3,
    "numDataCodewordsPerGroup1Block": 36,
    "numBlocksGroup2": 2,
    "numDataCodewordsPerGroup2Block": 37,
  },
  "10M": {
    "totalDataCodewords": 216,
    "ecCodewordsPerBlock": 26,
    "numBlocksGroup1": 4,
    "numDataCodewordsPerGroup1Block": 43,
    "numBlocksGroup2": 1,
    "numDataCodewordsPerGroup2Block": 44,
  },
  "11M": {
    "totalDataCodewords": 254,
    "ecCodewordsPerBlock": 30,
    "numBlocksGroup1": 1,
    "numDataCodewordsPerGroup1Block": 50,
    "numBlocksGroup2": 4,
    "numDataCodewordsPerGroup2Block": 51,
  },
  "12M": {
    "totalDataCodewords": 290,
    "ecCodewordsPerBlock": 22,
    "numBlocksGroup1": 6,
    "numDataCodewordsPerGroup1Block": 36,
    "numBlocksGroup2": 2,
    "numDataCodewordsPerGroup2Block": 37,
  },
  "13M": {
    "totalDataCodewords": 334,
    "ecCodewordsPerBlock": 22,
    "numBlocksGroup1": 8,
    "numDataCodewordsPerGroup1Block": 37,
    "numBlocksGroup2": 1,
    "numDataCodewordsPerGroup2Block": 38,
  },
  "14M": {
    "totalDataCodewords": 365,
    "ecCodewordsPerBlock": 24,
    "numBlocksGroup1": 4,
    "numDataCodewordsPerGroup1Block": 40,
    "numBlocksGroup2": 5,
    "numDataCodewordsPerGroup2Block": 41,
  },
  "15M": {
    "totalDataCodewords": 415,
    "ecCodewordsPerBlock": 24,
    "numBlocksGroup1": 5,
    "numDataCodewordsPerGroup1Block": 41,
    "numBlocksGroup2": 5,
    "numDataCodewordsPerGroup2Block": 42,
  },
  "16M": {
    "totalDataCodewords": 453,
    "ecCodewordsPerBlock": 28,
    "numBlocksGroup1": 7,
    "numDataCodewordsPerGroup1Block": 45,
    "numBlocksGroup2": 3,
    "numDataCodewordsPerGroup2Block": 46,
  },
  "17M": {
    "totalDataCodewords": 507,
    "ecCodewordsPerBlock": 28,
    "numBlocksGroup1": 10,
    "numDataCodewordsPerGroup1Block": 46,
    "numBlocksGroup2": 1,
    "numDataCodewordsPerGroup2Block": 47,
  },
  "18M": {
    "totalDataCodewords": 563,
    "ecCodewordsPerBlock": 26,
    "numBlocksGroup1": 9,
    "numDataCodewordsPerGroup1Block": 43,
    "numBlocksGroup2": 4,
    "numDataCodewordsPerGroup2Block": 44,
  },
  "19M": {
    "totalDataCodewords": 627,
    "ecCodewordsPerBlock": 26,
    "numBlocksGroup1": 3,
    "numDataCodewordsPerGroup1Block": 44,
    "numBlocksGroup2": 11,
    "numDataCodewordsPerGroup2Block": 45,
  },
  "20M": {
    "totalDataCodewords": 669,
    "ecCodewordsPerBlock": 26,
    "numBlocksGroup1": 3,
    "numDataCodewordsPerGroup1Block": 41,
    "numBlocksGroup2": 13,
    "numDataCodewordsPerGroup2Block": 42,
  },
  "21M": {
    "totalDataCodewords": 714,
    "ecCodewordsPerBlock": 26,
    "numBlocksGroup1": 17,
    "numDataCodewordsPerGroup1Block": 42,
    "numBlocksGroup2": 0,
    "numDataCodewordsPerGroup2Block": 0,
  },
  "22M": {
    "totalDataCodewords": 782,
    "ecCodewordsPerBlock": 28,
    "numBlocksGroup1": 17,
    "numDataCodewordsPerGroup1Block": 46,
    "numBlocksGroup2": 0,
    "numDataCodewordsPerGroup2Block": 0,
  },
  "23M": {
    "totalDataCodewords": 860,
    "ecCodewordsPerBlock": 28,
    "numBlocksGroup1": 4,
    "numDataCodewordsPerGroup1Block": 47,
    "numBlocksGroup2": 14,
    "numDataCodewordsPerGroup2Block": 48,
  },
  "24M": {
    "totalDataCodewords": 860,
    "ecCodewordsPerBlock": 28,
    "numBlocksGroup1": 4,
    "numDataCodewordsPerGroup1Block": 47,
    "numBlocksGroup2": 14,
    "numDataCodewordsPerGroup2Block": 48,
  },
  "25M": {
    "totalDataCodewords": 1000,
    "ecCodewordsPerBlock": 28,
    "numBlocksGroup1": 8,
    "numDataCodewordsPerGroup1Block": 47,
    "numBlocksGroup2": 13,
    "numDataCodewordsPerGroup2Block": 48,
  },
  "26M": {
    "totalDataCodewords": 1062,
    "ecCodewordsPerBlock": 28,
    "numBlocksGroup1": 19,
    "numDataCodewordsPerGroup1Block": 46,
    "numBlocksGroup2": 4,
    "numDataCodewordsPerGroup2Block": 47,
  },
  "27M": {
    "totalDataCodewords": 1128,
    "ecCodewordsPerBlock": 28,
    "numBlocksGroup1": 22,
    "numDataCodewordsPerGroup1Block": 45,
    "numBlocksGroup2": 3,
    "numDataCodewordsPerGroup2Block": 46,
  },
  "28M": {
    "totalDataCodewords": 1193,
    "ecCodewordsPerBlock": 28,
    "numBlocksGroup1": 3,
    "numDataCodewordsPerGroup1Block": 45,
    "numBlocksGroup2": 23,
    "numDataCodewordsPerGroup2Block": 46,
  },
  "29M": {
    "totalDataCodewords": 1267,
    "ecCodewordsPerBlock": 28,
    "numBlocksGroup1": 21,
    "numDataCodewordsPerGroup1Block": 45,
    "numBlocksGroup2": 7,
    "numDataCodewordsPerGroup2Block": 46,
  },
  "30M": {
    "totalDataCodewords": 1373,
    "ecCodewordsPerBlock": 28,
    "numBlocksGroup1": 19,
    "numDataCodewordsPerGroup1Block": 47,
    "numBlocksGroup2": 10,
    "numDataCodewordsPerGroup2Block": 116,
  },
  "31M": {
    "totalDataCodewords": 1455,
    "ecCodewordsPerBlock": 28,
    "numBlocksGroup1": 2,
    "numDataCodewordsPerGroup1Block": 46,
    "numBlocksGroup2": 29,
    "numDataCodewordsPerGroup2Block": 47,
  },
  "32M": {
    "totalDataCodewords": 1541,
    "ecCodewordsPerBlock": 28,
    "numBlocksGroup1": 10,
    "numDataCodewordsPerGroup1Block": 46,
    "numBlocksGroup2": 23,
    "numDataCodewordsPerGroup2Block": 47,
  },
  "33M": {
    "totalDataCodewords": 1631,
    "ecCodewordsPerBlock": 28,
    "numBlocksGroup1": 14,
    "numDataCodewordsPerGroup1Block": 46,
    "numBlocksGroup2": 21,
    "numDataCodewordsPerGroup2Block": 47,
  },
  "34M": {
    "totalDataCodewords": 1725,
    "ecCodewordsPerBlock": 28,
    "numBlocksGroup1": 14,
    "numDataCodewordsPerGroup1Block": 46,
    "numBlocksGroup2": 23,
    "numDataCodewordsPerGroup2Block": 47,
  },
  "35M": {
    "totalDataCodewords": 1812,
    "ecCodewordsPerBlock": 28,
    "numBlocksGroup1": 12,
    "numDataCodewordsPerGroup1Block": 47,
    "numBlocksGroup2": 26,
    "numDataCodewordsPerGroup2Block": 48,
  },
  "36M": {
    "totalDataCodewords": 1914,
    "ecCodewordsPerBlock": 28,
    "numBlocksGroup1": 6,
    "numDataCodewordsPerGroup1Block": 47,
    "numBlocksGroup2": 34,
    "numDataCodewordsPerGroup2Block": 48,
  },
  "37M": {
    "totalDataCodewords": 1992,
    "ecCodewordsPerBlock": 28,
    "numBlocksGroup1": 29,
    "numDataCodewordsPerGroup1Block": 46,
    "numBlocksGroup2": 14,
    "numDataCodewordsPerGroup2Block": 47,
  },
  "38M": {
    "totalDataCodewords": 2102,
    "ecCodewordsPerBlock": 28,
    "numBlocksGroup1": 13,
    "numDataCodewordsPerGroup1Block": 46,
    "numBlocksGroup2": 32,
    "numDataCodewordsPerGroup2Block": 47,
  },
  "39M": {
    "totalDataCodewords": 2216,
    "ecCodewordsPerBlock": 28,
    "numBlocksGroup1": 40,
    "numDataCodewordsPerGroup1Block": 47,
    "numBlocksGroup2": 7,
    "numDataCodewordsPerGroup2Block": 48,
  },
  "40M": {
    "totalDataCodewords": 2334,
    "ecCodewordsPerBlock": 28,
    "numBlocksGroup1": 18,
    "numDataCodewordsPerGroup1Block": 47,
    "numBlocksGroup2": 31,
    "numDataCodewordsPerGroup2Block": 48,
  }
};

// https://www.thonky.com/qr-code-tutorial/log-antilog-table
/* 
// copy table values in https://www.thonky.com/qr-code-tutorial/log-antilog-table
const table = document.querySelectorAll('.table')[0];

const data = [];

let counter = 0;
Array.from(table.children[0].children).forEach(row => {
  // if counter === 0, skip cause that's just the table headers
  if(counter > 0){
    const dataCols = row.children;
    const exponent_of_alpha = parseInt(dataCols[0].textContent);
    const power_of_2_gf_256 = parseInt(dataCols[1].textContent); // power of n in GF(256)
    const integer = parseInt(dataCols[3].textContent);
    const antilog = parseInt(dataCols[4].textContent); // TODO: not sure I understand what these values actually mean, need to re-read
    data.push({
      "exponent_of_alpha": exponent_of_alpha,
      "power_of_2_gf_256": power_of_2_gf_256,
      "integer": integer,
      "antilog": antilog,
    });
  }
  counter++;
});

//console.log(data);
const exportData = JSON.stringify(data, null, 2);
const blob = new Blob([exportData], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
document.body.appendChild(a);
a.click();
*/
// this table was generated with the above code in the dev console
const logAntilogTable = [
  {
    "exponent_of_alpha": 0,
    "power_of_2_gf_256": 1,
    "integer": null,
    "antilog": null
  },
  {
    "exponent_of_alpha": 1,
    "power_of_2_gf_256": 2,
    "integer": 1,
    "antilog": 0
  },
  {
    "exponent_of_alpha": 2,
    "power_of_2_gf_256": 4,
    "integer": 2,
    "antilog": 1
  },
  {
    "exponent_of_alpha": 3,
    "power_of_2_gf_256": 8,
    "integer": 3,
    "antilog": 25
  },
  {
    "exponent_of_alpha": 4,
    "power_of_2_gf_256": 16,
    "integer": 4,
    "antilog": 2
  },
  {
    "exponent_of_alpha": 5,
    "power_of_2_gf_256": 32,
    "integer": 5,
    "antilog": 50
  },
  {
    "exponent_of_alpha": 6,
    "power_of_2_gf_256": 64,
    "integer": 6,
    "antilog": 26
  },
  {
    "exponent_of_alpha": 7,
    "power_of_2_gf_256": 128,
    "integer": 7,
    "antilog": 198
  },
  {
    "exponent_of_alpha": 8,
    "power_of_2_gf_256": 29,
    "integer": 8,
    "antilog": 3
  },
  {
    "exponent_of_alpha": 9,
    "power_of_2_gf_256": 58,
    "integer": 9,
    "antilog": 223
  },
  {
    "exponent_of_alpha": 10,
    "power_of_2_gf_256": 116,
    "integer": 10,
    "antilog": 51
  },
  {
    "exponent_of_alpha": 11,
    "power_of_2_gf_256": 232,
    "integer": 11,
    "antilog": 238
  },
  {
    "exponent_of_alpha": 12,
    "power_of_2_gf_256": 205,
    "integer": 12,
    "antilog": 27
  },
  {
    "exponent_of_alpha": 13,
    "power_of_2_gf_256": 135,
    "integer": 13,
    "antilog": 104
  },
  {
    "exponent_of_alpha": 14,
    "power_of_2_gf_256": 19,
    "integer": 14,
    "antilog": 199
  },
  {
    "exponent_of_alpha": 15,
    "power_of_2_gf_256": 38,
    "integer": 15,
    "antilog": 75
  },
  {
    "exponent_of_alpha": 16,
    "power_of_2_gf_256": 76,
    "integer": 16,
    "antilog": 4
  },
  {
    "exponent_of_alpha": 17,
    "power_of_2_gf_256": 152,
    "integer": 17,
    "antilog": 100
  },
  {
    "exponent_of_alpha": 18,
    "power_of_2_gf_256": 45,
    "integer": 18,
    "antilog": 224
  },
  {
    "exponent_of_alpha": 19,
    "power_of_2_gf_256": 90,
    "integer": 19,
    "antilog": 14
  },
  {
    "exponent_of_alpha": 20,
    "power_of_2_gf_256": 180,
    "integer": 20,
    "antilog": 52
  },
  {
    "exponent_of_alpha": 21,
    "power_of_2_gf_256": 117,
    "integer": 21,
    "antilog": 141
  },
  {
    "exponent_of_alpha": 22,
    "power_of_2_gf_256": 234,
    "integer": 22,
    "antilog": 239
  },
  {
    "exponent_of_alpha": 23,
    "power_of_2_gf_256": 201,
    "integer": 23,
    "antilog": 129
  },
  {
    "exponent_of_alpha": 24,
    "power_of_2_gf_256": 143,
    "integer": 24,
    "antilog": 28
  },
  {
    "exponent_of_alpha": 25,
    "power_of_2_gf_256": 3,
    "integer": 25,
    "antilog": 193
  },
  {
    "exponent_of_alpha": 26,
    "power_of_2_gf_256": 6,
    "integer": 26,
    "antilog": 105
  },
  {
    "exponent_of_alpha": 27,
    "power_of_2_gf_256": 12,
    "integer": 27,
    "antilog": 248
  },
  {
    "exponent_of_alpha": 28,
    "power_of_2_gf_256": 24,
    "integer": 28,
    "antilog": 200
  },
  {
    "exponent_of_alpha": 29,
    "power_of_2_gf_256": 48,
    "integer": 29,
    "antilog": 8
  },
  {
    "exponent_of_alpha": 30,
    "power_of_2_gf_256": 96,
    "integer": 30,
    "antilog": 76
  },
  {
    "exponent_of_alpha": 31,
    "power_of_2_gf_256": 192,
    "integer": 31,
    "antilog": 113
  },
  {
    "exponent_of_alpha": 32,
    "power_of_2_gf_256": 157,
    "integer": 32,
    "antilog": 5
  },
  {
    "exponent_of_alpha": 33,
    "power_of_2_gf_256": 39,
    "integer": 33,
    "antilog": 138
  },
  {
    "exponent_of_alpha": 34,
    "power_of_2_gf_256": 78,
    "integer": 34,
    "antilog": 101
  },
  {
    "exponent_of_alpha": 35,
    "power_of_2_gf_256": 156,
    "integer": 35,
    "antilog": 47
  },
  {
    "exponent_of_alpha": 36,
    "power_of_2_gf_256": 37,
    "integer": 36,
    "antilog": 225
  },
  {
    "exponent_of_alpha": 37,
    "power_of_2_gf_256": 74,
    "integer": 37,
    "antilog": 36
  },
  {
    "exponent_of_alpha": 38,
    "power_of_2_gf_256": 148,
    "integer": 38,
    "antilog": 15
  },
  {
    "exponent_of_alpha": 39,
    "power_of_2_gf_256": 53,
    "integer": 39,
    "antilog": 33
  },
  {
    "exponent_of_alpha": 40,
    "power_of_2_gf_256": 106,
    "integer": 40,
    "antilog": 53
  },
  {
    "exponent_of_alpha": 41,
    "power_of_2_gf_256": 212,
    "integer": 41,
    "antilog": 147
  },
  {
    "exponent_of_alpha": 42,
    "power_of_2_gf_256": 181,
    "integer": 42,
    "antilog": 142
  },
  {
    "exponent_of_alpha": 43,
    "power_of_2_gf_256": 119,
    "integer": 43,
    "antilog": 218
  },
  {
    "exponent_of_alpha": 44,
    "power_of_2_gf_256": 238,
    "integer": 44,
    "antilog": 240
  },
  {
    "exponent_of_alpha": 45,
    "power_of_2_gf_256": 193,
    "integer": 45,
    "antilog": 18
  },
  {
    "exponent_of_alpha": 46,
    "power_of_2_gf_256": 159,
    "integer": 46,
    "antilog": 130
  },
  {
    "exponent_of_alpha": 47,
    "power_of_2_gf_256": 35,
    "integer": 47,
    "antilog": 69
  },
  {
    "exponent_of_alpha": 48,
    "power_of_2_gf_256": 70,
    "integer": 48,
    "antilog": 29
  },
  {
    "exponent_of_alpha": 49,
    "power_of_2_gf_256": 140,
    "integer": 49,
    "antilog": 181
  },
  {
    "exponent_of_alpha": 50,
    "power_of_2_gf_256": 5,
    "integer": 50,
    "antilog": 194
  },
  {
    "exponent_of_alpha": 51,
    "power_of_2_gf_256": 10,
    "integer": 51,
    "antilog": 125
  },
  {
    "exponent_of_alpha": 52,
    "power_of_2_gf_256": 20,
    "integer": 52,
    "antilog": 106
  },
  {
    "exponent_of_alpha": 53,
    "power_of_2_gf_256": 40,
    "integer": 53,
    "antilog": 39
  },
  {
    "exponent_of_alpha": 54,
    "power_of_2_gf_256": 80,
    "integer": 54,
    "antilog": 249
  },
  {
    "exponent_of_alpha": 55,
    "power_of_2_gf_256": 160,
    "integer": 55,
    "antilog": 185
  },
  {
    "exponent_of_alpha": 56,
    "power_of_2_gf_256": 93,
    "integer": 56,
    "antilog": 201
  },
  {
    "exponent_of_alpha": 57,
    "power_of_2_gf_256": 186,
    "integer": 57,
    "antilog": 154
  },
  {
    "exponent_of_alpha": 58,
    "power_of_2_gf_256": 105,
    "integer": 58,
    "antilog": 9
  },
  {
    "exponent_of_alpha": 59,
    "power_of_2_gf_256": 210,
    "integer": 59,
    "antilog": 120
  },
  {
    "exponent_of_alpha": 60,
    "power_of_2_gf_256": 185,
    "integer": 60,
    "antilog": 77
  },
  {
    "exponent_of_alpha": 61,
    "power_of_2_gf_256": 111,
    "integer": 61,
    "antilog": 228
  },
  {
    "exponent_of_alpha": 62,
    "power_of_2_gf_256": 222,
    "integer": 62,
    "antilog": 114
  },
  {
    "exponent_of_alpha": 63,
    "power_of_2_gf_256": 161,
    "integer": 63,
    "antilog": 166
  },
  {
    "exponent_of_alpha": 64,
    "power_of_2_gf_256": 95,
    "integer": 64,
    "antilog": 6
  },
  {
    "exponent_of_alpha": 65,
    "power_of_2_gf_256": 190,
    "integer": 65,
    "antilog": 191
  },
  {
    "exponent_of_alpha": 66,
    "power_of_2_gf_256": 97,
    "integer": 66,
    "antilog": 139
  },
  {
    "exponent_of_alpha": 67,
    "power_of_2_gf_256": 194,
    "integer": 67,
    "antilog": 98
  },
  {
    "exponent_of_alpha": 68,
    "power_of_2_gf_256": 153,
    "integer": 68,
    "antilog": 102
  },
  {
    "exponent_of_alpha": 69,
    "power_of_2_gf_256": 47,
    "integer": 69,
    "antilog": 221
  },
  {
    "exponent_of_alpha": 70,
    "power_of_2_gf_256": 94,
    "integer": 70,
    "antilog": 48
  },
  {
    "exponent_of_alpha": 71,
    "power_of_2_gf_256": 188,
    "integer": 71,
    "antilog": 253
  },
  {
    "exponent_of_alpha": 72,
    "power_of_2_gf_256": 101,
    "integer": 72,
    "antilog": 226
  },
  {
    "exponent_of_alpha": 73,
    "power_of_2_gf_256": 202,
    "integer": 73,
    "antilog": 152
  },
  {
    "exponent_of_alpha": 74,
    "power_of_2_gf_256": 137,
    "integer": 74,
    "antilog": 37
  },
  {
    "exponent_of_alpha": 75,
    "power_of_2_gf_256": 15,
    "integer": 75,
    "antilog": 179
  },
  {
    "exponent_of_alpha": 76,
    "power_of_2_gf_256": 30,
    "integer": 76,
    "antilog": 16
  },
  {
    "exponent_of_alpha": 77,
    "power_of_2_gf_256": 60,
    "integer": 77,
    "antilog": 145
  },
  {
    "exponent_of_alpha": 78,
    "power_of_2_gf_256": 120,
    "integer": 78,
    "antilog": 34
  },
  {
    "exponent_of_alpha": 79,
    "power_of_2_gf_256": 240,
    "integer": 79,
    "antilog": 136
  },
  {
    "exponent_of_alpha": 80,
    "power_of_2_gf_256": 253,
    "integer": 80,
    "antilog": 54
  },
  {
    "exponent_of_alpha": 81,
    "power_of_2_gf_256": 231,
    "integer": 81,
    "antilog": 208
  },
  {
    "exponent_of_alpha": 82,
    "power_of_2_gf_256": 211,
    "integer": 82,
    "antilog": 148
  },
  {
    "exponent_of_alpha": 83,
    "power_of_2_gf_256": 187,
    "integer": 83,
    "antilog": 206
  },
  {
    "exponent_of_alpha": 84,
    "power_of_2_gf_256": 107,
    "integer": 84,
    "antilog": 143
  },
  {
    "exponent_of_alpha": 85,
    "power_of_2_gf_256": 214,
    "integer": 85,
    "antilog": 150
  },
  {
    "exponent_of_alpha": 86,
    "power_of_2_gf_256": 177,
    "integer": 86,
    "antilog": 219
  },
  {
    "exponent_of_alpha": 87,
    "power_of_2_gf_256": 127,
    "integer": 87,
    "antilog": 189
  },
  {
    "exponent_of_alpha": 88,
    "power_of_2_gf_256": 254,
    "integer": 88,
    "antilog": 241
  },
  {
    "exponent_of_alpha": 89,
    "power_of_2_gf_256": 225,
    "integer": 89,
    "antilog": 210
  },
  {
    "exponent_of_alpha": 90,
    "power_of_2_gf_256": 223,
    "integer": 90,
    "antilog": 19
  },
  {
    "exponent_of_alpha": 91,
    "power_of_2_gf_256": 163,
    "integer": 91,
    "antilog": 92
  },
  {
    "exponent_of_alpha": 92,
    "power_of_2_gf_256": 91,
    "integer": 92,
    "antilog": 131
  },
  {
    "exponent_of_alpha": 93,
    "power_of_2_gf_256": 182,
    "integer": 93,
    "antilog": 56
  },
  {
    "exponent_of_alpha": 94,
    "power_of_2_gf_256": 113,
    "integer": 94,
    "antilog": 70
  },
  {
    "exponent_of_alpha": 95,
    "power_of_2_gf_256": 226,
    "integer": 95,
    "antilog": 64
  },
  {
    "exponent_of_alpha": 96,
    "power_of_2_gf_256": 217,
    "integer": 96,
    "antilog": 30
  },
  {
    "exponent_of_alpha": 97,
    "power_of_2_gf_256": 175,
    "integer": 97,
    "antilog": 66
  },
  {
    "exponent_of_alpha": 98,
    "power_of_2_gf_256": 67,
    "integer": 98,
    "antilog": 182
  },
  {
    "exponent_of_alpha": 99,
    "power_of_2_gf_256": 134,
    "integer": 99,
    "antilog": 163
  },
  {
    "exponent_of_alpha": 100,
    "power_of_2_gf_256": 17,
    "integer": 100,
    "antilog": 195
  },
  {
    "exponent_of_alpha": 101,
    "power_of_2_gf_256": 34,
    "integer": 101,
    "antilog": 72
  },
  {
    "exponent_of_alpha": 102,
    "power_of_2_gf_256": 68,
    "integer": 102,
    "antilog": 126
  },
  {
    "exponent_of_alpha": 103,
    "power_of_2_gf_256": 136,
    "integer": 103,
    "antilog": 110
  },
  {
    "exponent_of_alpha": 104,
    "power_of_2_gf_256": 13,
    "integer": 104,
    "antilog": 107
  },
  {
    "exponent_of_alpha": 105,
    "power_of_2_gf_256": 26,
    "integer": 105,
    "antilog": 58
  },
  {
    "exponent_of_alpha": 106,
    "power_of_2_gf_256": 52,
    "integer": 106,
    "antilog": 40
  },
  {
    "exponent_of_alpha": 107,
    "power_of_2_gf_256": 104,
    "integer": 107,
    "antilog": 84
  },
  {
    "exponent_of_alpha": 108,
    "power_of_2_gf_256": 208,
    "integer": 108,
    "antilog": 250
  },
  {
    "exponent_of_alpha": 109,
    "power_of_2_gf_256": 189,
    "integer": 109,
    "antilog": 133
  },
  {
    "exponent_of_alpha": 110,
    "power_of_2_gf_256": 103,
    "integer": 110,
    "antilog": 186
  },
  {
    "exponent_of_alpha": 111,
    "power_of_2_gf_256": 206,
    "integer": 111,
    "antilog": 61
  },
  {
    "exponent_of_alpha": 112,
    "power_of_2_gf_256": 129,
    "integer": 112,
    "antilog": 202
  },
  {
    "exponent_of_alpha": 113,
    "power_of_2_gf_256": 31,
    "integer": 113,
    "antilog": 94
  },
  {
    "exponent_of_alpha": 114,
    "power_of_2_gf_256": 62,
    "integer": 114,
    "antilog": 155
  },
  {
    "exponent_of_alpha": 115,
    "power_of_2_gf_256": 124,
    "integer": 115,
    "antilog": 159
  },
  {
    "exponent_of_alpha": 116,
    "power_of_2_gf_256": 248,
    "integer": 116,
    "antilog": 10
  },
  {
    "exponent_of_alpha": 117,
    "power_of_2_gf_256": 237,
    "integer": 117,
    "antilog": 21
  },
  {
    "exponent_of_alpha": 118,
    "power_of_2_gf_256": 199,
    "integer": 118,
    "antilog": 121
  },
  {
    "exponent_of_alpha": 119,
    "power_of_2_gf_256": 147,
    "integer": 119,
    "antilog": 43
  },
  {
    "exponent_of_alpha": 120,
    "power_of_2_gf_256": 59,
    "integer": 120,
    "antilog": 78
  },
  {
    "exponent_of_alpha": 121,
    "power_of_2_gf_256": 118,
    "integer": 121,
    "antilog": 212
  },
  {
    "exponent_of_alpha": 122,
    "power_of_2_gf_256": 236,
    "integer": 122,
    "antilog": 229
  },
  {
    "exponent_of_alpha": 123,
    "power_of_2_gf_256": 197,
    "integer": 123,
    "antilog": 172
  },
  {
    "exponent_of_alpha": 124,
    "power_of_2_gf_256": 151,
    "integer": 124,
    "antilog": 115
  },
  {
    "exponent_of_alpha": 125,
    "power_of_2_gf_256": 51,
    "integer": 125,
    "antilog": 243
  },
  {
    "exponent_of_alpha": 126,
    "power_of_2_gf_256": 102,
    "integer": 126,
    "antilog": 167
  },
  {
    "exponent_of_alpha": 127,
    "power_of_2_gf_256": 204,
    "integer": 127,
    "antilog": 87
  },
  {
    "exponent_of_alpha": 128,
    "power_of_2_gf_256": 133,
    "integer": 128,
    "antilog": 7
  },
  {
    "exponent_of_alpha": 129,
    "power_of_2_gf_256": 23,
    "integer": 129,
    "antilog": 112
  },
  {
    "exponent_of_alpha": 130,
    "power_of_2_gf_256": 46,
    "integer": 130,
    "antilog": 192
  },
  {
    "exponent_of_alpha": 131,
    "power_of_2_gf_256": 92,
    "integer": 131,
    "antilog": 247
  },
  {
    "exponent_of_alpha": 132,
    "power_of_2_gf_256": 184,
    "integer": 132,
    "antilog": 140
  },
  {
    "exponent_of_alpha": 133,
    "power_of_2_gf_256": 109,
    "integer": 133,
    "antilog": 128
  },
  {
    "exponent_of_alpha": 134,
    "power_of_2_gf_256": 218,
    "integer": 134,
    "antilog": 99
  },
  {
    "exponent_of_alpha": 135,
    "power_of_2_gf_256": 169,
    "integer": 135,
    "antilog": 13
  },
  {
    "exponent_of_alpha": 136,
    "power_of_2_gf_256": 79,
    "integer": 136,
    "antilog": 103
  },
  {
    "exponent_of_alpha": 137,
    "power_of_2_gf_256": 158,
    "integer": 137,
    "antilog": 74
  },
  {
    "exponent_of_alpha": 138,
    "power_of_2_gf_256": 33,
    "integer": 138,
    "antilog": 222
  },
  {
    "exponent_of_alpha": 139,
    "power_of_2_gf_256": 66,
    "integer": 139,
    "antilog": 237
  },
  {
    "exponent_of_alpha": 140,
    "power_of_2_gf_256": 132,
    "integer": 140,
    "antilog": 49
  },
  {
    "exponent_of_alpha": 141,
    "power_of_2_gf_256": 21,
    "integer": 141,
    "antilog": 197
  },
  {
    "exponent_of_alpha": 142,
    "power_of_2_gf_256": 42,
    "integer": 142,
    "antilog": 254
  },
  {
    "exponent_of_alpha": 143,
    "power_of_2_gf_256": 84,
    "integer": 143,
    "antilog": 24
  },
  {
    "exponent_of_alpha": 144,
    "power_of_2_gf_256": 168,
    "integer": 144,
    "antilog": 227
  },
  {
    "exponent_of_alpha": 145,
    "power_of_2_gf_256": 77,
    "integer": 145,
    "antilog": 165
  },
  {
    "exponent_of_alpha": 146,
    "power_of_2_gf_256": 154,
    "integer": 146,
    "antilog": 153
  },
  {
    "exponent_of_alpha": 147,
    "power_of_2_gf_256": 41,
    "integer": 147,
    "antilog": 119
  },
  {
    "exponent_of_alpha": 148,
    "power_of_2_gf_256": 82,
    "integer": 148,
    "antilog": 38
  },
  {
    "exponent_of_alpha": 149,
    "power_of_2_gf_256": 164,
    "integer": 149,
    "antilog": 184
  },
  {
    "exponent_of_alpha": 150,
    "power_of_2_gf_256": 85,
    "integer": 150,
    "antilog": 180
  },
  {
    "exponent_of_alpha": 151,
    "power_of_2_gf_256": 170,
    "integer": 151,
    "antilog": 124
  },
  {
    "exponent_of_alpha": 152,
    "power_of_2_gf_256": 73,
    "integer": 152,
    "antilog": 17
  },
  {
    "exponent_of_alpha": 153,
    "power_of_2_gf_256": 146,
    "integer": 153,
    "antilog": 68
  },
  {
    "exponent_of_alpha": 154,
    "power_of_2_gf_256": 57,
    "integer": 154,
    "antilog": 146
  },
  {
    "exponent_of_alpha": 155,
    "power_of_2_gf_256": 114,
    "integer": 155,
    "antilog": 217
  },
  {
    "exponent_of_alpha": 156,
    "power_of_2_gf_256": 228,
    "integer": 156,
    "antilog": 35
  },
  {
    "exponent_of_alpha": 157,
    "power_of_2_gf_256": 213,
    "integer": 157,
    "antilog": 32
  },
  {
    "exponent_of_alpha": 158,
    "power_of_2_gf_256": 183,
    "integer": 158,
    "antilog": 137
  },
  {
    "exponent_of_alpha": 159,
    "power_of_2_gf_256": 115,
    "integer": 159,
    "antilog": 46
  },
  {
    "exponent_of_alpha": 160,
    "power_of_2_gf_256": 230,
    "integer": 160,
    "antilog": 55
  },
  {
    "exponent_of_alpha": 161,
    "power_of_2_gf_256": 209,
    "integer": 161,
    "antilog": 63
  },
  {
    "exponent_of_alpha": 162,
    "power_of_2_gf_256": 191,
    "integer": 162,
    "antilog": 209
  },
  {
    "exponent_of_alpha": 163,
    "power_of_2_gf_256": 99,
    "integer": 163,
    "antilog": 91
  },
  {
    "exponent_of_alpha": 164,
    "power_of_2_gf_256": 198,
    "integer": 164,
    "antilog": 149
  },
  {
    "exponent_of_alpha": 165,
    "power_of_2_gf_256": 145,
    "integer": 165,
    "antilog": 188
  },
  {
    "exponent_of_alpha": 166,
    "power_of_2_gf_256": 63,
    "integer": 166,
    "antilog": 207
  },
  {
    "exponent_of_alpha": 167,
    "power_of_2_gf_256": 126,
    "integer": 167,
    "antilog": 205
  },
  {
    "exponent_of_alpha": 168,
    "power_of_2_gf_256": 252,
    "integer": 168,
    "antilog": 144
  },
  {
    "exponent_of_alpha": 169,
    "power_of_2_gf_256": 229,
    "integer": 169,
    "antilog": 135
  },
  {
    "exponent_of_alpha": 170,
    "power_of_2_gf_256": 215,
    "integer": 170,
    "antilog": 151
  },
  {
    "exponent_of_alpha": 171,
    "power_of_2_gf_256": 179,
    "integer": 171,
    "antilog": 178
  },
  {
    "exponent_of_alpha": 172,
    "power_of_2_gf_256": 123,
    "integer": 172,
    "antilog": 220
  },
  {
    "exponent_of_alpha": 173,
    "power_of_2_gf_256": 246,
    "integer": 173,
    "antilog": 252
  },
  {
    "exponent_of_alpha": 174,
    "power_of_2_gf_256": 241,
    "integer": 174,
    "antilog": 190
  },
  {
    "exponent_of_alpha": 175,
    "power_of_2_gf_256": 255,
    "integer": 175,
    "antilog": 97
  },
  {
    "exponent_of_alpha": 176,
    "power_of_2_gf_256": 227,
    "integer": 176,
    "antilog": 242
  },
  {
    "exponent_of_alpha": 177,
    "power_of_2_gf_256": 219,
    "integer": 177,
    "antilog": 86
  },
  {
    "exponent_of_alpha": 178,
    "power_of_2_gf_256": 171,
    "integer": 178,
    "antilog": 211
  },
  {
    "exponent_of_alpha": 179,
    "power_of_2_gf_256": 75,
    "integer": 179,
    "antilog": 171
  },
  {
    "exponent_of_alpha": 180,
    "power_of_2_gf_256": 150,
    "integer": 180,
    "antilog": 20
  },
  {
    "exponent_of_alpha": 181,
    "power_of_2_gf_256": 49,
    "integer": 181,
    "antilog": 42
  },
  {
    "exponent_of_alpha": 182,
    "power_of_2_gf_256": 98,
    "integer": 182,
    "antilog": 93
  },
  {
    "exponent_of_alpha": 183,
    "power_of_2_gf_256": 196,
    "integer": 183,
    "antilog": 158
  },
  {
    "exponent_of_alpha": 184,
    "power_of_2_gf_256": 149,
    "integer": 184,
    "antilog": 132
  },
  {
    "exponent_of_alpha": 185,
    "power_of_2_gf_256": 55,
    "integer": 185,
    "antilog": 60
  },
  {
    "exponent_of_alpha": 186,
    "power_of_2_gf_256": 110,
    "integer": 186,
    "antilog": 57
  },
  {
    "exponent_of_alpha": 187,
    "power_of_2_gf_256": 220,
    "integer": 187,
    "antilog": 83
  },
  {
    "exponent_of_alpha": 188,
    "power_of_2_gf_256": 165,
    "integer": 188,
    "antilog": 71
  },
  {
    "exponent_of_alpha": 189,
    "power_of_2_gf_256": 87,
    "integer": 189,
    "antilog": 109
  },
  {
    "exponent_of_alpha": 190,
    "power_of_2_gf_256": 174,
    "integer": 190,
    "antilog": 65
  },
  {
    "exponent_of_alpha": 191,
    "power_of_2_gf_256": 65,
    "integer": 191,
    "antilog": 162
  },
  {
    "exponent_of_alpha": 192,
    "power_of_2_gf_256": 130,
    "integer": 192,
    "antilog": 31
  },
  {
    "exponent_of_alpha": 193,
    "power_of_2_gf_256": 25,
    "integer": 193,
    "antilog": 45
  },
  {
    "exponent_of_alpha": 194,
    "power_of_2_gf_256": 50,
    "integer": 194,
    "antilog": 67
  },
  {
    "exponent_of_alpha": 195,
    "power_of_2_gf_256": 100,
    "integer": 195,
    "antilog": 216
  },
  {
    "exponent_of_alpha": 196,
    "power_of_2_gf_256": 200,
    "integer": 196,
    "antilog": 183
  },
  {
    "exponent_of_alpha": 197,
    "power_of_2_gf_256": 141,
    "integer": 197,
    "antilog": 123
  },
  {
    "exponent_of_alpha": 198,
    "power_of_2_gf_256": 7,
    "integer": 198,
    "antilog": 164
  },
  {
    "exponent_of_alpha": 199,
    "power_of_2_gf_256": 14,
    "integer": 199,
    "antilog": 118
  },
  {
    "exponent_of_alpha": 200,
    "power_of_2_gf_256": 28,
    "integer": 200,
    "antilog": 196
  },
  {
    "exponent_of_alpha": 201,
    "power_of_2_gf_256": 56,
    "integer": 201,
    "antilog": 23
  },
  {
    "exponent_of_alpha": 202,
    "power_of_2_gf_256": 112,
    "integer": 202,
    "antilog": 73
  },
  {
    "exponent_of_alpha": 203,
    "power_of_2_gf_256": 224,
    "integer": 203,
    "antilog": 236
  },
  {
    "exponent_of_alpha": 204,
    "power_of_2_gf_256": 221,
    "integer": 204,
    "antilog": 127
  },
  {
    "exponent_of_alpha": 205,
    "power_of_2_gf_256": 167,
    "integer": 205,
    "antilog": 12
  },
  {
    "exponent_of_alpha": 206,
    "power_of_2_gf_256": 83,
    "integer": 206,
    "antilog": 111
  },
  {
    "exponent_of_alpha": 207,
    "power_of_2_gf_256": 166,
    "integer": 207,
    "antilog": 246
  },
  {
    "exponent_of_alpha": 208,
    "power_of_2_gf_256": 81,
    "integer": 208,
    "antilog": 108
  },
  {
    "exponent_of_alpha": 209,
    "power_of_2_gf_256": 162,
    "integer": 209,
    "antilog": 161
  },
  {
    "exponent_of_alpha": 210,
    "power_of_2_gf_256": 89,
    "integer": 210,
    "antilog": 59
  },
  {
    "exponent_of_alpha": 211,
    "power_of_2_gf_256": 178,
    "integer": 211,
    "antilog": 82
  },
  {
    "exponent_of_alpha": 212,
    "power_of_2_gf_256": 121,
    "integer": 212,
    "antilog": 41
  },
  {
    "exponent_of_alpha": 213,
    "power_of_2_gf_256": 242,
    "integer": 213,
    "antilog": 157
  },
  {
    "exponent_of_alpha": 214,
    "power_of_2_gf_256": 249,
    "integer": 214,
    "antilog": 85
  },
  {
    "exponent_of_alpha": 215,
    "power_of_2_gf_256": 239,
    "integer": 215,
    "antilog": 170
  },
  {
    "exponent_of_alpha": 216,
    "power_of_2_gf_256": 195,
    "integer": 216,
    "antilog": 251
  },
  {
    "exponent_of_alpha": 217,
    "power_of_2_gf_256": 155,
    "integer": 217,
    "antilog": 96
  },
  {
    "exponent_of_alpha": 218,
    "power_of_2_gf_256": 43,
    "integer": 218,
    "antilog": 134
  },
  {
    "exponent_of_alpha": 219,
    "power_of_2_gf_256": 86,
    "integer": 219,
    "antilog": 177
  },
  {
    "exponent_of_alpha": 220,
    "power_of_2_gf_256": 172,
    "integer": 220,
    "antilog": 187
  },
  {
    "exponent_of_alpha": 221,
    "power_of_2_gf_256": 69,
    "integer": 221,
    "antilog": 204
  },
  {
    "exponent_of_alpha": 222,
    "power_of_2_gf_256": 138,
    "integer": 222,
    "antilog": 62
  },
  {
    "exponent_of_alpha": 223,
    "power_of_2_gf_256": 9,
    "integer": 223,
    "antilog": 90
  },
  {
    "exponent_of_alpha": 224,
    "power_of_2_gf_256": 18,
    "integer": 224,
    "antilog": 203
  },
  {
    "exponent_of_alpha": 225,
    "power_of_2_gf_256": 36,
    "integer": 225,
    "antilog": 89
  },
  {
    "exponent_of_alpha": 226,
    "power_of_2_gf_256": 72,
    "integer": 226,
    "antilog": 95
  },
  {
    "exponent_of_alpha": 227,
    "power_of_2_gf_256": 144,
    "integer": 227,
    "antilog": 176
  },
  {
    "exponent_of_alpha": 228,
    "power_of_2_gf_256": 61,
    "integer": 228,
    "antilog": 156
  },
  {
    "exponent_of_alpha": 229,
    "power_of_2_gf_256": 122,
    "integer": 229,
    "antilog": 169
  },
  {
    "exponent_of_alpha": 230,
    "power_of_2_gf_256": 244,
    "integer": 230,
    "antilog": 160
  },
  {
    "exponent_of_alpha": 231,
    "power_of_2_gf_256": 245,
    "integer": 231,
    "antilog": 81
  },
  {
    "exponent_of_alpha": 232,
    "power_of_2_gf_256": 247,
    "integer": 232,
    "antilog": 11
  },
  {
    "exponent_of_alpha": 233,
    "power_of_2_gf_256": 243,
    "integer": 233,
    "antilog": 245
  },
  {
    "exponent_of_alpha": 234,
    "power_of_2_gf_256": 251,
    "integer": 234,
    "antilog": 22
  },
  {
    "exponent_of_alpha": 235,
    "power_of_2_gf_256": 235,
    "integer": 235,
    "antilog": 235
  },
  {
    "exponent_of_alpha": 236,
    "power_of_2_gf_256": 203,
    "integer": 236,
    "antilog": 122
  },
  {
    "exponent_of_alpha": 237,
    "power_of_2_gf_256": 139,
    "integer": 237,
    "antilog": 117
  },
  {
    "exponent_of_alpha": 238,
    "power_of_2_gf_256": 11,
    "integer": 238,
    "antilog": 44
  },
  {
    "exponent_of_alpha": 239,
    "power_of_2_gf_256": 22,
    "integer": 239,
    "antilog": 215
  },
  {
    "exponent_of_alpha": 240,
    "power_of_2_gf_256": 44,
    "integer": 240,
    "antilog": 79
  },
  {
    "exponent_of_alpha": 241,
    "power_of_2_gf_256": 88,
    "integer": 241,
    "antilog": 174
  },
  {
    "exponent_of_alpha": 242,
    "power_of_2_gf_256": 176,
    "integer": 242,
    "antilog": 213
  },
  {
    "exponent_of_alpha": 243,
    "power_of_2_gf_256": 125,
    "integer": 243,
    "antilog": 233
  },
  {
    "exponent_of_alpha": 244,
    "power_of_2_gf_256": 250,
    "integer": 244,
    "antilog": 230
  },
  {
    "exponent_of_alpha": 245,
    "power_of_2_gf_256": 233,
    "integer": 245,
    "antilog": 231
  },
  {
    "exponent_of_alpha": 246,
    "power_of_2_gf_256": 207,
    "integer": 246,
    "antilog": 173
  },
  {
    "exponent_of_alpha": 247,
    "power_of_2_gf_256": 131,
    "integer": 247,
    "antilog": 232
  },
  {
    "exponent_of_alpha": 248,
    "power_of_2_gf_256": 27,
    "integer": 248,
    "antilog": 116
  },
  {
    "exponent_of_alpha": 249,
    "power_of_2_gf_256": 54,
    "integer": 249,
    "antilog": 214
  },
  {
    "exponent_of_alpha": 250,
    "power_of_2_gf_256": 108,
    "integer": 250,
    "antilog": 244
  },
  {
    "exponent_of_alpha": 251,
    "power_of_2_gf_256": 216,
    "integer": 251,
    "antilog": 234
  },
  {
    "exponent_of_alpha": 252,
    "power_of_2_gf_256": 173,
    "integer": 252,
    "antilog": 168
  },
  {
    "exponent_of_alpha": 253,
    "power_of_2_gf_256": 71,
    "integer": 253,
    "antilog": 80
  },
  {
    "exponent_of_alpha": 254,
    "power_of_2_gf_256": 142,
    "integer": 254,
    "antilog": 88
  },
  {
    "exponent_of_alpha": 255,
    "power_of_2_gf_256": 1,
    "integer": 255,
    "antilog": 175
  }
];

// from https://www.thonky.com/qr-code-tutorial/structure-final-message
const qrVersionRequiredRemainderBitsMap = {
  1: 0,
  2: 7,
  3: 7,
  4: 7,
  5: 7,
  6: 7,
  7: 0,
  8: 0,
  9: 0,
  10: 0,
  11: 0,
  12: 0,
  13: 0,
  14: 3,
  15: 3,
  16: 3,
  17: 3,
  18: 3,
  19: 3,
  20: 3,
  21: 4,
  22: 4,
  23: 4,
  24: 4,
  25: 4,
  26: 4,
  27: 4,
  28: 3,
  29: 3,
  30: 3,
  31: 3,
  32: 3,
  33: 3,
  34: 3,
  35: 0,
  36: 0,
  37: 0,
  38: 0,
  39: 0,
  40: 0,
};

// maps QR version to location of patterns
// https://www.thonky.com/qr-code-tutorial/alignment-pattern-locations
const alignmentPatternLocationsTable = {
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
  11: [6, 30, 54],
  12: [6, 32, 58],
  13: [6, 26, 46, 66],
  14: [6, 26, 46, 66],
  15: [6, 26, 48, 70],
  16: [6, 26, 50, 74],
  17: [6, 30, 54, 78],
  18: [6, 30, 56, 82],
  19: [6, 30, 58, 86],
  20: [6, 34, 62, 90],
  21: [6, 28, 50, 72, 94],
  22: [6, 26, 50, 74, 98],
  23: [6, 30, 54, 78, 102],
  24: [6, 28, 54, 80, 106],
  25: [6, 32, 58, 84, 110],
  26: [6, 30, 58, 86, 114],
  27: [6, 34, 62, 90, 118],
  28: [6, 26, 50, 74, 98, 122],
  29: [6, 30, 54, 78, 102, 126],
  30: [6, 26, 52, 78, 104, 130],
  31: [6, 30, 56, 82, 108, 134],
  32: [6, 34, 60, 86, 112, 138],
  33: [6, 30, 58, 86, 114, 142],
  34: [6, 34, 62, 90, 118, 146],
  35: [6, 30, 54, 78, 102, 126, 150],
  36: [6, 24, 50, 76, 102, 128, 154],
  37: [6, 28, 54, 80, 106, 132, 158],
  38: [6, 32, 58, 84, 110, 136, 162],
  39: [6, 26, 54, 82, 110, 138, 166],
  40: [6, 30, 58, 86, 114, 142, 170],
};

// note: only caring about byte mode atm
const versionCharCountIndicatorSizeMap = {
  1: 8, // version 1-9 -> 8 bits for representing the character count
  10: 16, // versions 10 - 26 -> 16 bits
  27: 16, // versions 27 - 40 -> 16 bits
};

// https://www.thonky.com/qr-code-tutorial/format-version-information
const errorCorrectionLevelBitsMap = {
  'L': '01',
  'M': '00',
  'Q': '11',
  'H': '10',
};

const maskPatternBitsMap = {
  0: '000',
  1: '001',
  2: '010',
  3: '011',
  4: '100',
  5: '101',
  6: '110',
  7: '111',
};

function getCharCountIndicatorSize(version){
  const keys = Array.from(Object.keys(versionCharCountIndicatorSizeMap)).toReversed().map(x => parseInt(x));
  for(let k of keys){
    if(version >= k){
      return versionCharCountIndicatorSizeMap[k]; // e.g. if version is 20, we should get back 16. if 9 we should get back 8.
    }
  }
  return null;
}

function getInputStrAsBinaryStr(inputStr){
  // https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encode
  // convert the input to 8-bit ints per TextEncoder.encode
  const textEncoder = new TextEncoder();
  console.log(`textEncoder encoding: ${textEncoder.encoding}`);
  
  // .encode() returns a unint8 array, but we want to run map() on it to convert the ints to binary, so convert the result to a generic array
  const encodedStrArray = Array.from(textEncoder.encode(inputStr));
  console.log(encodedStrArray);
  
  // convert each 8-bit int to binary
  const res = encodedStrArray.map((i) => {
    // convert to binary
    const binStr = intToBinary(i);
    //console.log(binStr);
    //console.log(`binStr to int: ${binaryToInt(binStr)}`);
    
    // pad as needed to match a length of 8
    const paddingAmount = 8 - binStr.length;
    //console.log(`int: ${i}, bin: ${binStr}`);
    
    return zeroPadLeftStr(binStr, paddingAmount);
  });
  console.log(res);
  
  // concat each binary
  return res.join("");
}

function intToHex(n){
	const map = {
		10: 'a',
		11: 'b',
		12: 'c',
		13: 'd',
		14: 'e',
		15: 'f',
	};
  const hexStr = [];
  
  while(n > 0){
    const rem = n % 16;
    hexStr.unshift(rem);
    n = Math.floor(n / 16);
  }
  
  return hexStr.map(x => {
    if(map[x]){
      return map[x];
    }else{
      return x;
    }
  }).join("");
}

// https://github.com/syncopika/getYTAudio/blob/master/parse_weba_file/parse_weba.js#L173C1-L190C2
function hexToBin(hexStr){
	const map = {
		'a': 10,
		'b': 11,
		'c': 12,
		'd': 13,
		'e': 14,
		'f': 15
	};
	let total = "";
	for(let i = hexStr.length - 1; i >= 0; i--){
		// get binary 
		let num = map[hexStr[i]] ? parseInt(map[hexStr[i]]) : parseInt(hexStr[i]);
		total = intToBinary(num) + total;
	}
	return total;
}

function intToBinary(n){
  const binStr = [];
  
  while(n > 0){
    const rem = n % 2;
    binStr.unshift(rem);
    n = Math.floor(n / 2);
  }
  
  return binStr.join("");
}

function binaryToInt(binStr){
  let result = 0;
  let currMultiplier = 1;
  let idx = binStr.length - 1;
  while(idx > -1){
    if(binStr[idx] === '1'){
      result += currMultiplier;
    }
    currMultiplier *= 2;
    idx--;
  }
  return result;
}

// https://stackoverflow.com/questions/7033639/split-large-string-in-n-size-chunks-in-javascript
function getDataCodewordsFromEncodedString(inputStr){
  const numCodewords = Math.ceil(inputStr.length / 8); // each codeword should have a length of 8
  const codewords = new Array(numCodewords);
  
  for(let i = 0, offset = 0; i < numCodewords; i++, offset += 8){
    codewords[i] = inputStr.substring(offset, offset + 8);
  }
  
  return codewords;
}

function padEncodedData(encodedData, totalBitsRequired){
  if(encodedData.length === totalBitsRequired){
    // nothing to do
    return encodedData;
  }

  // add terminator bits (of 0) if needed
  if(encodedData.length + 4 < totalBitsRequired - 4){
    // if diff is greater than 4, add 4 0's max
    encodedData += '0000';
    console.log('adding 4 0s for terminator');
  }else if(encodedData.length + 4 >= totalBitsRequired){
    // add remaining 0s if diff < 4
    console.log(`adding ${diff} 0s to reach totalBitsRequired (${totalBitsRequired})`);
    let diff = totalBitsRequired - encodedData.length;
    while(diff > 0){
      encodedData += '0';
      diff--;
    }
  }
  
  // then add more 0s to make the length of encoded data a multiple of 8
  while(encodedData.length % 8 != 0){
    console.log('adding more 0s to reach a length that is a multiple of 8');
    encodedData += '0';
  }
  console.log(`encoded data length now: ${encodedData.length}`);
  
  // add pad bytes if encoded data is still too short (e.g. a lot less than totalBitsRequired)
  const bitsToPad = totalBitsRequired - encodedData.length;
  let padBytesToAdd = bitsToPad / 8;
  //console.log(`pad bytes to add: ${padBytesToAdd}`);
  let count = 0;
  while(padBytesToAdd > 0){
    //console.log(`still too short - now adding 236 and 17 alternating until totalBitsRequired is reached`);
    if(count % 2 === 0){
      // if count is even
      encodedData += '11101100';
    }else{
      // if count is odd
      encodedData += '00010001';
    }
    count++;
    padBytesToAdd--;
  }
  
  return encodedData;
}

function divideDataCodewordsIntoGroupsAndBlocks(encodedData, numGroup1Blocks, numCodewordsPerGroup1Block, numGroup2Blocks, numCodewordsPerGroup2Block){
  const wordBlocks = {
    '1': {}, // group 1 blocks
    '2': {}, // group 2 blocks
  };
  
  // add the codewords in from the result of getDataCodewordsFromEncodedString(encodedData) to wordBlocks
  const codewords = getDataCodewordsFromEncodedString(encodedData);
  //console.log(codewords);
  let codewordIndex = 0;
  
  // do group 1
  let group1BlocksCount = 0;
  while(group1BlocksCount < numGroup1Blocks && codewordIndex < codewords.length){
    const newBlock = []; // new block in group 1
    
    let numCodewordsAddedToBlock = 0;
    while(numCodewordsAddedToBlock < numCodewordsPerGroup1Block && codewordIndex < codewords.length){
      newBlock.push(codewords[codewordIndex++]);
      numCodewordsAddedToBlock++;
    }
    
    wordBlocks['1'][`${group1BlocksCount + 1}`] = newBlock;
    
    group1BlocksCount++;
  }
  
  // do group 2
  let group2BlocksCount = 0;
  while(group2BlocksCount < numGroup2Blocks && codewordIndex < codewords.length){
    const newBlock = []; // new block in group 2
    
    let numCodewordsAddedToBlock = 0;
    while(numCodewordsAddedToBlock < numCodewordsPerGroup2Block && codewordIndex < codewords.length){
      newBlock.push(codewords[codewordIndex++]);
      numCodewordsAddedToBlock++;
    }
    
    wordBlocks['2'][`${group2BlocksCount + 1}`] = newBlock;
    
    group2BlocksCount++;
  }
  
  return wordBlocks;
}

function getMessagePolynomial(codewordsArray){
  // for each codeword in encodedData, convert it to decimal.
  // each codeword is a coefficient in the message polynomial
  return codewordsArray.map((w, idx) => {
    const decimal = binaryToInt(w);
    const exponent = codewordsArray.length - idx - 1;
    return {
      c: decimal, //coefficient
      exp: exponent,
    };
  });
}

function findIntegerOfAlpha(alphaExp){
  // given an exponent of alpha, return the corresponding integer value based on the log-antilog table
  for(let entry of logAntilogTable){
    if(alphaExp === entry.exponent_of_alpha){
      return entry.power_of_2_gf_256;
    }
  }
  return null;
}

function findAlphaOfInteger(integer){
  // given an integer, return the corresponding alpha exponent based on the log-antilog table
 for(let entry of logAntilogTable){
  if(integer === entry.power_of_2_gf_256){
    return entry.exponent_of_alpha;
  }
 }
 return null;
}

function createGeneratorPolynomial(numErrorCorrectionCodewordsPerBlock){
  // start with polynomial for 2 codewords since we'll always need error correction codewords > 2 anyway
  let prevPolynomial = [
    {'alpha': 0, 'x': 2},
    {'alpha': 25, 'x': 1},
    {'alpha': 1, 'x': 0},
  ];
  
  // we need to know the polynomial corresponding to the number of error correction codewords needed
  // so we need to generate the polynomial at each preceding number of error correction codewords
  // since each step's polynomial if built off the previous step's
  // e.g. (g(x) for n-1 error correction codewords) * (x - (alpha^n-1)) = (g(x) for n error correction codewords)
  let count = 2;
  let currAlphaToMultiplyBy = 2;
  while(count < numErrorCorrectionCodewordsPerBlock){ 
    const newPolynomialToMultiplyBy = [
      {'alpha': 0, 'x': 1},
      {'alpha': currAlphaToMultiplyBy, 'x': 0},
    ];
    
    // multiply previous polynomial by the new one
    const polynomialMultiplicationResult = [];
    for(let term of prevPolynomial){
      for(let term2 of newPolynomialToMultiplyBy){
        polynomialMultiplicationResult.push({
          'alpha': (term.alpha + term2.alpha) > 255 ? (term.alpha + term2.alpha) % 255 : (term.alpha + term2.alpha), // alpha exponents shouldn't exceed 255
          'x': term.x + term2.x,
        });
      }
    }
    
    // combine like terms in the multiplication result
    // remember that when combining alphas in this case, convert the alphas to their integer counterparts and then XOR them
    const likeTermsMap = {}; // group like-terms based on their 'x' value (this is the exponent of x)
    for(let term of polynomialMultiplicationResult){
      if(likeTermsMap[term.x] === undefined){
        likeTermsMap[term.x] = [term];
      }else{
        likeTermsMap[term.x].push(term);
      }
    }
    
    const resultingPolynomial = [];
    for(let likeTermsX in likeTermsMap){
      const likeTerms = likeTermsMap[likeTermsX];
      if(likeTerms.length > 1){
        // now we can combine like-terms
        const newTerm = {
          // convert a to integer using the log-antilog table for XOR step, then convert back to alpha exponent
          'alpha': findAlphaOfInteger(likeTerms.map(t => findIntegerOfAlpha(t.alpha)).reduce((acc, curr) => acc ^ curr, 0)),
          'x': likeTerms[0].x, // exponent of x will stay the same for all like-terms
        };
        resultingPolynomial.push(newTerm);
      }else{
        resultingPolynomial.push(likeTerms[0]);
      }
    }
    
    prevPolynomial = resultingPolynomial;
    
    currAlphaToMultiplyBy++;
    count++;
  }
  
  return prevPolynomial;
}

function doPolynomialDivisionAndGetErrorCorrectionCodewords(msgPoly, genPoly, numErrorCodewordsPerBlock){
  // reverse generator polynomial because the leading term is actually at the end >_<
  genPoly.reverse();

  const errorCorrectionCodewords = [];
  
  let iteration = 0;
  let numIterations = msgPoly.length;
  //console.log(`need to divide ${numIterations} times for EC codewords`);
  let xorResult = JSON.parse(JSON.stringify(msgPoly));
  //console.log(xorResult);
  //console.log(JSON.parse(JSON.stringify(genPoly)));
  
  while(iteration < numIterations){
    //console.log(`-------------- iteration ${iteration} ------------------`);
    // This is where we can loop I think. 
    // the number of steps in the division must equal the number of terms in the message polynomial.
    // make a copy of the original generator polynomial for each iteration but adjust it accordingly since each iteration we chop off the leading term
    let genPolyCopy = JSON.parse(JSON.stringify(genPoly));
    if(iteration > 0){
      // if after the first iteration, adjust the generator polynomial exponents to align with the xorResult of the previous step
      genPolyCopy.forEach(t => t.x -= iteration);
    }
    
    //console.log(JSON.stringify(genPolyCopy));
    //console.log(JSON.stringify(xorResult));

    // multiply generator polynomial by lead term of message polynomial
    const leadMsgPolyTerm = xorResult[0];
    //console.log(`lead msg poly term: ${JSON.stringify(leadMsgPolyTerm)}`);
    
    // convert coeff of lead term to alpha exponent
    const leadTermAlpha = findAlphaOfInteger(leadMsgPolyTerm.c);
    //console.log(leadTermAlpha);
    
    // multiply generator polynomial by leadTermAlpha
    genPolyCopy.forEach(t => {
      if(t.alpha + leadTermAlpha > 255){
        t.alpha = (t.alpha + leadTermAlpha) % 255;
      }else{
        t.alpha = t.alpha + leadTermAlpha;
      }
    }); // don't forget to mod by 255 again to keep it below 256
    
    // convert alphas to integer
    genPolyCopy.forEach(t => t.alpha = findIntegerOfAlpha(t.alpha));
    
    // then XOR the generator polynomial with the message polynomial
    let newXorRes = [];
    let idx = 0;
    genPolyCopy.forEach((term) => {
      if(idx < xorResult.length){
        newXorRes.push({
          'c': term.alpha ^ xorResult[idx].c, // this is in integer form.
          'exp': term.x,
        });
        idx++;
      }
    });
    
    // add any remaining terms from xorResult to the new XOR result
    while(idx < xorResult.length){
      newXorRes.push(xorResult[idx]);
      idx++;
    }
    
    // add any remaining terms from gen poly. there's a point where 
    // initially the msg polynomial has more terms but eventually gen poly could have more terms
    while(idx < genPolyCopy.length){
      newXorRes.push({
        'c': genPolyCopy[idx].alpha,
        'exp': genPolyCopy[idx].x,
      });
      idx++;
    }
    
    //console.log(xorResult);
    if(newXorRes[0].c !== 0){
      console.error("leading term coefficient for xorResult was not 0!");
    }
    
    // discard leading term of xorResult because alpha should be 0
    xorResult = newXorRes.splice(1);
    
    // repeat the steps but with xorResult as the new message polynomial
    // also update the generator polynomial exponents of each term and take off the leading term
    
    iteration++;
  }

  return xorResult;
}

function generateErrorCorrectionCodewords(wordBlocks, numErrorCodewordsPerBlock){
  console.log(`need to generate ${numErrorCodewordsPerBlock} error codewords per block`);

  const result = {};
  
  for(let group in wordBlocks){
    result[group] = {};
    for(let block in wordBlocks[group]){
      //console.log(`group: ${group}, block: ${block}`);
      // first generate message polynomial for the block using codewords in encodedData
      const blockCodewords = wordBlocks[group][block];
      const msgPolynomial = getMessagePolynomial(blockCodewords);
      
      // generate the generator polynomial. we need to create a new one for each block because we manipulate it
      // can verify with: https://www.thonky.com/qr-code-tutorial/generator-polynomial-tool?degree=22
      const generatorPolynomial = createGeneratorPolynomial(numErrorCodewordsPerBlock);
      //console.log(generatorPolynomial);
      
      // modify message polynomial to ensure the lead term doesn't get too small during division by
      // multiplying the message polynomial by x^numErrorCodewordsPerBlock (so basically add numErrorCodewordsPerBlock to each existing exponent of x)
      msgPolynomial.forEach(t => t.exp += numErrorCodewordsPerBlock);
      
      // for the generator polynomial, make sure the lead term has the same exponent as the lead term in the message polynomial
      // first find the leading term (which has the largest exponent)
      let maxExpGenPoly = 0;
      generatorPolynomial.forEach(t => maxExpGenPoly = Math.max(maxExpGenPoly, t.x));
      // find diff between msg polynomial leading exponent
      const expDiff = msgPolynomial[0].exp - maxExpGenPoly;
      //console.log(expDiff);
      // add expDiff to all the generator polynomial terms to align with the message polynomial
      generatorPolynomial.forEach(t => t.x += expDiff);
      
      // then do the division
      const errorCorrectionCodewords = doPolynomialDivisionAndGetErrorCorrectionCodewords(
        msgPolynomial, 
        generatorPolynomial, 
        numErrorCodewordsPerBlock,
      );
      
      // add the resulting error correction codewords
      // TODO: we only need the coefficients of each term so just return those instead of the whole term as na object?
      result[group][block] = errorCorrectionCodewords;
    }
  }
  
  // result should look like the wordBlocks object but instead of the encoded data, we have the error correction codewords
  return result;
}

function interleaveDataAndErrorCodewords(dataWordBlocks, errorWordBlocks, qrVersion){
  // interleave all the data codewords first in dataWordBlocks
  const dataBlocks = {};
  let blockNum = 1;
  for(let group in dataWordBlocks){
    for(let n in dataWordBlocks[group]){
      dataBlocks[blockNum++] = dataWordBlocks[group][n];
    }
  }
  //console.log(dataBlocks);
  
  const interleavedDataCodewords = [];
  
  // get total number of codewords
  let numCodewords = 0;
  for(let block in dataBlocks){
    numCodewords += dataBlocks[block].length;
  }
  //console.log(`num data codewords: ${numCodewords}`);
  
  // then interleave the words
  let currIdx = 0;
  while(numCodewords > 0){
    for(let block in dataBlocks){
      const blockData = dataBlocks[block];
      if(currIdx < blockData.length){
        interleavedDataCodewords.push(blockData[currIdx]);
        numCodewords--;
      }
    }
    currIdx++;
  }
  //console.log(`num interleaved data codewords: ${interleavedDataCodewords.length}`);
  
  // then interleave the error codewords in errorWordBlocks
  const interleavedErrorCodewords = [];
  const errorBlocks = {};
  blockNum = 1;
  for(let group in errorWordBlocks){
    for(let n in errorWordBlocks[group]){
      // only grab the coefficient of each polynomial term of the error code polynomial because the coefficients are the error codewords
      errorBlocks[blockNum++] = errorWordBlocks[group][n].map(t => t.c);
    }
  }
  //console.log(errorBlocks);
  
  currIdx = 0;
  numCodewords = 0;
  for(let block in errorBlocks){
    numCodewords += errorBlocks[block].length;
  }
  //console.log(`num error codewords: ${numCodewords}`);
  while(numCodewords > 0){
    for(let block in errorBlocks){
      const blockData = errorBlocks[block];
      if(currIdx < blockData.length){
        // convert error codewords into binary
        let errWordBinary = intToBinary(blockData[currIdx]);
        // pad to length of 8 if needed
        while(errWordBinary.length < 8){
          errWordBinary = '0' + errWordBinary;
        }
        interleavedErrorCodewords.push(errWordBinary);
        numCodewords--;
      }
    }
    currIdx++;
  }
  //console.log(`num interleaved error codewords: ${interleavedErrorCodewords.length}`);
  //console.log(interleavedDataCodewords);
  //console.log(interleavedErrorCodewords);
  
  // put interleaved error correction codewords after the data codewords
  let result = interleavedDataCodewords.join("") + interleavedErrorCodewords.join("");
  //console.log(`data and error codewords interleaved: ${result}`);
  
  // add remainder bits depending on QR version
  const remainingBits = qrVersionRequiredRemainderBitsMap[qrVersion];
  for(let i = 0; i < remainingBits; i++){
    result += '0';
  }
  
  //console.log(`length of interleaved data and error words: ${result.length}`);
  
  return result;
}

function xorBinStrings(s1, s2){
  if(s1.length !== s2.length){
    console.error('s1.length !== s2.length');
    return;
  }
  let xorResult = '';
  for(let i = 0; i < s1.length; i++){
    const res = s1[i] ^ s2[i]; // the strings should get coerced to number
    xorResult += res;
  }
  return xorResult;
}

function generateErrorCorrectionBitsFormatString(formatStr){
  // generator polynomial to use: 10100110111
  if(formatStr.length !== 5){
    console.error('format string does not have a length of 5!');
  }
  
  // calculate the error correction bits by dividing the format string bits by the generator polynomial
  let initialString = `${formatStr}0000000000`; // formatStr should be of length 5, and we need a length of 15 so add 10 0s
  if(initialString.length !== 15){
    console.error('intial string for generating format string err correction bits does not have a length of 15!');
  }
  
  // remove any 0s from the left side
  initialString = initialString.slice(initialString.indexOf('1'));
  
  // do the division
  while(initialString.length > 10){
    let generatorPoly = '10100110111';
    // get generator polynomial's length to equal initialString's length by padding it with 0s if needed
    if(generatorPoly.length < initialString.length){
      for(let i = generatorPoly.length; i < initialString.length; i++){
        generatorPoly += '0';
      }
    }
    
    if(generatorPoly.length !== initialString.length){
      console.error('generator polynomial length !== initial string length');
    }
    
    // XOR the generator polynomial with initialString
    const xorResult = xorBinStrings(initialString, generatorPoly);
    
    // remove 0s from the left side of the result
    // and update initialString
    initialString = xorResult.slice(xorResult.indexOf('1'));
  }
  
  while(initialString.length < 10){
    // pad with 0s to ensure length is 10
    initialString = '0' + initialString;
  }
  
  return initialString;
}

function qrVersionToBinStr(qrVersion){
  let binStr = intToBinary(qrVersion);
  while(binStr.length < 6){
    binStr = '0' + binStr;
  }
  return binStr;
}

function generateErrorCorrectionBitsVersionString(versionStr){
  // this one should return an 18 bit string - 6 bits for the QR version and 12 error correction bits
  // generator polynomial to use: 1111100100101
  
  // calculate the error correction bits by dividing the format string bits by the generator polynomial
  let initialString = `${versionStr}000000000000`; // versionStr should be of length 6, and we need a length of 18 so add 12 0s
  // remove any 0s from the left side
  initialString = initialString.slice(initialString.indexOf('1'));
  
  // do the division
  while(initialString.length > 12){
    let generatorPoly = '1111100100101';
    // get generator polynomial's length to equal initialString's length by padding it with 0s if needed
    if(generatorPoly.length < initialString.length){
      for(let i = generatorPoly.length; i < initialString.length; i++){
        generatorPoly += '0';
      }
    }
    // XOR the generator polynomial with initialString
    const xorResult = xorBinStrings(initialString, generatorPoly);
    
    // remove 0s from the left side of the result
    // and update initialString
    initialString = xorResult.slice(xorResult.indexOf('1'));
  }
  
  while(initialString.length < 12){
    // pad with 0s to ensure length is 12
    initialString = '0' + initialString;
  }
  
  return initialString;  
}

// https://www.thonky.com/qr-code-tutorial/mask-patterns
// x = col, y = row
const maskPatternFormulae = [
  //(y, x) => false,  // if we leave the data as is and don't flip any bits
  (y, x) => (x + y) % 2 === 0,
  (y, x) => y % 2 === 0,
  (y, x) => x % 3 === 0,
  (y, x) => (x + y) % 3 === 0,
  (y, x) => ((Math.floor(y / 2) + Math.floor(x / 3)) % 2) === 0,
  (y, x) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (y, x) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (y, x) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function correctReservedAreaColor(ctx, width, height){
  // set reserved modules (in blue) to be white
  const imgData = ctx.getImageData(0, 0, width, height);
  for(let i = 0; i < imgData.data.length; i += 4){
    const b = imgData.data[i + 2];
    if(b === 255){
      //console.log('found blue');
      imgData.data[i] = 255;
      imgData.data[i + 1] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

function penaltyRule1(ctx, width, height){
  // penalty rule #1. find groups of 5 consecutive or more same-colored modules in a row or column
  let total = 0;
  
  // check each row
  for(let y = 0; y < height; y++){
    let horzTotal = 0;
    let consecutiveSeen = 1;
    
    let lastColor = ctx.getImageData(0, y, 1, 1).data[0];
    
    for(let x = 1; x < width; x++){
      const currColor = ctx.getImageData(x, y, 1, 1).data[0];
      
      if(currColor === lastColor){
        consecutiveSeen++;
        
        if(consecutiveSeen === 5){
          horzTotal += 3;
        }else if(consecutiveSeen > 5){
          horzTotal++;
        }
      }else{
        lastColor = currColor;
        consecutiveSeen = 1;
      }
    }
    total += horzTotal;
  }
  
  // check each column
  for(let x = 0; x < width; x++){
    let vertTotal = 0;
    let consecutiveSeen = 1;
    
    let lastColor = ctx.getImageData(x, 0, 1, 1).data[0];
    
    for(let y = 1; y < height; y++){
      const currColor = ctx.getImageData(x, y, 1, 1).data[0];
      
      if(currColor === lastColor){
        consecutiveSeen++;
        
        if(consecutiveSeen === 5){
          vertTotal += 3;
        }else if(consecutiveSeen > 5){
          vertTotal++;
        }
      }else{
        lastColor = currColor;
        consecutiveSeen = 1;
      }
    }
    total += vertTotal;
  }
  
  return total;
}

function penaltyRule2(ctx, width, height){
  // penalty rule #2. find 2x2 areas of same-colored modules
  let total = 0;
  
  // check each row
  for(let x = 0; x < width - 2; x++){
    for(let y = 0; y < height - 2; y++){
      // for each module, check if it's part of a 2x2 block where each block is the same color
      const currColor = ctx.getImageData(x, y, 1, 1).data[0];
      let penalty = true;
      for(let i = x; i < x + 2; i++){
        for(let j = y; j < y + 2; j++){
          if(ctx.getImageData(i, j, 1, 1).data[0] !== currColor){
            penalty = false;
          }
        }
      }
      if(penalty) total += 3;
    }
  }
  
  return total;
}

function penaltyRule3(ctx, width, height){
  // penalty rule #3. find patterns that look similar to the finder patterns
  // look for dark-light-dark-dark-dark-light-dark that have four light modules on either side
  // that's 11 consecutive modules
  const sequence = [0,255,0,0,0,255,0,255,255,255,255];
  const sequenceReverse = sequence.toReversed();
  
  let total = 0;
  
  // look horizontally
  for(let y = 0; y < height; y++){
    for(let x = 0; x < width - sequence.length; x++){
      let patternFound = true;
      let patternFound2 = true;
      for(let i = 0; i < sequence.length; i++){
        const color = ctx.getImageData(x + i, y, 1, 1).data[0];
        if(color !== sequence[i]){
          patternFound = false;
        }
        if(color !== sequenceReverse[i]){
          patternFound2 = false;
        }
      }
      if(patternFound){
        total += 40;
      }
      if(patternFound2){
        total += 40;
      }
    }
  }
  
  // look vertically
  for(let x = 0; x < width; x++){
    for(let y = 0; y < height - sequence.length; y++){
      let patternFound = true;
      let patternFound2 = true;
      for(let i = 0; i < sequence.length; i++){
        const color = ctx.getImageData(x, y + i, 1, 1).data[0];
        if(color !== sequence[i]){
          patternFound = false;
        }
        if(color !== sequenceReverse[i]){
          patternFound2 = false;
        }
      }
      if(patternFound){
        total += 40;
      }
      if(patternFound2){
        total += 40;
      }
    }
  }
  
  return total;
}

function penaltyRule4(ctx, width, height){
  // penalty rule #4. find ratio of dark/light submodules
  // count total number of modules in the matrix
  // count how many dark modules there are
  // calculate percent of modules that are dark
  // determine the previous and next multiple of 5 of the percentage
  // subtract 50 from each of these multiples of 5 and take the absolute value result
  // divide each of these by 5
  // take the min of the 2 and multiply it by 10
  let totalModuleCount = 0;
  let darkModuleCount = 0;
  for(let y = 0; y < height; y++){
    for(let x = 0; x < width; x++){
      totalModuleCount++;
      if(ctx.getImageData(x, y, 1, 1).data[0] === 0){
        darkModuleCount++;
      }
    }
  }
  const percentDark = Math.round((darkModuleCount / totalModuleCount) * 100); // TODO: ok to round?
  let prevMultipleOf5 = percentDark;
  let nextMultipleOf5 = percentDark;
  while(prevMultipleOf5 % 5 != 0){
    prevMultipleOf5--;
  }
  while(nextMultipleOf5 % 5 != 0){
    nextMultipleOf5++;
  }
  const absDiffPrevMultiple5 = Math.abs(prevMultipleOf5 - 50) / 50;
  const absDiffNextMultiple5 = Math.abs(nextMultipleOf5 - 50) / 50;
  const result = Math.min(absDiffNextMultiple5, absDiffNextMultiple5) * 10;
  return result;
}

function getDataMaskPatternResult(ctx, formula, doNotTouchModules, width, height, formulaNum){  
  // make a copy context to operate on so we don't mess with the original
  const newCanvas = document.createElement('canvas');
  newCanvas.width = width;
  newCanvas.height = height;
  
  const newCanvasCtx = newCanvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, width, height);
  
  newCanvasCtx.putImageData(imgData, 0, 0);
  
  for(let x = 0; x < width; x++){
    for(let y = 0; y < height; y++){
      const coord = `${x},${y}`;
      // if not a reserved module and the coordinates satisfy the given formula, flip the color
      // slightly tricky: y = row and x = col -> order is important when passing to formula()
      if(!doNotTouchModules.has(coord) && formula(y, x)){
        const currColor = newCanvasCtx.getImageData(x, y, 1, 1).data;
        if(currColor[0] === 0){
          newCanvasCtx.fillStyle = 'rgb(255,255,255)';
        }else{
          newCanvasCtx.fillStyle = 'rgb(0,0,0)';
        }
        newCanvasCtx.fillRect(x, y, 1, 1);
      }
    }
  }
  
  // turn any blue modules to white
  correctReservedAreaColor(newCanvasCtx, width, height);
  
  // now we have to evaluate the canvas ;_;
  
  // penalty rule #1. find groups of 5 or more same-colored modules in a row or column
  const penalty1Score = penaltyRule1(newCanvasCtx, width, height);
  
  // penalty rule #2. find 2x2 areas of same-colored modules
  const penalty2Score = penaltyRule2(newCanvasCtx, width, height);
  
  // penalty rule #3. find patterns that look similar to the finder patterns
  const penalty3Score = penaltyRule3(newCanvasCtx, width, height);
  
  // penalty rule #4. find ratio of dark/light submodules
  const penalty4Score = penaltyRule4(newCanvasCtx, width, height);
  
  // return score
  return penalty1Score + penalty2Score + penalty3Score + penalty4Score;
}

function putFormatStringInQrCode(ctx, width, height, formatString){
  // we know where the reserved modules should be so we can just hardcode coords
  // around the top-left finder pattern (start w/ horizontal strip then vertical)
  let vertModuleIdx = 0;
  for(let i = 0; i <= 8; i++){
    if(i === 6) continue; // this is the vertical timing pattern
    if(formatString[vertModuleIdx++] === '0'){
      ctx.fillStyle = 'rgb(255,255,255)';
    }else{
      ctx.fillStyle = 'rgb(0,0,0)';
    }
    ctx.fillRect(i, 8, 1, 1);
  }
  // vertical part
  for(let i = 8; i >= 0; i--){
    if(i === 6) continue; // this is the horizontal timing pattern
    if(formatString[vertModuleIdx++] === '0'){
      ctx.fillStyle = 'rgb(255,255,255)';
    }else{
      ctx.fillStyle = 'rgb(0,0,0)';
    }
    ctx.fillRect(8, i, 1, 1);
  }
  
  // around the top-right finder pattern (start @ index 7 of the format string from left to right)
  //const topRightHorzStartX = (((qrVersion - 1) * 4) + 21) - 7 - 1;
  //const topRightHorzStartY = 8;
  let horzModuleIdx = 7;
  for(let i = width - 8; i < width; i++){
    if(formatString[horzModuleIdx++] === '0'){
      ctx.fillStyle = 'rgb(255,255,255)';
    }else{
      ctx.fillStyle = 'rgb(0,0,0)';
    }
    ctx.fillRect(i, 8, 1, 1);
  }

  // around the bottom-left finder pattern (index 0-6 of format string from bottom to up)
  //const bottomLeftVertStartX = 8;
  vertModuleIdx = 6;
  for(let i = height - 7; i < height; i++){
    if(formatString[vertModuleIdx--] === '0'){
      ctx.fillStyle = 'rgb(255,255,255)';
    }else{
      ctx.fillStyle = 'rgb(0,0,0)';
    }
    ctx.fillRect(8, i, 1, 1);
  }
  
  console.log('put format string in qr code');
}

function putVersionInfoInQrCode(ctx, width, height, versionStr){
  // note! the version string should be placed backwards (the least significant bits get placed first)
  versionStr = versionStr.split('').reverse().join('');
  
  // bottom-left version block
  const leftMaxY = height - 8;
  const leftMinY = height - 11;
  const leftMinX = 0;
  const leftMaxX = 6;
  let versionStrIdx = 0;
  for(let i = leftMinX; i < leftMaxX; i++){
    for(let j = leftMinY; j < leftMaxY; j++){
      if(versionStr[versionStrIdx++] === '0'){
        ctx.fillStyle = 'rgb(255,255,255)';
      }else{
        ctx.fillStyle = 'rgb(0,0,0)';
      }
      ctx.fillRect(i, j, 1, 1);
    }
  }
  
  // - a 3 x 6 block to the left of the top-right finder pattern
  versionStrIdx = 0;
  const rightMaxY = 6;
  const rightMinY = 0;
  const rightMinX = width - 11;
  const rightMaxX = width - 8;
  for(let j = rightMinY; j < rightMaxY; j++){
    for(let i = rightMinX; i < rightMaxX; i++){
      if(versionStr[versionStrIdx++] === '0'){
        ctx.fillStyle = 'rgb(255,255,255)';
      }else{
        ctx.fillStyle = 'rgb(0,0,0)';
      }
      ctx.fillRect(i, j, 1, 1);
    }
  }
}

function applyDataMaskPatternAndQuietZone(ctx, formula, width, height, doNotTouchModules){
  console.log(`applying mask pattern formula: ${formula}`);
  
  // make a copy context to operate on so we don't mess with the original
  const newCanvas = document.createElement('canvas');
  newCanvas.width = width;
  newCanvas.height = height;
  
  const newCanvasCtx = newCanvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, width, height);
  
  newCanvasCtx.putImageData(imgData, 0, 0);
  
  for(let x = 0; x < width; x++){
    for(let y = 0; y < height; y++){
      const coord = `${x},${y}`;
      // if a module coord satisfies the given formula, flip the color
      if(!doNotTouchModules.has(coord) && formula(y, x)){
        const currColor = newCanvasCtx.getImageData(x, y, 1, 1).data;
        if(currColor[0] === 0){
          newCanvasCtx.fillStyle = 'rgb(255,255,255)';
        }else{
          newCanvasCtx.fillStyle = 'rgb(0,0,0)';
        }
        newCanvasCtx.fillRect(x, y, 1, 1);
      }
    }
  }
  
  // add quiet zone
  const newCanvas2 = document.createElement('canvas');
  newCanvas2.width = width + 8; // 4 modules on both sides
  newCanvas2.height = height + 8;
  
  const newCanvas2Ctx = newCanvas2.getContext('2d');
  newCanvas2Ctx.fillStyle = 'rgba(255,255,255,255)';
  newCanvas2Ctx.fillRect(0, 0, newCanvas2.width, newCanvas2.height);
  
  // now apply image data for QR code onto this new canvas
  newCanvas2Ctx.putImageData(newCanvasCtx.getImageData(0, 0, width, height), 4, 4);
  
  // put the canvas in the doc
  newCanvas2.style.border = '1px solid #000';
  newCanvas2.style.width = `${3 * newCanvas2.width}px`;
  newCanvas2.style.height = `${3 * newCanvas2.height}px`;
  newCanvas2.style.imageRendering = 'pixelated';
  
  const newCanvasContainer = document.getElementById('generatedQRCode2d');
  if(newCanvasContainer){
    for(let child of newCanvasContainer.children){
      newCanvasContainer.removeChild(child);
    }
    newCanvasContainer.appendChild(newCanvas2);
  }
  
  return newCanvas2;
}

// TODO: needs tests
function getSmallestQRVersion(inputString, errorCorrectionLevel){
  // https://stackoverflow.com/questions/2219526/how-many-bytes-in-a-javascript-string
  
  // get num bytes of inputString
  const numBytesInput = (new Blob([inputString])).size;
  
  // check table for version
  const versions = Array.from(Object.keys(characterCapacities));
  versions.sort();
  for(let i = versions.length - 1; i >= 0; i--){
    const v = versions[i];
    if(characterCapacities[v][errorCorrectionLevel] >= numBytesInput){
      return v;
    }
  }
  
  return null;
}

function getCharacterCountIndicator(inputString, qrVersion){
  // note! since an input could contain Chinese characters, for example, which could be at least 3 bytes per character
  // instead of 1 byte like for alphanumeric characters, don't depend on the length of the input string but rather the number of bytes
  // of the string
  const numChars = new TextEncoder().encode(inputString).length;
  
  // convert numChars to binary string
  let numCharsBinStr = intToBinary(numChars);
  
  // pad as needed depending on QR version
  const expectedLen = getCharCountIndicatorSize(qrVersion);
  const padLen = expectedLen - numCharsBinStr.length;
  
  // TODO: use zeroPadLeftStr function below
  if(padLen > 0){
    let zeroPadding = "";
    for(let i = 0; i < padLen; i++){
      zeroPadding += "0";
    }
    numCharsBinStr = zeroPadding + numCharsBinStr;
  }
  
  return numCharsBinStr;
}

function zeroPadLeftStr(inputStr, paddingAmount){
  if(paddingAmount > 0){
    let zeroPadding = "";
    for(let i = 0; i < paddingAmount; i++){
      zeroPadding += "0";
    }
    return zeroPadding + inputStr;
  }
  return inputStr;
}

// https://www.thonky.com/qr-code-tutorial/error-correction-coding
// "for the purposes of encoding a QR code, all addition and subtraction in GF(256) is performed by XORing the two numbers together"
// GF(256) = Galois field containing numbers up to 256
// hmmmm this is actually unnecessary I think - I'm just going to copy the table values in https://www.thonky.com/qr-code-tutorial/log-antilog-table
// but maybe something good to revisit later if I feel like doing everything by hand lol
function xorNums(num1, num2){
  const result = num1 ^ num2; // yay for built-in XOR operator
  return intToBinary(result);
}

function adjustCanvasBasedOnQRVersion(qrVersion, canvasElement){
  // size of QR code can be calculated with the formula (((qrVersion-1)*4)+21)
  const newSize = ((qrVersion - 1) * 4) + 21;
  console.log(`adjusting canvas to be ${newSize} x ${newSize}`);
  canvasElement.width = newSize;
  canvasElement.height = newSize;
}

function drawFinderPatternsAndSeparators(ctx, width, height, doNotTouchModules){
  // finder patterns are always 7 x 7
  // with an inner white square of 5 x 5
  // and a solid black square in the center that's 3 x 3
  // finder patterns are also always surrounded by a separator, which is just a white line
  const separatorDim = 8;
  const finderOuterDim = 7;
  const finderInnerDim = 5;
  const finderInnerCenter = 3;
  
  // draw top-right corner pattern
  ctx.fillStyle = 'rgb(255,255,255)'; // draw separator first
  ctx.fillRect(width - finderOuterDim - 1, 0, separatorDim, separatorDim);
  
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(width - finderOuterDim, 0, finderOuterDim, finderOuterDim);
  
  ctx.fillStyle = 'rgb(255,255,255)';
  ctx.fillRect(width - finderOuterDim + 1, 1, finderInnerDim, finderInnerDim);
  
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(width - finderOuterDim + 2, 2, finderInnerCenter, finderInnerCenter);
  
  // draw top-left corner pattern
  ctx.fillStyle = 'rgb(255,255,255)'; // draw separator first
  ctx.fillRect(0, 0, separatorDim, separatorDim);
  
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(0, 0, finderOuterDim, finderOuterDim);
  
  ctx.fillStyle = 'rgb(255,255,255)';
  ctx.fillRect(1, 1, finderInnerDim, finderInnerDim);
  
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(2, 2, finderInnerCenter, finderInnerCenter);
  
  // draw bottom-left corner pattern
  ctx.fillStyle = 'rgb(255,255,255)'; // draw separator first
  ctx.fillRect(0, height - finderOuterDim - 1, separatorDim, separatorDim);
  
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(0, height - finderOuterDim, finderOuterDim, finderOuterDim);
  
  ctx.fillStyle = 'rgb(255,255,255)';
  ctx.fillRect(1, height - finderOuterDim + 1, finderInnerDim, finderInnerDim);
  
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(2, height - finderOuterDim + 2, finderInnerCenter, finderInnerCenter);
  
  // record the coordinates that make up the patterns added
  // so we know not to touch those modules when adding data
  for(let i = 0; i < 8; i++){
    for(let j = 0; j < 8; j++){
      doNotTouchModules.add(`${i},${j}`);
    }
  }
  
  for(let i = width - 8; i < width; i++){
    for(let j = 0; j < 8; j++){
      doNotTouchModules.add(`${i},${j}`);
    }
  }
  
  for(let i = 0; i < 8; i++){
    for(let j = height - 8; j < height; j++){
      doNotTouchModules.add(`${i},${j}`);
    }
  }
}

// this is basically a version of the overlapping rectangle detection problem :D
function checkIfAlignmentPatternIsValid(qrVersion, alignmentPatternCenterX, alignmentPatternCenterY){
  // useful facts from https://www.thonky.com/qr-code-tutorial/module-placement-matrix#step-1-add-the-finder-patterns
  // QR code size == ((qrVersion - 1) * 4) + 21
  // finder patterns are always 7 x 7
  // separators are always around the finder patterns and 1 module wide
  // top-left finder pattern's top left corner is always 0,0
  // top-right finder pattern's top left corner is always ((((qrVersion - 1) * 4) + 21) - 7, 0)
  // bottom-left finder pattern's top left corner is always (0, (((qrVersion - 1) * 4) + 21) - 7)
  // alignment patterns are 5 x 5
  
  // given the facts above, we should just see if the 5 x 5 block formed around (alignmentPatternCenterX, alignmentPatternCenterY) 
  // falls within the 8 x 8 blocks (8 because including the separator) formed at the top-left corners of the finder patterns
  
  // determine max/min coords of alignment pattern to check
  const alignmentPatternMinX = alignmentPatternCenterX - 2;
  const alignmentPatternMaxX = alignmentPatternCenterX + 2;
  const alignmentPatternMinY = alignmentPatternCenterY - 2;
  const alignmentPatternMaxY = alignmentPatternCenterY + 2;
  //console.log(`alignmentPatternMinX: ${alignmentPatternMinX}, alignmentPatternMaxX: ${alignmentPatternMaxX}, alignmentPatternMinY: ${alignmentPatternMinY}, alignmentPatternMaxY: ${alignmentPatternMaxY}`);
  
  // check top-left finder pattern + separator
  const topLeftMinX = 0;
  const topLeftMaxX = 8;
  const topLeftMinY = 0;
  const topLeftMaxY = 8;
  
  // if alignment pattern falls within the top-left finder pattern + separator, we can't draw it
  if(alignmentPatternMinX >= topLeftMinX && 
    alignmentPatternMaxX <= topLeftMaxX &&
    alignmentPatternMinY >= topLeftMinY &&
    alignmentPatternMaxY <= topLeftMaxY){
    return false;
  }
  
  // check top-right finder pattern + separator
  const topRightMinX = (((qrVersion - 1) * 4) + 21) - 7 - 1; // subtract 1 to account for the separator
  const topRightMaxX = topRightMinX + 7;
  const topRightMinY = 0;
  const topRightMaxY = 8;
  
  //console.log(`topRightMinX: ${topRightMinX}, topRightMaxX: ${topRightMaxX}, topRightMinY: ${topRightMinY}, topRightMaxY: ${topRightMaxY}`);
  
  // we only need to see if the alignment pattern's right corner overlaps with the top right finder+separator pattern since it's static
  // so we only care about comparing alignmentPatternMaxX and alignmentPatternMinY 
  if(alignmentPatternMaxX >= topRightMinX && 
    alignmentPatternMaxX <= topRightMaxX &&
    alignmentPatternMinY >= topRightMinY &&
    alignmentPatternMinY <= topRightMaxY){
    return false;
  }
  
  // check bottom-left finder pattern + separator
  const bottomLeftMinX = 0;
  const bottomLeftMaxX = 8;
  const bottomLeftMinY = (((qrVersion - 1) * 4) + 21) - 7 - 1; // subtract 1 to account for the separator
  const bottomLeftMaxY = bottomLeftMinY + 7;
  
  // similar to above but we care about the bottom left corner of the alignment pattern overlapping with the bottom left finder/separator pattern
  // so we only care about comparing alignmentPatternMinX and alignmentPatternMaxY
  if(alignmentPatternMinX >= bottomLeftMinX && 
    alignmentPatternMinX <= bottomLeftMaxX &&
    alignmentPatternMaxY >= bottomLeftMinY &&
    alignmentPatternMaxY <= bottomLeftMaxY){
    return false;
  }
  
  return true;
}

function drawAlignmentPattern(ctx, centerX, centerY, doNotTouchModules){
  // alignment patterns are 5 x 5
  
  // first draw a 5 x 5 black square
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(centerX - 2, centerY - 2, 5, 5);
  
  // then a 3 x 3 white square
  ctx.fillStyle = 'rgb(255,255,255)';
  ctx.fillRect(centerX - 1, centerY - 1, 3, 3);
  
  // then the center
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(centerX, centerY, 1, 1);
  
  for(let i = centerX - 2; i <= centerX + 2; i++){
    for(let j = centerY - 2; j <= centerY + 2; j++){
      doNotTouchModules.add(`${i},${j}`);
    }
  }
}

function addAlignmentPatterns(qrVersion, ctx, doNotTouchModules){
  // QR codes that are >= version 2 are required to have alignment patterns
  // an alignment pattern is a 5 x 5 black square with a 3 x 3 white square inside and a black square in the center
  // alignment patterns must not overlap with the finder or separator patterns
  const alignmentPatternLocations = alignmentPatternLocationsTable[qrVersion];
  console.log(alignmentPatternLocations);
  
  // need to generate all (x,y) locations of the alignment patterns
  const locationCoords = [];
  for(let i = 0; i < alignmentPatternLocations.length; i++){
    for(let j = 0; j < alignmentPatternLocations.length; j++){
      locationCoords.push({
        'x': alignmentPatternLocations[i],
        'y': alignmentPatternLocations[j], 
      });
    }
  }
  
  // remember each location coord is only the coord of the center module.
  // we need to check if any part of the whole alignment pattern at a given coord falls within
  // a finder/separator pattern. if it does, don't draw the alignment pattern.
  locationCoords.forEach(coord => {
    const canDrawAlignmentPattern = checkIfAlignmentPatternIsValid(qrVersion, coord.x, coord.y);
    if(canDrawAlignmentPattern){
      drawAlignmentPattern(ctx, coord.x, coord.y, doNotTouchModules);
    }
  });
  
  //console.log(locationCoords);
}

function addTimingPatterns(qrVersion, ctx, doNotTouchModules){
  // the horizontal timing pattern is placed on the 6th row of the QR code between the separators (remember rows and cols are 0-indexed)
  let horzStartX = (((qrVersion - 1) * 4) + 21) - 7 - 2; // subtract 1 to account for the separator and 1 more to get to where we need to start
  const horzStartY = 6;
  const horzStopX = 7;
  
  //console.log(`horizontal timing pattern start x: ${horzStartX}. end x: ${horzStopX}`);
  
  let isBlack = true;
  while(horzStartX > horzStopX){
    if(isBlack){
      ctx.fillStyle = 'rgb(0,0,0)';
    }else{
      ctx.fillStyle = 'rgb(255,255,255)';
    }
    ctx.fillRect(horzStartX, horzStartY, 1, 1);
    doNotTouchModules.add(`${horzStartX},${horzStartY}`);
    isBlack = !isBlack;
    horzStartX--;
  }
  
  // the vertical timing pattern is placed on the 6th column of the QR code between the separators
  let vertStartY = 8;
  const vertStartX = 6;
  const vertStopY = (((qrVersion - 1) * 4) + 21) - 7 - 1;
  
  //console.log(`vertical timing pattern start x: ${vertStartY}. end y: ${vertStopY}`);
  
  isBlack = true;
  while(vertStartY < vertStopY){
    if(isBlack){
      ctx.fillStyle = 'rgb(0,0,0)';
    }else{
      ctx.fillStyle = 'rgb(255,255,255)';
    }
    ctx.fillRect(vertStartX, vertStartY, 1, 1);
    doNotTouchModules.add(`${vertStartX},${vertStartY}`);
    isBlack = !isBlack;
    vertStartY++;
  }
}

function addDarkModuleAndReservedAreas(qrVersion, ctx, doNotTouchModules){
  // the dark module is always located at the coordinate (8, (4 * qrVersion) + 9)
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(8, (4 * qrVersion) + 9, 1, 1);
  //console.log(`adding dark module to doNotTouch: 8,${(4 * qrVersion) + 9}`);
  doNotTouchModules.add(`8,${(4 * qrVersion) + 9}`);
  
  // add reserved data areas
  // format info areas:
  // - near the top-left finder pattern, add a one-module strip below and to the right of the separator
  // - near the top-right finder pattern. add a one-module strip below the separator
  // - near the bottom-left finder pattern, add a one-module strip to the right of the separator
  ctx.fillStyle = 'rgb(0,0,255)'; // mark the spots as blue
  
  const topLeftVertStartX = 8;
  const topLeftVertStartY = 0;
  const topLeftVertEndY = 8;
  for(let y = topLeftVertStartY; y <= topLeftVertEndY; y++){
    if(y !== 6){
      // make sure to skip the timing pattern @ y == 6
      ctx.fillRect(topLeftVertStartX, y, 1, 1);
      doNotTouchModules.add(`${topLeftVertStartX},${y}`);
    }
  }
  
  const topLeftHorzStartX = 0;
  const topLeftHorzStartY = 8;
  const topLeftHorzEndX = 8;
  for(let x = topLeftHorzStartX; x < topLeftHorzEndX; x++){
    if(x !== 6){
      // make sure to skip the timing pattern @ y == 6
      ctx.fillRect(x, topLeftHorzStartY, 1, 1);
      doNotTouchModules.add(`${x},${topLeftHorzStartY}`);
    }
  }
  
  const topRightHorzStartX = (((qrVersion - 1) * 4) + 21) - 7 - 1;
  const topRightHorzStartY = 8;
  const topRightHorzEndX = topRightHorzStartX + 8;
  //console.log(`reserved area top right horz - start x: ${topRightHorzStartX}, end x: ${topRightHorzEndX}`);
  for(let x = topRightHorzStartX; x < topRightHorzEndX; x++){
    ctx.fillRect(x, topRightHorzStartY, 1, 1);
    doNotTouchModules.add(`${x},${topRightHorzStartY}`);
  }
  
  const bottomLeftVertStartX = 8;
  const bottomLeftVertStartY = (((qrVersion - 1) * 4) + 21) - 7;
  const bottomLeftVertEndY = (((qrVersion - 1) * 4) + 21);
  //console.log(`reserved area bottom left vert - start y: ${bottomLeftVertStartY}, end y: ${bottomLeftVertEndY}`);
  for(let y = bottomLeftVertStartY; y < bottomLeftVertEndY; y++){
    ctx.fillRect(bottomLeftVertStartX, y, 1, 1);
    doNotTouchModules.add(`${bottomLeftVertStartX},${y}`);
  }
  
  // version information areas (if QR code version >= 7)
  // - a 6 x 3 block above the bottom-left finder pattern
  if(qrVersion >= 7){
    const leftMaxY = (((qrVersion - 1) * 4) + 21) - 7 - 1;
    const leftMinY = (((qrVersion - 1) * 4) + 21) - 7 - 4;
    const leftMinX = 0;
    const leftMaxX = 6;
    //console.log(`reserved area version bottom left - start y: ${leftMinY}, end y: ${leftMaxY}`);
    for(let i = leftMinX; i < leftMaxX; i++){
      for(let j = leftMinY; j < leftMaxY; j++){
        ctx.fillRect(i, j, 1, 1);
        doNotTouchModules.add(`${i},${j}`);
      }
    }
    
    // - a 3 x 6 block to the left of the top-right finder pattern
    const rightMaxY = 6;
    const rightMinY = 0;
    const rightMinX = (((qrVersion - 1) * 4) + 21) - 7 - 4;
    const rightMaxX = (((qrVersion - 1) * 4) + 21) - 7 - 1;
    //console.log(`reserved area version top-right - start x: ${rightMinX}, end x: ${rightMaxX}`);
    for(let i = rightMinX; i < rightMaxX; i++){
      for(let j = rightMinY; j < rightMaxY; j++){
        ctx.fillRect(i, j, 1, 1);
        doNotTouchModules.add(`${i},${j}`);
      }
    }
  }
}

function addData(width, height, data, qrVersion, ctx, doNotTouchModules, dataIndexToStopAt=null){
  console.log(`width:${width}, height:${height}`);
  console.log(doNotTouchModules);
  console.log(`data.length: ${data.length}`);
  // when going up, fill right, then left
  // when going down, fill right, then left
  
  // start at bottom-right of matrix
  let currX = width - 1;
  let currY = height - 1;
  let direction = 'up';
  let lastMove = 0; // if lastMove == 0, next module should on the left of curr module. otherwise, go to the next row (up or down depending on direction)
  
  function advance(){
    if(direction === 'up'){
      if(lastMove === 0){
        currX--;
        lastMove = 1;
      }else{
        currY--; // remember that going up in canvas space means decreasing y coord
        currX++;
        lastMove = 0;
      }
    }else{
      // going downwards
      if(lastMove === 0){
        currX--;
        lastMove = 1;
      }else{
        currY++;
        currX++;
        lastMove = 0;
      }
    }
    
    // if we get out-of-bounds, we need to flip directions
    // I think lastMove would always be 0 before going out-of-bounds
    if(direction === 'up' && currY < 0){
      currY = 0;
      // if lastMove was 0, we're trying to zigzag to an out-of-bounds module
      // so our currX value should be decreased by 2 (shift left by 2)
      // if lastMove was 1, we'd just need to shift left by 1
      currX -= 2;
      // special note! for the vertical timing pattern that occurs @ column 6,
      // we need to skip column 6 as well so we need to move over by 3 instead
      // I think we'd only reach the vertical timing pattern column when going from up to down
      // so we don't need to worry about hitting it from down to up?
      if(currX === 6){
        //console.error('hit the timing pattern');
        currX--;
      }
      direction = 'down';
      lastMove = 0;
      //console.log('switching direction to down');
    }else if(direction === 'down' && currY === height){
      currY = height - 1;
      currX -= 2;
      direction = 'up';
      lastMove = 0;
      //console.log('switching direction to up');
    }
  }
  
  //const seen = new Set();
  const stopAt = dataIndexToStopAt || data.length;
  
  for(let i = 0; i < stopAt; i++){
    if(data[i] === '0'){
      ctx.fillStyle = 'rgb(255,255,255)';
    }else{
      ctx.fillStyle = 'rgb(0,0,0)';
    }
    //console.log(`writing to: (${currX},${currY})`);
    ctx.fillRect(currX, currY, 1, 1);
    
    advance();

    // we should keep moving on until we find a suitable spot
    while(doNotTouchModules.has(`${currX},${currY}`)){
      //console.warn('hit a do not touch module!');
      //console.error(`skipping (${currX},${currY}) because reserved module`);
      advance();
    }
    
    //console.log(`next module location: (${currX},${currY})`);
  }
  
  console.log('done');
}

function generateQRCode(inputStr){
  console.log(`input str: ${inputStr}`);
  
  if(inputStr === ''){
    console.log('no input provided. nothing to do.');
    return;
  }
  
  let bitstring = '';
  
  // create the canvas to draw the QR code in
  const canvas = document.createElement('canvas'); 
  const ctx = canvas.getContext('2d');
  
  // set bg to black
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // let's default to "byte mode" for now (that is, only support strings with characters from ISO-8859-1 character set)
  const mode = '0100'; // mode indicator (4 bits)
  
  // add ECI segment for supporting Chinese characters - as of 12/4/25 this doesn't seem to be necessary anymore! at least when testing with my Pixel 6a (which had a system update this past Sept - maybe related?)
  //https://www.reddit.com/r/programming/comments/9th8a7/creating_a_qr_code_step_by_step/
  //https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/qrcode/encoder/Encoder.java - helpful?? looks like ECI segment comes first, then mode and everything else?
  //https://stackoverflow.com/questions/51516612/choosing-a-character-encoding-for-qr-codes
  //https://github.com/bwipp/postscriptbarcode/discussions/267
  //bitstring += '0111'; // ECI mode
  //bitstring += '00011010';
  
  bitstring += mode;
  
  // let's default to level M for error correction (L - 7% data recovery, M - 15%, Q - 25%, H - 30%)
  // the higher the error correction level, the larger the QR code will be (b/c it takes more bytes)
  const errorCorrectionLevel = 'M';
  
  // figure out QR code version/size
  const qrVersion = getSmallestQRVersion(inputStr, errorCorrectionLevel);
  console.log(`qr version: ${qrVersion}`);
  
  // readjust canvas
  adjustCanvasBasedOnQRVersion(qrVersion, canvas);
  
  // get character count indicator
  const charCountIndicator = getCharacterCountIndicator(inputStr, qrVersion);
  console.log(`char count indicator: ${charCountIndicator}`);
  bitstring += charCountIndicator;
  
  // now encode the data into binary
  let encodedData = getInputStrAsBinaryStr(inputStr);
  console.log(`input str as binary: ${encodedData}`);
  
  // put encodedData after charCountIndicator
  console.log(`data so far: ${mode}, ${charCountIndicator}, ${encodedData}`);
  encodedData = bitstring + encodedData;
  
  // determine required number of bits for this QR code
  const errorCorrection = errorCorrectionTable[`${qrVersion}M`];
  const totalDataCodewords = errorCorrection.totalDataCodewords;
  const totalBitsRequired = totalDataCodewords * 8;
  console.log(`total bits required: ${totalBitsRequired}`);
  
  encodedData = padEncodedData(encodedData, totalBitsRequired);
  console.log(`encoded data length so far: ${encodedData.length}`);
  
  // if QR code version > 2, we need to break up the data codewords into smaller blocks
  const numGroup1Blocks = errorCorrection.numBlocksGroup1;
  const numCodewordsPerGroup1Block = errorCorrection.numDataCodewordsPerGroup1Block;
  const numGroup2Blocks = errorCorrection.numBlocksGroup2;
  const numCodewordsPerGroup2Block = errorCorrection.numDataCodewordsPerGroup2Block;
  const numErrorCorrectionCodewordsPerBlock = errorCorrection.ecCodewordsPerBlock;
  
  //  break up the data codewords into their respective groups and blocks
  const wordBlocks = divideDataCodewordsIntoGroupsAndBlocks(encodedData, numGroup1Blocks, numCodewordsPerGroup1Block, numGroup2Blocks, numCodewordsPerGroup2Block);
  console.log(wordBlocks);
  
  // generate the error correction codewords for each block
  const errorCorrectionCodewords = generateErrorCorrectionCodewords(wordBlocks, numErrorCorrectionCodewordsPerBlock);
  console.log(errorCorrectionCodewords);
  
  // structure the final message
  const data = interleaveDataAndErrorCodewords(wordBlocks, errorCorrectionCodewords, qrVersion);
  
  // then draw the data
  
  // use a set to keep track of modules in the QR matrix we shouldn't touch
  const doNotTouchModules = new Set();
  
  // set up the canvas with the right dimensions depending on QR version. use formula: (((qrVersion-1)*4)+21)
  drawFinderPatternsAndSeparators(ctx, canvas.width, canvas.height, doNotTouchModules);
  
  // add the alignment patterns
  addAlignmentPatterns(qrVersion, ctx, doNotTouchModules);
  
  // add the timing patterns
  addTimingPatterns(qrVersion, ctx, doNotTouchModules);
  
  // add the dark module and reserved areas
  addDarkModuleAndReservedAreas(qrVersion, ctx, doNotTouchModules);
  
  // add the data (finally)
  /* check doNotTouch areas
  console.log(doNotTouchModules);
  const coords = [...doNotTouchModules];
  coords.forEach(c => {
    const x = parseInt(c.split(',')[0]);
    const y = parseInt(c.split(',')[1]);
    ctx.fillStyle = 'rgb(255,0,0)';
    ctx.fillRect(x, y, 1, 1);
  });*/
  
  // capture ctx just before adding data so we can use it to explore how the data is added
  const beforeAddingDataImgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  addData(canvas.width, canvas.height, data, qrVersion, ctx, doNotTouchModules);
  
  // data masking (get mask pattern with lowest penalty score)
  const maskPatternScores = maskPatternFormulae.map((formula, idx) => {
    return getDataMaskPatternResult(ctx, formula, doNotTouchModules, canvas.width, canvas.height, idx+1);
  })
  console.log(maskPatternScores);
  
  let lowestScoringMaskPatternIdx = 0;
  maskPatternScores.forEach((s, idx) => {
    if(s < maskPatternScores[lowestScoringMaskPatternIdx]){ 
      lowestScoringMaskPatternIdx = idx;
    }
  });
  console.log(`lowest score mask pattern index: ${lowestScoringMaskPatternIdx}`);
  
  // add version and data format info
  const errorCorrectionLevelBitString = errorCorrectionLevelBitsMap[errorCorrectionLevel];
  const maskPatternBitString = maskPatternBitsMap[lowestScoringMaskPatternIdx];
  const fiveBitFormatString = errorCorrectionLevelBitString + maskPatternBitString;
  console.log(`five bit format string: ${fiveBitFormatString}`);
  
  // generate error correction bits for format string
  const errCorrectionBits = generateErrorCorrectionBitsFormatString(fiveBitFormatString);
  console.log(`error correction bits: ${errCorrectionBits}`);
  
  const maskString = '101010000010010'; // https://www.thonky.com/qr-code-tutorial/format-version-information
  const finalFormatString = xorBinStrings(fiveBitFormatString + errCorrectionBits, maskString);
  console.log(`final format string: ${finalFormatString}`);
  
  // put the finalFormatString in the QR code
  putFormatStringInQrCode(ctx, canvas.width, canvas.height, finalFormatString);
  
  // generate error correction bits for version string if needed
  if(qrVersion >= 7){
    // convert qr version to binary string of length 6
    const versionStr = qrVersionToBinStr(qrVersion);
    const finalVersionString = versionStr + generateErrorCorrectionBitsVersionString(versionStr);
    console.log(`version final string: ${finalVersionString}`);
    
    // put the final version string in the QR code
    putVersionInfoInQrCode(ctx, canvas.width, canvas.height, finalVersionString);
  }
  
  canvas.style.border = '1px solid #ccc';
  
  // output final matrix
  const finalResultCanvas = applyDataMaskPatternAndQuietZone(ctx, maskPatternFormulae[lowestScoringMaskPatternIdx], canvas.width, canvas.height, doNotTouchModules);
  
  return finalResultCanvas;
}

function test(){
  // TODO
  console.log('---------- test -----------');
  const input = "Hello world!"; //"http://www.google.com";
  console.log(`input: ${input}`);
  
  // assumptions: level M for error correction, byte mode only
  const mode = "0100";
  console.log(`mode: ${binaryToInt(mode)} (${mode})`);
  const errorCorrectionLevel = "M";
  
  const qrVersion = getSmallestQRVersion(input, errorCorrectionLevel);
  console.log(`QR version: ${qrVersion}`);
  // assertion for qrVersion
  
  const charCountIndicator = getCharacterCountIndicator(input, qrVersion);
  console.log(`character count indicator: ${charCountIndicator}`);
  // assertion for charCountIndicator
  if(charCountIndicator.length !== 8){
    console.error(`char count indicator should be 8 bits (assuming QR version 9, byte mode)`);
  }
  
  const encodedInputStr = getInputStrAsBinaryStr(input);
  console.log(`encoded input str: ${encodedInputStr}`);
  // assertion for encodedInputStr
  
  // pad the data as needed and then divide into blocks/groups
  const errorCorrection = errorCorrectionTable[`${qrVersion}M`];
  console.log(errorCorrection);
  
  const totalDataCodewords = errorCorrection.totalDataCodewords;
  console.log(`total data codewords: ${totalDataCodewords}`);
  
  const totalBitsRequired = totalDataCodewords * 8;
  console.log(`total bits required: ${totalBitsRequired}`);
  
  const encodedData = padEncodedData(encodedInputStr, totalBitsRequired);
  console.log(`encoded data length: ${encodedData.length}`);
  console.log(encodedData);
  
  const numGroup1Blocks = errorCorrection.numBlocksGroup1;
  const numCodewordsPerGroup1Block = errorCorrection.numDataCodewordsPerGroup1Block;
  const numGroup2Blocks = errorCorrection.numBlocksGroup2;
  const numCodewordsPerGroup2Block = errorCorrection.numDataCodewordsPerGroup2Block;
  const numErrorCorrectionCodewordsPerBlock = errorCorrection.ecCodewordsPerBlock;
  
  // break up the data codewords into their respective groups and blocks
  const wordBlocks = divideDataCodewordsIntoGroupsAndBlocks(
    encodedData, 
    numGroup1Blocks, 
    numCodewordsPerGroup1Block, 
    numGroup2Blocks, 
    numCodewordsPerGroup2Block
  );
  console.log(wordBlocks);
  
  // generate error correction codewords
  const errorCorrectionCodewords = generateErrorCorrectionCodewords(wordBlocks, numErrorCorrectionCodewordsPerBlock);
  console.log(errorCorrectionCodewords);
  
  const data = interleaveDataAndErrorCodewords(wordBlocks, errorCorrectionCodewords, qrVersion);
  console.log(`interleaved data + error codewords: ${data}, length: ${data.length}`);
  console.log('----------- end test -----------');
}

//test();
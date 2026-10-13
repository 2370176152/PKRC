const fs = require("fs");
const CryptoJS = require("crypto-js");

const SAVE_KEY = "x0i2O7WRiANTqPmZ";
const filePath = process.argv[2];
const pkmIdx = parseInt(process.argv[3]) || 0;

const data = fs.readFileSync(filePath, "utf8");
const bytes = CryptoJS.AES.decrypt(data, SAVE_KEY);
const json = bytes.toString(CryptoJS.enc.Utf8);
const obj = JSON.parse(json);

const pkm = obj.party[pkmIdx];
console.log(`=== 宝可梦[${pkmIdx}] species=${pkm.species} ===`);
console.log(JSON.stringify(pkm, null, 2));

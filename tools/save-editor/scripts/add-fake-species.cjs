const fs = require("fs");
const CryptoJS = require("crypto-js");

const SAVE_KEY = "x0i2O7WRiANTqPmZ";
const inputPath = process.argv[2];
const outputPath = process.argv[3] || inputPath;
const pkmIdx = parseInt(process.argv[4]) || 0;
const fakeSpeciesId = parseInt(process.argv[5]) || 1024; // TERAPAGOS = 1024

if (!inputPath) {
  console.error("用法: node add-fake-species.cjs <input.prsv> [output.prsv] [pkmIdx] [fakeSpeciesId]");
  process.exit(1);
}

const data = fs.readFileSync(inputPath, "utf8");
const bytes = CryptoJS.AES.decrypt(data, SAVE_KEY);
const json = bytes.toString(CryptoJS.enc.Utf8);
const obj = JSON.parse(json);

const pkm = obj.party[pkmIdx];
if (!pkm) {
  console.error(`找不到宝可梦[${pkmIdx}]`);
  process.exit(1);
}

console.log(`修改前: species=${pkm.species}, customPokemonData.fakeSpeciesIds=${JSON.stringify(pkm.customPokemonData?.fakeSpeciesIds)}`);

// 确保 customPokemonData 存在
if (!pkm.customPokemonData) {
  pkm.customPokemonData = {};
}
if (!pkm.customPokemonData.fakeSpeciesIds) {
  pkm.customPokemonData.fakeSpeciesIds = [];
}

// 添加伪物种ID（去重）
if (!pkm.customPokemonData.fakeSpeciesIds.includes(fakeSpeciesId)) {
  pkm.customPokemonData.fakeSpeciesIds.push(fakeSpeciesId);
}

console.log(`修改后: species=${pkm.species}, customPokemonData.fakeSpeciesIds=${JSON.stringify(pkm.customPokemonData.fakeSpeciesIds)}`);

// 重新加密并保存
const newJson = JSON.stringify(obj);
const encrypted = CryptoJS.AES.encrypt(newJson, SAVE_KEY).toString();
fs.writeFileSync(outputPath, encrypted, "utf8");

console.log(`\n已保存到: ${outputPath}`);

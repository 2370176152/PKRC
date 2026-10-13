const fs = require("fs");
const path = require("path");
const code = fs.readFileSync(path.join(__dirname, "..", "data", "modifier-classes.js"), "utf8") +
  fs.readFileSync(path.join(__dirname, "..", "data", "modifier-expanded.js"), "utf8") + `

console.log('=== 关键类型验证 ===');
['LEFTOVERS','SHELL_BELL','SOUL_DEW','BASE_STAT_BOOSTER','ATTACK_TYPE_BOOSTER','TERA_SHARD','MINT','BERRY'].forEach(k=>{
  const c=MODIFIER_CLASSES[k];
  console.log(k+': cls='+c.className+', isHeld='+c.isHeld+', isGen='+c.isGenerator);
});

console.log('\\n=== 展开选项验证(每类前2个) ===');
['MINT','TERA_SHARD','BASE_STAT_BOOSTER','ATTACK_TYPE_BOOSTER'].forEach(t=>{
  const items=MODIFIER_EXPANDED.filter(e=>e.baseTypeId===t).slice(0,2);
  console.log(t+': 共'+MODIFIER_EXPANDED.filter(e=>e.baseTypeId===t).length+'种');
  items.forEach(i=>console.log('  '+i.name+' (cls='+i.className+', args='+JSON.stringify(i.typePregenArgs)+')'));
});
`;
eval(code);

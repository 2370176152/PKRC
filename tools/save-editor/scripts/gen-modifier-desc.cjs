// 生成 modifier-descriptions.js: typeId -> 效果说明
const fs = require("fs");
const path = require("path");
// 上游 PokeRogue 源码树位置：默认仓库同级 pokerogue-upstream，可用环境变量 POKEROGUE_UPSTREAM 覆盖
const UPSTREAM = process.env.POKEROGUE_UPSTREAM || path.resolve(__dirname, "..", "..", "..", "..", "pokerogue-upstream");

// 读取 modifier-type.json
const mtJsonPath = path.join(UPSTREAM, "dist", "locales", "zh-Hans", "modifier-type.json");
const mtJson = JSON.parse(fs.readFileSync(mtJsonPath, "utf8"));
const mtData = mtJson.ModifierType || {};

// 读取 modifier-names.js 获取所有 typeId
const namesRaw = fs.readFileSync(path.join(__dirname, "..", "data", "modifier-names.js"), "utf8");
const namesMatch = namesRaw.match(/const MODIFIER_NAMES = \{([\s\S]*)\};/);
const typeIds = [];
const re = /"([A-Z0-9_]+)":/g;
let m;
while ((m = re.exec(namesMatch[1])) !== null) {
  typeIds.push(m[1]);
}

// 获取每个 typeId 的 description
function getDescription(typeId) {
  // 直接在 mtData 里有该 typeId 的对象 (带 description)
  if (mtData[typeId] && mtData[typeId].description) {
    return cleanDesc(mtData[typeId].description);
  }
  // 根据 ModifierType 子类名匹配 (mtData 的 key 是类名)
  // 通过 modifier-classes.js 查找 className
  const clsRaw = fs.readFileSync(path.join(__dirname, "..", "data", "modifier-classes.js"), "utf8");
  const clsMatch = clsRaw.match(new RegExp(`"${typeId}":\\s*\\{\\s*className:\\s*"([\\w]+)"`));
  if (clsMatch) {
    const className = clsMatch[1];
    if (mtData[className] && mtData[className].description) {
      return cleanDesc(mtData[className].description);
    }
  }
  // 手动补充
  const manual = {
    POKEBALL: "用于捕捉野生宝可梦的球。捕捉倍率: 1.0。",
    GREAT_BALL: "比精灵球更容易捕捉宝可梦的球。捕捉倍率: 1.5。",
    ULTRA_BALL: "比超级球捕捉率更高的球。捕捉倍率: 2.0。",
    ROGUE_BALL: "肉鸽专属球，捕捉率极高。捕捉倍率: 2.5。",
    MASTER_BALL: "能必定捕捉到任何宝可梦的球。捕捉倍率: 255。",
    RARE_CANDY: "使一只宝可梦的等级提升1级。",
    RARER_CANDY: "使所有宝可梦的等级提升1级。",
    EVOLUTION_ITEM: "使某些宝可梦进化的道具。",
    RARE_EVOLUTION_ITEM: "稀有的进化道具，使某些宝可梦进化。",
    FORM_CHANGE_ITEM: "使某些宝可梦更改形态的道具。",
    RARE_FORM_CHANGE_ITEM: "稀有的形态变更道具。",
    POTION: "为一只宝可梦回复20点HP或10%HP，取较大值。",
    SUPER_POTION: "为一只宝可梦回复60点HP或15%HP，取较大值。",
    HYPER_POTION: "为一只宝可梦回复150点HP或30%HP，取较大值。",
    MAX_POTION: "为一只宝可梦回复全部HP。",
    FULL_RESTORE: "为一只宝可梦回复全部HP并消除所有负面状态。",
    REVIVE: "复活一只宝可梦并回复50%HP。",
    MAX_REVIVE: "复活一只宝可梦并回复全部HP。",
    FULL_HEAL: "为一只宝可梦消除所有负面状态。",
    SACRED_ASH: "复活所有濒死的宝可梦并完全回复HP。",
    ETHER: "为一只宝可梦的一个招式回复10PP。",
    MAX_ETHER: "完全回复一只宝可梦一个招式的PP。",
    ELIXIR: "为一只宝可梦的所有招式回复10PP。",
    MAX_ELIXIR: "为一只宝可梦的所有招式回复所有PP。",
    PP_UP: "使一只宝可梦的一个招式PP最大值提升20% (最多3次)。",
    PP_MAX: "使一只宝可梦的一个招式PP最大值提升60% (一次性满)。",
    LURE: "遭遇双打概率提升四倍，持续5场战斗。",
    SUPER_LURE: "遭遇双打概率提升四倍，持续10场战斗。",
    MAX_LURE: "遭遇双打概率提升四倍，持续15场战斗。",
    SPECIES_STAT_BOOSTER: "增加10%持有者的特定属性，个体值越高堆叠上限越高。",
    RARE_SPECIES_STAT_BOOSTER: "增加15%持有者的特定属性，个体值越高堆叠上限越高。",
    TEMP_STAT_STAGE_BOOSTER: "提升全队的特定属性1阶，持续5场战斗。",
    DIRE_HIT: "提升全队的要害率 (会心) 2阶，持续5场战斗。",
    BASE_STAT_BOOSTER: "增加10%持有者的特定基础属性。",
    ATTACK_TYPE_BOOSTER: "一只宝可梦的特定属性招式威力提升20%。",
    MINT: "将一只宝可梦的性格改为特定性格并永久解锁该性格。",
    TERA_SHARD: "将宝可梦的太晶属性变为特定属性。",
    BERRY: "使用后可回复HP或治愈异常状态的树果。",
    TM_COMMON: "教会一只宝可梦一个普通招式。",
    TM_GREAT: "教会一只宝可梦一个好招式。",
    TM_ULTRA: "教会一只宝可梦一个高级招式。",
    EXP_CHARM: "经验值获取量增加20%。",
    SUPER_EXP_CHARM: "经验值获取量增加50%。",
    GOLDEN_EXP_CHARM: "经验值获取量增加100%。",
    LUCKY_EGG: "持有者经验值获取量增加50%。",
    GOLDEN_EGG: "持有者经验值获取量增加100%。",
    SOOTHE_BELL: "亲密度获取量增加50%。",
    NUGGET: "获得少量金钱。",
    BIG_NUGGET: "获得中量金钱。",
    RELIC_GOLD: "获得大量金钱。",
    GRIP_CLAW: "持有者的攻击招式有概率不消耗PP。",
    WIDE_LENS: "招式命中率增加10%。",
    MULTI_LENS: "将持有者本次伤害的25%转化为一次独立的攻击。",
    DNA_SPLICERS: "融合两只宝可梦 (改变特性, 平分基础点数和属性, 共享招式池)。",
    MINI_BLACK_HOLE: "抽取每波结束后敌人道具的30%。",
    VOUCHER: "可兑换扭蛋机的普通扭蛋券。",
    VOUCHER_PLUS: "可兑换扭蛋机的中级扭蛋券。",
    VOUCHER_PREMIUM: "可兑换扭蛋机的高级扭蛋券。",
    SILVER_POKEBALL: "在每场战斗结束后，增加一个额外物品选项 (白银版)。",
    ENEMY_ATTACK_POISON_CHANCE: "攻击时有概率造成中毒状态。",
    ENEMY_ATTACK_PARALYZE_CHANCE: "攻击时有概率造成麻痹状态。",
    ENEMY_ATTACK_BURN_CHANCE: "攻击时有概率造成灼伤状态。",
    ENEMY_ENDURE_CHANCE: "敌方增加概率在本回合不会倒下。",
    MYSTERY_ENCOUNTER_SHUCKLE_JUICE: "增加持有者的所有基础个体值。",
  };
  if (manual[typeId]) return manual[typeId];
  return "";
}

// 清理描述文本: 去除模板变量 {{...}}, 换行符等
function cleanDesc(desc) {
  // 保留 {{...}} 模板变量但去除换行符 \n
  // 将 \n 替换为空格
  let cleaned = desc.replace(/\\n/g, " ").replace(/\n/g, " ");
  // 去除多余空格
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

let out = "// 自动生成: Modifier typeId -> 效果说明\n";
out += "// 描述中的 {{xxx}} 是运行时变量, 显示为占位符\n";
out += "const MODIFIER_DESCRIPTIONS = {\n";
let count = 0;
let found = 0;
for (const tid of typeIds) {
  const desc = getDescription(tid);
  if (desc) {
    // 转义双引号
    const escaped = desc.replace(/"/g, '\\"');
    out += `  "${tid}": "${escaped}",\n`;
    found++;
  } else {
    out += `  "${tid}": "",\n`;
  }
  count++;
}
out += "};\n";
fs.writeFileSync(path.join(__dirname, "..", "data", "modifier-descriptions.js"), out, "utf8");
console.log(`已生成 ${count} 个 typeId 的描述, 其中有描述: ${found} 个`);

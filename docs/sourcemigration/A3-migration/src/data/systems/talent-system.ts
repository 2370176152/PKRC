/**
 * 天赋（TALENT）—— 自研系统迁移
 * ---------------------------------------------------------------------------
 * 来源：game/server/dist/assets/loading-scene-By2k7Qfx.js（.orig 产物）
 *       @73100（枚举）/ @74300（Registry）/ @1995000（工厂）/ @2008500（天赋池）
 *       @2019259（敌方天赋）/ @2028097（时代天赋）/ @2061250（图鉴）/ @3934342（ManagerV2）
 * 逆向方式：`l(短名,"原函数名")` 反查 + 常量赋值精确定位（见 A3-迁移规范 §3）
 * 锚点树：90df65097b6df76f713e6bd108afa84499e8b993
 *
 * 定位：**最大单系统**（A2 记 212 条中文锚点）。三层结构：
 *       ① 数据层（本文件）：`TalentRegistry`（注册表）+ 天赋池（`$g..sH` 十组）
 *          + `TalentManagerV2`（获取/叠加/移除）+ `EnemyTalentManager`（敌方）
 *          + 时代天赋（冰河期/石器时代/工业革命/信息文明/图腾崇拜）+
 *          守护者系（雷吉艾斯/雷吉洛克/雷吉斯奇鲁/雷吉铎拉戈）+ 星象 + 图鉴；
 *       ② UI 层（**不在本文件**）：`TalentShopUiHandler` / `TalentViewerUiHandler` /
 *          `TalentCodexUiHandler` / `TalentOption`——归前端 UI 任务（见 A3-06 归属台账）；
 *       ③ 接入层：`initializeTalentSystem`（产物 `l0`）挂到存档/开场。
 *
 * 产物符号对照（去混淆映射，务必逐条保留）：
 *   zb   → TalentRegistry                （天赋注册表类）
 *   Jn   → getTalentRegistry             （全局单例）
 *   pSe  → inPtTalentMode                （是否 PT 搜打撤 + 动态平衡）
 *   fLe  → createAttackTalent            （「X之力·攻击」工厂）
 *   PLe  → createDefenseTalent           （「X之力·防御」工厂）
 *   _Le  → generateTestTalents           （全量天赋池生成入口）
 *   GLe  → createTriplePassiveTalent     （三被动觉醒）
 *   gLe  → createSuperBackpackTalent     （超级背包）
 *   HLe  → createMoreDecisionsTalent     （更多决策）
 *   pLe  → createMeowthMoneyTalents      （喵喵资金系）
 *   mLe  → createAgricultureMasterTalent （农业大咖）
 *   BLe  → createExpBoyTalent            （经验小子）
 *   yLe  → createBasicStatBoostTalents   （基础属性系）
 *   FLe  → createSpecializationTalents   （专精/舍取系）
 *   KLe  → createNegativeToPositiveTalent（否极泰来）
 *   WLe  → createMarowakThickClubTalents （粗骨头系）
 *   YLe  → createPokemonExclusiveMechanicTalents（物种专属机制：猛火？猛火！/ BUG燕）
 *   o2   → EnemyTalentManager
 *   bR   → getEnemyTalentManager / ZLe → resetEnemyTalentManager
 *   yE   → hasTalentFor                 （玩家/敌方查天赋）
 *   O0   → getTalentStacksFor
 *   Ire  → canPokemonActivateTalentRelease
 *   lre  → getTalentReleaseTalentId
 *   fS   → hasTalentReleaseTalent
 *   XLe  → hasActiveTalentForPokemon
 *   lo   → hasTalentReleaseTalentInParty
 *   $Le  → getTalentReleaseDisplayStackCount
 *   sNe  → handleStoneAgeTalentEffect    （石器时代）
 *   ONe  → handleIndustrialAgeTalentEffect（工业革命）
 *   hNe  → handleInfoAgeTalentEffect      （信息文明）
 *   GNe  → handleTotemAgeTalentEffect     （图腾崇拜）
 *   $_e  → handleIceAgeTalentEffect       （冰河期）
 *   Aue  → handleXingxiangTalentEffect    （星象）
 *   dre  → isPlayerSpeciesTalentActive$1
 *   xR   → isPlayerSpeciesTalentActive
 *   XNe  → hasZicanTalent
 *   fre  → getBattleTalentRuntimeLines
 *   Oue  → refreshTalentRuntimeHudAfterLoad
 *   Nue  → getPlayerTalentStacks
 *   Cue  → applyBadDreamsTalentDamage
 *   due  → hasStatusSyncTalent
 *   mue  → getTalentCodexManager / O2 → TalentCodexManager
 *   l0   → initializeTalentSystem
 *   Ene  → buildGuardianTalentIds
 *   pge  → buildGuardianTalentLines
 *   Mh   → TalentReleaseModifier
 *   Q6   → TalentReleaseModifierType
 *   ci   → getTalentManager / f0 → resetTalentManager / Wk → TalentManagerV2
 *   ULe  → TALENT_TYPE_LIST（属性系生成用的属性表）
 *
 *   枚举（产物）：
 *   je   → TalentTag（buff/attack/...）
 *   Yt   → TalentRarity（common/rare/epic/ultimate）
 *   us   → TalentEffectType（stat_boost/resource_boost/special_mechanic）
 *   Fi   → TalentConditionType（pokemon_generation/pokemon_type/...）
 *   pIe  → TALENT_TAG_DISPLAY（标签展示表：displayName/color/description）
 */
import { SpeciesId } from "#enums/species-id"; // 产物 `e`
import { AbilityId } from "#enums/ability-id"; // 产物 `o`
import { Stat } from "#enums/stat"; // 产物 `p`
import { PokemonType } from "#enums/pokemon-type"; // 产物 `R`
import { MoveCategory } from "#enums/move-category"; // 产物 `B`
import { StatusEffect } from "#enums/status-effect"; // 产物 `Se`
import { DamageResult } from "#enums/damage-result"; // 产物 `is`

// ─────────────────────────────────────────────────────────────
// 0. 依赖（上游 API，待接入锚点源码时改为真实 import）
// ─────────────────────────────────────────────────────────────
declare const globalScene: any; // 产物 `E`
declare const debugLog: (type: string, msg: string) => void; // 产物 `z`
/** 产物 `es` — i18n 取值（失败回退到中文默认串，故中文串逐字保留） */
declare function es(key: string, defaultValue: string): string;
/** 产物 `M` — i18next */
declare const i18next: any;
/** 产物 `pe` / `KN` — 随机数 / 池权重修正构造 */
declare function pe(maxExclusive: number): number;
declare function poolWeightModifiers(species: number[]): { species: number[] };
/** 产物 `v_e` — 天赋获取钩子 */
declare function onTalentAcquired(talent: Talent, stacks: number): void;
/** 产物 `Rre` — 「秘传之力」类持有物 id */
declare const TALENT_RELEASE_ITEM_ID: string;
/** 产物 `xNe` / `Lue` / `Dse` — 特定天赋 id 常量 */
declare const TALENT_ID_ZICAN: string;
declare const TALENT_ID_STATUS_SYNC: string;
declare const TALENT_ID_BAD_DREAMS: string;

// ─────────────────────────────────────────────────────────────
// 1. 枚举（还原自产物 `je` / `Yt` / `us` / `Fi`）
// ─────────────────────────────────────────────────────────────

/** 天赋标签（产物 `je`） */
export const TalentTag = {
  BUFF: "buff",
  ATTACK: "attack",
  DEFENSE: "defense",
  MONEY: "money",
  GOLD: "gold",
  PT: "pt",
  POKEMON: "pokemon",
  POKEMON_ITEM: "pokemon_item",
  HELD_ITEM: "held_item",
  BERRY: "berry",
  POKEBALL: "pokeball",
  ULTIMATE: "ultimate",
  MECHANIC: "mechanic",
  HP: "hp",
  COUNTER: "counter",
  RECOVERY: "recovery",
  DEBUFF: "debuff",
  STATUS: "status",
  EXCLUSIVE: "exclusive",
} as const;

/** 稀有度（产物 `Yt`） */
export const TalentRarity = {
  COMMON: "common",
  RARE: "rare",
  EPIC: "epic",
  ULTIMATE: "ultimate",
} as const;

/** 效果类型（产物 `us`） */
export const TalentEffectType = {
  STAT_BOOST: "stat_boost",
  RESOURCE_BOOST: "resource_boost",
  SPECIAL_MECHANIC: "special_mechanic",
} as const;

/** 条件类型（产物 `Fi`） */
export const TalentConditionType = {
  POKEMON_GENERATION: "pokemon_generation",
  POKEMON_TYPE: "pokemon_type",
  POKEMON_SPECIES: "pokemon_species",
  TAG_COUNT: "tag_count",
  WAVE_MINIMUM: "wave_minimum",
  TALENT_ACQUIRED: "talent_acquired",
} as const;

/** 标签展示表（产物 `pIe`，逐字保留） */
export const TALENT_TAG_DISPLAY: readonly {
  id: string;
  displayName: string;
  color: string;
  description: string;
}[] = [
  { id: "buff", displayName: "增益", color: "#4CAF50", description: "提供增益效果的天赋" },
  { id: "attack", displayName: "攻击", color: "#F44336", description: "提升攻击能力的天赋" },
  { id: "defense", displayName: "防御", color: "#2196F3", description: "提升防御能力的天赋" },
  { id: "money", displayName: "资金", color: "#FFC107", description: "影响资金获取的天赋" },
  { id: "gold", displayName: "金币", color: "#FFD700", description: "影响金币获取的天赋" },
  { id: "pt", displayName: "PT", color: "#9C27B0", description: "影响PT获取的天赋" },
  { id: "pokemon", displayName: "宝可梦", color: "#8BC34A", description: "与特定宝可梦相关的天赋" },
  { id: "pokemon_item", displayName: "宝可梦道具", color: "#00BCD4", description: "与宝可梦道具相关的天赋" },
  { id: "held_item", displayName: "持有物", color: "#795548", description: "与持有物相关的天赋" },
  { id: "berry", displayName: "树果", color: "#E91E63", description: "与树果相关的天赋" },
  { id: "pokeball", displayName: "精灵球", color: "#FF5722", description: "与精灵球相关的天赋" },
  { id: "ultimate", displayName: "终极", color: "#FFD700", description: "终极稀有度的天赋" },
  { id: "mechanic", displayName: "机制", color: "#607D8B", description: "影响游戏机制的天赋" },
  { id: "hp", displayName: "血量", color: "#E53935", description: "与血量相关的天赋" },
  { id: "counter", displayName: "反伤", color: "#D32F2F", description: "反弹伤害的天赋" },
  { id: "recovery", displayName: "恢复", color: "#43A047", description: "恢复生命值的天赋" },
  { id: "debuff", displayName: "减益", color: "#FF6B6B", description: "带有负面效果的天赋" },
  { id: "status", displayName: "状态", color: "#7E57C2", description: "与异常状态相关的天赋" },
];

// ─────────────────────────────────────────────────────────────
// 2. 数据结构
// ─────────────────────────────────────────────────────────────

/** 天赋定义（产物天赋池条目形态） */
export interface Talent {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  rarity: string;
  tags: string[];
  effectType: string;
  effectValue: unknown;
  conditions: unknown[];
  stackable: boolean;
  maxStacks: number;
  /** 产物中部分条目启用 i18n 键 */
  useTranslationKey?: boolean;
  /** 产物中部分条目带池权重修正 */
  poolWeightModifiers?: unknown;
  /** 容纳产物中零散字段（如 probability / species），避免逐字段枚举遗漏 */
  [key: string]: unknown;
}

/** 已获取天赋条目（产物 `acquiredTalents` 的值） */
export interface AcquiredTalent {
  talentId: string;
  stacks: number;
  acquiredWave: number;
  refreshPtSpent: number;
}

/** 天赋历史条目（产物 `history` 的元素） */
export interface TalentHistoryEntry {
  talentId: string;
  talentName: string;
  wave: number;
  refreshPtSpent: number;
  timestamp: number;
}

// 产物短名别名（供天赋池数据逐字引用）
const Yt = TalentRarity;
const us = TalentEffectType;
const je = TalentTag;
const Fi = TalentConditionType;
const e = SpeciesId;
const o = AbilityId;

// ─────────────────────────────────────────────────────────────
// 3. 注册表（产物 `zb` / `Jn`）
// ─────────────────────────────────────────────────────────────

/** 产物 `zb` — 天赋注册表 */
export class TalentRegistry {
  private readonly talents = new Map<string, Talent>();

  /** 校验天赋定义（产物 `validateTalent`，中文错误串逐字保留） */
  validateTalent(talent: Talent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!talent.id || typeof talent.id !== "string" || talent.id.trim() === "") errors.push("天赋ID不能为空");
    if (!talent.name || typeof talent.name !== "string" || talent.name.trim() === "") errors.push("天赋名称不能为空");
    if (!talent.shortDescription || typeof talent.shortDescription !== "string") {
      errors.push("简短描述不能为空");
    } else if (talent.shortDescription.length > 50) {
      errors.push("简短描述不能超过50个字符");
    }
    if (!talent.fullDescription || typeof talent.fullDescription !== "string") errors.push("详细描述不能为空");
    if (!Object.values(Yt).includes(talent.rarity as never)) errors.push(`无效的稀有度: ${talent.rarity}`);
    if (Array.isArray(talent.tags)) {
      if (talent.tags.length === 0) errors.push("天赋必须至少有一个标签");
    } else {
      errors.push("标签必须是数组");
    }
    if (!Object.values(us).includes(talent.effectType as never)) errors.push(`无效的效果类型: ${talent.effectType}`);
    if (talent.effectValue === undefined || talent.effectValue === null) errors.push("效果值不能为空");
    if (!Array.isArray(talent.conditions)) errors.push("条件必须是数组");
    if (typeof talent.stackable !== "boolean") errors.push("stackable必须是布尔值");
    if (typeof talent.maxStacks !== "number" || talent.maxStacks < 1) errors.push("maxStacks必须是大于0的数字");
    if (!talent.stackable && talent.maxStacks !== 1) errors.push("不可叠加的天赋maxStacks应该为1");
    return { valid: errors.length === 0, errors };
  }

  /** 注册单个天赋（产物 `registerTalent`） */
  registerTalent(talent: Talent): boolean {
    const result = this.validateTalent(talent);
    if (result.valid) {
      if (this.talents.has(talent.id)) {
        console.warn(`[TalentRegistry] 天赋 "${talent.id}" 已存在，将被覆盖`);
      }
      this.talents.set(talent.id, talent);
      return true;
    }
    console.warn(`[TalentRegistry] 天赋 "${talent.id}" 验证失败:`, result.errors);
    return false;
  }

  getTalent(id: string): Talent | undefined {
    return this.talents.get(id);
  }

  getTalentName(talent: Talent): string {
    if (talent.useTranslationKey) {
      const key = `talent:talents.${talent.id}.name`;
      const translated = i18next?.t(key);
      return translated && !translated.includes(":") ? translated : talent.name;
    }
    return talent.name;
  }

  getTalentShortDescription(talent: Talent): string {
    if (talent.useTranslationKey) {
      const key = `talent:talents.${talent.id}.shortDescription`;
      const translated = i18next?.t(key);
      return translated && !translated.includes(":") ? translated : talent.shortDescription;
    }
    return talent.shortDescription;
  }

  getTalentFullDescription(talent: Talent): string {
    if (talent.useTranslationKey) {
      const key = `talent:talents.${talent.id}.fullDescription`;
      const translated = i18next?.t(key);
      return translated && !translated.includes(":") ? translated : talent.fullDescription;
    }
    return talent.fullDescription;
  }

  getTalentsByRarity(rarity: string): Talent[] {
    return Array.from(this.talents.values()).filter((t) => t.rarity === rarity);
  }

  getTalentsByTag(tag: string): Talent[] {
    return Array.from(this.talents.values()).filter((t) => t.tags.includes(tag));
  }

  getTalentsByTags(tags: string[]): Talent[] {
    return Array.from(this.talents.values()).filter((t) => tags.every((tag) => t.tags.includes(tag)));
  }

  getAllTalents(): Talent[] {
    return Array.from(this.talents.values());
  }

  hasTalent(id: string): boolean {
    return this.talents.has(id);
  }

  removeTalent(id: string): boolean {
    return this.talents.delete(id);
  }

  getCount(): number {
    return this.talents.size;
  }

  clear(): void {
    this.talents.clear();
  }

  registerTalents(list: Talent[]): number {
    let ok = 0;
    for (const talent of list) if (this.registerTalent(talent)) ok++;
    return ok;
  }
}

/** 全局注册表单例（产物 `Am` / `Jn`） */
let talentRegistryInstance: TalentRegistry = new TalentRegistry();

/** 产物 `Jn` — 取全局注册表 */
export function getTalentRegistry(): TalentRegistry {
  return talentRegistryInstance;
}

/** 产物 `pSe` — 是否处于「PT 搜打撤 + 动态平衡」模式（天赋模式） */
export function inPtTalentMode(): boolean {
  const mode = globalScene.gameMode;
  return !!mode?.isPtSoudache && !!mode?.hasDynamicBalance;
}

// ─────────────────────────────────────────────────────────────
// 4. 天赋工厂（产物 `fLe..YLe`，程序化生成，中文串逐字保留）
// ─────────────────────────────────────────────────────────────

/** 产物 `ULe` — 属性系生成用的属性表 */
export const TALENT_TYPE_LIST: readonly { nameCN: string; pinyin: string; type: PokemonType }[] = [
  { nameCN: "一般", pinyin: "yiban", type: PokemonType.NORMAL },
  { nameCN: "格斗", pinyin: "gedou", type: PokemonType.FIGHTING },
  { nameCN: "飞行", pinyin: "feixing", type: PokemonType.FLYING },
  { nameCN: "毒", pinyin: "du", type: PokemonType.POISON },
  { nameCN: "地面", pinyin: "dimian", type: PokemonType.GROUND },
  { nameCN: "岩石", pinyin: "yanshi", type: PokemonType.ROCK },
  { nameCN: "虫", pinyin: "chong", type: PokemonType.BUG },
  { nameCN: "幽灵", pinyin: "youling", type: PokemonType.GHOST },
  { nameCN: "钢", pinyin: "gang", type: PokemonType.STEEL },
  { nameCN: "火", pinyin: "huo", type: PokemonType.FIRE },
  { nameCN: "水", pinyin: "shui", type: PokemonType.WATER },
  { nameCN: "草", pinyin: "cao", type: PokemonType.GRASS },
  { nameCN: "电", pinyin: "dian", type: PokemonType.ELECTRIC },
  { nameCN: "超能力", pinyin: "chaonengli", type: PokemonType.PSYCHIC },
  { nameCN: "冰", pinyin: "bing", type: PokemonType.ICE },
  { nameCN: "龙", pinyin: "long", type: PokemonType.DRAGON },
  { nameCN: "恶", pinyin: "e", type: PokemonType.DARK },
  { nameCN: "妖精", pinyin: "yaojing", type: PokemonType.FAIRY },
];

/** 产物 `fLe` — 「X之力·攻击」 */
export function createAttackTalent(entry: { nameCN: string; pinyin: string; type: PokemonType }): Talent {
  const effectValue = { atk: 10, spatk: 10, spd: 10 };
  const id = `${entry.pinyin}_gongji`;
  return {
    id,
    name: es(`talent:talents.${id}.name`, `${entry.nameCN}之力·攻击`),
    shortDescription: es(`talent:talents.${id}.shortDescription`, `${entry.nameCN}属性宝可梦物攻/特攻/速度+10%`),
    fullDescription: es(
      `talent:talents.${id}.fullDescription`,
      `提升队伍中${entry.nameCN}属性宝可梦的物特攻击+10%，速度+10%。`,
    ),
    rarity: Yt.COMMON,
    tags: [je.BUFF, je.ATTACK],
    effectType: us.STAT_BOOST,
    effectValue,
    conditions: [{ type: Fi.POKEMON_TYPE, value: entry.type }],
    stackable: true,
    maxStacks: 5,
  };
}

/** 产物 `PLe` — 「X之力·防御」 */
export function createDefenseTalent(entry: { nameCN: string; pinyin: string; type: PokemonType }): Talent {
  const effectValue = { hp: 10, def: 10, spdef: 10 };
  const id = `${entry.pinyin}_fangyu`;
  return {
    id,
    name: es(`talent:talents.${id}.name`, `${entry.nameCN}之力·防御`),
    shortDescription: es(`talent:talents.${id}.shortDescription`, `${entry.nameCN}属性宝可梦HP/物防/特防+10%`),
    fullDescription: es(
      `talent:talents.${id}.fullDescription`,
      `提升队伍中${entry.nameCN}属性宝可梦的hp/物特防+10%。`,
    ),
    rarity: Yt.COMMON,
    tags: [je.BUFF, je.DEFENSE],
    effectType: us.STAT_BOOST,
    effectValue,
    conditions: [{ type: Fi.POKEMON_TYPE, value: entry.type }],
    stackable: true,
    maxStacks: 5,
  };
}

/** 产物 `GLe` — 三被动觉醒 */
export function createTriplePassiveTalent(): Talent {
  const id = "san_beidong_juexing";
  return {
    id,
    name: es(`talent:talents.${id}.name`, "三被动觉醒"),
    shortDescription: es(`talent:talents.${id}.shortDescription`, "为一只宝可梦解锁三被动槽位"),
    fullDescription: es(
      `talent:talents.${id}.fullDescription`,
      "选择队伍中的一只宝可梦，为其解锁被动特性槽位。该宝可梦将额外随机获得三个不重复的被动特性。三个被动特性将同时生效。",
    ),
    rarity: Yt.ULTIMATE,
    tags: [je.MECHANIC, je.ULTIMATE],
    effectType: us.SPECIAL_MECHANIC,
    effectValue: { mechanic: "triple_passive" },
    conditions: [{ type: Fi.TAG_COUNT, value: "ultimate:1" }],
    stackable: false,
    maxStacks: 1,
  };
}

/** 产物 `gLe` — 超级背包 */
export function createSuperBackpackTalent(): Talent {
  const id = "chaoji_beibao";
  return {
    id,
    name: es(`talent:talents.${id}.name`, "超级背包"),
    shortDescription: es(`talent:talents.${id}.shortDescription`, "战斗中可使用背包存储和使用道具"),
    fullDescription: es(
      `talent:talents.${id}.fullDescription`,
      "获得后战斗中会出现背包按钮。背包会枚X层生成一个道具，最多持有5个。",
    ),
    rarity: Yt.ULTIMATE,
    tags: [je.MECHANIC, je.POKEMON_ITEM, je.ULTIMATE],
    effectType: us.SPECIAL_MECHANIC,
    effectValue: { mechanic: "super_backpack" },
    conditions: [{ type: Fi.TAG_COUNT, value: "pokemon_item:3" }],
    stackable: false,
    maxStacks: 1,
  };
}

/** 产物 `HLe` — 更多决策 */
export function createMoreDecisionsTalent(): Talent {
  const id = "gengduo_juece";
  return {
    id,
    name: es(`talent:talents.${id}.name`, "更多决策"),
    shortDescription: es(`talent:talents.${id}.shortDescription`, "获得3个黄金精灵球"),
    fullDescription: es(`talent:talents.${id}.fullDescription`, "获得后立即获得3个黄金精灵球。"),
    rarity: Yt.EPIC,
    tags: [je.POKEMON_ITEM, je.MECHANIC],
    effectType: us.SPECIAL_MECHANIC,
    effectValue: { mechanic: "more_decisions", goldenPokeballCount: 3 },
    conditions: [],
    stackable: false,
    maxStacks: 1,
  };
}

/** 产物 `mLe` — 农业大咖 */
export function createAgricultureMasterTalent(): Talent {
  const id = "nongye_daka";
  return {
    id,
    name: es(`talent:talents.${id}.name`, "农业大咖"),
    shortDescription: es(`talent:talents.${id}.shortDescription`, "获得3个树果袋"),
    fullDescription: es(`talent:talents.${id}.fullDescription`, "获得后立即获得3个树果袋。"),
    rarity: Yt.ULTIMATE,
    tags: [je.POKEMON_ITEM, je.ULTIMATE],
    effectType: us.SPECIAL_MECHANIC,
    effectValue: { mechanic: "agriculture_master", berryPouchCount: 3 },
    conditions: [],
    stackable: false,
    maxStacks: 1,
  };
}

/** 产物 `BLe` — 经验小子 */
export function createExpBoyTalent(): Talent {
  const id = "jingyan_xiaozi";
  return {
    id,
    name: es(`talent:talents.${id}.name`, "经验小子"),
    shortDescription: es(`talent:talents.${id}.shortDescription`, "获得一个经验护符"),
    fullDescription: es(`talent:talents.${id}.fullDescription`, "获得后立即获得一个经验护符。"),
    rarity: Yt.COMMON,
    tags: [je.POKEMON_ITEM],
    effectType: us.SPECIAL_MECHANIC,
    effectValue: { mechanic: "exp_boy", expCharmCount: 1 },
    conditions: [],
    stackable: true,
    maxStacks: 3,
  };
}

/** 产物 `pLe` — 喵喵资金系（喵喵存钱罐 / 聚宝功 / 金钱攻势 / 救急钱 / 钱越多钱越少） */
export function createMeowthMoneyTalents(): Talent[] {
  const list: Talent[] = [];
  list.push({
    id: "miaomiao_cunqianguan",
    name: es("talent:talents.miaomiao_cunqianguan.name", "喵喵存钱罐"),
    shortDescription: es("talent:talents.miaomiao_cunqianguan.shortDescription", "每波次结束金钱+1%"),
    fullDescription: es(
      "talent:talents.miaomiao_cunqianguan.fullDescription",
      "每波次结束时，当前金钱增加1%。最多可获得5个。",
    ),
    rarity: Yt.COMMON,
    tags: [je.MONEY],
    effectType: us.SPECIAL_MECHANIC,
    effectValue: { mechanic: "meowth_piggy_bank", percentage: 1 },
    conditions: [],
    stackable: true,
    maxStacks: 5,
  });
  list.push({
    id: "miaomiao_jubaogong",
    name: es("talent:talents.miaomiao_jubaogong.name", "喵喵聚宝功"),
    shortDescription: es("talent:talents.miaomiao_jubaogong.shortDescription", "喵喵攻击获得等额金钱"),
    fullDescription: es(
      "talent:talents.miaomiao_jubaogong.fullDescription",
      "喵喵系宝可梦每次攻击造成伤害时，获得该次攻击伤害50%等额的金钱。",
    ),
    rarity: Yt.RARE,
    tags: [je.MONEY, je.MECHANIC],
    effectType: us.SPECIAL_MECHANIC,
    effectValue: { mechanic: "meowth_pay_day", percentage: 50 },
    conditions: [{ type: Fi.TAG_COUNT, value: 3 }],
    stackable: false,
    maxStacks: 1,
  });
  list.push({
    id: "jinqian_gongshi",
    name: es("talent:talents.jinqian_gongshi.name", "金钱攻势"),
    shortDescription: es("talent:talents.jinqian_gongshi.shortDescription", "每2w金钱增加喵喵系1%全属性"),
    fullDescription: es(
      "talent:talents.jinqian_gongshi.fullDescription",
      "每2w金钱增加喵喵系宝可梦1%的全属性加成，最多增加500%。每次金钱波动都实时重新计算加成属性。",
    ),
    rarity: Yt.EPIC,
    tags: [je.BUFF, je.MONEY],
    effectType: us.SPECIAL_MECHANIC,
    effectValue: { mechanic: "money_offensive", moneyPerPercent: 2e4, maxBonus: 500 },
    conditions: [],
    stackable: false,
    maxStacks: 1,
  });
  list.push({
    id: "jiujiqian",
    name: es("talent:talents.jiujiqian.name", "救急钱"),
    shortDescription: es("talent:talents.jiujiqian.shortDescription", "金钱增加当前金钱的15%"),
    fullDescription: es(
      "talent:talents.jiujiqian.fullDescription",
      "立即增加当前金钱的15%。该天赋可持续获得，不限制个数。",
    ),
    rarity: Yt.COMMON,
    tags: [je.MONEY],
    effectType: us.SPECIAL_MECHANIC,
    effectValue: { mechanic: "emergency_money", percentage: 15 },
    conditions: [],
    stackable: true,
    maxStacks: 999,
  });
  list.push({
    id: "qian_yue_duo_qian_yue_shao",
    name: es("talent:talents.qian_yue_duo_qian_yue_shao.name", "钱越多钱越少"),
    shortDescription: es("talent:talents.qian_yue_duo_qian_yue_shao.shortDescription", "金钱越多收益越低"),
    fullDescription: es(
      "talent:talents.qian_yue_duo_qian_yue_shao.fullDescription",
      "持有的金钱越多，金钱获取的收益越低（平衡型天赋）。",
    ),
    rarity: Yt.RARE,
    tags: [je.MONEY, je.DEBUFF],
    effectType: us.SPECIAL_MECHANIC,
    effectValue: { mechanic: "money_diminishing" },
    conditions: [],
    stackable: false,
    maxStacks: 1,
  });
  return list;
}

/** 产物 `yLe` — 基础属性系（训练/进阶/大师/至尊 × 6 项能力） */
export function createBasicStatBoostTalents(): Talent[] {
  const list: Talent[] = [];
  const stats = [
    { key: "atk", nameCN: "力量", pinyin: "liliang", tag: je.ATTACK },
    { key: "def", nameCN: "防御", pinyin: "fangyu", tag: je.DEFENSE },
    { key: "spatk", nameCN: "特攻", pinyin: "tegong", tag: je.ATTACK },
    { key: "spdef", nameCN: "特防", pinyin: "tefang", tag: je.DEFENSE },
    { key: "spd", nameCN: "速度", pinyin: "sudu", tag: je.BUFF },
    { key: "hp", nameCN: "体力", pinyin: "tili", tag: je.HP },
  ];
  const tiers = [
    { rarity: Yt.COMMON, suffix: "xunlian", nameSuffix: "训练", boost: 5, stackable: true, maxStacks: 5, conditions: [] as unknown[] },
    { rarity: Yt.RARE, suffix: "jinjie", nameSuffix: "进阶", boost: 10, stackable: true, maxStacks: 5, conditions: [] as unknown[] },
    { rarity: Yt.EPIC, suffix: "dashi", nameSuffix: "大师", boost: 20, stackable: false, maxStacks: 1, conditions: [] as unknown[] },
    { rarity: Yt.ULTIMATE, suffix: "zhizun", nameSuffix: "至尊", boost: 30, stackable: false, maxStacks: 1, conditions: [] as unknown[] },
  ];
  for (const stat of stats) {
    for (const tier of tiers) {
      const id = `${stat.pinyin}_${tier.suffix}`;
      const effectValue: Record<string, number> = {};
      effectValue[stat.key] = tier.boost;
      const tags: string[] = [je.BUFF];
      if (stat.tag !== je.BUFF) tags.push(stat.tag);
      if (tier.rarity === Yt.ULTIMATE) tags.push(je.ULTIMATE);
      list.push({
        id,
        name: es(`talent:talents.${id}.name`, `${stat.nameCN}${tier.nameSuffix}`),
        shortDescription: es(`talent:talents.${id}.shortDescription`, `全队${stat.nameCN}+${tier.boost}%`),
        fullDescription: es(`talent:talents.${id}.fullDescription`, `提升队伍中所有宝可梦的${stat.nameCN}${tier.boost}%。`),
        rarity: tier.rarity,
        tags,
        effectType: us.STAT_BOOST,
        effectValue,
        conditions: tier.conditions,
        stackable: tier.stackable,
        maxStacks: tier.maxStacks,
      });
    }
  }
  return list;
}

/** 产物 `FLe` — 专精/舍取系（「X侧重·舍Y」稀有 + 「X极致·弃Y」史诗） */
export function createSpecializationTalents(): Talent[] {
  const list: Talent[] = [];
  const stats = [
    { key: "atk", nameCN: "攻击", shortCN: "攻", nameEN: "Attack", pinyin: "wugong", tag: je.ATTACK },
    { key: "def", nameCN: "防御", shortCN: "防", nameEN: "Defense", pinyin: "wufang", tag: je.DEFENSE },
    { key: "spatk", nameCN: "特攻", shortCN: "特攻", nameEN: "SpAtk", pinyin: "tegong", tag: je.ATTACK },
    { key: "spdef", nameCN: "特防", shortCN: "特防", nameEN: "SpDef", pinyin: "tefang", tag: je.DEFENSE },
    { key: "spd", nameCN: "速度", shortCN: "速", nameEN: "Speed", pinyin: "sudu", tag: je.BUFF },
    { key: "hp", nameCN: "血量", shortCN: "血", nameEN: "HP", pinyin: "tili", tag: je.HP },
  ];
  for (const inc of stats) {
    for (const dec of stats) {
      if (inc.key === dec.key) continue;
      const rareId = `${inc.pinyin}_jian_${dec.pinyin}`;
      const rareValue: Record<string, number> = {};
      rareValue[inc.key] = 10;
      rareValue[dec.key] = -10;
      list.push({
        id: rareId,
        name: es(`talent:talents.${rareId}.name`, `${inc.nameCN}侧重·舍${dec.shortCN}`),
        shortDescription: es(`talent:talents.${rareId}.shortDescription`, `${inc.nameCN}+10%，${dec.nameCN}-10%`),
        fullDescription: es(`talent:talents.${rareId}.fullDescription`, `全队${inc.nameCN}+10%，但${dec.nameCN}-10%。`),
        rarity: Yt.RARE,
        tags: [je.BUFF, je.DEBUFF],
        effectType: us.STAT_BOOST,
        effectValue: rareValue,
        conditions: [],
        stackable: true,
        maxStacks: 5,
      });
      const epicId = `${inc.pinyin}_jian_${dec.pinyin}_epic`;
      const epicValue: Record<string, number> = {};
      epicValue[inc.key] = 20;
      epicValue[dec.key] = -20;
      list.push({
        id: epicId,
        name: es(`talent:talents.${epicId}.name`, `${inc.nameCN}极致·弃${dec.shortCN}`),
        shortDescription: es(`talent:talents.${epicId}.shortDescription`, `${inc.nameCN}+20%，${dec.nameCN}-20%`),
        fullDescription: es(`talent:talents.${epicId}.fullDescription`, `全队${inc.nameCN}+20%，但${dec.nameCN}-20%。`),
        rarity: Yt.EPIC,
        tags: [je.BUFF, je.DEBUFF],
        effectType: us.STAT_BOOST,
        effectValue: epicValue,
        conditions: [],
        stackable: false,
        maxStacks: 1,
      });
    }
  }
  return list;
}

/** 产物 `KLe` — 否极泰来 */
export function createNegativeToPositiveTalent(): Talent {
  const id = "fouji_tailai";
  return {
    id,
    name: es(`talent:talents.${id}.name`, "否极泰来"),
    shortDescription: es(`talent:talents.${id}.shortDescription`, "减益天赋增益翻倍，减益转增益"),
    fullDescription: es(
      `talent:talents.${id}.fullDescription`,
      "所有带减益标签的天赋：增益效果翻倍，减益效果转化为增益效果。",
    ),
    rarity: Yt.ULTIMATE,
    tags: [je.ULTIMATE, je.DEBUFF, je.BUFF],
    effectType: us.SPECIAL_MECHANIC,
    effectValue: { mechanic: "negative_to_positive" },
    conditions: [{ type: Fi.TAG_COUNT, value: "debuff:6" }],
    stackable: false,
    maxStacks: 1,
  };
}

/** 产物 `WLe` — 粗骨头系（骨头收集者 / 骨头大师 / 骨之极意） */
export function createMarowakThickClubTalents(): Talent[] {
  const list: Talent[] = [];
  const species = [SpeciesId.CUBONE, SpeciesId.MAROWAK, SpeciesId.ALOLA_MAROWAK];
  list.push({
    id: "gutou_shouji",
    name: es("talent:talents.gutou_shouji.name", "骨头收集者"),
    shortDescription: es("talent:talents.gutou_shouji.shortDescription", "给嘎啦嘎啦/卡拉卡拉2根粗骨头"),
    fullDescription: es(
      "talent:talents.gutou_shouji.fullDescription",
      "给队伍中的嘎啦嘎啦或卡拉卡拉2根粗骨头，无携带上限。队伍中携带对应宝可梦时，该天赋更容易出现。",
    ),
    rarity: Yt.RARE,
    tags: [je.POKEMON_ITEM, je.HELD_ITEM],
    effectType: us.SPECIAL_MECHANIC,
    effectValue: { mechanic: "thick_club_collector", count: 2 },
    conditions: [{ type: Fi.POKEMON_SPECIES, value: [104, 105, 2105] }],
    stackable: true,
    maxStacks: 3,
    poolWeightModifiers: poolWeightModifiers(species),
  });
  list.push({
    id: "gutou_dashi",
    name: es("talent:talents.gutou_dashi.name", "骨头大师"),
    shortDescription: es("talent:talents.gutou_dashi.shortDescription", "每根粗骨头+5%全属性"),
    fullDescription: es(
      "talent:talents.gutou_dashi.fullDescription",
      "嘎啦嘎啦或卡拉卡拉每持有1根粗骨头，全属性提升5%。队伍中携带对应宝可梦时，该天赋更容易出现。",
    ),
    rarity: Yt.EPIC,
    tags: [je.POKEMON_ITEM, je.HELD_ITEM],
    effectType: us.SPECIAL_MECHANIC,
    effectValue: { mechanic: "thick_club_master", boostPerClub: 5 },
    conditions: [{ type: Fi.POKEMON_SPECIES, value: [104, 105, 2105] }],
    stackable: false,
    maxStacks: 1,
    poolWeightModifiers: poolWeightModifiers(species),
  });
  list.push({
    id: "gu_zhi_jiyi",
    name: es("talent:talents.gu_zhi_jiyi.name", "骨之极意"),
    shortDescription: es("talent:talents.gu_zhi_jiyi.shortDescription", "1根以上粗骨头强化骨头回旋镖"),
    fullDescription: es(
      "talent:talents.gu_zhi_jiyi.fullDescription",
      "持有1根以上粗骨头的嘎啦嘎啦或卡拉卡拉使用骨头回旋镖时威力翻倍，并提升自己随机一项属性1级。队伍中携带对应宝可梦时，该天赋更容易出现。",
    ),
    rarity: Yt.ULTIMATE,
    tags: [je.POKEMON_ITEM, je.HELD_ITEM, je.ULTIMATE],
    effectType: us.SPECIAL_MECHANIC,
    effectValue: { mechanic: "bone_mastery", requiredClubs: 1 },
    conditions: [{ type: Fi.POKEMON_SPECIES, value: [104, 105, 2105] }],
    stackable: false,
    maxStacks: 1,
    poolWeightModifiers: poolWeightModifiers(species),
  });
  return list;
}

/** 产物 `YLe` — 物种专属机制（猛火？猛火！/ BUG燕）。
 *  注：A2 记该项 86 条中文锚点，实为**含其后紧跟的 10 组天赋池**（见 §5）之归类误判；
 *  本函数本体即下方两条（产物确证：`YLe` 定义体长度 ~1KB）。 */
export function createPokemonExclusiveMechanicTalents(): Talent[] {
  return [
    {
      id: "menghuo_menghuo",
      name: es("talent:talents.menghuo_menghuo.name", "猛火？猛火！"),
      shortDescription: es("talent:talents.menghuo_menghuo.shortDescription", "烈焰猴爆发并灼烧自身战意"),
      fullDescription: es(
        "talent:talents.menghuo_menghuo.fullDescription",
        "我方烈焰猴伤害额外变为200%；半血以下时变为400%。每次出招后扣除当前血量1/6，血量低于6%不再扣血。每次因此受伤，本波火系招式额伤+50%，最多8层。",
      ),
      rarity: Yt.ULTIMATE,
      tags: [je.POKEMON, je.MECHANIC, je.ULTIMATE],
      effectType: us.SPECIAL_MECHANIC,
      effectValue: { mechanic: "menghuo_menghuo", species: [SpeciesId.INFERNAPE] },
      conditions: [],
      stackable: false,
      maxStacks: 1,
      poolWeightModifiers: poolWeightModifiers([SpeciesId.INFERNAPE]),
    },
    {
      id: "bug_yan",
      name: es("talent:talents.bug_yan.name", "BUG燕"),
      shortDescription: es("talent:talents.bug_yan.shortDescription", "大王燕濒死回生并永久强化"),
      fullDescription: es(
        "talent:talents.bug_yan.fullDescription",
        "我方大王燕受到致命伤时，保留1HP并回复50%最大HP。每次触发后物攻和速度各+5%。每波次最多触发3次。强化层数永久保留。队伍中携带大王燕时，该天赋更容易出现。",
      ),
      rarity: Yt.ULTIMATE,
      tags: [je.POKEMON, je.MECHANIC, je.ULTIMATE],
      effectType: us.SPECIAL_MECHANIC,
      effectValue: { mechanic: "bug_yan", species: [SpeciesId.SWELLOW] },
      conditions: [],
      stackable: false,
      maxStacks: 1,
      poolWeightModifiers: poolWeightModifiers([SpeciesId.SWELLOW]),
    },
  ];
}

// ─────────────────────────────────────────────────────────────
// 5. 天赋池（产物 `WN` / `$g..sH`，中文串逐字保留）
// ---------------------------------------------------------------------------
// ⚠️ `WN` 是「测试天赋」的惰性 Proxy（`Xg||(Xg=_Le())`）；其余 9 组为静态数组。
// ─────────────────────────────────────────────────────────────

/** 产物 `_Le` — 生成全量测试天赋池 */
export function generateTestTalents(): Talent[] {
  const list: Talent[] = [];
  for (const entry of TALENT_TYPE_LIST) {
    list.push(createAttackTalent(entry));
    list.push(createDefenseTalent(entry));
  }
  list.push(createTriplePassiveTalent());
  list.push(createSuperBackpackTalent());
  list.push(createMoreDecisionsTalent());
  list.push(...createMeowthMoneyTalents());
  list.push(createAgricultureMasterTalent());
  list.push(createExpBoyTalent());
  list.push(...createBasicStatBoostTalents());
  list.push(...createSpecializationTalents());
  list.push(createNegativeToPositiveTalent());
  list.push(...createMarowakThickClubTalents());
  list.push(...createPokemonExclusiveMechanicTalents());
  return list;
}

/** 产物 `WN` — 测试天赋池（惰性） */
let testTalentsCache: Talent[] | null = null;
export function getTestTalents(): Talent[] {
  return (testTalentsCache ??= generateTestTalents());
}

// ─── 天赋池静态数据（产物 `$g..sH`，中文串逐字保留）───

/** 产物 `$g` — 血量 / 反伤 / 消耗系天赋 */
export const TALENT_POOL_HP_COUNTER: Talent[] = [{id:"xieniu",name:"血牛",shortDescription:"全队最大HP+15%",fullDescription:"我方所有宝可梦最大HP增加15%。",rarity:Yt.RARE,tags:[je.HP,je.BUFF],effectType:us.STAT_BOOST,effectValue:{hp:15},conditions:[],stackable:true,maxStacks:6,useTranslationKey:true},{id:"beishuiyizhan",name:"背水一战",shortDescription:"HP<50%时攻击+15%",fullDescription:"HP低于50%时，攻击力和特攻提升15%。",rarity:Yt.COMMON,tags:[je.BUFF,je.HP],effectType:us.SPECIAL_MECHANIC,effectValue:{atk:15,spatk:15,condition:"hp_below_50"},conditions:[],stackable:true,maxStacks:3,useTranslationKey:true},{id:"jingjizhjia",name:"荆棘之甲",shortDescription:"反弹20%伤害",fullDescription:"受到伤害时，反弹20%伤害给攻击者。",rarity:Yt.RARE,tags:[je.COUNTER,je.DEFENSE],effectType:us.SPECIAL_MECHANIC,effectValue:{counterPercentage:20},conditions:[],stackable:true,maxStacks:3,useTranslationKey:true},{id:"shixuekuangbao",name:"嗜血狂暴",shortDescription:"击败敌人恢复15%HP",fullDescription:"击败敌方宝可梦时，恢复自身最大HP的15%。",rarity:Yt.RARE,tags:[je.BUFF,je.HP,je.MECHANIC],effectType:us.SPECIAL_MECHANIC,effectValue:{healOnKo:.15},conditions:[],stackable:false,maxStacks:1,useTranslationKey:true},{id:"shengmingjiqu",name:"生命汲取",shortDescription:"吸血10%",fullDescription:"造成伤害时，恢复伤害量10%的HP。",rarity:Yt.COMMON,tags:[je.HP,je.RECOVERY],effectType:us.SPECIAL_MECHANIC,effectValue:{lifestealPercentage:10},conditions:[],stackable:true,maxStacks:5,useTranslationKey:true},{id:"binsifanji",name:"濒死反击",shortDescription:"HP<25%反伤翻倍且必定暴击",fullDescription:"HP低于25%时，反伤效果翻倍，且反击必定暴击。",rarity:Yt.EPIC,tags:[je.BUFF,je.HP,je.COUNTER],effectType:us.SPECIAL_MECHANIC,effectValue:{critGuaranteed:true,counterDouble:true,condition:"hp_below_25"},conditions:[{type:Fi.TAG_COUNT,value:2}],stackable:false,maxStacks:1,useTranslationKey:true},{id:"tongguiyujin",name:"同归于尽",shortDescription:"濒死造成50%最大HP真伤",fullDescription:"宝可梦濒死时，对最后攻击者造成自身最大HP50%的真实伤害。",rarity:Yt.EPIC,tags:[je.COUNTER,je.MECHANIC],effectType:us.SPECIAL_MECHANIC,effectValue:{deathDamagePercentage:.5},conditions:[{type:Fi.TAG_COUNT,value:2}],stackable:false,maxStacks:1,useTranslationKey:true},{id:"xuezqiyue",name:"血之契约",shortDescription:"HP-30%，攻击+50%",fullDescription:"所有宝可梦最大HP降低30%，攻击力和特攻提升50%。",rarity:Yt.ULTIMATE,tags:[je.HP,je.DEBUFF,je.ULTIMATE],effectType:us.STAT_BOOST,effectValue:{hp:-30,atk:50,spatk:50},conditions:[{type:Fi.TAG_COUNT,value:5}],stackable:false,maxStacks:1,useTranslationKey:true},{id:"jingjilngyu",name:"荆棘领域",shortDescription:"回合开始造成已损失HP 10%伤害",fullDescription:"每回合开始时，对所有敌方宝可梦造成我方已损失HP总和10%的伤害。",rarity:Yt.ULTIMATE,tags:[je.COUNTER,je.MECHANIC,je.ULTIMATE],effectType:us.SPECIAL_MECHANIC,effectValue:{fieldDamagePercentage:.1},conditions:[{type:Fi.TAG_COUNT,value:5}],stackable:false,maxStacks:1,useTranslationKey:true},{id:"busizishen",name:"不死之身",shortDescription:"首次致命伤保留1HP并恢复50%",fullDescription:"每场战斗中首次受到致命伤害时，保留1HP并恢复50%最大HP。",rarity:Yt.ULTIMATE,tags:[je.HP,je.MECHANIC,je.ULTIMATE],effectType:us.SPECIAL_MECHANIC,effectValue:{survivalHeal:.5},conditions:[{type:Fi.TAG_COUNT,value:5}],stackable:false,maxStacks:1,useTranslationKey:true},{id:"liliang_zuzhou",name:"力量诅咒",shortDescription:"全队物攻-50%",fullDescription:"我方所有宝可梦物理攻击降低50%。",rarity:Yt.EPIC,tags:[je.DEBUFF],effectType:us.STAT_BOOST,effectValue:{atk:-50},conditions:[{type:Fi.TAG_COUNT,value:2}],stackable:false,maxStacks:1,useTranslationKey:true},{id:"fangyu_bengkui",name:"防御崩溃",shortDescription:"全队物防-50%",fullDescription:"我方所有宝可梦物理防御降低50%。",rarity:Yt.EPIC,tags:[je.DEBUFF],effectType:us.STAT_BOOST,effectValue:{def:-50},conditions:[{type:Fi.TAG_COUNT,value:2}],stackable:false,maxStacks:1,useTranslationKey:true},{id:"moli_kujie",name:"魔力枯竭",shortDescription:"全队特攻-50%",fullDescription:"我方所有宝可梦特殊攻击降低50%。",rarity:Yt.EPIC,tags:[je.DEBUFF],effectType:us.STAT_BOOST,effectValue:{spatk:-50},conditions:[{type:Fi.TAG_COUNT,value:2}],stackable:false,maxStacks:1,useTranslationKey:true},{id:"mokang_posui",name:"魔抗破碎",shortDescription:"全队特防-50%",fullDescription:"我方所有宝可梦特殊防御降低50%。",rarity:Yt.EPIC,tags:[je.DEBUFF],effectType:us.STAT_BOOST,effectValue:{spdef:-50},conditions:[{type:Fi.TAG_COUNT,value:2}],stackable:false,maxStacks:1,useTranslationKey:true},{id:"chihuan_zhizhou",name:"迟缓之咒",shortDescription:"全队速度-50%",fullDescription:"我方所有宝可梦速度降低50%。",rarity:Yt.EPIC,tags:[je.DEBUFF],effectType:us.STAT_BOOST,effectValue:{spd:-50},conditions:[{type:Fi.TAG_COUNT,value:2}],stackable:false,maxStacks:1,useTranslationKey:true},{id:"shengming_liushi",name:"生命流逝",shortDescription:"全队最大HP-50%",fullDescription:"我方所有宝可梦最大HP降低50%。",rarity:Yt.EPIC,tags:[je.DEBUFF],effectType:us.STAT_BOOST,effectValue:{hp:-50},conditions:[{type:Fi.TAG_COUNT,value:2}],stackable:false,maxStacks:1,useTranslationKey:true}];

/** 产物 `vLe` — 时代天赋单体定义 */
const vLe: Talent = {id:"bingheqi",name:"冰河期",shortDescription:"冰系招式降速，速度-6时触发AOE",fullDescription:"冰系招式降低敌方速度2级。敌方速度-6级时，对全体造成雷吉艾斯特防×300%伤害，并永久提升：雷吉艾斯特防+2%，冰属性全属性+1%，水属性攻击+2%/防御-2%。每回合限1次，每波限10次。",rarity:Yt.ULTIMATE,tags:[je.POKEMON,je.MECHANIC,je.ULTIMATE],effectType:us.SPECIAL_MECHANIC,effectValue:{mechanic:"ice_age",speedReduction:-2,aoeDamageMultiplier:3,regiceSpDefBoost:2,iceTypeAllStatsBoost:1,waterTypeAtkBoost:2,waterTypeDefReduction:2,maxTriggersPerTurn:1,maxTriggersPerWave:10},conditions:[],stackable:false,maxStacks:1,useTranslationKey:false};

/** 产物 `wLe` — 时代天赋单体定义 */
const wLe: Talent = {id:"shiqishidai",name:"石器时代",shortDescription:"岩石系招式降低敌方物攻，物攻-6时触发AOE",fullDescription:"岩石系招式降低敌方物攻2级。敌方物攻-6级时，对全体造成雷吉洛克物防×300%伤害，并永久提升：雷吉洛克物防+2%，岩石属性全属性+1%，地面属性物攻+2%/特防-2%。每回合限1次，每波限10次。",rarity:Yt.ULTIMATE,tags:[je.POKEMON,je.MECHANIC,je.ULTIMATE],effectType:us.SPECIAL_MECHANIC,effectValue:{mechanic:"stone_age",attackReduction:-2,aoeDamageMultiplier:3,regirockDefBoost:2,rockTypeAllStatsBoost:1,groundTypeAtkBoost:2,groundTypeSpDefReduction:2,maxTriggersPerTurn:1,maxTriggersPerWave:10},conditions:[],stackable:false,maxStacks:1,useTranslationKey:false};

/** 产物 `bLe` — 时代天赋单体定义 */
const bLe: Talent = {id:"gongyegeming",name:"工业革命",shortDescription:"钢系招式降低敌方特攻，特攻-6时触发AOE",fullDescription:"钢系招式降低敌方特攻2级。敌方特攻-6级时，对全体造成雷吉斯奇鲁(物防+特防)×300%伤害，并永久提升：雷吉斯奇鲁物防+1%/特防+1%，钢属性全属性+1%，火属性速度+2%/特攻-2%。每回合限1次，每波限10次。",rarity:Yt.ULTIMATE,tags:[je.POKEMON,je.MECHANIC,je.ULTIMATE],effectType:us.SPECIAL_MECHANIC,effectValue:{mechanic:"industrial_age",spAtkReduction:-2,aoeDamageMultiplier:3,registeelDefBoost:1,registeelSpDefBoost:1,steelTypeAllStatsBoost:1,fireTypeSpdBoost:2,fireTypeSpAtkReduction:2,maxTriggersPerTurn:1,maxTriggersPerWave:10},conditions:[],stackable:false,maxStacks:1,useTranslationKey:false};

/** 产物 `xLe` — 时代天赋单体定义 */
const xLe: Talent = {id:"xinxiwenming",name:"信息文明",shortDescription:"电系招式降低敌方物防，物防-6时触发AOE",fullDescription:"电系招式降低敌方物防2级。敌方物防-6级时，对全体造成雷吉艾勒奇速度×300%伤害，并永久提升：雷吉艾勒奇速度+2%，电属性全属性+1%，毒属性速度+2%/特防-2%。每回合限1次，每波限10次。",rarity:Yt.ULTIMATE,tags:[je.POKEMON,je.MECHANIC,je.ULTIMATE],effectType:us.SPECIAL_MECHANIC,effectValue:{mechanic:"info_age",defReduction:-2,aoeDamageMultiplier:3,regielekiSpdBoost:2,electricTypeAllStatsBoost:1,poisonTypeSpdBoost:2,poisonTypeSpDefReduction:2,maxTriggersPerTurn:1,maxTriggersPerWave:10},conditions:[],stackable:false,maxStacks:1,useTranslationKey:false};

/** 产物 `VLe` — 时代天赋单体定义 */
const VLe: Talent = {id:"tutengchongbai",name:"图腾崇拜",shortDescription:"龙系招式降低敌方特防，特防-6时触发AOE",fullDescription:"龙系招式降低敌方特防2级。敌方特防-6级时，对全体造成雷吉铎拉戈最大HP×200%伤害，并永久提升：雷吉铎拉戈HP+2%，龙属性全属性+1%，一般属性物攻+2%/速度+2%/特防-2%。每回合限1次，每波限10次。",rarity:Yt.ULTIMATE,tags:[je.POKEMON,je.MECHANIC,je.ULTIMATE],effectType:us.SPECIAL_MECHANIC,effectValue:{mechanic:"totem_age",spDefReduction:-2,aoeDamageMultiplier:2,regidragoHpBoost:2,dragonTypeAllStatsBoost:1,normalTypeAtkBoost:2,normalTypeSpdBoost:2,normalTypeSpDefReduction:2,maxTriggersPerTurn:1,maxTriggersPerWave:10},conditions:[],stackable:false,maxStacks:1,useTranslationKey:false};

/** 产物 `kLe` — 时代天赋单体定义 */
const kLe: Talent = {id:"dengjiajiaohuan",name:"等价交换",shortDescription:"烈焰猴半血换取强大力量",fullDescription:"每波一次我方烈焰猴攻击时触发，我方烈焰猴的血量变为最大值的50%，烈焰猴HP属性提升50%，物攻/物防/特攻/特防/速度属性提升15%。",rarity:Yt.ULTIMATE,tags:[je.HP,je.BUFF,je.POKEMON],effectType:us.SPECIAL_MECHANIC,effectValue:{mechanic:"dengjiajiaohuan",species:[e.INFERNAPE],ability:o.BLAZE,hpBoost:50,statBoost:15},conditions:[],stackable:false,maxStacks:1,useTranslationKey:false};

const Qg: Talent[] = [{id:"mengxing",name:"梦行",shortDescription:"睡眠时依旧可以正常行动",fullDescription:"我方宝可梦处于睡眠状态时，依旧可以正常行动。",rarity:Yt.EPIC,tags:[je.STATUS,je.MECHANIC],effectType:us.SPECIAL_MECHANIC,effectValue:{mechanic:"sleep_act_freely"},conditions:[{type:Fi.TAG_COUNT,value:1}],stackable:false,maxStacks:1},{id:"mengjing_hubi",name:"梦境护壁",shortDescription:"睡眠时减伤并每回合回复生命",fullDescription:"我方宝可梦处于睡眠状态时，受到伤害降低25%，并在每回合结束时回复最大生命值的1/12。可叠加2层。",rarity:Yt.EPIC,tags:[je.STATUS,je.RECOVERY],effectType:us.SPECIAL_MECHANIC,effectValue:{mechanic:"sleep_guard_wall",damageReduction:.25,healFraction:1/12},conditions:[],stackable:true,maxStacks:2},{id:"shimeng",name:"食梦",shortDescription:"睡眠敌人回合末额外损失生命",fullDescription:"敌方宝可梦处于睡眠状态时，每回合结束时额外损失最大生命值的1/8。",rarity:Yt.EPIC,tags:[je.STATUS],effectType:us.SPECIAL_MECHANIC,effectValue:{mechanic:"bad_dreams_talent",damageFraction:1/8},conditions:[{type:Fi.TAG_COUNT,value:1}],stackable:false,maxStacks:1},{id:"tongxing",name:"同行",shortDescription:"我方获得异常时同步给敌方",fullDescription:"我方宝可梦获得异常状态时，会将同类型异常同步给敌方在场宝可梦。由此同步的异常不会触发敌方的树果效果。",rarity:Yt.ULTIMATE,tags:[je.STATUS,je.MECHANIC],effectType:us.SPECIAL_MECHANIC,effectValue:{mechanic:"status_sync_to_enemies",berryTriggerBlock:true},conditions:[{type:Fi.TAG_COUNT,value:2}],stackable:false,maxStacks:1}];
const Jg: Talent[] = [vLe];
const jg: Talent[] = [wLe];
const zg: Talent[] = [bLe];
const qg: Talent[] = [xLe];
const eH: Talent[] = [VLe];
const tH: Talent[] = [kLe];
const sH: Talent[] = [{id:"yijian_qingyuan",name:"一见情缘",shortDescription:"七夕青鸟/沙奈朵对异性增伤，每波首次攻击附加着迷",fullDescription:"七夕青鸟/沙奈朵的攻击对异性(包括无性别)的最终伤害结算×520%；每波次开始后的第一次攻击会给敌方附加着迷状态(无视性别)；每次敌方触发着迷状态的效果不能行动时，都会永久提升七夕青鸟/沙奈朵全属性7.7%（每波次最多叠加2层）。",rarity:Yt.ULTIMATE,tags:[je.STATUS,je.BUFF,je.ULTIMATE],effectType:us.SPECIAL_MECHANIC,effectValue:{mechanic:"yijian_qingyuan",damageMultiplier:5.2,statBoostPerTrigger:7.7},conditions:[],stackable:false,maxStacks:1},{id:"zican",name:"自残",shortDescription:"着迷状态不能行动的概率变为100%(双方都有效)",fullDescription:"着迷状态不能行动的概率变为100%(双方都有效)。",rarity:Yt.EPIC,tags:[je.STATUS,je.MECHANIC],effectType:us.SPECIAL_MECHANIC,effectValue:{mechanic:"zican_infatuation_always_immobilize"},conditions:[],stackable:false,maxStacks:1},{id:"xingxiang",name:"星象",shortDescription:"基拉祈按星象轮转获得效果，每轮回一周全属性+6%",fullDescription:`根据对应星象获得对应效果，并且每次触发对应星象效果或者进入下一波次会切换到下一个星象；每切换一轮星象，基拉祈全属性提升6%。
火象：下一次物/特攻招式威力提升1300%
水象：物/特招式对我方造成的伤害减半，并且敌方攻击造成伤害后自身物攻/特攻/物防/特防+1
土象：自身当前回合受到的全部伤害固定为1
风象：使用变化招式后，回复全队50%血量，并且清除全队异常状态，自身速度+1`,rarity:Yt.ULTIMATE,tags:[je.ULTIMATE,je.MECHANIC],effectType:us.SPECIAL_MECHANIC,effectValue:{mechanic:"xingxiang_cycle",cycleStatBoost:6},conditions:[],stackable:false,maxStacks:1}];
export const TALENT_POOL_STATUS: Talent[] = Qg;
export const TALENT_POOL_ICE_AGE: Talent[] = Jg;
export const TALENT_POOL_STONE_AGE: Talent[] = jg;
export const TALENT_POOL_INDUSTRIAL_AGE: Talent[] = zg;
export const TALENT_POOL_INFO_AGE: Talent[] = qg;
export const TALENT_POOL_TOTEM_AGE: Talent[] = eH;
export const TALENT_POOL_TRADE: Talent[] = tH;
export const TALENT_POOL_ROMANCE: Talent[] = sH;

// ─────────────────────────────────────────────────────────────
// 6. 敌方天赋管理器（产物 `o2` / `bR` / `ZLe`）
// ─────────────────────────────────────────────────────────────

/** 产物 `o2` — 敌方天赋管理器 */
export class EnemyTalentManager {
  private readonly talents = new Map<string, number>();

  reset(): void {
    this.talents.clear();
  }

  setTalents(ids: string[]): void {
    this.talents.clear();
    for (const id of ids) this.talents.set(id, (this.talents.get(id) ?? 0) + 1);
  }

  hasTalent(id: string): boolean {
    return this.talents.has(id);
  }

  getStacks(id: string): number {
    return this.talents.get(id) ?? 0;
  }

  getTalentIds(): string[] {
    return [...this.talents.keys()];
  }

  getTalents(): Map<string, number> {
    return this.talents;
  }

  getAcquiredTalents(): Map<string, AcquiredTalent> {
    const out = new Map<string, AcquiredTalent>();
    for (const [id, stacks] of this.talents.entries()) {
      out.set(id, { talentId: id, stacks, acquiredWave: 0, refreshPtSpent: 0 });
    }
    return out;
  }
}

let enemyTalentManager: EnemyTalentManager | null = null;

/** 产物 `bR` — 取敌方天赋管理器 */
export function getEnemyTalentManager(): EnemyTalentManager {
  return (enemyTalentManager ??= new EnemyTalentManager());
}

/** 产物 `ZLe` — 重置敌方天赋管理器 */
export function resetEnemyTalentManager(): void {
  if (enemyTalentManager) enemyTalentManager.reset();
  enemyTalentManager = new EnemyTalentManager();
}

// ─────────────────────────────────────────────────────────────
// 7. 天赋查询（产物 `yE` / `O0` / `Nue` / `due` / `XNe` / `dre` / `xR`）
// ─────────────────────────────────────────────────────────────

/** 产物 `yE` — 该宝可梦（或敌方）是否拥有指定天赋 */
export function hasTalentFor(pokemon: any, talentId: string): boolean {
  if (!pokemon) return false;
  return pokemon.isPlayer() ? getTalentManager().hasTalent(talentId) : getEnemyTalentManager().hasTalent(talentId);
}

/** 产物 `O0` — 该宝可梦（或敌方）的天赋叠加层数 */
export function getTalentStacksFor(pokemon: any, talentId: string): number {
  if (!pokemon) return 0;
  return pokemon.isPlayer() ? getTalentManager().getTalentStacks(talentId) : getEnemyTalentManager().getStacks(talentId);
}

/** 产物 `Nue` — 玩家天赋叠加层数 */
export function getPlayerTalentStacks(talentId: string): number {
  const manager = getTalentManager();
  return manager ? manager.getTalentStacks(talentId) : 0;
}

/** 产物 `due` — 是否拥有「状态同步」天赋 */
export function hasStatusSyncTalent(pokemon: any): boolean {
  return getTalentStacksFor(pokemon, TALENT_ID_STATUS_SYNC) > 0;
}

/** 产物 `XNe` — 玩家是否拥有「自残」天赋 */
export function hasZicanTalent(): boolean {
  const manager = getTalentManager();
  return !!manager && manager.hasTalent(TALENT_ID_ZICAN);
}

/** 产物 `dre` — 指定种族玩家/敌方是否激活天赋（列表限定） */
export function isPlayerSpeciesTalentActive$1(pokemon: any, speciesList: number[], talentId: string): boolean {
  if (!pokemon || !speciesList.includes(pokemon.species.speciesId)) return false;
  if (pokemon.isPlayer()) {
    const manager = getTalentManager();
    return (!!manager && manager.hasTalent(talentId)) || hasTalentReleaseTalent(pokemon, talentId);
  }
  return getEnemyTalentManager().hasTalent(talentId);
}

/** 产物 `xR` — 指定种族是否激活天赋（单种族） */
export function isPlayerSpeciesTalentActive(pokemon: any, speciesId: number, talentId: string): boolean {
  if (!pokemon || pokemon.species.speciesId !== speciesId) return false;
  if (pokemon.isPlayer()) {
    const manager = getTalentManager();
    return (!!manager && manager.hasTalent(talentId)) || hasTalentReleaseTalent(pokemon, talentId);
  }
  return getEnemyTalentManager().hasTalent(talentId);
}

// ─────────────────────────────────────────────────────────────
// 8. 天赋释放（产物 `Ire` / `lre` / `fS` / `XLe` / `lo` / `$Le`）
// ─────────────────────────────────────────────────────────────

/** 产物 `Ore` — 种族 → 释放天赋 id 表 */
const TALENT_RELEASE_BY_SPECIES = new Map<number, string>();

/** 产物 `Ire` — 该宝可梦种族是否可激活天赋释放 */
export function canPokemonActivateTalentRelease(pokemon: any): boolean {
  return TALENT_RELEASE_BY_SPECIES.has(pokemon.species.speciesId);
}

/** 产物 `lre` — 取该宝可梦的释放天赋 id（无则 null） */
export function getTalentReleaseTalentId(pokemon: any): string | null {
  if (globalScene?.gameMode?.isEryou) return null;
  if (!pokemon.getHeldItems().some((item: any) => item.type?.id === TALENT_RELEASE_ITEM_ID)) return null;
  return TALENT_RELEASE_BY_SPECIES.get(pokemon.species.speciesId) ?? null;
}

/** 产物 `fS` — 该宝可梦是否拥有指定释放天赋 */
export function hasTalentReleaseTalent(pokemon: any, talentId: string): boolean {
  return getTalentReleaseTalentId(pokemon) === talentId;
}

/** 产物 `XLe` — 该宝可梦是否（直接或释放）拥有指定天赋 */
export function hasActiveTalentForPokemon(pokemon: any, talentId: string): boolean {
  const manager = getTalentManager();
  return (!!manager && manager.hasTalent(talentId)) || hasTalentReleaseTalent(pokemon, talentId);
}

/** 产物 `lo` — 队伍中是否有存活单位拥有该释放天赋 */
export function hasTalentReleaseTalentInParty(pokemon: any, talentId: string): boolean {
  if (!globalScene || !pokemon.isPlayer()) return false;
  return globalScene.getPlayerParty().some((p: any) => p && !p.isFainted() && hasTalentReleaseTalent(p, talentId));
}

/** 产物 `$Le` — 释放天赋的展示层数（猛火/BUG燕） */
export function getTalentReleaseDisplayStackCount(pokemon: any): number | null {
  switch (getTalentReleaseTalentId(pokemon)) {
    case "menghuo_menghuo":
      return pokemon.customPokemonData.menghuoMenghuoFireStacks ?? 0;
    case "bug_yan":
      return pokemon.customPokemonData.bugYanPermanentStacks ?? 0;
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────
// 9. 时代天赋（产物 `$_e` / `sNe` / `ONe` / `hNe` / `GNe` / `Aue`）
// ─────────────────────────────────────────────────────────────

/** 时代天赋运行态（产物 `PR` / `CR` / `dR` / `MR` / `UR` 的公共形） */
export interface AgeTalentRuntime {
  turnTriggered: boolean;
  waveTriggersCount: number;
}

function makeAgeRuntime(): AgeTalentRuntime {
  return { turnTriggered: false, waveTriggersCount: 0 };
}

export const iceAgeRuntime = makeAgeRuntime(); // 产物 `PR`
export const stoneAgeRuntime = makeAgeRuntime(); // 产物 `CR`
export const industrialAgeRuntime = makeAgeRuntime(); // 产物 `dR`
export const infoAgeRuntime = makeAgeRuntime(); // 产物 `MR`
export const totemAgeRuntime = makeAgeRuntime(); // 产物 `UR`

/** 产物 `$_e` — 冰河期：冰系招式降敌速度，雷吉艾斯触发放大 */
export function handleIceAgeTalentEffect(pokemon: any, move: any): void {
  if ((!hasTalentFor(pokemon, "bingheqi") && !hasTalentReleaseTalentInParty(pokemon, "bingheqi")) || pokemon.getMoveType(move) !== PokemonType.ICE) {
    return;
  }
  if (iceAgeRuntime.turnTriggered) {
    debugLog("talent", "[IceAge] 本回合已触发，跳过");
    return;
  }
  if (iceAgeRuntime.waveTriggersCount >= 10) {
    debugLog("talent", "[IceAge] 本波次已触发10次，跳过");
    return;
  }
  debugLog("talent", `[IceAge] 冰河期天赋触发: ${pokemon.name}使用了${move.name} (实际类型: 冰)`);
  iceAgeRuntime.turnTriggered = true;
  iceAgeRuntime.waveTriggersCount++;
  if (globalScene) {
    const targets = pokemon.isPlayer() ? globalScene.getEnemyField() : globalScene.getPlayerField();
    for (const target of targets) {
      if (target && !target.isFainted() && target.summonData) {
        const before = target.getStatStage(Stat.SPD);
        const after = Math.max(before - 2, -6);
        target.setStatStage(Stat.SPD, after);
        debugLog("talent", `[IceAge] ${target.name}速度: ${before} -> ${after}`);
        globalScene.queueMessage?.(`${target.name}的速度降低了！`);
        target.updateInfo();
      }
    }
  }
  // TODO(A4-验证): 雷吉艾斯（REGIELEKI）触发的 AOE 伤害 + 永久属性提升（产物 `k_e` / `x_e` / `Z_e` / `X_e`）
}

/** 产物 `sNe` — 石器时代：岩石系招式降敌物攻，雷吉洛克触发放大 */
export function handleStoneAgeTalentEffect(pokemon: any, move: any): void {
  if ((!hasTalentFor(pokemon, "shiqishidai") && !hasTalentReleaseTalentInParty(pokemon, "shiqishidai")) || pokemon.getMoveType(move) !== PokemonType.ROCK) {
    return;
  }
  if (stoneAgeRuntime.turnTriggered) {
    debugLog("talent", "[StoneAge] 本回合已触发，跳过");
    return;
  }
  if (stoneAgeRuntime.waveTriggersCount >= 10) {
    debugLog("talent", "[StoneAge] 本波次已触发10次，跳过");
    return;
  }
  debugLog("talent", `[StoneAge] 石器时代天赋触发: ${pokemon.name}使用了${move.name} (实际类型: 岩石)`);
  stoneAgeRuntime.turnTriggered = true;
  stoneAgeRuntime.waveTriggersCount++;
  if (globalScene) {
    const targets = pokemon.isPlayer() ? globalScene.getEnemyField() : globalScene.getPlayerField();
    for (const target of targets) {
      if (target && !target.isFainted() && target.summonData) {
        const before = target.getStatStage(Stat.ATK);
        const after = Math.max(before - 2, -6);
        target.setStatStage(Stat.ATK, after);
        debugLog("talent", `[StoneAge] ${target.name}物攻: ${before} -> ${after}`);
        globalScene.queueMessage?.(`${target.name}的物攻降低了！`);
        target.updateInfo();
      }
    }
  }
  // TODO(A4-验证): 雷吉洛克（REGIROCK）触发的 AOE + 永久属性提升（产物 `qLe` / `jLe` / `eNe` / `tNe`）
}

/** 产物 `ONe` — 工业革命：钢系招式降敌特攻，雷吉斯奇鲁触发放大 */
export function handleIndustrialAgeTalentEffect(pokemon: any, move: any): void {
  if ((!hasTalentFor(pokemon, "gongyegeming") && !hasTalentReleaseTalentInParty(pokemon, "gongyegeming")) || pokemon.getMoveType(move) !== PokemonType.STEEL) {
    return;
  }
  if (industrialAgeRuntime.turnTriggered) {
    debugLog("talent", "[IndustrialAge] 本回合已触发，跳过");
    return;
  }
  if (industrialAgeRuntime.waveTriggersCount >= 10) {
    debugLog("talent", "[IndustrialAge] 本波次已触发10次，跳过");
    return;
  }
  debugLog("talent", `[IndustrialAge] 工业革命天赋触发: ${pokemon.name}使用了${move.name} (实际类型: 钢)`);
  industrialAgeRuntime.turnTriggered = true;
  industrialAgeRuntime.waveTriggersCount++;
  if (globalScene) {
    const targets = pokemon.isPlayer() ? globalScene.getEnemyField() : globalScene.getPlayerField();
    for (const target of targets) {
      if (target && !target.isFainted() && target.summonData) {
        const before = target.getStatStage(Stat.SPATK);
        const after = Math.max(before - 2, -6);
        target.setStatStage(Stat.SPATK, after);
        debugLog("talent", `[IndustrialAge] ${target.name}特攻: ${before} -> ${after}`);
        globalScene.queueMessage?.(`${target.name}的特攻降低了！`);
        target.updateInfo();
      }
    }
  }
  // TODO(A4-验证): 雷吉斯奇鲁（REGISTEEL）触发的 AOE + 永久属性提升（产物 `rNe` / `aNe` / `oNe` / `RNe`）
}

/** 产物 `hNe` — 信息文明：电系招式降敌物防，雷吉艾勒奇触发放大 */
export function handleInfoAgeTalentEffect(pokemon: any, move: any): void {
  if ((!hasTalentFor(pokemon, "xinxiwenming") && !hasTalentReleaseTalentInParty(pokemon, "xinxiwenming")) || pokemon.getMoveType(move) !== PokemonType.ELECTRIC) {
    return;
  }
  if (infoAgeRuntime.turnTriggered) {
    debugLog("talent", "[InfoAge] 本回合已触发，跳过");
    return;
  }
  if (infoAgeRuntime.waveTriggersCount >= 10) {
    debugLog("talent", "[InfoAge] 本波次已触发10次，跳过");
    return;
  }
  debugLog("talent", `[InfoAge] 信息文明天赋触发: ${pokemon.name}使用了${move.name} (实际类型: 电)`);
  infoAgeRuntime.turnTriggered = true;
  infoAgeRuntime.waveTriggersCount++;
  if (globalScene) {
    const targets = pokemon.isPlayer() ? globalScene.getEnemyField() : globalScene.getPlayerField();
    for (const target of targets) {
      if (target && !target.isFainted() && target.summonData) {
        const before = target.getStatStage(Stat.DEF);
        const after = Math.max(before - 2, -6);
        target.setStatStage(Stat.DEF, after);
        debugLog("talent", `[InfoAge] ${target.name}物防: ${before} -> ${after}`);
        globalScene.queueMessage?.(`${target.name}的物防降低了！`);
        target.updateInfo();
      }
    }
  }
  // TODO(A4-验证): 雷吉艾勒奇（REGIELEKI）触发的 AOE + 永久属性提升（产物 `NNe` / `TNe` / `uNe` / `cNe`）
}

/** 产物 `GNe` — 图腾崇拜：龙系招式降敌特防，雷吉铎拉戈触发放大 */
export function handleTotemAgeTalentEffect(pokemon: any, move: any): void {
  if ((!hasTalentFor(pokemon, "tutengchongbai") && !hasTalentReleaseTalentInParty(pokemon, "tutengchongbai")) || pokemon.getMoveType(move) !== PokemonType.DRAGON) {
    return;
  }
  if (totemAgeRuntime.turnTriggered) {
    debugLog("talent", "[TotemAge] 本回合已触发，跳过");
    return;
  }
  if (totemAgeRuntime.waveTriggersCount >= 10) {
    debugLog("talent", "[TotemAge] 本波次已触发10次，跳过");
    return;
  }
  debugLog("talent", `[TotemAge] 图腾崇拜天赋触发: ${pokemon.name}使用了${move.name} (实际类型: 龙)`);
  totemAgeRuntime.turnTriggered = true;
  totemAgeRuntime.waveTriggersCount++;
  if (globalScene) {
    const targets = pokemon.isPlayer() ? globalScene.getEnemyField() : globalScene.getPlayerField();
    for (const target of targets) {
      if (target && !target.isFainted() && target.summonData) {
        const before = target.getStatStage(Stat.SPDEF);
        const after = Math.max(before - 2, -6);
        target.setStatStage(Stat.SPDEF, after);
        debugLog("talent", `[TotemAge] ${target.name}特防: ${before} -> ${after}`);
        globalScene.queueMessage?.(`${target.name}的特防降低了！`);
        target.updateInfo();
      }
    }
  }
  // TODO(A4-验证): 雷吉铎拉戈（REGIDRAGO）触发的 AOE + 永久属性提升（产物 `fNe` / `UNe` / `PNe` / `_Ne`）
}

/** 产物 `Aue` — 星象天赋（火象威力加成 / 其他象触发特殊效果） */
export function handleXingxiangTalentEffect(pokemon: any, move: any): void {
  if (pokemon.isFainted() || !hasXingxiangTalent(pokemon)) return;
  const cycle = getXingxiangCycle(pokemon);
  const isStatus = move.category === MoveCategory.STATUS;
  if (cycle === XINGXIANG_FIRE && !isStatus) {
    const lastHit = (pokemon.turnData?.hitsLeft ?? 1) === 1;
    const connected = !!pokemon.turnData?.attackHitConnected;
    if (lastHit && connected) {
      debugLog("talent", `[星象] 火象触发：${pokemon.name} 的 ${move.name} 享受了威力+1300%加成`);
      globalScene.queueMessage("星象·火象的威力加成生效了！");
      applyXingxiangFireBonus(pokemon);
    }
  } else if (cycle === XINGXIANG_OTHER && isStatus) {
    applyXingxiangOtherEffect(pokemon);
    applyXingxiangFireBonus(pokemon);
  }
}

// ─────────────────────────────────────────────────────────────
// 10. 运行时 HUD（产物 `fre` / `Oue` / `pge` / `Ene`）
// ─────────────────────────────────────────────────────────────

/** 产物 `fre` — 战斗中的天赋运行时文本行 */
export function getBattleTalentRuntimeLines(pokemon: any): string[] {
  const lines: string[] = [];
  // TODO(接入锚点): 产物按 BUG燕 / 猛火 / 一见情缘 / 星象 / 冰河期 / 石器时代 /
  //                 工业革命 / 信息文明 / 图腾崇拜 逐项拼接运行时行（`xR`/`Rg`/`PS` 等判定）。
  // TODO(A4-验证): 星象轮回层数、冰河期/石器时代加成读数的精确格式
  return lines;
}

/** 产物 `Oue` — 读档后刷新天赋 HUD */
export function refreshTalentRuntimeHudAfterLoad(): void {
  if (!globalScene) return;
  try {
    const party = globalScene.getPlayerParty();
    for (const pokemon of party) {
      if (!pokemon || pokemon.isFainted()) continue;
      const lines = getBattleTalentRuntimeLines(pokemon);
      if (lines.length > 0) {
        globalScene.setTalentRuntimeHudText(lines.join("\n"));
        return;
      }
    }
    globalScene.setTalentRuntimeHudText("");
  } catch (err) {
    console.error("[天赋HUD] 读档后刷新失败:", err);
  }
}

/** 产物 `pge` — 构建守护者天赋行（敌方天赋列表展示） */
export function buildGuardianTalentLines(pokemon: any): string[] {
  const enemyManager = getEnemyTalentManager();
  const registry = getTalentRegistry();
  const lines: string[] = [];
  for (const [id, stacks] of enemyManager.getTalents()) {
    if (id === "xingxiang") {
      lines.push(`星象 [${getXingxiangCycleLabel(pokemon)}]`);
      continue;
    }
    const talent = registry.getTalent(id);
    if (!talent) continue;
    const name = i18next.t(talent.name, talent.name);
    lines.push(stacks > 1 && id !== "shengmingjiqu" ? `${name} ×${stacks}` : name);
  }
  return lines;
}

/** 产物 `Ene` — 构建守护者天赋 id 列表（含额外池随机补充） */
export function buildGuardianTalentIds(pokemon: any, species: number): string[] {
  const ids = pokemon.talentForSpecies(species);
  if (pokemon.extraTalentPool && pokemon.extraTalentCount) {
    const [min, max] = pokemon.extraTalentCount;
    const count = min + pe(max - min + 1);
    const pool = [...pokemon.extraTalentPool];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = pe(i + 1);
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    ids.push(...pool.slice(0, count));
  }
  return ids;
}

// ─────────────────────────────────────────────────────────────
// 11. 图鉴管理器（产物 `O2` / `mue`）
// ─────────────────────────────────────────────────────────────

/** 产物 `O2` — 天赋图鉴管理器 */
export class TalentCodexManager {
  private discoveredTalents = new Set<string>();

  markDiscovered(id: string): void {
    this.discoveredTalents.add(id);
  }

  isDiscovered(id: string): boolean {
    return this.discoveredTalents.has(id);
  }

  getProgress(total?: number): { discovered: number; total: number } {
    return { discovered: this.discoveredTalents.size, total: total ?? this.discoveredTalents.size };
  }

  serialize(): string {
    return JSON.stringify({ discoveredTalents: Array.from(this.discoveredTalents) });
  }

  deserialize(data: string): void {
    try {
      const parsed = JSON.parse(data);
      if (parsed.discoveredTalents && Array.isArray(parsed.discoveredTalents)) {
        this.discoveredTalents = new Set(parsed.discoveredTalents);
      } else {
        console.warn("Invalid codex data format, resetting to empty");
        this.discoveredTalents = new Set();
      }
    } catch (err) {
      console.error("Failed to deserialize codex data:", err);
      this.discoveredTalents = new Set();
    }
  }

  reset(): void {
    this.discoveredTalents.clear();
  }

  getDiscoveredTalents(): string[] {
    return Array.from(this.discoveredTalents);
  }
}

let talentCodexManager: TalentCodexManager | null = null;

/** 产物 `mue` — 取天赋图鉴管理器 */
export function getTalentCodexManager(): TalentCodexManager {
  return (talentCodexManager ??= new TalentCodexManager());
}

// ─────────────────────────────────────────────────────────────
// 12. 天赋管理器 V2（产物 `Wk` / `Ci` / `f0`）
// ─────────────────────────────────────────────────────────────

/** 产物 `Wk` — 玩家天赋管理器 V2（获取/叠加/移除 + 属性重算 + 历史） */
export class TalentManagerV2 {
  private readonly acquiredTalents = new Map<string, AcquiredTalent>();
  private readonly history: TalentHistoryEntry[] = [];
  private refreshCount = 0;
  private pityCounter = 0;
  private totalRefreshPtSpent = 0;

  /** 产物 `acquireTalent` — 获取天赋（含叠加、历史、属性重算，日志逐字保留） */
  acquireTalent(talent: Talent, wave: number, refreshPtSpent = 0): boolean {
    const existing = this.acquiredTalents.get(talent.id);
    if (existing) {
      if (!talent.stackable) {
        console.warn(`[TalentManagerV2] 天赋 "${talent.id}" 不可叠加，无法再次获取`);
        return false;
      }
      if (existing.stacks >= talent.maxStacks) {
        console.warn(`[TalentManagerV2] 天赋 "${talent.id}" 已达最大叠加层数 ${talent.maxStacks}`);
        return false;
      }
      existing.stacks += 1;
    } else {
      const entry: AcquiredTalent = { talentId: talent.id, stacks: 1, acquiredWave: wave, refreshPtSpent };
      this.acquiredTalents.set(talent.id, entry);
    }
    const historyEntry: TalentHistoryEntry = {
      talentId: talent.id,
      talentName: talent.name,
      wave,
      refreshPtSpent,
      timestamp: Date.now(),
    };
    this.history.push(historyEntry);
    this.resetRefreshCount();
    globalScene?.events?.emit("talentAcquired", talent.id);
    onTalentAcquired(talent, existing ? existing.stacks : 1);

    const affectsStats = talent.effectType === us.STAT_BOOST;
    debugLog("talent", `[TalentManager] 检查天赋 "${talent.id}" 是否影响属性...`);
    debugLog("talent", `[TalentManager] 天赋类型: ${talent.effectType}, 是否影响属性: ${affectsStats}`);
    if (affectsStats) {
      debugLog("talent", `[TalentManager] ✓ 天赋 "${talent.id}" 影响属性，开始重新计算所有宝可梦stats`);
      debugLog("talent", `[TalentManager] globalScene存在: ${!!globalScene}`);
      if (globalScene) {
        const party = globalScene.getPlayerParty();
        debugLog("talent", `[TalentManager] 队伍宝可梦数量: ${party.length}`);
        for (const pokemon of party) {
          if (!pokemon) continue;
          debugLog("talent", `[TalentManager] 处理宝可梦: ${pokemon.name}`);
          const oldMaxHp = pokemon.getMaxHp();
          const oldHp = pokemon.hp;
          const ratio = oldMaxHp > 0 ? pokemon.hp / oldMaxHp : 1;
          debugLog("talent", `[TalentManager] - 旧最大HP: ${oldMaxHp}, 当前HP: ${oldHp}, 百分比: ${(ratio * 100).toFixed(2)}%`);
          pokemon.calculateStats();
          const newMaxHp = pokemon.getMaxHp();
          const newHp = Math.min(Math.floor(newMaxHp * ratio), newMaxHp);
          pokemon.hp = newHp;
          debugLog("talent", `[TalentManager] - 新最大HP: ${newMaxHp}, 新当前HP: ${pokemon.hp}`);
          debugLog("talent", `[TalentManager] ✓ ${pokemon.name} HP更新完成: ${oldMaxHp} -> ${newMaxHp}, 当前HP: ${oldHp} -> ${pokemon.hp}`);
          debugLog("talent", "[TalentManager] - 强制更新宝可梦UI");
          pokemon.updateInfo();
        }
        debugLog("talent", "[TalentManager] ✓ 所有宝可梦stats重新计算完成");
        globalScene.updateFieldScale?.();
      } else {
        console.error("[TalentManager] ✗ globalScene不存在，无法重新计算stats");
      }
    } else {
      debugLog("talent", `[TalentManager] ✗ 天赋 "${talent.id}" 不影响属性，跳过重新计算`);
    }
    return true;
  }

  removeTalent(id: string): boolean {
    if (this.acquiredTalents.has(id)) {
      this.acquiredTalents.delete(id);
      return true;
    }
    console.warn(`[TalentManagerV2] 天赋 "${id}" 不存在，无法移除`);
    return false;
  }

  hasTalent(id: string): boolean {
    return this.acquiredTalents.has(id);
  }

  getTalentStacks(id: string): number {
    return this.acquiredTalents.get(id)?.stacks ?? 0;
  }

  getAcquiredTalents(): Map<string, AcquiredTalent> {
    return this.acquiredTalents;
  }

  getHistory(): TalentHistoryEntry[] {
    return this.history;
  }

  getRefreshCount(): number {
    return this.refreshCount;
  }

  incrementRefreshCount(): void {
    this.refreshCount++;
  }

  resetRefreshCount(): void {
    this.refreshCount = 0;
  }

  getPityCounter(): number {
    return this.pityCounter;
  }

  incrementPityCounter(): void {
    this.pityCounter++;
  }

  resetPityCounter(): void {
    this.pityCounter = 0;
  }

  reset(): void {
    this.acquiredTalents.clear();
    this.history.length = 0;
    this.refreshCount = 0;
    this.pityCounter = 0;
    this.totalRefreshPtSpent = 0;
  }
}

let talentManagerInstance: TalentManagerV2 | null = null;

/** 产物 `Ci` — 取玩家天赋管理器 */
export function getTalentManager(): TalentManagerV2 {
  return (talentManagerInstance ??= new TalentManagerV2());
}

/** 产物 `f0` — 重置玩家天赋管理器 */
export function resetTalentManager(): void {
  if (talentManagerInstance) talentManagerInstance.reset();
  talentManagerInstance = new TalentManagerV2();
}

// ─────────────────────────────────────────────────────────────
// 13. 星象 / 反伤 辅助（产物 `Rg` / `PS` / `CI` / `kw` / `Cue` 等）
// ─────────────────────────────────────────────────────────────

/** 星象轮回常量（产物 `og` / `hre`） */
export const XINGXIANG_FIRE = 0; // 产物 `og`（火象）
export const XINGXIANG_OTHER = 1; // 产物 `hre`

/** 产物 `Cue` — 梦话（睡眠时按最大 HP 1/8 扣血） */
export function applyBadDreamsTalentDamage(pokemon: any): void {
  const stacks = pokemon.isPlayer()
    ? getEnemyTalentManager().getStacks(TALENT_ID_BAD_DREAMS)
    : getPlayerTalentStacks(TALENT_ID_BAD_DREAMS);
  if (pokemon.status?.effect !== StatusEffect.SLEEP || pokemon.isFainted() || stacks <= 0) return;
  const damage = Math.max(1, Math.floor(pokemon.getMaxHp() / 8));
  pokemon.damageAndUpdate(damage, DamageResult.OTHER, false, false, true);
}

/** 产物 `Rg` — 是否拥有一见情缘天赋 */
declare function hasYijianQingyuanTalent(pokemon: any): boolean;
/** 产物 `PS` — 是否拥有星象天赋 */
declare function hasXingxiangTalent(pokemon: any): boolean;
/** 产物 `CI` — 取星象轮回类型 */
declare function getXingxiangCycle(pokemon: any): number;
/** 产物 `kw` — 星象轮回复中文标签 */
declare function getXingxiangCycleLabel(pokemon: any): string;
/** 产物 `Wh` — 火象威力加成应用 */
declare function applyXingxiangFireBonus(pokemon: any): void;
/** 产物 `nue` — 其他象特殊效果 */
declare function applyXingxiangOtherEffect(pokemon: any): void;
/** 产物 `I0` — 当前波次号 */
declare function currentWaveIndex(): number;

// ─────────────────────────────────────────────────────────────
// 14. 初始化（产物 `l0`，日志中文串逐字保留）
// ─────────────────────────────────────────────────────────────

/**
 * 产物 `l0` — 初始化天赋系统：注册全部天赋池。
 * 注：产物逐池注册并打印统计日志（中文串逐字保留）。
 */
export function initializeTalentSystem(): void {
  debugLog("talent", "[TalentSystem] 开始初始化天赋系统...");
  const registry = getTalentRegistry();
  const testCount = registry.registerTalents(getTestTalents());
  const hpCounterCount = registry.registerTalents(TALENT_POOL_HP_COUNTER);
  const statusCount = registry.registerTalents(TALENT_POOL_STATUS);
  const iceAgeCount = registry.registerTalents(TALENT_POOL_ICE_AGE);
  const stoneAgeCount = registry.registerTalents(TALENT_POOL_STONE_AGE);
  const industrialCount = registry.registerTalents(TALENT_POOL_INDUSTRIAL_AGE);
  const infoAgeCount = registry.registerTalents(TALENT_POOL_INFO_AGE);
  const totemCount = registry.registerTalents(TALENT_POOL_TOTEM_AGE);
  const tradeCount = registry.registerTalents(TALENT_POOL_TRADE);
  const romanceCount = registry.registerTalents(TALENT_POOL_ROMANCE);
  const total =
    getTestTalents().length +
    TALENT_POOL_HP_COUNTER.length +
    TALENT_POOL_STATUS.length +
    TALENT_POOL_ICE_AGE.length +
    TALENT_POOL_STONE_AGE.length +
    TALENT_POOL_INDUSTRIAL_AGE.length +
    TALENT_POOL_INFO_AGE.length +
    TALENT_POOL_TOTEM_AGE.length +
    TALENT_POOL_TRADE.length +
    TALENT_POOL_ROMANCE.length;
  const ok =
    testCount + hpCounterCount + statusCount + iceAgeCount + stoneAgeCount + industrialCount + infoAgeCount + totemCount + tradeCount + romanceCount;
  debugLog("talent", `[TalentSystem] 天赋系统初始化完成: 成功注册 ${ok}/${total} 个天赋`);
  debugLog("talent", `[TalentSystem] - 测试天赋: ${testCount}/${getTestTalents().length}`);
  debugLog("talent", `[TalentSystem] - 血量反伤消耗系天赋: ${hpCounterCount}/${TALENT_POOL_HP_COUNTER.length}`);
  debugLog("talent", `[TalentSystem] - 状态系天赋: ${statusCount}/${TALENT_POOL_STATUS.length}`);
  debugLog("talent", `[TalentSystem] - 冰河期天赋: ${iceAgeCount}/${TALENT_POOL_ICE_AGE.length}`);
  debugLog("talent", `[TalentSystem] - 石器时代天赋: ${stoneAgeCount}/${TALENT_POOL_STONE_AGE.length}`);
  debugLog("talent", `[TalentSystem] - 工业革命天赋: ${industrialCount}/${TALENT_POOL_INDUSTRIAL_AGE.length}`);
  debugLog("talent", `[TalentSystem] - 信息文明天赋: ${infoAgeCount}/${TALENT_POOL_INFO_AGE.length}`);
  debugLog("talent", `[TalentSystem] - 图腾崇拜天赋: ${totemCount}/${TALENT_POOL_TOTEM_AGE.length}`);
  debugLog("talent", `[TalentSystem] - 等价交换天赋: ${tradeCount}/${TALENT_POOL_TRADE.length}`);
  debugLog("talent", `[TalentSystem] - 情缘/星象系天赋: ${romanceCount}/${TALENT_POOL_ROMANCE.length}`);
  if (ok < total) {
    console.warn(`[TalentSystem] 警告: ${total - ok} 个天赋注册失败`);
  }
}

// ─────────────────────────────────────────────────────────────
// 15. 天赋释放 Modifier（产物 `Mh` / `Q6`）
// ─────────────────────────────────────────────────────────────

/** 产物 `Q6` — 天赋释放 ModifierType（继承上游 ModifierType） */
export class TalentReleaseModifierType {
  constructor(
    public readonly id: string,
    public readonly icon: string,
  ) {}
}

/** 产物 `Mh` — 天赋释放 Modifier（展示释放天赋的叠加层数图标） */
export class TalentReleaseModifier {
  constructor(
    public readonly pokemonId: number,
    public readonly stackCount: number = 1,
  ) {}

  matchType(other: TalentReleaseModifier): boolean {
    return other instanceof TalentReleaseModifier;
  }

  clone(): TalentReleaseModifier {
    return new TalentReleaseModifier(this.pokemonId, this.stackCount);
  }

  apply(_pokemon: any): boolean {
    return true;
  }

  /** 产物 `getIconStackText` — 生成叠加层数文字（猛火/BUG燕 层数） */
  getIconStackText(virtualStackCount: boolean): any | null {
    if (virtualStackCount === false && !virtualStackCount) return null;
    const pokemon = globalScene.getPokemonById(this.pokemonId);
    if (!pokemon) return null;
    const count = getTalentReleaseDisplayStackCount(pokemon);
    if (count === null) return null;
    const text = globalScene.add.bitmapText(10, 15, "item-count", count.toString(), 11);
    text.letterSpacing = -0.5;
    if (count > 0) text.setTint(16291984);
    text.setOrigin(0, 0);
    return text;
  }

  getMaxHeldItemCount(): number {
    return 1;
  }
}

// ─────────────────────────────────────────────────────────────
// 16. 效果触发点日志（产物在**调用点**内联的中文日志；集中登记以保证锚点闭合）
// ---------------------------------------------------------------------------
// 产物把下列日志内联在伤害管线 / 天赋商店 / 存档集成等调用点。迁移时统一登记于此，
// 由各调用点在「接入锚点」阶段引用（避免字符串散落且便于 A4 逐条核对）。
// ─────────────────────────────────────────────────────────────

/** 效果触发点日志（产物内联位置见注释） */
export const TALENT_TRIGGER_LOGS = {
  /** 喵喵聚宝功（`Pokemon.damage` 调用点） */
  meowthPayDay: (name: string, damage: number) => `[喵喵聚宝功] 检查触发 - 宝可梦: ${name}, 伤害: ${damage}`,
  /** 嗜血狂暴（`Pokemon.damage` 调用点） */
  bloodRage: (name: string) => `[嗜血狂暴] 检查触发 - 宝可梦: ${name}`,
  /** 荆棘之甲基础反伤 */
  thornArmorBase: (percent: number, stacks: number) => `[荆棘之甲] 基础反伤: ${percent}% (${stacks}层 × 20%)`,
  /** 荆棘之甲 + 濒死反击 */
  thornArmorDeathDefy: (hpPercent: string) => `[荆棘之甲] 拥有濒死反击天赋，HP百分比: ${hpPercent}%`,
  /** 濒死反击 */
  deathDefy: (name: string) => `[濒死反击] 检查必定暴击 - 宝可梦: ${name}`,
  /** 金钱攻势 */
  moneyOffensive: (name: string) => `[金钱攻势] 检查加成 - 宝可梦: ${name}`,
  /** 同归于尽（`Pokemon.damage` 调用点） */
  sameDestinyCheck: (name: string) => `[Pokemon.damage] ${name} 是玩家宝可梦，检查同归于尽天赋`,
  /** 未拥有天赋（各天赋检查失败） */
  notOwned: (tag: string) => `[${tag}] ✗ 未拥有天赋`,
  /** 天赋检查失败 */
  checkFailed: (tag: string) => `[${tag}] 天赋检查失败:`,
  /** 天赋加成应用失败 */
  boostApplyFailed: "[天赋加成] 应用失败:",
  /** 守门员 HUD 天赋显示失败 */
  guardianHudFailed: "[守门员HUD] 天赋显示失败:",
  /** 保存/恢复天赋系统数据失败 */
  saveFailed: "❌ 保存天赋系统数据失败:",
  restoreFailed: "恢复天赋系统数据失败:",
  /** 刷新天赋运行时 HUD 失败 */
  hudRefreshFailed: "❌ 刷新天赋运行时HUD失败:",
  /** 天赋池生成 */
  poolUltimateAdded: (count: number) => `[天赋池生成] 已添加 ${count} 个终极天赋`,
  poolNoUltimate: (wave: number) => `[天赋池生成] 第${wave}波没有可用的终极天赋，后续将补其他品种！`,
  poolAddUltimate: (name: string, id: string) => `[天赋池生成] 添加终极天赋: ${name} (${id})`,
  poolSpecialWave: (wave: number, max: number) => `[天赋池生成] 第${wave}波 - 触发特殊波次机制，优先刷满最多${max}个终极天赋`,
  /** TalentManager 效果激活 */
  superBackpackActive: "[TalentManager] 超级背包已激活",
  agricultureActive: (count: number) => `[TalentManager] 农业大咖已激活，获得${count}个树果袋`,
  moreDecisionsActive: (count: number) => `[TalentManager] 更多决策已激活，获得${count}个黄金精灵球`,
  expBoyActive: (count: number) => `[TalentManager] 经验小子已激活，获得${count}个经验护符`,
  thickClubCollectorActive: (name: string) => `[TalentManager] 骨头收集者已激活，给${name}获得2根粗骨头（可叠加）`,
  /** 天赋效果触发（各系统调用点，如 MEW/HEALER 等） */
  effectTriggers: {
    triplePassive: (name: string) => `${name} 觉醒了三被动能力！`,
  },
  /** 存档集成（BattleScene / RunInfoUI / SelectStarterPhase / TitlePhase） */
  sceneReset: "[BattleScene.reset] 已重置天赋系统和超级背包管理器",
  sceneResetFailed: "[BattleScene.reset] 重置天赋系统失败:",
  sceneInitFailed: "[BattleScene] 天赋系统初始化失败:",
  sceneInitialized: "[BattleScene] 天赋系统已初始化",
  starterPhaseReset: "[SelectStarterPhase] 已重置天赋系统和超级背包管理器",
  dailyRunReset: "[TitlePhase.initDailyRun] 已重置天赋系统和超级背包管理器",
} as const;

// ─────────────────────────────────────────────────────────────
// TODO(接入锚点 90df65097b6d)：本文件依赖清单
// ─────────────────────────────────────────────────────────────
// TODO(接入锚点): globalScene → #app/global-scene
// TODO(接入锚点): Stat / PokemonType / MoveCategory / StatusEffect / DamageResult / SpeciesId → #enums/*
// TODO(接入锚点): es（i18n 取值）/ i18next → 上游 i18n 模块
// TODO(接入锚点): pe（随机）/ poolWeightModifiers（池权重）/ onTalentAcquired（获取钩子）
//                 → 上游工具；`TALENT_RELEASE_ITEM_ID` / `TALENT_ID_*` → 上游常量
// TODO(接入锚点): TalentReleaseModifier 应继承上游 `Modifier`；TalentReleaseModifierType 应继承
//                 `ModifierType`（产物 `Mh extends It` / `Q6 extends jt`）
// TODO(接入锚点): 星象/反伤辅助（`Rg`/`PS`/`CI`/`kw`/`Wh`/`nue`/`I0`）→ 对应系统模块
// TODO(接入锚点): 把 initializeTalentSystem / registerTalentRelease* 挂到存档/开场初始化点
// TODO(A4-验证): 时代天赋（冰河期/石器/工业/信息/图腾）的守护者触发 AOE + 永久属性提升分支
// TODO(A4-验证): `acquireTalent` 的 HP 比例还原公式（产物 `Math.min(Math.floor(newMaxHp*ratio), newMaxHp)`）
// TODO(语义待确认): `getTalentReleaseDisplayStackCount` 中猛火/BUG燕 的 customPokemonData 字段名

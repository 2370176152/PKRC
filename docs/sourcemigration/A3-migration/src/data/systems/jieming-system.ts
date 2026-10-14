/**
 * 解明（JIEMING）—— 自研系统迁移（框架收敛版）
 * ---------------------------------------------------------------------------
 * 来源：game/server/dist/assets/loading-scene-By2k7Qfx.js（.orig 产物）
 *       @1890918（模块注册表）/ @1924473（框架主区）/ @2155536（结算阶段）
 * 逆向方式：`l(短名,"原函数名")` 反查 + 常量赋值精确定位（见 A3-迁移规范 §3）
 * 锚点树：90df65097b6df76f713e6bd108afa84499e8b993
 *
 * 定位：解明系统的**公共框架**（原 A3-05 曾把这段设施临时寄放在 `manaphy-system.ts`，
 *       本任务（A3-07）收敛回此文件，符合命名规则「系统文件 = 系统职责」）。
 *       解明是「多角色共享一套招式/冷却/计数/共享加成」的体系：
 *         · 归属物种（花名册）= MANAPHY / PHIONE / MELOETTA / MEW（产物 `GO`）；
 *         · 每个物种经 `registerJiemingModule` 注册自己的招式表 / 冷却算法 / 计数栏；
 *         · 缺省（未注册，如 MANAPHY群）走**内建模块**（产物 `wm`，3 个海之守护招式）
 *           与内建冷却缩减规则；
 *         · 招式结算由 `JiemingResolvePhase` 统一驱动（动画 chunk 动态加载）。
 *
 * 架构（单向依赖，无环）：
 *   manaphy-system.ts ──▶ jieming-system.ts ──▶ constellation-framework.ts
 *                         └(动态 import)──────▶ jieming-anims.ts
 *   meloetta-system.ts / mew-system.ts ──▶ jieming-system.ts（仅 `registerJiemingModule`）
 *   healer-system.ts ──▶ jieming-system.ts（`JiemingResolvePhase` / `findJiemingSkill` …）
 *
 * 产物符号对照（去混淆映射，务必逐条保留）：
 *   Hw   → JIEMING_MODULE_ROOT        （"jieming"，模块根键）
 *   DEe  → JIEMING_MODULE_REGISTRY    （模块注册表 Map<rootSpeciesId, module>）
 *   fEe  → registerJiemingModule
 *   tg   → getJiemingModuleFor
 *   Kl   → jiemingNodeActive
 *   wTe  → isSeaGuardSpecies
 *   ire  → isJiemingSpecies
 *   br   → isJiemingRoot
 *   oLe  → isJiemingRosterSpeciesId
 *   iN   → hasJiemingConstellation
 *   rLe  → isJiemingEligible
 *   DE   → getJiemingPokemon
 *   yTe  → playerField
 *   sL   → getJiemingTargets
 *   aLe  → getJiemingCounterFor
 *   tL   → getJiemingSkillsFor
 *   ELe  → getActiveJiemingSkills
 *   nre  → findJiemingSkill
 *   Are  → effectiveCooldown
 *   DU   → skillCooldownRemaining
 *   ag   → isSkillReady
 *   hse  → getJiemingButtonState
 *   Eg   → getUserCooldowns
 *   RLe  → markSkillUsed
 *   OLe  → armJiemingCooldowns
 *   are  → tickJiemingCooldownsByAllyAction
 *   tLe  → consumeShieldBreakBonuses
 *   lLe  → buildJiemingShareBonus
 *   SLe  → applyJiemingShare
 *   TLe  → refreshJiemingShare
 *   f2/oB→ JiemingResolvePhase
 *   yhe  → registerSquadJiemingCooldownProvider
 *   Fhe  → currentJiemingCooldown
 *   GR   → vite preload helper（`__vite__mapDeps` 包装，迁移时省略）
 *
 *   常量：
 *   QEe  → JIEMING_NODE.CODEX          (=1)
 *   JEe  → JIEMING_NODE.SEA_GUARD      (=1)
 *   jEe  → JIEMING_NODE.PUPPETEER      (=2)
 *   zEe  → JIEMING_NODE.LIGHTING       (=3)
 *   qEe  → JIEMING_NODE.COMPOSURE      (=4)
 *   ere  → JIEMING_NODE.CHASE          (=5)
 *   vw   → JIEMING_NODE.NO_CURTAIN     (=6)
 *   ww   → JIEMING_SEA_GUARD_SPECIES   ([MANAPHY, PHIONE])
 *   GO   → JIEMING_ROSTER              ([...ww, MELOETTA, MEW])
 *   pTe  → JIEMING_MODULE_NAME         (speciesId → 模组中文名)
 *   bw   → JIEMING_SHIELD_TAG          ("jieming:shield")
 *   eLe  → SHIELD_EXPIRE_LAYER_COST    (=2)
 *   Ere  → JIEMING_SHARE_RATIO         (=0.15)
 *   Ir   → JIEMING_SHARE_STATS         ([0,1,2,3,4,5])
 *   Cse  → EMPTY_JUEMING_SHARE         (空共享加成)
 *   iLe  → BUILTIN_PUPPETEER_CD_REDUCE (=2)
 *   nLe  → BUILTIN_COMPOSURE_CD_REDUCE (=3)
 *   Ym   → JIEMING_BUILTIN_SKILL_ID.SOOTHING_SONG ("soothing-song")
 *   vm   → JIEMING_BUILTIN_SKILL_ID.DAWN_BUBBLE   ("dawn-bubble")
 */
import {
  getConstellations,
  constellationNodeIsExclusive,
} from "./constellation-framework";

// ─────────────────────────────────────────────────────────────
// 0. 依赖（上游 API，待接入锚点源码时改为真实 import）
// ─────────────────────────────────────────────────────────────
declare const globalScene: any; // 产物 `E`
declare const gameData: any; // 产物 `E.gameData`
declare const Stat: any; // 产物 `p`（Stat enum）
declare const Phase: any; // 产物 `DA`（Phase 基类）
declare const debugLog: (type: string, msg: string) => void; // 产物 `z`

// ─────────────────────────────────────────────────────────────
// 1. 常量（还原自产物 `Hw` / `QEe..vw` / `bw` / `Ere` / `Ir`）
// ─────────────────────────────────────────────────────────────

/** 解明模块根键（产物 `Hw`） */
export const JIEMING_MODULE_ROOT = "jieming";

/** 解明命座节点索引（产物 `QEe..vw`） */
export const JIEMING_NODE = {
  /** 解明资格节点（产物 `QEe`）—— 判定「是否具备解明命座」的门槛 */
  CODEX: 1,
  /** 海之守护（产物 `JEe`，与 CODEX 同值） */
  SEA_GUARD: 1,
  /** 提线之人（产物 `jEe`）—— 缩减非「黎明的泡沫」技能冷却 */
  PUPPETEER: 2,
  /** 打光（产物 `zEe`） */
  LIGHTING: 3,
  /** 从容（产物 `qEe`）—— 缩减「黎明的泡沫」冷却 */
  COMPOSURE: 4,
  /** 追光（产物 `ere`） */
  CHASE: 5,
  /** 永不谢幕（产物 `vw`） */
  NO_CURTAIN: 6,
} as const;

/** 内建冷却缩减（未注册模块时生效；产物 `iLe` / `nLe`） */
export const BUILTIN_PUPPETEER_CD_REDUCE = 2; // 产物 `iLe`
export const BUILTIN_COMPOSURE_CD_REDUCE = 3; // 产物 `nLe`

/** 内建解明招式 id（产物 `Ym` / `ALe` / `vm`）—— 缺省模块（海之守护三招）的键 */
export const JIEMING_BUILTIN_SKILL_ID = {
  SOOTHING_SONG: "soothing-song", // 产物 `Ym`
  INTERSECTING_DANCE: "intersecting-dance", // 产物 `ALe`
  DAWN_BUBBLE: "dawn-bubble", // 产物 `vm`
} as const;

/** 解明护盾效果 tag（产物 `bw`） */
export const JIEMING_SHIELD_TAG = "jieming:shield";
/** 护盾过期时按【海之守护】层数返还的消耗量（产物 `eLe`） */
export const SHIELD_EXPIRE_LAYER_COST = 2;

/** 解明「共享加成」比例：按最高单项能力 ×15% 全队分享（产物 `Ere`） */
export const JIEMING_SHARE_RATIO = 0.15;
/** 共享加成参与的能力项（产物 `Ir` = [0,1,2,3,4,5]） */
export const JIEMING_SHARE_STATS: readonly number[] = [
  Stat.HP,
  Stat.ATK,
  Stat.DEF,
  Stat.SPATK,
  Stat.SPDEF,
  Stat.SPD,
];
/** 空共享加成（产物 `Cse`） */
export const EMPTY_JUEMING_SHARE: Record<number, number> = {};

// ─────────────────────────────────────────────────────────────
// 2. 花名册（产物 `ww` / `GO` / `pTe`）
// ─────────────────────────────────────────────────────────────

/** 【海之守护】体系物种（产物 `ww`） */
export const JIEMING_SEA_GUARD_SPECIES: readonly number[] = [
  SpeciesId.MANAPHY, // 产物 `e.MANAPHY`
  SpeciesId.PHIONE, // 产物 `e.PHIONE`
];

/** 解明体系全量花名册（产物 `GO`）—— 缺省模块认领「可上场解明」的身份来源 */
export const JIEMING_ROSTER: readonly number[] = [
  ...JIEMING_SEA_GUARD_SPECIES,
  SpeciesId.MELOETTA, // 产物 `e.MELOETTA`
  SpeciesId.MEW, // 产物 `e.MEW`
];

/** 解明模组中文名（产物 `pTe`，用于 UI 展示） */
export const JIEMING_MODULE_NAME: ReadonlyMap<number, string> = new Map([
  [SpeciesId.MANAPHY, "佐原海夕模组"],
  [SpeciesId.PHIONE, "佐原海夕模组"],
  [SpeciesId.MELOETTA, "美洛耶塔·旋律模组"],
  [SpeciesId.MEW, "梦幻·属性编织模组"],
]);

// ─────────────────────────────────────────────────────────────
// 3. 模块注册表（产物 `DEe` / `fEe` / `tg`）
// ─────────────────────────────────────────────────────────────

/** 解明招式（各系统注册；`apply` 为结算时的实际效果） */
export interface JiemingSkill {
  id: string;
  name: string;
  cooldown: number;
  description: string;
  /** 需要指定友方目标（否则默认全体） */
  needsAllyTarget?: boolean;
  /** 需要指定敌方目标 */
  needsEnemyTarget?: boolean;
  /** 结算效果：`user` 施放者，`targets` 目标数组 */
  apply(user: any, targets: any[]): void;
}

/** 计数栏读取结果 */
export interface JiemingCounterReadout {
  value: number;
  max: number;
}

/** 解明模块（产物 `fEe({rootSpeciesId, skills, cooldown, counter})`） */
export interface JiemingModule {
  /** 归属种族（root species id） */
  rootSpeciesId: number;
  /** 该角色的解明招式表 */
  skills: JiemingSkill[];
  /** 有效冷却算法（接收**招式对象**，返回冷却回合数） */
  cooldown(pokemon: any, skill: JiemingSkill): number;
  /** 计数栏（如「节拍」「属性编织」「海之守护」） */
  counter?: {
    label: string;
    read(pokemon: any): JiemingCounterReadout;
  };
}

/** 模块注册表（产物 `DEe`） */
const JIEMING_MODULE_REGISTRY = new Map<number, JiemingModule>();

/** 注册解明模块（产物 `fEe` "registerJiemingModule"） */
export function registerJiemingModule(module: JiemingModule): void {
  JIEMING_MODULE_REGISTRY.set(module.rootSpeciesId, module);
}

/** 按 root species 查模块（产物 `tg` "getJiemingModuleFor"） */
export function getJiemingModuleFor(rootSpeciesId: number | undefined): JiemingModule | undefined {
  return rootSpeciesId === undefined ? undefined : JIEMING_MODULE_REGISTRY.get(rootSpeciesId);
}

/**
 * 内建（缺省）招式提供者 —— 产物中 `tL` 的兜底值是 `wm`（海之守护三招）。
 * 为避免 `jieming ↔ manaphy` 循环依赖，此处以**提供者钩子**注入；
 * `manaphy-system.ts` 初始化时调用 `setDefaultJiemingSkills(() => JIEMING_SKILLS)`。
 */
let defaultSkillsProvider: () => JiemingSkill[] = () => [];

/** 设置内建解明招式（由 MANAPHY 系统在初始化时调用；产物 `wm` 的等价物） */
export function setDefaultJiemingSkills(provider: () => JiemingSkill[]): void {
  defaultSkillsProvider = provider;
}

// ─────────────────────────────────────────────────────────────
// 4. 归属与资格判定（产物 `wTe` / `ire` / `br` / `oLe` / `Kl` / `iN` / `rLe`）
// ─────────────────────────────────────────────────────────────

/** 是否为【海之守护】体系物种（产物 `wTe`） */
export function isSeaGuardSpecies(speciesId: number | undefined): boolean {
  return speciesId !== undefined && JIEMING_SEA_GUARD_SPECIES.includes(speciesId);
}

/** 是否为任意解明体系物种（产物 `ire`） */
export function isJiemingSpecies(speciesId: number | undefined): boolean {
  return speciesId !== undefined && JIEMING_ROSTER.includes(speciesId);
}

/** 是否为解明根物种（产物 `br`，与 `ire` 同表） */
export function isJiemingRoot(speciesId: number | undefined): boolean {
  return speciesId !== undefined && JIEMING_ROSTER.includes(speciesId);
}

/** 是否为解明花名册物种（产物 `oLe`，按 `pTe` 的键） */
export function isJiemingRosterSpeciesId(speciesId: number | undefined): boolean {
  return speciesId !== undefined && JIEMING_MODULE_NAME.has(speciesId);
}

/** 判定某命座节点是否已激活且为专属（产物 `Kl`）|
 *  注：产物 `Kl` 以 `wTe`（【海之守护】物种）为门槛，因此 MELOETTA / MEW 各用自己的
 *      `meloettaNodeActive` / `mewNodeActive`（不共用此函数）。 */
export function jiemingNodeActive(pokemon: any, node: number): boolean {
  const rootSpecies = pokemon.species.getRootSpeciesId();
  if (!isSeaGuardSpecies(rootSpecies)) return false;
  const data = gameData?.ptSoudacheData;
  if (constellationLevel(data, rootSpecies) < node) return false;
  return constellationNodeIsExclusive(rootSpecies, node, data);
}

/**
 * 是否具备【解明】命座（1 命 + codex 含解明根条目）（产物 `iN`）。
 * 注：判定依据 `codex.some(entry => entry.id?.startsWith("jieming"))`，
 *     这正是 MANAPHY群 / MELOETTA / MEW 三个系统 codex 首条携带 `id: "jieming"` 的原因
 *     （规范勘误 E1）。
 */
export function hasJiemingConstellation(pokemon: any): boolean {
  const rootSpecies = pokemon.species?.getRootSpeciesId();
  if (rootSpecies === undefined || !isJiemingSpecies(rootSpecies)) return false;
  const codex = getConstellations(rootSpecies);
  if (!codex?.length) return false;
  if (!codex.some((entry) => entry.id?.startsWith(JIEMING_MODULE_ROOT))) return false;
  return constellationNodeIsExclusive(rootSpecies, JIEMING_NODE.CODEX, gameData?.ptSoudacheData);
}

/** 是否为「可上场的解明资格单位」（产物 `rLe`）—— 需求：未上场 + 有解明命座 */
export function isJiemingEligible(pokemon: any): boolean {
  if (!pokemon || pokemon.isOnField()) return false;
  return hasJiemingConstellation(pokemon);
}

// ─────────────────────────────────────────────────────────────
// 5. 单位与目标（产物 `DE` / `yTe` / `sL`）
// ─────────────────────────────────────────────────────────────

/** 我方场上存活单位（产物 `yTe` "playerField"） */
export function playerField(): any[] {
  return globalScene.getField().filter((p: any) => !!p && p.isPlayer() && p.isActive() && !p.isFainted());
}

/** 解明招式默认目标（产物 `sL` "getJiemingTargets"） */
export function getJiemingTargets(): any[] {
  return playerField();
}

/** 队伍中的解明主控单位（产物 `DE` "getJiemingPokemon"） */
export function getJiemingPokemon(): any {
  return globalScene.getPlayerParty().find((p: any) => isJiemingEligible(p));
}

// ─────────────────────────────────────────────────────────────
// 6. 招式 / 冷却（产物 `aLe` / `tL` / `ELe` / `nre` / `Are` / `DU` / `ag`
//                    / `Eg` / `RLe` / `OLe` / `are` / `hse` / `tLe`）
// ─────────────────────────────────────────────────────────────

/** 读取当前解明主控的计数栏（产物 `aLe`） */
export function getJiemingCounterFor(pokemon: any): JiemingModule["counter"] {
  return getJiemingModuleFor(pokemon?.species?.getRootSpeciesId())?.counter;
}

/** 取某单位的解明招式表（模块优先，否则内建）（产物 `tL`） */
export function getJiemingSkillsFor(pokemon: any): JiemingSkill[] {
  return getJiemingModuleFor(pokemon?.species?.getRootSpeciesId())?.skills ?? defaultSkillsProvider();
}

/** 当前激活的解明招式表（产物 `ELe`） */
export function getActiveJiemingSkills(): JiemingSkill[] {
  return getJiemingSkillsFor(getJiemingPokemon());
}

/** 按 id 查解明招式（产物 `nre` "findJiemingSkill"） */
export function findJiemingSkill(skillId: string): JiemingSkill | undefined {
  return getActiveJiemingSkills().find((skill) => skill.id === skillId);
}

/**
 * 解明招式有效冷却（产物 `Are`）：
 * 模块优先；缺省则按内建规则（提线之人 / 从容）缩减。
 */
export function effectiveCooldown(pokemon: any, skill: JiemingSkill): number {
  const module_ = getJiemingModuleFor(pokemon.species?.getRootSpeciesId());
  if (module_) return Math.max(1, module_.cooldown(pokemon, skill));
  let cooldown = skill.cooldown;
  if (skill.id !== JIEMING_BUILTIN_SKILL_ID.DAWN_BUBBLE && jiemingNodeActive(pokemon, JIEMING_NODE.PUPPETEER)) {
    cooldown -= BUILTIN_PUPPETEER_CD_REDUCE;
  }
  if (skill.id === JIEMING_BUILTIN_SKILL_ID.DAWN_BUBBLE && jiemingNodeActive(pokemon, JIEMING_NODE.COMPOSURE)) {
    cooldown -= BUILTIN_COMPOSURE_CD_REDUCE;
  }
  return Math.max(1, cooldown);
}

/** 读取（并惰性初始化）单位的冷却表（产物 `Eg`） */
export function getUserCooldowns(pokemon: any): Record<string, number> {
  const data = pokemon.customPokemonData;
  return (data.jiemingCooldowns ??= {});
}

/** 剩余冷却（产物 `DU`） */
export function skillCooldownRemaining(pokemon: any, skill: JiemingSkill): number {
  return Math.max(0, getUserCooldowns(pokemon)[skill.id] ?? 0);
}

/** 技能是否就绪（产物 `ag`） */
export function isSkillReady(pokemon: any, skill: JiemingSkill): boolean {
  return skillCooldownRemaining(pokemon, skill) <= 0;
}

/** 标记技能已用（产物 `RLe`） */
export function markSkillUsed(pokemon: any, skill: JiemingSkill): void {
  getUserCooldowns(pokemon)[skill.id] = effectiveCooldown(pokemon, skill);
}

/** 布防：开局把所有解明技冷却置满（产物 `OLe`） */
export function armJiemingCooldowns(): void {
  const pokemon = getJiemingPokemon();
  if (!pokemon) return;
  const cooldowns = getUserCooldowns(pokemon);
  for (const skill of getJiemingSkillsFor(pokemon)) cooldowns[skill.id] = effectiveCooldown(pokemon, skill);
}

/** 结算护盾破碎奖励层数（产物 `tLe`）—— 遍历队伍，逐个消费 `jiemingShieldBroken` */
export function consumeShieldBreakBonuses(party: any[]): number {
  let count = 0;
  for (const pokemon of party) {
    if (pokemon?.jiemingShieldBroken) {
      pokemon.jiemingShieldBroken = false;
      count++;
    }
  }
  return count;
}

/** 每次我方行动递减冷却（产物 `are`）；护盾破碎额外减少「精神补充」冷却 */
export function tickJiemingCooldownsByAllyAction(): void {
  const pokemon = getJiemingPokemon();
  if (!pokemon) return;
  const cooldowns = getUserCooldowns(pokemon);
  for (const key of Object.keys(cooldowns)) {
    if (cooldowns[key] > 0) cooldowns[key] -= 1;
  }
  const bonus = consumeShieldBreakBonuses(globalScene.getPlayerParty());
  if (bonus > 0) {
    cooldowns[JIEMING_BUILTIN_SKILL_ID.SOOTHING_SONG] = Math.max(
      0,
      (cooldowns[JIEMING_BUILTIN_SKILL_ID.SOOTHING_SONG] ?? 0) - bonus,
    );
  }
}

/** 解明指令按钮状态（产物 `hse`） */
export function getJiemingButtonState(): { visible: boolean; ready: boolean } {
  const pokemon = getJiemingPokemon();
  if (!pokemon) return { visible: false, ready: false };
  return { visible: true, ready: getJiemingSkillsFor(pokemon).some((s) => isSkillReady(pokemon, s)) };
}

// ─────────────────────────────────────────────────────────────
// 7. 共享加成（产物 `lLe` / `SLe` / `TLe`）
// ─────────────────────────────────────────────────────────────

/** 构造解明共享加成：按最高单项能力 ×15%（产物 `lLe`） */
export function buildJiemingShareBonus(pokemon: any): Record<number, number> {
  const out: Record<number, number> = {};
  for (const stat of JIEMING_SHARE_STATS) {
    const amount = Math.floor(pokemon.getStat(stat) * JIEMING_SHARE_RATIO);
    if (amount > 0) out[stat] = amount;
  }
  return out;
}

/** 应用共享加成（会按最大 HP 变化等比还原当前 HP）（产物 `SLe`） */
export function applyJiemingShare(target: any, bonus: Record<number, number>): void {
  const beforeMaxHp = target.getMaxHp();
  target.jiemingShareBonus = Object.keys(bonus).length ? { ...bonus } : [];
  target.jiemingShareRatio = Object.keys(bonus).length > 0 ? JIEMING_SHARE_RATIO : 0;
  const afterMaxHp = target.getMaxHp();
  if (afterMaxHp !== beforeMaxHp && beforeMaxHp > 0 && target.hp > 0) {
    target.hp = Math.min(afterMaxHp, Math.max(1, Math.round((target.hp * afterMaxHp) / beforeMaxHp)));
  }
  if (afterMaxHp !== beforeMaxHp) target.updateInfo();
}

/** 刷新全场解明共享（仅 P5X 模式）（产物 `TLe`） */
export function refreshJiemingShare(): void {
  if (!globalScene?.gameMode?.isP5X) return;
  const jieming = getJiemingPokemon();
  const bonus = jieming ? buildJiemingShareBonus(jieming) : EMPTY_JUEMING_SHARE;
  for (const pokemon of globalScene.getField()) {
    if (pokemon) {
      applyJiemingShare(pokemon, pokemon === jieming || !pokemon.isPlayer() ? EMPTY_JUEMING_SHARE : bonus);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 8. 技能结算阶段（产物 `f2` / `oB`）
// ─────────────────────────────────────────────────────────────

/** 产物 `GR` 的等价物：动态加载解明动画 chunk（vite `__vite__mapDeps` 由打包器生成）。 */
export function loadJiemingAnims(): Promise<{ playJiemingSkillAnim: (user: any, skill: any, targets: any[]) => Promise<void> | void }> {
  return import("./jieming-anims.js");
}

/**
 * 解明技能统一结算阶段（产物 `f2`/`oB` "JiemingResolvePhase"）。
 * 流程：校验就绪 → 标记已用 → 解析目标 → 播放动画（失败降级）→ 应用效果 → 显示文本。
 */
export class JiemingResolvePhase {
  constructor(
    private readonly skillId: string,
    private readonly targetIndex?: number,
  ) {}

  start(): Promise<void> {
    const jieming = getJiemingPokemon();
    const skill = findJiemingSkill(this.skillId);
    if (!jieming || !skill || !isSkillReady(jieming, skill)) return Promise.resolve();
    markSkillUsed(jieming, skill);
    const targets = this.resolveTargets(jieming, skill);
    return Promise.resolve()
      .then(() => loadJiemingAnims())
      .then((mod) => mod.playJiemingSkillAnim(jieming, skill, targets))
      .catch((err: any) => {
        // 产物：`console.warn("[解明] 动画播放异常，跳过动画直接结算", err)`
        console.warn("[解明] 动画播放异常，跳过动画直接结算", err);
      })
      .then(() => {
        skill.apply(jieming, targets);
        globalScene.ui.showText(`${jieming.name} 的解明技「${skill.name}」发动！`, null, () => undefined);
      });
  }

  /** 解析目标（产物 `f2.resolveTargets`） */
  resolveTargets(jieming: any, skill: JiemingSkill): any[] {
    const allies = getJiemingTargets();
    if (skill.needsEnemyTarget) {
      if (this.targetIndex === undefined) return [];
      const target = globalScene.getField()[this.targetIndex];
      return target && !target.isPlayer() && target.isActive(true) ? [target] : [];
    }
    if (!skill.needsAllyTarget || this.targetIndex === undefined) return allies;
    const target = globalScene.getField()[this.targetIndex];
    return target && allies.includes(target) ? [target] : allies;
  }
}

// ─────────────────────────────────────────────────────────────
// 9. 小队解明冷却提供者（产物 `yhe` / `Fhe`）
// ─────────────────────────────────────────────────────────────

/** 产物 `yM` — 小队冷却提供者（运行期注入） */
let squadCooldownProvider: (() => any) | null = null;

/** 注册小队解明冷却提供者（产物 `yhe`） */
export function registerSquadJiemingCooldownProvider(provider: () => any): void {
  squadCooldownProvider = provider;
}

/** 读取当前小队解明冷却（产物 `Fhe`，异常时返回 undefined） */
export function currentJiemingCooldown(): any {
  try {
    return squadCooldownProvider?.() ?? undefined;
  } catch {
    return undefined;
  }
}

// ─────────────────────────────────────────────────────────────
// 需要未接入的枚举（占位；接入锚点后改由 `#enums/species-id` 提供）
// ─────────────────────────────────────────────────────────────
declare const SpeciesId: any; // 产物 `e`
/** 命座等级读取（公共底座 `sa`） */
declare function constellationLevel(data: any, speciesId: number): number; // 产物 `sa`

// ─────────────────────────────────────────────────────────────
// TODO(接入锚点 90df65097b6d)：本文件依赖清单
// ─────────────────────────────────────────────────────────────
// TODO(接入锚点): globalScene / gameData → #app/global-scene
// TODO(接入锚点): Stat / SpeciesId → #enums/stat、#enums/species-id
// TODO(接入锚点): Phase（产物 `DA`）→ #phases/phase
// TODO(接入锚点): constellationLevel / constellationNodeIsExclusive / getConstellations
//                 → constellation-framework.ts（A3-01）；`sa` 应改为该文件的导出
// TODO(接入锚点): 把 registerJiemingModule 的调用点（MELOETTA / MEW）与
//                 setDefaultJiemingSkills（MANAPHY）挂到系统初始化点
// TODO(接入锚点): 动画 chunk `jieming-anims.ts` 占位 → A3-13 用真实实现替换
// TODO(A4-验证): `effectiveCooldown` 的内建回退分支（提线之人 / 从容）与产品一致性
// TODO(A4-验证): `refreshJiemingShare` 仅 P5X 模式生效
// TODO(A4-验证): `JiemingResolvePhase.start` 的动画降级路径（catch → 直接结算）

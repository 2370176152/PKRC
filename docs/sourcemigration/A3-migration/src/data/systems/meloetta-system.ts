/**
 * 旋律觉醒（MELOETTA）—— 自研系统迁移
 * ---------------------------------------------------------------------------
 * 来源：game/server/dist/assets/loading-scene-By2k7Qfx.js（.orig 产物）@1912094 起
 * 逆向方式：`l(短名,"原函数名")` 反查 + 常量赋值精确定位（见 A3-迁移规范 §3）
 * 锚点树：90df65097b6df76f713e6bd108afa84499e8b993
 *
 * 定位：命座接入组 7 系统之一（A3-05）。物种 = 美洛耶塔（`ZSe=[MELOETTA]`）。
 *       点亮 1 命后成为【解明】角色，解锁三个解明招式「音律」「旋律」「悦动」，
 *       以【节拍】计数驱动冷却与效果。经公共底座 `registerConstellation` 注册 6 个
 *       命座节点；解明招式经 `registerJiemingModule`（产物 `fEe`）挂入 JIEMING 框架；
 *       状态徽标经 `registerP5XStatusProvider`（产物 `E0`）；标签清理经
 *       `registerP5XEffectExpireHandler`（产物 `Nw`）。
 *
 * 产物符号对照（去混淆映射，务必逐条保留）：
 *   hI   → registerConstellation          （公共底座）
 *   sa   → constellationLevel$1           （公共底座）
 *   US   → constellationNodeIsExclusive   （公共底座）
 *   HM   → getConstellations              （公共底座）
 *   fEe  → registerJiemingModule          （解明框架：注册角色招式表 + 冷却 + 计数）
 *   E0   → registerP5XStatusProvider      （P5X：注册状态徽标 provider）
 *   Nw   → registerP5XEffectExpireHandler （P5X：注册效果过期回调）
 *   z    → debugLog
 *   E    → globalScene
 *   M    → i18n（列于招式的 name 用中文，无 i18n）
 *
 *   常量：
 *   mw   → MELOETTA_NODE.AWAKENING      (=1)
 *   PEe  → MELOETTA_NODE.ALLEGRO        (=2)
 *   _Ee  → MELOETTA_NODE.HARMONY        (=3)
 *   GEe  → MELOETTA_NODE.CRESCENDO      (=4)
 *   gEe  → MELOETTA_NODE.FINALE         (=5)
 *   Bw   → MELOETTA_NODE.ECHO           (=6)
 *   Hm   → MELOETTA_BEAT_MAX_BASE       (=6)
 *   HEe  → MELOETTA_BEAT_MAX_ECHO       (=8)
 *   yN   → MELOETTA_BEAT_FLOOR_WAVE     (=2)
 *   _N   → MELOETTA_SKILL_BEAT_GAIN     (=2)
 *   pEe  → MELOETTA_SONG_BUFF_TURNS     (=2)
 *   mEe  → MELOETTA_SONG_ATK_RATIO      (=0.1)
 *   ose  → MELOETTA_DANCE_BASE_BONUS    (=0.08)
 *   pm   → MELOETTA_DANCE_PER_BEAT      (=0.04)
 *   NU   → MELOETTA_DANCE_TURNS         (=2)
 *   BEe  → MELOETTA_CRESCENDO_SPDEF_RATIO (=0.04)
 *   yEe  → MELOETTA_ECHO_DEF_DOWN_PER    (=0.1)
 *   FEe  → MELOETTA_ECHO_BEATS_PER_STEP (=4)
 *   KEe  → MELOETTA_ALLEGRO_CD_REDUCE   (=2)
 *   WEe  → MELOETTA_FINALE_CD_REDUCE    (=4)
 *   uU/cU/hU → 招式 id `meloetta-song` / `meloetta-melody` / `meloetta-dance`
 *   pM   → MELOETTA_SKILL_COOLDOWN      ({song:6, melody:8, dance:12})
 *   YEe/yw/CU → 标签 `meloetta:song` / `meloetta:dance` / `meloetta:defdown:`
 *   Rse  → MELOETTA_HARMONY_STATS       (5 项能力)
 *   W0/nTe → 随机异常候选 + 中文名映射
 */
import { registerConstellation, type ConstellationCodexEntry } from "./constellation-framework";
import { JIEMING_MODULE_ROOT, registerJiemingModule } from "./jieming-system";

// ─────────────────────────────────────────────────────────────
// 0. 依赖（上游 API，待接入锚点源码时改为真实 import）
// ─────────────────────────────────────────────────────────────
declare const globalScene: any; // 产物 `E`
declare const gameData: any; // 产物 `E.gameData`
declare const gameMode: any; // 产物 `E.gameMode`
declare const Stat: any; // 产物 `p`
declare const StatusEffect: any; // 产物 `Se`（StatusEffect enum）
declare const SpeciesId: any; // 产物 `e`
declare const debugLog: (type: string, msg: string) => void; // 产物 `z`
declare const constellationLevel: (species: any, node: number) => number; // 产物 `sa`
declare const constellationNodeIsExclusive: (species: any, node: number, data?: any) => boolean; // 产物 `US`
declare const applyP5XEffect: (pokemon: any, key: string, opts: any, turns?: number) => void; // 产物 `kn`
declare const hasP5XEffect: (pokemon: any, key: string) => boolean; // 产物 `uE`
declare const clearP5XEffect: (pokemon: any, key: string) => void; // 产物 `uw`
declare const StatStageChangePhase: any; // 产物 `Vt`
declare const PokemonHealPhase: any; // 产物 `mi`
declare const registerP5XStatusProvider: (provider: (pokemon: any) => any[]) => void; // 产物 `E0`
declare const registerP5XEffectExpireHandler: (key: string, handler: (pokemon: any) => void) => void; // 产物 `Nw`

// ─────────────────────────────────────────────────────────────
// 1. 常量（还原自产物 `mw..WEe` / `pM` / `Rse` / `W0` / `nTe`）
// ─────────────────────────────────────────────────────────────

/** 命座节点索引（`QSe.exclusiveNodes` 的顺序即此常量组） */
export const MELOETTA_NODE = {
  /** 旋律觉醒（解明角色 + 节拍机制） */
  AWAKENING: 1, // 产物 `mw`
  /** 快板（音律/旋律冷却各缩短 2 次） */
  ALLEGRO: 2, // 产物 `PEe`
  /** 和声（音律额外强化我方随机一项能力） */
  HARMONY: 3, // 产物 `_Ee`
  /** 渐强（悦动额外回复全体） */
  CRESCENDO: 4, // 产物 `GEe`
  /** 终曲（悦动冷却缩短 4 次） */
  FINALE: 5, // 产物 `gEe`
  /** 回响（节拍上限 6→8 + 旋律降防） */
  ECHO: 6, // 产物 `Bw`
} as const;

/** 【节拍】上限 */
export const MELOETTA_BEAT_MAX_BASE = 6; // 产物 `Hm`
export const MELOETTA_BEAT_MAX_ECHO = 8; // 产物 `HEe`

/** 每波次保底【节拍】数 */
export const MELOETTA_BEAT_FLOOR_WAVE = 2; // 产物 `yN`

/** 每次解明招式获得的【节拍】数 */
export const MELOETTA_SKILL_BEAT_GAIN = 2; // 产物 `_N`

/** 「音律」双攻 buff 持续回合 */
export const MELOETTA_SONG_BUFF_TURNS = 2; // 产物 `pEe`
/** 「音律」双攻加算比例（美洛耶塔 物攻/特攻 × 该值） */
export const MELOETTA_SONG_ATK_RATIO = 0.1; // 产物 `mEe`

/** 「悦动」全属性基础加成 / 每节拍加成 / 持续回合 */
export const MELOETTA_DANCE_BASE_BONUS = 0.08; // 产物 `ose`
export const MELOETTA_DANCE_PER_BEAT = 0.04; // 产物 `pm`
export const MELOETTA_DANCE_TURNS = 2; // 产物 `NU`

/** 「渐强」额外回复量：美洛耶塔特防 × 该值 × 消耗节拍数 */
export const MELOETTA_CRESCENDO_SPDEF_RATIO = 0.04; // 产物 `BEe`

/** 「回响」每 4 节拍额外降低目标 10% 物防/特防 */
export const MELOETTA_ECHO_BEATS_PER_STEP = 4; // 产物 `FEe`
export const MELOETTA_ECHO_DEF_DOWN_PER = 0.1; // 产物 `yEe`

/** 「快板」「终曲」各自冷却缩短次数 */
export const MELOETTA_ALLEGRO_CD_REDUCE = 2; // 产物 `KEe`
export const MELOETTA_FINALE_CD_REDUCE = 4; // 产物 `WEe`

/** 解明招式 id（产物 `uU` / `cU` / `hU`） */
export const MELOETTA_SKILL_SONG = "meloetta-song"; // 音律
export const MELOETTA_SKILL_MELODY = "meloetta-melody"; // 旋律
export const MELOETTA_SKILL_DANCE = "meloetta-dance"; // 悦动

/** 解明招式基础冷却（产物 `pM`） */
export const MELOETTA_SKILL_COOLDOWN: Readonly<Record<string, number>> = {
  [MELOETTA_SKILL_SONG]: 6,
  [MELOETTA_SKILL_MELODY]: 8,
  [MELOETTA_SKILL_DANCE]: 12,
};

/** 标签 key（产物 `YEe` / `yw` / `CU`） */
export const MELOETTA_TAG_SONG = "meloetta:song"; // 产物 `YEe`
export const MELOETTA_TAG_DANCE = "meloetta:dance"; // 产物 `yw`
export const MELOETTA_DEF_DOWN_PREFIX = "meloetta:defdown:"; // 产物 `CU`

/** 【旋律觉醒】可用种族（产物 `ZSe`） */
export const MELOETTA_SPECIES: readonly number[] = [SpeciesId?.MELOETTA].filter(
  (x) => x !== undefined,
);

/** 「和声」随机强化候选能力（产物 `Rse`） */
export const MELOETTA_HARMONY_STATS: readonly number[] = [
  Stat?.ATK,
  Stat?.DEF,
  Stat?.SPATK,
  Stat?.SPDEF,
  Stat?.SPD,
].filter((x) => x !== undefined);

/** 「旋律」随机异常候选（产物 `W0`） */
export const MELOETTA_STATUS_CANDIDATES: readonly any[] = [
  StatusEffect?.TOXIC,
  StatusEffect?.PARALYSIS,
  StatusEffect?.BURN,
  StatusEffect?.FREEZE,
  StatusEffect?.SLEEP,
].filter((x) => x !== undefined);

/** 异常中文名映射（产物 `nTe`，逐字保留） */
export const MELOETTA_STATUS_LABEL: Readonly<Record<string, string>> = {
  [StatusEffect?.TOXIC as any]: "剧毒",
  [StatusEffect?.PARALYSIS as any]: "麻痹",
  [StatusEffect?.BURN as any]: "灼烧",
  [StatusEffect?.FREEZE as any]: "冰冻",
  [StatusEffect?.SLEEP as any]: "睡眠",
};

/** 系统说明（产物 `$Se`，逐字保留为机读规格） */
export const MELOETTA_CODEX: ConstellationCodexEntry[] = [
  {
    // 产物首条 `id: Hw`（= "jieming"）：解明资格标记（规范勘误 E1，见 A3-迁移规范 §8.1）。
    id: JIEMING_MODULE_ROOT,
    name: "旋律觉醒",
    description:
      "点亮后成为【解明】角色，解锁解明招式「音律」「旋律」「悦动」。\n" +
      `每波次开始时，若自身[节拍]低于 ${MELOETTA_BEAT_FLOOR_WAVE} 则提升至 ${MELOETTA_BEAT_FLOOR_WAVE}；[节拍]上限 ${MELOETTA_BEAT_MAX_BASE}。`,
  },
  {
    name: "快板",
    description: `「音律」「旋律」的冷却各缩短 ${MELOETTA_ALLEGRO_CD_REDUCE} 次我方行动（6→4、8→6）。`,
  },
  {
    name: "和声",
    description: "「音律」额外随机强化我方一名宝可梦的随机一项能力 1 个等级。",
  },
  {
    name: "渐强",
    description: `【悦动】额外回复我方全体：美洛耶塔特防 × ${MELOETTA_CRESCENDO_SPDEF_RATIO} × 消耗的[节拍]数。`,
  },
  {
    name: "终曲",
    description: `「悦动」的冷却缩短 ${MELOETTA_FINALE_CD_REDUCE} 次我方行动（12→8）。`,
  },
  {
    name: "回响",
    description:
      `[节拍]上限由 ${MELOETTA_BEAT_MAX_BASE} 提升到 ${MELOETTA_BEAT_MAX_ECHO}。\n` +
      `「旋律」每有 ${MELOETTA_ECHO_BEATS_PER_STEP} 个[节拍]就额外降低目标 ${Math.round(MELOETTA_ECHO_DEF_DOWN_PER * 100)}% 的物防 / 特防（按施放时的节拍数结算，留到本场战斗结束）。`,
  },
];

/** 命座注册载荷（产物 `QSe`） */
export const MELOETTA_CONSTELLATION_PAYLOAD = {
  exclusiveNodes: [
    MELOETTA_NODE.AWAKENING,
    MELOETTA_NODE.ALLEGRO,
    MELOETTA_NODE.HARMONY,
    MELOETTA_NODE.CRESCENDO,
    MELOETTA_NODE.FINALE,
    MELOETTA_NODE.ECHO,
  ],
};

// ─────────────────────────────────────────────────────────────
// 2. 注册（产物：`hI(e.MELOETTA,$Se,QSe)` + 三个框架 hook）
// ─────────────────────────────────────────────────────────────

/** 把【旋律觉醒】系统注册进公共命座框架。 */
export function registerMeloettaSystem(): void {
  for (const species of MELOETTA_SPECIES) {
    registerConstellation(species, MELOETTA_CODEX, MELOETTA_CONSTELLATION_PAYLOAD);
  }
}

// ─────────────────────────────────────────────────────────────
// 3. 基础工具函数
// ─────────────────────────────────────────────────────────────

/** 产物 `sg` — 判定种族是否为美洛耶塔 */
export function isMeloettaSpecies(species: number | undefined): boolean {
  return species !== undefined && MELOETTA_SPECIES.includes(species);
}

/** 产物 `al` — 百分比格式化（`n => `${Math.round(n*100)}%``），用于 codex 内插 */
export function pct$2(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** 产物 `eN` — 刷新战斗信息面板 */
export function refreshInfo$1(pokemon: any): void {
  if (pokemon?.getBattleInfo()) pokemon.updateInfo();
}

/** 产物 `XSe` — 施加能力等级变化阶段 */
export function boost$1(pokemon: any, stats: number[], stages: number): void {
  globalScene.unshiftPhase(new StatStageChangePhase(pokemon.getBattlerIndex(), true, stats, stages));
}

/** 产物 `ig` — 我方场上存活（非濒死）单位 */
export function playerAllies(pokemon: any): any[] {
  return (pokemon ?? []).filter((p: any) => !!p && p.isPlayer() && !p.isFainted());
}

// ─────────────────────────────────────────────────────────────
// 4. 核心函数（逐个还原自产物）
// ─────────────────────────────────────────────────────────────

/** 产物 `VO` — 判定某命座节点是否已激活 */
export function meloettaNodeActive(pokemon: any, node: number): boolean {
  const rootSpecies = pokemon?.species?.getRootSpeciesId();
  if (rootSpecies === undefined || !isMeloettaSpecies(rootSpecies)) return false;
  const data = gameData?.ptSoudacheData;
  if (constellationLevel(data, rootSpecies) < node) return false;
  return constellationNodeIsExclusive(rootSpecies, node, data);
}

/** 产物 `JSe` — 是否已点亮 4 命「渐强」 */
export function meloettaCrescendoActive(pokemon: any): boolean {
  return meloettaNodeActive(pokemon, MELOETTA_NODE.CRESCENDO);
}

/** 产物 `tN` — 读取当前【节拍】数 */
export function meloettaBeatsOf(pokemon: any): number {
  return Math.max(0, Math.floor(pokemon?.customPokemonData?.meloettaBeats ?? 0));
}

/** 产物 `Fw` — 当前【节拍】上限（6 命则 8） */
export function meloettaBeatMaxFor(pokemon: any): number {
  return meloettaNodeActive(pokemon, MELOETTA_NODE.ECHO)
    ? MELOETTA_BEAT_MAX_ECHO
    : MELOETTA_BEAT_MAX_BASE;
}

/** 产物 `mm` — 获得【节拍】；返回实际增加量 */
export function meloettaGainBeats(pokemon: any, amount: number): number {
  const data = pokemon?.customPokemonData;
  if (!pokemon?.isPlayer() || !data || !Number.isFinite(amount) || amount <= 0) return 0;
  const before = meloettaBeatsOf(pokemon);
  const max = meloettaBeatMaxFor(pokemon);
  const after = Math.max(0, Math.min(max, before + Math.floor(amount)));
  data.meloettaBeats = after;
  if (after !== before) {
    refreshInfo$1(pokemon);
    debugLog("battle", `[旋律] ${pokemon.name} 获得 ${after - before} 个[节拍] → ${after}/${max}`);
  }
  return after - before;
}

/** 产物 `jSe` — 消耗全部【节拍】；返回消耗量 */
export function meloettaConsumeBeats(pokemon: any): number {
  const data = pokemon?.customPokemonData;
  if (!pokemon?.isPlayer() || !data) return 0;
  const before = meloettaBeatsOf(pokemon);
  data.meloettaBeats = 0;
  if (before > 0) {
    refreshInfo$1(pokemon);
    debugLog("battle", `[旋律] ${pokemon.name} 消耗了 ${before} 个[节拍]`);
  }
  return before;
}

/** 产物 `zSe` — 每波次开始：已点 1 命的美洛耶塔补足【节拍】至保底 */
export function onMeloettaWaveStart(): void {
  const wave = globalScene.currentBattle?.waveIndex ?? -1;
  for (const pokemon of globalScene.getPlayerParty() ?? []) {
    if (
      !pokemon?.isPlayer() ||
      !isMeloettaSpecies(pokemon.species?.getRootSpeciesId()) ||
      !meloettaNodeActive(pokemon, MELOETTA_NODE.AWAKENING)
    ) {
      continue;
    }
    const data = pokemon.customPokemonData;
    if (!data || data.meloettaWave === wave) continue;
    data.meloettaWave = wave;
    const beats = meloettaBeatsOf(pokemon);
    if (beats >= MELOETTA_BEAT_FLOOR_WAVE) continue;
    meloettaGainBeats(pokemon, MELOETTA_BEAT_FLOOR_WAVE - beats);
    globalScene.queueMessage(`旋律再起 —— ${pokemon.name} 的[节拍]回响至 ${MELOETTA_BEAT_FLOOR_WAVE}。`);
  }
}

/** 产物 `qSe` — 「音律」物攻加算值 */
export function meloettaSongAtkBonus(user: any, target: any): number {
  return meloettaSongBonus(user, target, Stat.ATK);
}

/** 产物 `eTe` — 「音律」特攻加算值 */
export function meloettaSongSpatkBonus(user: any, target: any): number {
  return meloettaSongBonus(user, target, Stat.SPATK);
}

/** 产物 `vEe` — 「音律」加算通用实现（美洛耶塔对应能力 × 10%） */
export function meloettaSongBonus(user: any, target: any, stat: number): number {
  if (
    !user ||
    !target ||
    user === target ||
    !target.isPlayer() ||
    !hasP5XEffect(target, MELOETTA_TAG_SONG) ||
    !isMeloettaSpecies(user.species?.getRootSpeciesId()) ||
    !meloettaNodeActive(user, MELOETTA_NODE.AWAKENING)
  ) {
    return 0;
  }
  const value = user.getEffectiveStat(stat);
  return Math.max(0, Math.floor(value * MELOETTA_SONG_ATK_RATIO));
}

/** 产物 `tTe` — 「悦动」全属性倍率（排除 HP/命中/闪避） */
export function meloettaDanceStatMultiplier(pokemon: any, stat: number): number {
  const data = pokemon?.customPokemonData;
  if (
    !data ||
    data.meloettaDanceBonus <= 0 ||
    data.meloettaDanceTurns <= 0 ||
    !hasP5XEffect(pokemon, MELOETTA_TAG_DANCE) ||
    !pokemon.isPlayer() ||
    stat === Stat.HP ||
    stat === Stat.ACC ||
    stat === Stat.EVA
  ) {
    return 1;
  }
  return 1 + data.meloettaDanceBonus;
}

/** 产物 `wEe` — 6 命「回响」累计降防后的目标双防倍率 */
export function meloettaMelodyDefMultiplier(pokemon: any): number {
  const effects = pokemon?.p5xEffects;
  if (!effects) return 1;
  let total = 0;
  for (const key of Object.keys(effects)) {
    if (!key.startsWith(MELOETTA_DEF_DOWN_PREFIX)) continue;
    const v = Number.parseFloat(key.slice(MELOETTA_DEF_DOWN_PREFIX.length));
    if (Number.isFinite(v) && v > 0) total += v;
  }
  return Math.max(0, 1 - total);
}

/** 产物 `sTe` — 施加「音律」buff（我方全体） */
export function applySongBuff(targets: any[]): void {
  for (const ally of playerAllies(targets)) {
    applyP5XEffect(ally, MELOETTA_TAG_SONG, { turns: MELOETTA_SONG_BUFF_TURNS });
    refreshInfo$1(ally);
  }
}

/** 产物 `iTe` — 3 命「和声」：随机强化我方一名单位随机一项能力 |
 *  注：产物写死 `Rse`（5 项能力），此处沿用 MELOETTA_HARMONY_STATS。
 */
export function applyHarmonyBoost(allies: any[]): void {
  const list = playerAllies(allies);
  if (!list.length) return;
  const target = list[globalScene.randBattleSeedInt(list.length)];
  const stat =
    MELOETTA_HARMONY_STATS[globalScene.randBattleSeedInt(MELOETTA_HARMONY_STATS.length)];
  boost$1(target, [stat], 1);
  debugLog("battle", `[旋律] 3 命「和声」：${target.name} 的随机能力 +1 级`);
}

/** 产物 `ATe` — 给目标随机挂一个异常（返回施加的异常，免疫则 undefined） */
export function applyRandomStatus(user: any, target: any): any {
  const start = globalScene.randBattleSeedInt(MELOETTA_STATUS_CANDIDATES.length);
  for (let i = 0; i < MELOETTA_STATUS_CANDIDATES.length; i++) {
    const status = MELOETTA_STATUS_CANDIDATES[(start + i) % MELOETTA_STATUS_CANDIDATES.length];
    if (target.canSetStatus(status, true, false, user) && target.trySetStatus(status, true, user)) {
      return status;
    }
  }
  return undefined;
}

/** 产物 `aTe` — 6 命「回响」：按当前节拍数给敌方挂降防效果 */
export function applyMelodyDefDown(target: any, beats: number): void {
  if (!target || target.isPlayer()) return;
  const steps = Math.floor(beats / MELOETTA_ECHO_BEATS_PER_STEP);
  const amount = steps * MELOETTA_ECHO_DEF_DOWN_PER;
  const current = 1 - meloettaMelodyDefMultiplier(target);
  if (amount <= 0 || amount <= current) return;
  for (const key of Object.keys(target.p5xEffects ?? {})) {
    if (key.startsWith(MELOETTA_DEF_DOWN_PREFIX)) clearP5XEffect(target, key);
  }
  applyP5XEffect(target, `${MELOETTA_DEF_DOWN_PREFIX}${amount}`, {});
  refreshInfo$1(target);
  debugLog("battle", `[旋律] 6 命「回响」：${target.name} 双防 ×${1 - amount}（${steps} 档）`);
}

/** 产物 `ETe` — 施加「悦动」buff（我方全体全属性提升） */
export function applyDanceBuff(allies: any[], bonus: number): void {
  for (const ally of playerAllies(allies)) {
    const data = ally.customPokemonData;
    if (!data) continue;
    data.meloettaDanceBonus = bonus;
    data.meloettaDanceTurns = MELOETTA_DANCE_TURNS;
    applyP5XEffect(ally, MELOETTA_TAG_DANCE, { turns: MELOETTA_DANCE_TURNS });
    refreshInfo$1(ally);
  }
}

/** 产物 `rTe` — 4 命「渐强」：悦动额外回复我方全体（特防 × 4% × 消耗节拍数） */
export function applyCrescendoHeal(user: any, allies: any[], beats: number): void {
  const ratio = beats * MELOETTA_CRESCENDO_SPDEF_RATIO;
  if (ratio <= 0) return;
  const spdef = Math.max(1, user.getEffectiveStat(Stat.SPDEF));
  for (const ally of playerAllies(allies)) {
    if (ally.isFullHp()) continue;
    const amount = Math.max(0, Math.floor(spdef * ratio));
    if (amount <= 0) continue;
    globalScene.unshiftPhase(new PokemonHealPhase(ally.getBattlerIndex(), amount, null, true, false));
  }
}

/** 产物 `Nw(yw, ...)` — 「悦动」buff 过期时清零 */
export function registerMeloettaDanceExpireHandler(): void {
  registerP5XEffectExpireHandler(MELOETTA_TAG_DANCE, (pokemon: any) => {
    const data = pokemon?.customPokemonData;
    if (!data) return;
    data.meloettaDanceBonus = 0;
    data.meloettaDanceTurns = 0;
    refreshInfo$1(pokemon);
  });
}

/** 产物 `RTe` — 解明招式的有效冷却（受 2/5 命缩减） */
export function meloettaEffectiveCooldown(pokemon: any, skillId: string): number {
  const base = MELOETTA_SKILL_COOLDOWN[skillId];
  if (base === undefined) return 0;
  let cd = base;
  if (
    (skillId === MELOETTA_SKILL_SONG || skillId === MELOETTA_SKILL_MELODY) &&
    pokemon &&
    meloettaNodeActive(pokemon, MELOETTA_NODE.ALLEGRO)
  ) {
    cd -= MELOETTA_ALLEGRO_CD_REDUCE;
  }
  if (skillId === MELOETTA_SKILL_DANCE && pokemon && meloettaNodeActive(pokemon, MELOETTA_NODE.FINALE)) {
    cd -= MELOETTA_FINALE_CD_REDUCE;
  }
  return Math.max(1, cd);
}

// ─────────────────────────────────────────────────────────────
// 5. 解明招式表（产物 `oTe`，逐字保留 apply 逻辑与中文描述）
// ─────────────────────────────────────────────────────────────

/** 产物 `oTe` — 美洛耶塔的三个解明招式 */
export const MELOETTA_SKILLS = [
  {
    id: MELOETTA_SKILL_SONG,
    name: "音律",
    cooldown: MELOETTA_SKILL_COOLDOWN[MELOETTA_SKILL_SONG],
    description: `我方全体双攻加算「美洛耶塔物攻/特攻×${pct$2(MELOETTA_SONG_ATK_RATIO)}」的数值，持续${MELOETTA_SONG_BUFF_TURNS}回合；获得${MELOETTA_SKILL_BEAT_GAIN}个[节拍]。`,
    apply: (user: any, targets: any[]) => {
      if (!user?.isPlayer()) return;
      applySongBuff(targets);
      meloettaGainBeats(user, MELOETTA_SKILL_BEAT_GAIN);
      if (meloettaNodeActive(user, MELOETTA_NODE.HARMONY)) applyHarmonyBoost(targets);
    },
  },
  {
    id: MELOETTA_SKILL_MELODY,
    name: "旋律",
    cooldown: MELOETTA_SKILL_COOLDOWN[MELOETTA_SKILL_MELODY],
    needsEnemyTarget: true,
    description: `选敌方一只，随机赋予剧毒/麻痹/灼烧/冰冻/睡眠之一；获得${MELOETTA_SKILL_BEAT_GAIN}个[节拍]。`,
    apply: (user: any, targets: any[]) => {
      if (!user?.isPlayer()) return;
      const beats = meloettaBeatsOf(user);
      const target = targets?.[0];
      if (target && !target.isPlayer() && !target.isFainted()) {
        const applied = applyRandomStatus(user, target);
        if (applied === undefined) {
          debugLog("battle", `[旋律] ${target.name} 当前免疫所有候选异常，本次只结算[节拍]`);
        } else {
          debugLog("battle", `[旋律] ${target.name} 陷入【${MELOETTA_STATUS_LABEL[applied] ?? applied}】`);
        }
        if (meloettaNodeActive(user, MELOETTA_NODE.ECHO)) applyMelodyDefDown(target, beats);
      }
      meloettaGainBeats(user, MELOETTA_SKILL_BEAT_GAIN);
    },
  },
  {
    id: MELOETTA_SKILL_DANCE,
    name: "悦动",
    cooldown: MELOETTA_SKILL_COOLDOWN[MELOETTA_SKILL_DANCE],
    description: `消耗全部[节拍]：我方全体全属性提升${pct$2(MELOETTA_DANCE_BASE_BONUS)}+节拍数×${pct$2(MELOETTA_DANCE_PER_BEAT)}，持续${MELOETTA_DANCE_TURNS}回合。`,
    apply: (user: any, targets: any[]) => {
      if (!user?.isPlayer()) return;
      const beats = meloettaConsumeBeats(user);
      const bonus = MELOETTA_DANCE_BASE_BONUS + beats * MELOETTA_DANCE_PER_BEAT;
      applyDanceBuff(targets, bonus);
      if (meloettaCrescendoActive(user)) applyCrescendoHeal(user, targets, beats);
      globalScene.queueMessage(
        `悦动的旋律洒向全场 —— 消耗 ${beats} 个[节拍]，我方全体全属性提升 ${pct$2(bonus)}！`,
      );
    },
  },
];

/** 把美洛耶塔解明模块挂入 JIEMING 框架（产物 `fEe({rootSpeciesId, skills, cooldown, counter})`）。 */
export function registerMeloettaJiemingModule(): void {
  registerJiemingModule({
    rootSpeciesId: SpeciesId?.MELOETTA,
    skills: MELOETTA_SKILLS,
    cooldown: (pokemon: any, skill: any) => meloettaEffectiveCooldown(pokemon, skill.id),
    counter: {
      label: "节拍",
      read: (pokemon: any) => ({ value: meloettaBeatsOf(pokemon), max: meloettaBeatMaxFor(pokemon) }),
    },
  });
}

/** 产物 `E0(...)` — 注册【节拍】状态徽标 provider。 */
export function registerMeloettaStatusProvider(): void {
  registerP5XStatusProvider((pokemon: any) => {
    if (!pokemon?.isPlayer?.()) return [];
    const beats = meloettaBeatsOf(pokemon);
    if (beats <= 0) return [];
    return [
      {
        key: "meloetta:beats",
        texture: "p5x_buffs",
        pokemonIcon: true,
        title: `[节拍] ${beats}/${meloettaBeatMaxFor(pokemon)}`,
        description: `解明招式 +${MELOETTA_SKILL_BEAT_GAIN} 层；【悦动】烧掉全部[节拍]，每层给全队 +${pct$2(MELOETTA_DANCE_PER_BEAT)} 全属性（${MELOETTA_DANCE_TURNS} 轮）。`,
      },
    ];
  });
}

// ─────────────────────────────────────────────────────────────
// TODO(接入锚点 90df65097b6d)：本文件依赖清单
// ─────────────────────────────────────────────────────────────
// TODO(接入锚点): globalScene / gameData / gameMode → #app/global-scene
// TODO(接入锚点): Stat → #enums/stat；StatusEffect → #enums/status-effect
// TODO(接入锚点): SpeciesId → #enums/species-id
// TODO(接入锚点): StatStageChangePhase / PokemonHealPhase → #phases/*
// TODO(接入锚点): applyP5XEffect / hasP5XEffect / clearP5XEffect
//                 → P5X 系统导出（A3-09 p5x-system.ts）
// TODO(接入锚点): registerJiemingModule / registerP5XStatusProvider / registerP5XEffectExpireHandler
//                 → JIEMING（A3-07）/ P5X（A3-09）框架导出
// TODO(接入锚点): 把 registerMeloettaSystem / registerMeloettaJiemingModule /
//                 registerMeloettaStatusProvider / registerMeloettaDanceExpireHandler
//                 挂到系统初始化点（原产物靠顶层副作用执行）
// TODO(A4-验证): 「悦动」全属性提升的可叠加上限与过期时序

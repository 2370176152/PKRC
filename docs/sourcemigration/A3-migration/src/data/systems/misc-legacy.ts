/**
 * 杂项魔改（MISC LEGACY）—— 自研系统之外的单点改动迁移
 * ---------------------------------------------------------------------------
 * 来源：game/server/dist/assets/loading-scene-By2k7Qfx.js（.orig 产物）
 * 逆向方式：`l(短名,"原函数名")` 反查
 * 锚点树：90df65097b6df76f713e6bd108afa84499e8b993
 *
 * 定位：不属于 8 个自研系统、但为魔改新增/改写的**单点类**集合（A3-12 收口）。
 *       这些类直接挂在**上游既有基类**上，通过注册（arenaTag / abilityAttr / challenge）
 *       生效，因此分散在原产物各处。
 *
 * 产物符号对照（去混淆映射，务必逐条保留）：
 *   I8   → ChengfengTag                 （场域标签：乘风）
 *   o8   → KONGJIANRoomTag              （场域标签：空间房间）
 *   Yk   → FirefighterChoicePhase       （特性触发：消防员·换人抉择）
 *   ree  → FirefighterPostSummonAbAttr  （特性属性：消防员·登场后加成）
 *   uq   → FlipStatAbAttr               （特性属性：能力翻转）
 *   O1   → FlipStatChallenge            （挑战：能力翻转）
 *   mQ   → IceFaceBlockDamageTag        （BattlerTag：冰脸挡伤）
 *
 * 依赖短名（上行）：
 *   E→globalScene / M→i18next / p→Stat / B→MoveCategory / V→UiMode / Q→WeatherType
 *   e→SpeciesId / ls→SwitchType / Vt→StatStageChangePhase / Ut→ChallengeType
 *   _e→ArenaTagType / Qe→TerrainType / ie→getPokemonNameWithAffix
 *   Zi→ArenaTag（基类） / In→Phase / pi→SwitchSummonPhase / Xi→PostSummonAbAttr（基类）
 *   mt→AbAttr（基类） / Ga→Challenge（基类） / mP→IceFaceBlockDamageTag 基类
 *   t / qM / ti→其他上游常量与工具（见 TODO）
 *
 * ⚠️ 类体由产物**逐字提取**（仅定义名还原 + 外层 `const X=class X` 保持），请勿手工排版。
 */

// ─────────────────────────────────────────────────────────────
// 0. 依赖占位（上游 API；接入锚点时替换为真实 import）
// ─────────────────────────────────────────────────────────────
declare let E: any; // 产物 `E` — globalScene
declare let M: any; // 产物 `M` — i18next
declare let p: any; // 产物 `p` — Stat
declare let B: any; // 产物 `B` — MoveCategory
declare let V: any; // 产物 `V` — UiMode
declare let Q: any; // 产物 `Q` — WeatherType
declare let e: any; // 产物 `e` — SpeciesId
declare let ls: any; // 产物 `ls` — SwitchType
declare let Vt: any; // 产物 `Vt` — StatStageChangePhase
declare let Ut: any; // 产物 `Ut` — ChallengeType
declare let _e: any; // 产物 `_e` — ArenaTagType
declare let Qe: any; // 产物 `Qe` — TerrainType
declare let ie: any; // 产物 `ie` — getPokemonNameWithAffix
declare let Zi: any; // 产物 `Zi` — ArenaTag 基类
declare let In: any; // 产物 `In` — Phase 基类
declare let pi: any; // 产物 `pi` — SwitchSummonPhase
declare let Xi: any; // 产物 `Xi` — PostSummonAbAttr 基类
declare let mt: any; // 产物 `mt` — AbAttr 基类
declare let Ga: any; // 产物 `Ga` — Challenge 基类
declare let mP: any; // 产物 `mP` — IceFaceBlockDamageTag 基类
declare let t: any; // 产物 `t` — 上游常量表（含 KONGJIAN）
declare let qM: any; // 产物 `qM` — 能力数组深拷贝工具
declare let ti: any; // 产物 `ti` — 随机整数

// ─────────────────────────────────────────────────────────────
// 1. 场域标签（ArenaTag）
// ─────────────────────────────────────────────────────────────

/**
 * 产物 `I8` — 乘风（`CHENGFENG`）场域标签。
 * 效果：本方非变化招式伤害 +6；入场时清除地形。
 */
export const ChengfengTag = class ChengfengTag extends Zi {
  constructor(s: any, i: any, A: any) {
    super(_e.CHENGFENG, s, undefined, i, A);
  }
  onAdd(s: any, i = false) {
    if (!i) E.queueMessage(M.t(`arenaTag:chengfengOnAdd${this.side === 1 ? "Player" : this.side === 2 ? "Enemy" : ""}`));
    if (s.terrain) s.trySetTerrain(Qe.NONE, true);
  }
  onRemove(s: any, i = false) {
    if (!i) E.queueMessage(M.t(`arenaTag:chengfengOnRemove${this.side === 1 ? "Player" : this.side === 2 ? "Enemy" : ""}`));
  }
  apply(s: any, i: any, A: any, a: any, r: any) {
    if (!A) return false;
    const O = A.isPlayer();
    const I = this.side === 1;
    if (O !== I) return false;
    return r && r.category !== B.STATUS ? ((a.value += 6), true) : false;
  }
};

/**
 * 产物 `o8` — 空间房间（`KONGJIAN`）场域标签。
 * 效果：顶替戏法空间；全场重新计算能力；帕路奇亚免疫；本方速度 -6。
 */
export const KONGJIANRoomTag = class KONGJIANRoomTag extends Zi {
  constructor(s: any, i: any) {
    super(_e.KONGJIAN, s, t.KONGJIAN, i);
  }
  onAdd(s: any) {
    E.arena.removeTag(_e.TRICK_ROOM);
    E.queueMessage(M.t("arenaTag:kongjianOnAdd"));
    E.getField(true).forEach((i: any) => i?.calculateStats());
  }
  onRemove(s: any) {
    E.queueMessage(M.t("arenaTag:kongjianOnRemove"));
    E.getField(true).forEach((i: any) => i?.calculateStats());
  }
  apply(s: any, i: any, A: any, a: any) {
    return A?.species?.speciesId === e.PALKIA ? false : ((a.value -= 6), true);
  }
};

// ─────────────────────────────────────────────────────────────
// 2. 特性：消防员（Firefighter）
// ─────────────────────────────────────────────────────────────

/**
 * 产物 `Yk` — 消防员·换人抉择阶段。
 * 触发时询问玩家：「换人」或「随机 +1 能力级」。
 */
export const FirefighterChoicePhase = class FirefighterChoicePhase extends In {
  constructor(
    public firefighterPokemon: any,
    public attacker: any,
    public targetFieldIndex: any,
    public isPlayerSide: any,
  ) {
    super();
  }
  start() {
    super.start();
    const s = M.t("abilityTriggers:firefighterChoice", {
      pokemonName: ie(this.firefighterPokemon),
      abilityName: M.t("ability:firefighter.name"),
    });
    E.ui.showText(s, null, () => {
      E.ui.setMode(V.CONFIRM, () => {
        E.ui.setMode(V.MESSAGE);
        this.firefighterPokemon.__firefighterPending = true;
        const A = (this.isPlayerSide ? E.getPlayerParty() : E.getEnemyParty()).findIndex(
          (a: any) => a.id === this.firefighterPokemon.id,
        );
        if (A > -1) E.unshiftPhase(new pi(ls.SWITCH, this.targetFieldIndex, A, true, this.isPlayerSide));
        this.end();
      }, () => {
        E.ui.setMode(V.MESSAGE);
        this.applyRandomStatBoost();
        this.end();
      });
    });
  }
  applyRandomStatBoost() {
    const i = E.getPlayerField().filter((I: any) => I.isActive());
    if (i.length === 0) return;
    const A = i[ti(i.length)];
    const a = [p.ATK, p.DEF, p.SPATK, p.SPDEF, p.SPD];
    const r = a[ti(a.length)];
    E.unshiftPhase(new Vt(A.getBattlerIndex(), true, [r], 1));
    const O = M.t("abilityTriggers:firefighterStatBoost", {
      pokemonName: ie(A),
      statName: M.t(`stat:${r}`),
    });
    E.queueMessage(O);
  }
};

/**
 * 产物 `ree` — 消防员·登场后加成（若上一回合选择了换人，则本次登场全能力 +3）。
 */
export const FirefighterPostSummonAbAttr = class FirefighterPostSummonAbAttr extends Xi {
  canApplyPostSummon(s: any) {
    return !!s.__firefighterPending;
  }
  applyPostSummon(s: any) {
    delete s.__firefighterPending;
    const r = [p.ATK, p.DEF, p.SPATK, p.SPDEF, p.SPD];
    for (const I of r) E.unshiftPhase(new Vt(s.getBattlerIndex(), true, [I], 3));
    const O = M.t("abilityTriggers:firefighter", {
      pokemonName: ie(s),
      abilityName: M.t("ability:firefighter.name"),
    });
    E.queueMessage(O);
  }
};

// ─────────────────────────────────────────────────────────────
// 3. 能力翻转（FlipStat）
// ---------------------------------------------------------------------------
// ⚠️ 注意：`FlipStatAbAttr`（特性版）与 `FlipStatChallenge`（挑战版）的**翻转映射不同**：
//     · 特性版：成对互换 (0↔5)、(1↔2)、(3↔4)；
//     · 挑战版：整体逆序 0↔5、1↔4、2↔3。
//     二者**均为产物原样**，迁移时不得统一。
// ─────────────────────────────────────────────────────────────

/** 产物 `uq` — 能力翻转（特性属性版：成对互换） */
export const FlipStatAbAttr = class FlipStatAbAttr extends mt {
  constructor() {
    super(false);
  }
  canApply(s: any, i: any, A: any, a: any) {
    return Array.isArray(a[0]);
  }
  apply(s: any, i: any, A: any, a: any, r: any) {
    const O = r[0];
    if (!O || !Array.isArray(O) || O.length < 6) return;
    const I = qM(O);
    O[0] = I[5];
    O[1] = I[2];
    O[3] = I[4];
    O[4] = I[3];
    O[2] = I[1];
    O[5] = I[0];
  }
};

/** 产物 `O1` — 能力翻转（挑战版：整体逆序） */
export const FlipStatChallenge = class FlipStatChallenge extends Ga {
  constructor() {
    super(Ut.FLIP_STAT, 1);
  }
  applyFlipStat(s: any, i: any) {
    const A = qM(i);
    i[0] = A[5];
    i[1] = A[4];
    i[2] = A[3];
    i[3] = A[2];
    i[4] = A[1];
    i[5] = A[0];
    return true;
  }
  static loadChallenge(s: any) {
    const i = new FlipStatChallenge();
    i.value = s.value;
    i.severity = s.severity;
    return i;
  }
};

// ─────────────────────────────────────────────────────────────
// 4. BattlerTag：冰脸挡伤（IceFaceBlockDamageTag）
// ─────────────────────────────────────────────────────────────

/** 产物 `mQ` — 冰脸挡伤标签：冰雹 / 下雪天也可挂载（放宽基类条件） */
export const IceFaceBlockDamageTag = class IceFaceBlockDamageTag extends mP {
  canAdd(s: any) {
    const i = E.arena.weather?.weatherType;
    const A = i === Q.HAIL || i === Q.SNOW;
    return super.canAdd(s) || A;
  }
};

// ─────────────────────────────────────────────────────────────
// TODO(接入锚点 90df65097b6d)：本文件依赖清单
// ─────────────────────────────────────────────────────────────
// TODO(接入锚点): Zi/In/pi/Xi/mt/Ga/mP → 上游基类（ArenaTag / Phase /
//                 SwitchSummonPhase / PostSummonAbAttr / AbAttr / Challenge / BattlerTag）
// TODO(接入锚点): _e/Qe/Ut/p/B/Q/V/e/ls → 上游枚举；`t` → 上游常量表（含 KONGJIAN）
// TODO(接入锚点): qM（能力数组深拷贝）/ ti（随机整数）→ 上游工具函数
// TODO(接入锚点): 注册点：乘风 / 空间房间 → arenaTag 注册表；
//                 消防员两个 AbAttr → 特性属性表；冰脸挡伤 → BattlerTag 表；
//                 能力翻转挑战 → 挑战注册表。
// TODO(A4-验证): `FlipStatAbAttr` 与 `FlipStatChallenge` 的翻转映射差异是否有意为之。
// TODO(A4-验证): `KONGJIANRoomTag` 对帕路奇亚的免疫分支。

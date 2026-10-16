# A4-00 前置 —— `misc-legacy.ts` 接入方案（精确实施输入）

> **背景**：A4-00 批 3b-3 阻塞（见 `A4-00-接入锚点进度.md` §4.11.2）
> **日期**：2026-10-16 · **锚点树**：`90df65097b6df76f713e6bd108afa84499e8b993`
> **一句话**：**不是一次机械映射，而是 3 项独立工作** —— D-8 重构（可做）· D-9 重构（架构级）· 2 项挂账定性。

---

## 1. 依赖短名 → 上游落点（23 个，**已全部核实**）

| 短名 | 上游落点 | 短名 | 上游落点 |
|---|---|---|---|
| `E` | `globalScene`（`#app/global-scene`） | `Qe` | `TerrainType`（**`#data/terrain`**，非 `#enums/*`） |
| `M` | `i18next` | `ie` | `getPokemonNameWithAffix`（`#app/messages`） |
| `p` | `Stat`（`#enums/stat`） | `Zi` | **`ArenaTag`**（`#data/arena-tag`） |
| `B` | `MoveCategory`（`#enums/move-category`） | `In` | `Phase`（`#app/phase`） |
| `V` | `UiMode`（`#enums/ui-mode`） | `pi` | `SwitchSummonPhase`（`#phases/switch-summon-phase`） |
| `Q` | `WeatherType`（`#enums/weather-type`） | `Xi` | `PostSummonAbAttr`（`#abilities/ab-attrs`） |
| `e` | `SpeciesId`（`#enums/species-id`） | `mt` | `AbAttr`（`#abilities/ab-attrs`） |
| `ls` | `SwitchType`（`#enums/switch-type`） | `Ga` | **`Challenge`**（`#data/challenge`） |
| `Vt` | `StatStageChangePhase`（`#phases/stat-stage-change-phase`） | `mP` | 🔴 **挂账**（`FormBlockDamageTag` **不在锚点树**） |
| `Ut` | **`Challenges`**（`#enums/challenges`）—— ⚠️ **不是** `ChallengeType`（勘误 E12） | `t` | **`MoveId`**（`#enums/move-id`） |
| `_e` | `ArenaTagType`（`#enums/arena-tag-type`） | `qM` | 🔴 **挂账**（深拷贝，无可证落点） |
| | | `ti` | `randInt`（`#utils/common`） |

---

## 2. 逐类处置

### 2.1 `ChengfengTag`（产物 `I8`）—— **D-8 重构，可做**

```ts
import { ArenaTag, SerializableArenaTag } from "#data/arena-tag";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveCategory } from "#enums/move-category";
import { TerrainType } from "#data/terrain";
import { globalScene } from "#app/global-scene";

export class ChengfengTag extends SerializableArenaTag {
  // ⚠️ `ArenaTagType` 不可声明合并（`ArenaTagTypeMap` 是 key-mapped 表）⇒ 字面量断言
  public readonly tagType = "CHENGFENG" as SerializableArenaTagType;

  constructor(turnCount: number, sourceId: number, side: ArenaTagSide) {
    // 旧树 `super(_e.CHENGFENG, s, undefined, i, A)` ⇒ tagType 提为字段，sourceMove 为 undefined
    super(turnCount, undefined, sourceId, side);
  }

  protected override get onAddMessageKey(): string {
    return `arenaTag:chengfengOnAdd${this.i18nSideKey}`;   // i18nSideKey 为基类 protected getter
  }
  protected override get onRemoveMessageKey(): string {
    return `arenaTag:chengfengOnRemove${this.i18nSideKey}`;
  }

  // 旧树 `onAdd(arena, quiet)`：发消息 + 清地形 ⇒ 新树 `onAdd(quiet)` + `globalScene.arena`
  public override onAdd(quiet = false): void {
    super.onAdd(quiet);                                     // 基类按 messageKey 发消息
    const arena = globalScene.arena;
    if (arena.terrain) {
      arena.trySetTerrain(TerrainType.NONE, true);
    }
  }

  // 旧树 `apply(a, b, pokemon, holder, move)`；⚠️ 调用点在 mod 未迁移部分 ⇒ 实参顺序待核对
  public override apply(...args: unknown[]): void {
    const [, , pokemon, holder, move] = args as [
      unknown, unknown, Pokemon | undefined, NumberHolder | undefined, Move | undefined,
    ];
    if (!pokemon || !holder || !move) return;
    if (pokemon.isPlayer() !== (this.side === ArenaTagSide.PLAYER)) return;
    if (move.category !== MoveCategory.STATUS) holder.value += 6;
  }
}
```

> ⚠️ **`apply` 的返回值**：旧树返回 `boolean`，新树 `apply(...args): void`（上游注释：「TODO: Remove all boolean return values from subclasses」）⇒ **丢弃返回值**。
> ⚠️ `onRemove` 旧树只发消息 ⇒ 无需 override（基类已按 `onRemoveMessageKey` 处理）。

### 2.2 `KONGJIANRoomTag`（产物 `o8`）—— **D-8 重构，可做**

```ts
export class KONGJIANRoomTag extends SerializableArenaTag {
  public readonly tagType = "KONGJIAN" as SerializableArenaTagType;

  constructor(turnCount: number, sourceId: number) {
    // 旧树 `super(_e.KONGJIAN, s, t.KONGJIAN, i)` ⇒ sourceMove = MoveId.KONGJIAN
    super(turnCount, MoveId.KONGJIAN, sourceId, ArenaTagSide.BOTH);
  }

  protected override get onAddMessageKey(): string { return "arenaTag:kongjianOnAdd"; }
  protected override get onRemoveMessageKey(): string { return "arenaTag:kongjianOnRemove"; }

  public override onAdd(quiet = false): void {
    super.onAdd(quiet);
    globalScene.arena.removeTag(ArenaTagType.TRICK_ROOM);
    globalScene.getField(true).forEach(p => p?.calculateStats());
  }

  public override onRemove(quiet = false): void {
    super.onRemove(quiet);
    globalScene.getField(true).forEach(p => p?.calculateStats());
  }

  public override apply(...args: unknown[]): void {
    // 旧树：`A?.species?.speciesId === e.PALKIA ? false : (holder.value -= 6, true)`
    const [, , pokemon, holder] = args as [unknown, unknown, Pokemon | undefined, NumberHolder | undefined];
    if (pokemon?.species?.speciesId === SpeciesId.PALKIA) return;   // 帕路奇亚免疫
    if (holder) holder.value -= 6;
  }
}
```

### 2.3 `FirefighterChoicePhase`（产物 `Yk`）—— **可做（Phase 注册）**

- `extends Phase` ⇒ 需加 `phaseName = "FirefighterChoicePhase"` + 注册进 `src/phase-manager.ts` 的 `PHASES`（同批 2b/3b-2 做法）。
- `E.getPlayerParty().findIndex(...)` / `E.unshiftPhase(...)` / `E.getPlayerField()` ⇒ **`globalScene.` 直通**；
  ⚠️ `E.unshiftPhase` ⇒ `globalScene.phaseManager.unshiftPhase`（D-4）。
- `new pi(ls.SWITCH, targetFieldIndex, partyIndex, true, isPlayerSide)` ⇒ `SwitchSummonPhase`——
  ⚠️ **须核对新树 `SwitchSummonPhase` ctor 参数表**（旧树 5 个位置参数）。
- `i[ti(i.length)]` ⇒ `randInt(i.length)`。
- `this.firefighterPokemon.__firefighterPending` ⇒ **mod 在 `Pokemon` 上加的字段** ⇒ `mod-augment.ts` 追加
  （`__firefighterPending?: boolean`；注意 `delete` 用法 ⇒ 须为可选）。

### 2.4 🔴 `FirefighterPostSummonAbAttr`（产物 `ree`）—— **D-9，需重写**

旧树钩子 `canApplyPostSummon(pokemon)` / `applyPostSummon(pokemon)` **在新树不存在**。
新树 `AbAttr` = `canApply(params: Closed<AbAttrBaseParams>)` / `apply(params…)`（**单一 params 对象**）。

**做法**：先读上游一个**同类** `PostSummonAbAttr` 子类（如 `ImposterAbAttr` / `ScreenCleanerAbAttr`）作为模板，
按 params 对象解构 `pokemon`，再移植「`__firefighterPending` 判定 + 全能力 +3 + 消息」。

### 2.5 🔴 `FlipStatAbAttr`（产物 `uq`）—— **D-9，需重写**

同 2.4；另外旧树 `constructor(){ super(false) }` ⇒ 新树 `AbAttr` ctor 为 `(showAbility = true)` ⇒ **`super(false)` 语义一致** ✅。
翻转映射（**成对互换** `0↔5, 1↔2, 3↔4`）**必须保持**（与 `FlipStatChallenge` 的**整体逆序**不同，见源文件注释）。

### 2.6 `FlipStatChallenge`（产物 `O1`）—— **基本可做**

- `extends Challenge`，`super(Ut.FLIP_STAT, 1)` ⇒ `super(Challenges.FLIP_STAT, 1)`（**E12 勘误**）。
- `applyFlipStat(a, b)` —— ✅ **上游已有此方法**：`Challenge.applyFlipStat(pokemon: Pokemon, baseStats: number[])`（`src/data/challenge.ts:361`）⇒ 加 `override`。
- `static loadChallenge(source)` —— ✅ 上游 `Challenge.loadChallenge(source: Challenge | any)` 存在 ⇒ 加 `static override`。
- `qM(i)` ⇒ 🔴 挂账（深拷贝）。

### 2.7 🔴 `IceFaceBlockDamageTag`（产物 `mQ`）—— **阻塞**

`extends mP`，而 `mP = FormBlockDamageTag` **在锚点树全树（`BlockDamageTag`）命中 0** ⇒ 基类不存在。
⇒ 需先定性：**mod 新增类**（须一并补迁）还是**旧树过时类**（不迁，则本类一并放弃）。
⚠️ 另注意：产物中本类的 keepNames 也是 `IceFaceBlockDamageTag`（与 mod 源文件同名），**上游无此 tag**（冰脸机制在新树已重构）。

---

## 3. 实施顺序（建议）

| 步 | 内容 | 依赖 |
|---|---|---|
| 1 | 落 23 个短名映射 + §2.1/2.2 两个 ArenaTag 重构 | 无 |
| 2 | `FirefighterChoicePhase`（phaseName + `PHASES` 注册 + `SwitchSummonPhase` ctor 核对） | 步 1 |
| 3 | `FlipStatChallenge`（`Challenges` + `override` 修饰） | 步 1 |
| 4 | **D-9**：`FlipStatAbAttr` / `FirefighterPostSummonAbAttr` 按 params 对象重写 | 需先读上游同类模板 |
| 5 | 挂账定性：`mP`（`FormBlockDamageTag`）· `qM`（深拷贝） | 见 §4 |
| 6 | `tsc` + `vite build` | 步 1~5 |

---

## 4. 挂账与待定性

| 项 | 待办 |
|---|---|
| `mP` = `FormBlockDamageTag` | 在 **A4-00-前置-A3归属遗漏清单.md** 的 557 项底账中定性：属「mod 未接入」还是「旧树过时类」；前者须补迁基类，后者则 `IceFaceBlockDamageTag` 一并放弃 |
| `qM` = 能力数组深拷贝 | 在产物中定位其定义体（无 keepNames ⇒ 需按 `FlipStatAbAttr.apply` / `FlipStatChallenge.applyFlipStat` 调用点上下文反查）；若确为 mod 自建 ⇒ 在 `misc-legacy.ts` 内实现为本地 helper |
| `ChengfengTag.apply` / `KONGJIANRoomTag.apply` 的**调用点** | 属 mod 未迁移部分（`arena.applyTags*` 的 mod 调用方）⇒ **补迁时逐字核对实参顺序**（当前骨架按产物形参名推断：`(a, b, pokemon, holder, move)`） |
| `ArenaTagType.CHENGFENG` / `KONGJIAN` 的**注册** | 除 `tagType` 字面量断言外，还须在上游 `ArenaTagTypeMap` 等处注册（否则 `newPhase`/存档序列化不认）；⚠️ 属**上游源文件改动**，须显式标注 |

---

*本方案为 A4-00 批 3b-3 的精确实施输入；实施后需回填本文档并更新进度记录。*

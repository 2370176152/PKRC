# A4-00 旧树 API 差异台账 —— 产物基座 vs 锚点树

> **背景**：A0-E2 已确认「产物基座 = 04-24 前旧树，锚点树 = 新树（v1.11.22）」。差异**不止**「旧树过时类（显式 modifier/attr 类）」一类 —— 部分**上游 API 签名在旧/新树之间发生了不兼容变更**，A3 从产物直译出的代码在锚点树**无法原样编译**。
>
> **本台账用途**：A4-00b 五分类中，「**旧树过时类**」之外的这些项单列一档 **「旧树 API 差异」**，逐条给出**判定依据 + 等价性论证 + 采用映射**，供复核否决。
>
> **日期**：2026-10-14 · **发起**：A4-00 批 2b · **锚点树**：`90df65097b6df76f713e6bd108afa84499e8b993`

---

## 0. 判定方法

1. 从产物**按 keepNames 反查出真名**（`l(短名,"原名")`）。
2. 在**旧树**（产物）侧读出**构造器形参表**（minified 但形参名完整保留）。
3. 在**新树**（锚点树）侧读出同一类/函数的**当前签名**。
4. 若形参表不一致 ⇒ 登记差异 → **逐参数建映射** → 给出**等价性论证**。

> ⚠️ 差异项的映射**不是**「迁移缺陷」，也**不是**「可以随便改」；每条都必须能追到产物侧的形参含义。

---

## 1. 差异总表

| 编号 | 目标 API | 旧树（产物）签名 | 新树（锚点树）签名 | 采用映射 | 影响文件 |
|---|---|---|---|---|---|
| **D-1** | `MoveEffectPhase` | `(battlerIndex, targets, move: PokemonMove, reflected: boolean)` | `(battlerIndex, targets, move: Move, useMode: MoveUseMode)` | 第 3 参改传 `allMoves[id]`（`Move`）；`reflected=false` ⇒ `MoveUseMode.NORMAL` | nianli |
| **D-2** | `MovePhase` | `(pokemon, targets, move: PokemonMove, followUp=false, ignorePp=false, reflected=false, forcedLast=false, ignoreAssaultVest=false)` | `(pokemon, targets, move: PokemonMove, useMode: MoveUseMode, timingModifier = NORMAL)` | 5 个布尔折叠为 `useMode`（累积序）：`reflected→REFLECTED` > `followUp→FOLLOW_UP` > `ignorePp→IGNORE_PP` > `NORMAL`；`forcedLast` ⇒ `MovePhaseTimingModifier.LAST`；`ignoreAssaultVest` **丢弃**（新树无 Assault Vest） | dianxin |
| **D-3** | `PokemonMove` | `(moveId, ppUsed=0, ppUp=0, virtual: boolean)` | `(moveId, ppUsed=0, ppUp=0, maxPpOverride?: number)` | 旧 `virtual: boolean` 在锚点树**整体移除** → 虚拟性改由 `MoveUseMode`（`isVirtual(useMode)`）承载；**不再传第 4 参** | nianli（经 E5 修正后已不需要） |
| **D-4** | `globalScene.queueMessage` | `BattleScene.queueMessage(msg, delay?, defer?)` | `PhaseManager.queueMessage(message, callbackDelay?, prompt?, promptDelay?, defer?)` | 改为 `globalScene.phaseManager.queueMessage(...)`；`(msg, 0, true)` 形参位置**巧合对齐**（`callbackDelay=0, prompt=true`） | meloetta ×2 / mew ×4 / manaphy ×4 / chixin ×2 / healer ×1 |
| **D-5** | 道具类 `AirBalloonModifier` 等 7 类 | 存在（显式类） | **不存在**（全树含 `locales/` 命中 0） | 按「旧树过时类」处理（A0-E2 / O-7）：不迁类；`getConsumableClasses()` 只返回现存 2 类 | p5x |

---

## 2. 逐条论证

### D-1 `MoveEffectPhase`

**旧树**（产物 `class M1 extends In{constructor(s,i,A,a=!1,r=!1,O=!1,I=!1,S=!1)}` —— 注意此处 `M1` 的形参表与 `MovePhase` 同构，因为产物中 `M1` 是该模块的 `MoveEffectPhase` 短名，其**实际类体**见 `l(M1,"MoveEffectPhase")` 与 `getNewHitPhase(){return new M1(this.battlerIndex,this.targets,this.move)}`）：

| 位置 | 旧树形参 | 语义 |
|---|---|---|
| 3 | `move: PokemonMove` | 由 `new Ot(id,…)` 构造（`Ot` = `PokemonMove`，见 E5） |
| 4 | `reflected: boolean` | 是否反射招式（产物 @2136705：`new fA(…,this.reflected)`） |

**新树**：`MoveEffectPhase(battlerIndex, targets, move: Move, useMode: MoveUseMode)`，`useMode.REFLECTED` 即旧的 `reflected=true`。

**采用**：`nianli.tryNianLiBurst` 原产物 `reflected` 缺省（`undefined`⇒假）⇒ `MoveUseMode.NORMAL` 之外，还须承载 `PokemonMove.virtual=true` ⇒ **取 `MoveUseMode.INDIRECT`**（见 D-3 论证）。

**等价性**：`INDIRECT` 的定义（`#enums/move-use-mode.ts`）＝「由非 Instruct / 非上次招式的**回合外效果**调用；沿用 `IGNORE_PP` 的全部性质，且**不可被复制**，被绝大多数招式历史相关效果**跳过**」——与旧树 `PokemonMove{virtual:true}` + `MoveEffectPhase{reflected:false}` 的联合语义一致。

### D-2 `MovePhase`

**旧树**形参表（产物 `class d2 extends In{constructor(s,i,A,a=!1,r=!1,O=!1,I=!1,S=!1)`，字段赋值可读）：
`followUp=a, ignorePp=r, reflected=O, forcedLast=I, ignoreAssaultVest=S`。

**新树**：`(pokemon, targets, move, useMode, timingModifier = MovePhaseTimingModifier.NORMAL)`。

`MoveUseMode` 是**累积序**枚举（官方注释：*"Each one inherits the properties of all types preceding it"*）：`NORMAL(1) ⊂ IGNORE_PP(2) ⊂ INDIRECT(3) ⊂ FOLLOW_UP(4) ⊂ REFLECTED(5) ⊂ DELAYED_ATTACK(6)`。故旧树 3 个布尔 → 取**最右者**是唯一保序映射。

`forcedLast: true` ⇒ `MovePhaseTimingModifier.LAST`（该枚举与速度序**完全独立**，语义一致）。

`ignoreAssaultVest`：锚点树全树（含 `locales/`）**无 `Assault Vest` 道具**（`ASSAULT_VEST` 命中 0，见 A0-E2 同类证据）⇒ 该参数在新树**恒为无意义** ⇒ 丢弃**不改变行为**。

**dianxin 实际取值**：`followUp=!1, ignorePp=!0, reflected=!1, forcedLast=!1, ignoreAssaultVest=!1` ⇒ **`MoveUseMode.IGNORE_PP`**。

### D-3 `PokemonMove`

**旧树**：`PokemonMove(moveId, ppUsed, ppUp, virtual, maxPpOverride)`（产物 `class B1{constructor(s,i,A,a,r){…}}` + `l(B1,"PokemonMove")`）。
**新树**：`PokemonMove(moveId, ppUsed = 0, ppUp = 0, maxPpOverride?: number)` —— **`virtual` 已删除**（锚点树 v1.11.22 路线图：虚拟性收敛到 `MoveUseMode`）。

**采用**：`nianli` 依赖 `MoveEffectPhase` 第 3 参为 `Move`（D-1），因此**不再构造 `PokemonMove`**；「虚拟」语义由 `MoveUseMode.INDIRECT` 承载。

### D-4 `queueMessage` 宿主迁移

旧树 `BattleScene.queueMessage` → 新树 `PhaseManager.queueMessage`（`src/phase-manager.ts:436`）。新树签名首参 `message`、其后 `callbackDelay?: number|null`、`prompt?: boolean|null`、`promptDelay?: number|null`、`defer?: boolean|null`。

产物唯一 3 实参调用 `E.queueMessage(msg, 0, !0)` ⇒ `callbackDelay=0, prompt=true`，**与新树形参位置一致**，无需改动实参。

### D-5 7 个旧树道具类

`FocusSashModifier` / `RedCardModifier` / `AirBalloonModifier` / `ElectricSeedModifier` / `MistySeedModifier` / `PsychicSeedModifier` / `GrassySeedModifier`。

- 产物 `yde()` 返回 `[BerryModifier, PokemonInstantReviveModifier, …这 7 个]`（共 9）。
- 锚点树全树（含 `locales/`）搜 `FOCUS_SASH` / `RED_CARD` / `AIR_BALLOON` / 4 个 `*_SEED` ⇒ **命中 0**。
- ⇒ 这 7 类**不存在 ⇒ 不可能有实例** ⇒ `isP5XConsumableHeldItem` 的判定**结果不变**（被删去的类永不匹配任何 `item`）。
- 采用：`getConsumableClasses()` 只返回现存 2 类 + 在注释中登记 7 个旧树类（见 `p5x-system.ts`）。

---

## 3. 待办 / 风险

| 项 | 说明 | 归属 |
|---|---|---|
| 新增阶段注册 | `DianXinEchoEndPhase` / `NianLiBurstEndPhase` 必须进 `src/phase-manager.ts` 的 `PHASES`，否则 `Phase.phaseName: PhaseString` 联合不含它们（已加**标注块**注册） | A4-00 批 2b ✅ |
| `MoveEffectPhase` 第 3 参共享实例 | 采用 `allMoves[id]`（**共享 `Move` 单例**，上游通行做法，如 `DelayedAttackTag`）；须确认 `MoveEffectPhase` 不写该对象 | A4-01 走查 |
| D-2 折叠的实证 | `FORCED_LAST` ⇒ `MovePhaseTimingModifier.LAST` 目前**无 mod 调用点**（`forcedLast` 恒 `!1`），属预留；如后续出现须实测 | A4-02 |
| D-5 行为等价 | 需在「P5X 模式持有物上限」用例中回归（A4-01 逐系统走查 P5X 条目） | A4-01 |

---

*本台账随 A4-00 推进更新。*

---

## 4. 补充差异（2026-10-16 · A4-00 批 3b 实测新增）

| 编号 | 目标 API | 旧树（产物） | 新树（锚点树） | 采用映射 | 影响文件 |
|---|---|---|---|---|---|
| **D-6** | 音频播放 | `BattleScene.playSound(k)` / `playBgm(k)` / `fadeOutBgm(ms, fixed)` | **`audioManager.playSound/playBgm/fadeOutBgm`**（`#app/global-audio-manager`）| 宿主改 `audioManager.*` | pt-soudache（6 处） |
| **D-7** | `UiHandler.showText` 第 4 参 | `prompt: boolean`（产物实测传 `!0`） | `callbackDelay: number` | 产物 `!0` ⇒ 落位 **`0`**（`setTimeout(fn, true)` ≡ 1ms，**行为等价**） | pt-soudache（2 处） |
| **D-8** | `ArenaTag` 子类形态 | `super(tagType, turnCount, sourceMove, sourceId, side)`；`onAdd(pokemon, quiet)` / `onRemove(pokemon, quiet)` **方法** | ctor **无 tagType 参**（子类用 `abstract readonly tagType` 字段）；`onAdd/onRemove` 改为 **`get onAddMessageKey()/onRemoveMessageKey()` 抽象 getter** | ⚠️ **语义级重构**（非映射）⇒ **未完成，见 §5** | misc-legacy（2 个 tag 类） |

### 4.1 D-6 论证

上游 `AudioManager`（`src/audio/audio-manager.ts`）持有 `playSound` / `playBgm` / `fadeOutBgm`；
`BattleScene` 自身**不再**暴露这些（全树搜索 `battle-scene.ts` 内 `playSound(` 仅出现在**参数名**与 `addModifier` 的形参上）。
产物 `E.playSound(...)` / `E.playBgm(...)` / `E.fadeOutBgm(...)` 均为**旧树 `BattleScene` 直挂**形态。
⇒ 映射 `globalScene.*` → `audioManager.*`，**语义一致**（同为全局单例）。

### 4.2 D-7 论证

产物原码（`确定购买` 处）：
```js
a.showText(`确定购买 ${_.name}（${_.price}PT）吗？`, void 0, () => {
  a.setOverlayMode(V.CONFIRM, () => {...}, () => (a.revertMode(), !1))
}, !0)
```
第 4 实参为 `!0`（boolean）；而**同一产物**其他调用（`成功购买` 处）第 4 实参为 `800`（number）。
新树签名 `showText(text, delay?, callback?, callbackDelay?, prompt?, promptDelay?)` —— 第 4 位是 `callbackDelay: number`。
⇒ 产物 `!0` 处为**笔误**，运行时 `setTimeout(fn, true)` ≈ 1ms ⇒ 落位 `0`，**行为等价**。

### 4.3 ⚠️ 未完成项

| 项 | 说明 | 阻塞 |
|---|---|---|
| **D-8（`ArenaTag` 重构）** | `ChengfengTag` / `KONGJIANRoomTag` 需按新树模式重写：<br>① `super(tagType, …)` → 子类 `readonly tagType = …` + `super(turnCount, sourceMove, sourceId, side)`；<br>② `onAdd/onRemove` 方法 → `get onAddMessageKey()/onRemoveMessageKey()` + 其余逻辑迁移到合适钩子（`apply` / `lapse` / `onAdd` 是否仍在新树存在需核实）；<br>③ `ArenaTagType` 需扩展 `CHENGFENG` / `KONGJIAN`（⚠️ 会牵动 `ArenaTagTypeMap` / `SerializableArenaTagType` 约束） | **misc-legacy.ts 未并入** |
| **`qM`（深拷贝工具）** | 产物中**无 keepNames**，上游无同名导出 ⇒ 无法确证落点 | misc-legacy 挂账 |

---

## 5. D-8 / D-9 详析（2026-10-16 续 · misc-legacy 阻塞分析）

### 5.1 ✅ D-8 比预想温和（`ArenaTag` 可做）

新树 `ArenaTag`（`src/data/arena-tag.ts:113`）**保留了 `onAdd(quiet)` / `onRemove(quiet)` 方法**
（基类默认实现 = 按 `onAddMessageKey` / `onRemoveMessageKey` 发消息；子类可 `override` 追加逻辑）。

| 旧树（产物） | 新树 | 结论 |
|---|---|---|
| `super(tagType, turnCount, sourceMove, sourceId, side)` | ctor **无 tagType 参**；子类 `abstract readonly tagType` 字段 | 可映射 |
| `onAdd(arena, quiet)` / `onRemove(arena, quiet)` | `onAdd(quiet)` / `onRemove(quiet)`（**无 arena 参** ⇒ 用 `globalScene.arena`） | 可映射 |
| `apply(a, b, pokemon, holder, move)` | `apply(...args: unknown[])`（由 `arena.applyTags*` 调用方决定实参） | ⚠️ 调用点在 mod 未迁移部分 ⇒ **实参顺序待补迁时核对** |
| `ArenaTagType` 直接含 `CHENGFENG`/`KONGJIAN` | ❌ **不可 `declare module` 扩展**：`ArenaTagTypeMap` 是 **key-mapped 表**，`SerializableArenaTagType = Exclude<…>` ⇒ `SerializableArenaTagTypeMap = Pick<…>` 会失配 | 改用**字面量断言**（`"CHENGFENG" as SerializableArenaTagType`） |

### 5.2 🔴 D-9：`AbAttr` 家族钩子签名重构（**架构级**）

| 旧树（产物） | 新树（锚点树） |
|---|---|
| `canApply(pokemon, passive, simulated, args)` —— **位置参数** | `canApply(params: Closed<AbAttrBaseParams>)` —— **单一 params 对象** |
| `apply(pokemon, passive, simulated, args, ...)` —— 位置参数 | `apply(...)` 首参为 `AbAttrParams`（`Exact<Parameters<this["apply"]>[0]>`） |
| 专用钩子名：`canApplyPostSummon(pokemon)` / `applyPostSummon(pokemon)` | **不存在**；统一走 `AbAttr.canApply/apply` + `PostSummonAbAttr` 自身语义 |

⇒ **`FirefighterPostSummonAbAttr` / `FlipStatAbAttr` 无法机械映射**，须按 params 对象重写。
（对照：上游 `PostSummonAbAttr` ctor = `(showAbility = true, activateOnGain = true)`。）

### 5.3 🔴 misc-legacy 的挂账项

| 符号 | 产物 | 结论 |
|---|---|---|
| `mP` | `FormBlockDamageTag`（`l(pQ,"FormBlockDamageTag")` 有保名） | ❌ **锚点树全树（`BlockDamageTag`）命中 0** ⇒ 类不存在（mod 新增 / 旧树过时类）⇒ `IceFaceBlockDamageTag extends mP` **无法落位** |
| `qM` | 能力数组深拷贝 | ❌ 产物无 keepNames、上游无同名导出 ⇒ 无法确证 |

> **⇒ 结论**：`misc-legacy.ts` 需 **3 项独立工作**（D-8 重构 · D-9 重构 · 2 项挂账定性），
> **不是一次机械映射**。详见 `A4-00-前置-misc-legacy接入方案.md`。

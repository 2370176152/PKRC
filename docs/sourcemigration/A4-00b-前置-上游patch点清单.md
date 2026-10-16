# A4-00b 前置 —— **上游 patch 点清单**（扫荡结果）

> **起因**：A4-00b 未达标（(d1) 325 项未归零），根因指向「**A3 从未迁移 mod 对上游文件的修改**」。
> **本清单即该缺口的任务源。** · 日期：2026-10-16 · 锚点树 `90df65097b6df76f713e6bd108afa84499e8b993`

---

## 1. 结论

**检出 57 个上游 patch 宿主、258 次 mod 调用插入。**

| 对比 | 数量 |
|---|---:|
| **本次扫荡检出** | **57 个宿主 / 258 处插入** |
| A1.3 当时识别 | **7 条 patch** |
| 差距 | **8.1×** |

⇒ **A2/A3 的「上游改动清单」严重不完整**（只覆盖了 7 条），这是 (d1) 325 项的直接成因。

---

## 2. 方法（**代理判据**，需人工复核）

mod 若要生效，必须在**上游的类/函数**里插入对 mod 符号的调用 ⇒ 扫荡逻辑：

1. 取 mod 符号集（`src/data/systems/` 全部 `export` + tree-shake 差异中的 mod 符号，765 个）
2. 在产物里定位每个 mod 符号的**调用点**（1528 处）
3. 对每个调用点，向后找**最近的 `l(X,"原名")` 注记**，且满足双过滤：
   - ① 宿主真名**不在** mod 符号集（排除 mod 内部互相调用）
   - ② 宿主真名**在锚点树 `src/`（排除 `data/systems`）有声明**（确认是上游符号）
4. 汇总 ⇒ 57 个宿主

**⚠️ 局限（如实说明）**：
- 归属用「**调用点后 4,000 字符内最近的上游 keepNames**」近似 ⇒ 少数可能**跨函数误归属**（尤其在同一大函数内插入多处时）
- 只覆盖「**mod 符号被调用**」这一种 patch 形式；**mod 直接改写上游逻辑（不调用 mod 符号）**的情形检测不到
- ⇒ 本清单是**下界**，实际 patch 点 **≥ 57**

---

## 3. patch 点清单（**已精确复核**）

> ### 🔴 复核修正（2026-10-16）：**57 → 32 个宿主 · 258 → 66 处插入**
> §2 的 v1 粗筛用「调用点后 4,000 字符内最近的上游 keepNames」近似，
> 复核用**反向花括号配平**验证「调用点是否真落在宿主定义体内」⇒ **剔除 196 处跨函数误归属**。
> 典型误判：`SelectTargetPhase`(v1 报 36 处，**实际 0** —— 类体仅 903 字符) · `Terrain`(v1 报 35 处) · `Phase`(v1 报 20 处)。
> **交叉验证**：`TurnEndPhase` 复核得 **8 处**，与探针实测完全一致 ✅
>
> **⇒ 施工一律以本节的 32 宿主 / 66 处为准。**

### 3.1 精确清单（32 宿主 / 66 处）

| 上游宿主 | 上游文件 | 插入数 | mod 符号 |
|---|---|---:|---|
| `TurnEndPhase` | `phases\turn-end-phase.ts` | 8 | `applyBadDreamsTalentDamage` · `applySleepTurnEndRecovery` · `resetIceAgeTurnData` · `resetIndustrialAgeTurnData` · `resetInfoAgeTurnData` |
| `CommandPhase` | `phases\command-phase.ts` | 6 | `canEnterCallingCardTurnFor` · `consumeHealerWish` · `findJiemingSkill` · `getJiemingPokemon` · `healerWishReady` |
| `TurnStartPhase` | `phases\turn-start-phase.ts` | 5 | `applySeaGuardOpening` · `onMeloettaWaveStart` · `onNianLiTurnStart` · `refreshJiemingShare` · `tickP5XEffectsByTurn` |
| `getMoveTargets` | `data\moves\move-utils.ts` | 5 | `getHealerConversionTargetProvider` · `isEryouAllyTargetableSelfMove` · `isEryouTauntMove` · `markEryouPrimaryTargetSelect` |
| `MessageUiHandler` | `ui\handlers\message-ui-handler.ts` | 3 | `getPlayerNamePlaceholders` · `maskPlayerNames` · `unmaskPlayerNames` |
| `MessagePhase` | `phases\message-phase.ts` | 3 | `getPlayerNamePlaceholders` · `maskPlayerNames` · `unmaskPlayerNames` |
| `TargetSelectUiHandler` | `ui\handlers\target-select-ui-handler.ts` | 3 | `setP5XTurnOrderFocus` |
| `GameOverPhase` | `phases\game-over-phase.ts` | 2 | `applyGainMultiplier` · `partyConstellationGainMultiplier` |
| `SessionSlot` | `ui\handlers\save-slot-select-ui-handler.ts` | 2 | `eryouSessionLabel` · `eryouWaveLabel` |
| `RunEntryContainer` | `ui\handlers\run-history-ui-handler.ts` | 2 | `eryouSessionLabel` · `eryouWaveLabel` |
| `SwitchPhase` | `phases\switch-phase.ts` | 2 | `hasJiemingConstellation` · `isP5XRestrictedTierSpecies` |
| `CheckSwitchPhase` | `phases\check-switch-phase.ts` | 2 | `hasJiemingConstellation` · `isP5XRestrictedTierSpecies` |
| `FaintPhase` | `phases\faint-phase.ts` | 2 | `hasJiemingConstellation` · `isP5XRestrictedTierSpecies` |
| `PokerogueApi` | `api\api.ts` | 2 | `isHealBlocked` · `refreshInfo` |
| `MoveEndPhase` | `phases\move-end-phase.ts` | 2 | `tickJiemingCooldownsByAllyAction` · `trySeaGuardChase` |
| `MoneyRewardModifier` | `modifier\modifier.ts` | 1 | `applyPtMultiplier` |
| `DamageMoneyRewardModifier` | `modifier\modifier.ts` | 1 | `applyPtMultiplier` |
| `InfatuatedTag` | `data\battler-tags.ts` | 1 | `hasZicanTalent` |
| `BattleEndPhase` | `phases\battle-end-phase.ts` | 1 | `hideP5XTurnOrderBar` |
| `SelectModifierPhase` | `phases\select-modifier-phase.ts` | 1 | `initializeTalentSystem` |
| `StatStageChangeAttr` | `data\moves\move.ts` | 1 | `isEryouAllySelfBuffMove` |
| `AddBattlerTagAttr` | `data\moves\move.ts` | 1 | `isEryouAllyTargetableSelfMove` |
| `CallMoveAttr` | `data\moves\move.ts` | 1 | `isEryouAllyTargetableSelfMove` |
| `UiInputs` | `ui-inputs.ts` | 1 | `isEryouContext` |
| `isMobile` | `touch-controls.ts` | 1 | `isJiemingRoot` |
| `SwitchSummonPhase` | `phases\switch-summon-phase.ts` | 1 | `isP5XFieldable` |
| `RemoveHeldItemAttr` | `data\moves\move.ts` | 1 | `markP5XConsumableUsedThisWave` |
| `BerryPhase` | `phases\berry-phase.ts` | 1 | `p5xTryUseConsumableThisWave` |
| `EatBerryAttr` | `data\moves\move.ts` | 1 | `p5xTryUseConsumableThisWave` |
| `StealEatBerryAttr` | `data\moves\move.ts` | 1 | `p5xTryUseConsumableThisWave` |
| `TitlePhase` | `phases\title-phase.ts` | 1 | `resetTalentManager` |
| `CommandUiHandler` | `ui\handlers\command-ui-handler.ts` | 1 | `setP5XTurnOrderFocus` |

---

## 3.5 v1 粗筛清单（**作废，仅存档**）

### 3.6 v1 粗筛（按层） patch 点清单（按上游分层）

### Phase 层（阶段生命周期）（19 处）

| 上游宿主 | 上游文件 | mod 调用 | 被插入的 mod 符号 |
|---|---|---:|---|
| `SelectTargetPhase` | `phases\select-target-phase.ts` | 36 | `applyHealerCleanse` · `applyHealerOnMoveUse` · `currentActionKey$1` · `currentRoundKey$1` …(+24) |
| `Phase` | `phase.ts` | 20 | `applyCallingCardOnHit` · `callingCardGainDelta` · `callingCardLevelOf` · `callingCardMaxFor` …(+8) |
| `BerryPhase` | `phases\berry-phase.ts` | 8 | `getUsedConsumableIds` · `isP5XConsumableHeldItem` · `markP5XConsumableUsedThisWave` · `p5xTryUseConsumableThisWave` …(+1) |
| `DamageAnimPhase` | `phases\damage-anim-phase.ts` | 7 | `chooseEryouRefinement` · `classifyEryouStatusMove` · `getEryouAiTier` · `refineEryouEnemyMove` …(+2) |
| `CommandPhase` | `phases\command-phase.ts` | 6 | `canEnterCallingCardTurnFor` · `consumeHealerWish` · `findJiemingSkill` · `getJiemingPokemon` …(+2) |
| `MoneyRewardPhase` | `phases\money-reward-phase.ts` | 6 | `eryouRepeatRun` · `eryouSessionLabel` · `rollEryouRewards` · `setPendingEryouRun` |
| `TurnStartPhase` | `phases\turn-start-phase.ts` | 5 | `applySeaGuardOpening` · `onMeloettaWaveStart` · `onNianLiTurnStart` · `refreshJiemingShare` …(+1) |
| `MessagePhase` | `phases\message-phase.ts` | 3 | `getPlayerNamePlaceholders` · `maskPlayerNames` · `unmaskPlayerNames` |
| `TurnEndPhase` | `phases\turn-end-phase.ts` | 2 | `applyBadDreamsTalentDamage` · `settleP5XRoundEffects` |
| `GameOverPhase` | `phases\game-over-phase.ts` | 2 | `applyGainMultiplier` · `partyConstellationGainMultiplier` |
| `SwitchPhase` | `phases\switch-phase.ts` | 2 | `hasJiemingConstellation` · `isP5XRestrictedTierSpecies` |
| `CheckSwitchPhase` | `phases\check-switch-phase.ts` | 2 | `hasJiemingConstellation` · `isP5XRestrictedTierSpecies` |
| `FaintPhase` | `phases\faint-phase.ts` | 2 | `hasJiemingConstellation` · `isP5XRestrictedTierSpecies` |
| `MoveEndPhase` | `phases\move-end-phase.ts` | 2 | `tickJiemingCooldownsByAllyAction` · `trySeaGuardChase` |
| `BattleEndPhase` | `phases\battle-end-phase.ts` | 1 | `hideP5XTurnOrderBar` |
| `SelectModifierPhase` | `phases\select-modifier-phase.ts` | 1 | `initializeTalentSystem` |
| `SwitchSummonPhase` | `phases\switch-summon-phase.ts` | 1 | `isP5XFieldable` |
| `TitlePhase` | `phases\title-phase.ts` | 1 | `resetTalentManager` |
| `PostGameOverPhase` | `phases\post-game-over-phase.ts` | 1 | `setPendingEryouRun` |

### 数据层（Terrain / Move / Pokemon / tag）（13 处）

| 上游宿主 | 上游文件 | mod 调用 | 被插入的 mod 符号 |
|---|---|---:|---|
| `Terrain` | `data\terrain.ts` | 35 | `anyPlayerFieldHasNode` · `applyDianXinOnHit` · `applyElectrified` · `applyP5XEffect` …(+15) |
| `getDailyRunStarters` | `data\daily-seed\daily-run.ts` | 11 | `buildEryouMoveset` · `isEryouBannedForm` · `isEryouBannedMove` · `isEryouReplacedMove` …(+2) |
| `getMoveTargets` | `data\moves\move-utils.ts` | 8 | `getHealerConversionTargetProvider` · `isEryouAllyTargetableSelfMove` · `isEryouTauntMove` · `isSpreadEnemyTargetInEryou` …(+1) |
| `AddBattlerTagAttr` | `data\moves\move.ts` | 7 | `isEryouAllyProtectMove` · `isEryouAllySelfBuffMove` · `isEryouAllyTargetableSelfMove` · `isEryouTauntMove` |
| `Status` | `data\status-effect.ts` | 2 | `getHealerConversionTargetProvider` · `setHealerConversionTargetProvider` |
| `DoublePowerChanceAttr` | `data\moves\move.ts` | 2 | `getTalentManager` |
| `Pokemon` | `field\pokemon.ts` | 2 | `isP5XConsumableHeldItem` · `p5xTryUseConsumableThisWave` |
| `StealEatBerryAttr` | `data\moves\move.ts` | 2 | `p5xTryUseConsumableThisWave` · `resetP5XConsumableUseThisWave` |
| `InfatuatedTag` | `data\battler-tags.ts` | 1 | `hasZicanTalent` |
| `StatStageChangeAttr` | `data\moves\move.ts` | 1 | `isEryouAllySelfBuffMove` |
| `CallMoveAttr` | `data\moves\move.ts` | 1 | `isEryouAllyTargetableSelfMove` |
| `RemoveHeldItemAttr` | `data\moves\move.ts` | 1 | `markP5XConsumableUsedThisWave` |
| `EatBerryAttr` | `data\moves\move.ts` | 1 | `p5xTryUseConsumableThisWave` |

### system / utils（6 处）

| 上游宿主 | 上游文件 | mod 调用 | 被插入的 mod 符号 |
|---|---|---:|---|
| `initGameSpeed` | `system\game-speed.ts` | 12 | `ensureP5XTurnOrderBar` · `hideP5XTurnOrderBar` · `hideP5XTurnOrderDetail` · `updateP5XTurnOrderBar` |
| `getUnlockableName` | `system\unlockables.ts` | 10 | `armJiemingCooldowns` · `buildEryouMoveset` · `describeEryouMechanism` · `getEryouMoveset` …(+6) |
| `getVariantTint` | `sprites\variant.ts` | 9 | `getConfig` · `getPlayerNamePlaceholders` · `isDebugEnabled` · `maskPlayerNames` …(+2) |
| `Achv` | `system\achv.ts` | 2 | `getJiemingModuleFor` · `registerJiemingModule` |
| `randomString` | `utils\common.ts` | 1 | `healerResourceAvailable` |
| `getModifierType` | `utils\modifier-utils.ts` | 1 | `reducedWeightInPtSoudache` |

### UI 层（handlers / containers / battle-info）（13 处）

| 上游宿主 | 上游文件 | mod 调用 | 被插入的 mod 符号 |
|---|---|---:|---|
| `PlayerBattleInfo` | `ui\battle-info\player-battle-info.ts` | 9 | `callingCardLevelOf` · `callingCardMaxFor` · `chiXinMaxFor` · `chiXinNodeActive` …(+5) |
| `StatsContainer` | `ui\containers\stats-container.ts` | 3 | `constellationChoiceOptions` · `constellationRefund` · `hasExclusiveNode$1` |
| `hpFrame` | `ui\battle-info\battle-info.ts` | 3 | `findP5XStatusIcon` · `getP5XCustomStatusIndicators` · `p5xStatusIconDescription` |
| `displayName` | `ui\battle-info\battle-info.ts` | 3 | `getJiemingTargets` · `isSkillReady` · `skillCooldownRemaining` |
| `MessageUiHandler` | `ui\handlers\message-ui-handler.ts` | 3 | `getPlayerNamePlaceholders` · `maskPlayerNames` · `unmaskPlayerNames` |
| `TargetSelectUiHandler` | `ui\handlers\target-select-ui-handler.ts` | 3 | `setP5XTurnOrderFocus` |
| `SessionSlot` | `ui\handlers\save-slot-select-ui-handler.ts` | 2 | `eryouSessionLabel` · `eryouWaveLabel` |
| `RunEntryContainer` | `ui\handlers\run-history-ui-handler.ts` | 2 | `eryouSessionLabel` · `eryouWaveLabel` |
| `Image` | `extensions.ts` | 2 | `healerDataOf` · `inCallingCardExtraTurn` |
| `DropDown` | `ui\containers\dropdown.ts` | 1 | `EryouShellTrapDelayAttr` |
| `UiInputs` | `ui-inputs.ts` | 1 | `isEryouContext` |
| `isMobile` | `touch-controls.ts` | 1 | `isJiemingRoot` |
| `CommandUiHandler` | `ui\handlers\command-ui-handler.ts` | 1 | `setP5XTurnOrderFocus` |

### Modifier 层（5 处）

| 上游宿主 | 上游文件 | mod 调用 | 被插入的 mod 符号 |
|---|---|---:|---|
| `MoneyRewardModifier` | `modifier\modifier.ts` | 1 | `applyPtMultiplier` |
| `DamageMoneyRewardModifier` | `modifier\modifier.ts` | 1 | `applyPtMultiplier` |
| `TerastallizeModifierType` | `modifier\modifier-type.ts` | 1 | `canPokemonActivateTalentRelease` |
| `ModifierBar` | `modifier\modifier.ts` | 1 | `getTalentManager` |
| `lureWeightFunc` | `modifier\init-modifier-pools.ts` | 1 | `reducedWeightInPtSoudache` |

### 其它（1 处）

| 上游宿主 | 上游文件 | mod 调用 | 被插入的 mod 符号 |
|---|---|---:|---|
| `PokerogueApi` | `api\api.ts` | 2 | `isHealBlocked` · `refreshInfo` |


---

## 4. 对 325 项归属的判定建议

| 判据 | 结论 |
|---|---|
| 325 项符号是否由 22 文件承载？ | ✅ 是（都在 `src/data/systems/`） |
| 修复是否仅需「接入钩子」？ | ❌ **否** —— 钩子的**调用点在上游文件里**，须先迁移 57 个 patch 点 |
| 57 个 patch 点是否在 A3 的 22 文件范围内？ | ❌ **不在**（它们是**上游文件的改动**，不是 mod 新增文件） |
| **⇒ 建议判定** | **判 (d2) A3 范围缺口，挂账**；修复路径 = 迁移本清单的 57 个 patch 点 |

**理由**：A3 的范围定义是「**22 个 mod 新增文件**」。patch 点属于「**mod 对上游的改动**」——
这是**另一类交付物**，A3 从未把它列入范围（A1.3 的 7 条是仅有的例外，且随后也未迁）。
把 325 项判为 (d1)「A4-00 范围内」会得出「A4-00 交付不完整」的结论 —— 但 A4-00 的定义（O-8 决议）
**明确只要求「22 文件可编译」**，两者不矛盾。

> **⇒ 需 owner 批准**：新增「**(d2)-4 上游 patch 点**」子类；325 项挂账；A4-01 以本清单为驱动表。

---

## 5. 执行路径（若获批）

| 步 | 内容 |
|---|---|
| 1 | **逐 patch 点提取**：在产物里定位该宿主的方法体，抽取 mod 插入的代码 |
| 2 | **还原**：在锚点树对应上游文件里以**标注块**插入（`▼▼▼ PKRC 魔改 patch: <宿主>.<方法> ▲▲▼`） |
| 3 | 每个 patch 点后**增量 `tsc`**；每批后 `vite build` |
| 4 | 重跑 `node tools/verify-signature.cjs` ⇒ 观察 (d1) 325 项**收敛** |
| 5 | 完成后重跑 A4-00b 五项判据 |

**优先级建议**（按被插入的 mod 调用数）：

| 优先级 | patch 宿主 | 调用数 | 影响系统 |
|---:|---|---:|---|
| P0 | `SelectTargetPhase` | 36 | healer / jieming / p5x / chichi |
| P0 | `Terrain` | 35 | dianxin / p5x |
| P0 | `Phase` | 20 | callingcard |
| P0 | `initGameSpeed` | 12 | p5x（回合顺序条） |
| P0 | `getDailyRunStarters` / `getUnlockableName` | 11 / 10 | ERYOU |
| P1 | `PlayerBattleInfo` · `getVariantTint` · `getMoveTargets` · `BerryPhase` · `DamageAnimPhase` · `AddBattlerTagAttr` | 7~9 | 多系统 |
| P1 | 各 `*Phase`（Berry/Command/TurnStart/MoneyReward/TurnEnd/Switch/Faint/MoveEnd…） | 1~6 | 多系统 |
| P2 | UI 层 13 处（`MessageUiHandler` / `StatsContainer` / `hpFrame` …） | 1~3 | UI（**前端 U 组**） |
| P2 | `Modifier` 层 5 处 | 1 | pt-soudache / talent |

---

**数据产物**：`.build-tools/a4/patch-points.json`（含每个宿主的完整 mod 符号清单）
**脚本**：`.build-tools/a4/b9-patch-scan.py`（可复跑）


---

## 6. ✅ 探针实测（2026-10-16）—— **流水线跑通，但成本与充分性需正视**

### 6.1 探针内容：`TurnEndPhase`（回合生命周期）

在 `src/phases/turn-end-phase.ts` 落 **8 处** mod 插入（`▼▼▼ PKRC 魔改 patch ▲▲▲` 标注块）：

| # | 插入 | 真名 | 位置 |
|---|---|---|---|
| 1 | `if (!globalScene.gameMode?.isP5X) settleP5XRoundEffects();` | `settleP5XRoundEffects` | `super.start()` 后（产物为 `isP5X \|\| cw()` ⇒ **P5X 模式跳过**） |
| 2-3 | `applySleepTurnEndRecovery(pokemon); applyBadDreamsTalentDamage(pokemon);` | 同左 | `handlePokemon` 内 |
| 4-8 | `try { reset<Ice/Stone/Industrial/Info/Totem>AgeTurnData(); } catch {}` ×5 | 同左 | 末尾（**原样保留产物的 `try/catch` 容错**） |

⚠️ **附带发现**：8 个符号中 **6 个在 22 文件里根本不存在**（`applySleepTurnEndRecovery` + 5 个 `reset*AgeTurnData`，
全在 talent 缺口清单里）⇒ 本次以 **export 空实现占位**（明确标注「功能未生效」）承接。

### 6.2 实测结果

| 指标 | A4-00 后 | 探针后 | Δ |
|---|---:|---:|---:|
| 覆盖率 | 65.63% | **66.08%** | **+0.45 pt** |
| 命中 | 2,051 | **2,065** | **+14** |
| tree-shake 差异 | 365 | **357** | **−8** |
| 未定性残差 | 658 | 652 | −6 |
| 核心上游符号 | 11/11 | **11/11** | — |
| `tsc` / `vite build` | EXIT=0 | **EXIT=0** | 0 回归 |

**⇒ 8 处插入 → 8 项收敛（1:1 对应）；流水线（复核坐标 → 提取 → 还原 → `tsc` → `build` → `verify`）**验证可行**。**

### 6.3 🔴 两个必须正视的结论

**(1) 收敛是 1:1 的，没有「连锁自动恢复」**
325 项中占大头（198 项）的「内部辅助」**不会**因为上游接了一个钩子就自动进 bundle ——
它们的入口（如 `applyChiXinOnHit` / `applyNianLiOnMoveUse`）**本身还没被调用**。
⇒ **必须逐个接 57 个宿主**，估算 **12~19 轮**同等工作量。

**(2) patch 点迁移 ≠ 功能恢复**（**必要但远不充分**）
本次 8 个符号中 6 个是**空实现占位** ⇒ 即使被调用，**功能也不生效**。
真正恢复功能需要**两条同时做**：

| 层 | 内容 | 规模 |
|---|---|---|
| **① 补 mod 函数实现** | (d2) 符号缺口（talent 107 / jieming 31 / ERYOU 586 …） | 大 |
| **② 迁 patch 点** | 本清单 57 个宿主 | 中 |

### 6.4 ⇒ 建议（修正 §4/§5）

**不建议**现在孤军深入只做 patch 迁移。理由：
- 单独做 ② 只能让签名数字好看，**功能依旧缺失**（甚至产生「已接入」的错觉）
- ①② 必须**成对做**才能验证效果（否则走查时无法区分「没接上」与「接上了但实现是空的」）

**⇒ 建议**：把「① 符号缺口 + ② patch 点」**合并为一个「A3-补」任务包**，
以 **patch 宿主为单位**推进（每个宿主：**补其调用的 mod 函数实现** + **落 patch**），
做完一个宿主就跑一次 `verify-signature` + 走查该功能 —— 保证每步都可验证。

**优先级**（按被插入的 mod 调用数 × 功能影响）：
`SelectTargetPhase`(36) → `Terrain`(35) → `Phase`(20) → `initGameSpeed`(12) → `getDailyRunStarters`(11) → `getUnlockableName`(10) …


---

## 7. 🔴 粒度分类（2026-10-16）—— **89% 是「功能级改写」，不是「插入调用」**

### 7.1 分类结果

判据：看 mod 调用点在类体里的**上下文形态** ——
独立语句（`try{ f(); }catch{}` / `f();`）⇒ **A 类（机械插入）**；
嵌在逻辑里（`if(…f()…)` / `case …: f()` / `this.f()` / 三元）⇒ **B 类（功能改写）**。

| 类别 | 宿主数 | 插入数 |
|---|---:|---:|
| **A 类**（机械插入） | 1 | 7 |
| **B 类**（功能改写） | **27** | **57** |
| 混合 | 3 | — |
| **合计** | **31** | **64** |

> **⇒ B 类占 57/64 ≈ 89%。**

**A 类宿主**：`TitlePhase`
**B 类宿主**（27 个）：`CommandPhase` · `getMoveTargets` · `MessagePhase` · `TargetSelectUiHandler` ·
`GameOverPhase` · `RunEntryContainer` · `SwitchPhase` · `CheckSwitchPhase` · `FaintPhase` ·
`PokerogueApi` · `CommandUiHandler` · `MoveEndPhase` · `MoneyRewardModifier` · `DamageMoneyRewardModifier` ·
`InfatuatedTag` · `BattleEndPhase` · `SelectModifierPhase` · `StatStageChangeAttr` · `AddBattlerTagAttr` ·
`CallMoveAttr` · `UiInputs` · `isMobile` · `SwitchSummonPhase` · `RemoveHeldItemAttr` · `BerryPhase` ·
`EatBerryAttr` · `StealEatBerryAttr`

### 7.2 🔴 这改变了工作量性质

「插入调用」= 补迁移；「**功能级改写**」= **在上游重新实现 mod 的功能**（改枚举 / 加方法 / 改造逻辑）。
**89% 属后者** ⇒ 这不是「再补一批文件」，而是**重建 mod 的上游改写层**。

**证据（`CommandPhase`）**：mod 改动含 `Command` 枚举新增 `CALLING_CARD`/`WISH` +
`CommandPhase` 新增 `handleCallingCardCommand`/`handleWishCommand` +
`CommandUiHandler` 新增 3 个 `refresh*Button` + 多处 `!isP5X` 守卫 ⇒ 跨 3 个类联动。

### 7.3 事件钩子方案 —— **只能覆盖 4~6 个宿主**

上游有 **13 个事件类 / 17 处 `dispatchEvent`**：

| 事件 | 可替代的宿主 |
|---|---|
| `TurnEndEvent` / `TurnInitEvent` | `TurnEndPhase` · `TurnStartPhase` |
| `MoveUsedEvent` | `CallMoveAttr`（+ `data/moves/move.ts` 相关） |
| `BerryUsedEvent` | `BerryPhase` · `EatBerryAttr` · `StealEatBerryAttr` |
| `TagAddedEvent` / `TagRemovedEvent` / `TerrainChangedEvent` / `WeatherChangedEvent` | （未被本清单的宿主使用） |

⇒ **26/32 宿主无对应事件**，仍须改上游代码。
**但仍有价值**：这 4~6 个用 `globalScene.eventTarget.addEventListener(...)` 注册 ⇒ **零上游改动**（升级友好）。

### 7.4 完整清单（含粒度与事件覆盖）

| 上游宿主 | 上游文件 | 处数 | 粒度 | 上游事件 |
|---|---|---:|---|---|
| `TurnEndPhase` | `phases/turn-end-phase.ts` | 8 | A+B | ✅ TurnEndEvent |
| `CommandPhase` | `phases/command-phase.ts` | 6 | B | — |
| `TurnStartPhase` | `phases/turn-start-phase.ts` | 5 | A+B | ✅ TurnInitEvent |
| `getMoveTargets` | `data/moves/move-utils.ts` | 5 | B | — |
| `MessagePhase` | `phases/message-phase.ts` | 3 | B | — |
| `TargetSelectUiHandler` | `ui/handlers/target-select-ui-handler.ts` | 3 | B | — |
| `GameOverPhase` | `phases/game-over-phase.ts` | 2 | B | — |
| `SessionSlot` | `ui/handlers/save-slot-select-ui-handler.ts` | 2 | A+B | — |
| `RunEntryContainer` | `ui/handlers/run-history-ui-handler.ts` | 2 | B | — |
| `SwitchPhase` | `phases/switch-phase.ts` | 2 | B | — |
| `CheckSwitchPhase` | `phases/check-switch-phase.ts` | 2 | B | — |
| `FaintPhase` | `phases/faint-phase.ts` | 2 | B | — |
| `PokerogueApi` | `api/api.ts` | 2 | B | — |
| `CommandUiHandler` | `ui/handlers/command-ui-handler.ts` | 2 | B | — |
| `MoveEndPhase` | `phases/move-end-phase.ts` | 2 | B | — |
| `MoneyRewardModifier` | `modifier/modifier.ts` | 1 | B | — |
| `DamageMoneyRewardModifier` | `modifier/modifier.ts` | 1 | B | — |
| `InfatuatedTag` | `data/battler-tags.ts` | 1 | B | — |
| `BattleEndPhase` | `phases/battle-end-phase.ts` | 1 | B | — |
| `SelectModifierPhase` | `phases/select-modifier-phase.ts` | 1 | B | — |
| `StatStageChangeAttr` | `data/moves/move.ts` | 1 | B | — |
| `AddBattlerTagAttr` | `data/moves/move.ts` | 1 | B | — |
| `CallMoveAttr` | `data/moves/move.ts` | 1 | B | ✅ MoveUsedEvent |
| `UiInputs` | `ui-inputs.ts` | 1 | B | — |
| `isMobile` | `touch-controls.ts` | 1 | B | — |
| `SwitchSummonPhase` | `phases/switch-summon-phase.ts` | 1 | B | — |
| `RemoveHeldItemAttr` | `data/moves/move.ts` | 1 | B | — |
| `BerryPhase` | `phases/berry-phase.ts` | 1 | B | ✅ BerryUsedEvent |
| `EatBerryAttr` | `data/moves/move.ts` | 1 | B | ✅ BerryUsedEvent |
| `StealEatBerryAttr` | `data/moves/move.ts` | 1 | B | ✅ BerryUsedEvent |
| `TitlePhase` | `phases/title-phase.ts` | 1 | A | — |

---

## 8. 方案对比与建议（**需 owner 决策**）

| 方案 | 做法 | 优 | 劣 | 粗估 |
|---|---|---|---|---|
| **① 全量补迁** | 32 宿主逐个还原 | 完整 | **≈80 轮**；且改枚举/逻辑的正确性**只能靠运行游戏验证** | 大 |
| **② 分层增量**（**推荐**） | 第 1 层：事件可替代的 4~6 宿主（**零上游改动**）→ 第 2 层：A 类 `TitlePhase` → 第 3 层：B 类按**功能优先级**分批（战斗相关优先，UI 类转 **U 组**） | 可排期、可增量验证、每层独立交付 | 需先定优先级 | 可分 3 批 |
| **③ 重新设计接入层** | 不用逐点 patch，改为「mod 订阅上游事件 + 少量必要改写」 | 升级友好 | 上游事件覆盖不足（仅 6/32），**做不全** | 中（但覆盖不全） |

**推荐 ②**：理由 ——
- 事件层（4~6 个）能**零改动**拿下，是最划算的起点
- B 类按功能价值分批，**战斗相关（`CommandPhase`/`getMoveTargets`/`SwitchPhase`/`FaintPhase`/`MoveEndPhase`/`BattleEndPhase`）优先**
- UI 类（`TargetSelectUiHandler`/`CommandUiHandler`/`RunEntryContainer`/`SessionSlot`）**转前端 U 组**，不计入全栈

**⚠️ 必须先确认的口径**：`A4-00b` 判据 ⑤ 是否要求「**全部 32 宿主完成**」才算过？
若按「补迁移」口径则须完成；若可接受「事件层 + A 类 + 战斗相关 B 类」作为 (d2) 第一档交付，则 M3 可先行成立。


---

## 9. 🔴🔴 第三层过滤：**「同义重构」vs「真 patch」**（2026-10-16）

### 9.1 发现

做批次 1（`MessagePhase` + `MessageUiHandler`）时发现：

| | 产物（modder 发行） | 锚点树（上游） |
|---|---|---|
| `MessagePhase.start()` | `const s = getPlayerNamePlaceholders(); this.text = maskPlayerNames(this.text, s); … this.text = unmaskPlayerNames(this.text, s)` | **内联等价逻辑**：`const pokename = []; const repname = ["#POKEMON1","#POKEMON2"]; … text.split(pokename[p]).join(repname[p])` |
| `MessageUiHandler.showTextInternal()` | 同上（三函数） | **同上（内联）**（`message-ui-handler.ts:80-105`） |

⇒ **上游本来就有这段逻辑；mod 只是把它重构成「调用 `mod-utils` 的三个函数」。**
**功能等价 ⇒ 这两处 patch 不需要迁移。**

（也解释了为什么 `getPlayerNamePlaceholders`/`maskPlayerNames`/`unmaskPlayerNames` 会落在 tree-shake 差异里 ——
锚点树用的是内联版，这三个函数**没人调用**。）

### 9.2 ⇒ 清单需要**第三层过滤**

| 层 | 判据 | 处置 |
|---|---|---|
| 第一层（已做） | mod 调用点是否真落在宿主定义体内 | 剔除 196 处误归属（57→32 宿主） |
| 第二层（已做） | 调用形态：独立语句 / 逻辑嵌入 | A 类 7 处 · B 类 57 处 |
| **第三层（本轮新增）** | **上游是否已有等价实现** | **同义重构 ⇒ 不需迁移**；上游无对应逻辑 ⇒ **真 patch** |

**⇒ 第三层的判定方法**：逐宿主对照「产物类体片段」与「锚点树同类体」，看 mod 逻辑是否**已在上游存在**（只是写法不同）。

### 9.3 已判定（批次 1）

| 宿主 | 判定 | 依据 |
|---|---|---|
| `MessagePhase` | ✅ **同义重构（不需迁移）** | 上游已有 `pokename`/`repname` 内联逻辑 |
| `MessageUiHandler` | ✅ **同义重构（不需迁移）** | 同上（`message-ui-handler.ts:80-105`） |

**待判定：其余 29 个宿主。**

> **⇒ 若第三层过滤的命中率与批次 1 相当，31 宿主的真实工作量可能显著低于 §7 的估算。**
> **下一步：对剩余 29 个宿主逐个做第三层判定**（批量输出「产物片段 + 锚点树类体」对照材料）。


---

## 10. 批次执行记录（2026-10-16）

### 10.1 批次 1：`MessagePhase` / `MessageUiHandler` —— **同义重构，不需迁移**

见 §9。**⇒ 已从待做清单移除（31 → 29）**。

### 10.2 批次 2：`TurnStartPhase` ✅ 已迁移（4 处生效 + 1 处挂账）

| 插入 | 真名 | 实现状态 | 处置 |
|---|---|---|---|
| `try{ JTe() }catch{ console.error("[海之守护] 开演之时铺层失败:") }` | `applySeaGuardOpening` | ✅ manaphy-system | **已落** |
| `try{ SPe() }catch{ console.error("[念力] 每轮开始加层失败:") }` | `onNianLiTurnStart` | ✅ nianli-system | **已落** |
| `try{ zSe() }catch{ console.error("[美洛耶塔] 每波节拍下限失败:") }` | `onMeloettaWaveStart` | ✅ meloetta-system | **已落** |
| `if(E.gameMode.isP5X) return TLe(), E.pushPhase(new sD), this.end()` | `refreshJiemingShare` + **`SpeedTurnPhase`** | ⚠️ 后者**是 mod 新增 Phase** | **挂账**（见 10.3） |

**实测**：`tsc`/`build` 双绿；命中 **2065 → 2078（+13）**、tree-shake 差异 **357 → 344（−13）**、覆盖率 **66.08% → 66.50%**。

> ✅ **重要**：**4 个入口 → 13 项收敛**（**不是 1:1**）——
> 因为本次接入的是**有下游调用链**的入口，整条链被带进 bundle。
> （对比：`TurnEndPhase` 的 8 个符号多为链尾，故 8→8。）
> ⇒ **优先接「有下游链的入口」，收敛效率更高。**

### 10.3 🔴 新发现：**patch 的目标符号本身可能是 mod 新增**

`TurnStartPhase` 的 P5X 分支引用了 **`SpeedTurnPhase`** ——
`l(mu,"SpeedTurnPhase")` 在产物中存在，但锚点树 **`src/phases/` 无此文件** ⇒ **它是 mod 新增的 Phase**。
且其类体依赖 `R0e` / `PRe` / `vB` / `tD` / `zh` / `zU` / `iD` / `fC` 等**尚未迁移的符号**。

⇒ **patch 迁移存在「链式依赖」**：patch 引用的目标可能需要先迁。
本轮按**挂账**处理（保留注释 + 不还原该分支，当前行为 = 上游原样）。

### 10.4 累计进度

| 项 | 状态 |
|---|---|
| 待做宿主 | **29**（原 31，批次 1 剔除 2 个同义重构） |
| 已完成 | `TurnEndPhase`(8) · `TurnStartPhase`(4+1挂账) |
| 已判定真 patch 待做 | `TitlePhase` · `FaintPhase` · `SwitchPhase` · `CheckSwitchPhase` · `getMoveTargets` |
| 待判定 | 24 个 |
| **累计收敛** | tree-shake 差异 **365 → 344（−21）**；覆盖率 **65.63% → 66.50%** |

### 10.5 执行节奏（每批次）

```
1. 第三层判定：对照产物片段与锚点树类体（同义重构 ⇒ 跳过）
2. 查 mod 符号实现状态（缺失 ⇒ 先补实现或挂账）
3. 落 patch（▼▼▼ PKRC 魔改 patch ▲▲▲ 标注块，中文串逐字保留）
4. tsc → build → verify-signature（记录收敛数）
```


### 10.6 批次 3a：`SwitchPhase` + `CheckSwitchPhase` ✅

| 宿主 | mod 意图 | 落法 |
|---|---|---|
| `CheckSwitchPhase` | P5X 模式改用 `hasP5XSwitchCandidate()` 判定（**mod 新增方法**） | 加 `if (isP5X) { … } else if (…)` 分支 + 新增 `private hasP5XSwitchCandidate()` |
| `SwitchPhase` | 模态跳过判定里排除「有解明命座」「P5X 限制级」候选 | **按新树结构适配**（见下） |

**实测**：`tsc`/`build` 双绿；命中 **2078 → 2079（+1）**、tree-shake 差异 **344 → 343（−1）**、覆盖率 **66.50% → 66.53%**。

#### 🔴 新发现：**B 类需要「新树结构适配」**

`SwitchPhase` 的判定在新树**已被上游重构**：

| | 判定式 |
|---|---|
| 产物（旧树） | `!getPlayerParty().filter(p => p.isAllowedInBattle() && !p.isActive(true) && (**!isP5X \|\| (!hasJiemingConstellation(p) && !isP5XRestrictedTierSpecies(p.species))**)).length` |
| 锚点树（新树） | `getPokemonAllowedInBattle().every(p => p.isOnField())` |

⇒ **mod 改的是「旧树代码」，新树已重构，无法逐字对齐** ⇒ 必须**按其意图在新树结构上等价适配**
（本次：把 P5X 过滤条件加到 `getPokemonAllowedInBattle()` 的调用点 filter 上）。

> **⇒ 这是 B 类的真正难点**：不只是「插入代码」，而是「**理解 mod 意图 + 在新树结构上重新表达**」。

#### 📉 收敛效率因宿主而异（重要）

| 批次 | 接入入口 | 收敛 |
|---|---|---:|
| 2 | `TurnStartPhase` 3 个钩子 | **+13** |
| 3a | `SwitchPhase` + `CheckSwitchPhase` | **+1** |

原因：`hasJiemingConstellation` / `isP5XRestrictedTierSpecies` **已被其它路径引入** ⇒ 本次几乎无新增收敛。
**⇒ 不能按「插入次数」估工作量，应按「剩余未命中符号」动态排优先级。**

### 10.7 累计进度（批次 1-3a）

| 项 | 值 |
|---|---|
| ✅ 已完成 | `TurnEndPhase`(8) · `TurnStartPhase`(4+1挂账) · `SwitchPhase`(1) · `CheckSwitchPhase`(1) |
| ⊘ 判定跳过 | `MessagePhase` · `MessageUiHandler`（同义重构） |
| 待做宿主 | **27** |
| 待判定 | 24（其中 5 已初步认定为真 patch：`TitlePhase`/`FaintPhase`/`getMoveTargets`/`CommandPhase`/`MoveEndPhase`） |
| **累计收敛** | tree-shake 差异 **365 → 343（−22）**；覆盖率 **65.63% → 66.53%** |


### 10.8 批次 3b / 3c（连续）—— Modifier ×2 + `MoveEndPhase` ✅

| 宿主 | mod 意图 | 落法 |
|---|---|---|
| `MoneyRewardModifier` | PT 搜打撤下金钱奖励转 PT（`500/3000/8000` 分档） | `apply()` 尾部插入 PT 累加块 |
| `DamageMoneyRewardModifier` | 伤害金钱按 **10%** 转 PT | `apply()` 尾部插入 |
| `MoveEndPhase` | 解明「追光」结算 + 冷却推进 | 在 `lapseTags(AFTER_MOVE)` 后插入 2 处 |

**实测**：`tsc`/`build` 双绿；命中 **2079 → 2084（+5）**、tree-shake 差异 **343 → 338（−5）**、覆盖率 **66.53% → 66.69%**。

### 10.9 🔴 新发现：**A3 把 P5X 的 UI 函数错误实现为 `Symbol` 占位**（迁移缺陷）

产物中这三个**是函数**：
```js
function IF(){ aN(), zn && (zn.removeAll(!0), zn.setVisible(!1)), Mb() }  l(IF,"hideP5XTurnOrderBar");
```
而锚点树 `p5x-system.ts` 写成：
```ts
export const hideP5XTurnOrderBar = Symbol.for("hideP5XTurnOrderBar");   // ❌ 不是函数！
```
同样问题：`ensureP5XTurnOrderBar`（`Bfe`）· `updateP5XTurnOrderBar`（`PRe`）。

⇒ **`BattleEndPhase` 等宿主的 `hideP5XTurnOrderBar()` 调用无法落地**。
**⇒ 需登记为 A3 勘误（E14）**：**函数被降级为 Symbol 占位**（与 §9 的「同义重构」相反，这是「实现丢失」）。

### 10.10 本轮挂账清单（依赖缺失 / mod 新增大方法）

| 宿主 | 阻塞原因 | 类型 |
|---|---|---|
| `BattleEndPhase` | `hideP5XTurnOrderBar` 被写成 `Symbol`（§10.9） | 依赖缺失（A3 缺陷） |
| `TitlePhase` | `resetSuperBackpackManager` 缺实现（`SuperBackpackManager` 属 A3 缺口 557 项） | 依赖缺失 |
| `SelectModifierPhase` | `showTalentShop()` 是 **mod 新增方法**（锚点树 0 命中） | B 类重工程 |
| `GameOverPhase` | `proceedWithVictory()` 是 **mod 新增大方法**（约 800+ 字符 PT 结算流程） | B 类重工程 |

### 10.11 累计进度（批次 1 ~ 3c）

| 项 | 值 |
|---|---|
| ✅ 已迁移 | `TurnEndPhase` · `TurnStartPhase` · `SwitchPhase` · `CheckSwitchPhase` · `MoneyRewardModifier` · `DamageMoneyRewardModifier` · `MoveEndPhase`（**7 宿主**） |
| ⊘ 判定跳过 | `MessagePhase` · `MessageUiHandler`（同义重构） |
| ⏸ 挂账 | `BattleEndPhase` · `TitlePhase` · `SelectModifierPhase` · `GameOverPhase`（+ `TurnStartPhase` 的 P5X 分支） |
| 待做 | **约 20 个**（含 `getMoveTargets`(5) · `CommandPhase`(6) · `data/moves/move.ts` ×5 · UI 类 ×4 等） |
| **累计收敛** | tree-shake 差异 **365 → 338（−27）**；覆盖率 **65.63% → 66.69%（+1.06pt）**；命中 **2051 → 2084（+33）** |


### 10.12 批次 4a / 4b —— `data/moves/move.ts` 四个宿主 ✅

| 宿主 | mod 意图 | 落法 |
|---|---|---|
| `EatBerryAttr` | P5X：同波同消耗品只能用一次 | `this.chosenBerry = …` 后插 `if (!p5xTryUseConsumableThisWave(pokemon, this.chosenBerry)) return false;` |
| `StealEatBerryAttr` | ERYOU：同上限制 | 同上，条件加 `globalScene.gameMode?.isEryou` |
| `RemoveHeldItemAttr` | P5X：仅莓果分支标记本波已用 | `heldItems.length === 0` 判定后插 `if (this.berriesOnly) heldItems.forEach(item => markP5XConsumableUsedThisWave(target, item));` |
| `StatStageChangeAttr` | ERYOU：友方自助能力招式可作用于**队友** | 加 `eryouAllySelfBuff` 判定 + 目标改 `this.selfTarget ? (eryouAllySelfBuff ? target : user) : target` |

**实测**：`tsc`/`build` 双绿；命中 **2084 → 2088（+4）**、tree-shake 差异 **338 → 334（−4）**、覆盖率 **66.69% → 66.82%**。

**本批新增挂账**：

| 宿主 | 阻塞原因 | 类型 |
|---|---|---|
| `AddBattlerTagAttr` | mod 用 `try{…}finally{ this.selfTarget = O }` **临时改写 `selfTarget`** ⇒ 需重构 `apply` 方法体 | B 类重构 |
| `CallMoveAttr` | `pickCalledMoveTarget()` 是 **mod 新增方法**（锚点树 0 命中） | B 类新方法 |

### 10.13 累计进度（批次 1 ~ 4b）

| 项 | 值 |
|---|---|
| ✅ 已迁移（**11 宿主**） | `TurnEndPhase` · `TurnStartPhase` · `SwitchPhase` · `CheckSwitchPhase` · `MoneyRewardModifier` · `DamageMoneyRewardModifier` · `MoveEndPhase` · `EatBerryAttr` · `StealEatBerryAttr` · `RemoveHeldItemAttr` · `StatStageChangeAttr` |
| ⊘ 判定跳过 | `MessagePhase` · `MessageUiHandler`（同义重构） |
| ⏸ 挂账（**9**） | `BattleEndPhase` · `TitlePhase` · `SelectModifierPhase` · `GameOverPhase` · `AddBattlerTagAttr` · `CallMoveAttr` · `TurnStartPhase` 的 P5X 分支 · `BerryPhase`（待做）· … |
| 待做 | **约 16 个**（`getMoveTargets`(5) · `CommandPhase`(6) · `InfamousTag`(1) · `PokerogueApi`(2) · UI 类 ×4 等） |
| **累计收敛** | tree-shake 差异 **365 → 334（−31）**；覆盖率 **65.63% → 66.82%（+1.19pt）**；命中 **2051 → 2088（+37）** |

### 10.14 观察：挂账比例正在上升

已处理的 22 项中：**11 项落地 · 2 项跳过 · 9 项挂账**（挂账率 **41%**）。
挂账主因按频次：
1. **依赖缺失**（`Symbol` 占位 E14 / `resetSuperBackpackManager` 缺实现）
2. **mod 新增大方法**（`showTalentShop` / `proceedWithVictory` / `pickCalledMoveTarget`）
3. **需方法体重构**（`AddBattlerTagAttr` 的 try/finally 改写 `selfTarget`）

⇒ **`A4-00b` 判据 ⑤ 若要「全 31 宿主归零」，须先补 A3 的符号缺口（557 项）+ 迁移 mod 新增方法** —— 这已超出「补 patch」范畴。


### 10.15 批次 5 侦察 —— **剩余宿主多为「需新树重写」，转为挂账**

对 `InfatuatedTag` / `BerryPhase` / `SwitchSummonPhase` / `UiInputs` / `isMobile` 逐个侦察，结论：

| 宿主 | 产物插入 | 锚点树对照结论 | 处置 |
|---|---|---|---|
| `InfatuatedTag` | `let a=false; try{a = hasZicanTalent()}catch{…} if(a \|\| pokemon.randSeedInt(2)){…}` | 锚点树该类**只有 `canAdd`/`onAdd`/`onOverlap`** —— 无对应 `apply` 结构 | ⏸ 挂账（需定位新树等效点） |
| `BerryPhase` | `if(i && !p5xTryUseConsumableThisWave(pokemon, i)) return;` | 需细对 `executeForAll` 回调结构 | ⏸ 挂账 |
| `SwitchSummonPhase` | `if(this.player && !isP5XFieldable(pokemon)){ console.error(…), this.end(); return }` | 锚点树 `start()` **仅 `super.start()`**，逻辑在 `preSummon`/`switchAndSummon`；且**无** `"Cannot switch to fainted or non-existent Pokemon"` 措辞 ⇒ 已重构 | ⏸ 挂账（新树重写） |
| `UiInputs.buttonSpeedChange` | `const A = isEryouContext() ? 8 : 50;`（ERYOU 下速度上限 8） | 锚点树 `buttonSpeedChange` 结构不同（grep 命中 actions 表） | ⏸ 挂账 |
| `isMobile` | —— | 侦察命中**正则字面量**（UA 检测）⇒ **误报**，无真实调用 | ⊘ 剔除 |

**⇒ 批次 5 全部转挂账**（无一可机械落地）。

### 10.16 阶段性结论：**「补 patch」路径已接近极限**

| 处置类型 | 数量 | 占比 |
|---|---:|---:|
| ✅ 已迁移 | **11** | 46% |
| ⊘ 判定跳过 / 误报剔除 | 3 | 12% |
| ⏸ 挂账 | **10** | 42% |

**挂账的 10 项，根因全部指向同一处**：
> **patch 要接的「另一端」不存在或未迁移** ——
> ① 依赖符号缺失（`hideP5XTurnOrderBar` 是 `Symbol`（E14）· `resetSuperBackpackManager` 在 557 项缺口内）
> ② mod 新增大方法（`showTalentShop` / `proceedWithVictory` / `pickCalledMoveTarget` / `SpeedTurnPhase`）
> ③ **新树结构已重构**（`SwitchSummonPhase` / `InfatuatedTag` / `UiInputs` ⇒ mod 改的旧树代码在新树找不到对应位置）

**⇒ 结论**：`A4-00b` 判据 ⑤「31 宿主归零」**不能靠补 patch 达成**，
必须先把 **A3 的 557 项符号缺口 + mod 新增方法/类** 补齐（即「A3-补」），再回头补 patch。
**顺序反了会白做** —— 本次已落地的 11 项是可复用的，但剩余 10 项挂账在 A3-补 完成前无法推进。

### 10.17 累计收敛（批次 1 ~ 4b 落地部分）

| 指标 | A4-00 完成时 | 现在 | Δ |
|---|---:|---:|---:|
| tree-shake 差异 | 365 | **334** | **−31** |
| 覆盖率 | 65.63% | **66.82%** | **+1.19pt** |
| 命中 | 2051 | **2088** | **+37** |
| `tsc` / `vite build` | EXIT=0 | **EXIT=0** | 0 回归 |

# A3-补 第三十九批 · healer 招式层 + 治疗层（+23 命中，74.40%）

## 一句话结论

本轮**性价比最高的一批**：只 patch **3 处**，**23 个符号**翻转。
「宿主一接，内部批量翻转」的战术效应第二次显现并量化。

## 侦察：healer ~20 符号按宿主分三类

| 宿主 | 函数 | 本批 |
|---|---|---|
| **`MoveEffectPhase.start()`** | `applyHealerDamageMoveInterception`(`uhe`) · `applyHealerOnMoveUse`(`hhe`) | ✅ **接** |
| **`Pokemon.heal()`** | `applyHealerOverflowShield`(`rhe`) | ✅ **接** |
| healer 内部自调用 | `healPokemon`(`ahe`) · `healOne`(`ioe`) · `restoreHealerPp`(`Ehe`) · `gainVigorOnHeal`(`Che`) … | ⏳ 随宿主自动可达 |
| 护盾承伤路径 | `healerShieldEntryFor` | ⏳ 留待下批（需定位 `DamageResult` 侧插入点） |

## 落位（2 文件 3 处）

- **`phases/move-effect-phase.ts`** `start()` ——
  `shouldHealerBlockDamage` 命中时 → `applyHealerDamageMoveInterception` + `hitsLeft=1` + `end()`
  （**与产物 if/else 结构一致**）；随后 `applyHealerOnMoveUse` 招式使用结算
- **`field/pokemon.ts`** `heal()` return 前 —— `applyHealerOverflowShield(this, amount - healAmount, undefined)`

## 本批唯一失误

`applyHealerOverflowShield(target, overflow, _unused: any)` 需要 **3 参** ——
产物 `rhe(n,s,i)` 第 3 参**存在但未使用**（src 命名 `_unused` 对齐）。我按 2 参调用 ⇒ TS2554。

**判据延伸**：产物形参个数**与实际使用可以不一致**，不要因为「看起来没用」就省参。

## 实测

| 指标 | 上批 | 本批 | Δ |
|---|---:|---:|---:|
| 命中 | 2302 | **2325** | **+23** |
| 覆盖率 | 73.66% | **74.40%** | **+0.74%** |
| tree-shake | 244 | **225** | **−19** |
| 未定性残差 | 534 | 534 | 0 |
| tsc / vite build | EXIT=0 | **EXIT=0** | — |

## 🔴 本轮最有价值的战术发现

**「宿主一接，内部批量翻转」**：只 patch 3 处，却有 23 个符号从 tree-shake 桶翻转成命中 ——
`healPokemon` / `healOne` / `restoreHealerPp` / `gainVigorOnHeal` / `healerHealValue` /
`healerShieldCap` / `healerShieldFromOverflow` / `healerShieldEntryOf` / `healerShieldEntryFor`
全部随宿主可达。

**战术含义**：面对「一个大系统几十个函数」的簇，**只需找到 2~3 个上游宿主**，
而不是逐个函数去找调用点。

## 六批累计

| 批次 | 目标 | patch 处数 | 命中 Δ |
|---|---|---:|---:|
| 三十三 + 三十四 | `eryou-ui.ts`（已挂账） | — | 0 |
| 三十五 | healer【祈愿】Phase 三要素 | 4 | +9 |
| 三十六 | chixin + dianxin 首轮 | 3 | +22 |
| 三十七 | nianli + mew + 剩余钩子 | 5 | +21 |
| 三十八 | mew 会心/防御等 | 3 | +5 |
| 三十九 | **healer 招式层 + 治疗层** | **3** | **+23** |
| **合计** | | | **+80** |

覆盖率 71.84% → **74.40%（+2.56%）**，tree-shake 294 → **225（−69）**。

## 下批提示

`MoveEffectPhase.start()` 已证实是产物 `MovePhase.end()` 钩子的**新树等价落点**
（宿主已被上游重构，`move-phase.ts` 无 `hitsLeft`）。
下批优先在这里接 `applyNianLiOnMoveUse` / `tryDianXinPunish` / `runChiXinPursuit` / `tryEnterChiXin`。

healer 自身还剩护盾承伤路径（`healerShieldEntryFor`）；另外 `healerLossBonus` 在产物中**零调用**（死函数）。
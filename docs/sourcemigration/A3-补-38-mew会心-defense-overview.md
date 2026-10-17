# A3-补 第三十八批 · mew 会心/防御 + 清空挂账链（+5 命中）

## 一句话结论

小批量但结构性收益高的一批：接 5 个符号，把 `getCriticalHitResult()` 和 `damage()`
两处源码里的「⚠️ 挂账」注释链**全部清空**。覆盖率 73.66%。

## 落位（`field/pokemon.ts` 3 处）

| 位置 | 内容 | 产物@ |
|---|---|---|
| `apply()` 的 `criticalMultiplier` | 会心时 `+= mewCritDamageBonus` + `+= dianXinCritBonus` | 4509549 |
| `getEffectiveStat()` DEF/SPDEF | `*= mewDefenseMultiplier(this, stat)` | 4466845 |
| `getCriticalHitResult()` | `chiXinAlwaysCrit` 必中 + `mewCritChanceBonus` 千分比判定 | 4512240 |

**销掉源码原有的「⚠️ 挂账：`k1e`（chiXinAlwaysCrit）· `uTe`（mewCritChanceBonus）」**
连同上批销的 `TPe`/`J1e`/`ice`，两条挂账链已清空。

## 本批一处语义误判（自查发现并修正）——这条最值得记

`mewCritChanceBonus` 我初版写成「**稀释会心骰**」（`randBattleSeedInt(critChance - bonus) === 0`）。
回产物核对真身：

```js
const y = uTe(s);
if (y > 0 && E.randBattleSeedInt(1e3) < Math.floor(y * 1e3)) r = !0;
else { const Y = [24,8,2,1][…critStage…]; r = Y === 1 || !E.randBattleSeed… }
```

产物是**独立的千分比概率判定**，与下方会心骰 `if/else` **并列**——不是稀释。

**若按我的初版实现，会心率会随层数指数上升**，是个严重 bug。已改为
`randBattleSeedInt(1000) < floor(bonus * 1000)`。

**判据**：凡「数值即概率」的函数，**不能按函数名（`…ChanceBonus`）推断语义**，必须回产物看完整 if/else。

## 签名陷阱二次触发

`dianXinCritBonus(attacker, target, moveType: number)` 与上批的 `dianXinIncomingMultiplier` 一样，
第 3 参是**属性类型数值**不是 `move` 对象 ⇒ 第一次就撞上。

建议：`dianxin-system.ts` 里这两个函数签名应统一（要么都收 `move`，要么都收 `moveType`）。

## 实测

| 指标 | 上批 | 本批 | Δ |
|---|---:|---:|---:|
| 命中 | 2297 | **2302** | **+5** |
| 覆盖率 | 73.50% | **73.66%** | **+0.16%** |
| tree-shake | 249 | **244** | **−5** |
| tsc / vite build | EXIT=0 | **EXIT=0** | — |

## 五批累计

| 批次 | 目标 | 命中 Δ |
|---|---|---:|
| 三十三 + 三十四 | `eryou-ui.ts`（已挂账） | 0 |
| 三十五 | healer【祈愿】 | +9 |
| 三十六 | chixin + dianxin 首轮 | +22 |
| 三十七 | nianli + mew + 剩余钩子 | +21 |
| 三十八 | mew 会心/防御 + dianxin 会心 + chixin 必中 | **+5** |
| **合计** | | **+57** |

覆盖率 71.84% → **73.66%（+1.82%）**，tree-shake 294 → **244（−50）**。

## 剩余

**healer ~20（最大剩余簇，未系统侦察）**｜mew 4 · dianxin 3 · nianli 1 · chixin 3

⚠️ nianli/chixin 的 `MovePhase.end()` 宿主在新树**已被上游重构**（`move-phase.ts` 无 `hitsLeft`，
多段逻辑上移到 `move.ts` / `battler-tags.ts`），**不能照抄产物位置**，须在新树找等价语义点。
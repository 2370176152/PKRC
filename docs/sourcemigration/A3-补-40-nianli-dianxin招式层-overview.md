# A3-补 第四十批 · nianli/dianxin 招式层 + 行动顺序速度（+14，74.85%）

## 一句话结论

四个孤岛的尾巴清掉一批，**未定性残差首次下降**（534 → 533）。
覆盖率 **74.85%**，tree-shake 降到 213。

## 落位（3 文件 4 处）

| 文件 | 位置 | 内容 |
|---|---|---|
| `phases/move-effect-phase.ts` | `start()` 内 healer 钩子之后 | `applyNianLiOnMoveUse(user, move, targets)`（产物 `oPe`，与 healer `hhe` **相邻**，照搬顺序） |
| `phases/move-effect-phase.ts` | `hitsLeft === -1` 分支内 | `if (!isDianXinEchoRunning()) tryDianXinPunish(user)`（产物 `sce()` 守卫 + `Ice(s)`） |
| `utils/speed-order.ts` | 排序比较器 | 抽出 `getOrderSpeed(pokemon)` |

`getOrderSpeed` 照搬了产物的保护分支：
```js
const s = n.getEffectiveStat(Stat.SPD), i = n.nextTurnSpeedMultiplier * Rce(n);
return !Number.isFinite(i) || i === 1 ? s : Math.max(0, s * i);
```
—— 非有限或恰好为 1 时**直接返回原速度**，不做乘法（避免浮点误差）。

## mew 剩余 3 个：无需 patch，自动可达

`mewRoundKey` / `getMewPokemon` / `mewGainWeave` 全在 mew-system 内部，
随第三十八批已接的 `onMewSuperEffectiveHit` 自动翻转。

## 一处上游 API 定位修正

`tryDianXinPunish` 在产物里挂在 `HitCountAttr` 之后。新树 `HitCountAttr` 已被上游重构掉，
`hitCount` 改由 `MultiHitAttr` / `AddSecondStrikeAbAttr` / `PokemonMultiHitModifier` 设置。

**等价落点**：`if (user.turnData.hitsLeft === -1)` 分支内、`hitCount = hitCount.value` 之后 ——
该分支在两棵树中语义完全一致（设置最终击数）。

## 小失误

`sed -i '5a import type { Pokemon } …'` 造成重复 import（该文件已有）⇒ TS2300，删掉即过。
**教训**：`sed` 插 import 前先 `grep` 查重。

## 实测

| 指标 | 上批 | 本批 | Δ |
|---|---:|---:|---:|
| 命中 | 2325 | **2339** | **+14** |
| 覆盖率 | 74.40% | **74.85%** | **+0.45%** |
| tree-shake | 225 | **213** | **−12** |
| 未定性残差 | 534 | **533** | **−1** 🔴 |
| tsc / vite build | EXIT=0 | **EXIT=0** | — |

🔴 **未定性残差首次下降**：此前 6 批一直平（534），说明开始有符号被真正定性，不只是翻转 tree-shake 桶。

## 七批累计

| 批次 | 目标 | patch 处数 | 命中 Δ |
|---|---|---:|---:|
| 三十三 + 三十四 | `eryou-ui.ts`（已挂账） | — | 0 |
| 三十五 | healer【祈愿】Phase | 4 | +9 |
| 三十六 | chixin + dianxin 首轮 | 3 | +22 |
| 三十七 | nianli + mew + 剩余钩子 | 5 | +21 |
| 三十八 | mew 会心/防御等 | 3 | +5 |
| 三十九 | healer 招式层 + 治疗层 | 3 | +23 |
| 四十 | nianli/dianxin 招式层 + 速度 | 4 | **+14** |
| **合计** | | | **+94** |

覆盖率 71.84% → **74.85%（+3.01%）**，tree-shake 294 → **213（−81）**，残差 540 → **533（−7）**。

## mod 战斗钩子挂点已扩到 13 个

新增：⑩ `MoveEffectPhase.start()` ⑪ `hitsLeft === -1` 分支 ⑫ `Pokemon.heal()` ⑬ `speed-order.ts` 比较器。

## 下批建议：先拆解「未定性残差 533」

残差已是最大未啃骨头（tree-shake 只剩 213，残差 533 占基准 17%）。三类可能构成：

1. **产物 chunk 边界** —— 跨 chunk 引用导致判定失败
2. **keepNames 名称形态** —— 如 `typeName$1` 带序号后缀，需特殊匹配
3. **真正未迁的散落符号** —— 不在孤岛系统里

**先拆构成再定投入方向，别继续盲接宿主。**
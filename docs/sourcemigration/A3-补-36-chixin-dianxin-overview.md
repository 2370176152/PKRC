# A3-补 第三十六批 · chixin + dianxin 接 `Pokemon`（+22 命中）

## 一句话结论

换靶后第二次丰收：chixin（潜心）+ dianxin（感电）接进上游 `Pokemon` 三处，**+22 命中**，
覆盖率 72.83%。三批战果对比把方法论彻底验证了。

## 侦察：chixin 的宿主不是 UI，是上游 `Pokemon`

`chixin-system.ts`（35KB / 67 export / **0 declare**）+ `registerChiXinSystem()` **已挂在 `mod-init.ts:45`**，
但 17 个符号仍在 tree-shake 桶 —— 因为那个 register 只做 `registerConstellation`，**不引用它们**。

keepNames 反查 + 调用点定位，找到 3 处真实入口，**全在上游 `Pokemon`**：

| chixin 函数 | 短名 | 宿主 | 产物@ |
|---|---|---|---|
| `recordChiXinMoveContext` | `Y1e` | `getBaseDamage()` | 4507418 |
| `chiXinFirePowerMultiplier` | `x1e` | 同上 | 4507456 |
| `chiXinTargetedMoveMultiplier` | `V1e` | 同上 | 4507460 |
| `isChiXinGuarded` | `j1e` | `damage()` 开头 | 4514911 |
| `applyChiXinOnHit` | `X1e` | `damage()` 反击分支 | 4518141 |

跟 healer 完全不同的性质：**不需要新建任何入口**，只在已接线的上游类上加 patch 块。

## 本批落位（`field/pokemon.ts` 3 处 + 2 处 import）

- `getBaseDamage()` —— 新增 `chiXinPowerMult` 乘入 `baseDamage` 公式（产物 `D` 因子），
  紧跟既有星象/偷心怪盗 patch 块
- `damage()` 开头 —— `isChiXinGuarded(this)` 早退
- `damage()` 反击分支 —— `applyChiXinOnHit(source, this)` 计数结算，
  **并把源码里原有的「⚠️ 挂账：X1e（潜心计数）」注释更新为已接**（顺手销账）

## 顺带把 dianxin 也接了

侦察时发现产物 @4507427 的 `que(s,i)` **不是**偷心怪盗，而是 **`recordDianXinMoveContext`**
（keepNames 反查确认）。顺手接入，与产物调用顺序一致：`Y1e(s,i), que(s,i), i.type===R.FIRE && (D=…)`。

## 本批的 3 处自身失误（都是 tsc 抓出来的）

| 失误 | 根因 | 修法 |
|---|---|---|
| `que` 误认成偷心怪盗 | 只看调用点**邻近注释**，没做 keepNames 反查 | 反查确认后改接 dianxin |
| `chiXinTargetedMoveMultiplier` 第 4 参语义猜错 | 按 `spread: boolean` 猜 | 产物 `A` 实为 `isSuperEffectiveAgainst` |
| Edit 截断既有 JSDoc 开头 | `old_string` 没包含完整注释边界 ⇒ 6 个 TS1434 | 补回 `/**\n * The attacker's…` |

**教训：Edit 上游大文件时，`old_string` 必须包含完整注释边界**，否则会吃掉相邻块。

## 实测

| 指标 | 上批 | 本批 | Δ |
|---|---:|---:|---:|
| 命中 | 2254 | **2276** | **+22** |
| 覆盖率 | 72.13% | **72.83%** | **+0.70%** |
| tree-shake | 291 | **270** | **−21** |
| 未定性残差 | 534 | 534 | 0 |
| tsc / vite build | EXIT=0 | **EXIT=0** | — |

tree-shake **−21** 说明这次把 21 个符号从「src 有、bundle 无」翻转成命中。

## 三批战果对比：方法论验证

| 批次 | 目标 | 投入 | 命中 Δ |
|---|---|---|---:|
| 三十三 + 三十四 | `eryou-ui.ts` | 2 批（**零产出**，回滚 2 次） | **0** |
| 三十五 | healer【祈愿】 | 1 批 | **+9** |
| 三十六 | chixin + dianxin | 1 批 | **+22** |

**「零 declare 孤岛系统 + 上游核心类宿主」= 最高性价比组合。** 文件本身没有声明海问题，
只需在已接线的上游类上加 patch 块，不需要新建入口或密集索引。

## 下一步

chixin 剩余：`tryChiXinEndure` · `runChiXinPursuit` · `dealChiXinPursuit` · `tryEnterChiXin` ·
`grantChiXinStatStage`（宿主：`Move` / `TurnStart` / `damage` 保命分支）
｜dianxin 剩余：`applyDianXinOnHit` · `tryDianXinPunish` · `dianXin*Multiplier` 系列
｜nianli 6 个待定位 ｜ mew 11 个待定位

继续按「找宿主 → 上游类加 patch 块」推进即可。
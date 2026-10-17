# A3-补 第三十一批 · A4-01 UI 批 a 概述

## 一句话结论

原计划「接 ui.ts handlers 入口」**前提不成立**——侦察量化出真实阻塞点，先吃掉 2 个零依赖的干净 handler；
`tsc`/`vite build` EXIT=0，核心符号 11/11。

## 本批最重要的产出：把「UI 接线」的前置条件量化出来

`ui.ts` 的 `this.handlers` 是**密集索引**（`getHandler() = this.handlers[this.mode]`），上游 48 项占 0..47，
mod 的 18 个须占 48..65。**只能整体接线，不能部分接**——部分接会让其余 mod UiMode 的 `getHandler()`
返回 `undefined`，运行即崩。

18 个 mod handler 的真实现状：

| 状态 | 数量 | 明细 |
|---|---|---|
| 未迁 | **5** | `mV`=PtSoudacheStart(5782) · `PV`=TalentShop(12767) · `GV`=TalentViewer(4633) · `gV`=TalentCodex(18571) · `BV`=Jieming(7521) |
| 已落位但**卡 declare 海** | **13** | `eryou-ui.ts`（11 个 Eryou*，**486 行 declare**）+ `constellation-ui.ts`（PtConstellation，63 行）+ `mod-super-backpack.ts`（SuperBackpack，干净但未接线） |

**根因**：`eryou-ui.ts` / `constellation-ui.ts` 里 `E`/`V`/`Yi`/`F`/`re`/`dt` 全是 `declare ... : any`，
**一条真实 import 都没有**。合计 **549 行 declare** 待清。

> **「落位」≠「可接线」**：tree-shake 桶只是「没接入口」；`declare` 占位是**另一道门槛**——
> 运行时那些名字是 `undefined`，即使接上入口也会崩。

## 本批落位（只做零 declare 的 2 个）

| 文件 | 类 | 产物 | 依赖 |
|---|---|---|---|
| `talent-ui.ts`（新建 ~200 行） | `TalentViewerUiHandler` | `GV` @3358885 | 10 个依赖全真实 import |
| `pt-soudache-ui.ts`（新建 ~330 行） | `PtSoudacheStartUiHandler` | `mV` @3391107 | 上列 + BBCodeText/Color/ShadowColor/4 个 Phase |
| `mod-augment.ts` | `BattleScene` 补 6 个 `ptSoudache*` 跨阶段字段 | — | — |

## 修的 8 处 tsc（新树 API 差异）

- `BattleScene.getCurrentPhase()` ×4 → `globalScene.phaseManager.getCurrentPhase()`
- `PtSoudacheShopPhase` 回调：产物收 `ModifierTypeFunc[]`（靠 `r?.id` 反查），新树已归一化为 `Map<string,number>`
  ⇒ `mergeShopItems` 改收 Map（**语义等价改写，已加注释**）
- `Map<string,unknown>` → `Map<string,number>` 收紧
- `modifierTypes[k] === type` 无重叠（TS2367）→ 随上条删反查分支

## 实测指标（命中不变是预期且正确的）

| 指标 | 上批后 | 本批后 | Δ |
|---|---:|---:|---:|
| 命中 | 2245 | **2245** | 0 |
| 覆盖率 | 71.84% | **71.84%** | 0 |
| tree-shake 差异 | 292 | **294** | **+2** |
| 未定性残差 | 542 | **540** | −2 |
| tsc / vite build | EXIT=0 | **EXIT=0** | 0 回归 |
| 核心上游符号 | 11/11 | **11/11** | — |

残差 −2 / tree-shake +2 = 符号从「产物有、src 无」转入「src 有、bundle 无」。
**这是「先接入口 → 再补叶子」的反向验证：入口不通，落位就是 tree-shake 桶里的死代码。**

## 下一批建议：清 declare 海（不是继续找 handler）

549 行 declare 分四类，其中 **D 类是本批实测新发现**：

| 类别 | 判据 | 处理 |
|---|---|---|
| A 上游 API | 锚点树有同名真实符号 | 换真实 import，`as` 回短名 |
| B 布局常量 | 产物里的字面量数值 | 建本地 const 表 |
| C 业务符号 | 跨文件调用 | 定位真实来源后 import；找不到 ⇒ 该系统未迁 |
| **D 🔴 方法名误捕** | 实为类的自身方法名 | **直接删 declare** |

D 类实例：`eryou-ui.ts:158 declare let add: any;` 实为 `EryouList.add()`——F-11 生成脚本的缺陷。
若照 A/B/C 处理会把方法名错改成假 import。判别法：`class X{` 花括号配平范围外无独立引用 ⇒ 是方法名。

## 剩余挂账

1. 清 declare 海（549 行，接线前置门槛，最高优先）
2. 迁余 3 个 handler（`PV` 基类是 `Ho` 非 `Yi`，须先反查；`gV` 18571 最大）
3. ui.ts 接线（依赖 1+2 完成）
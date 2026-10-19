# E-1 执行总览 · 11 系统完整性核查（第五阶段 WD1）

**日期**：2026-10-19 · **任务**：派单32 §三 E-1 · **状态**：✅ 6/6 验收标准达成

## 做了什么

1. **压缩 MEMORY.md**（33957→ 14621 字符）—— 原文件超限导致注入截断，早期批次细节归档到 `A3-补-未迁符号清单.md` §1~§50。
2. **E-1 批次① battleInfo** —— 核对发现**前期已完成**：`mod-battle-info.ts` + `Pokemon.setBattleInfoVisible` + 3 处调用点，产物真身 `setVisible(rr(gameMode)?!1:s)` 语义等价，无需改动。
3. **E-1 批次② ERYOU 主目标** —— 主体前期已接，本次补最后一环：`MoveEffectPhase.recordEryouSpreadPrimaryTarget()` + `getPrimaryTarget()` + `primaryTarget` 字段 + `start()` 调用点 + `BattlerIndex` 改值导入。tsc EXIT=0。
4. **E-1 批次③ 天赋生周期** —— 11 处宿主核对：**已接 6 处**（数据层全通），剩余 5 处宿主全在未迁 UI，归 L2。
5. **跑 `vite build`（EXIT=0，2m24s）+ `verify-signature` 复测**。
6. **产出 `docs/sourcemigration/E-1-11系统完整性核查表.md`** —— O-12 路径③的核心判据输入。

## 关键结论

### 路径③ 的判据不成立（需owner 在 E-2 前知悉）

「11 个自研系统必须 100% 完整」实测**不成立**：

| 判定 | 数量 | 系统 |
|---|---|---|
| ✅ 完整 | **5** | HEALER / CHIXIN / DIANXIN / NIANLI / MEW |
| 🟡 完整但 UI 有缺口 | **5** | ERYOU / TALENT / SUPER BACKPACK / CONSTELLATION / P5X |
| 🔴 **不完整** | **1** | **PT_SOUDACHE**（通关流程 ~5000 字符 + 守门员 19 处） |

**唯一硬缺口是 PT_SOUDACHE**，其余 10 项缺口全部集中在 UI 接线 + Eryou 66 规则函数（宿主就在未接线 UI 里）。

### 实测 Δ = 0（如实记录，非失败）

命中 2342 · 覆盖率 74.94% · tree-shake 210 · 残差 533，**四项全部与第四阶段收口持平**。

原因：批次② 补的是**死代码** —— 产物 `getPrimaryTarget()` 全 chunk 零调用方，**不在 verify-signature 基准符号内**。

批次②的真实价值不在命中数：
1. 消掉「写入侧已接、读取侧挂账」的不对称状态（后续排查者不再误判为已完整）。
2. 补上**唯一可观测信号** debug 日志 `[二游] 群攻主目标：ENEMY（共 N 体）`，供 **E-3 走查判定「ERYOU 主目标是否生效」**。

## 关键文件

| 文件 | 变更 |
|---|---|
| `.build-tools/tarball-src/.../src/phases/move-effect-phase.ts` | +72 行：`primaryTarget` 字段 · `recordEryouSpreadPrimaryTarget()` · `getPrimaryTarget()` · `start()` 调用点 · `BattlerIndex` 值导入 |
| `docs/sourcemigration/E-1-11系统完整性核查表.md` | **新建**（11 系统逐项核查 + E-2 交接清单） |
| `.workbuddy/memory/MEMORY.md` | 33957 → 14621 字符 |

## 风险与待决

1. 🔴 **PT_SOUDACHE 通关流程 = 第六阶段第一优先**（业务关键，玩家通关必经）。
2. 🔴 **E-3 走查必查**：`TalentViewerUiHandler` 已在 src 但**未实例化** ⇒ B 产物打开天赋查看界面必然失败。gate 实测 `talentViewer:` 在 B 为 0，与本表一致 ⇒ 走查按 `blocked` 记，**不得计 fail**。
3. 🔴 **E15 P0 缺陷仍在**：24 处悬空 declare（talent 14 · pt-soudache 10）+ `safeT` 引 63× 从未定义 ⇒ 产品 B 黑屏。tsc/build/签名覆盖**全查不出**。

## 下一步

- **E-2**（10-21~10-23）：按分层判据收口 M3。输入已就位（本表 §1 可作 L2 台账分类骨架，§4 为交接清单）。
- **E-3**（10-21~10-26）：全量画面走查。前置 F-14 / U-11 / B-12 均已交付。
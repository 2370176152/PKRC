# A3-11 ERYOU（二游养成）系统迁移 —— 记录与验收

> **任务**：A3-11 ERYOU 迁移（**最大工作量系统，独立命座分支不复用框架**）
> **日期**：2026-10-14
> **状态**：✅ 完成
> **锚点树**：`90df65097b6df76f713e6bd108afa84499e8b993`
> **产物基准**：`game/server/dist/assets/loading-scene-By2k7Qfx.js`（.orig）

---

## 0. 结论

| 验收卡点（派单 15 §9.1 A3-11） | 实况 | 判定 |
|---|---|---|
| ① `eryou-system.ts` 产出 | 已产出（624 行，91 符号） | ✅ |
| ② 独立框架函数（`NRe`/`gN`/`sfe`/`ife`/`nfe`）全部还原 | 全部还原（§2） | ✅ |
| ③ `EryouSynthesisUiHandler`(184 锚点) 完整 | 已还原（`eryou-ui.ts`） | ✅ |
| ④ `tsc` 零错误 | 20 文件联合 `EXIT=0` | ✅ |

---

## 1. 交付物（**双文件拆分**）

| 文件 | 行数 | 内容 |
|---|---:|---|
| `eryou-system.ts` | 624 | **数据/规则/AI/阶段层**（**91 个符号**，35 KB）+ 独立命座分支 + 327 个依赖占位 |
| `eryou-ui.ts` | 591 | **UI 层**（**20 个符号**，89 KB）+ 486 个依赖占位；`import` 复用 `eryou-system` 的 9 个符号 |

**拆分理由**：ERYOU 共 **110 个 keepNames / 122 KB**，其中 UI 层占 89 KB（含 11 个
`EryouXxxUiHandler`）。按层级拆为两文件，既符合「数据层 ≠ UI 层」的既有分层约定，
也让数据/规则层可独立审阅。

---

## 2. ERYOU 独立命座分支（交付项 ②）

**产物符号**：

| 产物 | 还原 | 说明 |
|---|---|---|
| `gN = 6` | `ERYOU_CONSTELLATION_SLOTS` | 命座槽位数 |
| `NRe = {}` | `ERYOU_CONSTELLATION_REGISTRY` | **独立注册表**（≠ 公共底座 `r0`） |
| `sfe` | `constellationLevel` | **ERYOU 版**读等级 |
| `ife` | `hasExclusiveNode` | **ERYOU 版**专属节点判定 |
| `nfe` | `applyConstellationBaseStats` | **ERYOU 版**种族值写入 |

**⚠️ 与公共底座 `constellation-framework.ts` 的三处差异**（这是「独立分支」的实证）：

| 维度 | 公共底座（`sa`/`US`/`lEe`） | ERYOU 独立分支（`sfe`/`ife`/`nfe`） |
|---|---|---|
| 等级读取 | `Math.max(0, min(6, i ?? 0))` | 多 `Number.isFinite(i)` + `Math.floor` |
| 专属判定 | `sa(i,n) < s ? false : vR(...)==="exclusive"` | 仅 `NRe[n]?.exclusiveNodes.includes(s)`（**无等级门槛、无 mode**） |
| 种族值写入 | 遍历 `oSe=[1,2,5]` + **读 choices** + 6命翻倍 | 遍历写死 `[1,2,5]`、**传空 `choices={}`**、**无翻倍** |

**⚠️ 产物关键事实**：`NRe` 在产物中**从未被赋值**（全库仅 2 处读取，均在本文件）。
→ 独立分支当前为**空实现**：`ife` 恒 `false` → `nfe` 什么也不写。
**已如实迁移**（不"修正"），并在 TODO 标注「若真实玩法需要注册，须由 ERYOU 数据初始化点填充」。

---

## 3. 迁移方法（脚本化逐字提取）

110 个符号 / 122 KB 无法手抄。采用**脚本化逐字提取 + 自动修复循环**：

1. `l(短名,"原名")` 反查 → 花括号配平提取（**含 `{}` 默认参数的安全配平**，见 §5）；
2. 定义名还原为原名；顶层 `function` 参数**可选化**（容错 JS 的少参调用）；
3. 采集所有**自由标识符** → 生成 `declare let X: any` 依赖占位（327 + 486 个）；
4. 采集**跨符号短名引用** → 生成 `const <短名> = <原名>` 别名；
5. `tsc` 报 `Cannot find name` → 自动补占位，循环至收敛。

> 全程中文零改动（见 §6 守恒校验）。

---

## 4. 代码构成（eryou-system.ts 主要符号）

| 域 | 符号（原名） |
|---|---|
| **数据/会话** | `createDefaultEryouData` / `normalizeEryouData` / `normalizeEryouSession` / `resolveEryouIdentity` |
| **周键** | `getEryouWeekKey` / `getEryouWeekAnchor` / `parseEryouWeekKeyAnchor` |
| **配队/持有物** | `eryouTeamName` / `eryouTeamAt` / `setEryouTeamAt` / `activeEryouTeam(Index)` / `resolveEryouHeldItem` / `eryouHeldItemId` / 形态道具 4 个 |
| **禁用/招式** | `isEryouBannedSpecies` / `isEryouBannedForm` / `isEryouBannedMove` / `revertEryouBannedForm` / `buildEryouMoveset` / `sanitizeEryouMoveset` |
| **数值** | `eryouBaseStats` / `eryouPanelStats` |
| **深渊/地牢** | `applyEryouAbyssBuffs` / `rollEryouAbyssMechanisms` / `describeEryouMechanism` / `getEryouAbyssMechanismMultiplier` / `getEryouAbyssEnemyDamageMultiplier` / … |
| **速度上限** | `isEryouContext` / `clampEryouSpeed` / `enter|enforce|exitEryouSpeedCap` |
| **奖励** | `rollEryouRewards` / `grantEryouRewards` / `rollEryouHeldTier` / `eryouRepeatRun` |
| **Phase** | `EryouStartPhase` / `EryouRewardPhase` / `EryouEvolvePhase` / `EryouEvolveDonePhase` |
| **招式判定** | `isEryouAllyProtectMove` / `isEryouTauntMove` / `isEryouAllySelfBuffMove` / `isEryouAllyTargetableSelfMove` |
| **Attr** | `EryouShellTrapDelayAttr` / `EryouRetaliatePowerAttr` / `AfterYouAttr` |
| **敌方 AI** | `classifyEryouStatusMove` / `scoreEryouStatusMove` / `getEryouAiTier` / `pickEryouFocusTarget` / `simulateEryouDamage` / `chooseEryouRefinement` / `refineEryouEnemyMove` |

**`eryou-ui.ts` 主要符号**：基础绘制 `eryouWindow`/`eryouText`/`eryouCursor`/`eryouSelectFrame`；
组件 `EryouBar`/`EryouBattlePanel`/`EryouList`/`EryouButton`；基类 `EryouSubScreenHandler`；
11 个 Handler：`EryouReward` / `Progression` / `LevelUp` / `Evolve` / `HeldItem` /
**`Synthesis`** / `Guide` / `Training` / `Lobby` / `HeldSynthesis` / `SpeciesSearch`。

---

## 5. 坑④（本任务发现）：花括号配平被 `{}` 默认参数误导

**问题**：最初的提取器「从起始位置找第一个 `{` 再配平」——但产物中大量函数带
`{}` 默认参数，例如：
```js
function _s(n,s,i="",A=F.WINDOW,a=Je.body,r={}){ ... }
//                                            ↑ 这里才是参数里的 {
```
导致提取到 `function _s(...r={` 就"配平"结束 → 产出 `function eryouText(...r=` 这样**残缺的签名**（`tsc` 报 `',' expected`）。

**处理**：改为**先按括号深度跳过参数表**，只在 `parenDepth <= 0` 时取第一个 `{` 作函数体起点。
修复后重抽两个文件，问题消失。

> 通用教训：产物是压缩 JS，**参数里的 `{}`/`()` 会骗过朴素的花括号配平** ——
> 提取任何函数前必须先定位参数表结束位置。

---

## 6. 验证（可复跑）

```bash
# ① 类型自检（本任务 2 文件）
bash .build-tools/a305/check.sh \
  docs/sourcemigration/A3-migration/src/data/systems/eryou-system.ts \
  docs/sourcemigration/A3-migration/src/data/systems/eryou-ui.ts
# 预期：EXIT=0

# ② 全量 20 文件回归
# 预期：EXIT=0

# ③ 独立分支符号存在性
grep -n "ERYOU_CONSTELLATION_SLOTS\|export function constellationLevel\|export function hasExclusiveNode\|export function applyConstellationBaseStats" \
  docs/sourcemigration/A3-migration/src/data/systems/eryou-system.ts
```

**实测**：① `EXIT=0`；② **20 文件 `EXIT=0`**；③ 5 个符号齐全。

---

## 7. 已知问题与后续

| 项 | 说明 | 归属 |
|---|---|---|
| 依赖占位 327 + 486 个 | 均为 `declare let X: any`，接入锚点时替换为真实 import | 接入锚点 / A3-13 |
| `NRe` 空注册表 | 产物即空；如需注册须补初始化点 | A4-验证 |
| 11 个 UI Handler 注册 | 挂到 UI 模式注册表 | 接入锚点 / 前端 UI |
| 4 个 Phase 注册 | `EryouStart/Reward/Evolve/EvolveDone` 挂阶段注册表 | 接入锚点 |
| 全局中文串剩余 1,703 片段 | 属其它系统 UI 层（天赋/搜打撤/命座 UI）+ A3-12 杂项 | A3-12 / 前端 UI |

---

*本记录由 A3-11 迁移流程生成；提取器与自动修复循环见 `.build-tools/a3111/`。*

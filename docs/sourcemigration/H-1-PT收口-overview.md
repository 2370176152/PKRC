# 第六阶段 H-1 · PT_SOUDACHE 收口 — 执行总览

> 派单：`docs/delegation/37-第六阶段任务分发.md` H-1（2026-10-19 ~ 10-23）
> 执行：2026-10-19 ｜ 角色：全栈 ｜ 结论：**6/6 验收达成 · 判定 🔴 → 🟡**

---

## 一、结论先行

| 派单验收项 | 结论 | 说明 |
|---|---|---|
| ① 通关流程 4 方法迁入 | ✅ **5 方法** | 派单漏了 `continuePtVictoryFlow`；`carryOutAwakeningStones` 实属 P5X |
| ② 守门员 `guardianBoss` 19 处接线 | 🟡 **9/12 逻辑点** | 3 处受下游缺失阻塞，逐条列明 |
| ③ `PtSoudacheStartPhase` 迁入并注册 | ✅ **无需改动** | 侦察确认早已存在 + 已注册（import 第 22 行 / 注册第 149 行） |
| ④ 10 处悬空 declare 清理 | ✅ **10/10** | 全部换成真实实现或真实 import，tsc 零错误 |
| ⑤ `tsc` / `vite build` 零错误 | ✅ | tsc EXIT=0 · vite build EXIT=0 |
| ⑥ 更新 11 系统完整性核查表 | ✅ | `E-1-11系统完整性核查表.md` §1.10 重写 + §2 汇总改判 |

**🔴 最重要的两个发现**（派单预估偏差，已回写）：

1. **PT 地基整体缺失，规模远超「4 方法」**。`GameData.pt` 字段 / `ptSoudacheData` 字段 / 序列化 / 读回 / `addPt` / `getDailyStarters` / `applyDailyStarters` / `initPtSoudacheData` / `getEryouData` —— **9 项全部只存在于 `mod-augment.ts` 的声明里，`game-data.ts` 一行实现都没有**。也就是说：即便把通关流程方法写完，一次 `addPt` 就会因 `this.pt` 未定义而崩。
2. **`clear-declares.cjs` 存在 P0 级判据缺陷（已修）**。它曾把 10 处 declare 全判为「D 类误捕·可直接删」（真实依赖 0）。根因是 `execFileSync("node_modules/.bin/tsc")` 在 Windows 下指向 shell shim ⇒ ENOENT ⇒ 异常 ⇒ 输出为空 ⇒ 所有 declare 都被当成误捕。改为 `node <typescript>/lib/tsc.js` + ENOENT 显式 `exit(2)` 后，结论完全反转：**10/10 全是真实依赖，0 误捕**。手工删 declare 实测 **15 个 TS2304** 已证实。

---

## 二、通关流程（5 方法）

| 方法 | 文件 | 产物锚点 | 关键点 |
|---|---|---|---|
| `askSavePokemonUsage(earned)` | `src/phases/game-over-phase.ts` | @2452814 len=2333 | 区间计价 `PT_SAVE_PRICE_BY_INTERVAL[floor((wave-1)/30)]`；保险锁免费；库存 `-1` 无限次；PT 不足分支写 `pendingSave` |
| `proceedWithVictory(earned, saved)` | 同上 | @2455166 len=1259 | 加成链顺序：**护符金币 +20%/枚 → 死战不退 +50% → 命座 `applyGainMultiplier("ptSettle")`** |
| `continuePtVictoryFlow(newClear, firstClear)` | 同上 | @2448559 len=853 | 🔴 派单遗漏项。`handleUnlocks` → 清理惩戒之壶召唤物 → 销毁训练家 → fadeOut → 收尾 |
| `settlePtSoudacheInventory(party, onRetreat)` | `src/system/game-data.ts` | @3834340 len=1116 | 存活统计 → 保险锁 +1 → 借用返还 `min(借用, 存活)` → 撤离才带出觉醒石 |
| `carryOutAwakeningStones(isVictory)` | 同上 | @3833990 len=327 | 🔴 派单归类偏差：守卫是 `gameMode.isP5X && isVictory`，**属 P5X 不属 PT** |

**`handleGameOver()` 拦劫**：开头插入 PT 结算分支（P5X 觉醒石 → PT 库存结算 → 死亡扣 PT / 胜利 `askSavePokemonUsage` → **提前 return**），
并把 `start()` 的 `gameMode.isClassic || isEndless` 补上 `|| isPtSoudache` ⇒ **PT 模式不弹"是否重试"询问**。

---

## 三、PT 地基（9 项，派单未列）

| 成员 | 产物锚点 | 关键点 |
|---|---|---|
| `GameData.pt` 字段 | `this.pt = 0` | 此前**只有声明、没有字段、也没序列化** |
| `GameData.ptSoudacheData` 字段 | `this.ptSoudacheData` | 惰性化，构造器给空壳 |
| `addPt(amount)` | @3807044 len=374 | 上限 `6e8`；`Math.floor`；`pt<0 \|\| !isFinite` 复位；**正常路径不存盘**（存盘会显著拖慢战斗内累加） |
| `getDailyStarters()` | @3832346 len≈870 | 日期种子 `sin(dateNum+lo+hi)*1e4` + Fisher-Yates + 三级候选池（未持有 → 无限 → 有限） |
| `applyDailyStarters()` | @3833385 len=587 | 跨日把昨日 `-1` 还原为 `1`；用的是**硬编码候选表**而非 `yesterdayStarters`（照搬产物，别"改对"） |
| `initPtSoudacheData()` | @3832290 | 🔴 **已存在时不重建**，只补 `dailyStarterDate` / `dailyStarters`。我第一版直接重建会把玩家库存/觉醒石/命座全清空 |
| `getEryouData()` | @3831756 len=180 | 每次调用都跑 `normalizeEryouData`（产物行为）；复用 `eryou-system` 的两个工厂 |
| `SystemSaveData.pt` / `.ptSoudacheData` | — | `getSystemSaveData` 写入 + `loadSystem` 读回 |
| `BattleScene.updatePtText?` / `animatePtChanged?` | `addPt` 尾部 | 新树**无**这两个方法（PT 余额 HUD 未迁）⇒ 声明为可选 + `?.()`，缺省静默 |

---

## 四、守门员（12 逻辑点 / 19 处命中）

### 已接 9 点

| # | 逻辑点 | 宿主 | 关键实现 |
|---|---|---|---|
| 1 | 写入点 | `battle-scene.ts:newBattle` | `guardianSpec ? currentBattle.guardianBoss = spec : resetEnemyTalentManager()`。🔴 **三元互斥**：不能写成单分支 `if`，否则上一波守门员天赋残留到普通波 |
| 2 | 遭遇生成 | `encounter-phase.ts` | 守门员波次**覆盖固定战斗**（`!guardianSpec && isFixedBattle`）；`setBoss(true, segments)`；沙奈朵强制末位 `REST` |
| 3 | 遭遇天赋 | `encounter-phase.ts` | `getEnemyTalentManager().setTalents(buildGuardianTalentIds(...))` |
| 4 | 禁投球 | `command-phase.ts:458` | 前批已接 |
| 6 | 击败奖励 PT | `victory-phase.ts` | `ptSoudacheEarned += rewardPt` + 提示 + `pushNew("PtSoudacheRetreatPhase")`，位于 `EggLapsePhase` **之前** |
| 7 | 全队恢复 | `faint-phase.ts:178` | 前批已接 |
| 9 | 守门员 AI | `pokemon.ts:getNextMove` | `pickGuardianSpecialMove()` 插在 **moveQueue 清空之后、正常选招之前**，try/catch 静默回退 |
| 11 | 生命汲取 / 一见情缘 | `move-effect-phase.ts` | 插在 `user.isPlayer() && target.isEnemy()` 之后（产物同位）；两处 try/catch **互相独立** |
| 12 | 不死之身 | `pokemon.ts:damage` | 产物**两次**调用（链首 + 链尾兜底），均早退 `return damage`（`Mse` 内部已置 hp=1 + 回血 50%） |

### 未接 3 点（逐条说明阻塞原因）

| # | 逻辑点 | 阻塞 |
|---|---|---|
| 5 | `PokeballPhase` 守门员投球判定 | 新树无 `pokeball-phase.ts` 对应宿主（投球链路已重构） |
| 8 | `battle-info` 守门员天赋 HUD 行 | `guardianTalentText` 字段与 `getGuardianTalentLines` 文案拼接未迁；`buildGuardianTalentLines` 已就绪，只差 UI 槽位 |
| 10 | `calculateBaseStats` 属性乘区 | 产物 @4469152 依赖 `_ue`（天赋→属性映射）/ `Gue`（属性倍率）/ `oue`（攻速倍率）/ `JRe`（冰河期）**四个未迁函数** ⇒ 属**时代天赋**系统，非守门员专有 |

**新增数据表**（`pt-soudache-system.ts`）：`GUARDIAN_BOSS_SPECS`（wave 100 / 150 / 190 三档，含 `speciesPool` / `segments` / `rewardPt` / `extraTalentPool`）· `GUARDIAN_EXTRA_TALENT_POOL`（6 条「尊」）· `GUARDIAN_JIRACHI_POOL`（6 条）· `GUARDIAN_REGIONAL_TALENTS`（三御三家）· `findGuardianBossSpec()`。

**复用不重写**：`buildGuardianTalentIds` / `buildGuardianTalentLines` 已在 `talent-system.ts:1538/1551` 落地 —— 我第一版在 `pt-soudache-system.ts` 重写了一遍，会造成两份随产物漂移，**已删**。

---

## 五、新增实现清单

| 文件 | 新增 |
|---|---|
| `src/system/game-data.ts` | `pt` / `ptSoudacheData` 字段 · `addPt` · `getDailyStarters` · `applyDailyStarters` · `initPtSoudacheData` · `carryOutAwakeningStones` · `settlePtSoudacheInventory` · `getEryouData` · 序列化 + 读回 |
| `src/phases/game-over-phase.ts` | `askSavePokemonUsage` · `proceedWithVictory` · `continuePtVictoryFlow` · `handleGameOver` 拦劫 · `start()` 条件修正 |
| `src/phases/victory-phase.ts` | 守门员击败奖励 PT + 强制撤离 |
| `src/phases/encounter-phase.ts` | 守门员生成分支 + 天赋挂载 |
| `src/phases/move-effect-phase.ts` | 生命汲取 / 一见情缘钩子 |
| `src/battle-scene.ts` | 守门员波次查询 + 写入点 + `resetEnemyTalentManager` |
| `src/field/pokemon.ts` | 守门员 AI 插点 · 不死之身 ×2 |
| `src/data/systems/pt-soudache-system.ts` | 守门员数据表 ×4 · `findGuardianBossSpec` · `pickGuardianSpecialMove` · `PtSoudacheData.bloodline*` 字段 |
| `src/data/systems/talent-system.ts` | `tryApplyYijianQingyuanInfatuation` · `applyShengmingJiquLifesteal` · `tryUndyingBodySurvival` |
| `src/data/systems/mod-augment.ts` | `SystemSaveData` PT 扩展 · `updatePtText?` / `animatePtChanged?` · 移除 8 条已实现的悬空声明 |
| `src/system/game-stats.ts` | `ptSoudacheSessionsWon` / `ptSoudacheTalentSessionsWon` / `highestPtEarned` |
| `tools/clear-declares.cjs` | 🔴 Windows tsc 路径 P0 修复 |

---

## 六、踩坑记录（供后续批次复用）

1. **`isLocalServerConnected` 在新树是 `let` 布尔量，不是函数** —— 加 `()` 报 `TS2349: Type 'Boolean' has no call signatures`。既有正确用法见 `game-over-phase.ts:593` / `title-phase.ts:341`。
2. **`Move` 在新树是 `abstract class`** —— 招式必须 `new PokemonMove(MoveId.X)`，`moveset` 类型是 `PokemonMove[]` 而非 `Move[]`。
3. **`InfatuatedTag.ignoreGender` 字段已不存在** —— 产物旧上游有，新树无 ⇒ 鸭子类型补挂 + 直接跳过 `canAdd` 的性别门。
4. **`pt-soudache-system.ts` 不能值导入进 `game-data.ts`** —— 它在模块求值期执行 `class PtSoudacheStartPhase extends Phase`，值导入会形成运行时循环导致类继承拿到 `undefined`。正解：`import type` 取类型 + 只值导入纯常量。
5. **`initPtSoudacheData` 是幂等的** —— 已存在时只补两个 daily 字段，**不重建**。重建 = 清空玩家全部 PT 养成数据。
6. **`clear-declares.cjs` 的"100% 可靠"结论已作废** —— Windows shim 坑修好了，但仍须每次手工抽查 TS2304。

---

## 七、后续（交 E-2 / L2 台账）

1. **守门员 3 处缺口**：PokeballPhase 投球判定 · battle-info HUD 槽位 · `calculateBaseStats` 属性乘区（阻塞于时代天赋 4 函数）。
2. **PT 余额 HUD**（`updatePtText` / `animatePtChanged` + `ptText` 创建侧）未迁 ⇒ 玩家看不到 PT 变化，但数值正确。
3. **`getEryouData` 已实现**，但 `eryou-system.ts` 的 `bloodlineSlots` / `bloodlineAbilities` 仍**无写入方**（血脉系统未迁）。
4. **建议 H-2 走查时优先验**：PT 开局 → 商店消费 → 击败守门员（wave 100）拿 PT → 撤离 → 存档读回 PT 余额。

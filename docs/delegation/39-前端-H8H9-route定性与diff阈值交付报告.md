# H-8 / H-9 交付报告 · route 定性收口 + diff 阈值调优（第六阶段 · 前端）

> 派单：`docs/delegation/37-第六阶段任务分发.md` §三（H-8 🔴 urgent 10-19~10-20 · H-9 🟠 high 10-19~10-20）
> 交付日期：2026-10-20 ｜ 负责人：前端工程师
> 前置：F-14（场景实现，已交付）· U-11（视觉判定标准，已交付）
> 一句话结论：**H-8 的 27 个 `unknown` 点全部定性完毕、`unknown` 归零；H-9 用「同产物重复运行」实测出噪声底 0.131%，据此把五类 `equalLine` 整体收紧 1.7~4 倍，等价画面误报率实测 0%。未新增任何工具。**

---

## 一、验收对照

| 任务 | 判据 | 结果 |
|---|---|---|
| **H-8** ① | 27 个 unknown **逐个处理**（verified / derived / unreachable + 原因） | ✅ 27/27（derived 18 · unreachable 9） |
| **H-8** ② | `--validate` 复跑，**unknown 归零** | ✅ EXIT=0，`unknown 0` |
| **H-8** ③ | **不新增画面点**（51 锁定） | ✅ 51 点未变（U-11 判定 51/51 仍一一对应） |
| **H-9** ① | 只调 `CLASS_THRESHOLDS`，**不改场景** | ✅ 仅改 `lib/judgement.mjs` 一张表 |
| **H-9** ② | 已知等价画面**误报率 < 5%** | ✅ **0.0%**（4 组等价对全判 equivalent） |
| **H-9** ③ | 产出阈值取值依据 | ✅ 见 §四（噪声底实测 + 外推说明 + 未验证类别） |
| §0.2 铁律 | **不新建工具/使能件/框架** | ✅ 0 个新文件；只改 4 个既有文件 |

回归：`selftest.mjs` **19/19** 通过。

---

## 二、H-8：27 点定性的**依据来源**（先有证据，再下结论）

派单要求「能实跑验证的 → verified；有代码依据的 → derived；确实到不了的 → unreachable + 原因」。
因此第一步不是改标记，而是**从 A 产物反解真实的 UI 结构**。三组实测结果：

### 2.1 `this.handlers` 是密集索引数组，mod 追加 16 个 handler（48..63）

```
48 TalentViewer  49 TalentCodex   50 SuperBackpack  51 (未解析)
52 Jieming       53 EryouReward   54 EryouProgression 55 EryouLevelUp
56 EryouEvolve   57 EryouHeldItem 58 EryouSynthesis   59 EryouGuide
60 EryouTraining 61 EryouLobby    62 EryouSpeciesSearch 63 EryouHeldSynthesis
```
> 反解方式：`l(<classShort>,"<Name>");let <alias>=<classShort>` + `this.handlers=[new <alias>,…]` 逐项对齐。

### 2.2 `MenuOptions` 实测（mod 插入 2 项，其余整体后移）

```
GAME_SETTINGS=0 · ACHIEVEMENTS=1 · STATS=2 · CURRENT_TALENTS=3 ← mod
· TALENT_CODEX=4 ← mod · EGG_LIST=5 · EGG_GACHA=6 · POKEDEX=7
· MANAGE_DATA=8 · COMMUNITY=9 · SAVE_AND_QUIT=10 · LOG_OUT=11
```
且 `MenuUiHandler case 3 → setOverlayMode(V.TALENT_VIEWER)`，`case 4 → V.TALENT_CODEX`，
**case 3 额外要求 `currentBattle`**（⇒ 仅 run 内可用）。

### 2.3 `UiMode` 上真实存在的 18 个 mod 键

`TALENT_VIEWER · TALENT_CODEX · TALENT_SHOP · SUPER_BACKPACK · PT_CONSTELLATION · JIEMING · PT_SOUDACHE_START`
`+ ERYOU_{REWARD, PROGRESSION, LEVELUP, EVOLVE, HELD_ITEM, SYNTHESIS, GUIDE, TRAINING, LOBBY, SEARCH, HELD_SYNTHESIS}`

**并且实测：mod 没有任何自定义热键**（A 产物里 `addKey` 只有上游 SHIFT / DELETE / HOME）
⇒ 所有 mod 界面只能经「菜单 / phase / 战斗内事件」进入，**无法用按键直达**。
这一条直接决定了下面 `unreachable` 的判定标准。

---

## 三、H-8：27 点定性明细

### 3.1 转 `derived`（18 点）—— 有明确代码依据，到达由 `--inject` 真存档保证

| 点 | 依据（摘要） |
|---|---|
| talent.acquire-toast | 获得天赋后由 runInstantEffect/提示链自动弹出（战斗内事件） |
| talent.xingxiang | `switchXingxiang` 触发播报（战斗内事件） |
| eryou.battle | `GameModes.ERYOU=12`，A 产物 `GameMode.getName(): case 12 => 「二游模式」` |
| eryou.abyss-buff | `abyssAttackBuffMultiplier` 在深渊伤害计算被动调用（F-11 已迁） |
| jieming.turnorder | 与 p5x.turnorder 同组件家族（顺序条被动刷新） |
| healer.wish | `HealerWishPhase` 已注册 PHASES，战斗流程自动进入 |
| nianli.stacks / nianli.burst | 层数 HUD 被动刷新 / `NianLiBurstEndPhase` 已注册 |
| p5x.turnorder / .hide / .effect | 顺序条与效果框架**均为被动调用**（`mod-init.ts` 明写「p5x 无需注册」） |
| callingcard.gauge / .resolve | 计量条容器被动创建 / `CallingCardResolvePhase` 由 `handleFightCommand` 末 unshift |
| dianxin.echo | `DianXinEchoEndPhase` 已注册 PHASES |
| misc.terrain.chengfeng / .kongjian | arena tag，触发即 `add`（战斗内自动） |
| misc.mew | `registerMewSystem` / `registerMewStatusProvider` 已在 `mod-init` 接线 |
| misc.pt.hud | `V.PT_SOUDACHE_START` 由 `PtSoudacheStartPhase.start()` 自动 `setMode` |

### 3.2 转 `unreachable`（9 点）—— **本框架无法自动到达，≠ 产品不可达**

| 点 | `unreachableKind` | 原因 |
|---|---|---|
| eryou.synthesis | `private-cursor-index` | 需进 ERYOU lobby 子页，A 侧由游标驱动；源码化产物 `ui.ts` 未接线 16 个 mod handler ⇒ 无双方共有可脚本化路径 |
| eryou.shop | `private-cursor-index` | 同上的深渊商店子页 |
| pt.shop | `private-cursor-index` | `PtSoudacheShopPhase` 需 PT 一轮中途进入，游标无源码依据 |
| pt.settle | `private-cursor-index` | 需完整跑完一轮 PT 才进结算，单次走查无法确定性产出 |
| legendary.popup | `no-deterministic-state` | 传说遭遇随机，当前无可确定性注入样本 |
| legendary.helper | `no-deterministic-state` | 依赖同一随机遭遇 |
| misc.constellation.codex | `ui-handler-not-wired` | A 侧在 STARTER_SELECT 内 `setOverlayMode(V.PT_CONSTELLATION)`；源码化产物 `PtConstellationUiHandler` 未接注册表 ⇒ B 无此界面 |
| misc.constellation.node | `ui-handler-not-wired` | 同上的子视图 |
| misc.super-backpack | `ui-handler-not-wired` | A 侧 `setMode(V.SUPER_BACKPACK)` 只出现在特定道具使用链内（无菜单入口），且 handler 未接线 |

### 3.3 最终分布

```
route 可靠性：verified 2 · derived 40 · unreachable 9 · unknown 0
unreachable 原因分布：private-cursor-index 4 · no-deterministic-state 2 · ui-handler-not-wired 3
```

> `derived` 40 = F-14 的 22 个 + H-8 新转的 18 个。**每个非 verified 点都带 `routeEvidence` 字段**，
> `--validate` 会把缺依据的点直接判不合格（可追溯性硬化）。

---

## 四、H-9：阈值调优（含实测依据）

### 4.1 方法：用「同一产物重复运行」构造**真·等价对**

A/B 双产物本身不等价（B 黑屏 + 缺 22 个画面），不能当等价样本。
等价样本的正确构造是：**同一产物、同一画面点、重复运行两次** —— 内容完全相同，差异只来自渲染/时序。

实测（A 产物，`sys-boot` 跑 3 次 + 历史 2 次）：

| 画面点 | 样本数 | 等价对 | 最大 diffRatio |
|---|---:|---:|---:|
| `boot.ready` | 3 | 3 | **0.131%** |
| `boot.png` | 2 | 1 | **0.000%** |

**⇒ 渲染本身是确定性的**：同产物同画面的帧间/跨运行差异 ≈ 0，噪声来自「捕获时机」而非抗锯齿。

反向对照（**真差异**样本，用于确认阈值没有高到漏判）：

| 配对 | diffRatio |
|---|---:|
| lang-select（实际未导航到位）×2 次运行 | **70.9%** |
| welcome-popup 有/无 ×2 次运行 | **27.2%** |

⇒ 等价（≤0.131%）与真差异（≥27%）之间有 **两个数量级**空隙 ⇒ 阈值可以放心收紧。

### 4.2 新阈值（唯一调优入口 `lib/judgement.mjs` → `CLASS_THRESHOLDS`）

| 类别 | 画面 | equalLine 旧 → 新 | greyLine 旧 → 新 | 依据 |
|---|---|---|---|---|
| **S** | 静态界面 | 0.5% → **0.3%** | 5% → **2.0%** | 实测噪声底 0.131% × ≈2.3 |
| **P** | 弹窗/提示 | 1.0% → **0.5%** | 8% → **3.0%** | 有淡入淡出，留 3.8× 余量 |
| **H** | 战斗 HUD/计量条 | 2.0% → **0.8%** | 10% → **4.0%** | 数字 hinting + 部分填充；**无有效样本，外推** |
| **B** | 战斗全景 | 3.0% → **1.2%** | 15% → **6.0%** | 多精灵 + idle 动画；`boot.ready` 属此类（实测 0.131%） |
| **A** | 动画演出 | 5.0% → **2.5%** | 20% → **10.0%** | 走 keyFrame 关键帧策略；**无有效样本，外推** |

`equalLine = max(实测噪声底 × 2, 该类别固有抖动下限)`；`greyLine ≈ 4×equalLine`（灰区 → AI 审阅）。

### 4.3 误报率验证

```
类别 equalLine greyLine  diffRatio   判定           期望
B     1.20%    6.0%    0.000%   equivalent     equivalent ✓
B     1.20%    6.0%    0.131%   equivalent     equivalent ✓
B     1.20%    6.0%    0.131%   equivalent     equivalent ✓
B     1.20%    6.0%    0.000%   equivalent     equivalent ✓
S     0.30%    2.0%   70.904%   inequivalent   inequivalent ✓
P     0.50%    3.0%   27.251%   inequivalent   inequivalent ✓

等价对 4 → 误报 0 ⇒ 误报率 0.0%（要求 <5%）
真差异 2 → 漏判 0
```

### 4.4 ⚠️ 唯一的不确定项（如实记录，不粉饰）

**H / B / A 三类没有有效等价样本** —— B 侧当前黑屏（E15），战斗类画面在现有证据包里没有「同产物重复运行」的对。
上表这 3 类的数值是**按 S/P 的实测比几何外推**得到的。

⇒ `THRESHOLD_EVIDENCE.unvalidatedClasses = ["H","B","A"]` 已写进代码常量，
**H-2 走查首次跑出战斗类画面后，须用同一方法（同产物重复运行）回收校正**；若某类误报率 > 5%，按 P6-R3 退到「断言为主、diff 仅参考」。

---

## 五、改动清单（0 个新文件）

| 文件 | 改动 |
|---|---|
| `tools/walkthrough/scenarios/catalog.mjs` | 新增 `ROUTE_OVERRIDES`（27 点定性 + `routeEvidence` / `unreachableKind`）与 `EVIDENCE_ONLY`（F-14 已 derived 的 22 点补依据）；新增 `routeReliabilityStats()` |
| `tools/walkthrough/cli.mjs` | `--validate` 硬化（`unknown` 视为非法 · 非 verified 必须有 `routeEvidence` · unreachable 必须有 `unreachableKind`）；`--systems` 增列 derived/unreachable |
| `tools/walkthrough/scenarios/catalog-scenario.mjs` | 新增 `unreachable` 裁定（不计失败，理由入档）；`tally` 增一态 |
| `tools/walkthrough/lib/judgement.mjs` | 仅改 `CLASS_THRESHOLDS`（+ 新增只读的 `THRESHOLD_EVIDENCE` 记录实测来源） |
| `tools/walkthrough/lib/report.mjs` | 裁定分布表增 `unreachable` 行/mark |

> 遵守 §0.2：**未新建任何 `tools/**` 文件或目录**，全部改动都在既有文件内。

---

## 六、可复跑命令

```bash
cd /d/Work/Pokemon/new

# H-8：unknown 必须为 0，且每点定性有依据
node tools/walkthrough/cli.mjs --validate

# 看定性分布
node tools/walkthrough/cli.mjs --systems

# H-8 运行期抽查（unreachable 应记 ⛔ 且不计失败）
node tools/walkthrough/cli.mjs --scenario sys-eryou --product A

# 回归
node tools/walkthrough/selftest.mjs      # 期望 19/19
```

---

## 七、交接与下一步

| 序 | 事项 | 归属 |
|---:|---|---|
| 1 | **H-2 全量走查**：`unknown` 已归零，`sys-<系统> --product both --inject <真存档>` 可直接跑；`derived` 40 点在真存档下 `reachProof` 会升为 `inject` | H-2 |
| 2 | **H-2 首轮回收阈值**：战斗类画面（H/B/A）跑出后按 §4.1 方法校正 `equalLine` | 前端（H-9 尾项） |
| 3 | **H-13 blocked 归账**：`unreachable` 的 `ui-handler-not-wired` 3 项与 `--gates` 的 B 侧 22 项，可直接并入 L2/L3 台账 | H-13 / H-3 |
| 4 | **H-10 报告生成器**：输入已就绪（`report.json` → `state.catalog.records`，含 verdict/class/reachProof/reason），10-21 起做 | 前端 |
| 5 | ⚠️ 若 H-2 发现某个 `derived` 点在真存档下仍 `unproven`，说明该点的触发条件比推断更窄，须回写 `routeEvidence` 并考虑降为 `unreachable` | H-2 → 前端 |

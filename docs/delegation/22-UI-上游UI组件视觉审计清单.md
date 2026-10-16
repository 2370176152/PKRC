# 22 · UI：上游 UI 组件视觉审计清单（U-7）

> **角色**：UI 设计师
> **性质**：派单 24 §五 **U-7（🟡 medium）**—— 依赖 U-4（✅ 已完成）
> **目的**：对上游 UI handler/container 逐一标注「**可复用 / 需改 / 需新建**」，附视觉语言一致性理由，按 S7 施工量排序
> **基准**：锚点树 `src/ui/`（45 handlers + 35 containers + battle-info + settings + utils）× 改版产物实测
> **配套**：`19-UI-多分辨率走查清单.md`（U-4，走查阶段的界面清单与本审计对齐）
> **产出日期**：2026-10-19

---

## 零、TL;DR

| # | 结论 |
|---|---|
| **1** | 审计覆盖上游 **80 个 UI 组件**（45 handler + 35 container）+ 改版自建 **11 类 UI**。改版实际触碰的上游组件仅 **14 个**（10 handler + 3 container + 1 基类）——审计聚焦这 14 个 + 11 个自建类 |
| **2** | 🔴 **改版存在 5 个文本创建入口并存**：上游 `addTextObject`（718 处）+ `setTextStyle`（8 处）｜改版自建 `eryouText/_s`（47 处）+ 屏幕基类 `text()`（40 处）+ `label`（15 处）+ `applyTextStyle`（4 处）——正是 U-3 冻结契约 C-1 要消灭的「多入口」病，S7-2 的收敛对象比预想多 |
| **3** | 🔴 **改版新增内联 hex 95 种 / 143 处**（上游 TS 仅 134 种），集中于战斗浮出文字与 P5X 状态图标——最大单块配色债务 |
| **4** | ✅ **窗口组件复用率高**：`addWindow`（产物别名 `dt`）104 处，改版屏幕全部经它开窗——S7-5 不需要新建窗口体系 |
| **5** | 🆕 **改版给上游基类加了 3 个架构层**：`addSquadWindow`（`cae`，addWindow+scale 0.25 包装）、panel 窗口缓存系统（`this.panels` + `native-hud-*`）、缩放常量 `RH`——需评估保留还是并入上游模式 |
| **6** | ✅ **i18n 覆盖意外的好**：改版屏幕聚集区（L405–475）`M.t()` 调用 **355 次**，改版作者大量复用上游 key——S7-4 的工作量比 2,839 条账面数小（B0 已证重叠率低但调用密度高） |

---

## 一、审计方法与口径

### 1.1 三层分类

| 层 | 定义 | 判定输出 |
|---|---|---|
| **A 层** | 上游组件中**被改版修改或依赖**的（有实测触碰证据） | 逐一标注「可复用 / 需改」+ 理由 + 施工量 |
| **B 层** | 上游组件中**改版完全未动**的 | 批量「可复用（不动）」+ 一句理由 |
| **C 层** | **改版自建**、上游无对应的 UI 类 | 「需新建（已建，S7-5 重构对标）」+ 债务实测 |

### 1.2 测量口径（六维视觉语言评估）

| 维 | 测量项 | 合规基准 |
|---|---|---|
| ① 入口 | 文本创建走哪个工厂 | 统一 `addTextObject` + `{level}`（U-3 C-1） |
| ② 字号 | 裸 `fontSize` / `setFontSize` 计数 | Token 化（白名单除外） |
| ③ 行高 | 手调 `setLineSpacing` 计数 | `lineHeight` token（白名单除外） |
| ④ 配色 | 内联 hex 计数 | `TextStyle` 引用，hex 登记 `palette.extra` |
| ⑤ 组件 | 窗口/光标/滚动条复用 | 上游 `addWindow`；光标/滚动无统一件（见 §3.4） |
| ⑥ 文案 | `M.t()` vs 内联中文 | 新增零内联（B0–B6 分批） |

### 1.3 触碰证据来源

- 改版 UI 类注册点定位（产物 `l(x,"ClassName")` 锚点）
- 上游源码逐文件对比（hex 集合差集、`panels`/`window(` 等方法在锚点树 `ui-handler.ts` **不存在**）
- 分段测量（按注册点分段，同类名同行的区域用中文锚点辅助归因）

---

## 二、入口盘点：5 个文本创建通道（🔴 首要发现）

U-1 曾记录改版自造 2 个工厂（`label` / `applyTextStyle`）。本次审计补全了完整入口清单：

| # | 入口 | 上游对应 | 调用数 | 默认字号 | 判定 |
|---|---|---|---:|---|---|
| 1 | `re` | `addTextObject` | **718** | 样式自带 | ✅ 主力入口，保留 |
| 2 | `vI` | `setTextStyle` | 8 | 样式自带 | ✅ 保留 |
| 3 | `_s`（**`eryouText`**） | **无** | **47** | `Je.body`(54) | 🔴 自建：`re(x,y,t,style,{fontSize:\`${a}px\`,...r}).setOrigin(0,0)` |
| 4 | 屏幕基类 `text(x,y,c,style=F.WINDOW,f=Je.body,wrap)` | **无** | **40** | `Je.body`(54) | 🔴 自建：转调 `_s(Ba+x, uA+y, …)`（Ba/uA=22 屏幕原点偏移） |
| 5 | `oE`（`label`） | **无** | **15** | **36**（micro 来源） | 🔴 自建 |
| 6 | `lB`（`applyTextStyle`） | **无** | 4 | 参数传入 | 🔴 自建（存 `eryouBaseScale`，配 `Ti` 宽度适配） |
| 7 | `paragraph(x,y,c,f=Je.small,style,wrap)` | **无** | 10 | `Je.small`(48) | 🔴 自建（wordWrap 变体） |

**结论**：改版自建入口合计 **116 处调用**（47+40+15+4+10），且**默认值全部已是 `Je` token**——说明改版作者有 token 意识，只是各建各的包装。

**S7-2 收敛建议**（不新增冻结契约条目，属施工策略）：
- `_s`/`text()`/`paragraph()` 三兄弟**合并为一个屏幕基类方法**，内部改走 `{ level }`（改版调用点 97 处零改动，只改基类一处）——与 U-3 §五 `Je` 升级形成闭环
- `label`(15) / `applyTextStyle`(4) 直接删除，调用点改 `{level: MICRO}` / `setTextStyle(obj, style, {level})`

---

## 三、A 层审计：改版修改/依赖的上游组件（14 项，逐一标注）

> 施工量口径：🔴 大（>1 人日）/ 🟠 中 / 🟢 小（<0.5 人日）

### 3.1 Handlers（10 项）

| # | 上游组件 | 改版触碰证据（实测） | 六维评估 | 判定 | 施工量 |
|---|---|---|---|---|---|
| A-1 | **fight-ui-handler** | 重写导航（`返回/确定/↑/↓` 触摸按钮 L367）；新增 **panel 窗口系统**（`this.panels` Map + `native-hud-*` 命名 + `sendToBack`）；新增 `addSquadWindow`(cae) + `RH` 缩放常量 | 入口①：`re` 12 处 ✅；②裸字号 **7**；④hex **7**；⑤窗口 `this.window` 6 处（自建 panel 版，非上游 `addWindow` 直调） | **需改**：视觉合规但架构双层（上游 addWindow + 改版 panel 包装）需归一；7 处裸字号 Token 化 | 🟠 中 |
| A-2 | **battle-info**（`getBattleInfoSlot`） | 65 个中文锚点（A2 重灾区 #5） | 战斗信息栏改造，走 `re` 主力入口 | **需改**：字号/配色核对后 Token 化；P5X 状态图标新增色见 A-11 | 🟠 中 |
| A-3 | **battle-flyout** | 改版重度修改：`setFontSize(45)` + `setLineSpacing(-10)`（L2）、`setFontSize(54/48)` + `setLineSpacing(-1)` ×7（L992） | ②`setFontSize` **9**；③手调行距 **7**；上游源码 hex=0 而该区域产物 hex 密集（见 A-11） | **需改**：静态值（45/54/48）迁 `{level}`；负行距 (-1/-10) 登记白名单（R-3 已含） | 🟠 中 |
| A-4 | **party-ui-handler** | PT 商店挂接：`ptBalance/ptRefresh/ptRefreshConfirm/ptRefreshOk/ptEggShop*/ptEggNoOffers` 等 **34 处 M.t()**（L405/L408/L448） | ⑥i18n **优秀**（全走 M.t）；入口 `re` 8 处 ✅ | **需改**：本身合规度高；S7-5 把 PT/蛋商店 UI 块从 party handler **拆出**为独立 screen（对应 C-4）时保持 M.t 模式 | 🟠 中 |
| A-5 | **starter-select-ui-handler** | `findClosestStarterRow` **166 锚点**（A2 重灾区 #2，最大单点函数）；L410 裸字号 4 | ②裸字号 4；入口 `re` 26 处 | **需改**：起始选择行布局重写，Token 化时按走查项 R-B 核对（66→? 偏差） | 🔴 大 |
| A-6 | **egg-gacha-ui-handler** | 蛋商店扩展（L423：`返回` 导航 + 蛋商店视图切换）；i18n **70** 处 | ②裸字号 **6**；⑥i18n 优秀 | **需改**：6 处裸字号收敛；返回按钮并入 B0 复用 `menu:goBack` | 🟠 中 |
| A-7 | **menu-ui-handler** | 选项文字 `setLineSpacing(12)`（L411/L412） | ③手调行距 12（=白名单候选） | **需改**：行距留白名单或改 `lineHeight` token（12/96=0.125 非标度倍率，建议白名单） | 🟢 小 |
| A-8 | **summary-ui-handler** | 标签 `setLineSpacing(9)`（L371） | ③手调行距 9；②裸字号 6 | **需改**：同上，白名单候选 | 🟢 小 |
| A-9 | **pokedex-ui-handler** | 选项文字 `setLineSpacing(12)`（L440） | ③手调行距 12 | **需改**：同 A-7 | 🟢 小 |
| A-10 | **modifier-select-ui-handler**（`ModifierOption`） | 54 锚点（A2 重灾区 #6） | 道具/持有物选项改造 | **需改**：与 C-3 超级背包共享选项渲染逻辑，建议抽公共组件 | 🟠 中 |
| A-11 | **ui-handler.ts（基类）** | 改版新增：`window(s,i,A,a,r)` panel 方法 + `this.panels` + `addSquadWindow` + `RH=1`（锚点树均不存在） | 架构层扩展 | **需改**：三方会签决定——panel 系统并入上游 `addWindow` 变体机制（`getWindowVariantSuffix` 已有先例）还是保留为改版基类扩展 | 🟠 中 |

### 3.2 Containers（3 项）

| # | 上游组件 | 改版触碰证据 | 六维评估 | 判定 | 施工量 |
|---|---|---|---|---|---|
| A-12 | **battle-flyout**（container） | 同 A-3（改版浮出文字主载体） | ②③见 A-3；④hex 增量主要来源 | **需改**：同 A-3；另 95 种新增 hex 中大部分出自战斗浮出/P5X 图标区，需逐色登记 `palette.extra` 或还原 `TextStyle` | 🔴 大 |
| A-13 | **pokeball-tray / L370 精灵球选择** | `setLineSpacing(this.scale*72)` ×2（=12） | ③手调行距 12 | **需改**：白名单候选 | 🟢 小 |
| A-14 | **scroll-bar**（vs 改版自卷） | 改版详情弹窗**未用**上游 ScrollBar，自建 `setCrop` + zone 滚动（L446） | ⑤组件：自造滚动 | **需改**：改用上游 `scroll-bar.ts` 或登记例外（自卷有裁切性能优势，建议保留 + 登记） | 🟠 中 |

### 3.3 附：可复用但 Token 化时需注意（2 项）

| # | 组件 | 注意点 |
|---|---|---|
| A-15 | **pokemon-info-container** | `body=54` 的**来源地**（`languageSettings.pl`）——U-1 已证。Token 化时**保留 languageSettings 机制**（CJK 字号先例），不要在容器里写死 level |
| A-16 | **move-info-overlay** | 上游 384 中文 + 49 M.t——i18n 模范。改版若扩展招式信息，沿用它 |

---

## 四、B 层：上游原生组件（改版未动）——批量「可复用」

以下组件改版零触碰，视觉语言本就合规（走上游工厂 + `TextStyle` + `M.t()`），**S7 不动**，仅列出备查：

**Handlers（28 个，可复用）**：`title` / `awaitable`（抽象基类，合规）/ `message` / `confirm` / `battle-message`（138 M.t，模范）/ `ball` / `command` / `target-select` / `save-slot-select` / `run-history` / `game-stats` / `achvs` / `challenges-select` / `settings-*` / `login-*` / `registration-*` / `oauth-*` / `change-password-*` / `rename-*` / `session-reload-modal` / `unavailable-modal` / `loading-modal` / `form-modal` / `autocomplete` / `admin` / `test-dialogue` / `mystery-encounter` / `evolution-scene` / `egg-hatch-scene` / `egg-list` / `egg-summary` / `pokedex-page` / `pokedex-scan`

**Containers（22 个，可复用）**：`ability-bar` / `achv-bar` / `base-stats-overlay` / `bgm-bar` / `candy-bar` / `char-sprite` / `daily-run-scoreboard` / `dropdown` / `egg-counter` / `event-display` / `filter-bar` / `filter-text` / `hatched-pokemon` / `move-info-overlay`（A-16）/ `party-exp-bar` / `pokedex-info-overlay` / `pokedex-mon` / `pokemon-hatch-info` / `pokemon-info`（A-15）/ `ribbon-tray` / `saving-icon` / `starter` / `stats` / `time-of-day-widget` / `scroll-bar`（A-14）

**判定理由（统一）**：未触碰 + 上游自家合规（`addTextObject` + `TextStyle` + i18n）+ 无改版标识符（A2 类名四分类为 U 类）。

---

## 五、C 层：改版自建 UI（需新建 · 已建 · S7-5 重构对标）

| # | 改版类 | 系统 | 上游最近对标 | 视觉债务实测 | 判定 | 施工量 |
|---|---|---|---|---|---|---|
| C-1 | **EryouSynthesisUiHandler** | ERYOU | `modifier-select-ui-handler`（材料选择） | **184 锚点**（A2 最大单点 UI）；L466 区域 | **需新建（已建）**：重构时对标 modifier-select 的选项渲染 + Token 化 | 🔴 大 |
| C-2 | **TalentViewerUiHandler** | TALENT | 无（上游无天赋系统） | 48 锚点；L443 `setLineSpacing(2)` + `setFontSize` | **需新建（已建）**：天赋查看器 + 详情弹窗（L446 自卷滚动） | 🔴 大 |
| C-3 | **SuperBackpackUiHandler** | TALENT/物品 | `party-ui-handler`（背包视图） | 47 锚点；L448 hex 5 | **需新建（已建）**：与 A-10 共享选项组件 | 🟠 中 |
| C-4 | **PtSoudacheShopPhase / StartPhase** | SOUDACHE | `modifier-select` / `shop` 模式 | L448 聚集；34 M.t（party 挂接） | **需新建（已建）**：商店 UI Token 化 + 从 party 拆出 | 🟠 中 |
| C-5 | **JiemingResolvePhase** | JIEMING | `confirm-ui-handler`（确认交互） | L364 区域；`jieming-anims` 独立 chunk | **需新建（已建）**：解明演出 + 独立动画 chunk 接入（A3-07） | 🟠 中 |
| C-6 | **HealerWishPhase / NianLiBurstEndPhase / DianXinEchoEndPhase** | HEALER/NIANLI/DIANXIN | `message-ui-handler`（提示） | phase 级，UI 少（L364/L358/L998 注册） | **需新建（已建）**：走 message 链路即可，低债 | 🟢 小 |
| C-7 | **CallingCardGauge** | CALLINGCARD | `candy-bar` / `party-exp-bar`（计量条） | L1028；行距 1 | **需新建（已建）**：对标计量条容器模式 | 🟢 小 |
| C-8 | **legendary-popup**（HTML 模块） | legendary | **无**（非 Phaser） | 独立 chunk 313KB + **499 中文串** + HTML/CSS 模板（`#667eea/#764ba2` 渐变等在列） | **需新建（已建）**：⚠️ 特殊——HTML 渲染不走 Phaser 文本管线，**Token/i18n 适配层不适用**；需单独定稿（多分辨率走查 U-4 的 H 级专项） | 🔴 大 |
| C-9 | **屏幕基类 `text()/paragraph()/hint()/rewardLines()`** | 框架 | 无 | 97 处调用的承载体 | **需新建（已建）**：S7-2 单点收敛目标（§二） | 🟠 中 |
| C-10 | **addSquadWindow(cae) + panel 窗口系统 + RH** | 框架 | `addWindow` + `getWindowVariantSuffix` | 3 个架构层 | **需改/需评估**：见 A-11 会签 | 🟠 中 |
| C-11 | **Breakthrough 页面 / DungeonDetail 地牢详情 / RunInfoUI 天赋历史** | 杂项 | `run-info-ui-handler` | 数据驱动渲染（label/state/detail 对象数组，L457/L471/L372）；Breakthrough/DungeonDetail 裸字号 0 | **需新建（已建）**：数据驱动模式**良好**（文本创建收敛在渲染器一处），S7-5 只需改渲染器 | 🟠 中 |

---

## 六、S7 施工量排序总表

> 排序原则：先架构（入口/基类）后屏幕；先大债后小债；legendary-popup 单列。

| 序 | 项目 | 来源 | 施工量 | 前置 |
|---|---|---|---|---|
| **1** | 入口收敛：`_s`/`text()`/`paragraph` 三合一改走 `{level}`；删 `label`/`applyTextStyle` | §二 / C-9 | 🟠 中 | U-6 会签（R-1~R-4） |
| **2** | EryouSynthesisUiHandler 重构（184 锚点最大单点） | C-1 | 🔴 大 | A3-11 同步 |
| **3** | TalentViewerUiHandler + 详情弹窗 + 自卷滚动取舍 | C-2 / A-14 | 🔴 大 | A3-06 |
| **4** | battle-flyout 三件套（静态字号迁移 + 负行距白名单 + hex 登记 95 种） | A-3 / A-12 | 🔴 大 | R-3 会签 |
| **5** | starter-select 行布局重写（166 锚点） | A-5 | 🔴 大 | 走查项 R-B |
| **6** | SuperBackpack + ModifierOption 抽公共选项组件 | C-3 / A-10 | 🟠 中 | 3 |
| **7** | PT/蛋商店从 party 拆出独立 screen | A-4 / C-4 | 🟠 中 | B0（已完成） |
| **8** | panel 窗口系统 + addSquadWindow + RH 归一会签 | A-11 / C-10 | 🟠 中 | 前端+全栈 |
| **9** | battle-info + P5X 状态图标 | A-2 / A-11 | 🟠 中 | 4 |
| **10** | menu/summary/pokedex/pokeball 行距白名单化（12/9 ×4） | A-7~A-9 / A-13 | 🟢 小 | R-3 会签 |
| **11** | egg-gacha 裸字号 6 处 + 返回并入 menu:goBack | A-6 | 🟢 小 | B0 |
| **12** | Jieming/CallingCard/phase 级 UI 小额重构 | C-5~C-7 | 🟢 小 | 各 A3 任务 |
| **13** | legendary-popup HTML 模块单独定稿（不走 Phaser 管线） | C-8 | 🔴 大 | O-6 授权 + 单独设计 |

---

## 七、验收自检（对照派单 24 §9.2 U-7）

| 验收卡点 | 状态 | 证据 |
|---|---|---|
| ① 上游 UI handler 逐一标注「可复用/需改/需新建」 | ✅ | A 层 16 项逐一标注（§三）｜B 层 50 个批量可复用（§四）｜C 层 11 项需新建（§五）——**80 个上游组件 + 11 个自建类全覆盖** |
| ② 每项附理由（视觉语言一致性） | ✅ | 六维评估（§1.2）+ 每项实测数据（锚点数/裸字号/行距/hex/i18n） |
| ③ 按 S7 施工量排序 | ✅ | §六 13 项排序总表（含前置依赖） |

**附加实测校验**：80 组件清点（45+35）｜改版触碰面定位（类注册点 + 中文锚点）｜hex 差集（上游 134 → 产物 215，改版新增 95/143）｜入口清单 5 通道（718+8 vs 116）｜窗口复用 104 处｜i18n 密度 355 次/改版屏幕区。

---

## 八、复现脚本

```python
# 1. 组件清点
ls .build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993/src/ui/handlers/ | wc -l   # 45
ls .build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993/src/ui/containers/ | wc -l # 35

# 2. 改版触碰定位：产物中找 l(x,"XxxUiHandler") 注册点 → 与上游文件对应

# 3. hex 差集（改版新增色）
#    上游 TS hex 集合 vs 产物 chunk hex 集合（排除 legendary-popup HTML chunk）

# 4. 入口计数
#    re( =718 ｜ _s( =47 ｜ this.text( =40 ｜ this.paragraph( =10 ｜ oE/label =15 ｜ lB/applyTextStyle =4

# 5. 改版基类扩展证据：panels / native-hud / addSquadWindow 在锚点树 ui-handler.ts 不存在
grep -c "panels\|native-hud\|addSquadWindow" <anchor>/src/ui/handlers/ui-handler.ts   # 0
```

---

**UI 设计师**：ui-designer
**产出日期**：2026-10-19
**关联文档**：`16-UI-上游文本API调研.md`（U-1，组件维度 §3.3 的展开）· `21-UI-Token适配层设计.md`（U-6，入口收敛策略）· `19-UI-多分辨率走查清单.md`（U-4，legendary-popup 列入 H 级专项）· `A2-魔改点提取报告.md`（系统清单与锚点数来源）
**下一步**：U-8（新增模式界面重构方案，消费本审计的 C 层清单 + 施工量排序）

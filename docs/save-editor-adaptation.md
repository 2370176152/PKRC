# 存档修改器（tools/save-editor）· 改版适配说明

> 对象：`tools/save-editor/save-editor.html` 及其数据表（`tools/save-editor/data/`）
> 目标改版：PKRC 本仓库 `game/`（PokéRogue 改版，`gameVersion = 1.12.0.11`）
> 原始备份：`tools/save-editor/backups/original/`（改动前原封不动保留，可直接回滚）
> 本轮备份：`tools/save-editor/backups/before-modes/`（仅回滚「模式数据面板」用）
> 结论：**已适配；对真实存档的读写行为与改版前逐字段一致，且修复了一处会破坏改版存档的数据丢失缺陷。**
> 本轮（模式数据面板）：新增「🎮 模式数据」页签，支持**八大师(BDS) / 二游(ERYOU) / 第三特性(三被动)** 的读写与快捷操作，见 §三之二。
> 本轮追加（第 7 轮）：在同一页签内补齐**搜打撤(PT_SOUDACHE) / 火箭队(HUO) / 高种族值挑战(HARD) / 挥指(HUIZHI)** 四种模式，见 §三之三。

---

## 一、适配范围（我理解的任务边界）

修改器原本面向官方 `pagefaultgames/pokerogue`，需要让它正确读写本改版存档，同时**不破坏原有功能**。范围限定为三块：

1. **数据兼容层**：让修改器"看得懂"改版存档（加密/混淆/字段/枚举）。
2. **数据保全层**：修改器读入→写出时，**不得丢弃或篡改它不认识的字段与取值**。
3. **展示完整层**：改版新增的物种/招式/特性/道具要能正确显示中文名，而不是 `未知`。

**明确不在范围内**：不改动游戏本体；不改变修改器既有交互与加解密算法。

---

## 二、复核结论：原本就兼容的部分（无需改动）

经与改版本体打包产物 + 真实存档双向核对，以下关键点**原本已正确**，未做改动：

| 项目 | 核实结果 |
|---|---|
| 加密密钥 | `SAVE_KEY = "x0i2O7WRiANTqPmZ"`，与改版一致 ✅ |
| 加密算法 | CryptoJS AES（OpenSSL 加盐）+ base64，一致 ✅ |
| 系统存档键混淆 | 已实现 `$` 短键（`getSaveField/readSaveField/isCompressedRecord`）✅ |
| 自定义字段透传 | `customPokemonData` / `p5xRuntime` 的子字段自动透传 ✅ |
| 会话新增字段 | `playerFaints / ptSoudache* / dynamicBalanceEnabled / talentSystemData / name` 自动透传 ✅ |
| 未知道具类型 | `mod.typeId` 无中文名时回退显示原始 typeId，不报错 ✅ |

> 说明：该修改器作者此前已针对此改版做过大量工作，因此**大部分适配其实已经完成**。本次是补完剩余的不一致点。

---

## 三、关键改动点（逐条）

### 改动 1 ★ 修复 `customPokemonData.types` 被破坏（数据丢失缺陷）

**位置**：`save-editor.html` → `applyPokemonChanges()`（保存时对全队做规范化的函数）

**问题**：原代码把属性覆盖数组的每个元素按 `0 ≤ type ≤ 18` 过滤，越界者置 `null`；若两个位置都被置空，整个 `types` 被写成 `null`。
- 改版 Type 枚举已扩展到 **`CS = 19`**（`Type` 枚举：`...STELLAR=18, CS=19`）。
- 因此任何带改版属性的宝可梦，**只要打开修改器并保存，属性就会被抹掉**。
- 实测复现：`types = [19] → null`、`types = [9,19] → [9,null]`。

**修复**：按改版本体自身的约定处理——`-1`（`Type.UNKNOWN`）才是"保持默认"标记，整数即具体属性。改为：
```js
const types = customData.types.slice(0, 2).map(t => Number.isInteger(t) ? t : -1);
if (types.every(t => t === -1)) customData.types = 原本为空数组 ? [] : null;
else customData.types = types;
```
效果：官方 0–18、改版 19、乃至未来新增属性**一律原样保留**；同时避免把第二属性写成 `null`（本体对 `null` 与 `-1` 的处理不同，`null` 会导致属性判定异常）。

### 改动 2 ★ 属性枚举表补齐改版属性

- `pokemon-form-names.js`：`POKEMON_TYPE_NAMES` 增补 `19: "传说"`；新增常量 `MAX_VALID_TYPE = 19`。
- `save-editor.html`：`TYPE_ENUM_TO_ID` 增补 `CS: 19`；`TYPE_COLORS` 增补 `19` 配色。
- `renderCustomPokemonData().renderTypeOverrides`：属性下拉从 `0..18` 放宽到 `0..19`；对表中未收录但存档里存在的属性值，额外渲染一个"未知属性 #N"选项，**避免被静默清除**。

### 改动 3 修正存档校验误报

- 位置：`validateSaveData()`。
- 问题：对每只宝可梦强制要求 `battleData` 字段，但官方与改版都以 `summonData` 承载战斗态，改版另用 `customPokemonData`，导致**正常存档被误报**。
- 修复：改为 `battleData / summonData / customPokemonData` 三者皆缺才提示。实测 `sessionData1_Guest.prsv` 警告数 `1 → 0`。

### 改动 4 重新生成数据表（对齐改版）

原数据表由官方源码生成，缺少改版新增条目。现直接从**改版本体 `game/server/dist`** 逆向生成：

| 文件 | 改前 | 改后 | 说明 |
|---|---|---|---|
| `species-names.js` | 1045 | **1088** | 补 43 个改版新增物种（含 8802–8806、8901 等），并保留 2 个历史形变 ID |
| `move-names.js` | 921 | **977** | 补 56 个改版招式 |
| `ability-names.js` | 320 | **388** | 补 68 个改版特性（含 `龙之皮肤` 等） |
| `move-info.js` | 921 | **977** | 招式详情同步改版文本/数值 |

- 覆盖方式：**并集**——完全保留原表条目，只做增补，确保不回退。
- 生成脚本：`tools/save-editor/scripts/gen-from-dist.py`（纯标准库，可重复运行；读取 `game/server/dist`，输出 `tools/save-editor/data/`）。
- 一致性校验：与既有官方条目相比，1043 个共有物种名**逐字一致**；招式/特性的差异均来自改版自身改动。

### 改动 5 游戏模式枚举扩展

- `TRANSLATIONS.gameModes` 由 `0–2` 扩展为改版 `GameMode` 的 `0–12`（含八大师/火箭队/高种族值/挥指/双打/PT搜打撤/P5X/二游）。
- 该表目前仅作字典备用，扩展后不会改变现有行为；此轮又将它提升为「模式数据」面板的取值来源。

---

## 三之二、模式数据面板（本轮新增：八大师 / 二游 / 第三特性）

新增一个模式页签 **「🎮 模式数据」**（`data-mode="modes"` → `#modesPanel` / `#modesContent`），
集中承载改版新增的三类模式数据。设计原则与既有适配一致：**只写入用户显式改动的字段，其余原样回写**。

接入点（改动 6，面板骨架）：
| 位置 | 改动 |
|---|---|
| `.mode-tabs` | 新增 `<div class="mode-tab" data-mode="modes">🎮 模式数据</div>` |
| 面板容器 | 新增 `<div class="panel" id="modesPanel"><div id="modesContent"></div></div>` |
| `renderCurrentFile()` | 追加 `renderModesPanel()` |
| 模式切换处理器 | 追加 `if (mode === 'modes') renderModesPanel();`，并在离开 modes 时先 `applyModeChanges(true)` 落盘 |
| 保存按钮 | 追加 `else if (currentMode === 'modes') applyModeChanges();` |
| 导出按钮 | 追加 `if (currentMode === 'modes') applyModeChanges(true);` |
| 新增常量 | `MODE_ID_BDS/MODE_ID_ERYOU`、`MODE_STAT_FIELDS`、`BDS_*`、`ERYOU_MECHANISMS/DUNGEON_TYPES/ABYSS_MAX_LEVEL/DUNGEON_MAX_LEVEL/TEAM_SLOTS`、`TRIPLE_PASSIVE_*` |
| 重构 | 从 `applyPokemonChanges()` 抽出公共落盘函数 `applyPartyFieldInputs(scope)`，供 `#pokemonPanel` 与 `#modesPanel` 复用（行为不变，见「验证」表） |

### 改动 7 八大师模式（BDS，GameMode = 5）

**具体内容 / 功能范围**
- **系统存档**：新增「各模式游玩 / 通关统计 (gameStats)」区，列出 14 个模式计数（含 `bdsSessionsPlayed` / `bdsSessionsWon`，以及 huo / huizhi / shuangda / ptSoudache 系列）。
  - 存档中**不存在**该键时，输入框显示 `⚪ 该存档尚无此字段` 且**留空即不写入** —— 不向无关存档注入新键。
  - 提供「🏅 补齐八大师成就计数」：把 `bdsSessionsPlayed`/`bdsSessionsWon` 提到 ≥1，满足 `BDS_VICTORY` 成就条件（引擎：`gameStats.bdsSessionsWon >= 1`）。
- **会话存档**：新增「本局模式」区（`gameMode` 下拉 0–12 + 波数 + 分数）与 BDS 专属区。
  - BDS 是**纯数据驱动**模式（固定训练家序列），本体无额外可调参数，可调项即波数 / 分数。
  - 提供「🏁 直接跳到通关波」(=`waveIndex = 200`) 与「🎯 直接拉到通关分数」(=`score >= 5000`)，常量取引擎 `getMaxWaves`/`isWaveFinal`/`getClearScoreBonus`。

**与现有功能的关系**
- 复用既有「批量修改」面板的会话字段（`waveIndex`/`score`/`gameMode`），二者写入同一字段，互不冲突（batch 面板原本没有 `gameMode` 控件，此处补齐）。
- `gameStats` 写入与既有「批量修改 → 游戏统计」同源同机制（`batch_gameStats_<key>` vs `data-mode-field="gameStats.<key>"`），都会在保存时落盘。

### 改动 8 二游模式（ERYOU，GameMode = 12）

**具体内容 / 功能范围**

系统存档 `eryouData`（引擎 `createDefaultEryouData()` / `normalizeEryouData()`）：
| 控件 | 字段 | 说明 |
|---|---|---|
| 普通/金色糖果 | `candy` / `goldCandy` | 直接写入 |
| 深渊解锁层 | `abyssUnlocked` | 夹取 1–10（`Ma`） |
| 当前预设队伍 | `presetTeamIndex` | 夹取 0–2（`hl = 3` 队） |
| 本周键 / 锚点 | `abyssFirstClearWeek` / `abyssFirstClearAnchor` | 按引擎算法生成（UTC+8、周三 4:00 切周，`yyyy-Www`） |
| 副本解锁 | `dungeonUnlocks.<key>` | 逐键 `1–7`（`TE = YR.length`），键格式 `dungeonType[:attribute]` |
| 深渊本周首通 | `abyssFirstClear.<level>` | 10 个勾选框 |
| 宝可梦培养 | `pokemon.<speciesId>.{level, breakthroughs}` | 表格编辑（最低等级 `BA = 5`） |
| 解锁的受限宝可梦 | `unlockedRestricted` | 逗号分隔物种 ID ↔ 数组 |
| 已领奖记录 | `rewardedRuns` | 只读计数 |
- 快捷操作：「✨ 二游全解锁」（糖果 9999 / 金糖果 999 / 深渊 10 层 / 副本满难度 / 宝可梦 Lv.100 满突破）、「🔄 清空领奖记录」（允许重复领奖）、「📅 重置本周深渊首通」。
- 存档**没有** `eryouData` 时不自动创建，只给一个显式「➕ 按本体默认结构创建」按钮。

会话存档 `eryouSession`（引擎 `normalizeEryouSession()`）：
- `kind`（`dungeon` / `abyss`）、`level`（副本 1–7 / 深渊 1–10）、`dungeonType`（`material/exp/heldItem/pt`）、`attribute`（材料本专用，0–17）、`rewardId`、`mechanisms[]`。
- **深渊机制** 5 项可视勾选：`typeDown`（可附带属性）、`physicalDown`、`specialDown`、`singleDown`、`aoeDown`；另有「清空全部机制」一键取消输出压制。
- 快捷操作：重新生成 `rewardId`、设为第 1 层 / 最高层。
- 切换 `kind` 时自动裁剪越界 `level` 并清理深渊专属字段（`abyss` 下删除 `dungeonType`/`attribute`），与引擎 `getDungeonEnemyHpMult`/`getEryouAbyssMechanismMultiplier` 的判定前提保持一致。

**与现有功能的关系**
- 与「晶光星群」补丁**无交集**：二游的群体衰减常量（`isEryou ? 0.5 : 0.75`）与星晶倍率属于不同代码路径，本面板只编辑存档数据、不触碰游戏逻辑。
- 二游的 `rewardId` / `mechanisms` 是**存档级**状态，修改后立即影响对应存档的奖励结算与输出压制；「清空机制 / 重置首通 / 清空领奖记录」只改数据、不回滚已通关记录。

### 改动 9 第三特性（三被动，`customPokemonData.triplePassives`）

**具体内容 / 功能范围**
- 双入口可编辑：
  1. **宝可梦编辑**页每张卡片「🧬 第三特性（三被动）」区（紧邻「特性 / 梦特 / 被动特性提示」）；
  2. **模式数据**页「🧬 第三特性 / 三被动（队伍）」区，逐只列出并附队伍级快捷操作。
- 每只宝可梦 3 个下拉槽（`ABILITY_NAMES` 全表），数据字段为 `customPokemonData.triplePassives.0/1/2`，复用既有 `data-pkm`/`data-field` 落盘机制（支持数组下标）。
- 按钮：启用三被动 / 按规则随机生成 / 清空（单只 + 全队）。
- 挑战项开关：增删 `challenges` 中的 `{id: 10, value: 1}`（`Challenge.TRIPLE_PASSIVE`）。
- 规范化为**恰好 3 项**（引擎 `setTriplePassive` 要求 `length === 3`）；三项全为「未设置」时删除该字段（视为未启用）。

**与现有功能的关系**
- 与既有「被动能力覆盖」(`customPokemonData.passive`) 是**叠加关系**：引擎 `getAbilityAttrs` 会同时收集本体特性与 `getAllPassiveAbilities()` 的全部结果。
- **不额外改写 `pkm.passive`**：引擎 `hasPassive()` 已把「`triplePassives` 为非空数组」直接视为拥有被动，因此保持最小写入（与既有 `customPokemonData.passive` 会顺带置位 `pkm.passive` 的旧行为不同，这里刻意不做）。
- 随机生成按引擎 `getTriplePassiveExcludedAbilities()` 排除 `CSSL1–18`、`WONDER_GUARD`、`KBTX`、`KBTX1–11`，且 3 项互不重复。

---

## 三之三、模式数据面板（第 7 轮新增：搜打撤 / 火箭队 / 高种族值挑战 / 挥指）

在既有「🎮 模式数据」页签内**追加**四类模式的修改项，沿用同一套结构：
`data-mode-field` 收集 → `applyModeChanges()` 夹取落盘 → `renderSessionModeSection()` / `renderSystemModeSection()` 按 `gameMode` 分派 → `validateSaveData()` 只做非阻塞提示 → 未涉及字段原样透传。

新增常量（与既有 `MODE_ID_BDS/MODE_ID_ERYOU` 并列）：
`MODE_ID_HUO=6`、`MODE_ID_HARD=7`、`MODE_ID_HUIZHI=8`、`MODE_ID_PT_SOUDACHE=10`；
`HUO_MAX_WAVE=200`、`HARD_MAX_WAVE=50`、`HUIZHI_MAX_WAVE=50`、`PT_MAX_WAVE=200`、`PT_TALENT_MAX_WAVE=220`、
`MODE_CLEAR_SCORE=5000`、`MODE_ENEMY_MODIFIER_CHANCE={boss:6,normal:18}`；
`PT_MAX=6e8`、`PT_SHOP_REFRESH_STEP=100`、`PT_SHOP_REFRESH_CAP=500`、`PT_SESSION_MAX=1e5`；
`PT_STARTER_IDS`（27 只）、`PT_CONSTELLATION_MAX=6`、`PT_CONSTELLATION_COSTS=[2,3,4,6,8,10]`、
`PT_CONSTELLATION_STAT_LEVELS=[1,2,5]`、`PT_CONSTELLATION_STAT_AMOUNT={1:15,2:20,5:25}`、`PT_STAT_OPTIONS`、
`PT_INV_UNLIMITED=-1`、`PT_SESSION_FIELDS`；
新增 `createDefaultPtSoudacheData()`、`ptConstellationRefund()`、`ptInventoryLabel()`、`boolTriSelect()`、`generatePtRetreatFloors()`。

### 改动 10 搜打撤模式（PT_SOUDACHE，GameMode = 10）

**功能定义**：用改版专属货币 **PT** 在开局商店购买初始宝可梦次数 / 道具，逐层推进并在**撤退锚点楼层**决定「继续」或「带 PT 撤退」；死亡则该局 PT 清零。开启**天赋模式**（`hasDynamicBalance`）后最大波数 200 → 220，并启用天赋商店（`talentSystemData`）。

**可配置选项参数**

会话存档（`sessionData*.prsv`）—— 影响**本局**：

| 控件 | 字段 | 引擎语义 / 范围 |
|---|---|---|
| 本局已获得 PT | `ptSoudacheEarned` | 夹取 0–100000（`PT_SESSION_POINTS_OVERRIDE` 上限 1e5） |
| 天赋模式 | `dynamicBalanceEnabled` | 三态布尔；true 时最大波数 220、通关计入 `ptSoudacheTalentSessionsWon` |
| 撤退锚点楼层 | `ptSoudacheRetreatFloors` | 逗号分隔整数 ↔ 数组；自动过滤非整数、去重、升序 |
| 开局全队被动 | `ptSoudachePassiveEnabled` | 三态布尔 |
| 禁止撤退模式 | `ptSoudacheNoRetreatMode` | 三态布尔 |
| 开局携带道具 | `ptSoudacheStartingItems` | 只读计数（引擎用 `Map<道具ID,数量>`），提供「清空」 |
| 天赋系统数据 | `talentSystemData` | 只读摘要（已获得天赋 / 历史 / 刷新次数 / 保底计数），提供「重置」 |

系统存档（`data_*.prsv`）—— 跨局持久：

| 控件 | 字段 | 引擎语义 / 范围 |
|---|---|---|
| PT 余额 | `pt` | 夹取 0–600,000,000（`addPt`：`Math.min(6e8, pt+n)`） |
| 商店刷新次数 | `ptShop.refreshCount` | ≥0；下次刷新费用 `min(100×(次数+1),500)`，面板实时显示 |
| 商店保底计数 | `ptShop.pityCounter` | ≥0；同时显示当前报价数 / 日期 |
| 天赋图鉴发现数 | `talentCodexDiscovered` | 只读 |
| 局内结算 PT | `ptSoudacheData.ptBalance` | ≥0 |
| 觉醒石数量 | `ptSoudacheData.juexingStoneCount` | ≥0（`Number.isSafeInteger`） |
| **命之座** | `constellations.<sid>` / `constellationChoices.<sid>.<lv>` / `constellationModes.<sid>.<lv>` | 等级 0–6（`qA`）；第 1/2/5 命可自选属性（+15/+20/+25，`nSe`）；第 6 命选「通用」时加成 ×2 |
| **初始宝可梦库存** | `ptSoudacheData.pokemonInventory.<sid>` | `-1`=无限次（∞）、`0`=未拥有/耗尽、`>0`=剩余次数（27 只初始宝可梦） |

**快捷操作**：跳到通关波 (200 / 天赋模式 220)、本局 PT 拉满 (100000)、重新生成撤退锚点（复刻引擎 `generatePtSoudacheRetreatFloors()`，含 19 / 109 / 197）、清空开局道具、重置天赋数据、PT 拉满 (6e8)、重置 PT 商店状态、清除待领奖挑战 (`intervalChallenge`)、一键满命（27 只 × 6 命 + 补足觉醒石）、清空全部命座并返还觉醒石（`ptConstellationRefund` = 前三命累计 2/5/9/15/23/33）、库存一键设为 ∞ / 1 次 / 未拥有。

**与现有功能的关系**
- `ptSoudacheData` 在系统存档（引擎 `getSystemSaveData()`），会话字段仅在会话存档；两者严格分开，互不覆盖。
- `borrowedPokemon` 在引擎保存系统存档时会被置空（`getSystemSaveData` → `borrowedPokemon:{}`），故**不提供编辑**。
- 未玩过搜打撤的存档**不会**被注入 `ptSoudacheData`；只给显式「➕ 按本体默认结构创建」按钮（27 只库存置 0）。
- 命之座 / 库存走**独立落盘函数** `applyPtConstellations()`，而非 `data-mode-field`；原因是这些对象的键是数字（物种 ID），通用的 `writeByPath()` 会把数字键误建成数组。

### 改动 11 火箭队模式（HUO，GameMode = 6）

**功能定义**：共 200 波、通关波 200、通关额外分数 +5000、敌方携带道具概率 6/18 的高难度进程模式；其**独有机制「火箭队捕获」(`huojiandui`)** 允许在训练家战 / Boss 终点生物群系 / 神秘遭遇中捕获宝可梦。

**可配置选项参数**：仅「波数 / 分数」（复用顶部通用区），另给一个「🏁 直接拉到通关条件 (200 / ≥5000)」快捷按钮。

**不可编辑项（已在面板中显式说明）**：
- `huojiandui` 是 **`GameMode` 内的纯代码标记**，存档中**没有**对应字段 —— 由「`gameMode = 6`」自动生效，无法从修改器开关。
- 火箭队**没有**专属会话字段（不像二游有 `eryouSession`、搜打撤有 `ptSoudache*`）。

**系统侧**：`gameStats.huoSessionsPlayed/Won`（已有输入框）+ 「🏅 补齐火箭队成就计数」→ 使 `HUO_VICTORY`（`huoSessionsWon ≥ 1`）达成。

### 改动 12 高种族值挑战（HARD，GameMode = 7）

**功能定义**：经典流程的高难变体，共 50 波、通关波 50、通关分数 +5000；野生 / 训练家宝可梦被强制过滤为**高种族值池**。

**可配置选项参数**：仅「波数 / 分数」+ 「🏁 直接拉到通关条件 (50 / ≥5000)」。

**不可编辑项（已在面板中显式说明）**：过滤规则为**引擎代码常量**，存档无对应字段 ——
`hasHighTierFilter`、`bossStages = [1..48]`、`baseTotal ≥ 600`（Boss 段）/ `≥ 550`（其余波次）、覆盖物种 `≥ 580`（排除无极汰那）。
该模式**也没有**专属 `gameStats` 计数（通关只记经典成就）。

### 改动 13 挥指模式（HUIZHI，GameMode = 8）

**功能定义**：娱乐向模式 —— 敌我双方所有宝可梦招式全部替换为「挥指」(METRONOME)；共 50 波、通关波 50、通关分数 +5000。

**可配置选项参数**：仅「波数 / 分数」+ 「🏁 直接拉到通关条件 (50 / ≥5000)」。

**不可编辑项（已在面板中显式说明）**：挥指招式由**内存中的覆盖表**提供 ——
`HUIZHI_MOVESET_OVERRIDE` / `HUIZHI_OPP_MOVESET_OVERRIDE`（默认 `[METRONOME×4]`），
位于 overrides 对象（改版 `Bj = {}`，**未持久化**），存档中不存在对应字段。

**系统侧**：`gameStats.huizhiSessionsPlayed/Won` + 「🏅 补齐挥指成就计数」→ `HUIZHI_VICTORY`（`huizhiSessionsWon ≥ 1`）。

### 结构一致性说明（第 6 / 7 轮共用）

| 环节 | 实现 |
|---|---|
| 页签 | 同一 `data-mode="modes"` → `#modesPanel` / `#modesContent`，未新增页签 |
| 分派 | `renderSessionModeSection()` 按 `gameMode` 追加；搜打撤额外以 `PT_SESSION_FIELDS` 探测（老存档缺 `gameMode` 也能识别） |
| 落盘 | 统一走 `applyModeChanges(silent)`：通用字段 + 队伍字段 + 命之座/库存 + 越界夹取 |
| 布尔 | 新增三态下拉 `boolTriSelect()`（`（不设置）` / `true` / `false`），未设置即不写入，保持无损透传 |
| 校验 | `validateSaveData()` 追加非阻塞 `warnings`（`pt` / `ptShop` / `ptSoudacheData.constellations` / `ptSoudacheEarned` / `ptSoudacheRetreatFloors` / `dynamicBalanceEnabled`） |
| 刷新 | 依赖型控件带 `data-refresh-modes="true"`；`gameMode` / 天赋模式切换后自动重渲染 |

---

## 四、验证（回归测试）

以 jsdom 无头加载修改器，对**真实存档**跑完整"读入 → 渲染 → 应用修改 → 重新加密 → 解密"链路：

| 测试 | 结果 |
|---|---|
| 与**改动前**逐字段差异比对（3 份真实存档） | **完全一致**，唯一差异是"原版会破坏 `types`、现在不会" |
| 改版存档字段保全（`menghuo*/p5xRuntime/ptSoudache*/talentSystemData`） | 全部保留 ✅ |
| 加解密往返（CryptoJS 加密 → 解密） | 3/3 一致 ✅ |
| 改版物种/招式/特性名称解析 | `8802→音箱蟀侠`、`976→超极巨流水连击`、`387→龙之皮肤` ✅ |
| 官方存档兼容（`gameVersion 1.4.0`，`types 0–18`） | 正常读取与编辑 ✅ |
| 面板渲染（宝可梦/批量/道具/图鉴） | 全部正常，0 个 JS 运行时错误 ✅ |
| 图鉴面板物种下拉 | 1045 → 1088 项 ✅ |

**本轮（模式数据面板）追加验证** —— `scratch/modes-test.cjs`（jsdom 无头），**36 PASS / 0 FAIL**：

| 分组 | 用例 | 结果 |
|---|---|---|
| 回归 | 改版物种/招式/特性名解析、`types`(19/20/空数组) 无损、未知子字段透传、四个旧面板渲染、改版道具显示、属性下拉含「传说」 | ✅ 全通过 |
| 回归 | 官方存档（1.4.0，`types 0–18`）读取与校验 0 错误 | ✅ |
| 回归 | `applyPokemonChanges()` 重构后行为逐字段一致（`harness.cjs` / `accept.cjs` / `compat.cjs` / `test_typeclamp.cjs` 均复用通过） | ✅ |
| 二游 | 会话编辑器渲染、`level` 越界在显示层+应用层都夹到 10、切副本后夹到 7 并写入 `dungeonType`/`attribute`、切副本不丢 `rewardId`、清空 `mechanisms`、重新生成 `rewardId` | ✅ 全通过 |
| 三被动 | 全队启用后长度均为 3、生成值合法且互不重复、**不额外改写 `pkm.passive`**、模式面板渲染 3 槽、挑战项可增删、清空后字段被移除 | ✅ 全通过 |
| 八大师 | 模式面板显示 BDS 专属区、一键跳通关波 (200)、一键拉通关分数 (≥5000) | ✅ 全通过 |
| 系统存档 | 模式统计区渲染、原存档无 `bds*` 时不注入、补齐八大师成就计数、无 `eryouData` 时只给创建入口、创建结构与本体默认一致、图鉴未受影响 | ✅ 全通过 |
| 系统存档 | `eryouData` 编辑器渲染、全解锁（糖果 9999/金 999/深渊 10/副本满/宝可梦 Lv.100 满突破）、清空 `rewardedRuns`、重置深渊首通 | ✅ 全通过 |
| 端到端 | 真实 `.prsv` 读入 → 写入 `eryouSession`/`gameMode` → 加密 → 解密：未知字段保留、键集合一致、密文头 `U2FsdGVkX1`、面板 `<div>` 标签 79/79 平衡 | ✅ 0 JS 错误 |

**第 7 轮追加验证**（搜打撤 / 火箭队 / 高种族值 / 挥指）

`scratch/modes-test.cjs`（jsdom 无头，含第 6 轮全部回归用例）→ **69 PASS / 0 FAIL**：

| 分组 | 用例 | 结果 |
|---|---|---|
| 搜打撤·会话 | 编辑器渲染（含天赋系统区）、三态布尔回填 `true` 并可置 `false`、本局 PT 越界夹到 100000、撤退锚点 intlist 过滤非法+去重+升序、本局 PT 一键拉满、通关波按天赋模式切换 220/200、重新生成撤退锚点（含 19）、清空开局道具、重置天赋数据、未知字段无损、会话校验 0 错误 | ✅ 全通过 |
| 搜打撤·系统 | 无 `ptSoudacheData` 时只给创建入口且有 `pt` 字段、创建结构与引擎默认一致（27 只库存）、PT 越界夹到 6e8、刷新费用提示 400、命之座 DOM 落盘（等级/属性/模式）、库存 -1 显示「∞ 无限次」、一键满命覆盖 27 只并补足觉醒石（27×33=891）、清空命座返还（891→1782）、库存一键 ∞ / 1 次、重置商店状态、补齐火箭队/挥指成就、图鉴未受影响 | ✅ 全通过 |
| 火箭队/高种族值/挥指 | 各自专属区块渲染（含「火箭队捕获」「baseTotal」「METRONOME」说明）、三模式均显示「非搜打撤」占位且无撤退锚点控件、快捷拉到通关条件 (200/50/50 且 ≥5000) | ✅ 全通过 |
| 串扰 | BDS 存档不显示 HUO/HARD/HUIZHI 区块 | ✅ |
| 端到端（`scratch/pt-roundtrip.cjs`） | 真实 `sessionData4_Guest.prsv`：`gameMode`/`ptSoudacheEarned`/撤退锚点/三布尔/`talentSystemData` 写后加密再解密全部保真、未知字段保留、键集合一致、密文头 `U2FsdGVkX1`、`<div>` 标签平衡 ✅；系统存档：PT 写入未越界、`ptSoudacheData` 结构与引擎默认逐键一致、命之座/库存落盘、图鉴与初始数据未受影响 | ✅ **21 PASS / 0 FAIL** |

**既有 6 个回归脚本全部复跑通过**（第 7 轮改动未影响任何既有功能）：

| 脚本 | 结果 |
|---|---|
| `accept.cjs` | 验收 **PASS** ✅（`types` 保留 `[19,9]/[20,-1]/[]`，未知字段透传，0 JS 错误）|
| `compat.cjs` | 官方存档 **PASS** ✅（图鉴 1088 项，0 warn / 0 err）|
| `validate_check.cjs` | 两份真实会话存档 `valid:true, w:0, e:0` ✅ |
| `test_typeclamp.cjs` | `DESTRUCTIVE CHANGE DETECTED: false` ✅ |
| `regress.cjs` | `严重问题数: 0` / `JS 运行期错误: 0` ✅ |
| `harness.cjs` | 加解密往返一致、10 个改版会话字段全部保留 ✅ |
| `modes-roundtrip.cjs` | 键集合一致、`U2FsdGVkX1`、0 JS 错误 ✅ |
| `checkload.cjs` | 数据表加载正常 ✅ |

---

## 五、已知限制

- `species-abilities.js`（物种→特性索引，用于图鉴解锁时写特性位）仍为官方版数据，改版新增物种在该功能下会被跳过（面板显示不受影响，写入时跳过）。如需补全需另做一份改版特性索引。
- `PokemonInfo` 里的改版"HJ/净空"仅在本地化中存在，**本体 `Type` 枚举并无对应数值**（无战斗逻辑），故未纳入属性表——这是有意为之，避免下拉中出现游戏不接受的值。
- 模式数据面板中：
  - 八大师（BDS）为纯数据驱动模式，**本体没有可调参数**，面板只暴露波数 / 分数（以及系统存档的模式计数）；BDS 的固定对战表（波 5/8/25/…/199/200）无法在存档层修改。
  - 二游 `eryouData.pokemon` 仅开放 `level` / `breakthroughs` 编辑；`unlockedForms` / `selectedForm` / `moveset` / `heldItems` / `evolutionGenes` 等仍按原值透传（避免误改导致本体 normalize 后语义漂移）。
  - 三被动随机生成的「合法池」来自 `ability-names.js`（改版全表）；被排除项按**名称**匹配（`CSSL1–18`/`WONDER_GUARD`/`KBTX*`），若该表后续改名需同步。
  - 会话存档里 `gameMode` 改为 12 但缺少 `eryouSession` 时，面板会提示先用「切换模式」区块建立会话；本体也会在 `launchEryouRun` 时自行补齐。
- 第 7 轮新增的四种模式：
  - **火箭队 / 高种族值 / 挥指** 三者都**没有专属存档字段**（既无会话字段也无专属 `gameStats`）；其定义性参数（`huojiandui`、`hasHighTierFilter`/`bossStages`、`HUIZHI_MOVESET_OVERRIDE`）全部位于引擎代码或内存 overrides 对象中，**存档层不可修改**。面板以只读说明块明确标注，并提供波数 / 分数与成就计数快捷操作。
  - **搜打撤**的 `ptSoudacheStartingItems` 引擎以 `Map<道具ID,数量>` 保存，JSON 化后键值语义不稳定，故仅提供只读计数与「整项清空」，不支持逐项编辑。
  - **搜打撤**的 `ptSoudacheData.pokemonInventory` 只开放 27 只**初始宝可梦**（引擎 `eT` 列表）；未在该列表内的物种即使写入也不会被搜打撤选择界面使用。
  - **命之座**的「专属效果」由引擎服务端式的 `r0[speciesId].exclusiveNodes` 数据表 + 各物种专属实现决定，修改器只能写「等级 / 通用属性选择 / 模式标记」，**不能**改写专属效果本身；写入 `exclusive` 会让引擎走该物种自带的专属逻辑（若该命座层无专属节点则等价于通用）。
  - 天赋模式（`dynamicBalanceEnabled`）在会话存档中决定最大波数（200 / 220），面板在开启时会同步「跳到通关波」的目标值；该字段在引擎侧还会影响天赋商店与 `ptSoudacheTalentSessions*` 计数路径。

---

## 六、回滚方法

```bash
# ① 回滚到「适配最初完成时」的版本（去掉本轮与上轮全部模式面板工作）
cp tools/save-editor/backups/original/* tools/save-editor/

# ② 仅回滚「🎮 模式数据」面板（第 6 轮 八大师/二游/第三特性 + 第 7 轮 搜打撤/火箭队/高种族值/挥指）
#    注：两轮改动均为同一会话内的纯追加；该备份早于两轮，恢复后模式页签整体消失，其余功能不受影响。
cp tools/save-editor/backups/before-modes/save-editor.html tools/save-editor/save-editor.html
cp tools/save-editor/backups/before-modes/save-editor-adaptation.md docs/save-editor-adaptation.md
```

> 若只需禁用第 7 轮这四种模式：删除 `renderSessionModeSection()` 中 `MODE_ID_PT_SOUDACHE / MODE_ID_HUO / MODE_ID_HARD / MODE_ID_HUIZHI` 四处分派、`renderSystemModeSection()` 中的 `renderSoudacheSystemEditor(data)` 调用，以及对应常量与处理函数即可；`applyModeChanges()` 中的夹取块与 `validateSaveData()` 中的告警为**旁路逻辑**，保留也不会改变其它模式的行为。

---

## 七、附：重新生成数据表

当改版更新、枚举变化时：

```bash
cd <PKRC 项目根目录>
python tools/save-editor/scripts/gen-from-dist.py
```

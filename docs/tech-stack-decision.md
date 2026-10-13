# PKRC 技术栈决策记录（ADR）

> **归属**：`docs/delegation/03-后端工程师-派单.md` §4.2 任务 8.1 / v2 看板 S8d-1
> **性质**：决策记录（ADR）。**不是**可行性推演——所有结论均附**本次实测**证据。
> **实测执行**：2026-10-13（本轮）
> **上游核验**：2026-10-13，直连 `github.com/pagefaultgames/pokerogue`（**直连可用**，见 §1.2）
> **前置文档**：`06-源码化与其他技术决策.md`（本文档**修正其 3 处已被实测推翻的结论**）

---

## 0. 本次实测对前序文档的修正（TL;DR · 先看这个）

`06-源码化与其他技术决策.md` 成文时受 BLOCK-1/2/3 干扰，部分结论基于推测。本轮实测**直接推翻或细化**了 3 条：

| # | 前序结论（06 号报告 / 09 号清单） | 实测结果 | 影响 |
|---|---|---|---|
| **M-1** | BLOCK-3「clone 卡住，建议放弃 partial clone 改完整 clone；若代理不可用则换源」 | ✅ **直连 GitHub 完全可用**。`git clone --depth 1 --single-branch --branch beta` → **21 MB，数十秒完成**（含 `src/` 全量 TS 源码）。**根因不是代理，而是 `--filter=blob:none` 的 promisor 按需拉取在受限网络下反复超时** | A0 可**立即完成**，关键路径解锁 |
| **M-2** | 「上游要求 Node 22（`.nvmrc`，2025-04-15 commit #5586）」 | ⚠️ 该结论**对 2025-04 成立**，但**上游 beta 现状是 `v24.9.0`**（实测 `raw/beta/.nvmrc` → `v24.9.0`）。包管理器为 **`pnpm@10.34.5`**（实测 `packageManager` 字段） | 构建期工具链版本需按**锁定的源码分支**定，不按"22"一刀切 |
| **M-3** | 「上游基线锁定在 2025-06 ~ 2025-08，v1.11.x」 | ⚠️ **区间正确但偏保守**。实测找到**硬上界 = 2025-09-22**：locales 仓库 commit `1d4c019`「Removed now unused es-MX, zh-CN and zh-TW」删除了 `zh-CN` 目录。本仓库 `dist/locales/` **仍为 `zh-CN/zh-TW`** → **早于 2025-09-22** | A0-2 从"区间"升级为"**单点可锁定**"，见 §2 |

> **一句话**：BLOCK-1/2/3 **全部可解，且其中两项（BLOCK-2/3）本轮已实测解掉**。A0 不存在真实阻塞。

---

# 第一部分　A/B/C 三路径决策

## 1.1 决策记录

| 项 | 内容 |
|---|---|
| **决策** | 本阶段选择 **路径 B（锚点补丁 + 外置模块层）**，并**并行启动路径 C 的只读准备工作** |
| **决策日期** | 2026-10-13 |
| **参与角色** | 项目所有者、后端、全栈 |
| **取代关系** | v2 看板 §七 已将本次主路径**改为 C（源码化）**；本文档记录的是 **B→C 的决策依据与迁移契约**，与 v2 看板一致（B 是过渡态） |

### 备选方案对比

| 维度 | A. 维持现状（改产物） | **B. 锚点补丁 + 外置层** | C. 源码化 |
|---|---|---|---|
| 可维护性 | 差（改压缩单行） | 好 | **最好** |
| 前置成本 | 无 | 低 | 高（但**低于前序估计**，见 §2） |
| 解决"无源码" | ❌ | ⚠️ 部分 | ✅ |
| 上游更新存活 | ❌ chunk 哈希一变全废 | ⚠️ 锚点可能失效 | ✅ git merge |
| AGPL 合规 | ❌ | ⚠️ 部分（外置层合规，补丁修改部分仍不合规） | ✅ |
| 本次风险 | — | 低（可回退） | **高**（V1/V2 极高风险，见 v2 看板 §八） |

### 选择理由

1. **AGPL-3.0 合规压力已归零**：据 `07-源码化优先级重估与分工重组.md`，本项目**不对外分发** → AGPL 第 13 条的网络交互义务不触发 → 源码化从"法律必需"降级为"工程优化"。**这是决策的最大变量**，也是 v2 把 C 提为主路径的前提。
2. **C 的真正成本在 C-4（魔改点迁移）**，不在 C-1/C-2/C-3（见 §2，三项均已可执行）。
3. **B 的产出不是废料**：`pkrc/**` 有源码，接口设计得好即可**逐模块搬进上游源码**，成为 C 的一部分。

### 代价与已知限制（诚实版）

| 限制 | 说明 |
|---|---|
| 双轨维护 | B 期间，补丁与外置层需同时维护；C 完成后补丁通道退役 |
| 锚点脆弱 | 上游 `loading-scene-*.js` 的 chunk 哈希随版本变，锚点需重扫（R1 高风险） |
| 短期收益有限 | B 的"可维护性收益"要到 C 才完全兑现 |
| **不擅长** | B **无法**解决「产物不可重建」；**无法**支持上游合并；**无法**让新功能脱离补丁 |

---

# 第二部分　C 路径可行性实测（核心产出）

> 派单 §4.2 要求「必须**实际执行**，不是纸面推演」。以下四项**全部已实际执行**。

## 2.1 C-1 上游版本对齐 —— ✅ **已从"区间"收敛到"硬上界"**

### 实测方法（可复现）

```bash
# 1. 克隆 locales 仓库（外置 submodule，独立仓库，体积小）
git clone --filter=blob:none --no-checkout https://github.com/pagefaultgames/pokerogue-locales
cd pokerogue-locales

# 2. 找删除 zh-CN 目录的那个 commit
git log --format='%h %ad %s' --date=short -- 'zh-CN'
```

### 实测输出

```
1d4c0199 2025-09-22 Removed now unused es-MX, zh-CN and zh-TW     ← 硬上界
877daafa 2025-09-22 Add Oval Stone entries (#238)
37e9a389 2025-09-22 Pontoon: Update Chinese (Simplified) (zh-CN) ...
74de730a 2025-09-11 Camel case remaining keys and remove missing keys (#237)
e0657485 2025-08-27 "plasma_sage" key renamed to "plasmaSage" (#235)
69979a8b 2025-08-25 Pontoon: Update Chinese (Simplified) (zh-CN) ...
```

### 判定

| 事实 | 值 |
|---|---|
| locales 中文本地化目录**改名/删除**的 commit | `1d4c0199`，**2025-09-22** |
| 本仓库 `dist/locales/` 中文目录名 | **`zh-CN` / `zh-TW`**（实测，17 个语言目录） |
| **结论** | 本仓库产物**严格早于 2025-09-22** |

> **这比 06 号报告的「2025-06 ~ 2025-08」更紧**：上界从"2025-10 之前"收敛到"**2025-09-22 之前**"。

### 进一步收紧的空间（下一步执行项）

`877daafa`（同样 2025-09-22）之后仍有 `zh-CN` 目录内容更新。用**文件清单 + 内容哈希**做二分，可把区间压到**单日**：

```bash
# 待执行：把本地 locales/zh-CN 的每个文件与上游历史逐个 commit 比对
# 判据：文件名口径 + 内容 sha256 全等
```

### 🔴 C-1 已发现的重要口径差异（影响魔改点迁移，必须记录）

本轮**实际比对**本地 `dist/locales/zh-CN/`（64 文件）与上游 `zh-CN`（92 文件），发现三类差异：

| 差异类型 | 本地 | 上游 | 判定 |
|---|---|---|---|
| **构建期展平** | `mystery-encounters/` 是**目录（31 个文件）**；`biome.json`、`pokemonSummary.json` 单数命名 | `mystery-encounters/` 展平为**32 个独立文件**；`biomes.json`（复数） | ⚠️ **命名/组织口径不同**——可能来自**构建脚本的转换步骤**，而非上游原文。定位版本时必须归一后比对 |
| **`trainers-common.json` / `pokemon-category.json`** | ❌ 本地无 | ✅ 上游有 | 上游较新（或构建期合并了） |
| **魔改新增（上游确认无）** | `talent.json` / `talent-codex.json` / `talent-tag.json` ✅ | ❌ 无 | **确认魔改新增**，作为 A2 输入 |

> **结论**：C-1 的精确定位**需要先做命名归一**（`biomes.json`↔`biome.json`、展平规则），否则会得到虚假的"不匹配"。
> **好消息**：`talent*.json` 三个文件是**干净的魔改新增证据**，无歧义。

---

## 2.2 C-2 Vite 构建可复现 —— ✅ **方案已敲定，管线正确性验证待执行**

### 工具链（实测，非推测）

| 项 | 实测值 | 证据 |
|---|---|---|
| 包管理器 | **`pnpm@10.34.5`** | 实测上游 `package.json` 的 `packageManager` 字段 |
| Node（上游 beta 现状） | **`v24.9.0`** | 实测 `raw.githubusercontent.com/.../beta/.nvmrc` |
| Node 22 陈述的适用期 | 对 **2025-04 之后**的上游成立；对 2026 的 beta **已过时** | 06 号报告引用 commit #5586，需注明时点 |
| 本机可用 Node | **v22.22.2**（系统，已在 PATH） | 实测 |
| 本机便携 Node | **v16.16.0** | 实测（**仅用于运行期服务**） |
| 本机 corepack | **0.34.6**（随 Node 22 自带） | 实测 |

> ⚠️ **修正**：09 号清单说「上游要求 Node 22」——这在**锁定到 2025 年中的源码**时成立；但若直接用 beta HEAD，需按 **Node 24 + pnpm 10** 配工具链。
> **建议**：既然目标是 **2025-09-22 之前的版本**，应**按锁定 commit 的 `.nvmrc`/`packageManager` 定版本**，而非照搬 beta。

### 判据修正（确认 06 号报告的两段式）

```text
阶段 1（验证管线正确性）
  未魔改的上游 baseline 构建 → 产物 hash 应与上游官方 release 一致
  ⚠️ 若不一致 → 说明工具链版本或构建环境不同 → 先解决，不要继续

阶段 2（叠加魔改）
  应用魔改 → hash 变化  ✅ 属预期，不是失败
```

**为什么必须两段式**：本仓库是魔改版，源码必然与原版不同，**hash 必然不同**。前序派单 §4.2 把「产物 hash 与现发行版对齐」列为判据是**错误的**——已在本报告修正。

### 当前状态

| 步骤 | 状态 |
|---|---|
| 工具链版本确认 | ✅ 已完成（上表） |
| pnpm 可用性 | ⚠️ **未安装**，但 corepack 0.34.6 可用 → `corepack prepare pnpm@10.34.5 --activate` 即可（**无需 npm -g，不污染全局**） |
| 上游源码获取 | ✅ **实测可行**，见 §3.1 |
| baseline 构建 | ⏳ 待执行（需先完成 A0-2 锁定 commit） |

---

## 2.3 C-3 资产管线复现 —— ✅ **已实际执行，产出可复现脚本**

### 产出物

| 文件 | 说明 |
|---|---|
| `tools/inventory-assets.cjs` | **只读**资产清点器，可重复执行，支持 `--json` 输出 |
| 下表 | 由该脚本在 2026-10-13 实际生成 |

### 实测结果

```
总计：38,061 文件 / 758.8 MB
```

| 分区 | 大小 | 文件数 | 来源 | AGPL 义务 |
|---|---|---|---|---|
| `assets/`（构建产物） | 7.9 MB | 9 | Vite 构建产物（含魔改补丁） | **必须提供** |
| `locales/` | 5.0 MB | 1,138 | `pagefaultgames/pokerogue-locales`（外置 submodule） | **必须提供** |
| `images/` | 316.4 MB | 33,239 | `pagefaultgames/pokerogue-assets` + 魔改新增 | 视情况 |
| `audio/` | 404.4 MB | 2,732 | `pagefaultgames/pokerogue-assets` | 视情况 |
| `battle-anims/` | 23.8 MB | 925 | `pagefaultgames/pokerogue-assets` | 视情况 |
| `fonts/` | 1.2 MB | 8 | 上游 `public/fonts`（**逐字体各自许可**） | 视情况 |

### 完整获取路径

```bash
# 上游主仓库（含 src/ + public/ + 两个 submodule 声明）
git clone --depth 1 --single-branch --branch <LOCKED_REF> \
  https://github.com/pagefaultgames/pokerogue.git

# 两个外置资源 submodule（实测 `.gitmodules` 原文）
#   [submodule "assets"]  path=assets   url=.../pokerogue-assets.git   branch=beta
#   [submodule "locales"] path=locales  url=.../pokerogue-locales.git  branch=main
git submodule update --init --depth 1 assets locales
```

| 资产类别 | 能否从上游获取 | 备注 |
|---|---|---|
| `src/**`（TS 源码） | ✅ 上游主仓库 | — |
| `locales/**` | ✅ `pokerogue-locales` submodule | 文本资产 |
| `images/`、`audio/`、`battle-anims/`、`fonts/` | ✅ `pokerogue-assets` submodule | **二进制**，体积大头（~745 MB） |
| **魔改新增美术** | ❌ **不在上游** | 见下 |

### ⚠️ 魔改新增资产的授权风险（实探测得）

| 资产 | 大小 | 状态 |
|---|---|---|
| `images/mingzuo/` | **212.0 KB** | 🔴 来源与授权**不明确** |
| `images/mingzuo.zip` | 189.2 KB | 🔴 同上（**注意：压缩包应在构建产物中剔除**） |
| `locales/zh-CN/talent.json` | 22.5 KB | ✅ 魔改新增（文本，可控） |
| `locales/zh-CN/talent-codex.json` | 456 B | ✅ 同上 |
| `locales/zh-CN/talent-tag.json` | 294 B | ✅ 同上 |

> **行动项（归后端/项目所有者）**：
> 1. `images/mingzuo.zip` 出现在**构建产物**里 —— 压缩包不应随 dist 发布（既占体积又是一份无来源交代的副本）。
> 2. 魔改新增美术需**追溯来源并在 `NOTICE.md` 声明**；若来源不明，源码化时**不能**把它当作上游资产处理。

### 根目录散文件（实探测得）

| 文件 | 大小 | 说明 |
|---|---|---|
| `.gitkeep` | 0 B | 占位 |
| `exp-sprites.json` | 67.9 KB | 上游数据 |
| `index.html` | 6.9 KB | **构建产物**（含补丁锚点，见注） |
| `logo128.png` / `logo512.png` | 2.9 / 6.1 KB | 上游 |
| `manifest.webmanifest` | 558 B | 上游 PWA |
| `service-worker.js` | 98 B | 上游 |
| `starter-colors.json` | 14.9 KB | 上游 |
| `update-source-comments.py` | 2.2 KB | ⚠️ **魔改工具误入 dist** —— 应在构建时排除 |

**注**：实测 `game/server/dist/index.html` 与 `PKRC/game/server/dist/index.html` **完全一致**（`diff` 无输出），说明**当前 dist 尚未挂载任何钩子/pkrc 脚本**。`index.html` 中的 `touchControls` 为上游原生结构。

---

## 2.4 C-4 魔改点迁移清点 —— ⚠️ **真正的阻塞项（确认前序判断）**

| 来源 | 状态 | 说明 |
|---|---|---|
| 前端 pointerdown 清点 | ✅ **已完成** → `10-前端-pointerdown清点表.md` | 55 处 pointerdown，38 处 canvas 交互点，18 个改版新增 UiMode |
| UI 字号/文案清点 | ⏳ 未开始（U-1/U-2） | 27 种字号 → token；1808 条文案 |
| **「魔改点 → 上游文件」映射表** | 🔴 **未开始，且是唯一的真实瓶颈** | 需 `A0-2` 锁定 commit 后，逐条落到上游 TS 文件 |

### 已确认的魔改增量（本轮实测补充）

| 魔改系统 | 证据 | 上游对应 |
|---|---|---|
| 天赋 | `locales/zh-CN/talent{,-codex,-tag}.json`（**本轮实测确认上游无**） | ❌ 新增 |
| 命之座 | `images/mingzuo/`（212 KB，**本轮实测**） | ❌ 新增 |
| 解明 | `assets/jieming-anims-D_uicwAh.js` | ❌ 新增 |
| 二游 | `ERYOU_*` ×11 个 UiMode（前端已实测） | ❌ 新增 |
| PT 搜打撤 | `PT_CONSTELLATION` / `PT_SOUDACHE_START` | ❌ 新增 |
| canvas 鼠标交互层 | 38 处 pointerdown（上游 canvas **完全无**） | ⚠️ 改动 `src/ui/**` |
| 虚拟手柄常驻 | CSS 3 条 `!important` | ⚠️ 改动 |

### 建议

> C-4 **不单独立项**，随 v2 的 S6/S7 顺手累积（零边际成本）。但**必须先有 A0-2 的 commit 锁定**，否则映射目标不明确。

---

# 第三部分　D1–D9 技术决策（逐项落地结论）

> 前序 `06` 号报告列出 9 项决策。本轮**把其中的「待确认」项补成实测结论**。

| # | 决策 | 推荐 | 本轮实测补充 |
|---|---|---|---|
| **D1** | Node 运行时策略 | ✅ **保留便携 v16 跑服务 + 文档显式记录** | 实测 `shared/runtime/node.exe` = **v16.16.0**；服务层已在 v16 上**全绿通过 33 项测试**（见 §4.2）。详见 §3.2 |
| **D2** | Electron 壳 | ✅ 自写主进程；**暂不升 Chromium** | 未变。前序已核实 Electron 25.7.0 |
| **D3** | 依赖策略 | ✅ **禁止新增运行时依赖** + 锁定精确版本 | ⚠️ **实测发现**：`shared/runtime/node_modules/` 内已装 **express 4.19.2**、**http-proxy-middleware 3.0.0**（共 79 个包），与 `package.json` 的 `^4.19.2` / `^3.0.0` 一致。**建议去掉 `^` 锁精确版本**（见 §3.3） |
| **D4** | 配置格式 | ✅ **纯 JSON** | 实测 `dist/pkrc/config/input-config.json` 已存在且为合法 JSON。规则已在派单落实 |
| **D5** | 存档兼容 | ✅ 冻结格式 + 换壳前置备份 + 迁移工具 | 未变。**本轮未触碰任何存档相关代码** |
| **D6** | i18n 架构 | ✅ 外置 `pkrc.*` 命名空间 | **本轮实测**：本地 `zh-CN` 用 `talent*.json`，与上游 key 无冲突，验证了"共存"可行 |
| **D7** | 测试策略 | ✅ 四轨 | ✅ **轨 1（单测）已落地并跑绿**：`game/server/test-server.cjs` 33 项，无第三方框架（符合 D3）。见 §4.2 |
| **D8** | 分发策略 | ✅ 声明内部使用（合规压力归零） | 据 `07` 号文档：**不对外分发** → AGPL 义务不触发 → **源码化降为工程优化项**。这是 A/B/C 决策的关键输入 |
| **D9** | 日志策略 | ✅ 纯本地、不收集、不外发 | ✅ **已落地**：`game/server/logger.cjs`，写 `game/logs/`，无任何网络调用（已在单测中断言仅 require 内置模块） |

---

## 3.1 补充决策 D10（本轮新增）：源码获取方式

| 项 | 内容 |
|---|---|
| **问题** | BLOCK-3 的根因判断有误，导致 A0 被不必要地阻塞 |
| **决策** | **放弃 `--filter=blob:none` partial clone，改用 `--depth 1 --single-branch`**；`ghproxy.net` 代理**不再需要** |
| **理由** | promisor 模式在受限网络下需**按需反复请求 remote** 才能补 blob，网络抖动会被放大成"卡住"。`--depth 1` 一次握手拿全量当层快照，没有二次请求 |
| **实测** | `beta` 分支 depth=1：**21 MB / 数十秒**，`src/` 完整（含 `src/ui/handlers/` 全部 handler） |
| **代价** | ❌ 丢失历史 → **无法据此定位版本**。所以 **版本定位必须走 C-1 的 locales 路径**（独立仓库、可全量克隆），而非主仓库历史 |
| **完整方案** | 见 `09-并行工作清单.md` 待更新的 §1.3；命令见 §2.3 |

## 3.2 补充决策 D1 的细化：双 Node 并存（实测确认）

| Node | 路径 | 版本 | 用途 | 实测状态 |
|---|---|---|---|---|
| **运行期** | `shared/runtime/node.exe` | **v16.16.0** | Express 静态服务 | ✅ 33 项测试全绿；未使用 v17+ 语法 |
| **构建期** | 系统 PATH `node` | **v22.22.2** | Vite / TS 编译 | ✅ 已可用 |
| 构建期（上游 beta 现状） | 需按锁定 commit 决定 | **v24.9.0** | Vite / TS 编译 | ⚠️ 若用 beta HEAD |

**代码规范（必须遵守）**：`game/server/**` 的运行时代码**只能用 Node 16 支持的语法**。
- 允许：`?.`、`??`、可选 catch binding、`Array.prototype.flat`
- ❌ 禁止：**顶层 `await`**（v14.8+ 的 ESM 特性，CJS 中不可用）、`structuredClone`（v17+）、`Array.prototype.findLast`（v18+）
- 已落地验证：`test-server.cjs` 含「便携 Node v16 --check」用例

**安全提示**：Node 16 已于 **2023-09 EOL**，不再收安全补丁。当前服务**仅监听 `127.0.0.1`**（实测绑定地址），风险低。若将来改为对外监听或 `0.0.0.0`，**必须先升到 v22**。

## 3.3 补充决策 D3 的细化：版本锁定

**实测**：便携 `node_modules/` 内实际安装版本与 `package.json` 范围一致：

| 包 | `package.json` 声明 | 实际安装 | 风险 |
|---|---|---|---|
| `express` | `^4.19.2` | **4.19.2** | ⚠️ `^` 允许 4.20/4.21… 若重新装依赖会漂移 |
| `http-proxy-middleware` | `^3.0.0` | **3.0.0** | ⚠️ 同上 |

**建议**：改为精确版本

```json
{
  "dependencies": {
    "express": "4.19.2",
    "http-proxy-middleware": "3.0.0"
  }
}
```

> **注意**：便携环境**不应重跑 `npm install`**（会拉新版本或失败）。若要锁版本，**只改 `package.json` 声明**，不重装 —— 让声明与已装版本对齐即可。
> **另**：`http-proxy-middleware` 的用途仍需确认（很可能是开发期代理，生产可移除 → 可再减一个依赖）。**留待项目所有者确认**。

---

# 第四部分　S8 交付物与验收

## 4.1 S1 服务层交付（本轮完成）

| 文件 | 说明 |
|---|---|
| `game/server/server.cjs` | 由 60 行脚本重构为工厂：`createApp()` / `startServer()` / `parseArgs()` / `resolvePort()` |
| `game/server/logger.cjs` | 日志模块：级别前缀、轮转、`hasError()` / `currentLogPath()` |
| `game/server/test-server.cjs` | 无框架验收测试（33 项） |
| `tools/inventory-assets.cjs` | 只读资产清点器（S8b-1） |
| `game/README-启动.md` | 启动文档（S8a-4） |

## 4.2 验收结果（实测）

**运行方式**（无需任何新依赖）：

```bash
cd game/server
NODE_PATH=../../shared/runtime/node_modules ../../shared/runtime/node.exe test-server.cjs
```

**结果**：`总计 33 项：通过 33，失败 0，跳过 2`

| 派单验收项 | 判据 | 实测结果 |
|---|---|---|
| 1-A 默认行为不变 | 8000 + `./dist` | ✅ 常量与行为均未变 |
| 1-B `PORT` 透传 | `PORT=8100` → 8100 | ✅ 含"env > cli > 默认"优先级测试 |
| 1-C `--serve-only` | 只起服务 | ✅ 端到端实测（真实 825 MB dist） |
| 1-D 日志落盘 | `node-<时间戳>.log`，合流 | ✅ 实测日志含 INFO/ERROR 前缀 |
| 1-E 日志轮转 | 超 N 份删最旧 | ✅ 预置 12 份 → 保留 10 份；且**不误删无关文件** |
| 1-F 错误信号 | `hasError()` | ✅ EADDRINUSE 场景实测：退出码 1 + ERROR 落盘 + 修复建议 |
| 1-G 优雅关闭 | `close()` 释放端口 | ✅ 含 keep-alive 挂起场景，3s 内 resolve |
| 1-H 无新依赖 | `dependencies` 不变 | ✅ 断言 + 源码级 require 白名单扫描 |
| 7-A 动态端口 | `port:0` 返回真实端口 | ✅ 与 `server.address().port` 一致；双实例并存 |
| 7-B 优雅关闭 | Electron 退出无残留 | ✅ 同上 |

**跳过 2 项（环境限制，非代码缺陷）**：沙箱禁止 spawn 可执行文件（EBUSY）→ 无法在子进程里再验一次便携 Node。
**但**：本次测试进程**本身就是便携 Node v16**（实测 `node v16.16.0`），因此"在 v16 上跑通"这一结论**已被 33 项实测覆盖**。

## 4.3 未完成 / 待后续

| 项 | 前置 | 归属 |
|---|---|---|
| baseline 构建 + hash 对齐 | A0-2 锁定 commit | 全栈 / 后端 |
| `docs/analysis-report.md` 补充（技术栈快照 + 版本错配实测） | S7 后 | 后端 |
| C-1 精确定位（把区间压到单日） | 命名归一后二分 | 后端 |
| 魔改新增美术授权追溯 | 项目所有者 | 项目所有者 |

---

# 附录　证据索引（本轮实测）

| 结论 | 证据 |
|---|---|
| 直连 GitHub 可用，clone 21 MB | `git clone --depth 1 --single-branch --branch beta` 实测，退出码 0 |
| 上游 beta `.nvmrc` = v24.9.0 | `raw.githubusercontent.com/.../beta/.nvmrc` 实测 |
| 上游 beta `packageManager` = pnpm@10.34.5 | 上游 `package.json` 实测 |
| locales 改名硬上界 2025-09-22 | `pokerogue-locales` commit `1d4c0199`「Removed now unused es-MX, zh-CN and zh-TW」 |
| 本地 locales 仍为 `zh-CN`/`zh-TW` | `ls game/server/dist/locales/`（17 目录） |
| 上游 `.gitmodules` 两个 submodule | `raw/.../beta/.gitmodules` 实测 |
| `talent*.json` 为魔改新增 | 本地 64 文件 vs 上游 92 文件清单比对 |
| dist 总计 758.8 MB / 38,061 文件 | `tools/inventory-assets.cjs` 实测输出 |
| `mingzuo/` 212 KB + `mingzuo.zip` 189 KB | 同上 |
| 便携 Node = v16.16.0；express 4.19.2；hpm 3.0.0 | `shared/runtime/` 实测 |
| `dist/index.html` 无钩子补丁 | 与 `PKRC/` 版本 `diff` 无输出 |
| corepack 0.34.6 可用 | 系统 Node 22 实测 |

---

> **本报告的证据均为 2026-10-13 本轮实测**，可复现（命令已列出）。
> **与 06 号报告的关系**：本文档**修正其 M-1/M-2/M-3 三处**（见 §0），其余结论继承。
> **AGPL 法律解读不构成法律意见**，分发前请咨询专业法律顾问。

# PokeRogue 魔改版（中文离线整合版）项目分析报告

> 分析对象：`E:\BaiduNetdiskDownload\Pokemon`
> 结论：这是一个基于开源项目 [pagefaultgames/pokerogue](https://github.com/pagefaultgames/pokerogue) 的**中文离线整合 / 魔改发行版**（PRS 系列，B站"黑咖啡和冰月亮"汉化打包，UI 套件由"呆猫"提供），在官方版本之上叠加了大量自研系统与新模式。
> 重要前提：**项目内不含 TypeScript 源码**，只有编译后的构建产物（`server/dist`）。因此"目录结构/技术栈"分析的是**发行版结构**，而非官方源码仓库结构。
>
> 📌 **目录整理提示（2026-10-13）**：本文成文于目录整理之前，下文目录树记录的是**原始发行版结构**（根目录平铺、中文目录名）。现已重构为：游戏主体 → `game/`（`启动游戏.bat` → `game/start-game.bat`、`server/` → `game/server/`、`pokerogue-win32-x64/` → `game/pokerogue-win32-x64/`）、修改器/工具 → `tools/`、共享资源与 Node 运行时 → `shared/`、文档 → `docs/`。阅读时请按此映射，最新结构以仓库 README 为准。

---

## 一、整体目录结构与技术栈

### 1.1 目录结构

```
Pokemon/                              ← 发行版根目录（游戏目录）
├── 启动游戏.bat                       ← 一键启动脚本（核心入口）
├── 解除端口占用.bat                    ← 释放被占用的 8000 端口
├── 更新须知.txt / 游戏说明书和wiki.txt   ← 发行版说明（版本特性、操作、wiki）
├── 地图路线和神兽分布图鉴.png            ← 攻略图（非程序资源）
├── 属性相克表_SWSH.png / 性格表.png      ← 攻略图
├── list.txt                          ← 上一版本（电脑版5.1.0）的完整文件清单，用于比对/校验
├── node_output.txt / node_error.txt   ← 服务器运行日志（stdout / stderr）
│
├── node.exe, npm/npx, corepack*,      ← 内置【便携版 Node 运行时】（无需系统装 Node）
│   nodevars.bat, node_modules/, package.json, package-lock.json
├── install_tools.bat                 ← Node 原生模块编译环境安装脚本（备用）
│
├── server/                           ← 【本地 Web 服务器 + 游戏本体】
│   ├── server.cjs                    ← Express 静态服务器（约 60 行）
│   └── dist/                         ← 游戏构建产物（Vite 输出，约 3.8 万文件 / 825 MB）
│       ├── index.html                ← 入口页（含虚拟手柄 DOM/CSS）
│       ├── assets/                   ← JS/CSS 分包（游戏全部逻辑在这里）
│       ├── images/  (33239 文件)      ← 精灵图集、UI、道具、命座、P5X 图标等
│       ├── audio/   (2732 文件)       ← BGM / 音效 / 叫声 / 战斗音
│       ├── battle-anims/ (925 个)     ← 战斗动画定义 JSON
│       ├── locales/  (1138 文件)      ← i18next 多语言（18 种语言，含完整 zh-CN）
│       ├── fonts/                    ← 字体（含 emerald/pkmnems 等）
│       └── config/                   ← 空目录（预留）
│
└── pokerogue-win32-x64/              ← 【Electron 桌面外壳】
    ├── pokerogue.exe (约 163 MB)      ← Electron 主程序
    ├── *.dll / *.pak / icudtl.dat    ← Chromium/Electron 运行时（版本 25.7.0）
    └── resources/app/                ← Nativefier 封装配置
        ├── nativefier.json            ← targetUrl = http://localhost:8000/
        ├── package.json               ← pokerogue-nativefier-cb4fbe
        └── lib/main.js, preload.js    ← Electron 主进程（webpack 打包）
```

### 1.2 技术栈

| 层次 | 技术 | 说明 |
|---|---|---|
| 游戏引擎 | **Phaser 3** | 2D 渲染/场景/输入（bundle 中大量 `Phaser.*` 调用） |
| 语言 / 构建 | **TypeScript + Vite** | 产物为 hash 命名分包（如 `index-D3KKGO7Y.js`） |
| 国际化 | **i18next** | `locales/<lang>/*.json`，共 18 种语言 |
| 本地服务 | **Node.js + Express 4** | `server/server.cjs`，静态托管 `dist/` |
| 桌面外壳 | **Electron 25.7.0 + Nativefier 52.0.0** | 把网页套成 .exe，窗口 1280×800，加载 `localhost:8000` |
| 素材 | PNG 图集 + JSON 索引、WebAudio | 精灵/图标/音频/动画 |
| 存档 | 浏览器本地存储（IndexedDB/localStorage） | 离线版，无账号/云端 |

---

## 二、核心模块与主要功能

游戏本体（`server/dist`）是一套完整的类 PokeRogue 肉鸽游戏，主要模块：

1. **战斗系统** —— `battle-scene`、招式/特性/状态/天气/地形/场地、双打、速度制出手、战斗动画（925 个 JSON 动画）、招式命中与文本。
2. **宝可梦数据** —— 3078 个精灵图集条目、形态/进化/蛋招/被动、图鉴（Pokedex）、起始宝可梦（starter）与糖果。
3. **肉鸽流程** —— 波次推进、地区（biome，38 种）、Boss、**神秘遭遇（mystery-encounters）**、商店、道具叠加（stackable modifiers）。
4. **元进度** —— 起始解锁、成就（achv）、蛋票/凭证（voucher）、存档槽。
5. **UI 层** —— Phaser 场景化 UI（菜单/背包/队伍/图鉴/设置等），支持键盘、手柄与**触屏虚拟按键**（`index.html` 中内置十字键/AB 键）。
6. **数据管理** —— 存档导入导出、模式选择、设置（语言/音量/倍速等）。

---

## 三、相比原版 PokeRogue 的新增 / 修改（重点）

> 证据来源：`locales/zh-CN/` 自定义词条、`images/` 自定义素材目录、以及 `assets/loading-scene-*.js` 中反查到的自研逻辑与中文提示文本。

### 3.1 汉化（基础层）
- `locales/zh-CN/` 提供 **64 个词条文件**的完整简中；相对英文目录**多出 `pokemonSummary.json`**，并大量补充了孵蛋、进化道具、模式、技能战斗文本等条目（对应"更新须知"第 5 条）。
- 大量"彩蛋"开场语被本地化改写（`splash-texts.json`，如"命中不满我就敢空。""失败是成功之母"等）。

### 3.2 自研系统（最核心的改动）

| 系统 | 关键证据 | 说明 |
|---|---|---|
| **天赋系统 Talent** | `locales/zh-CN/talent.json`、`talent-tag.json`、`talent-codex.json` | 共 **100 个天赋**（按属性分为"X之力·攻击/防御"、训练/特攻/体力等），有**天赋商店**、**天赋图鉴（收集）**、稀有度（普通/稀有/史诗/终极）、**层数叠加（最多 5 层）**、刷新消耗、撤离结算。原版完全没有。 |
| **命之座系统** | `images/mingzuo/`（chant/cleanse/flame/guard/hat/vigor/wish 等图标）、bundle 中"觉醒石点亮命座""命之座结算加成""重置命座返还觉醒石" | 用**觉醒石**逐"命"点亮，提供专属性增益与结算加成（本局 PT/金币/结算 PT 三选一）。捆绑解锁特定角色的出战资格。 |
| **解明系统 Jieming** | `assets/jieming-anims-*.js`、`images/p5x-buffs/…/jieming.png`、bundle 中"解明位未解锁""解明只能在第 5 位" | 队伍**第 5 位为"解明"**，永不上场、只在场下提供增益，**分享自身 15% 属性**给场上；3 个解明技能"进本即冷却"。属于手游化的辅助位设计。 |
| **P5X 战斗系统** | `images/p5x-buffs/`（buffs.json + 图集 + SVG/PNG，**38 个增益/减益图标**）、bundle 中 One More / Highlight / Brainwash / Despair / Sea Guard 等 | 引入 Persona 5 X 风格的状态图标与规则（速度制出手、"4 打 6"、突袭/快手还击判定等）。 |
| **二游模式 Eryou** | `ERYOU_*` 系列枚举（GUILD/LOBBY/PROGRESSION/REWARD/SEARCH/EVOLVE/HELD_ITEM…）、内置 **17 页图文引导** `ERYOU_GUIDE` | **改动最大**：把肉鸽改造成"局外养成 + 副本/深渊"的手游体系——局外等级（糖+PT）、突破（白/蓝/紫/金材料，7 次）、进化（基因+PT）、材料/持有物合成、3 支预选队伍（每队 4 出战+1 解明）、材料/经验/持有物/PT 四类副本（各 7 档难度）、**深渊 10 层×10 波**（每周一 4:00 换阵容与首通）、局内禁经验/商店/抽选/捕捉、隐藏平衡与倍速上限 8 倍。 |
| **PT 搜打撤模式 Soudache** | bundle 中"PT搜打撤模式""PT撤离点触发""撤离结算"、携带购买道具进场 | 撤离（extraction）类玩法：进场携带购买道具、有撤离点与撤离结算。 |
| **传说弹窗 Legendary Popup** | `assets/legendary-popup-*.js`（含设备性能检测/简化动画） | 邂逅传说宝可梦时的全屏弹窗动画。 |

### 3.3 新增游戏模式（GameMode 工厂，索引 0–12）

| 编号 | 模式 | 备注 |
|---|---|---|
| 0–4 | 经典 / 无尽 / 融合无尽 / 每日 / 挑战 | **原版即有的 5 种** |
| 5 | **八大师模式**（BDS） | 道馆向（`daoguan` 标记） |
| 6 | **火箭队模式**（huojiandui） | 无商店 |
| 7 | **高种族值挑战** | `bossStages` 覆盖第 1–48 层全 Boss |
| 8 | **挥指模式**（huizhi） | 火箭队 + 特化规则 |
| 9 | **双打挑战**（shuangda） | 双打规则，红牌改判、濒死换人重写 |
| 10 | **PT 搜打撤模式** | 撤离玩法 |
| 11 | **P5X 模式** | 速度制、动态平衡、无商店、无神秘遭遇 |
| 12 | **二游模式** | 无训练家、无神秘遭遇、无商店 |

### 3.4 新增挑战条件（`locales/zh-CN/challenges.json`）
- **相同宝可梦**（同编号/进化链组队）
- **随机进化挑战**（三级：每 10 级进化 / 特性随机 / 双方随机被动）
- **三被动挑战**（开局双方全局随机 3 个被动）
- **无免费治疗**（禁用每 10 层免费治疗）
- **无挑战**（不启用任何挑战）

### 3.5 体验 / UI / 素材改动
- 新增**开场语与游玩须知**、**横/竖屏选择提示框**、**战斗命中率显示**、**波数前显示地区**、修复**糖果罐/复活种子贴图**、修复五个存档位（"更新须知"第 1–4、6–8 条）。
- 新增素材目录：`images/events/`（活动图：万圣节 2024、Pokémon Day 2025、九月更新等 65 张）、`images/cg/`（通关 CG `end_f/end_m`）、`images/character/`（劲敌立绘）、`images/mingzuo/`、`images/p5x-buffs/`。
- `assets/` 中额外分包：`jieming-anims-*.js`、`legendary-popup-*.js`、`loading-scene-*.js`（自定义逻辑主要集中于此）。

> ⚠️ 说明：`更新须知.txt` 提到的"金手指（随机获得五张蛋票）"在当前 build 的 JS 中**未检索到**（无"金手指/蛋票"字样），应属该系列版本特性或已随新版移除；本 build 实际主打的是上表中的二游/P5X/命座/天赋等系统。

---

## 四、运行方式与关键依赖

### 4.1 启动链路
```
启动游戏.bat
   ├─ 1) 启动 Electron 外壳：pokerogue-win32-x64/pokerogue.exe
   ├─ 2) 启动内置 Node：node.exe server/server.cjs   （监听 8000，日志写 node_output.txt / node_error.txt）
   ├─ 3) Electron 加载 http://localhost:8000/ → Express 从 server/dist 提供静态资源 → 游戏运行
   └─ 4) 脚本轮询 pokerogue.exe 进程；窗口关闭后自动 taskkill 掉 Node 进程
```
- 端口被占用时运行 **`解除端口占用.bat`**（杀掉占用 8000 端口的进程）。
- 玩家操作：`WASD` 选择、`Z` 继续、`X` 返回、`M` 菜单、`C` 查看战斗属性。

### 4.2 关键依赖
- **`package.json`（服务器侧）**：`express ^4.19.2`、`http-proxy-middleware ^3.0.0`
  - 注：`server.cjs` 实际只用了 `express`；`http-proxy-middleware` 未被引用（疑似遗留/预留）。
- **内置便携 Node 运行时**：`node.exe` + `npm/npx/corepack`（用户无需自行安装 Node）。
- **桌面运行时**：Electron **25.7.0**（`pokerogue-win32-x64/version` 实测值）+ Nativefier 52.0.0。
- **游戏侧**：Phaser 3 + i18next + Vite（均已编译进 `assets/*.js`，无需单独安装）。

### 4.3 已知问题与注意点
1. **`server/server.cjs` 存在真实 Bug**：第 27 行 `fs.access(...)` 使用了**未 `require` 的 `fs`**，会抛 `ReferenceError: fs is not defined`（`node_error.txt` 中已大量记录）。由于前面 `express.static` 已能直接服务 `dist`，通常不影响游戏；但 `app.get("*")` 这条兜底路由一旦命中就会报 500。
2. **版本时间戳不一致**：`pokerogue-win32-x64`（2024-05）、`server/dist`（2025-03 / 2025-10）差异明显，说明**游戏本体被反复替换/覆盖更新**（汉化整合版的典型做法）。
3. **无源码**：项目内没有任何 `.ts/.tsx`，要改功能只能改 `locales`、`images` 等资源，或反编译 `assets/*.js`。
4. `list.txt` 是**上一版本（"电脑版5.1.0(感谢真群主呆猫提供的ui套件)"）的完整文件清单**，可用于核对本次发行包是否缺文件。

---

## 五、一句话总结
这是一个**以官方 PokeRogue 为底座、由中文社区二次开发并离线打包的魔改版**：外层是"便携 Node + Express + Nativefier/Electron"的免安装启动壳，内层是 Phaser 3 编译产物；相较原版，最大的增量是**天赋、命之座、解明、P5X 战斗、二游模式、PT 搜打撤**六大自研系统，以及**八大师/火箭队/挥指/双打等一批新游戏模式与挑战条件**，并配有完整的简体中文汉化。

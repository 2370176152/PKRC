# PKRC — PokéRogue 中文魔改离线整合版

基于开源项目 [pagefaultgames/pokerogue](https://github.com/pagefaultgames/pokerogue) 的**中文离线整合 / 魔改发行版**（PRS 系列汉化打包），在官方版本之上叠加了自研系统与新模式，并打包为「Electron 桌面壳 + 本地 Express 服务器」的一键离线运行形态。

> **重要前提：本仓库不含 TypeScript 源码。** 游戏本体是 Vite 构建产物（`game/server/dist/`），所有魔改都以「精确字符串补丁」的形式作用于构建产物，并可完整回滚（见 [tools/game-patcher/](tools/game-patcher/)）。

---

## 一、目录结构

```
PKRC/
├── game/                            # 【游戏主体】可独立分发运行
│   ├── start-game.bat               # 一键启动（Node 静态服务 + Electron 窗口）
│   ├── free-port.bat                # 释放被占用的 8000 端口
│   ├── package.json                 # 服务器侧依赖声明（express）
│   ├── package-lock.json
│   ├── server/
│   │   ├── server.cjs               # Express 静态服务器（监听 8000）
│   │   └── dist/                    # 游戏构建产物（文本部分入库，见「组装指南」）
│   └── pokerogue-win32-x64/         # Electron 桌面外壳（二进制，需自行放置）
├── tools/                           # 【修改器 / 工具】与游戏主体相互独立
│   ├── save-editor/                 # 存档修改器（网页版，浏览器直接打开）
│   │   ├── save-editor.html         # 修改器入口
│   │   ├── crypto-js.js             # 存档加密库（AES）
│   │   ├── data/                    # 从游戏产物逆向生成的数据表（11 个 JS）
│   │   ├── scripts/                 # 数据表生成 / 校验 / 调试脚本（19 个）
│   │   ├── backups/                 # 修改器自身的历史备份（original / before-modes）
│   │   └── samples/                 # 测试用存档样本（.prsv，二进制不入库）
│   └── game-patcher/                # 游戏补丁工具（可回滚）
│       ├── patch-game.py            # 补丁应用 / 撤销 / 状态 / 语法校验
│       ├── backup/                  # 被改文件的原始备份（*.orig，revert 依据）
│       └── README.md                # 补丁维护方法
├── shared/                          # 【公共依赖与共享资源】
│   ├── data/                        # 数据表与攻略图（文本：csv/json/md/html）
│   └── runtime/                     # 便携 Node 运行时放置处（二进制不入库）
├── docs/                            # 【文档】分析报告、修改说明、适配说明等
└── README.md / LICENSE / NOTICE.md
```

---

## 二、组装指南（二进制资产放置）

本仓库只跟踪**文本资产**（约 56 MB）。要得到完整可运行副本，需把下列二进制资产放置到对应位置：

| 资产 | 放置位置 | 来源 |
| --- | --- | --- |
| 游戏构建产物中的二进制素材 | `game/server/dist/images/`、`audio/`、`fonts/` | 原发行包 `server/dist/` 下同名目录（约 860 MB） |
| Electron 桌面外壳 | `game/pokerogue-win32-x64/` | 原发行包同名目录（约 232 MB，含 `pokerogue.exe`） |
| 便携 Node 运行时 | `shared/runtime/` | 原发行包根目录的 `node.exe`、`npm`/`npx`/`corepack`、`nodevars.bat`、`install_tools.bat`、`node_etw_provider.man` |
| express 依赖 | `shared/runtime/node_modules/` | 在 `game/` 下执行 `npm install`（见 `game/package.json`），或从原发行包 `node_modules/` 复制 |
| 二进制数据表 / 攻略图 | `shared/data/` | 原发行包根目录的 `*.xlsx`、`*.png`（文本等价物已入库） |

放置完成后目录形态即与整理前一致，双击 `game/start-game.bat` 即可运行。

### 启动方式

1. 将上述资产放置到位；
2. 双击 **`game/start-game.bat`**——脚本会依次：
   - 启动内置 Node 运行 `server/server.cjs`（监听 8000 端口，等待就绪）；
   - 启动 Electron 加载 `http://localhost:8000/`；
   - 关闭窗口时按 PID 清理 Node 进程；
3. 如端口被占用，先运行 **`game/free-port.bat`**。

---

## 三、工具说明

### 3.1 游戏补丁工具 `tools/game-patcher/`

本工程无 TS 源码，7 条魔改补丁全部以「精确字符串替换」作用于 Vite 产物，支持应用 / 撤销 / 状态查询 / 语法校验：

```bash
python tools/game-patcher/patch-game.py list        # 列出全部补丁及当前状态
python tools/game-patcher/patch-game.py apply       # 应用全部（已应用的会跳过）
python tools/game-patcher/patch-game.py revert      # 从 backup/*.orig 还原
python tools/game-patcher/patch-game.py verify      # node --check 语法校验
```

维护方法（新增 / 调整补丁）见 [tools/game-patcher/README.md](tools/game-patcher/README.md)，逐条补丁的技术细节见 [docs/patch-notes.md](docs/patch-notes.md)。

### 3.2 存档修改器 `tools/save-editor/`

浏览器直接打开 `tools/save-editor/save-editor.html` 即可使用（无需服务器）。数据表由游戏产物逆向生成，改版更新后重新生成的方法见 [tools/save-editor/scripts/README.md](tools/save-editor/scripts/README.md)。

---

## 四、本改版的主要内容

| 补丁 id | 效果 |
| --- | --- |
| `tera-starstorm-type` | 晶光星群：解除「必须太乐巴戈斯 + 必须星晶太晶化」，一律按星晶属性结算 |
| `tera-starstorm-target` | 晶光星群：无条件命中全体敌人 |
| `stellar-multiplier-fixed` | 星晶属性伤害倍率恒为 2× |
| `pt-save-import-allow` | 放行搜打撤（PT）模式存档的导入 |
| `pt-save-import-gamemode-literal` | 修正移动端存档守卫的模式判定笔误（6 → 10） |
| `tera-move-category-attr` | 太晶招式类别判定去掉太晶化前置条件 |
| `nihil-light-category` | 归无之光招式属性：龙 → 改版自定义属性 CS |

另含大量汉化、新模式（八大师 / 搜打撤 / 火箭队 / 高种族值 / 挥指等）与系统调整，详见 [docs/analysis-report.md](docs/analysis-report.md)。

---

## 五、已修复的问题

整理过程中修复了原发行版的以下缺陷（均保持原语义，仅修确定 bug）：

1. **`server.cjs` 缺少 `require("fs")`**——`app.get("*")` 兜底路由命中即 500（原 `node_error.txt` 有大量记录）；
2. **`start-game.bat` 四处缺陷**——缺工作目录锚定、`&` 被 cmd 当命令分隔符、`%ERRORLEVEL%` 被当 PID、Electron 先于 Node 就绪启动导致首屏失败。重写后先起 Node 并探测端口就绪，再启动 Electron，退出时按真实 PID 清理。

---

## 六、技术栈

| 层次 | 技术 |
| --- | --- |
| 游戏引擎 | Phaser 3 |
| 构建产物 | TypeScript + Vite（hash 命名分包） |
| 国际化 | i18next（18 种语言，含完整 zh-CN） |
| 本地服务 | Node.js + Express 4（`game/server/server.cjs`） |
| 桌面外壳 | Electron 25.7.0 + Nativefier 52.0.0 |
| 存档加密 | CryptoJS AES（密钥硬编码于产物，修改器用同一密钥） |
| 补丁工具 | Python 3（精确字符串替换 + .orig 备份回滚） |

---

## 七、许可

- 本仓库代码部分继承上游 [pokerogue](https://github.com/pagefaultgames/pokerogue) 的 **AGPL-3.0**（见 [LICENSE](LICENSE)）；
- 「宝可梦」及相关名称、形象版权归 Nintendo / Creatures Inc. / GAME FREAK inc. 所有，本项目为非营利粉丝作品（见 [NOTICE.md](NOTICE.md)）；
- 汉化与打包工作由 B 站「黑咖啡和冰月亮」等完成，UI 套件由「呆猫」提供。

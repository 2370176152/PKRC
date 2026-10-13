# PKRC 启动与排错手册

> **归属**：`docs/delegation/03-后端工程师-派单.md` §2.5 / v2 看板 S8a-4
> **适用对象**：最终用户（普通启动）、排错者（`--serve-only` / `--dev`）、开发者
> **更新日期**：2026-10-13

---

## 一、三种启动方式

| 方式 | 入口 | 特点 | 适用 |
|---|---|---|---|
| **① 无窗口（推荐）** | `game\启动.vbs` | 无黑框闪窗；服务错误转弹窗 | 普通用户 |
| **② 控制台** | `game\start-game.bat` | 保留控制台输出，便于看日志 | 排错 |
| **③ 仅服务** | `game\server\server.cjs --serve-only` | 只起 Express，不起 Electron | 远程访问 / CI / 深度排错 |

### 方式 ①：无窗口启动

双击 `game\启动.vbs`。脚本会：
1. 以 `..\shared\runtime\node.exe` 静默启动 `server\server.cjs`（日志重定向到 `game\logs\`）
2. 等待 8000 端口就绪（最多 30 秒）
3. 启动 Electron 外壳 `pokerogue-win32-x64\pokerogue.exe`
4. 游戏退出后清理 Node 进程

**成功启动是静默的**——不弹窗、不闪黑框。**出错才弹窗**。

### 方式 ②：控制台启动

双击 `game\start-game.bat`（或在该目录下执行）。与方式 ① 同流程，但保留控制台，能看到实时日志。

### 方式 ③：仅起服务（不起 Electron）

```bat
cd game\server
..\..\shared\runtime\node.exe server.cjs --serve-only
```

然后浏览器手动打开 <http://localhost:8000/>。

> ⚠️ **注意**：`shared\runtime\node.exe` 是 **便携 Node v16**，**只用于运行期服务**。
> **构建**（Vite / TS 编译）必须用 **系统 Node 22+**。两者**不要混用**（详见 `docs/tech-stack-decision.md` §3.2）。

---

## 二、参数说明（全部）

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `PORT` | 环境变量 | `8000` | **优先级最高**，覆盖 `--port`。保持改造前语义 |
| `--port=<n>` | 参数 | `8000` | 监听端口。端口 `0` = 由系统分配（内嵌场景用） |
| `--serve-only` | 开关 | 关 | 只起服务，**不拉起** Electron |
| `--no-open` | 开关 | 关 | 起服务 + Electron，但不自动打开浏览器 |
| `--dev` | 开关 | 关 | 保留控制台输出 + 输出 `DEBUG` 级日志 |
| `--static-dir=<path>` | 参数 | `./dist` | 静态资源根目录 |
| `--log-dir=<path>` | 参数 | `../logs` | 日志输出目录 |
| `--keep=<n>` | 参数 | `10` | 日志文件保留份数（超出删最旧） |
| `-h`, `--help` | 开关 | — | 显示帮助 |

**端口优先级**：`PORT` 环境变量 → `--port` → `8000`

示例：

```bat
rem 用 8100 端口，保留控制台，日志更详细
set PORT=8100
..\..\shared\runtime\node.exe server.cjs --dev

rem 用另一套静态目录（灰度对比新旧产物）
..\..\shared\runtime\node.exe server.cjs --serve-only --static-dir=..\..\dist-new

rem 只留 3 份日志（省磁盘）
..\..\shared\runtime\node.exe server.cjs --keep=3
```

---

## 三、排错入口

### 3.1 日志目录

```
game/logs/node-<yyyyMMdd-HHmmss>.log
```

- **每次启动生成一个新文件**（不再覆盖旧的 `node_output.txt` / `node_error.txt`）
- `stdout` 与 `stderr` **合流**，按时间顺序排列（不会两个文件时间线错位）
- 默认保留**最近 10 份**，超出自动删最旧

**日志行格式**：

```
[2026-10-13 13:15:53.123] [INFO ] [server] PKRC server starting (node v16.16.0)
[2026-10-13 13:15:54.456] [INFO ] [server] server listening on http://127.0.0.1:8000/ (static: ...)
[2026-10-13 13:15:55.001] [ERROR] [server] EADDRINUSE: 端口 8000 已被占用。...
```

**级别**：`DEBUG`（仅 `--dev`）/ `INFO` / `WARN` / `ERROR`

**排错技巧**：多行错误（如堆栈）的**续行带 4 空格缩进**，因此：

```bash
grep "^\d\{4\}-" node-*.log      # 只看记录首行
grep ERROR node-*.log -A3        # 看错误及其堆栈
```

### 3.2 错误弹窗

**触发条件**（满足任一）：
- Node 进程非 0 退出，**或**
- 端口探测 30 秒超时，**或**
- 日志中出现 `ERROR` 级别记录

弹窗由启动器（VBS）实现，并展示当前日志文件路径。

### 3.3 错误信号（给启动器 / 自动化）

服务层暴露两个接口，供启动器判断是否需要弹窗：

| 接口 | 含义 |
|---|---|
| `logger.hasError()` | 本次运行是否出现过 ERROR |
| `logger.currentLogPath()` | 当前日志文件绝对路径（日志被禁用时为 `null`） |

---

## 四、常见问题

### 4.1 端口被占用（`EADDRINUSE`）

**现象**：日志出现 `EADDRINUSE: 端口 8000 已被占用`，进程退出码 1，启动器弹窗。

**服务不会静默换端口**——这是有意设计：静默换端口会让 Electron 指向错误地址（静默白屏更难排错）。

**处理**：

```bat
rem 方案 1：自动释放 8000 端口
game\free-port.bat

rem 方案 2：换个端口
set PORT=8100
game\start-game.bat

rem 方案 3：查明是谁占着
netstat -ano | findstr :8000
```

### 4.2 启动后白屏

按顺序查：
1. `game\logs\` 里最新的日志有没有 `ERROR`
2. 日志里 `server listening on ...` 的端口，与 Electron 指向的端口是否一致
3. 用 `--serve-only` 起服务，浏览器直接访问该地址 —— 能打开说明是 Electron 侧问题

### 4.3 静态资源 404 / 加载不全

- 确认 `--static-dir` 指向的目录里有 `index.html`
- 注意：**未命中的路径返回的是 `200` + `{"ok":false,"message":"File not found"}`，而不是 404**。这是改造前就有的行为，已被刻意保留（前端可能依赖该判定）。看到 `ok:false` 就说明文件确实不存在。

### 4.4 日志文件太大 / 太多

用 `--keep=<n>` 调整保留份数（默认 10）。单次运行一个文件，正常量级是几 KB。

### 4.5 想完全不要日志文件

```bat
..\..\shared\runtime\node.exe server.cjs --serve-only --log-dir=
```

或在代码中调用 `createLogger({ logDir: null })`。

---

## 五、给维护者：契约与边界

| 项 | 约定 |
|---|---|
| **不得新增运行时依赖** | 只能用 Express 4 + Node 内置模块（详见 `docs/tech-stack-decision.md` §D3） |
| **默认行为不可变** | 无参数 = 8000 + `./dist`，必须与改造前一致 |
| **代码语法上限** | `game/server/**` 只能写 **Node 16 支持**的语法（禁顶层 `await`、`structuredClone` 等） |
| **优雅关闭** | `close()` 带 3 秒超时保护，一定 resolve（不阻塞 Electron 退出） |
| **内嵌调用** | `startServer({port: 0})` 返回真实端口，供 `electron-main.cjs` 使用；**服务内不调 `process.exit`** |

**自测**（无需新依赖）：

```bat
cd game\server
set NODE_PATH=..\..\shared\runtime\node_modules
..\..\shared\runtime\node.exe test-server.cjs
```

---

> **相关文档**：`docs/tech-stack-decision.md`（技术栈决策）、`docs/delegation/03-后端工程师-派单.md`（任务定义）

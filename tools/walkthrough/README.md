# PKRC · F-10 自动化走查环境

> 归属：`docs/delegation/27-第四阶段任务分发.md` §三 F-10（本阶段**解锁项**）
> 授权：**O-9**（GUI 实测口径 = 走 F-10 自动化，唯一授权路径）· **O-9b**（逐系统确认**全部画面** + **双产物对比**）
> 状态：✅ 可用 —— A4-01 / A4-04 可直接消费

---

## 一句话

用 **headless 浏览器 + CDP** 驱动 `game/server/dist/`，脚本化键鼠 → 截图 + 状态断言 →
**同一存档、同一操作序列**分别跑 A（modder 原产物）与 B（自构建产物）→ 产出「A 图｜B 图」并排对与像素 diff。

**零依赖**：不需要 playwright / puppeteer / npm。Node 22 内置 `WebSocket` + `fetch`，
直接用 Chrome DevTools Protocol；浏览器用系统已装的 **Edge / Chrome**。

---

## 快速开始

```bash
# 0) 自检（PNG 编解码 / 像素 diff / arbiter 复用 / 叠加根）—— 应全绿
node tools/walkthrough/selftest.mjs

# 1) 列出场景
node tools/walkthrough/cli.mjs --list

# 2) 单产物跑一个场景
node tools/walkthrough/cli.mjs --scenario boot --product B

# 3) 🔴 双产物对比（O-9b 的工作形态）
node tools/walkthrough/cli.mjs --scenario boot --product both

# 4) 存档注入（走查直达目标场景）
node tools/walkthrough/cli.mjs --scenario save-inject --product A --inject '{"__wt_probe__":"ok"}'
```

产出：`tools/walkthrough/evidence/<场景>-<时间戳>/`
- `report.html` —— **自包含**（图片 base64 内联），可逐张复核（给项目所有者复核用）
- `report.json` —— 机读结果（供 A4-01/A4-04 汇总）
- `A/`、`B/` —— 各截图点原图 + `result.json`
- `_compare/` —— 「A｜B」并排图

---

## 命令参数

| 参数 | 说明 |
|---|---|
| `--scenario <id>` | 场景 id（默认 `boot`） |
| `--product <A\|B\|both>` | 产物（默认 `B`）；`both` = A｜B 对比 |
| `--out <dir>` | 证据目录（默认 `tools/walkthrough/evidence/<场景>-<时间戳>`） |
| `--inject <file\|json>` | 存档注入：JSON 文件路径或 JSON 串 |
| `--timeout <ms>` | 就绪等待上限（默认 30000） |
| `--strict` | 任一检查项失败即退出码 1 |
| `--quiet` | 只输出结论 |
| `--list` | 列出场景 |

环境变量：`PKRC_BROWSER` = 指定浏览器可执行文件（默认自动探测 Edge/Chrome）。

---

## 判据层级（严格按 O-9b）

| 级 | 方式 | 谁判 | 说明 |
|---|---|---|---|
| ① | **状态/数值断言** | 机器 | `session.evaluate` / 页面诊断 / 帧统计 —— **最硬** |
| ② | **截图像素 diff** | 机器 | 差异率 + 差异热区 + 包围盒 |
| ③ | AI 视觉审阅 | AI | **仅灰色地带**；**不得单独作通过依据** |

> 本运行器自动产出 ① 与 ②，并把截图与并排图留档供 ③（或人工）复核。
> **「AI 看一眼说没问题」不作为通过依据。**

---

## 目录结构

```
tools/walkthrough/
├── cli.mjs                  # 入口
├── selftest.mjs             # 自检（可复跑）
├── lib/
│   ├── cdp.mjs              # 极简 CDP 客户端（Node 原生 WebSocket）
│   ├── browser.mjs          # Edge/Chrome headless 启动器（port=0，profile 匹配清理）
│   ├── static-server.mjs    # 零依赖静态服务器（**支持叠加根**，A 版免拷贝 825MB 资源）
│   ├── session.mjs          # 页面会话：输入 / 截图 / 断言 / 存档注入 / 诊断
│   ├── products.mjs         # A/B 产物定义与叠加根解析
│   ├── png.mjs              # PNG 解码（zlib+unfilter）+ 像素 diff + 并排图
│   ├── runner.mjs           # 就绪/稳定判定 + 单产物/双产物运行
│   └── report.mjs           # 自包含 HTML 报告
└── scenarios/               # 场景（F-12 的 catalog 会扩充到这里）
    ├── boot.mjs             # 启动 → 画面就绪
    ├── input-smoke.mjs      # 脚本化键鼠输入冒烟（复用 F-6 语义）
    └── save-inject.mjs      # 存档注入通道验证
```

---

## 关键设计（踩过的坑）

| 坑 | 处置 |
|---|---|
| **Windows 上 `msedge.exe` 是启动器存根**，会立刻退出（code 0），真实浏览器由子进程承载 | 就绪判据改用「`DevToolsActivePort` 出现 + `/json/version` 可达」；**不把进程退出当失败** |
| 固定调试端口会与并跑冲突 | 用 `--remote-debugging-port=0`，从 profile 目录的 `DevToolsActivePort` 读真实端口 |
| 启动器退出 ⇒ `proc.kill()` 杀不到真实浏览器 | `killByProfile()`：按 `--user-data-dir` 匹配进程强杀，**不误伤用户浏览器** |
| **A 版资源不完整**（只有 assets/index.html），P4-R10 | 静态服务器支持**叠加根**：A 自己的文件优先，命不中落到 B 的资源目录，不拷贝 |
| 早期「就绪」误判（~340ms 时只有触摸控件 DOM、无 canvas） | 就绪判据 = **canvas 已挂载** ∧ 帧亮度标准差 > 阈值 ∧ **连续 2 帧** |
| 在 splash 过渡帧截图 ⇒ A/B 不可比 | `settle`：等**连续两帧变化率 ≤2%** 再截 |
| 沙箱禁止 `node→node` spawn（EBUSY） | 全流程**不 spawn Node**；浏览器是唯一子进程 |

---

## 已知边界

- **只覆盖「能跑起来的部分」**：若产物启动即崩（如 B 版当前的 `safeT` 缺陷），
  场景会**如实报告未就绪**，而不是伪造通过。走查的价值正是「让它崩出来」。
- **像素 diff 有噪声**：抗锯齿 / 字体 hinting 会产生 <阈值 的差异，默认阈值 12 用于滤除；
  仍超阈值的差异 = **需裁定的候选**，不等于缺陷。
- **不替代人工**：所有者保留**全量证据包复核权**。

---

## 与 A4-01 / A4-04 的接口

- 场景 = **可断言的检查点**；F-12 产出的「画面级全量清单」逐条落成场景 → 由 `cli.mjs` 批量跑。
- A4-01：`--scenario <11 系统场景> --product both`，逐系统勾选，产出全量证据包。
- A4-04：`--scenario input-smoke`（已含键盘全量键序 + 键鼠仲裁实测）。

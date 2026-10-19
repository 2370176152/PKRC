# PKRC · F-10 自动化走查环境 + F-14 走查场景实现

> 归属：`docs/delegation/27-第四阶段任务分发.md` §三 F-10（解锁项）· `docs/delegation/32-第五阶段任务分发.md` §四 F-14
> 授权：**O-9**（GUI 实测口径 = 走 F-10 自动化，唯一授权路径）· **O-9b**（逐系统确认**全部画面** + **双产物对比**）
> 状态：✅ 可用 —— A4-01 / A4-04 可直接消费；F-14 已交付（12 个按系统场景 + route/gate/五态裁定）

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

# 1) 静态：目录完整性自检（不启浏览器，秒级）—— F-14 验收 ①
node tools/walkthrough/cli.mjs --validate

# 2) 静态：两产物「逐点闸门」—— 这个画面在该产物里到底有没有实现
node tools/walkthrough/cli.mjs --gates

# 3) 列出目录 / 场景
node tools/walkthrough/cli.mjs --systems
node tools/walkthrough/cli.mjs --list

# 4) 单产物跑一个场景
node tools/walkthrough/cli.mjs --scenario boot --product B

# 5) 🔴 双产物对比（O-9b 的工作形态）
node tools/walkthrough/cli.mjs --scenario boot --product both

# 6) F-14：按系统走查（12 个系统各一个场景）
node tools/walkthrough/cli.mjs --scenario sys-talent --product both
node tools/walkthrough/cli.mjs --scenario sys-eryou  --product B      # B 会大面积 blocked，属预期

# 7) 存档注入（走查直达目标场景）
node tools/walkthrough/cli.mjs --scenario sys-healer --product both --inject ./save.json
```

产出：`tools/walkthrough/evidence/<场景>-<时间戳>/`
- `report.html` —— **自包含**（图片 base64 内联），可逐张复核（给项目所有者复核用）
- `report.json` —— 机读结果（供 A4-01/A4-04 汇总），含 `state.catalog.records` 逐点裁定
- `A/`、`B/` —— 各截图点原图 + `result.json`
- `_compare/` —— 「A｜B」并排图

---

## 命令参数

| 参数 | 说明 |
|---|---|
| `--scenario <id>` | 场景 id（默认 `boot`）；`sys-<系统>` = 按系统走查（F-14） |
| `--system <id>` | `catalog` 场景的系统 id（见 `--systems`） |
| `--product <A\|B\|both>` | 产物（默认 `B`）；`both` = A｜B 对比 |
| `--out <dir>` | 证据目录（默认 `tools/walkthrough/evidence/<场景>-<时间戳>`） |
| `--inject <file\|json>` | 存档注入：JSON 文件路径或 JSON 串 |
| `--timeout <ms>` | 就绪等待上限（默认 30000） |
| `--strict` | 任一检查项失败即退出码 1 |
| `--quiet` | 只输出结论 |
| `--list` | 列出场景 |
| `--systems` | 列出 F-12 走查目录（含 route 可靠性分布） |
| `--validate` | 静态：目录完整性自检（F-14 验收 ①） |
| `--gates [--product A\|B\|both]` | 静态：产物闸门探测，不启浏览器 |

环境变量：`PKRC_BROWSER` = 指定浏览器可执行文件（默认自动探测 Edge/Chrome）。

---

## 判据层级（严格按 O-9b）

| 级 | 方式 | 谁判 | 说明 |
|---|---|---|---|
| ① | **状态/数值断言** | 机器 | `session.evaluate` / 页面诊断 / 帧统计 —— **最硬** |
| ② | **截图像素 diff** | 机器 | 差异率 + 差异热区 + 包围盒；阈值见 `lib/judgement.mjs` |
| ③ | AI 视觉审阅 | AI | **仅灰色地带**；**不得单独作通过依据** |

> 本运行器自动产出 ① 与 ②，并把截图与并排图留档供 ③（或人工）复核。
> **「AI 看一眼说没问题」不作为通过依据。**

---

## F-14 · 五态裁定（**最容易造假的地方，务必读**）

每个画面点只有五种结果，含义严格区分：

| 裁定 | 含义 | 进台账？ | 算走查失败？ |
|---|---|---|---|
| `pass` | 到达有**强证据** + 断言全过 | — | 否 |
| `fail` | 到达了但断言不过 / 新增未捕获异常 | 缺陷台账 | **是** |
| `unproven` | route 跑完、断言过，但**到达证明不足** | A4-01 待办 | 否（但**不得声称已走查**） |
| `unreached` | route **明确失败**（画面没变 / 步骤报错） | A4-01 待办 | 否 |
| `blocked` | **该产物里没有这个画面的代码**（gate 未命中） | L2/L3 迁移台账 | 否 |

**为什么必须单列 `unproven`**：Phaser canvas 里的文本读不到（U-11 已记），
所以「按了几下键 + 画面变了」**不等于**「到了那个界面」。
把弱证明记成 pass，就是拿「弱证明」冒充「已走查」—— 与 O-8「可编译 ≠ 功能等价」同类错误。

**到达证明强度**（记录在 `reachProof` 字段）：

| 值 | 含义 |
|---|---|
| `inject` | 注入了**真存档**（键名匹配 `data_*` / `sessionData` / `mappingConfigs` / `settings`）⇒ 到达由存档状态保证。⚠️ 仅注入哨兵键**不算** |
| `dom` | 页面可读断言命中（仅 HTML 模块，如 legendary-popup） |
| `weak` | 只有「画面变了」这类弱证明 |
| `none-verified` | 无导航但已实测可达（如 `boot.ready`：打开即到位） |
| `none` | 无任何证明 |

---

## F-14 · 产物闸门（`--gates`）

**问题**：B（自构建）大量 mod 界面**根本没进 bundle**（`mod-init.ts` 末尾挂账：
11 个 ERYOU UI Handler 未接 UI 模式注册表 ⇒ tree-shake 摇掉）。
若不前置判定，「走查不过」会与「迁移缺口」混为一谈。

**做法**：每个画面点声明 `gate`，直接读产物 JS 判定「这个画面有没有可能渲染」。

🔴 **关键方法学（踩过，勿再踩）**：
**B 产物未启用 keepNames** —— 实测 `MenuUiHandler` / `TitleUiHandler` / `SettingsUiHandler`
在 A 中各 1~3 次、在 B 中**全部为 0**。
⇒ 任何「按标识符名 grep 产物」的探测在 B 上**恒为假**。
**gate 只能用字符串字面量**（中文文案 / i18n key / 资源 key），这些压缩后仍完整保留。

```bash
$ node tools/walkthrough/cli.mjs --gates
产物 A：index-D3KKGO7Y.js(2.6MB) + loading-scene-By2k7Qfx.js(4.7MB)   → 可渲染 51/51
产物 B：index-fj-aLRGF.js(1.0MB) + loading-scene-CoDM4HK8.js(2.7MB)   → 可渲染 29/51 · 阻塞 22
```

> ⚠️ **只读产物自己的根（`roots[0]`）**，不读叠加根。
> 叠加根是给静态服务器做「A 缺资源落 B」用的（P4-R10），若把 B 的 JS 也读进 A 的语料，
> A 的探测会被 B 的代码污染。

---

## 目录结构

```
tools/walkthrough/
├── cli.mjs                  # 入口（含 --validate / --gates 静态模式）
├── selftest.mjs             # 自检（可复跑）
├── lib/
│   ├── cdp.mjs              # 极简 CDP 客户端（Node 原生 WebSocket）
│   ├── browser.mjs          # Edge/Chrome headless 启动器（port=0，profile 匹配清理）
│   ├── static-server.mjs    # 零依赖静态服务器（**支持叠加根**，A 版免拷贝 825MB 资源）
│   ├── session.mjs          # 页面会话：输入 / 截图 / 断言 / 存档注入 / 诊断
│   ├── products.mjs         # A/B 产物定义与叠加根解析
│   ├── png.mjs              # PNG 解码（zlib+unfilter）+ 像素 diff + 并排图
│   ├── runner.mjs           # 就绪/稳定判定 + 单产物/双产物运行
│   ├── report.mjs           # 自包含 HTML 报告
│   ├── route.mjs            # 🆕 F-14 到达步骤 DSL + 执行器
│   ├── gates.mjs            # 🆕 F-14 产物内容闸门（gate 探测）
│   └── judgement.mjs        # U-11 视觉判定标准（类别阈值 / 三态裁定 / 分散度）
└── scenarios/               # 场景
    ├── boot.mjs             # 启动 → 画面就绪
    ├── input-smoke.mjs      # 脚本化键鼠输入冒烟（复用 F-6 语义）
    ├── save-inject.mjs      # 存档注入通道验证
    ├── catalog.mjs          # F-12 目录（51 点）+ F-14 的 route/gate/可靠性
    ├── catalog-scenario.mjs # 目录驱动器（五态裁定）
    └── system-scenario.mjs  # 🆕 F-14 12 个按系统场景工厂（sys-*）
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
| **B 未启用 keepNames** ⇒ 按类名 grep B 恒为 0 | gate 只用字符串字面量；产物探测**不做标识符匹配** |
| **canvas 文本读不到** ⇒ 「画面变了」≠「到了目标界面」 | 引入 `unproven` 裁定 + `reachProof` 分级，**禁止弱证明冒充已走查** |
| 只注入哨兵键却记成 `inject` 到达 | `hasRealSaveInject()`：仅 `data_*` / `sessionData` / `mappingConfigs` / `settings` 才算真存档 |

---

## 已知边界

- **只覆盖「能跑起来的部分」**：若产物启动即崩（如 B 版当前的 `safeT` 缺陷，E15），
  场景会**如实报告未就绪**，而不是伪造通过。走查的价值正是「让它崩出来」。
- **像素 diff 有噪声**：抗锯齿 / 字体 hinting 会产生 <阈值 的差异，默认阈值 12 用于滤除；
  仍超阈值的差异 = **需裁定的候选**，不等于缺陷。分区域阈值见 `lib/judgement.mjs` 的 `CLASS_THRESHOLDS`。
- **不替代人工**：所有者保留**全量证据包复核权**（B-12 的 manifest 归档）。
- **route 的 `derived` 级别仍是推导**：菜单索引 / 二级菜单位置未经实测，A4-01 需逐点确认。

---

## 与 A4-01 / A4-04 的接口

- 场景 = **可断言的检查点**；F-12 目录 + F-14 route/gate 逐条落成可跑场景 → 由 `cli.mjs` 批量跑。
- A4-01：`--scenario sys-<系统> --product both --inject <真实存档>`，
  逐点看五态裁定；`blocked` 写进 L2/L3 台账，`unproven/unreached` 是**补强路径的待办清单**。
- A4-04：`--scenario input-smoke`（已含键盘全量键序 + 键鼠仲裁实测）。


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

# 第八阶段归档 · 索引

> **归档对象**：PKRC 改造 · 第八阶段「收尾收口」
> **归档日期**：2026-10-20
> **代码快照**：分支 `sourcemigration` @ `ff2a583`（76 个提交；本地领先远程 9）
> **状态**：⚠️ **部分关闭归档** —— 可执行单元 **3/10 完成**；**M3 / M4 / M5 均未成立**
> **实际执行**：**1 天**（2026-10-20，同日完成组 A 全流程 + 组 B-1）

---

## 一、一句话结论

> **`unproven` 从 39 归零，画面点首次判 `pass` —— 走查第一次有了"我确实到了那个画面"的证据。**

| 项 | 第七阶段 | **第八阶段** |
|---|---|---|
| A 侧 pass | 2 | **42** |
| A 侧 unproven | **39** | **0** |
| B 侧 pass | 2 | **34** |
| B 侧 unproven | 36 | **0** |
| fail（双产物） | 0 | **0** |
| reachProof | `none`（全弱证明） | **`dom`**（强证明） |

---

## 二、本目录内容

| 文件 | 说明 |
|---|---|
| `README.md` | 本索引 |
| `PHASE-8-归档报告.md` | **主报告**：交付成果 + 技术突破 + 四个致命细节 + 变更记录 + 沉淀 |
| `manifest.json` | 机读清单 |

---

## 三、交付成果（10 个可执行单元）

| 组 | 单元 | 状态 | 结果 |
|---|---|---|---|
| A | **A-1** 补 `waitFor` | ✅ **超额** | 49/51 有 `waitFor`（2 个 `verified` 点保留原强证明）· `--validate` EXIT=0 |
| A | A-2 定点存档 | ❌ | 阻塞于 starter 选择；且 **UI 画面不是存档状态**，无法靠 `--inject` 打开 |
| A | **A-3** 重跑降 unproven | ✅ **超额** | **`unproven` 39 → 0** |
| B | **B-1** 战斗 4 节点断言 | ✅ | 写进既有 `system-scenario.mjs`（`battle-flow` 场景） |
| B | B-2 4 模式自动化 | ❌ | 节点①必然超时（卡在 `SelectStarterPhase`） |
| B | **B-3 人工实玩 4 局** | ⏸ **待所有者** | 可随时做，不依赖 starter |
| B | B-4 `addPt` 活体 | ❌ | 依赖 B-3 的日志 |
| B | B-5 日志环形缓冲 | ⏸ 按需 | — |
| C | C-1 解除「未验证」 | ❌ **不执行** | M3/M4 未成立 —— 按清单"否则不解除" |
| D | D-1 blocked 归账 | ⏸ 可选 | — |

**✅ 3 · ❌ 4 · ⏸ 3**

---

## 四、🔴 本阶段的技术突破

### 4.1 死结：canvas 架构下 DOM 断言完全失效

**实测**：

| 探测项 | 结果 |
|---|---|
| `document.body.innerText` | **长度 0** —— 全部 UI 渲染在单个 canvas |
| `document.body` 子节点 | 只有 `#app` + `#touchControls` |
| `Phaser.GAMES` | 不可用 |
| `window.game` | 不存在（`main.ts` 里是局部变量） |

**⇒ 这就是第 5~7 阶段所有 route 只能给"画面变了"这种弱证明、全部判 `unproven` 的根因。**

### 4.2 解法（两件，都很轻）

1. **一行只读观测句柄**（`src/main.ts`）：
```ts
Object.defineProperty(window, "__PKRC_GAME__", {
  value: game, writable: false, configurable: false, enumerable: false,
});
```
> **纯观测**：只把**已存在**的 `game` 实例挂到只读全局，不创建、不修改、不驱动任何逻辑。
> 去掉这一行不影响游戏任何行为。

2. **`catalog.mjs` 用 `waitFor` 读真实状态**：`waveIndex` / `getPlayerParty().length` / `phaseManager` 当前 Phase

**结果**：`reachProof` 由 `none` → **`dom`**，判定由 `unproven` → **`pass`**。

### 4.3 🔴 四个致命细节（不修就全盘错）

| # | 问题 | 后果 | 修法 |
|---|---|---|---|
| 1 | **`taps()` 连按只间隔 60ms** | 游戏**吃不到按键** —— **这是所有 route 一直失败的真凶** | `tapsSlow(key, n, 800)`，把间隔做成显式 `wait` 步骤 |
| 2 | ready 判定通过时 `LoginPhase` 过场仍在跑（实测 t=14s） | 前几次按键被吞 | 先 `wait(5000)` 再按 |
| 3 | **A 产物没有句柄**（只加在 B 的 src） | A 全部 `unreached` ⇒ A/B 对比失效，且把"探针不可用"误报成"画面到不了" | 探针在句柄缺失时 `return true`（放行，退回原判定） |
| 4 | `verified` 点加了探针 | 本该强档的点反而**降级成 `unreached`** | verified 点不加探针（49/51 加，2 点保留原强证明） |

---

## 五、逐系统结果

| 系统 | 点数 | A（原产物） | B（自构建） |
|---|---:|---|---|
| boot | 3 | **pass 3** | **pass 3** |
| talent | 11 | **pass 11** | pass 9 / unreached 1 / blocked 1 |
| misc | 14 | **pass 11** / unreachable 3 | pass 9 / unreachable 1 / blocked 4 |
| jieming | 3 | **pass 3** | pass 2 / unreached 1 |
| p5x | 3 | **pass 3** | **pass 3** |
| callingcard | 3 | **pass 3** | pass 2 / unreached 1 |
| healer / nianli | 2 / 2 | **pass 2 / 2** | **pass 2 / 2** |
| dianxin | 1 | **pass 1** | **pass 1** |
| eryou | 4 | pass 2 / unreachable 2 | pass 1 / unreached 1 / unreachable 2 |
| pt-soudache | 3 | pass 1 / unreachable 2 | unreached 1 / unreachable 2 |
| legendary-popup | 2 | unreachable 2 | blocked 2 |
| **合计 51** | | **pass 42** · unproven **0** · unreachable 9 · fail **0** | **pass 34** · unproven **0** · unreached 5 · unreachable 5 · blocked 7 · fail **0** |

**B 侧 5 个 `unreached` 全部是战斗内点** —— B 走 bypass 自动登录、A 需手动确认，两者登录链路不同，B 在 `SelectStarterPhase` 停住。

---

## 六、M3 缺口的性质变了

| 阶段 | 缺什么 | 性质 |
|---|---|---|
| 第七阶段 | 36~39 点**没有任何到达证明** | 🔴 **结构性问题** |
| **第八阶段** | 4~7 点**进不了战斗** | 🟢 **单点能力问题** |

**⇒ 差距从"证明方法不存在"缩小到"一个鼠标点击"。**

---

## 七、里程碑状态

| ID | 名称 | 状态 |
|---|---|---|
| M1 / M2 | 可构建的上游 / 魔改点清单 | ✅ 达成 |
| **M3** | 源码含魔改 | ❌ 未成立（B 侧 5 点 unreached，全是战斗内点） |
| **M4** | 等价性验证 | ❌ 未达成（战斗全流程仍未跑通） |
| **M5** | 产物切换 | ❌ 未达成 |
| M6–M9 | — | ⬜ 未开始 |

---

## 八、下一步

第九阶段见 **`docs/delegation/42-第九阶段-收尾执行清单.md`**。

**剩余可执行单元只剩 5 项 + 1 项人工。**
**O-20 已裁定为 A**，且核实发现 `click` 能力**已存在**（`session.click(x,y)` + `route` 已实现 `click` 步骤）
⇒ A 方案只是"用已有步骤 + 实测坐标"，工作量比原估更小。

---

> **归档责任**：项目所有者
> **归档不变量**：本目录内文件一经归档不再修改；后续变更以新版本文件另存。

# tools/input-layer —— 前端 S6 输入层纯逻辑工具集

> **归属**：前端工程师
> **性质**：v2 看板 **F-3（P2）** 的交付物 + F-1 的配套扫描脚本
> **状态**：纯逻辑部分**已完成并通过 38 项单测**（不依赖 Phaser / 上游 / 产物）

---

## 一、为什么放在这里（而不是 `pkrc/input/`）

v2 方案（`05-v2-任务看板.md` §七）已把 v1 的 `pkrc/**` 外置 ESM 层**归档为 `archive/pkrc-external-layer/`**，输入层改为**源码实现**（S6）。

因此本目录的定位是：
- **暂存区 / 原型区**：在 M5 之前（源码仓库未就绪），先把**零依赖的纯逻辑**写出来并单测；
- **迁移就绪**：M5 后**原样搬进** `src/input/`，仅需：
  1. `gesture-resolver.js` → `gesture-resolver.ts`（加类型，零逻辑改动）
  2. `*.test.js` → `*.test.ts`（改为 vitest 语法）

> ⚠️ **不要**把本目录当作外置层再挂到 `dist/` 上——那是 v1 的作废路线（R1/R2 铁律）。

---

## 二、文件清单

| 文件 | 作用 | 状态 |
|---|---|---|
| `gesture-resolver.js` | 手势判定纯逻辑（点击/拖拽/长按/滚轮归一/节流） | ✅ 完成 |
| `gesture-resolver.test.js` | 38 项单元测试（无第三方依赖） | ✅ 38/38 通过 |
| `run-tests.js` | 测试入口 | ✅ |

---

## 三、运行测试

```bash
# 用系统 Node 22（不要用 shared/runtime 的 v16）
node tools/input-layer/run-tests.js
```

或直接单个套件：

```bash
node tools/input-layer/gesture-resolver.test.js
```

---

## 四、覆盖的验收项

| 验收项（来源） | 覆盖情况 |
|---|---|
| v1 §4.2 点击/拖拽/长按判定表 | ✅ 13 项（含 4 个边界值） |
| v1 §4.2 连点防抖 180ms | ✅ 5 项 |
| v1 §4.2 滚轮 deltaMode 归一 | ✅ 7 项（PIXEL/LINE/PAGE） |
| v1 §4.2 中键忽略 / 右键透传 | ✅ 2 项 |
| **S2 验收 2-C**：200ms 连点 5 次 → 只生效 1 次 | ✅ 端到端状态机用例 |
| **S2 验收 2-D**：移 5px=点击 / 移 15px=拖拽 | ✅（含 8.01px 边界） |
| **S2 验收 2-E**：失焦复位 | ✅ `cancel()` / `reset()` 用例 |
| **S3 验收 3-E**：滚轮节流 | ✅ 节流器用例 |

---

## 五、接口契约（与后续模块的约定）

```
pointer-manager.js
    │  PointerSample { id, x, y, downTime|upTime, button, wasTouch }
    ▼
gesture-resolver.js  ←── input-config.json 的 gesture 段
    │  GestureResult { type: "click"|"drag"|"longpress"|"none", button, durationMs, distancePx }
    ▼
input-arbiter.js（同帧去重 + lastDevice 切换冷却）
    ▼
legacy-bridge.js（语义 → Button → ui.processInput）
```

导出 API：

```js
import {
  GestureResolver,          // 状态机主入口（推荐）
  resolveGesture,           // 纯函数：down+up → GestureResult
  shouldDebounce,           // 纯函数：连点判定
  normalizeWheelDelta,      // 纯函数：wheel 归一
  createWheelThrottle,      // 节流器工厂
  distance,                 // 工具
  DEFAULT_GESTURE_CONFIG,
  MOUSE_BUTTON, WHEEL_DELTA_MODE,
} from "./gesture-resolver.js";
```

---

## 六、注意事项 / 潜在坑点

1. **坐标必须是 Phaser 世界坐标**，不是 `clientX/clientY`。`pointer-manager` 负责转换（v1 §4.1）。
2. **`downTime`/`upTime` 必须同源时钟**（统一 `performance.now()`）。混用 `Date.now()` 会导致时长判定错乱。
3. **触摸设备的长按语义**：当前 300–500ms 降级为 drag。若后续要支持移动端长按菜单，需在此处加分叉（`wasTouch` 已在 `PointerSample` 中保留但尚未使用）。
4. **`shouldDebounce` 的时钟回拨处理**：`performance.now()` 单调递增，正常不会回拨；为防外部传入 `Date.now()`（可能因 NTP 校时回拨）而保守放行。
5. **`createWheelThrottle` 是纯状态实现（不走定时器）**，好处是可确定性单测；坏处是**必须由调用方传入 `now`**。`pointer-manager` 记得传 `performance.now()`。
6. **迁移到 TS 时**，`PointerSample` / `GestureResult` 的 JSDoc typedef 可直接转 interface，无需改动逻辑。

---

## 七、待办（依赖 M5）

| 项 | 依赖 |
|---|---|
| 迁移为 `src/input/gesture-resolver.ts` | M5 |
| 测试改 vitest | M5 |
| 接入 `input-arbiter` 的 frameId 去重单测 | F-3 续 |
| `TouchControl` 迁移评估（上游已有 pointerdown） | A0-2 |

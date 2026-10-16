# 23 · 前端：上游 pointer 缺口承接方案（F-7）

> **角色**：前端工程师
> **性质**：派单 24 §四 **F-7（🟠 high）** ｜ v2 看板 S6（源码级输入层）前置设计
> **一句话目标**：canvas 交互层 100% 是改版外挂 → 明确「**挂在哪、怎么挂**」，且**不散落改上游**。
> **基准**：上游 **V1.11.22（`90df65097b6d`）**
> **输入**：`10-前端-pointerdown清点表.md`（F-1）+ `21-F5-上游src-ui导航调研.md`（F-5）+ `22-F4-12场景覆盖矩阵函数级.md`（F-4）+ `src/input/*.ts`（F-6）
> **编制日期**：2026-10-15
>
> **验收对齐**：① 38 处 canvas 交互点全部有上游文件 + 接入函数；② 统一拦截层设计（不散落改上游）；③ 标明哪些可复用上游 `bindKey`。

---

## 零、TL;DR（给 S6 的 6 条）

| # | 结论 |
|---|---|
| **1** | canvas 交互层 **38 处中约 34 处是改版外挂**（上游无 pointerdown）；上游可复用仅 **6 文件 / 模态族** |
| **2** | 承接方式 = **1 个统一拦截入口 + 声明式注册表 + 12 个场景适配器 + 1 个 legacy-bridge**，**不在 handler 里加 pointerdown** |
| **3** | 分三档承接：**✅ 复用上游**（6 文件）｜**🔴 外挂新建**（34 处，落在 `src/input/`）｜**⬆️ 最小只读 getter**（受控例外，需登记） |
| **4** | **虚拟手柄**不走 canvas 层：复用上游 `src/touch-controls.ts` 的 `bindKey()`（**已含 pointer**，本地被魔改移除）→ 源码级恢复即可，**工时≈0** |
| **5** | 全部鼠标语义的**终点是上游公开 API**：`ui.processInput(Button)` / `handler.setCursor(n)` / `ui.setMode()` —— 不碰私有 `onXxxPointer` |
| **6** | 灰度防双触发双保险：`interaction-registry.priority` + `input-arbiter` 同帧去重（F-6 已产出，31 项单测） |

---

## 一、问题定义

### 1.1 缺口规模（F-1 实测）

| 指标 | 数值 | 含义 |
|---|---:|---|
| 产物 `pointerdown` 总数 | 55 | 38 canvas 交互点 + 17 全局监听 |
| 其中**上游已有** | ~6 文件 | 仅模态/表单/管理员/登录/OAuth 边缘界面 |
| 其中**改版外挂** | ~34 处 | PARTY/FIGHT/SUMMARY/MENU/POKEDEX/STARTER_SELECT/选项 + 18 改版模式 |
| 改版新增 UiMode | 18 | ERYOU_*×11 / TALENT_*×3 / JIEMING / PT_*×2 / SUPER_BACKPACK |

### 1.2 为什么必须「统一拦截」而非「逐个改 handler」

| 若散落改（反例） | 后果 |
|---|---|
| 在每个 handler 里加 `node.on("pointerdown", …)` | ① 重复实现手势/节流/去重；② 与上游未来升级冲突；③ 无法统一禁用/灰度；④ 命中区几何分散在各 handler，无法集中调优 |
| **统一拦截（本方案）** | ① 单点手势判定（复用 F-6）；② handler **只被调用、不被改**；③ 灰度/禁用一处生效；④ 命中区集中登记，可整体走查（对齐 3-A） |

---

## 二、38 处 canvas 交互点 → 上游文件 + 接入函数（全表）

> **承接方式图例**：`✅复用` = 上游已有等价 pointerdown，纳入注册表即可 ｜ `🔴外挂` = 上游无，落在 `src/input/scene-adapters/` ｜ `🆕新建` = 上游 handler 文件不存在，A3 新建 ｜ `⬆️getter` = 需在上游 handler 增最小只读方法（受控例外，登记）

| # | 场景（UiMode） | 产物回调 | 上游文件 | 接入函数（上游公开 API） | 承接方式 |
|---|---|---|---|---|---|
| 1 | PARTY | `onOptionPointer` | `handlers/party-ui-handler.ts` | `setCursor(optionsCursor±1)` / `processInput(Button.ACTION)` | 🔴外挂 |
| 2 | PARTY | `onPointerSelect` | `handlers/party-ui-handler.ts` | `setCursor(slotIndex)` | 🔴外挂 |
| 3 | PARTY | `onPointerPress` | `handlers/party-ui-handler.ts` | `processInput(Button.CANCEL)` | 🔴外挂 |
| 4 | SUPER_BACKPACK | `onRowPointer` | **（上游不存在）** `handlers/super-backpack-ui-handler.ts` | `setCursor(rowIndex)` | 🆕新建 |
| 5 | FIGHT | `onMoveSlotPointer` | `handlers/fight-ui-handler.ts` | `setCursor(moveSlot)`（:295） | 🔴外挂 |
| 6 | SUMMARY | 内联返回 | `handlers/summary-ui-handler.ts` | `processInput(Button.CANCEL)`（:583） | 🔴外挂 |
| 7 | OPTION_SELECT | `toggleOptionState` | `settings/option-select-ui-handler.ts` | `setCursor(opt)` + `toggleOptionState()` | 🔴外挂 |
| 8 | 设置下拉 | 下拉项 | `containers/dropdown.ts` | `setCursor(i)`（:433）/ `toggleOptionState(i)`（:500） | 🔴外挂 |
| 9 | SAVE_SLOT | `onSessionSlotPointer` | `handlers/save-slot-select-ui-handler.ts` | `setCursor(slot)`（:370）/ `setScrollCursor()`（:444） | 🔴外挂 |
| 10 | STARTER_SELECT | `onStarterGridPointer` | `handlers/starter-select-ui-handler.ts` | `setCursor(idx)`；索引由 `calcStarterPosition()`（:237）反算 | 🔴外挂 |
| 11 | STARTER_SELECT | `onTeamSlotPointer` | `handlers/starter-select-ui-handler.ts` | `setCursor(teamSlot)` | 🔴外挂 |
| 12 | POKEDEX | 内联返回 | `handlers/pokedex-ui-handler.ts` | `processInput(Button.CANCEL)` | 🔴外挂 |
| 13 | POKEDEX_PAGE | 内联返回 | `handlers/pokedex-page-ui-handler.ts` | `processInput(Button.CANCEL)` | 🔴外挂 |
| 14 | MENU | `onMenuRowPointer` | `handlers/menu-ui-handler.ts` | `setCursor(row)`（:779） | 🔴外挂 |
| 15 | 提示弹窗 | 模态按钮 | `handlers/modal-ui-handler.ts`（:138） | `buttonActions[i]()` → `processInput` | ✅复用 |
| 16 | POKEDEX | 图鉴内返回 | `handlers/pokedex-ui-handler.ts` | `processInput(Button.CANCEL)` | 🔴外挂 |
| 17 | 通用按钮组件 | 组件回调 | `handlers/modal-ui-handler.ts`（modal 共用） | `processInput` | ✅复用 |
| 18 | LOGIN_FORM | 下载存档/Discord | `handlers/login-register-info-container-ui-handler.ts`（:104/108/112） | `processInput` | ✅复用 |
| 19 | ERYOU_* | `eryouExitZone` | **（上游无 ERYOU）** `handlers/eryou-*-ui-handler.ts` | `UI.revertMode()` / 场景内 `close()` | 🆕新建 |
| 20 | STARTER_SELECT | `onStartButtonPointer` | `handlers/starter-select-ui-handler.ts`（改造） | `processInput(Button.ACTION)` | 🔴外挂 |
| 21 | STARTER_SELECT | `eryouSearchZone` | **（上游无）** `handlers/eryou-*-ui-handler.ts` | `UI.setMode(ERYOU_SEARCH)` | 🆕新建 |
| 22 | PT_CONSTELLATION | `cyclePtSort` | **（上游无 PT）** `handlers/pt-constellation-ui-handler.ts` | 场景内 `setCursor` + 排序刷新 | 🆕新建 |
| 23 | TALENT_* | 关闭 | **（上游无）** `handlers/talent-*-ui-handler.ts` | `processInput(Button.CANCEL)` | 🆕新建 |
| 24 | TALENT_VIEWER | `toggleSkillView` | `handlers/talent-viewer-ui-handler.ts` | 场景内切换 + `setCursor` | 🆕新建 |
| 25 | TALENT_* | `onSkillRowPointer` | `handlers/talent-*-ui-handler.ts` | `setCursor(skillRow)` | 🆕新建 |
| 26 | TALENT_*（命座） | `onStarPointer` | `handlers/talent-*-ui-handler.ts` | `setCursor(starNode)` | 🆕新建 |
| 27 | TALENT_* | `cycleBranch` | `handlers/talent-*-ui-handler.ts` | 场景内 `cycleBranch` + `setCursor` | 🆕新建 |
| 28 | TALENT_* | `onChoicePointer` | `handlers/talent-*-ui-handler.ts` | `setCursor(choice)` | 🆕新建 |
| 29 | JIEMING | `onRowPointer` | **（上游无 JIEMING）** `handlers/jieming-ui-handler.ts` | `setCursor(row)` | 🆕新建 |
| 30 | ERYOU_HELD_ITEM | 状态切换 | `handlers/eryou-held-item-ui-handler.ts` | `setCursor` + `refresh()` | 🆕新建 |
| 31 | ERYOU_* | 列表上翻 | `handlers/eryou-*-ui-handler.ts` | `setCursor(listCursor-1)` | 🆕新建 |
| 32 | ERYOU_* | 列表下翻 | `handlers/eryou-*-ui-handler.ts` | `setCursor(listCursor+1)` | 🆕新建 |
| 33 | ERYOU_* | 行激活 | `handlers/eryou-*-ui-handler.ts` | `setCursor(row)` | 🆕新建 |
| 34 | ERYOU_* | 动作行 | `handlers/eryou-*-ui-handler.ts` | `processInput(Button.ACTION)` | 🆕新建 |
| 35 | ERYOU_SYNTHESIS | 材料 -1 | `handlers/eryou-synthesis-ui-handler.ts` | `setCursor` + 材料刷新 | 🆕新建 |
| 36 | ERYOU_SYNTHESIS | 材料 +1 | `handlers/eryou-synthesis-ui-handler.ts` | `setCursor` + 材料刷新 | 🆕新建 |
| 37 | ERYOU_* | 关闭提示 | `handlers/eryou-*-ui-handler.ts` | `processInput(Button.CANCEL)` | 🆕新建 |
| 38 | ERYOU_* | 取回槽位 | `handlers/eryou-*-ui-handler.ts` | `setCursor(slot)` + 取回 | 🆕新建 |

### 2.1 上游已有但产物未单列的 pointerdown（补全，属「✅复用」）

| 上游文件 | 行 | 用途 | 承接方式 |
|---|---|---|---|
| `handlers/modal-ui-handler.ts` | 138 | 模态按钮 | ✅复用 |
| `handlers/form-modal-ui-handler.ts` | 137 / 144 | 表单模态确认 | ✅复用 |
| `handlers/admin-ui-handler.ts` | 210 | 管理员 Link/Unlink | ✅复用 |
| `handlers/login-register-info-container-ui-handler.ts` | 104 / 108 / 112 | 用户名 / 下载存档 / 切语言 | ✅复用 |
| `handlers/oauth-providers-ui-handler.ts` | 94 / 104 | OAuth 图标 | ✅复用 |
| `touch-controls.ts` | 74 / 99 | 虚拟手柄（**DOM 层**，见 §四） | ⬆️恢复 |
| `settings/move-touch-controls-handler.ts` | 307 | 虚拟手柄拖拽定位（DOM） | ✅复用 |

### 2.2 ⬆️「最小只读 getter」受控例外（预计 ≤ 6 处）

> 统一拦截层需要**读取命中区几何**（槽位/网格/卡片矩形）。上游 handler 多数在私有字段里算几何。
> **优先只读观测**（读 `container.getAt(i).getBounds()` 等公开 surface）；**仅当只读不可行**才增最小只读方法，且必须登记：

| 场景 | 需要的几何 | 只读可否 | 若需 getter（建议名） |
|---|---|---|---|
| PARTY | 槽位矩形 | 可（`getAt(i).getBounds()`） | — |
| FIGHT | 招式槽矩形 | 可 | — |
| STARTER_SELECT | 网格单元矩形 | 可（`calcStarterPosition` 已是模块函数，可直接复用反算） | — |
| POKEDEX | 行/列矩形 | 可（`scrollCursor` 公开） | — |
| SUPER_BACKPACK | 行矩形 | 🆕新建文件自带 | — |
| 改版 18 模式 | 各自命中区 | 🆕新建文件自带 | — |

> **结论**：预计**几乎不需要**新增 getter —— 上游几何多数可从公开容器表面只读获得。凡新增者，一律在本文档登记并标注 `// 受控例外（F-7）`。

---

## 三、统一拦截层设计（不散落改上游）★

### 3.1 架构（唯一入口 → 分层收敛）

```
┌─────────────────────────────────────────────────────────────────────┐
│ ①  唯一 DOM/Phaser 事件入口                                          │
│    src/input/pointer-manager.ts                                      │
│    在 globalScene.input 注册**唯一**一组：                            │
│      pointerdown / pointermove / pointerup / pointerupoutside        │
│      wheel / contextmenu                                             │
│    ⚠️ 替代产物里 38 处散落注册；handler 内不再新增任何 .on("pointer") │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ 归一化 PointerSample
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ ②  手势判定（F-6 已产出，零 Phaser 依赖）                            │
│    src/input/gesture-resolver.ts   →  GestureResult(click/drag/…)    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ GestureResult
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ ③  键鼠仲裁（F-6 已产出，31 项单测）                                 │
│    src/input/input-arbiter.ts   →  { accept, reason }                │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ ④  声明式注册表（本方案核心：把「挂在哪」集中声明）                  │
│    src/input/interaction-registry.ts                                 │
│    按当前 ui.mode 取该场景的 InteractionSpec[]：                      │
│      { id, bounds(), kind, action, priority, enabled?() }            │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ 命中 → ActionSpec
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ ⑤  场景适配器（F-8 产出 12 个桩；每场景只「登记命中区 + 翻译语义」）  │
│    src/input/scene-adapters/<scene>-adapter.ts                       │
│    ⚠️ 只读上游 handler 的公开 surface，不修改 handler                │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ ActionSpec
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ ⑥  语义桥（终点统一为上游公开 API）                                  │
│    src/input/legacy-bridge.ts                                        │
│    ActionSpec → Button →  ui.processInput(Button)                    │
│    hover      →  handler.setCursor(n)                                 │
│    场景切换   →  ui.setMode()                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 「不散落改上游」的三条铁律

| 铁律 | 内容 | 违反判据 |
|---|---|---|
| **铁律 1：不改 handler 的 pointer 绑定** | 所有新交互实现在 `src/input/**`；上游 handler **只被调用、不被改**（`git diff` 中 handler 无 `pointerdown` 新增） | 任何 `.ts` under `src/ui/**` 出现新增 `.on("pointerdown")` |
| **铁律 2：只用上游公开 API** | 动作终点仅 `ui.processInput(Button)` / `handler.setCursor(n)` / `ui.setMode()`；**不调**私有 `onXxxPointer` | 出现 `onXxxPointer` 调用 |
| **铁律 3：灰度期旧实现保留** | 18 改版模式的旧 pointerdown **暂不删**；用 `registry.priority` + `arbiter` 同帧去重防双触发（v1 §5.2） | 灰度前删旧实现 |

### 3.3 核心接口（F-8 将产出 12 个场景桩，此处先冻结签名）

```ts
// src/input/interaction-registry.ts（设计签名，非最终实现）
import type { Button } from "#enums/buttons";
import type { UiMode } from "#enums/ui-mode";

/** 命中区（世界坐标矩形；bounds() 惰性求值，随滚动变化） */
export interface HitBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 交互语义 */
export type InteractionAction =
  | { kind: "button"; button: Button }            // 推荐：直接复用上游判定
  | { kind: "cursor"; cursor: number; then?: Button } // 命中即 setCursor，可选再触发
  | { kind: "scroll"; delta: number }
  | { kind: "custom"; fn: () => void };           // 兜底：改版系统内部动作

/** 一条声明式交互条目 */
export interface InteractionSpec {
  /** 稳定 id，用于灰度与调试（如 "party.slot.2"） */
  id: string;
  /** 惰性命中区（每次命中判定时求值，支持滚动） */
  bounds(): HitBox;
  action: InteractionAction;
  /** 灰度优先级：大者先命中（用于旧实现共存期） */
  priority?: number;
  /** 运行时可禁用（对齐 v1 §5.5 3-D 禁用元素） */
  enabled?(): boolean;
}

/** 场景适配器契约（F-8 的 12 个桩都实现它） */
export interface SceneAdapter {
  /** 对应 F-4 覆盖矩阵行号（1..13） */
  readonly matrixRow: number;
  /** 人类可读场景名（与 F-4 §一 矩阵一致） */
  readonly label: string;
  /** 本适配器覆盖的全部 UiMode / 改版模式标识（F-8 把单数 mode 细化为复数 modes） */
  readonly modes: readonly SceneMode[];
  /** 当前是否可交互（归一 pointerReady 三变体） */
  isActive(): boolean;
  /** 返回本场景的全部交互条目 */
  specs(): InteractionSpec[];
}
```

> `ui.processInput(Button)` / `handler.setCursor(n)` / `ui.setMode(mode)` 均为 **V1.11.22 已存在的公开 API**（见 `21-F5-上游src-ui导航调研.md` §2.1/§2.2）。**不新增、不臆造**。

### 3.4 归一化：消解改版三种 `pointerReady()` 变体

| 变体 | 产物实现 | 归一为 |
|---|---|---|
| A（二游进度） | `active && !!controller && !busy && !closing && container.visible` | `SceneAdapter.isActive()` |
| B（天赋/命座） | `active && container.visible` | 同上 |
| C（解明） | `active && container.visible`（同名不同实现） | 同上 |

统一语义：**`visible && active && !busy && !closing && scene 匹配`**，各适配器按需覆盖。

---

## 四、可复用上游 `bindKey` 机制的部分 ★

> **关键**：**虚拟手柄不在 canvas 层** —— 它是 DOM 元素（`#touchControls`），由 `src/touch-controls.ts` 管理。
> 上游 V1.11.22 的 `bindKey()` **已经包含 `pointerdown` / `pointerup`**，且带防重逻辑；**本地被魔改移除**（见 `20-F2-TouchControl版本复核报告.md`）。

### 4.1 上游 `bindKey` 的 pointer 支持（已核实）

```ts
// src/touch-controls.ts（V1.11.22 已存在，本地被魔改回退）
node.addEventListener("touchstart", event => { …; dataset.skipPointerEvent = undefined; });
node.addEventListener("pointerdown", event => {                        // ← 上游已有
  if ("skipPointerDown" in currentTarget.dataset) return;             // 触摸派生 pointer 去重
  event.preventDefault();
  this.touchButtonDown(node, key);
});
node.addEventListener("touchend", event => { …; delete …skipPointerEvent; dataset.skipPointerUp = undefined; });
node.addEventListener("pointerup", event => {                          // ← 上游已有
  if ("skipPointerUp" in currentTarget.dataset) { delete …; return; }
  event.preventDefault();
  this.touchButtonUp(node, key, event.target?.["id"]);
});
```

### 4.2 承接方式：**源码级恢复，而非重写**

| 项 | 处置 | 工作量 |
|---|---|---|
| `touch-controls.ts` 的 `bindKey` | **恢复上游 V1.11.22 实现**（补回 `pointerdown`/`pointerup` + `skipPointer*`） | ≈0 |
| 虚拟手柄 `virtualPad` 行为开关 | 由 `src/input/` 读取 `input-config.json` 的 `virtualPad` 段控制 class 显示 | 小 |
| `settings/move-touch-controls-handler.ts`（DOM 拖拽定位） | **直接复用**上游（:307） | ≈0 |
| 其余 canvas 交互 | **不走 bindKey**，走 §三 统一拦截层 | 主体工作量 |

> **结论**：`bindKey` 机制可复用的只有**虚拟手柄一族**（DOM 层）。
> **`bindKey` 不能覆盖 canvas 业务界面** —— 那是 F-7 统一拦截层的职责。
> ⇒ 复用 `bindKey` = 「虚拟手柄恢复」；新建拦截层 = 「12 场景 + 18 模式」。二者边界清晰。

### 4.3 全局监听（17 处）的承接

| 类型 | 数量 | 承接 |
|---|---:|---|
| 拖拽（背包/排序） | 5 组 | 拦截层 `gesture-resolver` 的 `drag` → `{kind:"scroll", drag.axis}` |
| 滑动关闭（3 改版系统） | 3 组 | 同上；**去掉硬判 `wasTouch`**（v1 §4.3 C6），使鼠标也可滑关 |
| 改版弹窗 onPointerDown/Up | 2 组 | 拦截层统一处理 + `pointerupoutside` 兜底 |
| `pointerupoutside` 缺失 | 缺 1 处 | 拦截层补齐（防拖拽态卡住） |

---

## 五、接入函数清单（S6 hook 表）

> **鼠标动作 → 上游调用** 的唯一映射；S6 实现时照此调用，**不得自造 API**。

| 上游公开 API | 位置 | 用途 | 被哪些场景用 |
|---|---|---|---|
| `UI.processInput(button: Button): boolean` | `src/ui/ui.ts:261` | **动作终点** | 全部（`{kind:"button"}`） |
| `UI.getHandler<H>(): H` | `src/ui/ui.ts:235` | 取当前 handler | 全部 |
| `UI.setCursor(cursor: number): boolean` | `src/ui/ui.ts:471` | 光标设置 | hover → focus-coordinator |
| `UI.getMode(): UiMode` | `src/ui/ui.ts:575` | 取当前场景 | registry 选适配器 |
| `UI.setMode(mode, …): Promise<void>` | `src/ui/ui.ts:579` | 场景切换 | 改版系统入口/退出 |
| `UI.setOverlayMode / revertMode` | `src/ui/ui.ts:…` | 叠层/返回 | ERYOU / TALENT 等 |
| `UiHandler.processInput(button): boolean` | `src/ui/handlers/ui-handler.ts:28` | handler 级动作 | 各适配器 |
| `UiHandler.getCursor / setCursor` | `src/ui/handlers/ui-handler.ts:34/38` | 光标读写 | 各适配器 |
| `globalScene.inputMethod` | `src/ui-inputs.ts` | 设备标记读取 | input-arbiter（F-9） |
| `TouchControl.bindKey(node,key)` | `src/touch-controls.ts` | 虚拟手柄 | 虚拟手柄（恢复） |

> **F-9 衔接**：`inputMethod` 的读写点与 `"mouse"` 扩展方式在 **F-9** 专项确认（见 `25-F9-…`）。

---

## 六、与 F-4 覆盖矩阵的对应

| F-4 场景 | 适配器文件（F-8） | 承接方式 | 复用 bindKey |
|---|---|---|---|
| 1 TITLE | `scene-adapters/title-adapter.ts` | 🔴外挂 | 否 |
| 2 MENU/SETTINGS | `scene-adapters/menu-adapter.ts` | 🔴外挂（含 `dropdown`） | 否 |
| 3 PARTY | `scene-adapters/party-adapter.ts` | 🔴外挂 | 否 |
| 4 SUMMARY | `scene-adapters/summary-adapter.ts` | 🔴外挂 | 否 |
| 5 SUPER_BACKPACK | `scene-adapters/super-backpack-adapter.ts` | 🆕新建 | 否 |
| 6 COMMAND | `scene-adapters/command-adapter.ts` | 🔴外挂 | 否 |
| 7 FIGHT | `scene-adapters/fight-adapter.ts` | 🔴外挂 | 否 |
| 8 TARGET_SELECT | `scene-adapters/target-select-adapter.ts` | 🔴外挂 | 否 |
| 9 MODIFIER_SELECT | `scene-adapters/modifier-select-adapter.ts` | 🔴外挂 | 否 |
| 10 STARTER_SELECT | `scene-adapters/starter-select-adapter.ts` | 🔴外挂 + 🆕 | 否 |
| 11 POKEDEX/_PAGE | `scene-adapters/pokedex-adapter.ts` | 🔴外挂 | 否 |
| 12 改版新增 ×18 | `scene-adapters/pkrc-modes-adapter.ts` | 🆕新建 | 否 |
| 13 模态族 ×5 | `scene-adapters/modal-adapter.ts` | ✅复用 | 否 |
| — 虚拟手柄 | （不在适配器） | ⬆️恢复 `bindKey` | **是** |

---

## 七、给 S6 的输入摘要

```
【S6 输入 · 前端 F-7 供料（2026-10-15）】

■ 38 处 canvas 交互点：全部有上游文件 + 接入函数（见 §二）
    ✅复用 6 文件（模态族 / OAuth / 管理员 / 登录）→ 纳入注册表
    🔴外挂 34 处 → 落 src/input/scene-adapters/
    🆕新建 19 类 handler（ERYOU×12 / TALENT×3 / JIEMING / PT×2 / SUPER_BACKPACK）

■ 统一拦截层（不散落改上游）：
    唯一入口 pointer-manager → gesture-resolver(F-6) → input-arbiter(F-6)
      → interaction-registry（声明式）→ scene-adapters(12) → legacy-bridge
      → ui.processInput(Button) / handler.setCursor(n)

■ 三条铁律：
    ① handler 内不新增 pointerdown（改上游 = 违规）
    ② 只用公开 API（processInput / setCursor / setMode），不碰 onXxxPointer
    ③ 灰度期旧实现保留，priority + 同帧去重防双触发

■ 复用上游 bindKey：仅「虚拟手柄」（DOM 层，touch-controls.ts 恢复 pointer 支持，工时≈0）
    canvas 业务界面 bindKey 覆盖不到 → 必须走统一拦截层

■ 受控例外：几何只读观测优先；确需 getter 时登记（预计 ≤ 0~6 处）
```

---

## 八、待办与依赖

| 项 | 依赖 | 状态 |
|---|---|---|
| 38 处承接表 | F-1 + F-4 | ✅ **已完成（本文档 §二）** |
| 统一拦截层设计 | F-5 + F-6 | ✅ **已完成（本文档 §三）** |
| bindKey 复用范围界定 | F-2 | ✅ **已完成（本文档 §四）** |
| 12 场景适配器桩 | 本文档 + F-8 | ⏳ **F-8 进行中** |
| `inputMethod` 接入点 | F-9 | ⏳ 待办 |
| S6 实现 | M5（A5） | 🔒 阻塞 |

---

> **说明**：本文档是**承接设计 + 逐点映射**，不是实现。实现待 M5 后（v2 看板 S6-*）。
> **时效**：事实采集 2026-10-15，基准 V1.11.22（`90df65097b6d`）。

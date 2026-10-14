# F-5 · 上游 `src/ui/**` 导航调研

> **任务**：派单 15 §三 F-5（🟡 medium）｜ v2 看板 准备-3
> **负责人**：前端工程师
> **日期**：2026-10-14
> **基准**：上游 **V1.11.22（`90df65097b6d`）** —— 本地源码树 `.build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993/`
> **目的**：为 S6（源码级输入层）铺路 —— 搞清楚「交互层在源码哪里、S6 要改哪些文件」。

---

## 一、`src/ui/` 目录结构（总览）

```
src/ui/
├── ui.ts                    (669 行)  UI 总控容器 ★ S6 核心入口
├── ui-theme.ts              (248 行)  主题窗口渲染（Window/UiTheme）
├── text.ts                  (700 行)  文本创建（TextWrapper / addText）
├── battle-info/             ← 战斗信息栏
│   ├── battle-info.ts                 ★ 改版重灾区（getBattleInfoSlot 65 锚点）
│   ├── enemy-battle-info.ts
│   └── player-battle-info.ts
├── containers/              ← 可复用 UI 组件（28 个）
│   ├── dropdown.ts                    ★ 设置下拉（改版加了 pointerdown）
│   ├── base-stats-overlay.ts          ★ 改版加的种族值浮层
│   ├── scroll-bar.ts                  ★ 滚轮/滚动条
│   └── …（见 §三）
├── handlers/                ← 各 UiMode 的处理器（47 个）★ 绝大多数改动在这
├── settings/                ← 设置相关 handler（13 个）
│   └── move-touch-controls-handler.ts ★ 虚拟手柄拖拽（上游唯一 DOM pointer 之一）
└── utils/
    ├── pokemon-icon-anim-helper.ts
    └── scrollable-grid-helper.ts      ★ 网格滚动（选人/图鉴）
```

---

## 二、核心入口文件（S6 必须理解）

| 文件 | 职责 | S6 关注点 |
|---|---|---|
| **`src/ui/ui.ts`** | `UI` 类（继承 `Phaser.GameObjects.Container`）。**所有 UI 的总控**：`processInput()` / `setMode()` / `setOverlayMode()` / `getHandler()` / `setCursor()` / `showText()` / `showTooltip()` | 🔴 **S6 的收敛点** —— `legacy-bridge` 最终调 `ui.processInput(Button)`；`focus-coordinator` 调 `ui.setCursor()` |
| **`src/ui/handlers/ui-handler.ts`** | `UiHandler` 抽象基类：`setup()` / `show()` / `processInput()` / `getCursor()` / `setCursor()` | 🔴 **S6 适配器的挂载点** —— 每个 handler 的 `processInput` 是鼠标语义的终点 |
| `src/ui/ui-theme.ts` | `Window` / `UiTheme`，窗口九宫格渲染 | UI 设计师 S7 关注（非 S6） |
| `src/ui/text.ts` | 文本创建（`TextWrapper`、`addText`） | UI 设计师 S7 关注（非 S6） |
| `src/ui-inputs.ts` | `UiInputs`：`listenInputs()` / `detectInputMethod()` / `getActionsKeyDown()` | 🔴 **S6 必改** —— `detectInputMethod` 需扩展 `"mouse"`；动作表是鼠标语义映射的对照 |
| `src/inputs-controller.ts` | `InputsController`：键盘/手柄事件 → `input_down`/`input_up` | 🟠 **S6 参考** —— 鼠标事件的镜像对象 |
| `src/touch-controls.ts` | `TouchControl`：虚拟手柄 DOM 绑定 | 🔴 **S6 必改** —— 恢复被魔改移除的 `pointerdown`/`pointerup`（见 20 号文档） |

### 2.1 `ui.ts` 的关键 API（S6 会调用）

```ts
// src/ui/ui.ts:114
export class UI extends Phaser.GameObjects.Container {
  processInput(button: Button): boolean            // :261  ← legacy-bridge 终点
  setCursor(cursor: number): boolean               // :471  ← focus-coordinator 调用
  getCursor(): number
  getHandler<H extends UiHandler>(): H             // :235
  getMode(): UiMode                                // :575
  setMode(mode, ...args): Promise<void>            // :579
  setOverlayMode(mode, ...args): Promise<void>
  revertMode(): Promise<void>
  playSelect(): void                               // :480
  playError(): void                                // :484
}
```

### 2.2 `UiHandler` 基类契约（S6 适配器必须遵守）

```ts
// src/ui/handlers/ui-handler.ts:8
export abstract class UiHandler {
  abstract setup(): void;
  show(_args: any[]): boolean;                    // :22
  abstract processInput(button: Button): boolean; // :28  ← 鼠标语义的最终落点
  getCursor(): number;                            // :34
  setCursor(cursor: number): boolean;             // :38
  destroy(): void;
}
```

> **S6 设计含义**：只要鼠标动作最终产出 `Button` 并调用 `processInput`，就**自动复用**了上游全部既有判定（模式白名单、音效、振动、`disableMenu`、`pendingPrompt`）。这正是 v1 §3.2 强调的「`kind:"button"` 是默认与推荐路径」。

---

## 三、`containers/` 组件清单（S6 需注意的）

| 组件 | 改版关联 |
|---|---|
| `dropdown.ts` | ★ 改版加了 `pointerdown`（设置下拉项）→ S6 需接管 |
| `base-stats-overlay.ts` | ★ **改版新增文件**（种族值浮层）→ A3 新建 |
| `scroll-bar.ts` | 滚轮/滚动条 → S6 滚轮节流接入点 |
| `filter-bar.ts` / `filter-text.ts` | 筛选栏 → 选人/图鉴 |
| `pokemon-info-container.ts` | 宝可梦信息容器（`pointerover` 提示） |
| `starter-container.ts` | 选人网格单元 → S6 网格命中 |
| `stats-container.ts` | 能力值容器 |
| `pokeball-tray.ts` / `candy-bar.ts` / `ribbon-tray-container.ts` | 各状态栏 |
| 其余（`ability-bar` / `bgm-bar` / `char-sprite` / `arena-flyout` / `battle-flyout` / `achv-bar` / `daily-run-scoreboard` / `egg-counter-container` / `event-display` / `hatched-pokemon-container` / `move-info-overlay` / `party-exp-bar` / `pokedex-info-overlay` / `pokedex-mon-container` / `pokemon-hatch-info-container` / `saving-icon-handler` / `time-of-day-widget`） | 无 pointer 交互，S6 不涉及 |

---

## 四、`handlers/` 全量（47 个）与 S6 关联度

### 4.1 🔴 S6 必须改（有指针交互）

| Handler | 场景 | 上游 pointerdown | S6 动作 |
|---|---|---|---|
| `party-ui-handler.ts` | PARTY | ❌ 无 | 新增槽位/选项/取消命中 |
| `fight-ui-handler.ts` | FIGHT | ❌ 无 | 新增招式槽命中 |
| `summary-ui-handler.ts` | SUMMARY | ❌ 无 | 新增页签/返回 |
| `menu-ui-handler.ts` | MENU | ❌ 无 | 新增菜单行 |
| `pokedex-ui-handler.ts` | POKEDEX | ❌ 无 | 新增列表/返回 |
| `pokedex-page-ui-handler.ts` | POKEDEX_PAGE | ❌ 无 | 新增返回 |
| `save-slot-select-ui-handler.ts` | SAVE_SLOT | ❌ 无 | 新增存档槽 |
| `starter-select-ui-handler.ts` | STARTER_SELECT | ❌ 无 | 新增网格/队伍槽/筛选 |
| `command-ui-handler.ts` | COMMAND | ❌ 无 | 新增战斗指令按钮 |
| `modifier-select-ui-handler.ts` | MODIFIER_SELECT | ❌ 无 | 新增卡片命中 |
| `target-select-ui-handler.ts` | TARGET_SELECT | ❌ 无 | 新增目标命中 |
| `title-ui-handler.ts` | TITLE | ❌ 无 | 新增主菜单 |
| `abstract-option-select-ui-handler.ts` | OPTION_SELECT | ❌ 无 | 新增选项命中 |
| `settings/option-select-ui-handler.ts` | 设置选项 | ❌ 无 | 新增选项命中 |
| `modal-ui-handler.ts` | 模态 | ✅ **:138 已有** | 复用/增强 |
| `form-modal-ui-handler.ts` | 表单模态 | ✅ **:137/144 已有** | 复用 |
| `admin-ui-handler.ts` | ADMIN | ✅ **:210 已有** | 复用 |
| `login-register-info-container-ui-handler.ts` | LOGIN | ✅ **:104/108/112 已有** | 复用 |
| `oauth-providers-ui-handler.ts` | 登录 | ✅ **:94/104 已有** | 复用 |

### 4.2 🆕 上游不存在（A3 新建，S6 需适配）

| 改版 Handler | 对应 UiMode | 建议新建路径 |
|---|---|---|
| `SuperBackpackUiHandler` | SUPER_BACKPACK | `src/ui/handlers/super-backpack-ui-handler.ts` |
| `TalentViewerUiHandler` / `TalentCodexUiHandler` / `TalentShopUiHandler` | TALENT_* | `src/ui/handlers/talent-*-ui-handler.ts` |
| `JiemingUiHandler` | JIEMING | `src/ui/handlers/jieming-ui-handler.ts` |
| `Eryou*UiHandler`（Lobby/Synthesis/Search/Training/HeldItem/…） | ERYOU_* | `src/ui/handlers/eryou-*-ui-handler.ts` |
| PT 相关 | PT_CONSTELLATION / PT_SOUDACHE_START | `src/ui/handlers/pt-*-ui-handler.ts` |

### 4.3 ⚪ S6 不涉及（无指针交互）

`achvs` / `autocomplete` / `awaitable` / `ball` / `battle-message` / `challenges-select` / `change-password-form` / `confirm` / `egg-*` / `evolution-scene` / `game-stats` / `loading-modal` / `login-form` / `login-or-register` / `message` / `mystery-encounter`（仅 pointerover）/ `registration-form` / `rename-*` / `run-history` / `run-info` / `session-reload-modal` / `test-dialogue` / `unavailable-modal` / `abstract-binding` / `settings/abstract-*` / `settings/keyboard-binding` / `settings/gamepad-binding` / `settings/settings-*`

---

## 五、改版需改动的入口文件清单（S6 施工清单）

```
🔴 必改（3 个）
  src/ui-inputs.ts              ← detectInputMethod 扩展 "mouse"；动作表对照
  src/touch-controls.ts         ← 恢复 pointerdown/pointerup（20 号文档）
  src/ui/ui.ts                  ← 若有全局 pointer 入口则在此挂载（或新建 src/input/）

🟠 新增（1 目录）
  src/input/                    ← S6 交互层主体（pointer-manager / gesture-resolver /
                                   input-arbiter / legacy-bridge / focus-coordinator /
                                   interaction-registry / scene-adapters）

🔴 改造（约 14 个 handler）
  src/ui/handlers/{party,fight,summary,menu,pokedex,pokedex-page,save-slot-select,
                   starter-select,command,modifier-select,target-select,title}-ui-handler.ts
  src/ui/settings/option-select-ui-handler.ts
  src/ui/containers/dropdown.ts

🆕 新建 handler（约 6 组，配合 A3）
  src/ui/handlers/{super-backpack,talent-*,jieming,eryou-*,pt-*}-ui-handler.ts

⚪ 复用不新增（7 个已有 pointerdown）
  modal / form-modal / admin / login-register-info-container / oauth-providers
  （上游已有，S6 只需纳入统一注册表）
```

---

## 六、S6 与上游概念的对应（避免自造名词）

| v1 术语 | 上游对应概念 | 位置 |
|---|---|---|
| 场景（Scene） | `UiMode` | `src/enums/ui-mode.ts` |
| 交互终点 | `UI.processInput(Button)` | `src/ui/ui.ts:261` |
| 处理器 | `UiHandler` 子类 | `src/ui/handlers/*` |
| 光标 | `handler.getCursor()/setCursor()` | `src/ui/handlers/ui-handler.ts:34/38` |
| 模式切换 | `UI.setMode()/setOverlayMode()/revertMode()` | `src/ui/ui.ts:579/…` |
| 设备 | `globalScene.inputMethod` | `src/ui-inputs.ts` |
| 输入事件 | `input_down` / `input_up` | `src/inputs-controller.ts` emit |

> **可迁移性要求 ②**（派单 02 §五）：S6 一律使用**上游概念**（`UiMode` / `processInput` / `setCursor`），**不造自造名词**。

---

## 七、结论

1. **交互层在源码中高度集中**：S6 的收敛点是 `ui.ts` 的 `processInput` 与 `ui-handler.ts` 的 `setCursor` —— 只要鼠标产出 `Button`，就能复用全部上游判定。
2. **改版需改动的入口文件只有 3 个**（`ui-inputs.ts` / `touch-controls.ts` / `ui.ts`）+ 新增 `src/input/` 目录。
3. **handler 改造面约 14 个**（已有上游文件）+ **6 组新建**（TALENT/ERYOU/JIEMING/PT/SuperBackpack）。
4. **7 个已有 pointerdown 的上游文件**（modal 系）可直接纳入统一注册表，无需重写。
5. `src/ui/ui-theme.ts` / `src/ui/text.ts` 属 **UI 设计师 S7** 范畴，S6 不碰（边界清晰）。

---

## 八、可复现命令

```bash
U=.build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993

find $U/src/ui -maxdepth 2 -type d
wc -l $U/src/ui/ui.ts $U/src/ui/text.ts $U/src/ui/ui-theme.ts
grep -n 'export class\|processInput\|setCursor' $U/src/ui/ui.ts
grep -rn '\.on("pointerdown"' $U/src/ui --include=*.ts
```

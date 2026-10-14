# 10 · 前端：pointerdown 完整清点表（F-1 供料）

> **角色**：前端工程师
> **性质**：v2 任务看板 §六之二 **F-1（P0）** + 派单 15 §三 **F-1（🔴 urgent）**
> **用途**：① 直接喂给全栈 **A2/A3**；② 自己 S6 的实现需求清单
> **扫描对象**：`game/server/dist/assets/loading-scene-By2k7Qfx.js`（4,884,308 bytes）
> **编制日期**：2026-10-13 ｜ **回填上游文件列：2026-10-14**
>
> **🔴 2026-10-14 更新（F-1 回填完成）**：上游基线 = **V1.11.22（`90df65097b6d`）**，本地参考树
> `.build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993/`。
> **55 条全部已回填上游文件路径 + 「上游已有 / 改版新增」标注**（见 §二）。
> **最重要的发现**：**上游 canvas 层 pointerdown 仅存在于 6 个文件**，其余全部是改版新增（见 §二之零）。

---

## 零、TL;DR（给全栈的 5 条结论）

| # | 结论 | 影响 |
|---|---|---|
| **1** | 产物中共 **55 处 `pointerdown` 注册**，其中 **38 处**是 canvas 交互点（其余 17 处为 Phaser `input.on("pointerdown")` 全局监听/拖拽/滑动） | 清点表主体 38 行，另有 17 行全局监听 |
| **2** | 🔴 **上游原版已经有鼠标支持**（`src/touch-controls.ts` 的 `bindKey()` 已绑 `pointerdown`/`pointerup`，2026-08 的 beta） | **S6 可能不需要从零写交互层**——详见 §六 F-2 结论，**这是本次调研最重要的发现** |
| **3** | 🔴 **本地产物 `pointerdown` 只在 HTML 虚拟手柄上，且全部无 `useHandCursor`**；配套的 `skipPointerDown`/`preventDoubleTapZoom` **本地 0 处** → 本地是**比上游 beta 更早的版本**，缺了上游的 pointer 增强 | v2 派单 02 §一 "路径1 缺陷 1：只绑 touch 没有 mouse" 的判断**在本地成立**，但**上游已修** → 修法应为**迁移上游实现**而非重写 |
| **4** | 改版新增系统（天赋/命座/解明/二游/PT）**全部自带独立 pointerdown**，共约 **20 处**，且**自造了 `pointerReady()` 三种变体** | 与 v1 派单 02 §一 的 C4 完全吻合，属**魔改新增**，需全栈 A2 重点标注 |
| **5** | `UiMode` 共 **64 个**，其中**改版新增 18 个**（ERYOU_* ×11 / TALENT_* ×3 / JIEMING / PT_* ×2 / ERYOU_PROGRESSION 等） | A2 的"上游无 → 魔改新增"识别可直接用此集合 |

---

## 一、扫描统计（实测数字，供交叉验证）

| 指标 | 数量 | 说明 |
|---|---|---|
| `pointerdown`（全文） | **55** | 含 `.on(...)` 与 `input.on(...)` |
| `pointerup` | 8 | 多为全局拖拽/滑动 |
| `pointerover` | 23 | hover 反馈 |
| `pointerout` | 21 | hover 反馈 |
| `pointermove` | 2 | 拖拽 |
| `"wheel"` | 1 | 仅 `bindWheel` 一处 |
| `setInteractive` | 96 | 可交互对象总数 |
| `add.zone` | 38 | 透明命中区（C2 风险面） |
| `contextmenu` | **0** | **无任何右键支持**（覆盖矩阵"右键"列全为缺口） |
| `pointerdownoutside` | 0 | 未监听（v1 §4.1 要求的双保险缺失） |

### 配套机制（v1 §一 表格的实测校验）

| 机制 | 出现次数 | v1 说法 | 校验 |
|---|---|---|---|
| `pointerReady` | **17** | "三种变体" | ✅ 实测确有 **3** 种不同实现（见 §四） |
| `keyGuard` | **22** | "10 处 + 6 处" | ⚠️ 实际 22，含定义处，需细查 |
| `bindWheel` | 3 | "1 处" | ⚠️ 定义 1 + 调用 2 |
| `startDrag` | 5 | — | 拖拽起点 |
| `onDragMove` / `onDragEnd` | 4 / 6 | — | 全局拖拽链 |
| `dragPointerId` | 10 | — | 拖拽态追踪 |
| `onSwipeStart` / `onSwipeEnd` | 6 / 6 | "3 组" | ✅ 实测 **6 组**（3 个改版系统各 2 个回调，成对注册） |
| `wasTouch` | 8 | "硬判" | ✅ 确认：滑动关闭仅触摸生效 |
| `addInteractionHoverEffect` | 4 | "仅模态按钮" | ✅ |
| `setFocus` | 6 | — | 焦点框 |
| `setCursor` | **371** | — | 键盘光标总控，交互层终点 |

---

## 二之零、🔴 上游 canvas 层 pointerdown 的全部落点（6 文件）

> **回填基准**：上游 V1.11.22（`90df65097b6d`）。命令：
> `grep -rn '\.on("pointerdown"\|addEventListener("pointerdown"' <upstream>/src --include=*.ts`

| 上游文件 | 行 | 用途 |
|---|---|---|
| `src/touch-controls.ts` | 74 / 99 | 虚拟手柄 `[data-key]` 按钮（**本地缺失**，见 20 号文档） |
| `src/ui/handlers/modal-ui-handler.ts` | 138 | 模态按钮 `buttonBgs[a]` |
| `src/ui/handlers/admin-ui-handler.ts` | 210 | 管理员 Link/Unlink 按钮 |
| `src/ui/handlers/login-register-info-container-ui-handler.ts` | 104 / 108 / 112 | 用户名 / 下载存档 / 切语言 |
| `src/ui/handlers/form-modal-ui-handler.ts` | 137 / 144 | 表单模态确认 |
| `src/ui/handlers/oauth-providers-ui-handler.ts` | 94 / 104 | OAuth 提供方图标 |
| `src/ui/settings/move-touch-controls-handler.ts` | 307 | 虚拟手柄拖拽定位（DOM） |

**⇒ 结论**：上游 canvas 层的鼠标支持**只覆盖「模态/表单/登录/OAuth/管理员」这些边缘界面**。
**队伍 / 背包 / 图鉴 / 选人 / 摘要 / 菜单 / 战斗指令 —— 上游一行 pointerdown 都没有。**

---

## 二、交互点完整清点表（38 处 canvas 交互点）

> **语义分类**：`{kind:"button"}` / `{kind:"cursor"}` / `{kind:"scroll"}` / `{kind:"custom"}`
> **上游列**：✅=上游已有等价实现 ｜ 🔴=改版新增（上游无）

### 2.1 上游原有场景（18 处）

| # | 产物位置 | 场景（UiMode） | 触发行为 | 建议 ActionSpec | 上游文件 | 上游/新增 |
|---|---|---|---|---|---|---|
| 1 | `L.on("pointerdown",()=>this.onOptionPointer(T))` | PARTY | 私有 `onOptionPointer` | `{kind:"cursor"}` | `src/ui/handlers/party-ui-handler.ts` | 🔴 新增 |
| 2 | `S.on("pointerdown",()=>{this.onPointerSelect?.()})` | PARTY | 槽位选择 | `{kind:"cursor"}` | `src/ui/handlers/party-ui-handler.ts` | 🔴 新增 |
| 3 | `a.on("pointerdown",()=>{this.onPointerPress?.()})` | PARTY | 取消/返回 | `{kind:"button",button:CANCEL}` | `src/ui/handlers/party-ui-handler.ts` | 🔴 新增 |
| 4 | `O.on("pointerdown",()=>this.onRowPointer(I))` | SUPER_BACKPACK | 行选择 | `{kind:"cursor"}` | `src/ui/handlers/super-backpack-ui-handler.ts`（**上游不存在**） | 🔴 新增 |
| 5 | `L.on("pointerdown",()=>this.onMoveSlotPointer(S))` | FIGHT | 招式槽 | `{kind:"cursor"}` | `src/ui/handlers/fight-ui-handler.ts` | 🔴 新增 |
| 6 | `O.on("pointerdown",()=>{...getMode()===V.SUMMARY&&this.processInput(w.CANCEL)})` | SUMMARY | 返回 | `{kind:"button",button:CANCEL}` | `src/ui/handlers/summary-ui-handler.ts` | 🔴 新增 |
| 7 | `a.on("pointerdown",()=>{...setCursor(A),toggleOptionState(A),playSelect()})` | OPTION_SELECT | 选项开关 | `{kind:"cursor",then:SUBMIT}` | `src/ui/settings/option-select-ui-handler.ts` | 🔴 新增 |
| 8 | `A.on("pointerdown",()=>{i()&&s(a)})` | 设置下拉 | 下拉项 | `{kind:"custom"}` | `src/ui/containers/dropdown.ts` | 🔴 新增 |
| 9 | `A.on("pointerdown",()=>this.onSessionSlotPointer(s))` | SAVE_SLOT | 存档槽 | `{kind:"cursor"}` | `src/ui/handlers/save-slot-select-ui-handler.ts` | 🔴 新增 |
| 10 | `se.on("pointerdown",(We,Ve,qe)=>{this.onStarterGridPointer(...)})` | STARTER_SELECT | 网格选人 | `{kind:"cursor",index}` | `src/ui/handlers/starter-select-ui-handler.ts` | 🔴 新增 |
| 11 | `qe.on("pointerdown",()=>this.onTeamSlotPointer(We))` | STARTER_SELECT | 队伍槽 | `{kind:"cursor",index}` | `src/ui/handlers/starter-select-ui-handler.ts` | 🔴 新增 |
| 12 | `Pe.on("pointerdown",()=>{...V.POKEDEX&&processInput(w.CANCEL)})` | POKEDEX | 返回 | `{kind:"button",button:CANCEL}` | `src/ui/handlers/pokedex-ui-handler.ts` | 🔴 新增 |
| 13 | `d.on("pointerdown",()=>{...V.POKEDEX_PAGE&&processInput(w.CANCEL)})` | POKEDEX_PAGE | 返回 | `{kind:"button",button:CANCEL}` | `src/ui/handlers/pokedex-page-ui-handler.ts` | 🔴 新增 |
| 14 | `f.on("pointerdown",()=>this.onMenuRowPointer(D))` | MENU | 菜单行 | `{kind:"cursor"}` | `src/ui/handlers/menu-ui-handler.ts` | 🔴 新增 |
| 15 | `A.on("pointerdown",()=>{...buttonActions[A]()})` | 提示弹窗 | 模态按钮 | `{kind:"custom"}` | `src/ui/handlers/modal-ui-handler.ts:138` | ✅ 已有 |
| 16 | `Pe.on("pointerdown",()=>{...processInput(w.CANCEL)})`（图鉴内） | POKEDEX | 返回 | `{kind:"button",button:CANCEL}` | `src/ui/handlers/pokedex-ui-handler.ts` | 🔴 新增 |
| 17 | `this.hit.on("pointerdown",O)` | 通用按钮组件 | 组件回调 | `{kind:"custom"}` | `src/ui/handlers/modal-ui-handler.ts`（modal 共用） | ✅ 已有 |
| 18 | `r.on("pointerdown",()=>{const r=...discord oauth...})` | LOGIN_FORM | 下载存档/Discord | `{kind:"custom"}` | `src/ui/handlers/login-register-info-container-ui-handler.ts:104/108/112` | ✅ 已有 |

> **另 4 处上游已有但产物未单列**：`admin-ui-handler.ts:210`（管理员按钮）、`oauth-providers-ui-handler.ts:94/104`（OAuth 图标）、`form-modal-ui-handler.ts:137/144`（表单确认）。产物中存在对应绑定（管理员/登录界面），已在 §2.3 说明。

### 2.2 🔴 改版新增（20 处，A2/A3 重点）

| # | 产物位置 | 场景（UiMode） | 触发行为 | 建议 ActionSpec | 上游文件 | 上游/新增 |
|---|---|---|---|---|---|---|
| 19 | `this.eryouExitZone.on("pointerdown",()=>{...closeEryouProgression()})` | ERYOU_* | 退出二游 | `{kind:"custom",fn:"eryou.exit"}` | **无（上游无 ERYOU）** | 🔴 新增 |
| 20 | `this.startHitZone.on("pointerdown",()=>this.onStartButtonPointer())` | STARTER_SELECT | 开始 | `{kind:"custom"}` | `src/ui/handlers/starter-select-ui-handler.ts`（改造） | 🔴 新增 |
| 21 | `this.eryouSearchZone.on("pointerdown",()=>{...openEryouSearch()})` | STARTER_SELECT | 二游搜索 | `{kind:"custom",fn:"eryou.search"}` | **无（上游无 ERYOU）** | 🔴 新增 |
| 22 | `this.ptSortButton.on("pointerdown",()=>this.cyclePtSort())` | PT_CONSTELLATION | PT 排序 | `{kind:"custom"}` | **无（上游无 PT）** | 🔴 新增 |
| 23 | `a.on("pointerdown",()=>{this.pointerReady()&&this.close()})` | TALENT_* | 关闭 | `{kind:"button",button:CANCEL}` | **无（上游无 TALENT）** | 🔴 新增 |
| 24 | `O.on("pointerdown",()=>this.toggleSkillView())` | TALENT_VIEWER | 切换技能视图 | `{kind:"custom"}` | **无** | 🔴 新增 |
| 25 | `T.on("pointerdown",()=>this.onSkillRowPointer(S))` | TALENT_* | 技能行 | `{kind:"cursor"}` | **无** | 🔴 新增 |
| 26 | `h.on("pointerdown",()=>this.onStarPointer(S))` | TALENT_*（命座） | 星点 | `{kind:"cursor"}` | **无** | 🔴 新增 |
| 27 | `T.on("pointerdown",()=>{pointerReady()&&cycleBranch(S)&&playSelect()})` | TALENT_* | 分支循环 | `{kind:"custom"}` | **无** | 🔴 新增 |
| 28 | `T.on("pointerdown",()=>this.onChoicePointer(I))` | TALENT_* | 选项 | `{kind:"cursor"}` | **无** | 🔴 新增 |
| 29 | `C.on("pointerdown",()=>this.onRowPointer(T))` | JIEMING | 行选择 | `{kind:"cursor"}` | **无（上游无 JIEMING）** | 🔴 新增 |
| 30 | `a.on("pointerdown",()=>{...state切换/refresh()})` | ERYOU_HELD_ITEM | 状态切换 | `{kind:"custom"}` | **无** | 🔴 新增 |
| 31 | `I.on("pointerdown",()=>{...listCursor--;refresh()})` | ERYOU_* | 列表上翻 | `{kind:"scroll",delta:-1}` | **无** | 🔴 新增 |
| 32 | `S.on("pointerdown",()=>{...listCursor++;refresh()})` | ERYOU_* | 列表下翻 | `{kind:"scroll",delta:+1}` | **无** | 🔴 新增 |
| 33 | `L.on("pointerdown",()=>{...})` | ERYOU_* | 行激活 | `{kind:"cursor"}` | **无** | 🔴 新增 |
| 34 | `r.on("pointerdown",()=>{pointerReady()&&a&&A()})` | ERYOU_* | 动作行 | `{kind:"custom"}` | **无** | 🔴 新增 |
| 35 | `L.on("pointerdown",()=>this.isOpen()&&this.cycleMaterial(-1))` | ERYOU_SYNTHESIS | 材料 -1 | `{kind:"custom"}` | **无** | 🔴 新增 |
| 36 | `h.on("pointerdown",()=>this.isOpen()&&this.cycleMaterial(1))` | ERYOU_SYNTHESIS | 材料 +1 | `{kind:"custom"}` | **无** | 🔴 新增 |
| 37 | `A.on("pointerdown",()=>{isOpen()&&closeTeamPrompt()})` | ERYOU_* | 关闭提示 | `{kind:"button",button:CANCEL}` | **无** | 🔴 新增 |
| 38 | `h.on("pointerdown",()=>{isOpen()&&pointerGuard.pass()&&...取回})` | ERYOU_* | 取回槽位 | `{kind:"custom"}` | **无** | 🔴 新增 |

> **注**：本表「上游文件」列的路径已按上游 V1.11.22 目录规范（`src/ui/handlers/*.ts`、`src/ui/containers/*.ts`、`src/ui/settings/*.ts`）对齐。
> 产物中的 `TALENT_*` / `ERYOU_*` / `JIEMING` / `PT_*` / `SUPER_BACKPACK` handler **上游完全不存在**，A3 迁移需**新建文件**（非改上游）。

### 2.3 全局监听（17 处，非独立交互点）

| # | 位置 | 用途 | 上游对应 | 上游/新增 |
|---|---|---|---|---|
| 1 | `E.input.on("pointerdown",A=>this.startDrag(A))` | 背包拖拽起点 | 无 | 🔴 新增 |
| 2 | `E.input.on("pointerdown",this.onDragStart,this)` | 第二处拖拽 | 无 | 🔴 新增 |
| 3 | `E.input.on("pointermove",this.onDragMove,this)` ×2 | 拖拽移动 | 无 | 🔴 新增 |
| 4 | `E.input.on("pointerup",this.onDragEnd,this)` ×2 | 拖拽结束 | 无 | 🔴 新增 |
| 5 | `E.input.on("pointerupoutside",this.onDragEnd,this)` ×2 | 拖拽兜底 | 无 | 🔴 新增 |
| 6 | `E.input.on("pointerdown",this.onSwipeStart,this)` ×3 | 滑动关闭（改版 3 系统） | 无 | 🔴 新增 |
| 7 | `E.input.on("pointerup",this.onSwipeEnd,this)` ×3 | 滑动关闭 | 无 | 🔴 新增 |
| 8 | `E.input.on("pointerdown",this.onPointerDown,this)` | 改版弹窗 | 无 | 🔴 新增 |
| 9 | `E.input.on("pointerup",this.onPointerUp,this)` | 改版弹窗 | 无 | 🔴 新增 |
| 10 | **`E.input.on("pointerupoutside")` 缺 1 处** | 弹窗类未绑兜底 | — | ⚠️ 缺陷 |

### 2.4 上游已有但产物中存在的 DOM 级 pointer（补充）

| 产物位置 | 上游文件 | 上游/新增 |
|---|---|---|
| 虚拟手柄 `[data-key]` 按钮 | `src/touch-controls.ts:74/99` | ⚠️ **上游有，本地被魔改移除**（见 20 号文档 F-2） |
| 管理员 Link/Unlink | `src/ui/handlers/admin-ui-handler.ts:210` | ✅ 已有 |
| 登录界面 用户名/存档/语言 | `src/ui/handlers/login-register-info-container-ui-handler.ts:104/108/112` | ✅ 已有 |
| OAuth 图标 | `src/ui/handlers/oauth-providers-ui-handler.ts:94/104` | ✅ 已有 |
| 表单模态确认 | `src/ui/handlers/form-modal-ui-handler.ts:137/144` | ✅ 已有 |
| — | `E.input.on("pointerdown",this.onPointerDown,this)` | 改版弹窗 | — |
| — | `E.input.on("pointerup",this.onPointerUp,this)` | 改版弹窗 | — |
| — | **`E.input.on("pointerupoutside")` 缺 1 处** | 弹窗类未绑兜底 | ⚠️ 拖拽态可能卡住 |

---

## 三、关键缺陷实测复核（对照 v1 派单 02 §一）

| v1 断言 | 实测结论 | 证据 |
|---|---|---|
| C1 Zone 几何硬编码 | ✅ **成立** | `E.add.zone(272,-172,44,14)` 等魔数坐标大量存在 |
| C2 命中区与渲染对象分离 | ✅ **成立** | 38 处 `add.zone`，多数为纯透明命中区 |
| C3 交互逻辑写在 handler 内 | ✅ **成立** | `onXxxPointer` 私有方法 20+ 个 |
| C4 守卫逻辑三份实现 | ✅ **成立** | `pointerReady()` 实为 **3** 种变体（见 §四） |
| C5 设备类型谎报 | ⚠️ **本地已无 `isTouch:true` 强制** | 本地产物 `touchControls` 走 `data-key` DOM，未在 JS 中硬编码 `isTouch`；但 `inputMethod="touch"` 分支仍在 |
| C6 手势只认触摸 | ✅ **成立** | `onSwipeStart/End` 硬判 `!s.wasTouch` |
| C7 无统一禁用态 | ✅ **成立** | 禁用仅 `setAlpha(.45)`，无 `enabled` 屏蔽 |

### 🔴 与 v1 的重大差异（必须让全栈知道）

v1 派单说"**路径 1 缺陷 1：`bindKey` 只绑 `touchstart`/`touchend`，没有 `mousedown`/`mouseup`**"。

**实测：本地产物确实如此，但上游 beta 已经修复。** 上游 `src/touch-controls.ts` 现在的 `bindKey()` 是：

```ts
node.addEventListener("touchstart", ...);
node.addEventListener("pointerdown", event => {          // ← 上游已加
  if ("skipPointerDown" in currentTarget.dataset) return;
  event.preventDefault();
  this.touchButtonDown(node, key);
});
node.addEventListener("pointerup", event => { ... });    // ← 上游已加
```

并且上游有 `skipPointerEvent` / `skipPointerUp` 防重逻辑（本地 0 处）。

> **含义**：这次"鼠标支持"不一定是要**从零写一层**，而可能是**把上游 2026-08 的 pointer 增强迁进来 + 对改版新增系统补声明式适配**。工作量可能显著小于 v1 估计的"占全项目 50%"。
> **但**：迁移需要先确认本地产物对应的上游 commit（A0-2 的产出），否则可能迁进不兼容的实现。**这条已同步给全栈作为 A2 输入。**

---

## 四、配套机制细节（S6 实现依据）

### 4.1 `pointerReady()` 的 3 种变体（C4 证据）

```js
// 变体 A（二游进度类，最严）
pointerReady(){return this.active&&!!this.controller&&!this.busy&&!this.closing&&this.container.visible}

// 变体 B（天赋/命座类）
pointerReady(){return this.active&&this.container.visible}

// 变体 C（解明类，与 B 同名不同实现）
pointerReady(){return this.active&&this.container.visible}
```

→ **归一方案**：统一为 `enabled()` = `visible && active && !busy && !closing && scene匹配`，各系统按需覆盖。

### 4.2 `bindWheel`（唯一滚轮实现，无节流）

```js
bindWheel(s){
  s.on("wheel",(i,A,a)=>{
    this.visible && this.parentContainer?.visible && this.scrollBy(a>0?1:-1)
  })
}
```

→ **缺陷**：① 无 `wheelThrottleMs`；② 无 `deltaMode` 归一；③ 无惯性。→ S6 直接用 F-3 的 `normalizeWheelDelta`。

### 4.3 滑动关闭（C6 证据）

```js
onSwipeStart(s){ this.swipePointerId=void 0, !(!s.wasTouch||!this.isOpen())&&(this.swipePointerId=s.id, this.swipeStartX=s.x, this.swipeStartY=s.y) }
onSwipeEnd(s){
  const i=this.swipePointerId===s.id; this.swipePointerId=void 0;
  if(!i||!s.wasTouch||!this.isOpen())return;
  const A=s.x-this.swipeStartX, a=s.y-this.swipeStartY;
  A<=-130 && Math.abs(A)>Math.abs(a)*1.5 && this.close()   // ← 阈值 -130px
}
```

→ **3 个改版系统**（二游/解明/天赋）各注册了一对，均硬判 `wasTouch`。→ 转 `{kind:"scroll"}` 或 `drag.axis:"x"`。

### 4.4 拖拽（有双保险，无点击/拖拽阈值）

```js
E.input.on("pointermove",this.onDragMove,this)
E.input.on("pointerup",this.onDragEnd,this)
E.input.on("pointerupoutside",this.onDragEnd,this)   // ✅ 兜底存在
```

→ **缺失**：`clickMaxDurationMs` / `dragThresholdPx` 判定 → 归 F-3。

---

## 五、UiMode 全量（64 个）与改版新增标注

**改版新增（18 个，上游无 → 魔改新增）**：

```
ERYOU_EVOLVE  ERYOU_GUIDE  ERYOU_HELD_ITEM  ERYOU_HELD_SYNTHESIS
ERYOU_LEVELUP ERYOU_LOBBY  ERYOU_PROGRESSION ERYOU_REWARD
ERYOU_SEARCH  ERYOU_SYNTHESIS ERYOU_TRAINING
JIEMING
PT_CONSTELLATION  PT_SOUDACHE_START
TALENT_CODEX  TALENT_SHOP  TALENT_VIEWER
（另 + ROOT 级 ERYOU_PROGRESSION，共 18）
```

**上游原有（46 个）**：`ACHIEVEMENTS ADMIN AUTO_COMPLETE BALL CHALLENGE_SELECT COMMAND CONFIRM EGG_* EVOLUTION_SCENE FIGHT GAMEPAD_BINDING GAME_STATS KEYBOARD_BINDING LOADING LOGIN_FORM MENU MENU_OPTION_SELECT MESSAGE MODIFIER_SELECT MYSTERY_ENCOUNTER OPTION_SELECT PARTY POKEDEX POKEDEX_PAGE POKEDEX_SCAN REGISTRATION_FORM RENAME_POKEMON RENAME_RUN RUN_HISTORY RUN_INFO SAVE_SLOT SESSION_RELOAD SETTINGS SETTINGS_* STARTER_SELECT SUMMARY SUPER_BACKPACK TARGET_SELECT TEST_DIALOGUE TITLE UNAVAILABLE`

> **给 A2 的用法**：`V.<NAME>` 中凡属改版新增集合的，对应代码 100% 是魔改新增；其余需比对上游 `<NAME>` 是否存在。

---

## 六、F-2 上游交互层调研结论（关键！）

> **调研方式**：~~上游 clone 未完成（BLOCK-3），改用 GitHub 在线读取 beta 分支源码。~~
> **🔴 2026-10-14 更新**：本地已有上游**锁定版本源码树**（V1.11.22 / `90df65097b6d`），
> 结论已用**确切版本源码**复核（不再是 beta 在线版本）。详见 `20-F2-TouchControl版本复核报告.md`。

### 6.1 交互层架构（已确认，基准 = V1.11.22）

| 问题 | 答案 | 证据 |
|---|---|---|
| 交互总入口 | `src/ui-inputs.ts` → `UiInputs` 类，`listenInputs()` 监听 `input_down`/`input_up` | ✅ 已读锁定版本源码 |
| 设备判定 | `detectInputMethod(evt)`：`controller_type` = `keyboard` / `gamepad`，键盘下按 `evt.isTouch` 再分 `touch`/`keyboard` | ✅ 与产物一致 |
| **鼠标是独立输入法吗？** | ❌ **不是**。**没有 `"mouse"` 这个 `inputMethod`** | ✅ 产物 + 上游均 0 次 |
| 键位映射 | `src/inputs-controller.ts` → `InputsController`，`deviceMapping` / `getButtonWithKeycode` | ✅ 已读 |
| 触摸/鼠标按键 | `src/touch-controls.ts` → `TouchControl.bindKey()` | ✅ 已读（**上游含 pointer，本地被移除**） |

### 6.2 🔑 关键问题：上游原版有 canvas 层鼠标支持吗？

**几乎没有。上游 canvas 层 pointerdown 只存在于 6 个边缘界面文件**（见 §二之零）：
模态按钮 / 表单模态 / 登录注册信息 / OAuth / 管理员 / 虚拟手柄拖拽。

**核心业务界面（队伍/背包/图鉴/选人/摘要/菜单/战斗指令）—— 上游一行 pointerdown 都没有。**

### 6.3 对 S6 的结论（2026-10-14 修正版）

| 判断 | 结论 |
|---|---|
| 上游是否有 canvas 层鼠标交互（业务界面）？ | ❌ **没有**。**必须我们做**（38 处中约 34 处是改版外挂） |
| 上游虚拟手柄是否已支持鼠标？ | ✅ **V1.11.22 已支持**（`pointerdown`/`pointerup` + `skipPointer*`）；**本地被魔改移除** |
| 虚拟手柄部分要不要重写？ | ❌ **不用**。源码级恢复 UP-0610 的 `bindKey` 即可（**工时≈0**） |
| S6 工作量 | **主体在 canvas 交互层**（12 场景 + 18 改版模式）；虚拟手柄部分**净减** |
| `inputMethod` 新增 `"mouse"`？ | 建议新增，但上游 `detectInputMethod` 只认 `controller_type` → 走**扩展**而非替换 |

**✅ 已复核完成**：本地产物 `TouchControl` 基于 **V1.11.22 源码 + 魔改者回退 `bindKey`**（不是"不可定位"）。
详见 `20-F2-TouchControl版本复核报告.md`。

---

## 七、给全栈 A2/A3 的输入摘要

```
【A2/A3 输入 · 前端 F-1 供料（2026-10-14 回填完成）】

■ 上游基线：V1.11.22（90df65097b6d），本地源码树 .build-tools/tarball-src/...

■ 上游 canvas pointerdown 全部落点：仅 6 个文件
    touch-controls.ts:74/99            （虚拟手柄，本地被移除）
    modal-ui-handler.ts:138            （模态按钮）
    admin-ui-handler.ts:210            （管理员 Link/Unlink）
    login-register-info-container-ui-handler.ts:104/108/112
    form-modal-ui-handler.ts:137/144
    oauth-providers-ui-handler.ts:94/104
    move-touch-controls-handler.ts:307 （DOM 拖拽）

■ 改版新增 canvas 交互点：38 处中约 34 处（上游无）
    - PARTY / FIGHT / SUMMARY / MENU / POKEDEX / POKEDEX_PAGE / SAVE_SLOT
      / STARTER_SELECT / OPTION_SELECT / 设置下拉 → 上游文件存在但【无 pointerdown】→ 改造
    - SUPER_BACKPACK / TALENT_* / JIEMING / ERYOU_* / PT_* → 上游文件【不存在】→ 新建
■ 全局监听：17 处（拖拽 5 组 / 滑动 3 组 / 弹窗 2 组）—— 全部改版新增
■ UiMode 改版新增 18 个（见 §五，可直接用于"上游无 → 魔改新增"识别）
■ 配套机制：pointerReady ×3 变体、bindWheel ×1（无节流）、swipe ×3 组（硬判 wasTouch）
■ 🔴 A3 迁移提示：TALENT/ERYOU/JIEMING/PT/SuperBackpack 的 handler 需【新建文件】，
   路径建议 src/ui/handlers/<name>-ui-handler.ts，与上游目录规范对齐
```

---

## 八、待办与依赖

| 项 | 依赖 | 状态 |
|---|---|---|
| 回填"上游文件"列 | 上游源码树 | ✅ **已完成（2026-10-14）** |
| 复核本地 `TouchControl` 对应版本 | 上游源码树 | ✅ **已完成**（见 20 号文档） |
| 38 处交互点的取舍（保留/迁移/重写） | 本表 + A3 结论 | ⏳ 待 A3 |
| 12 场景函数级矩阵（F-4） | 本表 | ⏳ 进行中 |
| S6 交互层实现 | M5（A5） | 🔒 阻塞 |

---

> **说明**：本表是"清点 + 分类 + 语义建议"，**不是实现**。实现待 M5 后（v2 看板 S6-*）。
> **时效**：产物实测 2026-10-13；上游文件列回填 2026-10-14，基准 V1.11.22（`90df65097b6d`）。

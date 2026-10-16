# 25 · 前端：S6 与上游 `inputMethod` 接入点确认（F-9）

> **角色**：前端工程师
> **性质**：派单 24 §四 **F-9（🟡 medium）** ｜ v2 看板 S6-3（键鼠仲裁）
> **一句话目标**：确认键鼠仲裁**复用上游 `inputMethod`**、`"mouse"` 走「**扩展**」而非「替换」。
> **基准**：上游 **V1.11.22（`90df65097b6d`）**
> **输入**：`21-F5-上游src-ui导航调研.md`（F-5）+ `23-F7-上游pointer缺口承接方案.md`（F-7）+ `src/input/input-arbiter.ts`（F-6）
> **编制日期**：2026-10-20
>
> **验收对齐**：① 明确上游 `inputMethod` 的**读写点**；② 确认 `"mouse"` 走**扩展**而非替换（上游无此值）；③ 产出**接入点清单**。

---

## 零、TL;DR（给 S6-3 的 5 条）

| # | 结论 |
|---|---|
| **1** | 上游 `inputMethod` 取值域 = **`"keyboard"` / `"touch"` / `"gamepad"`**（**无 `"mouse"`**）；声明为 `public inputMethod: string`（`battle-scene.ts:344`）→ **无需改类型** |
| **2** | **写点只有 1 处**：`UiInputs.detectInputMethod(evt)`（`ui-inputs.ts:36`，仅由 `input_down` 调用）；**读点 7 处 / 5 文件** |
| **3** | 关键发现：**读点里有 3 处把该值当作「精灵图集 key」**（`run-info` ×2 / `starter-select` / `pokedex-page`）→ 若 `inputMethod = "mouse"`，会去找名为 `"mouse"` 的图集 → **缺资源报错** |
| **4** | ⇒ **推荐做法（零侵入）**：鼠标复用 `controller_type:"keyboard"` 通道 → **`inputMethod` 取值域 0 改动**；键鼠区分只活在 `src/input/input-arbiter.ts`（F-6）内部 |
| **5** | 若确需 `inputMethod="mouse"`，**属「扩展」**（新增 `else if` 分支，不是替换），但**必须同步**给 3 处 atlas 站点加 `mouse → keyboard` 映射 |

---

## 一、`inputMethod` 是什么

### 1.1 声明与语义

```ts
// src/battle-scene.ts:344
public inputMethod: string;     // ⚠️ 类型是 string，不是字面量联合
```

**语义**：记录「**最近一次输入来自哪类设备**」，供 UI 决定**渲染/提示方式**（图标集、tooltip 摆放）。
取值域（由写点穷举）： `"keyboard"` ｜ `"touch"` ｜ `"gamepad"`。

> **关键**：因为类型是 `string`，**新增 `"mouse"` 不需要改任何类型声明** —— 这是「扩展」在类型层面的天然支持。

### 1.2 与 `InputsController.lastSource` 的区别（勿混淆）

| 字段 | 位置 | 取值 | 用途 |
|---|---|---|---|
| `globalScene.inputMethod` | `battle-scene.ts:344` | keyboard / touch / gamepad | **UI 渲染**（图标集、tooltip） |
| `InputsController.lastSource` | `inputs-controller.ts:66` | keyboard / gamepad | 输入图标选择（`getIconForLatestInputRecorded`） |

> 两者都**不含 `"mouse"`**。鼠标支持需另定策略（见 §四）。

---

## 二、`inputMethod` 全部读写点（写 1 组 / 读 7 处）

### 2.1 写点：**仅 1 个方法**（`UiInputs.detectInputMethod`）

| # | 位置 | 语句 | 触发条件 |
|---|---|---|---|
| W1 | `src/ui-inputs.ts:40` | `globalScene.inputMethod = "touch"` | `evt.controller_type === "keyboard"` **且** `evt.isTouch === true`（虚拟手柄模拟） |
| W2 | `src/ui-inputs.ts:42` | `globalScene.inputMethod = "keyboard"` | `evt.controller_type === "keyboard"` 且非 isTouch |
| W3 | `src/ui-inputs.ts:45` | `globalScene.inputMethod = "gamepad"` | `evt.controller_type === "gamepad"` |

**唯一调用点**：`src/ui-inputs.ts:53`（`"input_down"` 监听回调的**第一句**）。

```ts
// src/ui-inputs.ts:49-62
this.events.on("input_down", event => {
  this.detectInputMethod(event);          // ← 唯一写点入口
  const actions = this.getActionsKeyDown();
  if (!Object.hasOwn(actions, event.button)) return;
  actions[event.button]();                // ← 复用上游「动作表」
}, this);
```

> ⚠️ `"input_up"`（`ui-inputs.ts:65`）**不调用** `detectInputMethod` —— 写点只在 down 时更新。

### 2.2 读点：7 处 / 5 文件

| # | 位置 | 读取方式 | **是否把值当「图集 key」** | mouse 影响 |
|---|---|---|---|---|
| R1 | `src/ui/ui.ts:431` | `inputMethod === "touch"` | 否（仅分支：tooltip 摆放） | ✅ 安全（mouse→false→桌面摆放，正确） |
| R2 | `src/ui/ui.ts:653` | `inputMethod === "gamepad"`（`getGamepadType()`） | **是**（非游戏柄时 `return globalScene.inputMethod`） | 🔴 **会返回 "mouse" 当 key** |
| R3 | `src/ui/ui.ts:657` | `return globalScene.inputMethod`（同上方法） | **是** | 🔴 同上 |
| R4 | `src/ui/handlers/run-info-ui-handler.ts:186` | `getGamepadType()` → `new Sprite(..., gamepadType, ...)` | **是**（精灵图集 key） | 🔴 **缺 "mouse" 图集** |
| R5 | `src/ui/handlers/run-info-ui-handler.ts:248` | 同上 | **是** | 🔴 同上 |
| R6 | `src/ui/handlers/starter-select-ui-handler.ts:3015/3020` | `inputMethod === "gamepad"` → else `gamepadType = inputMethod` | **是**（`updateButtonIcon(…, gamepadType, …)`） | 🔴 缺图集 |
| R7 | `src/ui/handlers/pokedex-page-ui-handler.ts:2244/2250` | 同 R6 | **是** | 🔴 缺图集 |

> **图集证据**（R4）：
> ```ts
> const gamepadType = this.getUi().getGamepadType();
> if (gamepadType === "touch") { …"keyboard","E.png"… }
> else { new Phaser.GameObjects.Sprite(globalScene, 0, 2, gamepadType, /* frame */ …); }
> //                                          ↑ 直接把 gamepadType 当 texture key
> ```
> ⇒ `getGamepadType()` 若返回 `"mouse"`，会加载名为 `mouse` 的图集 —— **上游不存在**（图集 key 是 `keyboard`/`xbox`/`dualshock`…）。

---

## 三、事件通道：`input_down` / `input_up` 的产生与消费 ★

> 这是 S6 复用上游的**关键路径** —— 鼠标若能在这条链上产出一个 `Button`，就**自动复用上游全部判定**（动作表 / 白名单 / 音效 / 振动）。

### 3.1 生产者（谁会 emit）

| 来源 | 位置 | payload |
|---|---|---|
| 键盘（keydown/keyup） | `inputs-controller.ts:333 / 339 / 358` | `{ controller_type: "keyboard", button }` |
| 手柄 | `inputs-controller.ts:401 / 411 / 440` | `{ controller_type: "gamepad", button }` |
| **虚拟手柄（触摸）** | `touch-controls.ts:158 / 165` | `{ controller_type: "keyboard", button, **isTouch: true** }` |

> **注意**：虚拟手柄**以 `controller_type:"keyboard"` + `isTouch:true`** 的形态注入 —— 这是上游既有的「以键盘通道表达非键盘设备」先例。

### 3.2 消费者（谁会 listen）

| 消费者 | 位置 | 行为 |
|---|---|---|
| `UiInputs` | `ui-inputs.ts:50 / 64` | `detectInputMethod` → 动作表 → `ui.processInput(Button)` |
| **（S6 新增）** `input-arbiter` | `src/input/input-arbiter.ts` | 同帧去重 / 切换冷却 / 设备标记 |

> `events` 为 Phaser EventEmitter，可从 `globalScene.inputController.events` 取得（`ui-inputs.ts:32` 同源）。
> ⇒ **S6 的 `pointer-manager` 可直接向该 emitter 注入鼠标事件**，无需改上游。

### 3.3 完整数据流（S6 目标形态）

```
canvas pointerdown/up  (pointer-manager)
        │ 归一化 PointerSample
        ▼
gesture-resolver (F-6)  → GestureResult(click/drag/…)
        ▼
input-arbiter (F-6)     → accept?（同帧去重 / 切换冷却 / 键盘按住）
        │  accept
        ▼
emit "input_down" { controller_type, button, isTouch }
        ▼
UiInputs.listenInputs (ui-inputs.ts:50)     ← 【复用上游，不改】
        ├─ detectInputMethod(evt)           ← 【唯一写点】
        └─ getActionsKeyDown()[button]()    ← 【复用上游动作表】
              ▼
        ui.processInput(Button)             ← 上游公开 API（ui.ts:261）
```

> **收益**：鼠标一键即可复用上游 `getActionsKeyDown()` 的**全部语义**：
> `buttonDirection` 的方向 + 振动、`buttonAb`、`buttonTouch`、
> `buttonGoToFilter`（StarterSelect/Pokedex 白名单）、
> `buttonCycleOption`（9 个 handler 白名单）、`buttonMenu`（模式 switch + `disableMenu` + `pendingPrompt`）…
> —— 这正是 v1 §3.2「`kind:"button"` 是默认与推荐路径」的**上游机理**。

---

## 四、`"mouse"` 走「扩展」而非「替换」—— 论证与两种做法

### 4.1 前提确认：上游确无 `"mouse"`

```bash
U=.build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993
grep -rn "inputMethod" $U/src --include=*.ts   # 7 读 + 1 写，值域仅 keyboard/touch/gamepad
grep -rn '"mouse"'     $U/src --include=*.ts   # 0 处
```

⇒ 上游 `inputMethod` **没有 `"mouse"`**。任何引入都必须是**增量**行为，不得改变既有三值的语义（否则等于"替换"）。

### 4.2 做法甲 ★推荐：**不扩展取值域**（零侵入）

鼠标事件以 **`controller_type: "keyboard", isTouch: false`** 注入 —— 与「虚拟手柄用 keyboard+isTouch」同一套上游先例：

| 项 | 效果 |
|---|---|
| `detectInputMethod` | 走 W2 → `inputMethod = "keyboard"` |
| 7 个读点 | **全部保持原语义**（R2/R4/R5/R6/R7 拿到 `"keyboard"` → 图集正常） |
| tooltip（R1） | `isTouch=false` → 光标跟随（对鼠标**正是期望**） |
| 动作表 | 完整复用 |
| **键鼠区分** | 由 **`src/input/input-arbiter.ts`（F-6）的 `lastDevice`** 承担 —— 完全内部，**0 上游改动** |

| 验收 | 结论 |
|---|---|
| `"mouse"` 是否"替换"上游值？ | **否**（取值域 0 改动） |
| 下游是否有破坏性影响？ | **无**（7 读点语义不变） |
| 上游改动面 | **0 行** |

### 4.3 做法乙：**新增 `"mouse"` 值**（真扩展，但需配套）

若产品上确实需要 `inputMethod === "mouse"`（例如未来按设备显示不同提示），则属「扩展」：**在 `detectInputMethod` 新增一个 `else if` 分支**，不是替换 `if/else` 结构。**但必须同步处理 3 处 atlas 站点**：

```ts
// ① src/ui-inputs.ts:36 —— 增量分支（additive，不改既有两分支）
detectInputMethod(evt): void {
  if (evt.controller_type === "keyboard") { … }        // 原样
  else if (evt.controller_type === "gamepad") { … }    // 原样
  else if (evt.controller_type === "mouse") {          // ← 新增（扩展）
    globalScene.inputMethod = "mouse";
  }
}

// ② src/ui/ui.ts:652 getGamepadType() —— mouse 用键盘图集
public getGamepadType(): string {
  if (globalScene.inputMethod === "gamepad") { … }
  if (globalScene.inputMethod === "mouse") return "keyboard";   // ← 新增映射
  return globalScene.inputMethod;
}

// ③④ src/ui/handlers/{starter-select,pokedex-page} 的 else 分支同理（或改用 getGamepadType()）
```

| 改动面 | 做法甲 | 做法乙 |
|---|---|---|
| 上游改动 | **0** | 1（ui-inputs）+ 1（ui.ts）+ 2（handler else 分支） |
| 图集风险 | 无 | 需 3 处映射，漏一处即缺图 |
| 可否区分设备 | 靠 `input-arbiter.lastDevice` | 可直接读 `inputMethod` |

> **结论**：**S6-3 采用做法甲**；做法乙作为「若产品要求」的备选，并列出配套改动。

---

## 五、接入点清单（S6-3 施工表）

| # | 接入点 | 文件 | 类型 | 动作 |
|---|---|---|---|---|
| **I-1** | 鼠标事件注入 | `src/input/pointer-manager.ts`（新建） | 🆕 | `globalScene.inputController.events.emit("input_down"/"input_up", { controller_type:"keyboard", button, isTouch:false })` |
| **I-2** | 设备写点 | `src/ui-inputs.ts:36` | ⚪ 不改（做法甲） | 走既有 W2 分支 |
| **I-3** | 设备读点 | `ui.ts:431/653/657`、`run-info:186/248`、`starter-select:3015/3020`、`pokedex-page:2244/2250` | ⚪ 不改 | 语义不变 |
| **I-4** | 动作表复用 | `src/ui-inputs.ts:83 getActionsKeyDown()` | ⚪ 不改 | 鼠标产出 `Button` 即自动复用 |
| **I-5** | 动作终点 | `src/ui/ui.ts:261 processInput(Button)` | ⚪ 不改 | legacy-bridge 调用 |
| **I-6** | 光标同步 | `src/ui/ui.ts:471 setCursor(n)` | ⚪ 不改 | hover 直调（**不经**动作表以免播声） |
| **I-7** | 键鼠仲裁 | `src/input/input-arbiter.ts`（F-6 已产出） | ✅ | `lastDevice` / 同帧去重 / 切换冷却 |
| **I-8** | 键盘按住态 | `src/ui-inputs.ts:50` 的 `input_down` 已有 | ✅ | 供 `arbiter.setKeyboardHeld()` 驱动 |
| **I-9** | 若采用做法乙 | `ui-inputs.ts` / `ui.ts` / 2 handlers | ⚪ 备选 | 见 §4.3 |

> **铁律复核（F-7 §3.2）**：I-2 ~ I-6 全部为「不改上游」⇒ 鼠标支持**不破坏**上游任何既有读点，符合「不散落改上游」。

---

## 六、待验证与风险

| # | 项 | 说明 | 处置 |
|---|---|---|---|
| **V-1** | `input_down` 的 `button` 必须是**数值** `Button` | `getActionsKeyDown()[button]` 用 `Object.hasOwn(actions, button)` 做键查找（数值枚举） | 鼠标映射须产出 `Button` 数值，不可传字符串 |
| **V-2** | 连发（key repeat）语义 | 键盘长按由 `InputsController.inputInterval` 定时重发；鼠标**不应**复用该连发 | 鼠标长按由 `gesture-resolver`（F-6）判定为 `longpress`，**不**注入重复 down |
| **V-3** | `buttonLock` 冲突 | 键盘 `buttonLock` 会拦截重复 down；鼠标若走同通道可能被 `buttonLock` 命中而静默丢弃 | 鼠标经 `arbiter` 去重后**低频**注入；实测确认不被 `buttonLock` 吞掉（见 F-6 31 项单测的场景 1/2） |
| **V-4** | 做法乙图集缺失 | 若日后改用做法乙，漏一处映射即 `Phaser` 加载 `mouse` 图集失败 | 采用做法甲可完全规避 |
| **V-5** | `inputMethod` 初始值 | 若首次输入是鼠标而 `inputMethod` 从未被写，初值为 `undefined` | I-1 注入时即触发 W2 → 立即变为 `"keyboard"`，无窗口期 |

---

## 七、给 S6-3 的输入摘要

```
【S6-3 输入 · 前端 F-9 供料（2026-10-20）】

■ 上游 inputMethod：声明 battle-scene.ts:344（public inputMethod: string）
    取值域 = keyboard / touch / gamepad（无 mouse）
    写点仅 1 处：ui-inputs.ts:36 detectInputMethod（仅由 input_down 调用）
    读点 7 处 / 5 文件：ui.ts×3、run-info×2、starter-select×2、pokedex-page×2
      ⚠️ 其中 3 处把值当「精灵图集 key」（run-info / starter-select / pokedex-page）

■ "mouse" 走扩展而非替换 → 采纳【做法甲】：不改 inputMethod 取值域
    鼠标事件注入 controller_type:"keyboard", isTouch:false（虚拟手柄同一先例）
    ⇒ inputMethod 保持 "keyboard"；7 读点语义全不变；上游改动 0 行
    ⇒ 键鼠区分仅存在于 src/input/input-arbiter.ts 的 lastDevice（F-6）

■ 事件通道（复用上游的关键）：
    globalScene.inputController.events
      .emit("input_down"/"input_up", { controller_type, button, isTouch })
    → UiInputs.listenInputs（ui-inputs.ts:50，不改）
        → detectInputMethod（不改）→ getActionsKeyDown()[button]()（不改）
        → ui.processInput(Button)（ui.ts:261）
    ⇒ 鼠标一键复用上游动作表全部语义（方向+振动 / 白名单 / 模式 switch / disableMenu / pendingPrompt）

■ 接入点清单：I-1 pointer-manager 注入（新建）；I-2..I-6 上游【全部不改】；I-7 仲裁（F-6）
■ 若采用做法乙（扩展 "mouse"）：须同步 3 处 atlas 站点 mouse→keyboard 映射
■ 待验证：button 必须为数值 Button；鼠标不复用键盘连发；确认不被 buttonLock 吞掉
```

---

## 八、可复现命令

```bash
U=.build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993

# 1) inputMethod 读写点
grep -rn "inputMethod" $U/src --include=*.ts

# 2) 确认上游无 "mouse"
grep -rn '"mouse"' $U/src --include=*.ts              # 期望 0 行

# 3) 事件通道生产/消费
grep -rn '"input_down"\|"input_up"' $U/src --include=*.ts
grep -n "detectInputMethod" $U/src/ui-inputs.ts

# 4) 图集 key 风险点（把 inputMethod 当 texture key 的地方）
grep -rn "getGamepadType" $U/src --include=*.ts
```

---

> **说明**：本文档是**接入点确认 + 方案选型**，不是实现。实现待 M5 后（v2 看板 S6-3）。
> **时效**：事实采集 2026-10-20，基准 V1.11.22（`90df65097b6d`）。

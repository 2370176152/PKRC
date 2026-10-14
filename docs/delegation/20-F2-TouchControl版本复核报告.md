# F-2 · 本地 `TouchControl` 上游版本复核报告

> **任务**：派单 15 §三 F-2（原 L-3 / R-9）｜优先级 🟠 high
> **负责人**：前端工程师
> **日期**：2026-10-14
> **一句话结论**：**本地 `TouchControl` 源自上游 `touch-controls.ts` 的一个「无 pointer 绑定」版本，但同文件的 `init()` / `preventElementZoom()` 又与 V1.11.22 完全一致 —— 判定为「魔改者基于 V1.11.22 源码，把 `bindKey` 回退/改成了 touch-only」。S6 工作量按「≤ 上游 V1.11.22 实现 + 改版适配层」估算，而非从零重写。**

---

## 一、复核方法

对比三份实现：

| 代号 | 来源 | 路径 |
|---|---|---|
| **本地** | 现发行产物（压缩） | `game/server/dist/assets/index-D3KKGO7Y.js` |
| **UP-0610** | 上游锁定 commit（V1.11.22 / `90df65097b6d`） | `.build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993/src/touch-controls.ts` |
| **UP-0418** | 上游早期参考树（`f52a566f`） | `.build-tools/anchor-apr18/pokerogue-f52a566f5215e20a0b29ec0202ea4c96dc2b87c5/src/touch-controls.ts` |

**关键**：UP-0610 正是第一阶段锁定的上游版本（`package.json` → `"version": "1.11.22"`），因此它就是「本地应产出的正确基线」。

---

## 二、逐方法对照

| 方法 | 本地产物 | UP-0610 (V1.11.22) | UP-0418 | 判定 |
|---|---|---|---|---|
| `init()` | `preventElementZoom(#dpad)` + `.apad-button` forEach + `[data-key]` → `bindKey` | **完全一致** | 一致 | ✅ **同源** |
| `preventElementZoom(el)` | `touchstart` + `dataset.lastTouchTimeStamp` 双触发抑制 | **完全一致** | 一致 | ✅ **同源** |
| `simulateKeyboardEvent()` | `emit("input_down",{controller_type:"keyboard",button,isTouch:!0})` | 一致 | 一致 | ✅ **同源** |
| `touchButtonDown/Up` | 一致（含 `repeatInputDelayMillis` 连发） | 一致 | 一致 | ✅ **同源** |
| **`bindKey(node,key)`** | **仅 `touchstart` / `touchend`** | **`touchstart` + `pointerdown` + `touchcancel` + `touchend` + `pointerup`** | 同 UP-0610（含 pointer） | 🔴 **不一致（本地缺失 pointer 绑定）** |
| `skipPointerDown` / `skipPointerUp` / `skipPointerEvent` | **0 处** | 有（防重逻辑） | 有 | 🔴 **本地缺失** |

### 证据原文

**本地产物**（`index-D3KKGO7Y.js`）：

```js
bindKey(t,i){
  t.addEventListener("touchstart",n=>{n.preventDefault(),this.touchButtonDown(t,i)}),
  t.addEventListener("touchend",n=>{var y;n.preventDefault(),this.touchButtonUp(t,i,(y=n.target)==null?void 0:y.id)})
}
```

**UP-0610 / V1.11.22**（`src/touch-controls.ts:63-105`）：

```ts
bindKey(node: HTMLElement, key: string) {
  node.addEventListener("touchstart", (event: TouchEvent) => {
    this.touchButtonDown(node, key);
    event.preventDefault();
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.dataset.skipPointerEvent = undefined;   // ← 本地无
    }
  });
  node.addEventListener("pointerdown", event => {                 // ← 本地【完全没有】
    const currentTarget = event.currentTarget;
    if (currentTarget instanceof HTMLElement && "skipPointerDown" in currentTarget.dataset) return;
    event.preventDefault();
    this.touchButtonDown(node, key);
  });
  node.addEventListener("touchcancel", ...);                      // ← 本地无
  node.addEventListener("touchend", (event: TouchEvent) => {
    event.preventDefault();
    this.touchButtonUp(node, key, event.target?.["id"]);
    if (event.currentTarget instanceof HTMLElement && "skipPointerDown" in event.currentTarget.dataset) {
      delete event.currentTarget.dataset.skipPointerEvent;
      event.currentTarget.dataset.skipPointerUp = undefined;
    }
  });
  node.addEventListener("pointerup", event => {                   // ← 本地【完全没有】
    if (event.currentTarget instanceof HTMLElement && "skipPointerUp" in event.currentTarget.dataset) {
      delete event.currentTarget.dataset.skipPointerUp;
      return;
    }
    event.preventDefault();
    this.touchButtonUp(node, key, event.target?.["id"]);
  });
}
```

---

## 三、版本定位结论

### 3.1 为什么不是「上游某个旧版本」

UP-0418（更早的参考树）**也已经**有 `pointerdown` 绑定：

```
$ grep -n 'pointerdown' UP-0418/src/touch-controls.ts
74:    node.addEventListener("pointerdown", event => {
```

⇒ **上游在 04-18 之前就已有 pointer 支持**。因此本地缺失 pointer **不能**用「用了更旧的上游版本」解释。

### 3.2 真正的定位：**源码同源 + 魔改者主动回退**

| 证据 | 含义 |
|---|---|
| `init()` 含 `preventElementZoom(#dpad)` + `.apad-button` —— 这是 **UP-0610 特征**（UP-0418 也有，但二者此段相同） | 本地 `TouchControl` **确实基于 V1.11.22 世代源码构建** |
| `bindKey` 退化为 touch-only，且丢失 `touchcancel` / `skipPointer*` | 🔴 **魔改者在自己的分支里重写/回退了 `bindKey`** |

> **判定**：本地 `TouchControl` = **上游 V1.11.22 基线 + 魔改者对 `bindKey` 的「去 pointer 化」修改**。
>
> 这解释了 v1 派单 02 §一「路径 1 缺陷 1」的现象——**它是魔改引入的回归，不是上游固有问题**。

### 3.3 对 S6 的直接影响（🔴 重要）

**好消息：修复成本极低。**

| 项 | 结论 |
|---|---|
| 需要「从零写虚拟手柄鼠标支持」吗？ | ❌ **不需要**。上游 V1.11.22 的 `bindKey` **原样可复用** |
| S6-6（虚拟手柄常驻规则移除）工作量 | **下降**：源码级只需恢复上游 `bindKey` 的 2 个 `addEventListener` |
| 但仍需自写的部分 | ✅ **canvas 层交互**（队伍/背包/招式……）—— 上游**完全没有**，这是改版外挂的 20 处 + 上游原本没有的鼠标场景 |
| 建议做法 | **推荐**：源码级把 `bindKey` 恢复为 UP-0610 版本（含 `skipPointer*` 防重），而不是新写一套 |
| 最小改动兼容做法 | 若不想动 `TouchControl`，可在 `input/` 层给 `[data-key]` 元素**补绑** `pointerdown`/`pointerup` —— 但会与 `touchstart` 双触发，**必须**自带 `skipPointer` 语义（等于重新实现上游逻辑），**不推荐** |

**S6 工作量修正估计**：

```
原 v1 估计：整个输入层 ≈ 全项目 50%（含虚拟手柄鼠标支持 + canvas 交互层）
修正后：
  虚拟手柄鼠标支持   ≈ 0（复用上游 V1.11.22 bindKey）   ← 净减
  canvas 交互层      ≈ 主体工作量（12 场景 + 18 改版模式）  ← 不变
  → 净效果：S6 总量下降，且风险点（虚拟手柄）几乎归零
```

---

## 四、附带发现（给全栈 A3 / 给 S6）

| # | 发现 | 影响 |
|---|---|---|
| 1 | 产物 `index.html` 有 **19 个 `data-key`** 元素（含 `TRIPLE_PASSIVE`），比上游 V1.11.22 多出 `TRIPLE_PASSIVE` | 改版新增虚拟按键；`TouchControl.init()` 的 `[data-key]` 选择器自动兼容，**无需改代码** |
| 2 | `TRIPLE_PASSIVE` 不在上游 `Button` 枚举内 | ⚠️ `simulateKeyboardEvent()` 开头有 `if (!Object.hasOwn(Button, key)) return false;` → **该按钮点击无效**。需确认是否为已知 bug 或另有绑定通道 |
| 3 | 产物内联 HTML 缺少上游的 `#apadTriplePassive` 之外的 `apadInfo` 等结构差异 | 仅影响虚拟手柄布局，S6-6 一并处理 |
| 4 | 上游 `TouchControl.render()` 有 `if (!hasTouchscreen() \|\| !settings.general.enableTouchControls) return;` | **上游本身就有桌面端隐藏逻辑** → 改版用 CSS `!important` 强显是**多余且有害**的，印证总览 §3.4 的判断 |

---

## 五、结论与建议

1. **本地 `TouchControl` 可定位**（不是「不可定位」）：**基于上游 V1.11.22，魔改者改动了 `bindKey`**。
2. **S6 的虚拟手柄部分不应重写，应在上游实现上做「恢复 + 增强」** —— 这直接呼应第一阶段「源码化优先」的核心收益。
3. **S6 的主要工作量仍在 canvas 交互层**（12 场景 + 18 改版模式），这部分上游零支持。
4. **`TRIPLE_PASSIVE` 疑似无效按钮**，建议列入 S6 开工首项排查（可能是现存 bug）。

---

## 六、附：可复现命令

```bash
U=.build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993

# 1. 确认上游版本
grep '"version"' $U/package.json                       # → 1.11.22

# 2. 看上游 bindKey 的 pointer 绑定
grep -n 'pointerdown\|pointerup\|skipPointer' $U/src/touch-controls.ts

# 3. 确认产物缺失
grep -c 'skipPointerDown' game/server/dist/assets/index-D3KKGO7Y.js   # → 0

# 4. 提取产物 bindKey
grep -o -E 'bindKey\(t,i\)\{[^}]{0,200}' game/server/dist/assets/index-D3KKGO7Y.js
```

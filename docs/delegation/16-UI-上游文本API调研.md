# 16 · UI：上游文本创建 API 调研（U-1）

> **角色**：UI 设计师
> **性质**：派单 15 §四 **U-1（🔴 urgent）**
> **目的**：判定上游**是否已有字号体系** —— 有则复用而非自造 7 级 Token
> **调研对象**：上游 `pokerogue` @ `90df65097b6d`（锚点 commit，v1.11.22）
> **源码位置**：`.build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993/`
> **产出日期**：2026-10-14

---

## 零、TL;DR（结论先行）

| # | 结论 | 对 S7 的影响 |
|---|---|---|
| **1** | 🔴 **上游已有完整的「文本工厂」抽象**：`addTextObject()` / `setTextStyle()` / `addBBCodeTextObject()` / `addTextInputObject()` / `getTextStyleOptions()`，全部在 **`src/ui/text.ts`（700 行）** | **S7 绝不能再造工厂** —— 必须**包装/扩展**上游入口 |
| **2** | 🔴 **上游已有「语义样式」体系**：`TextStyle` 枚举 **56 个值**（`src/enums/text-style.ts`），每个样式携带 `color + fontSize + shadow + padding + fontFamily` | 配色/阴影/字体**全部复用**，禁止自造 |
| **3** | ❌ **上游没有「字号层级 / Token」抽象** —— 字号是 TextStyle 的**附属属性**，且 56 个样式里 **15 个共用 96px 基准** | 7 级 Token 仍需新建，但**只需新增一个维度**，不是新建体系 |
| **4** | ✅✅ **改版 7 级 Token 中 5 个值精确命中上游已有字号**（66/60/54/48/42）| **Token 体系不是凭空造的，是上游既有取值的子集** —— 可信度大幅提升 |
| **5** | ✅ **上游缩放机制已查清**：逻辑画布 **320×180**，物理 **1920×1080**，`scale = 1/6` 恒定作用于所有文本 | 所有字号都是**逻辑像素**，我的 7 级 Token 值无需换算 |
| **6** | 🆕 **上游已有「按语言设字号」先例**：`src/ui/containers/pokemon-info-container.ts` 的 `languageSettings` 表按语言给 `infoContainerTextSize`（en 64 / pt 60 / ja 64 / pl **54**）| **改版的 54px 正是从这里来的**；i18n 时可复用此模式 |

---

## 一、上游文本工厂 API（S7 的唯一起点）

### 1.1 五个导出函数（`src/ui/text.ts`）

| 函数 | 签名 | 用途 |
|---|---|---|
| `addTextObject` | `(x, y, content, style: TextStyle, extraStyleOptions?) → Text` | **主力文本创建** |
| `setTextStyle` | `(obj: Text, style, extraStyleOptions?) → void` | 已存在对象改样式 |
| `addBBCodeTextObject` | `(x, y, content, style, extraStyleOptions?) → BBCodeText` | 富文本（`[color][shadow]` 标签） |
| `addTextInputObject` | `(x, y, w, h, style, extraStyleOptions?) → InputText` | 输入框 |
| `getTextStyleOptions` | `(style, extraStyleOptions?) → {scale, styleOptions, shadowColor, shadowXpos, shadowYpos}` | **样式解析核心** |

**核心机制**（`addTextObject` 源码）：

```ts
export function addTextObject(x, y, content, style: TextStyle, extraStyleOptions?) {
  const { scale, styleOptions, shadowColor, shadowXpos, shadowYpos } = getTextStyleOptions(style, extraStyleOptions);
  const ret = globalScene.add.text(x, y, content, styleOptions).setScale(scale).setShadow(shadowXpos, shadowYpos, shadowColor);
  if (!styleOptions.lineSpacing) { ret.setLineSpacing(scale * 30); }
  return ret;
}
```

**`extraStyleOptions` 是关键**：它通过 `Object.assign(styleOptions, extraStyleOptions)` **覆盖**样式的任何字段 —— **包括 `fontSize`**。

> 🎯 **这就是改版 108 处裸字号的入口**：改版全部通过 `extraStyleOptions.fontSize` 注入裸值。
> **S7 的 Token 化 = 在 `getTextStyleOptions` 里加一个 `level` 维度**，而不是改 108 个调用点。

### 1.2 `getTextStyleOptions` 的字号逻辑（上游内部）

```ts
const scale = 0.1666666667;      // 恒定 1/6（ja 语言为 0.1388888889）
const defaultFontSize = 96;      // 基准字号
let styleOptions = { fontFamily: "emerald", fontSize: 96, color: getTextColor(style, false), padding: { bottom: 6 } };
switch (style) { /* 按样式覆盖 fontSize */ }
```

**上游 fontSize 取值全集**（56 个样式归一后）：

| 逻辑字号 | 样式数 | 代表样式 |
|---|---|---|
| **96px** | 15 | `WINDOW` / `SUMMARY*` / `SETTINGS_*` / `MESSAGE` / `STATS_*` … |
| **72px** | 4 | `BATTLE_INFO` / `MONEY` / `MONEY_WINDOW` / `TOOLTIP_TITLE` / `BGM_BAR` |
| **66px** | 1 | `GROWTH_RATE_TYPE` |
| **64px** | 4 | `TOOLTIP_CONTENT` / `FILTER_BAR_MAIN` / `STATS_HEXAGON` / `MOVE_LABEL`(zh) |
| **62px** | 1 | `EGG_LIST` |
| **60px** | 2 | `STARTER_VALUE_LIMIT` / `SMALLER_WINDOW_ALT` |
| **56px** | 1 | `MOVE_INFO_CONTENT` |
| **54px** | 1 | `MOVE_LABEL`(ja) |
| **52px** | 1 | `TOOLTIP_CONTENT`(ja) |
| **48px** | 4 | `PARTY` / `PARTY_RED` / `INSTRUCTIONS_TEXT` / `MOVE_LABEL`(默认) |
| **45px** | 1 | `battle-flyout`（`setFontSize(45)`） |
| **42px** | 1 | `PARTY_CANCEL_BUTTON`(ja) |

> 另有少量 `setFontSize(N)` 硬编码（11 处）：`arena-flyout` 54/48、`battle-flyout` 45、`egg-gacha` 64/80、`achvs` 动态。

---

## 二、核心答案：上游有无字号体系？

### 2.1 三层判定

| 层 | 上游状态 | 证据 |
|---|---|---|---|
| **① 文本工厂** | ✅ **有，且成熟** | `src/ui/text.ts` 5 个导出函数，700 行 |
| **② 语义样式（颜色/阴影/字体）** | ✅ **有，56 个 TextStyle** | `src/enums/text-style.ts`；`getTextColor()` 统一取色 |
| **③ 字号层级（Token）** | ❌ **无** | 56 个样式里 15 个共用 96px；字号只是样式的附属属性，无独立层级概念 |

### 2.2 判定结论

> **上游有「工厂 + 样式」，无「字号 Token」。**
>
> 改版的 7 级 Token **不能整体复用上游**（上游没有对应物），
> 但 **5/7 个取值精确命中上游既有字号** —— 说明改版作者是**从上游既有取值里挑的**，不是凭空发明。
>
> **S7 的正确姿势**：
> - **不复用**上游的字号（上游没有 Token 层）
> - **不新造工厂**（必须走 `addTextObject`）
> - **新增一个 `TextSizeLevel` 维度**，挂在 `getTextStyleOptions` 的 `extraStyleOptions` 上

---

## 三、核心产出：改版 7 级 Token → 上游 API 映射

### 3.1 字号维度映射（5/7 精确命中）

| Token | 值 | 上游对应字号 | 命中样式 | 判定 |
|---|---|---|---|---|
| `display` | 128 | — | — | ❌ 上游无 |
| `title` | 66 | **66** | `GROWTH_RATE_TYPE` | ✅ **精确命中** |
| `heading` | 60 | **60** | `STARTER_VALUE_LIMIT` / `SMALLER_WINDOW_ALT` | ✅ **精确命中** |
| `body` | 54 | **54** | `MOVE_LABEL`(ja) / `pokemon-info-container`(pl) | ✅ **精确命中** |
| `label` | 48 | **48** | `PARTY` / `PARTY_RED` / `INSTRUCTIONS_TEXT` / `MOVE_LABEL`(默认) | ✅ **精确命中** |
| `caption` | 42 | **42** | `PARTY_CANCEL_BUTTON`(ja) | ✅ **精确命中** |
| `micro` | 36 | — | — | ❌ 上游无（改版 `label()` 默认值） |

> 🔑 **这是本次调研最重要的发现**：7 级 Token 不是设计臆造，**5 个值是上游代码里真实存在的字号**。
> 只有 `display`(128) 和 `micro`(36) 是改版自造 —— 而 `micro` 恰好是改版自建 `label()` 工厂的**默认参数**。

### 3.2 样式维度映射（改版 `F.*` → 上游 `TextStyle`）

改版在产物中用了 30+ 种 `F.*`，**全部能在上游 `TextStyle` 找到对应**（改版只是把上游常量压缩改名）：

| 改版 `F.*` | 上游 `TextStyle` | 上游字号 | 上游前景/阴影色 |
|---|---|---|---|
| `F.WINDOW` (286) | `WINDOW` | 96 | `#f8f8f8` / `#6b5a73` |
| `F.WINDOW_ALT` (43) | `WINDOW_ALT` | 96 | `#484848` / `#d0d0c8` |
| `F.SUMMARY` (40) | `SUMMARY` | 96 | `#f8f8f8` / `#636363` |
| `F.SUMMARY_GOLD` (67) | `SUMMARY_GOLD` | 96 | `#e8e8a8` / `#a0a060` |
| `F.SUMMARY_ALT` (27) | `SUMMARY_ALT` | 96 | `#484848` / `#d0d0c8` |
| `F.SUMMARY_BLUE` (25) | `SUMMARY_BLUE` | 96 | `#40c8f8` / `#006090` |
| `F.SUMMARY_GRAY` (24) | `SUMMARY_GRAY` | 96 | `#a0a0a0` / `#636363` |
| `F.SUMMARY_RED` (16) | `SUMMARY_RED` | 96 | `#e70808` / `#ffbd73` |
| `F.SUMMARY_PINK` (12) | `SUMMARY_PINK` | 96 | `#f89890` / `#984038` |
| `F.SUMMARY_GREEN` (11) | `SUMMARY_GREEN` | 96 | `#78c850` / `#306850` |
| `F.PARTY` (61) | `PARTY` | 48（pkmnems 字体） | `#f8f8f8` / `#707070` |
| `F.PARTY_RED` (11) | `PARTY_RED` | 48（pkmnems） | `#f89890` / `#984038` |
| `F.BATTLE_INFO` (22) | `BATTLE_INFO` | 72 | `#f8f8f8` / `#6b5a73` |
| `F.MONEY` (30) | `MONEY` | 72 | `#e8e8a8` / `#a0a060` |
| `F.MONEY_WINDOW` (9) | `MONEY_WINDOW` | 72 | `#e8e8a8` / `#a0a060` |
| `F.MESSAGE` (13) | `MESSAGE` | 96 | `#f8f8f8` / `#6b5a73` |
| `F.TOOLTIP_CONTENT` (33) | `TOOLTIP_CONTENT` | 64 | `#f8f8f8` / `#6b5a73` |
| `F.TOOLTIP_TITLE` (3) | `TOOLTIP_TITLE` | 72 | `#e70808` / `#ffbd73` |
| `F.SETTINGS_LABEL` (33) | `SETTINGS_LABEL` | 96 | `#f8b050` / `#c07800` |
| `F.SETTINGS_VALUE` (9) | `SETTINGS_VALUE` | 96 | `#f8f8f8` / `#6b5a73` |
| `F.SETTINGS_SELECTED` (11) | `SETTINGS_SELECTED` | 96 | `#f88880` / `#f83018` |
| `F.STATS_LABEL` (4) | `STATS_LABEL` | 96 | `#f8b050` / `#c07800` |
| `F.MOVE_INFO_CONTENT` (12) | `MOVE_INFO_CONTENT` | 56 | `#f8f8f8` / `#6b5a73` |
| `F.SHADOW_TEXT` (11) | `SHADOW_TEXT` | 96 | `#6b5a73` |
| `F.PERFECT_IV` (3) | `PERFECT_IV` | 96 | `#f8b050` / `#c07800` |

> ✅ **结论**：改版**没有自造任何配色**（`F.*` 全部是上游 `TextStyle` 的别名）。
> 我之前在 `visual-spec.md` §3.2 列的 35 种内联 hex，才是真正的自造色。

### 3.3 组件维度（S7-5 复用目标）

| 组件 | 上游位置 | 状态 |
|---|---|---|
| 窗口 `addWindow(x, y, w, h, variant?)` | `src/ui/ui-theme.ts:39`（248 行） | ✅ 可复用 |
| 窗口变体后缀 `getWindowVariantSuffix()` | `src/ui/ui-theme.ts:11` | ✅ |
| 主题覆盖 `addUiThemeOverrides()` | `src/ui/ui-theme.ts:145` | ✅ |
| 光标 `cursorObj`（`add.image(x, y, "cursor")`） | 各 handler 内自建，如 `src/ui/containers/dropdown.ts:332` | ⚠️ **无统一组件**，各 handler 各建各的 |
| 滚动条 | 无统一导出 | ⚠️ 各 handler 自建 |

---

## 四、缩放与坐标系（澄清一个关键误解）

### 4.1 实测确认

| 项 | 值 | 证据 |
|---|---|---|
| 逻辑画布 | **320 × 180** | 产物 `const hs=320, xs=180`（与 `Je` token 对象**同行的常量**） |
| 物理画布 | **1920 × 1080** | 产物 `width:1920, height:1080` |
| 缩放系数 | **`scale = 0.1666666667`（= 1/6）** | 产物 `VE()` 内 `O=.1666666667`；上游 `text.ts:91` |
| ja 语言缩放 | `0.1388888889`（= 1/7.2） | 上游 `text.ts` 特例 |

**坐标换算**：逻辑 1 单位 = 6 物理像素。产物中 `canvas.width/6`、`canvas.height/6` 各出现 65 次，`addWindow` 的 Rectangle 用 `setScale(6)` —— 全部吻合。

### 4.2 对 7 级 Token 的意义

> ✅ **我的 7 级 Token 值（128/66/60/54/48/42/36）全部是「逻辑像素」，与上游 `defaultFontSize = 96` 同一坐标系，无需任何换算。**
>
> 上游默认正文 96 逻辑 px = 16 物理 px；改版 `body` 54 逻辑 px = **9 物理 px**。
> **改版正文字号比上游默认小 44%** —— 这是改版的刻意选择（信息密度更高），**不是 bug**，S7 应保持。

### 4.3 ⚠️ 修正我此前的文档

我在 `docs/visual-spec.md` §一.2 写的「层级比 ≈ 1.11–1.27」是**逻辑像素下的比值**，正确。
但我在 §七写的「`baseWidth:1920 / baseHeight:1080`」应澄清为：**物理画布 1920×1080，逻辑画布 320×180**，`dprAware` 的含义是 DPR 与 6× 缩放的关系，需在 S7-6 实测。

---

## 五、改版已有的自造层（S7 要处理的历史包袱）

### 5.1 改版自造的文本工厂

| 产物符号 | 上游对应 | 签名 | 调用次数 | 说明 |
|---|---|---|---|---|
| `re` | `addTextObject` | `(x,y,content,style,extraStyleOptions)` | **718** | 主力入口 |
| `oE` = `label` | **无上游对应** | `(x, y, text="", fontSize=36, style=WINDOW)` | 15 | 🔴 **改版自造，默认 36px** |
| `vI` | `setTextStyle` | `(obj, style, extraStyleOptions)` | 8 | |
| `lw` | `addTextInputObject` | `(x,y,w,h,style,extraStyleOptions)` | 4 | |
| `lB` = `applyTextStyle` | **无上游对应** | `(obj, style, fontSize)` | 4 | 🔴 ERYOU 专用，存 `eryouBaseScale` |

```js
// 产物实证
function oE(n,s,i="",A=36,a=F.WINDOW){ return re(n,s,i,a,{fontSize:`${A}px`}).setOrigin(0) }
l(oE,"label");
function lB(n,s,i){ vI(n,s,{fontSize:`${i}px`}), n.setColor(Ns(s,!1,E.uiTheme)), n.setData("eryouBaseScale",n.scaleX) }
l(lB,"applyTextStyle");
```

### 5.2 改版的 `Je` Token 对象（局部 Token 未被采用）

```js
// 产物实证：与逻辑画布常量同定义
const hs=320, xs=180, Je={title:66,row:60,body:54,small:48,tiny:42}
```

**`Je` 使用统计**（实测）：

| 键 | 值 | 使用次数 |
|---|---|---|
| `Je.tiny` | 42 | **70** |
| `Je.small` | 48 | 48 |
| `Je.body` | 54 | 24 |
| `Je.title` | 66 | 6 |
| `Je.row` | 60 | **1** |
| **合计** | — | **149** |

> 🔑 **发现**：改版作者**已经造了一个 5 级 Token 对象**（`Je`），用了 149 次，
> 但**仍有 108 处裸值绕过它**。这正是「规范存在但未统一、未强制」的实证。
>
> **S7 的正确做法**：**扩展 `Je` 为 7 级**（补 `display:128` / `micro:36`，`row`→`heading`），
> 而不是新建一套 —— 这样 149 处现有调用**零改动**，只需收敛 108 处裸值。

### 5.3 上游的「按语言设字号」先例（i18n 相关）

`src/ui/containers/pokemon-info-container.ts:26`：

```ts
const languageSettings: { [key: string]: LanguageSetting } = {
  en: { infoContainerTextSize: "64px", infoContainerLabelXPos: -20, infoContainerTextXPos: -17 },
  pt: { infoContainerTextSize: "60px", ... },
  ja: { infoContainerTextSize: "64px", ... },
  pl: { infoContainerTextSize: "54px", ... },   // ← 改版 body token 的来源
};
```

> 🎯 **双重意义**：
> 1. **改版 `body=54` 的来源找到了** —— 是上游 `pl`（波兰语）的设置值，改版作者把它当成了通用正文
> 2. **i18n 时可复用此模式**：不同语言可配不同字号（中日韩字符更复杂，常需调整）

---

## 六、自造方案的最小侵入点（S7-1 落地方案）

### 6.1 推荐方案：在 `getTextStyleOptions` 增加 `level` 维度

**侵入点**：`src/ui/text.ts` 的 `getTextStyleOptions()` 与 `addTextObject()`

```ts
// 新增：src/enums/text-size-level.ts（或并入 text-style.ts）
export const TextSizeLevel = Object.freeze({
  DISPLAY: 128, TITLE: 66, HEADING: 60, BODY: 54, LABEL: 48, CAPTION: 42, MICRO: 36,
});

// text.ts 中扩展 extraStyleOptions 类型
export interface TextStyleOptions {
  level?: keyof typeof TextSizeLevel;   // 新增
  fontSize?: string | number;           // 保留（白名单/动态字号用）
}

// getTextStyleOptions 内，switch 之后、Object.assign 之前：
if (extraStyleOptions?.level) {
  styleOptions.fontSize = `${TextSizeLevel[extraStyleOptions.level]}px`;
}
```

**为什么这样最省**：
- ✅ **不新增工厂** —— 仍走 `addTextObject`
- ✅ **不改 718 处调用** —— `level` 是可选参数
- ✅ **108 处裸值逐个加 `level`** 即可收敛（或反之，把裸值收进白名单）
- ✅ **149 处 `Je.*` 调用零改动** —— 只把 `Je` 的值来源换成 `TextSizeLevel`
- ✅ **动态字号不受影响** —— `setFontSize(变量)` 根本不经过这里

### 6.2 备选方案：包装层（不推荐）

在 `addTextObject` 外再包一层 `createText(scene, x, y, content, {level})`。

**不推荐原因**：会与上游 `addTextObject` **长期并存两套入口**，正是改版现在 108 处裸值的成因。

### 6.3 迁移映射表（S7-2 直接用）

| 野生值 | → `level` | 上游已有同值样式（可交叉验证） |
|---|---|---|
| 128 | `DISPLAY` | — |
| 80 / 76 / 72 / 70 | `TITLE` (66) | `BATTLE_INFO`/`MONEY` = 72 |
| 66 / 65 / 64 | `TITLE` (66) / `HEADING` (60) | `GROWTH_RATE_TYPE` = 66 |
| 60 / 58 | `HEADING` (60) | `STARTER_VALUE_LIMIT`/`SMALLER_WINDOW_ALT` = 60 |
| 56 / 55 / 54 | `BODY` (54) | `MOVE_LABEL`(ja) = 54 |
| 50 / 48 | `LABEL` (48) | `PARTY`/`INSTRUCTIONS_TEXT` = 48 |
| 45 / 44 / 42 | `CAPTION` (42) | `PARTY_CANCEL_BUTTON`(ja) = 42 |
| 40 / 38 / 36 | `MICRO` (36) | — |
| 35 / 34 / 32 / 30 / 26 | `MICRO` (36) | — |
| **0** | 🚫 **白名单** | — |

---

## 七、对既有 UI 文档的修正

| 文档 | 原表述 | 修正 |
|---|---|---|
| `visual-spec.md` §六 | 「`text-factory` 接口契约：`createText(scene, x, y, content, opts)`」 | ⚠️ **改为扩展上游 `addTextObject`**，不新建工厂。新签名见 §6.1 |
| `visual-spec.md` §三.1 | 「改版 `F.*` 全部是上游别名」 | ✅ **已实测证实**（§3.2 映射表） |
| `11-UI设计师-字号映射表.md` §零-2 | 「`setFontSize` 全部落在已有 27 种取值内」 | ✅ 仍成立；且上游也有 11 处 `setFontSize` |
| `visual-spec.md` §七 | 「`baseWidth:1920 / baseHeight:1080`」 | ⚠️ 澄清为「物理 1920×1080 / 逻辑 320×180 / scale 1/6」 |
| `visual-spec.md` §十 Q-1 | 「上游是否已有字号层级体系？待 U-3 回填」 | ✅ **已回答：无 Token 层，有工厂+样式层** |

---

## 八、验收自检（对照派单 15 §9.2 U-1）

| 验收卡点 | 状态 | 证据 |
|---|---|---|
| 上游有无字号/文本工厂抽象的**明确结论** | ✅ | §二：**有工厂+样式，无字号 Token** |
| 若有，产出「上游 API → 7 级 Token」映射 | ✅ | §3.1 字号映射（5/7 精确命中）+ §3.2 样式映射（30+ 种）+ §6.3 迁移映射 |
| 若无，说明自造方案的最小侵入点 | ✅ | §6.1：`getTextStyleOptions` 增加 `level` 维度，零新增工厂 |

---

## 九、给 S7 的 5 条行动建议

1. **不要新建 `text-factory.js`** —— 扩展 `src/ui/text.ts` 的 `getTextStyleOptions`，加 `level` 参数
2. **不要新建 `TextStyle`** —— 改版 30+ 种 `F.*` 全部是上游别名，直接还原为上游常量名
3. **`Je` 对象升级为 7 级，不要另起一套** —— 149 处现有调用零改动
4. **`display`(128) 与 `micro`(36) 是仅有的两个上游无对应值** —— 需在 `TextSizeLevel` 里显式定义
5. **i18n 时考虑上游的 `languageSettings` 模式** —— 中日韩可配不同字号，避免 CJK 文本溢出

---

**UI 设计师**：ui-designer
**产出日期**：2026-10-14
**上游源码**：`.build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993/`
**关联文档**：`11-UI设计师-字号映射表.md` · `13-UI-文案清点表.md` · `docs/visual-spec.md`

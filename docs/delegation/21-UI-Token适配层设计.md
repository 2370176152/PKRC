# 21 · UI：Token → 上游文本 API 适配层设计（U-6）

> **角色**：UI 设计师
> **性质**：派单 24 §五 **U-6（🟠 high）**—— 依赖 U-1（✅）+ U-3（🔒 冻结）
> **目的**：把 7 级字号 / 行高 / 间距三类标度落到**上游文本 API 的适配层设计**，S7-1~S7-5 直接照此施工
> **上游依据**：`16-UI-上游文本API调研.md`（U-1）· `18-UI-视觉契约定稿.md`（U-3 冻结）
> **源码基准**：锚点树 `src/ui/text.ts`（700 行，已逐行核对侵入点）
> **产出日期**：2026-10-16

---

## 零、TL;DR

| # | 结论 |
|---|---|
| **1** | 适配层 = **三条路径**：字号走 `level` 维度（U-3 已冻结）；行高走**新增 `lineHeight` 维度**（本文设计）；间距走 **`Spacing` 常量 + 布局纪律**（不碰文本 API） |
| **2** | 🆕 **单位语义基准表**（§二）：布局单位（320×180）/ 文本单位（fontSize 所在，1 单位 = 1/6 画布像素）/ 画布像素——**三者不可混用**，行距推导公式依赖此表 |
| **3** | 🔴 **R-1 阴影保真修正**：U-3 冻结的 `level` 块会**丢掉上游的阴影比例缩放**（`shadowXpos *= sizeRatio`），需扩展比例计算使其对 `level` 也生效——否则 45→CAPTION 等迁移的阴影偏移会变 |
| **4** | 🔴 **R-2 类型名冲突**：U-3 §3.3 提议的 `TextStyleOptions` 接口名与上游 `@types/ui.ts` 的**返回类型同名**，需改名 `ExtraTextStyleOptions` |
| **5** | 🔴 **R-3 白名单修正**：冻结的 `allowedLineSpacing: [0,2,3,5]` 与产物实测**不符**（改版实际手调值是 `-10/-5/-1/2/9/12`），需扩充；且 **28 = round(80×0.35) 恰好等于 body 行高推导值**，可 Token 化 |
| **6** | ✅ **`Je` 桥接零改动**：149 处 `Je.*` 调用改为值来源指向 `TextSizeLevel`，调用点不动 |
| **7** | ⚠️ **ja 特例交互**：上游 `setTextStyle` 有 `lineSpacing < 12 && ja → +35` 的 bump；token 推导值 ≥12 时不触发，紧凑 token（如 compact@caption=6）在 ja 下会被加 35——多语言时需知 |

---

## 一、适配层总架构

```
                    ┌─────────────────────────────────────────────┐
                    │  theme-config.json（U-3 冻结 · 合法 JSON）    │
                    │  font.levels / font.lineHeight / spacing.*   │
                    └──────────────┬──────────────────────────────┘
                                   │ 构建时常量内联（不运行时读文件）
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌─────────────────┐   ┌──────────────────────┐   ┌──────────────────┐
│ 标度 A：字号     │   │ 标度 B：行高          │   │ 标度 C：间距      │
│ TextSizeLevel   │   │ LineHeightToken      │   │ Spacing          │
│ 7 级（冻结）     │   │ body 1.35 / compact  │   │ xs4/sm8/md12/    │
│                 │   │ 1.15                 │   │ lg16/xl24        │
└────────┬────────┘   └──────────┬───────────┘   └────────┬─────────┘
         │                       │                        │
         ▼                       ▼                        ▼
  extraStyleOptions       extraStyleOptions         布局坐标运算
  .level（U-3 冻结）       .lineHeight（R-2 新增）   addWindow(x+sm,…)
         │                       │                  列表 y 递推
         ▼                       ▼                        │
┌────────────────────────────────────────┐                 │
│ getTextStyleOptions() 侵入块（text.ts） │                 │
│  ① R-1 阴影比例（含 level）             │                 │
│  ② U-3 level → styleOptions.fontSize   │                 │
│  ③ R-2 lineHeight → lineSpacing        │                 │
│  ④ Object.assign（显式值仍可覆盖）       │                 │
└────────────────────────────────────────┘                 │
         │                                                  │
         ▼                                                  ▼
  addTextObject / setTextStyle /              QA 规则：新增界面布局
  addBBCodeTextObject（签名不变）              禁止裸数（0/1 除外）
```

**设计原则**（承 U-3 冻结契约）：
- **不新增工厂函数**——三条路径全部挂在既有入口/常量上（C-1 不被破坏）
- **显式值永远优先**——`fontSize` / `lineSpacing` 显式传入时覆盖 token（白名单/动态场景）
- **单位不混用**——字号/行距在文本单位，间距在布局单位（§二）

---

## 二、单位语义基准表（🔴 施工前必读）

这是全文档最容易出错的地方。锚点树 `text.ts` 实测：`scale = 0.1666666667` 恒定作用于**所有文本对象**。

| 空间 | 所在 | 典型值 | 换算 |
|---|---|---|---|
| **布局单位** | `addWindow(x,y,w,h)` 的坐标、容器 position | 320×180 画布 | 1 布局单位 = **6 画布像素** |
| **文本单位** | `fontSize:"54px"`、`setLineSpacing(12)` | 54 / 96 / 12 | 1 文本单位 = 1/6 画布像素（= 1/36 布局单位） |
| **画布像素** | 实际渲染（物理 1920×1080） | — | — |

**换算实例**：

| 场景 | 计算 | 结果 |
|---|---|---|
| 上游默认正文 96 文本单位 | 96 × 1/6 | **16 画布像素** |
| 改版 `body` 54 文本单位 | 54 × 1/6 | **9 画布像素**（比上游小 44%，刻意的高密度） |
| 上游默认行距 `scale*30` | 5 文本单位 × 1/6 | **0.83 画布像素** |
| 改版手调行距 12 文本单位 | 12 × 1/6 | **2 画布像素** |
| 改版 L422 行距 28 @ 80px | 28 × 1/6 | **4.7 画布像素** |

> ⚠️ **修正 U-1 的术语**：U-1 §四把 `fontSize` 的文本单位称作「逻辑 px」、把 ×1/6 后的结果称作「物理 px」。按本表口径：**fontSize 值 = 文本单位**，×1/6 后 = 画布像素，布局坐标另有一套 320×180 单位。**行距 token 的推导公式（§四）必须用文本单位**，否则会差 6 倍。

---

## 三、标度 A：字号 Token 适配（U-3 冻结契约的落地细节）

### 3.1 冻结内容回顾（不改）

- `TextSizeLevel` 7 级：`DISPLAY 128 / TITLE 66 / HEADING 60 / BODY 54 / LABEL 48 / CAPTION 42 / MICRO 36`（文本单位）
- 侵入块位置：`getTextStyleOptions()` 内、`switch(style)` 之后、`Object.assign` 之前
- 消费侧：`addTextObject(x, y, content, style, { level: TextSizeLevel.BODY })`

### 3.2 🆕 R-1：阴影比例保真修正（需会签）

**问题**：上游 `getTextStyleOptions` 尾部有一段阴影缩放逻辑：

```ts
// 上游源码（text.ts L470-477）
if (extraStyleOptions.fontSize) {
  const sizeRatio =
    Number.parseInt(extraStyleOptions.fontSize.toString().slice(0, -2))
    / Number.parseInt(styleOptions.fontSize?.toString().slice(0, -2) ?? "1");
  shadowXpos *= sizeRatio;
}
```

即：**显式传 `fontSize` 时，阴影横偏移按「显式值 / 样式默认值」比例缩放**（如 BATTLE_INFO 72 → 显式 54，阴影 4→3）。

U-3 冻结的 `level` 块**不触发**这段逻辑（条件只查 `extraStyleOptions.fontSize`）→ 用 `level` 达到同等字号时，阴影保持 4 而显式传值是 3。**视觉有差异**（0.67 vs 0.5 画布像素）。

**修正设计**（把 level 纳入比例计算的分子）：

```ts
// ↓↓↓ R-1 修正块（替换上游原 if 块，位于 switch 之后）↓↓↓
if (extraStyleOptions) {
  const explicitSize = extraStyleOptions.fontSize
    ? Number.parseInt(extraStyleOptions.fontSize.toString())
    : extraStyleOptions.level !== undefined
      ? TextSizeLevel[extraStyleOptions.level]
      : undefined;
  if (explicitSize !== undefined && !Number.isNaN(explicitSize)) {
    const baseSize = Number.parseInt(styleOptions.fontSize?.toString() ?? "1");
    if (baseSize > 0) {
      shadowXpos *= explicitSize / baseSize;
    }
  }
  // U-3 冻结块（位置与内容不变）
  if (extraStyleOptions.level !== undefined) {
    const px = TextSizeLevel[extraStyleOptions.level];
    if (px !== undefined) {
      styleOptions.fontSize = `${px}px`;
    }
  }
  styleOptions = Object.assign(styleOptions, extraStyleOptions);
}
// ↑↑↑ 修正块结束 ↑↑↑
```

**行为矩阵**：

| 传入 | fontSize | 阴影横偏移 | 说明 |
|---|---|---|---|
| 无 extra | 样式默认（如 72） | 4（不变） | 上游原行为 |
| `{fontSize:"54px"}` | 54 | 4×54/72=**3** | 上游原行为 |
| `{level: BODY}` | 54 | 4×54/72=**3** | ✅ R-1 后与显式传值一致 |
| `{level: BODY, fontSize:"60px"}` | 60（显式优先） | 4×54/72=3 | 分子取 level（先算后覆盖），可接受 |

> 注：上游只缩放 `shadowXpos` 不缩放 `shadowYpos`（上游既有不对称行为）——**保持原样，不"修复"**，避免视觉漂移。

### 3.3 🆕 R-2 前置修正：接口改名（需会签）

U-3 §3.3 提议新增 `TextStyleOptions` 接口承载 `level`/`fontSize`——但该名字**已被上游 `src/@types/ui.ts` 占用**（`getTextStyleOptions` 的返回类型：`{scale, styleOptions, shadowColor, shadowXpos, shadowYpos}`）。同名声明会冲突。

**修正**：新增接口改名 `ExtraTextStyleOptions`，并作为 5 个文本函数的参数类型：

```ts
// src/@types/ui.ts 新增（不改动既有 TextStyleOptions）
export interface ExtraTextStyleOptions
  extends Omit<Phaser.Types.GameObjects.Text.TextStyle, "fontSize" | "lineSpacing"> {
  /** 字号层级 Token。设置后覆盖 TextStyle 自带 fontSize（U-3 冻结） */
  level?: TextSizeLevel;
  /** 行高 Token。设置后按 §四公式推导 lineSpacing（R-2 新增） */
  lineHeight?: LineHeightToken;
  /** 显式字号（文本单位）。优先级高于 level，用于白名单与动态字号 */
  fontSize?: string | number;
  /** 显式行距（文本单位）。优先级高于 lineHeight */
  lineSpacing?: number;
}
```

---

## 四、标度 B：行高 Token 适配（🆕 本文新设计）

### 4.1 上游机制实测（三个来源）

| 来源 | 行为 | 位置 |
|---|---|---|
| 创建时默认 | `if (!styleOptions.lineSpacing) ret.setLineSpacing(scale * 30)` → **5 文本单位** | `addTextObject` L26 |
| BBCode 默认 | `scale * 60` → **10 文本单位** | `addBBCodeTextObject` L61 |
| ja 特例 | `if (obj.lineSpacing < 12 && resolvedLanguage === "ja") +35` | `setTextStyle` L44 |
| extraStyleOptions | `lineSpacing` 经 `Object.assign` 进入 styleOptions，**跳过默认** | L478 |
| 创建后手调 | `text.setLineSpacing(n)` 直接改对象，**完全绕过工厂** | 改版 13 处 |

### 4.2 R-2：`lineHeight` 维度设计

```ts
// src/enums/line-height-token.ts（新增，与 text-size-level.ts 同目录）
export const LineHeightToken = Object.freeze({
  BODY: 1.35,      // 正文（theme-config font.lineHeight.body，冻结值）
  COMPACT: 1.15,   // 紧凑/列表（theme-config font.lineHeight.compact，冻结值）
} as const);
export type LineHeightToken = (typeof LineHeightToken)[keyof typeof LineHeightToken];
```

**侵入块**（放在 U-3 level 块之后、`Object.assign` 之前——**必须晚于 level 块**，因为要读 level 覆盖后的有效字号）：

```ts
// ↓↓↓ R-2 行高块 ↓↓↓
if (extraStyleOptions?.lineHeight !== undefined && extraStyleOptions.lineSpacing === undefined) {
  const mult = LineHeightToken[extraStyleOptions.lineHeight];
  const size = Number.parseInt(styleOptions.fontSize?.toString() ?? "96");
  if (mult !== undefined && size > 0) {
    styleOptions.lineSpacing = Math.round(size * (mult - 1));
  }
}
// ↑↑↑ 行高块结束 ↑↑↑
```

**为什么这个位置**：
- ✅ 晚于 level 块 → 用**有效字号**推导（level=BODY 时按 54 算，不是样式默认 96）
- ✅ 显式 `lineSpacing` 传入时整块跳过 → 白名单场景不受影响
- ✅ 设进 `styleOptions.lineSpacing` → `addTextObject` 的「未设置才给默认」逻辑自然跳过我们的值
- ✅ 不碰 `scale`/阴影 → 视觉其余部分零变化

### 4.3 推导公式与全表（文本单位）

```
lineSpacing = round( effectiveFontSize × (multiplier − 1) )
```

| level（字号） | body 1.35 | compact 1.15 | 与改版实测值对照 |
|---|---:|---:|---|
| DISPLAY 128 | 45 | 19 | — |
| TITLE 66 | 23 | 10 | compact@TITLE = 10 |
| HEADING 60 | 21 | 9 | — |
| **BODY 54** | **19** | **8** | 产物中存在 8 |
| LABEL 48 | 17 | 7 | — |
| CAPTION 42 | 15 | 6 | — |
| MICRO 36 | 13 | 5 | compact@MICRO = 5 = 上游默认值 |

> 🎯 **交叉验证**：改版 L422 手调 `setLineSpacing(28)` @ `setFontSize("80px")`：**80 × 0.35 = 28，与 body token 精确吻合**——证明改版作者在大字号菜单上已经按 1.35 倍率手算过，token 化只是把这一行为制度化。

### 4.4 改版行距实测与迁移分类（全 dist chunk 扫描）

| 值（文本单位） | 次数 | 位置/语境 | 迁移处置 |
|---|---:|---|---|
| **28** | 1 | L422 大菜单文字 @80px | ✅ **Token 化** → `lineHeight: BODY`（值精确相等，零视觉变化） |
| 12 | 3 | L411/L412/L440 菜单选项 @96px | ⚠️ 白名单（12/96=0.125，非 token 倍率） |
| this.scale*72 | 2 | L370 精灵球计数 @96px | ⚠️ 白名单（=12） |
| 9 | 1 | L371 摘要标签 @96px | ⚠️ 白名单（9/96=0.094） |
| 2 | 2 | L443/L446 滚动描述 @96px | ⚠️ 白名单（冻结值已有） |
| -1 | 3 | L992 战斗浮出文字 @72px | ⚠️ 白名单（负值收紧） |
| -5 | 1 | L410 商店描述（容器 scale .5） | ⚠️ 白名单 |
| -10 | 1 | L2 战斗浮出 @45px | ⚠️ 白名单 |
| 动态变量 | 5 | t/a 等 | 豁免（运行时值） |
| scale*30 / scale*60 / +35(ja) | — | 上游内部 | 保持上游行为，不动 |

> 🔴 **对 11 文档的修正**：11 文档称 lineSpacing「7 种取值 0/2/3/5/8/10/12」——与产物实测**只重合 2 和 12**。实测改版手调值是 `{-10,-5,-1,2,9,12,28}`。11 文档的取值表来源存疑（可能混入了上游默认值或早期启发式扫描），**S7-3 施工时以源码实测复核为准**。

### 4.5 R-3：白名单扩充提案（需会签）

冻结值 `allowedLineSpacing: [0,2,3,5]` 覆盖不了产物现实。提案扩充为：

```json
"allowedLineSpacing": [-10, -5, -1, 0, 2, 3, 5, 8, 9, 10, 12]
```

| 值 | 来源 | 理由 |
|---|---|---|
| -10/-5/-1 | 产物实测（L2/L410/L992） | 负值收紧是改版浮出文字的刻意设计 |
| 0/3/5 | U-3 冻结保留 | 源码可能出现（本 chunk 未出现） |
| 2/9/12 | 产物实测（L443/L446/L371/L411/L412/L440/L370） | 手调紧密度，非 token 倍率 |
| 8/10 | 11 文档声称（产物未见） | 保险保留，S7-3 复核后定去留 |
| ~~28~~ | — | **不进白名单**，迁移为 body token |

### 4.6 ja 特例交互（多语言注意事项）

上游 `setTextStyle` 的 `lineSpacing < 12 && ja → +35`：

| 场景 | lineSpacing | ja 下行为 |
|---|---|---|
| 白名单值（-1/2/9/12） | <12（除 12） | +35 → 34/37/44/47（仅 ja） |
| body@BODY | 19 | 不触发（≥12） |
| compact@CAPTION | 6 | **触发** → 41（仅 ja） |

改版当前语言 `zh-Hans` **不受影响**；若将来开 ja，紧凑 token 的行距会被上游特例放大——这是上游对 CJK 的保护机制，**予以保留并在 S7-6 走查 ja 场景**（如届时支持）。

---

## 五、标度 C：间距 Token 适配（不碰文本 API）

### 5.1 上游无间距体系——适配即「常量 + 纪律」

上游/改版的间距现状：布局坐标手算（`addWindow(229,95,89,36)`）、`rowPitch`/`optionSpacing` 散落。**适配层不新增工厂**（守 C-1），只做两件事：

**① 常量定义**（值来自 U-3 冻结的 `theme-config.spacing`，布局单位）：

```ts
// src/config/spacing.ts（新增，纯常量，无函数）
export const Spacing = Object.freeze({
  xs: 4,   // 图标-标签间距、内边距微调
  sm: 8,   // 选项间距（optionSpacing 的替代）
  md: 12,  // 区块内间距
  lg: 16,  // 区块间距
  xl: 24,  // 屏幕级留白、列表行距基址
} as const);
```

**② 布局纪律**（S7-5 新增界面强制执行，QA 卡点）：

| 规则 | 说明 |
|---|---|
| S-C1 | 新增界面布局运算**禁止裸数**（`0`/`1` 与 `Spacing.*` 派生除外） |
| S-C2 | 窗口内边距用 `Spacing.xs/sm`；窗口间距用 `Spacing.md/lg` |
| S-C3 | 列表行距 = `fontSize(level)/6 × lineHeight.compact + Spacing.xs`（跨单位换算见 §二），或直接引用实测走查值 |
| S-C4 | `rowPitch`/`optionSpacing` **不复活**（产物中 10/4 处且值全为 0，死字段） |
| S-C5 | 文本 `padding`（上游默认 `{bottom: 6}`，文本单位）**不属于间距标度**，保持上游默认 |

### 5.2 行距派生公式的跨单位说明（S-C3 易错点）

列表行距在**布局单位**，字号在**文本单位**：

```
rowPitch(layout) = fontSize(text) ÷ 6 × lineHeight.compact + Spacing.xs
```

例：body 54 + compact + xs → `54/6 × 1.15 + 4 = 14.35` 布局单位 ≈ 86 画布像素行高。S7-5 按屏幕实测微调后**登记到该界面的走查记录**，不回写标度。

---

## 六、迁移映射（S7-2/S7-3 施工直接用）

### 6.1 野生字号 → level（27 种，承 U-1 §6.3 / 11 文档 §二）

| 野生值（文本单位） | → level | 偏差 | 备注 |
|---|---|---|---|
| 128 | DISPLAY | 0 | |
| 80/76/72/70 | TITLE (66) | −14~−4 | 80→66 偏差最大，走查项 |
| 66/65/64 | TITLE (66) / HEADING (60) | 0~−6 | 就近 |
| 60/58 | HEADING (60) | 0~−2 | |
| 56/55/54 | BODY (54) | 0~−2 | |
| 52/50/48 | LABEL (48) | 0~−4 | |
| 45/44/42 | CAPTION (42) | 0~−3 | |
| 40/38/36 | MICRO (36) | 0~−4 | |
| 35/34/32/30/26 | MICRO (36) | +1~+10 | 26→36 唯一直径放大，守门员 HUD |
| **0** | 🚫 白名单 `allowedLiterals:[0]` | — | L472 隐形占位 |

### 6.2 `setFontSize` 28 处分类（产物实测）

| 类别 | 值/位置 | 处置 |
|---|---|---|
| **静态可迁移** | 45(L2)→CAPTION｜34(L13)→MICRO｜30(L367)→MICRO｜58(L443)→BODY｜54(L992×4)→BODY｜48(L992×3)→LABEL｜"80px"(L422)→TITLE | 随 S7-2 收敛为创建时 `{level}` |
| **动态豁免** | L12/L13（r/a/xIe/originalMessageFontSize/defaultMessageFontSize）｜L420/L435（O/T 变量）｜L454（C?xH:bH 条件）｜L455/L456（messageFontSize() 反算） | 保持 `setFontSize`，**禁改 level**（C-4） |
| **条件自适应** | L1031 `A>=10?"34px":"44px"`｜L1033 `m.length>4?"30px":"40px"` | 豁免（按内容长度/数量自适应） |
| **白名单** | L472 `{fontSize:"0px"}` | `allowedLiterals:[0]` |

> U-3 §3.5 冻结的 3 项豁免（L1033/L456/L472） hereby 扩充为上述 4 类——静态值从豁免清单**移出**（它们正是 S7-2 的收敛对象）。

### 6.3 `Je` 桥接（149 处零改动）

```ts
// 改造后：值来源指向 TextSizeLevel，键名不变
export const Je = {
  title:   TextSizeLevel.TITLE,    // 66（原 66）
  row:     TextSizeLevel.HEADING,  // 60（原 60，语义更名）
  body:    TextSizeLevel.BODY,     // 54（原 54）
  small:   TextSizeLevel.LABEL,    // 48（原 48）
  tiny:    TextSizeLevel.CAPTION,  // 42（原 42）
  display: TextSizeLevel.DISPLAY,  // 128（新增）
  micro:   TextSizeLevel.MICRO,    // 36（新增）
};
```

| 键 | 旧值 | 新值 | 调用数 | 改动 |
|---|---|---|---:|---|
| title/row/body/small/tiny | 66/60/54/48/42 | 同 | 149 | **零** |
| display/micro | — | 128/36 | 0 | 新增，供 S7-2 收敛用 |

---

## 七、对冻结契约的增量提案汇总（需 UI+前端+全栈会签）

| # | 提案 | 改什么 | 为什么 | 影响面 |
|---|---|---|---|---|
| **R-1** | 阴影比例纳入 level | `text.ts` 比例计算块 | 否则 level 化迁移丢阴影缩放（3→4） | 全部 level 调用 |
| **R-2** | 新增 `lineHeight` 维度 | `text.ts` + `@types/ui.ts` + 新 enum 文件 | 行高标度落地（U-6 验收②） | 新增，不动既有 |
| **R-2b** | 接口改名 `ExtraTextStyleOptions` | U-3 §3.3 的接口名 | 与上游返回类型同名冲突 | 仅类型层 |
| **R-3** | 白名单扩充 | `theme-config.json` `allowedLineSpacing` | 冻结值与产物实测不符 | 归一逻辑 |
| **R-4** | 新增 `Spacing` 常量 + 布局纪律 | 新文件 + S7-5 QA 规则 | 间距标度落地（U-6 验收②） | 仅新增界面 |

> 变更流程按 U-3 §八：三方会签 → 更新版本号 → 全员同步。**R-2/R-4 不阻塞 S7-1（字号 Token 可先按 U-3 原样落地）**。

---

## 八、前端确认清单（U-6 验收第 ③ 项）

| # | 确认项 | 需要前端回答 |
|---|---|---|
| F-1 | `{ level, lineHeight }` 双维度是否覆盖前端的文本创建场景？有无第三维度需求（如字重/对齐）？ | 是/否 + 清单 |
| F-2 | `LineHeightToken` 的键名（`BODY`/`COMPACT`）与前端既有命名有无冲突？ | 冲突检查 |
| F-3 | R-1 阴影修正对 `setTextStyle` 路径（hover/tint 改样式）的影响是否可接受？ | 确认 |
| F-4 | 前端是否有**创建后**改字号/行距的场景（改版有 28+13 处）？适配层是否需要提供 `applyTokenStyle(obj, {level, lineHeight})` 辅助函数？ | 场景清单 |
| F-5 | `Spacing` 常量是否需要暴露给输入层/适配器代码（S6 的 12 个场景适配器是否涉及布局运算）？ | 是/否 |
| F-6 | R-3 白名单扩充是否影响前端已实现的归一/回退逻辑（如有）？ | 确认 |

---

## 九、S7 任务映射（本文 → 施工）

| S7 任务 | 消费本文 | 前置会签 |
|---|---|---|
| S7-1 Token 定义 | §3.1 + §4.2 + §5.1（三个常量/enum 文件） | R-2/R-4 |
| S7-2 裸字号收敛 | §3.2(R-1) + §6.1 + §6.2 | R-1 |
| S7-3 行高/间距落地 | §4.2~§4.6 + §5 + §6.3(Je) | R-2/R-3 |
| S7-4 文案 i18n | 不涉及（另见 20 文档 B0） | — |
| S7-5 界面重构 | §5.2 纪律 + §3.3 消费范式 | R-4 |
| S7-6 多分辨率走查 | §4.6 ja 特例 + §6.1 偏差列 | — |

---

## 十、验收自检（对照派单 24 §9.2 U-6）

| 验收卡点 | 状态 | 证据 |
|---|---|---|
| ① 适配层设计文档（输入 7 级 Token → 输出上游调用） | ✅ | §一总架构 + §三/四/五三条路径 + §6 迁移映射 |
| ② 覆盖 Token / 行高 / 间距三类标度 | ✅ | §三（字号，U-3 冻结+R-1 修正）/ §四（行高，R-2 新设计+推导全表）/ §五（间距，Spacing+纪律） |
| ③ 前端确认可用 | ⏳ | §八确认清单已备好，待前端回复（F-1~F-6） |

**附加实测校验**：侵入点逐行核对锚点树 `text.ts`（700 行）｜`setLineSpacing` 全 chunk 扫描（13 处手调+上游内部）｜`setFontSize` 全量枚举（28 处四类）｜单位换算实例 5 组｜行高推导与改版手调值 28@80px 精确交叉验证。

---

## 十一、复现脚本

```python
# 1. 侵入点结构（getTextStyleOptions 尾部）
sed -n '468,482p' .build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993/src/ui/text.ts

# 2. setLineSpacing / setFontSize 全量枚举（本扫描器）
import re, glob, collections
for pat in [r'setLineSpacing\(([^)]{1,40})\)', r'setFontSize\(([^)]{1,40})\)']:
    vals = collections.Counter()
    for p in glob.glob('game/server/dist/assets/*.js'):
        src = open(p, encoding='utf-8', errors='replace').read()
        vals.update(re.findall(pat, src))
    print(pat, dict(vals))

# 3. 行高 token 推导验证：80 × (1.35 - 1) = 28 ✓ 与 L422 手调值精确相等
```

---

**UI 设计师**：ui-designer
**产出日期**：2026-10-16
**关联文档**：`18-UI-视觉契约定稿.md`（U-3 冻结，本文 5 项提案待会签）· `16-UI-上游文本API调研.md`（U-1）· `20-UI-i18n-B0映射.md`（U-5）· `11-UI设计师-字号映射表.md`
**阻塞**：无（R-1~R-4 会签回复后即可进 S7 施工；字号 Token 部分可先按 U-3 原样落地）

# 14 · UI 视觉规范（Visual Spec）

> **角色**：UI 设计师
> **性质**：v1 派单 04 §八 交付清单中的 `docs/visual-spec.md`；v2 看板 UI「准备-1」+「准备-2」的正式规范
> **状态**：纯设计产出，**不依赖运行时 / 不依赖 S0 / 不依赖 M5**
> **对应任务**：v2 看板 UI-准备1/2/3、S7-1～S7-5
> **编制日期**：2026-10-13

---

## 零、本文档的作用

本文档是 PKRC 视党收敛的**唯一规范来源**，包含：

1. **7 级字号 Token 体系**（定义 + 与既有 `Je` 的对齐关系）
2. **4px 间距栅格 + 行高标度**
3. **配色规范**（原版 `F.*` 引用 + 内联 hex 清理清单 + 白名单登记规则）
4. **`theme-config.json` 正式内容**（合法 JSON）
5. **i18n 命名空间规范**
6. **`text-factory` 接口契约**
7. **可访问性基线**

> ⚠️ **前置阅读**：`11-UI设计师-字号映射表.md`（U-1，27→7 完整映射 + 受影响界面清单）

---

## 一、字号 Token 体系（7 级）

### 1.1 定义

| Token | 值(px) | 用途 | 对齐来源 | 实测调用数 |
|---|---|---|---|---|
| `display` | **128** | 标题 / 大字号演出 | — | 3 |
| `title` | **66** | 界面标题 | ✅ `Je.title` | 3 |
| `heading` | **60** | 区块标题 | ✅ `Je.row` | 6 |
| `body` | **54** | 正文 | ✅ `Je.body` | 20 |
| `label` | **48** | 标签 / 次要文本 | ✅ `Je.small` | 14 |
| `caption` | **42** | 说明 / 提示 | ✅ `Je.tiny` | 8 |
| `micro` | **36** | 角标 / 极限压缩场景 | — | 4 |

> **5/7 直接对齐既有 `Je`** → **41% 的现有调用视觉零变化**（实测验证，见 11 文档 §2.2）。

### 1.2 字号层级的设计理由

```
128  display  ████████████████████████  演出级（"Congratulations"）
 66  title    ████████████▉            界面主标题
 60  heading  ███████████▎             区块标题
 54  body     ██████████               正文（最常用，20 次）
 48  label    ████████▉                标签
 42  caption  ███████▊                 说明
 36  micro    ██████▊                 角标 / 极限压缩
```

- **层级比 ≈ 1.11–1.27**（相邻档），符合"可辨识但不过度跳跃"原则
- **`body`(54) 最常用**（20 次）→ 作为视觉锚点，其余档围绕它展开
- **`display` 与 `title` 之间是 1.94× 大跳跃** → 刻意为之，用于"演出文本"与"常规标题"的强区分

### 1.3 禁止事项

| 🚫 禁止 | 理由 |
|---|---|
| 新增裸 `fontSize:"Npx"` | 直接违反 R1（改 chunk）；也是本规范要消灭的现象 |
| 新增 token 之外的档位 | 打破层级一致性 |
| 把 `setFontSize(动态值)` 改成 token | 那是响应式自适应逻辑，不是固定字号（见 11 文档 §三 W-2/W-3） |

---

## 二、间距与行高标度

### 2.1 4px 基准栅格

| Token | 值(px) | 用途 |
|---|---|---|
| `space.xs` | **4** | 最小间隙（图标与文字） |
| `space.sm` | **8** | 紧凑间距（选项间距、列表微距） |
| `space.md` | **12** | 标准间距（元素间） |
| `space.lg` | **16** | 区块内边距 |
| `space.xl` | **24** | 区块间留白 |

> **栅格比**：4 → 8 → 12 → 16 → 24 = **1 / 2 / 3 / 4 / 6 个 4px 单元**（除 xl 为 6 单元，是刻意的呼吸值）。

### 2.2 行高标度

| Token | 值 | 用途 |
|---|---|---|
| `lineHeight.body` | **1.35 × 字号** | 正文（多行阅读） |
| `lineHeight.compact` | **1.15 × 字号** | 列表 / 表格（紧凑） |

**派生示例**（`body=54px`）：
- 正文行高 = 54 × 1.35 ≈ **73px**
- 紧凑行高 = 54 × 1.15 ≈ **62px**

### 2.3 现有散落值归一

| 现有项 | 实测 | 归一为 |
|---|---|---|
| `lineSpacing`: 8 / 10 / 12 | 各 1 处 | `space.sm` / `space.md` |
| `lineSpacing`: 0 / 2 / 3 / 5 | 共 5 处 | 🚫 **白名单保留**（`<8` 的紧凑场景） |
| `maxLines`: 1/2/3/4/5/6/8 | 27 处 | 不归一，由 `text-factory` 的 `opts.maxLines` 管理 |
| `rowPitch` | 产物 1 处（`=0`）/ 源码 10 处 | `row.pitch`（源码层处理） |
| `optionSpacing` | 产物 1 处（`=0`）/ 源码 4 处 | `option.spacing = space.sm` |

> ⚠️ **产物 vs 源码差异**（见 11 文档 §4.3）：tree-shaking 后产物只剩 1 处，**S7 以源码为准**。

---

## 三、配色规范

### 3.1 原则：**不新增自造色值**，优先引用原版 `TextStyle`

**原版 `F.*` 样式实测使用频次**（top 15，共 30+ 种）：

| 样式 | 用法 | 频次 |
|---|---|---|
| `F.WINDOW` | 窗口主体 | **286** |
| `F.SUMMARY_GOLD` | 摘要金色 | 67 |
| `F.PARTY` | 队伍 | 61 |
| `F.WINDOW_ALT` | 窗口次要 | 43 |
| `F.SUMMARY` | 摘要 | 40 |
| `F.TOOLTIP_CONTENT` | 提示内容 | 33 |
| `F.SETTINGS_LABEL` | 设置标签 | 33 |
| `F.MONEY` | 货币 | 30 |
| `F.SUMMARY_ALT` | 摘要次要 | 27 |
| `F.SUMMARY_BLUE` | 摘要蓝 | 25 |
| `F.SUMMARY_GRAY` | 摘要灰 | 24 |
| `F.BATTLE_INFO` | 战斗信息 | 22 |
| `F.SUMMARY_RED` | 摘要红 | 16 |
| `F.MESSAGE` | 消息 | 13 |
| `F.SUMMARY_PINK` | 摘要粉 | 12 |

> **结论**：原版 `F.*` 体系**丰富且被大量使用**（`F.WINDOW` 一个就 286 次）。改版新增界面**应复用**，而非自造。

### 3.2 🚫 内联十六进制色值清理清单（实测 35 种去重）

改版绕过了 `F.*` 体系，直接内联 hex。**必须登记或替换**：

**A. `color:"#hex"` 内联（24 种 / 32 次）**

| 色值 | 次数 | 建议处置 |
|---|---|---|
| `#f8f8f8` | 5 | → 复用 `F.WINDOW` / `F.PARTY` 体系 |
| `#ffffff` / `#FFFFFF` | 5 | → 复用原版白 |
| `#FFD700` / `#ffd700` | 3 | → 复用 `F.SUMMARY_GOLD` |
| `#aaaaaa` | 1 | → 复用 `F.SUMMARY_GRAY` |
| `#ffaa00` | 1 | → 登记为 `palette.extra` 或复用 |
| Material 色系：`#4CAF50`/`#F44336`/`#2196F3`/`#FFC107`/`#9C27B0`/`#8BC34A`/`#00BCD4`/`#795548`/`#E91E63`/`#FF5722`/`#607D8B`/`#E53935`/`#D32F2F`/`#43A047`/`#7E57C2`/`#DA3838`/`#FF6B6B` | 各 1 | 🔴 **改版自造的 Material 调色板** → 需统一登记或替换 |

**B. `setColor("#hex")`（11 种 / 21 次）**

| 色值 | 次数 | 建议处置 |
|---|---|---|
| `FFD700` | 5 | → `F.SUMMARY_GOLD` |
| `ffffff` / `FFFFFF` | 6 | → 原版白 |
| `FFA500` | 3 | → 登记或替换 |
| `7fd4ff` | 2 | → 解明色（登记 `palette.jieming`) |
| `40c8f8` | 1 | → 解明色 |
| `ff5b6e` / `ff9ec4` | 各 1 | → 召唤卡色（登记 `palette.callingCard`) |
| `00FF00` / `AAAAAA` / `FFD966` | 各 1 | → 登记或替换 |

**C. `setTint(十进制)`（6 种 / 30 次）**

| 十进制 | 对应 hex | 说明 |
|---|---|---|
| `8421504` | `#808080` | 灰 |
| `6316128` | `#606060` | 深灰 |
| `0` | `#000000` | 黑 |
| `16291984` | `#F8A8D0` | 粉 |
| `4737096` | `#484848` | 中灰 |
| `12303291` | `#BBBBBB` | 浅灰 |

### 3.3 CSS 变量（沿用既有）

| 变量 | 值 | 用途 |
|---|---|---|
| `--color-base` | （既有） | 基础色 |
| `--color-light` | （既有） | 亮色 |
| `--color-dark` | （既有） | 暗色 |
| `--controls-size` | `10vh`（横屏 `20vh`） | 控件区高度 |

### 3.4 登记规则

> **新增界面配色必须登记到 `theme-config.json` 的 `palette.extra` 段，禁止内联十六进制。**

---

## 四、`theme-config.json` 正式内容（合法 JSON，无注释）

```json
{
  "scale": {
    "baseWidth": 1920,
    "baseHeight": 1080,
    "mode": "FIT",
    "dprAware": true
  },
  "font": {
    "family": "emerald",
    "scaleFactor": 1.0,
    "levels": {
      "display": 128,
      "title": 66,
      "heading": 60,
      "body": 54,
      "label": 48,
      "caption": 42,
      "micro": 36
    },
    "lineHeight": {
      "body": 1.35,
      "compact": 1.15
    }
  },
  "spacing": {
    "xs": 4,
    "sm": 8,
    "md": 12,
    "lg": 16,
    "xl": 24
  },
  "palette": {
    "inherit": true,
    "extra": {}
  },
  "legacy": {
    "rewriteFontSizeLiterals": true,
    "allowedLiterals": [0],
    "allowedLineSpacing": [0, 2, 3, 5]
  },
  "i18n": {
    "namespacePrefix": "pkrc",
    "fallback": "zh-CN"
  }
}
```

### 4.1 与 v1 派单 §3.1 的差异说明

| 字段 | v1 派单 | **本文档（实测后）** | 原因 |
|---|---|---|---|
| `legacy.allowedLiterals` | `[]`（全量归一） | **`[0]`** | 实测 L472 `fontSize:0` 是隐形占位，归一成 36 会**破坏布局**（见 11 文档 W-1） |
| `legacy.allowedLineSpacing` | 未定义 | **新增** `[0,2,3,5]` | 实测 `<8` 的紧凑行距需保留 |
| `i18n.namespacePrefix` | `"pkrc"` | **保留**（仅约束新建文件） | 现有 `talent.json` 顶层键无前缀，不重命名避免破坏 |

---

## 五、i18n 命名空间规范

### 5.1 键命名

```
pkrc<系统>.<模块>.<键>
```

### 5.2 文件结构

```
locales/zh-CN/pkrc-talent.json     天赋     （⚠️ 现有 talent.json 已存在，追加即可）
locales/zh-CN/pkrc-mingzuo.json    命之座   （新建）
locales/zh-CN/pkrc-jieming.json    解明     （新建）
locales/zh-CN/pkrc-eryou.json      二游养成 （新建）
locales/zh-CN/pkrc-soudache.json   搜打撤   （新建）
locales/zh-CN/pkrc-common.json     通用提示 （新建）
```

> **详见**：`13-UI-文案清点表.md`（U-2，含三列表 + 分批计划 + 现有 437-key 先例结构）

### 5.3 规则

- 新增界面**一律走 `i18next.t()`**，不再内联中文
- **JSON 必须无注释**（`jsonc` 是计划书示意，产物 `JSON.parse` 会炸）
- fallback 到 `zh-CN`（其他语言下不报错）

---

## 六、`text-factory` 接口契约（S7 落地）

```js
/**
 * 统一文本创建入口。所有新增/重写界面必须经此创建文本。
 *
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {string} content
 * @param {Object} [opts]
 * @param {'display'|'title'|'heading'|'body'|'label'|'caption'|'micro'} [opts.level='body']
 * @param {Object}  [opts.style]      - 原版 TextStyle（F.* 引用），优先级高于 level 的字号
 * @param {number}  [opts.maxLines]   - 最大行数
 * @param {'body'|'compact'} [opts.lineHeight='body']
 * @param {string}  [opts.i18nKey]    - 若提供，content 视为 fallback，优先 t(i18nKey)
 * @returns {Phaser.GameObjects.Text}
 */
export function createText(scene, x, y, content, opts = {}) { /* ... */ }
```

### 6.1 行为规范

| 行为 | 规则 |
|---|---|
| 字号计算 | `fontSize = token(level) * config.font.scaleFactor` |
| 行距派生 | `lineSpacing` 由 `lineHeight` token × 字号派生 |
| 配色 | 走 `opts.style`（`F.*` 引用）或 `palette` 登记值，**禁止内联 hex** |
| 白名单 | 若 `fontSize` 命中 `allowedLiterals` → **原样保留，不归一** |
| 降级 | 任何异常 → **静默降级**（退回原版 `add.text()`），不抛错、不阻塞 |

### 6.2 动态字号排除

以下情况**不得**被 token 覆盖（见 11 文档 §三）：

- `guardianTalentText.setFontSize(m.length>4 ? "30px" : "40px")` — 按天赋条数自适应
- `messageFontSize(高度)` — 消息框行内自适应

> **实现要求**：`apply-legacy` / 源码改造**必须显式跳过**这些位置。

---

## 七、分辨率与缩放一致性

| 项 | 方案 |
|---|---|
| ScaleManager | 统一 `FIT` + `baseWidth:1920 / baseHeight:1080` + `dprAware:true`，避免 CSS 与 Canvas 两套缩放打架 |
| CSS | 复用既有变量（`--controls-size: 10vh`、横屏 `20vh`、`@media (pointer: coarse)`） |
| 新增样式 | 一律用 `vh/rem` + 变量，**禁止新写固定 px** |
| 高 DPI | 校验 `window.devicePixelRatio` 与 `ScaleManager.zoom` 一致 |

### 7.1 验收矩阵（S7-6）

| 缩放 \ 分辨率 | 1280×800 | 1920×1080 | 2560×1440 |
|---|---|---|---|
| **100%** | ⬜ | ⬜ | ⬜ |
| **125%** | ⬜ | ⬜ | ⬜ |
| **150%** | ⬜ | ⬜ | ⬜ |

**判据**：无裁切、无模糊、文字不溢出容器、光标/滚动条对齐。

---

## 八、可访问性基线（WCAG AA）

| 项 | 标准 | 本项目的约束 |
|---|---|---|
| 对比度 | 正常文本 **≥4.5:1**，大文本 **≥3:1** | 复用原版 `F.*` 已达标；**内联 hex 需逐一校验**（§3.2 的 Material 色系尤其要查） |
| 键盘导航 | 全功能无鼠标 | 由前端 S6 保证；UI 保证**焦点框可见**（`setFocus` 6 处） |
| 触摸目标 | **≥44px** | Phaser 场景内为逻辑像素，按 1920 逻辑宽折算 |
| 动效 | 尊重 `prefers-reduced-motion` | 新增 tween 需检查 |
| 文字缩放 | 支持 200% | 由 §七 的 `dprAware` + FIT 保证 |

### 8.1 🔴 需重点校验的内联色

Material 色系（`#4CAF50` 等 17 种）**直接用在文字上时**需逐一测对比度 —— 其中 `#8BC34A`（浅绿）、`#FFC107`（琥珀）、`#00BCD4`（青）在浅底上**大概率不达标**。

---

## 九、S7 实施清单（本规范 → 任务）

| 任务 | 依据 | 说明 |
|---|---|---|
| **S7-1** 源码级 Token 定义 | §一/§二/§三 | 建 `src/theme/tokens.ts`（或复用上游体系，待 U-3 调研） |
| **S7-2** 108 处裸字号源码直改 | 11 文档 §二 | 27 → ≤7，白名单 `[0]` 登记 |
| **S7-3** 行高/间距标度落地 | §二 | 4px 栅格 |
| **S7-4** 文案 i18n 化 | 13 文档 §四 | 分批 B0–B6 |
| **S7-5** 新增界面重构 | §六 | 经 `text-factory`，复用 `F.*` + `addWindow` |
| **S7-6** 多分辨率走查 | §7.1 | 9 格矩阵 |
| **S7-7** 走查截图包 | §7.1 | 改造前后对比 |

---

## 十、⚠️ 待 U-3 调研回填的空白

本规范基于**产物实测**，以下需**上游源码调研（U-3）**后回填：

| # | 待确认 | 影响 |
|---|---|---|
| **Q-1** | 上游是否已有字号层级体系？ | 若有 → **复用**而非新建 7 级 token（可能整个 §一 改为"迁移"） |
| **Q-2** | 上游 `F.*` 的源码定义位置 | §三 的替换目标（v1 说的 `F.WINDOW` 对应源码哪里） |
| **Q-3** | 上游 `addWindow` / 光标 / 滚动条组件位置 | §六 S7-5 复用目标 |
| **Q-4** | 上游文本创建的统一入口 | `text-factory` 是包装还是全新 |
| **Q-5** | 上游 `.nvmrc` 锁定的确切版本 | 与全栈 A0-2 对齐 |

> ⚠️ **U-3 依赖 A0（上游 clone 完成）**。当前 clone 未完成（见 `11` / 本次实测：`.git` 33M、无 commit、分支损坏）。
> **U-3 是 UI 唯一被 A0 阻塞的任务**，其余（U-1/U-2 + 本文档）**已全部完成**。
> **建议**：若 A0 短期内无法完成，可先用 GitHub 网页版只读目录结构做**粗调研**（`src/ui/` 路径级），不必等完整 clone。

---

## 十一、交付状态

| 项 | 状态 |
|---|---|
| 7 级字号 Token 体系 | ✅ 完成（§一，含 41% 零变化实测） |
| 4px 间距栅格 + 行高标度 | ✅ 完成（§二） |
| 配色规范 + 内联 hex 清理清单 | ✅ 完成（§三，35 种去重色值全列） |
| `theme-config.json` 正式内容 | ✅ 完成（§四，合法 JSON） |
| i18n 命名空间规范 | ✅ 完成（§五） |
| `text-factory` 接口契约 | ✅ 完成（§六） |
| 分辨率/缩放一致性 | ✅ 完成（§七） |
| 可访问性基线 | ✅ 完成（§八） |
| U-3 上游调研 | ⏳ **阻塞于 A0**（§十） |

---

**UI 设计师**：ui-designer
**产出日期**：2026-10-13
**关联文档**：`11-UI设计师-字号映射表.md` · `13-UI-文案清点表.md` · `04-UI设计师-派单.md`

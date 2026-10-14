# A3-10 legendary-popup 独立 chunk 迁移 —— 记录与验收

> **任务**：A3-10 legendary-popup 迁移（独立 chunk，HTML 模板 + 传说称号）
> **日期**：2026-10-14
> **状态**：✅ 完成
> **锚点树**：`90df65097b6df76f713e6bd108afa84499e8b993`
> **产物基准**：
>   `game/server/dist/assets/legendary-popup-CYOZDx4m.js`（主，322 KB）
>   `game/server/dist/assets/legendary-popup-helper-oMGPOaoa.js`（helper，1.5 KB）

---

## 0. 结论

| 验收卡点（派单 15 §9.1 A3-10） | 实况 | 判定 |
|---|---|---|
| ① HTML 模板 + 称号数据迁入 `src/` | 已迁入 `legendary-popup/`（**8,015 行 / 340 KB**） | ✅ |
| ② chunk 拆分策略说明 | 见 §3（2 chunk → 4 模块） | ✅ |
| ③ 独立入口可构建 | `index.ts` 入口 + 动态 import 目标可解析；`tsc` 零错 | ✅（真构建留 A3-13） |

**中文串守恒**：主 chunk 818 + helper 7 = **825 片段，orphan = 0** ✅

---

## 1. 产物结构

这是**两个 chunk** 的组合：

```
legendary-popup-helper-oMGPOaoa.js (1.5 KB)      legendary-popup-CYOZDx4m.js (322 KB)
├─ DEFAULT_CONFIG {performanceMode, enabled,      ├─ f   = getLegendaryConfig  (128 KB)
│    mobileDuration:3000, desktopDuration:2500}   │        134 条 bgGradient + 132 套 animation HTML
├─ isMobileDevice (UA)                            ├─ p   = LegendaryPopupManager (185 KB)
├─ detectDevicePerformance (CPU+内存→hl)          │        ├─ init            建容器
├─ shouldUseSimplifiedAnimation                   │        ├─ injectStyles    181 KB CSS
├─ showLegendaryPopup                             │        ├─ pauseGame/resumeGame
│    └─ 动态 import 主 chunk → legendaryPopup     │        ├─ show            渲染配置 + 动画
│    └─ setTimeout(close, 时长)                   │        └─ close
└─ 导出 4 个符号                                  └─ x = new p  →  export {x as legendaryPopup}
```

**规模**：134 条传说配置 / 132 套动画模板 / 182 个 `@keyframes` / 501 个 CSS 选择器块。

---

## 2. 交付物

| 文件 | 行数 | 说明 |
|---|---:|---|
| `legendary-popup/index.ts` | 150 | **公共入口**（等价 helper chunk）：配置 / 设备判定 / `showLegendaryPopup` / 懒加载 |
| `legendary-popup/legendary-popup-manager.ts` | 57 | **渲染逻辑**（`LegendaryPopupManager`：init / injectStyles / show / close / 暂停恢复） |
| `legendary-popup/legendary-config.ts` | 2,342 | **模板/称号数据**（`getLegendaryConfig`，128 KB） |
| `legendary-popup/legendary-popup-styles.ts` | 5,466 | **样式表**（181 KB CSS） |

> 后两个文件由**脚本从产物逐字提取**，中文与 CSS 零改动（仅类名/引用重命名 + CSS 外置）。

---

## 3. chunk 拆分策略（交付项 ②）

### 3.1 产物侧

vite 把本功能拆成 **2 个 chunk**：
- **helper chunk**（1.5 KB）：轻量入口，包含**设备判定 + 懒加载 + 时长控制**；
- **主 chunk**（322 KB）：重量级渲染器（配置 + 样式 + 逻辑），**由 helper 动态 import 按需加载**。

调用点（主 chunk 内）：
```js
__vitePreload(() => import("./legendary-popup-CYOZDx4m.js"), __vite__mapDeps([0,1,2,3]), import.meta.url)
```

### 3.2 迁移侧（4 模块拆分）

| 迁移模块 | 对应产物 | 拆分理由 |
|---|---|---|
| `index.ts` | helper chunk | 对外 API 与重资源解耦 —— 调用方 import 它不会拖入 322 KB |
| `legendary-popup-manager.ts` | 主 chunk 的 `p` | 保留**逻辑**；CSS/数据外置后仅 57 行 |
| `legendary-config.ts` | 主 chunk 的 `f` | 128 KB **模板/称号数据**独立，便于审阅与按需替换 |
| `legendary-popup-styles.ts` | `injectStyles` 的 181 KB CSS | **样式**独立成文件，避免 JavaScript 淹没 |

### 3.3 「独立入口可构建」的落点（交付项 ③）

`index.ts` 用**标准动态 import** 加载 manager：
```ts
const { LegendaryPopupManager } = await import("./legendary-popup-manager.js");
```
打包器会自动：
1. 把 `legendary-popup-manager.ts`（及其依赖的 config/styles）**再拆为独立 chunk**；
2. 生成 preload 包装与 `__vite__mapDeps`（源码中**无需**手写）。

→ **入口模块与重资源分属不同 chunk** 的产物结构被完整保留。
（实际 vite 构建验证归 **A3-13**；本任务已验证模块可解析 + `tsc` 零错。）

---

## 4. 产物符号还原

| chunk | 产物短名 | 还原原名 | 说明 |
|---|---|---|---|
| helper | `m` / `t` | `DEFAULT_CONFIG` / `popupConfig` | 配置 |
| helper | `s` / `p` / `h` | `isMobileDevice` / `detectDevicePerformance` / `shouldUseSimplifiedAnimation` | 设备判定 |
| helper | `b` / `c` | `showLegendaryPopup` / `cachedModule` | 懒加载入口 |
| 主 | `f` | `getLegendaryConfig` | 配置表 |
| 主 | `p` | `LegendaryPopupManager` | 管理器 |
| 主 | `x` | `legendaryPopup` | 单例 |

> ⚠️ 两个 chunk 的 keepNames 包装名不同：helper 用 `r(...)`，主 chunk 用 `c(...)`（均等价于主 chunk 的 `l(...)`）。

---

## 5. 验证（可复跑）

```bash
# ① 类型自检（4 模块）
bash .build-tools/a305/check.sh \
  docs/sourcemigration/A3-migration/src/data/systems/legendary-popup/index.ts \
  docs/sourcemigration/A3-migration/src/data/systems/legendary-popup/legendary-popup-manager.ts \
  docs/sourcemigration/A3-migration/src/data/systems/legendary-popup/legendary-config.ts \
  docs/sourcemigration/A3-migration/src/data/systems/legendary-popup/legendary-popup-styles.ts
# 预期：EXIT=0

# ② 全量 17 文件回归
# 预期：EXIT=0

# ③ 中文串守恒（825 片段，orphan=0）
# 见本记录 §0
```

**实测**：① `EXIT=0`；② `EXIT=0`；③ orphan = 0。

---

## 6. 已知问题与后续

| 项 | 说明 | 归属 |
|---|---|---|
| 真构建验证 | 4 模块 → 独立 chunk 的实际拆分结果 | **A3-13** |
| `navigator.deviceMemory` | 非标准 API（仅 Chromium）；已按产物 `\|\| 4` 兜底 | 接入锚点 |
| `(window as any).globalScene` | 产物经全局取 `globalScene` 暂停游戏 | 接入锚点 |
| 调用点接线 | 传说宝可梦登场处需改为 `showLegendaryPopup(...)` | 接入锚点 |
| 样式未做 CSS 模块化 | 仍为运行时 `<style>` 注入（与产物一致） | — |

---

*本记录由 A3-10 迁移流程生成，随 `.build-tools/a3110/` 提取产物可复跑。*

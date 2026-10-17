# A3-补 第三十二批 · declare 海清理方法论定案

## 一句话结论

「清 declare 海」这件事的**正确判据定案并脚本化**，`constellation-ui.ts` 63 行 declare **全部清零**，
`tsc` EXIT=0；顺带挖出迁移期埋的 **5 处 `l()` 语义 bug**（运行时必崩）。

## 最重要的产出：判据不能靠读

单字母名（`a`/`C`/`i`/`l`…）在产物里是压缩后的**局部变量**，逐条看几乎必然误判成全局依赖。
上一批我判断「486 个都是真依赖」——**这个判断是错的**。

**可靠判据 = 删掉 declare 行 → 跑 tsc → 只看 `TS2304 Cannot find name`**：

| 判据 | 含义 | 处理 |
|---|---|---|
| 报 `TS2304` | **真实外部依赖** | 须 resolve |
| 不报错 | **D 类误捕**（产物局部变量） | 直接删 |

实测命中率：

| 文件 | declare 行 | 真实依赖 | 误捕 | **误捕率** |
|---|---:|---:|---:|---:|
| `constellation-ui.ts` | 63 | **48** | 15 | 24% |
| `eryou-ui.ts` | 486 | **174** | 312 | **64%** |

已脚本化为两个工具：
- `tools/clear-declares.cjs` —— 只读探测（自动备份 + 还原 + 出清单）
- `tools/resolve-declares.cjs` —— 批量反查（keepNames + 模块级字面量）

## `constellation-ui.ts` 清零

48 个依赖全部落地：37 个产物字面量 + 9 个 keepNames + 2 个按用法判定。数值表见 `§38.3`。

**新增 `#utils/sprite-artwork`** —— 6 个 helper 独立成模块：

`measureSpriteArtworkBounds` · `fitSpriteArtworkToBox` · `measureSpriteAnimationBounds`
· `alignSpriteArtworkToPoint` · `splitArtworkBounds` · `starPoints`

判定依据：它们定义位置在 keepNames 注记**之前**，不属任何 handler 类体，是**通用纯函数**
（无 `globalScene` 依赖，可单测）。

## 🔴 挖出迁移期埋的语义 bug：`l()` 被当工厂函数

产物真身：
```js
var l=(n,s)=>Object.defineProperty(n,"name",{value:s,configurable:!0})
```
**只设函数名，不返回任何值。**

F-11 迁移脚本却写成 `const X = l(fn,"name")` ⇒ **`X` 运行时是 `undefined`**，调用即崩。
`constellation-ui.ts` 命中 **5 处**：`width` 宽字符测量、`pushLine`、`blocks` 分块、
`onYoyo`、`onComplete`。已全部剥成裸箭头函数。

**判据：凡 `const X = l(..., "...")` 形态，`X` 必为 `undefined`，必须剥。**

## 另一个签名坑

`fitSpriteArtworkToBox` 我凭直觉写了 3 参 `(width, height, box)`，tsc 报 TS2554。
查产物真身是 **2 参 `(bounds, box)`**，且 `bounds` 是取 `.width/.height` 的对象。

**教训：helper 签名必须 `function <短名>(形参)` 回抽后再落 TS，不能凭直觉。**

## 实测指标（零变化是预期的）

| 指标 | 上批 | 本批 | Δ |
|---|---:|---:|---:|
| 命中 | 2245 | 2245 | 0 |
| 覆盖率 | 71.84% | 71.84% | 0 |
| tree-shake | 294 | 294 | 0 |
| 未定性残差 | 540 | 540 | 0 |
| tsc | EXIT=0 | **EXIT=0** | — |

`PtConstellationUiHandler` 仍未接入口，所以命中数不变。**本批价值在拆接线门槛 + 修语义 bug + 方法论脚本化。**

## 下一步：`eryou-ui.ts` 174 个依赖

批量反查已完成（`.build-tools/declares-eryou-ui-resolved.json`）：

| 类别 | 数量 | 下一步 |
|---|---:|---|
| keepNames 命中真名 | **83** | 逐个核验是否已在 `eryou-system.ts` / `jieming-system.ts` |
| 模块级字面量 | **87** | 直接建 `const` 表（**低风险，可立即做**） |
| 按用法判定 | **4** | `E`=globalScene · `M`=i18next · `w`=Button · `xn` 待判 |
| D 类误捕 | **312** | 直接删 |
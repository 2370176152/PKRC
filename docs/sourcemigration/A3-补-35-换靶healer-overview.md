# A3-补 第三十五批 · 换靶成功（healer【祈愿】+9 命中）

## 一句话结论

`eryou-ui.ts` 正式转挂账，换靶 healer 系统 —— **一次入口接线 +9 命中**，覆盖率首破 72%。
换靶决策得到验证。

## 挂账决策：`eryou-ui.ts`

连续两批（三十三/三十四）受阻后转正式挂账。理由是量化的：

| 维度 | 数值 |
|---|---|
| 真实依赖 | 174（486 行 declare 里 64% 是误捕） |
| 可零风险落 | 73 |
| 需多批工程 | **66 个 keepNames 规则函数**（11k 字符 + 140 个二级依赖） |
| 阻塞类型 | 单行长代码（6463 字符/行）⇒ 无法自动化改写 |
| 接线前置 | `ui.ts` 密集索引要求 **18 个 handler 全干净**，单攻 11 个 Eryou **收益为零** |

保留资产（不删）：`clear-declares.cjs` · `resolve-declares.cjs` · `eryou-header.cjs` ·
`fix-textsize.cjs`（反面案例）· `declares-eryou-ui-resolved.json`。

## 换靶侦察：发现 5 个「零 declare 孤岛」

在 300 个 tree-shake 符号里翻出这么一批：

| 系统 | 文件 | export 数 | declare |
|---|---|---:|---:|
| healer | `healer-system.ts` 44KB | 91 | **0** |
| chixin | `chixin-system.ts` 35KB | 67 | **0** |
| mew | `mew-system.ts` 27KB | 53 | **0** |
| dianxin | `dianxin-system.ts` 21KB | 41 | **0** |
| nianli | `nianli-system.ts` 23KB | 43 | **0** |

**全部零 declare**，在 tree-shake 桶里**纯粹因为没有入口** —— 与 `eryou-ui.ts`（486 行 declare 海）
完全相反，是「先接入口 → 再补叶子」的标准靶子。

## 本批落位（4 处）

| 落点 | 内容 |
|---|---|
| `enums/command.ts` | `Command` 补 4 值：`BACKPACK=5` / `CALLING_CARD=6` / `JIEMING=7` / `WISH=8` |
| `healer-system.ts` | 🔴 修正 `HealerWishPhase`：`extends Phase` + `end()` + `phaseName` |
| `phase-manager.ts` | `PHASES` 表注册 |
| `command-ui-handler.ts` | `handleWishCommand()`（934 字符）+ `case Command.WISH` |

## 挖出的真 bug：祈愿按钮点了没反应

`HealerWishPhase` **早就存在**（`healer-system.ts:883`），但写成了**裸类**：

| 缺失 | 后果 |
|---|---|
| `extends Phase` | `unshiftPhase()` **拒收** |
| `PHASES` 表注册 | `phaseName` 不在 `PhaseString` 联合内（TS2416） |
| `this.end()` | 分支结束卡死 |

所以「祈愿」按钮一直显示、`canWish()` 一直返回 true，**点了什么都不会发生**。
典型的「数据层全对、入口层断链」。

**Phase 三要素**（缺一不可，已写入记忆）：
① `extends Phase`（路径是 `#app/phase`，不是 `#phases/phase`）
② `phase-manager.ts` 的 `PHASES` 表注册
③ 分支收尾调 `this.end()`

另外 `unshiftPhase()` 返回 `void`，`return unshiftPhase(...)` 会报 TS2322。

## 实测：换靶决策验证成功

| 指标 | 上批 | 本批 | Δ |
|---|---:|---:|---:|
| 命中 | 2245 | **2254** | **+9** |
| 覆盖率 | 71.84% | **72.13%** | **+0.29%** |
| tree-shake | 294 | **291** | −3 |
| 未定性残差 | 540 | **534** | −6 |
| tsc / vite build | EXIT=0 | **EXIT=0** | — |

**对比很说明问题**：`eryou-ui.ts` 两批零产出，healer 一次接线 +9 命中。

## 下一步

chixin（67 export，走 `Command` 另一值）· mew（53）· dianxin（41）· nianli（43）——
它们的入口都在**已接线的上游类**（`CommandUiHandler` / 招式 Attr / Phase 钩子），
**不需要新建密集索引**，是 healer 同构的低风险高回报目标。
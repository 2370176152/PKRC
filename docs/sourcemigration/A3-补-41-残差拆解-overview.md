# A3-补 第四十一批 · 残差 533 构成拆解（纯侦察）

## 一句话结论

**残差 ≠ tree-shake 差异**。实测 **507 / 533（95%）在 src 里根本不存在** ——
不是「没接入口」，是**真正的未迁**。这彻底改变投入判断。

## 拆解方法

`verify-signature.cjs` 的残差定义是「基准有、bundle 无、**src/ 也无**、vendor 也无」。三步拆解：

1. 提残差符号清单 → `.build-tools/resid-names.txt`
2. 一次性载入全部 src `.ts` 建语料，正则批量查 → `.build-tools/resid-not-in-src.txt`
3. 按特征正则分域

## 🔴 决定性结论

```
残差 533 个：
  src 里有定义或引用:  26
  src 完全没有:      507   ← 真正未迁
```

**两者的机制完全不同：**

| 桶 | 定义 | 解法 | 实测 |
|---|---|---|---|
| tree-shake 差异 | src **有**、bundle 无 | **接宿主**即可翻转 | 6 批 +94 命中 |
| 未定性残差 | src **根本没有** | **必须先迁函数体**，接宿主无效 | — |

之前把两者混为一谈是错的。`verify-signature.cjs` 的注释提到「本项不等于迁移缺陷数」，但一直没量化。

## 507 个未迁符号的域分布

| 域 | 数量 | 备注 |
|---|---:|---|
| **Eryou 养成** | **92** | `getOrCreateProgress`/`levelUpCost`/`breakthroughKey`/`allMaterialTypes`/`applyHpPanelMult`… —— 与 `eryou-ui.ts` 那 66 个未迁规则函数**是同一批** |
| **UI 组件类** | **61** | `TalentShopUiHandler`/`TalentCodexUiHandler`/`JiemingUiHandler`/`PokemonIconAnimHandler`… 属 A4-01 的 18 handler |
| **天赋/时代** | **36** | `challenge`/`immobilize`/`Totem`/`Xingxiang`… |
| **五行/特性** | **18** | `menghuo`/`BugYan`/`undying`/`bloodlust`/`lifeDrain`/`thorn`… |
| squad | 7 | |
| P5X/守卫 | 2 | |
| 其余（战斗/系统函数） | ~291 | 需逐个判是否上游已有 |

## 🎯 投入方向建议（须 owner 决策）

| 方向 | 工作量 | 预期收益 | 风险 |
|---|---|---|---|
| **A. 继续攻 tree-shake（213）** | 小（找宿主即可） | 每批 +10~25 命中（实测 6 批 +94） | 低 |
| **B. 迁 Eryou 92 个规则函数** | **大**（每函数 1~6KB，估 20~40KB 源码） | **+92 命中（+2.9% 覆盖率）** | 中（单文件多、需分批） |
| **C. 迁 UI 组件 61 个** | **极大** | +61 | **高**（三十三/三十四批已两次失败） |
| **D. 先扫 vendor 定白名单** | 小 | 可能削掉部分「未归类」 | 低 |

**建议 A + B 并行**：A 是已验证的高效路径；B 分域拆批（等级/进化/突破/合成/深渊/周常）。
**C 应正式挂账**（已验证不可行）。

## 本批无代码变更（纯侦察）

`tsc` / `vite build` EXIT=0，指标全部不变：命中 2339 · 覆盖率 74.85% · tree-shake 213 · 残差 533。

产出：
- `.build-tools/resid-names.txt` — 残差 533 清单
- `.build-tools/resid-not-in-src.txt` — 507 个真正未迁清单
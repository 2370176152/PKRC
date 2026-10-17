# A3-补 第四十二批 · tree-shake 213 拆解（A 方向到枯竭点）

## 一句话结论

攻了 tree-shake 剩的 213，**+3 命中**。但更重要的是一个决定性发现：
**剩下 210 里 202 个是「UI 阻塞」，接宿主已经解决不了**。

## 落位（`field/pokemon.ts` 3 处）

| 位置 | 内容 |
|---|---|
| `updateInfo()` 开头 | `syncHealerChantFromStacks(this)` |
| `damage()` 反击 if **之后** | `trySeaGuardLighting(this)` |
| `init` 的 `this.ivs =` 之后 | `applyP5XIvs(this.ivs)` |

## 🔴 核心发现：213 里 202 个是 UI 阻塞

用「mod 文件 vs 非 mod 文件」双向语料对比：

| 类别 | 数量 | 含义 |
|---|---:|---|
| 被**非 mod 文件**引用 | **11** | 宿主已接线，只差最后一跳 ⇒ **可攻** |
| **仅 mod 内部**引用 | **202** | 宿主在未接线的 mod 文件里 ⇒ **UI 阻塞** |

那 11 个里，6 个 `sprite-artwork` helper 的宿主是 `PtConstellationUiHandler`（未接线），
`levelUp` 的宿主是 `eryou-ui.ts`（未接线）—— 实际只有 2 个可动，本批已接。

## 战略结论：A 方向收益枯竭

tree-shake 桶 **294 → 210（−84，−28.6%）**，7 批累计。但剩下 210 里 202 个卡在 UI。

**继续攻这 202 个，必须先解决 UI 接线** —— 否则是同一道墙。

## 8 个未归类符号的处置

| 符号 | 处置 |
|---|---|
| `trySeaGuardLighting` · `syncHealerChantFromStacks` | ✅ **本批已接** |
| `healerWishButtonLabel` | ⏳ 挂账（`wishContainer` UI 未迁） |
| `spendAwakeningStones` | ⏳ 挂账（觉醒 UI 未接线） |
| `usedStatusRecently` | ⏳ 挂账（`battleInfo` 未接线） |
| `KONGJIANRoomTag` · `ChengfengTag` | ⏳ 待查 ArenaTag 注册点 |
| `resistId` | ⏳ **不迁**（产物中零调用，死函数） |

## 实测

| 指标 | 上批 | 本批 | Δ |
|---|---:|---:|---:|
| 命中 | 2339 | **2342** | **+3** |
| 覆盖率 | 74.85% | **74.94%** | **+0.09%** |
| tree-shake | 213 | **210** | **−3** |
| 未定性残差 | 533 | 533 | 0 |
| tsc / vite build | EXIT=0 | **EXIT=0** | — |

## 七批 tree-shake 战果

| 批次 | 目标 | 命中 Δ |
|---|---|---:|
| 三十五 | healer【祈愿】 | +9 |
| 三十六 | chixin + dianxin | +22 |
| 三十七 | nianli + mew | +21 |
| 三十八 | mew 会心/防御等 | +5 |
| 三十九 | healer 招式/治疗层 | +23 |
| 四十 | nianli/dianxin 招式层 | +14 |
| 四十二 | updateInfo/damage/init | **+3** |
| **合计** | 294 → **210** | **−84** |

## 下批选项

| 选项 | 说明 |
|---|---|
| **A' 收尾 8 个剩余可动符号** | `KONGJIANRoomTag`/`ChengfengTag` + 另 2 个需再定位宿主。预计 **+2~6** |
| **B' 攻 UI 接线** | 需先设计方案绕开单行长代码（AST 转换 / 整段重写），属独立立项 |
| **C' 迁 UI 组件 61 个** | 已两次失败，需先解决单行长代码 |

**建议**：A' 先做（小、快），然后**必须做 B' 的方案设计**才能继续有实质进展。
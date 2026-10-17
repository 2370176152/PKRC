# A3-补 第三十批 · 超级背包系统收口（§7-b/c/d）概述

## 一句话结论

超级背包「获得 → 激活 → 持久化 → 界面」**数据层全链闭合**：instant effect 入口、存档往返、
`SuperBackpackUiHandler` 类、`TM_ROGUE` 恢复入池全部落地；`tsc`/`vite build` EXIT=0，核心符号 11/11。

## 本批做了什么（4 子项）

| 子项 | 落点 | 产物别名 |
|---|---|---|
| **instant effect 机制** | `talent-system.ts` §11b：`instantEffectHandlers`(Map) + `registerInstantEffect` + `runInstantEffect` + 5 项注册 | `OK`/`rN`/`v_e` |
| **存档序列化** | `mod-augment.ts`（类型）+ `pt-soudache-system.ts`（写）+ `game-data.ts`（读） | — |
| **SuperBackpackUiHandler** | `mod-super-backpack.ts` 追加类（~90 行） | `HV` |
| **TM_ROGUE** | `modifier-type.ts` 补 `TM_ROGUE` + 道具池恢复 | `X.TM_ROGUE` |

其中 instant effect 注册了 5 项：`chaoji_beibao`（激活背包）· `gengduo_juece`（3 黄金球）·
`jiujiqian`（救急钱 `applyEmergencyFunds`）· `nongye_daka`（3 树果袋）· `jingyan_xiaozi`（1 经验护符）。

## 关键发现（2 处勘误）

1. **勘误 E17**：第二十九批记「`ModifierTier.ROGUE` 上游无」是**误判**——v1.11.22 `modifier-tier.ts`
   第 5 行 `ROGUE`（=4）**上游已有**。真正缺的是 **ROGUE 档 TM 池**（产物 `_M` 26 条 `K.ROGUE`，含 10 条
   mod 自创招式）⇒ 迁移版 `TM_ROGUE.generateType` 暂返回 `null`（`generateItem` 容错跳过）。
2. **勘误 E18**：存档路径是**嵌套** `SessionSaveData.talentSystemData.superBackpack`，非第二十九批记的
   顶层 `SessionSaveData.superBackpack`。

## 实测指标

| 指标 | 第二十九批后 | 第三十批后 | Δ |
|---|---:|---:|---:|
| 命中 | 2243 | **2245** | **+2** |
| 覆盖率 | 71.78% | **71.84%** | +0.06% |
| tree-shake 差异 | 291 | 292 | +1 |
| 未定性残差 | 545 | 542 | −3 |
| tsc / vite build | EXIT=0 | **EXIT=0** | 0 回归 |
| 核心上游符号 | 11/11 | **11/11** | — |

`runInstantEffect`/`registerInstantEffect` 两个 keepNames 符号直接命中；`SuperBackpackUiHandler` 落位但
未接线 ⇒ +1 tree-shake。

## 剩余挂账

1. **SuperBackpackUiHandler 接线**（A4-01 UI 批）：`ui.ts` `this.handlers` 按 UiMode 值密集索引，
   须连同 18 个 mod UiMode（48..65）整体接线。
2. **ROGUE 档 TM 池**（modifier 扩展批）：26 条 `K.ROGUE`（含 10 条自创招式）未迁。
3. **gutou_shouji instant effect**（modifier 扩展批）：依赖 `STACKABLE_THICK_CLUB` 未迁。
4. **ERYOU 入口 reset**：依赖 ERYOU 模式初始化大流程。

## 改动文件

- `talent-system.ts`：import 3 项 + §11b instant effect 机制（~90 行）+ 移除悬空 declare
- `mod-super-backpack.ts`：import 6 项 + `SuperBackpackUiHandler` 类 + 道具池恢复 `TM_ROGUE`
- `mod-augment.ts`：`TalentSystemSaveData` 接口 + `SessionSaveData.talentSystemData` 类型化
- `pt-soudache-system.ts`：`getRetreatHistoryEntry` 写 `talentSystemData.superBackpack`
- `game-data.ts`：`initSessionFromData` 恢复 superBackpack + import
- `modifier-type.ts`：补 `TM_ROGUE`（`ModifierTier.ROGUE`）
- 文档：`A3-补-未迁符号清单.md` §36 · 日志 `2026-10-17.md` · `MEMORY.md`

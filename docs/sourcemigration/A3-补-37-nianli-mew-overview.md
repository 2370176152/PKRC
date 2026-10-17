# A3-补 第三十七批 · nianli + mew + 剩余钩子（+21 命中，破 73%）

## 一句话结论

连续第三批丰收。四个系统的战斗钩子全部接进上游 `Pokemon` 的 5 个方法，
**+21 命中**，覆盖率 **73.50%** 创新高。换靶后 3 批累计 **+52**。

## 侦察：4 个系统的宿主全在上游 `Pokemon`

延续 keepNames 反查 + 调用点定位（`.build-tools/a4/probe-next.cjs`），一次定位 **29 个符号**：

| 宿主方法（上游） | 接入的系统函数 |
|---|---|
| `getEffectiveStat()` @4466747 | `dianXinSpatkMultiplier` · `nianLiStatMultiplier` |
| `getMoveEffectiveness()` @4508188 | `mewWeaknessDamageBonus` · `onMewSuperEffectiveHit` |
| `apply()` 最终伤害乘区 @4510598 | `dianXinIncomingMultiplier` · `nianLiDamageMultiplier` |
| `damage()` 保命链 @4515571/4515649 | `tryNianLiEndure` · `tryChiXinEndure` |
| `damage()` 反击分支 @4518274 | `applyDianXinOnHit` |

## 落位（`field/pokemon.ts` 4 处 + 3 组 import）

- `getEffectiveStat()` return 前 —— `stat===SPATK` 时乘 `dianXinSpatkMultiplier`；再乘 `nianLiStatMultiplier`
- `getMoveEffectiveness()` return 前 —— `eff>1` 时加 `mewWeaknessDamageBonus`；
  `!simulated && eff>1 && source.isPlayer()` 时触发 `onMewSuperEffectiveHit`
- `apply()` 最终 `damage.value` 乘区 —— `dianXinIncomingMultiplier` × `nianLiDamageMultiplier`
- `damage()` 保命链 —— 新增 `tryNianLiEndure` + `tryChiXinEndure`
- `damage()` 反击分支 —— 新增 `applyDianXinOnHit`

**顺带销账**：源码里原有的「⚠️ 挂账：`TPe`/`J1e`」和「⚠️ 挂账：`ice`（感电结算）」两处注释，
这批全接上了，注释一并改成已接。

## 本批唯一失误

`dianXinIncomingMultiplier(attacker, target, moveType)` 第 3 参是**属性类型数值**，我误传 `move` 对象 ⇒ TS2345。

**教训延续**：`xxx-system.ts` 的签名常把「招式」收成「招式类型数值」，写调用前先 `grep -A 6` 看签名。

## 实测

| 指标 | 上批 | 本批 | Δ |
|---|---:|---:|---:|
| 命中 | 2276 | **2297** | **+21** |
| 覆盖率 | 72.83% | **73.50%** | **+0.67%** |
| tree-shake | 270 | **249** | **−21** |
| 未定性残差 | 534 | 534 | 0 |
| tsc / vite build | EXIT=0 | **EXIT=0** | — |

## 四批战果：方法论完全验证

| 批次 | 目标 | 投入 | 命中 Δ |
|---|---|---|---:|
| 三十三 + 三十四 | `eryou-ui.ts` | 2 批（回滚 2 次） | **0** |
| 三十五 | healer【祈愿】 | 1 批 | **+9** |
| 三十六 | chixin + dianxin 首轮 | 1 批 | **+22** |
| 三十七 | nianli + mew + 剩余 | 1 批 | **+21** |

**换靶后 3 批 = +52 命中，覆盖率 71.84% → 73.50%（+1.66%）。**

## mod 战斗钩子接法（已定型，继续照此推）

1. `getBaseDamage()` —— 插倍率并乘进 `baseDamage` 公式
2. `apply()` 最终 `damage.value` 乘区 —— 乘承伤/伤害倍率
3. `getEffectiveStat()` return 前 —— 乘能力值倍率
4. `getMoveEffectiveness()` return 前 —— 加属性相性加成（`eff>1` 才加）
5. `damage()` 开头 —— 保命早退
6. `damage()` 保命链 —— 各系统 `tryXxxEndure` 串联
7. `damage()` 反击分支 —— 命中结算

## 剩余可接

mew 剩 ~7（`getCritHitRatio` · `getDefeatDamageMultiplier` · `apply()` 属性表 · `TurnStart`）
｜nianli 剩 2（MoveAttr 层）｜chixin 剩 3｜dianxin 剩 4｜healer 剩 ~20

**宿主全在已接线的上游类，继续按同一 pattern 推进即可。**
# 游戏修改说明 · 晶光星群 / 星晶体系

> 工程：PKRC 本仓库（PokéRogue 中文改版，构建产物发行包，**无 TS 源码**）
> 修改对象：
> - `game/server/dist/assets/loading-scene-By2k7Qfx.js`（4.88 MB，承载星晶/太乐巴戈斯逻辑，以及主菜单「导入存档」的校验）
> - `game/server/dist/assets/index-D3KKGO7Y.js`（2.69 MB，入口 chunk，承载 `DefaultOverrides` 全局配置对象与移动端存档补丁）
> 补丁工具：`tools/game-patcher/patch-game.py`（备份 / 列表 / 撤销 / 语法校验）
> 原文备份：`tools/game-patcher/backup/loading-scene-By2k7Qfx.js.orig`、`tools/game-patcher/backup/index-D3KKGO7Y.js.orig`
> 生效方式：**重启游戏**（关闭 Electron 窗口后重跑 `game/start-game.bat`）；`game/server/server.cjs` 用 `express.static`，按文件 mtime 重新校验

---

## 目录

- [补丁总览](#补丁总览)
- [一、晶光星群 · 属性识别（第 4 轮）](#一晶光星群--属性识别第-4-轮)
- [二、改动 A · 群体化（第 5 轮，第 10 轮定稿）](#二改动-a--群体化第-5-轮第-10-轮定稿为无条件全体)
- [三、改动 B · 星晶倍率固定为 2 倍（第 5 轮）](#三改动-b--星晶倍率固定为-2-倍第-5-轮)
- [四、其它模式与特性的受影响排查](#四其它模式与特性的受影响排查)
- [五、验证记录](#五验证记录)
- [六、可回滚与日常操作](#六可回滚与日常操作)
- [七、可继续调整的功能点（既有备份）](#七可继续调整的功能点既有备份)
- [八、搜打撤（PT）存档导入放行（第 9 轮）](#八搜打撤pt存档导入放行第-9-轮)
- [九、太晶招式类别与归无之光属性（第 10 轮）](#九太晶招式类别与归无之光属性第-10-轮)

---

## 补丁总览

```
$ python tools/game-patcher/patch-game.py list

[applied] tera-starstorm-type                晶光星群属性：解除「必须太乐巴戈斯 + 必须星晶太晶化」
[applied] tera-starstorm-target              晶光星群群体化：无条件命中全体（第 10 轮定稿，删除物种/太晶化判定）
[applied] stellar-multiplier-fixed           星晶倍率：由「太晶化时 2× / 否则 1×」改为恒定固定 2×
[applied] pt-save-import-allow               PT存档导入总开关：PT_MODE_ALLOW_IMPORT_OVERRIDE 默认值 false → true
[applied] pt-save-import-gamemode-literal    移动端PT守卫笔误修正：gameMode===6 → ===10
[applied] tera-move-category-attr            太晶招式类别判定：删除 isTerastallized 前置条件（无条件按双攻高低分物理/特殊）
[applied] nihil-light-category               归无之光招式属性：龙(DRAGON) → 改版自定义属性 CS
```

第 1/2/3/6/7 条作用于 `game/server/dist/assets/loading-scene-By2k7Qfx.js`，第 4/5 条作用于 `game/server/dist/assets/index-D3KKGO7Y.js`；
每处均经逐字符重建比对确认：**当前文件 = 原文件 + 恰好这几处替换**，无任何附带改动。

---

## 一、晶光星群 · 属性识别（第 4 轮）

### 1.1 原来的逻辑

晶光星群（`TERA_STARSTORM`）在招式表里挂 3 个属性：

```js
new v(t.TERA_STARSTORM, R.NORMAL, B.SPECIAL, 120, 100, 5, -1, 0, 9)
    .attr(iP)    // TeraMoveCategoryAttr  ：太晶化时按「攻击 > 特攻」改用物理
    .attr(J5)    // TeraStarstormTypeAttr：太晶化 且 是太乐巴戈斯 → 招式属性改为【星晶】
    .attr(zR, fn)// VariableTargetAttr    ：太晶化 且 是太乐巴戈斯 → 改为打全体
    .partial()   // 招式名后显示 "(P)"
```

被改的 `J5`（`TeraStarstormTypeAttr`）原文（`const dZ=…`）：

```js
apply(s,i,A,a){ if(s.isTerastallized && s.hasSpecies(e.TERAPAGOS)){ const r=a[0]; return r.value=R.STELLAR, !0 } return !1 }
```

### 1.2 改后

```js
apply(s,i,A,a){ const r=a[0]; if(!(r instanceof At))return !1; return r.value=R.STELLAR, !0 }
```

去掉了两个前置判断 → **任何宝可梦使用晶光星群，属性一律变为【星晶】**。
`TeraStarstormTypeAttr` 只被这一个招式引用，不影响其它招式。

---

## 二、改动 A · 群体化（第 5 轮，第 10 轮定稿为无条件全体）

### 2.1 代码位置

**位置**：晶光星群招式定义的第 3 段属性 —— `.attr(zR, fn)`，位于 `loading-scene-By2k7Qfx.js` 偏移 **4 185 665** 附近（`new v(t.TERA_STARSTORM,…)` 那一行内）。

**补丁 id**：`tera-starstorm-target`

```diff
- .attr(zR,(n,s,i)=> n.hasSpecies(e.TERAPAGOS) && n.isTerastallized ? Le.ALL_NEAR_ENEMIES : Le.NEAR_OTHER)
+ .attr(zR,(n,s,i)=> n.isTerastallized                          ? Le.ALL_NEAR_ENEMIES : Le.NEAR_OTHER)
```
（第 5 轮中间态：仅删物种判定）

```diff
- .attr(zR,(n,s,i)=> n.isTerastallized                          ? Le.ALL_NEAR_ENEMIES : Le.NEAR_OTHER)
+ .attr(zR,(n,s,i)=>                                               Le.ALL_NEAR_ENEMIES)
```
（第 10 轮定稿：连 `n.isTerastallized` 三元判定一并删除，**无条件全体**；
`tools/game-patcher/patch-game.py` 中 `tera-starstorm-target` 的 `new` 值即此定稿版本）

即：第 5 轮先删掉 `n.hasSpecies(e.TERAPAGOS) &&`，第 10 轮再把 `n.isTerastallized ? … : …` 三元表达式整体换成 `Le.ALL_NEAR_ENEMIES`。

### 2.2 该属性本身是什么

```js
const zX = class zX extends vs {           // l(zX,"VariableTargetAttr")
  constructor(s){ super(); this.targetChangeFunc = s }
  apply(s,i,A,a){ const r=a[0]; return r.value = this.targetChangeFunc(s,i,A), !0 }
};
let zR = zX;
```

`VariableTargetAttr` 只做一件事：**把目标值写进传进来的 `NumberHolder`**（`a[0].value`）。

真正决定"打谁"的是目标解析函数：

```js
function Lr(n,s,i){                       // l(Lr,"getMoveTargets")
  ...
  Fe[s].hasAttr(zR) ? r = a.value          // ← 带 zR 的招式，目标完全由 attrs 动态决定
                    : r = Fe[s].moveTarget;
  ...
  case Le.NEAR_ENEMY:
  case Le.ALL_NEAR_ENEMIES:
  case Le.ALL_ENEMIES:
  case Le.ENEMY_SIDE:  I = O, S = r !== Le.NEAR_ENEMY;  break;   // ← multiple=true
}
```

> ⚠️ 注意：`AttackMove` 的构造签名会把静态 `moveTarget` 硬写成 `Le.NEAR_OTHER`：
> ```js
> const p8=class p8 extends PC{ constructor(s,i,A,a,r,O,I,S,T){
>   super(s,i,A, Le.NEAR_OTHER, a,r,O,I,S,T) … } }   // l(p8,"AttackMove")
> ```
> 所以 **`move.moveTarget`（静态字段）永远是 3 = `NEAR_OTHER`**，与本次改动无关；
> 只有走 `Lr()` / `sS()`（**动态**路径）的系统才会感受到变化。这个区分是下面影响面分析的钥匙。

### 2.3 受影响的调用方

#### (1) 动态路径 —— **会**受本次改动影响

| 系统 | 位置 | 判定方式 | 改动后的行为 |
|---|---|---|---|
| `sS` = `isMoveDynamicallySpread` | 4 097 839 | `hasAttr(zR)` → 对每个对手求值 → `AOe.has(A.value)`，`AOe={ALL_NEAR_ENEMIES, ALL_ENEMIES}` | **关键枢纽**：任意**太晶化**用户 → 返回 `true`（原版仅太乐巴戈斯+太晶化） |
| `Lr` = `getMoveTargets` | 4 095 854 | 带 `zR` 时 `r=a.value`，`ALL_NEAR_ENEMIES` → `multiple=true` | 太晶化时 `multiple=true`，命中列表 = 全体敌人 |
| **群体伤害衰减** | 4 509 257 | `const {targets:J,multiple:ne}=Lr(s,i.id), ee=ne?J.length:1, Ie=isEryou?.5:.75, k=ee>1?Ie:1` | **双打中命中 ≥2 个目标时，伤害 ×0.75（二游 ×0.5）** |
| 二游深渊 `vle` | 15 870 07 | `singleDown: !jte.includes(moveTarget) && !sS(…)`；`aoeDown: (jte.includes(…) \|\| sS(…))` | 从"吃 `singleDown`"变为"吃 `aoeDown`"（详见 [四](#四其它模式与特性的受影响排查)） |
| 电心回响 `que` | 21 161 63 | `dianXinPendingSingle = !yre(s) && !sS(n,s)` | 太晶化用户 → 记录为"群攻招式" |
| 治愈转化 `toe` | 21 515 89 | `Nhe.has(moveTarget) \|\| sS(n,s)` | 太晶化用户 → 视为群攻（可触发群体治疗转化） |
| 命之座·念力 `oPe` | 36 279 87 | `(qfe(s) \|\| sS(n,s)) && RPe(n)` | 太晶化用户 → 额外触发 `RPe` |
| 念力单体加成 | 36 264 66 | `… \|\| !pRe(s) \|\| sS(n,s) \|\| …` → `return 1` | 仅对**超能系**招式生效；晶光星群是普通/星晶，**实际不触发** |

#### (2) 静态路径 —— **不**受本次改动影响（读的是 `moveTarget` 字段 = 3）

| 系统 | 位置 | 说明 |
|---|---|---|
| `mSe` = `callingCardSpreadPowerMultiplier`（偷心怪盗·群攻威力加成） | 18 778 66 | `dSe.has(s.moveTarget)`，`dSe={ALL_NEAR_ENEMIES,ALL_ENEMIES}`，`NEAR_OTHER` 不在内 → 永远返回 1；PT天赋模式下 `CSe=13`、其它 `hSe=3.2` |
| `hOe` / `Y1e` = `isSpreadMove` / `recordChiXinMoveContext`（赤心） | 4 386 879 | `W1e={ALL_NEAR_ENEMIES,ALL_ENEMIES}` |
| `yre` = `isSpreadMove$1`（电心） | 21 166 25 | `tce={ALL_NEAR_ENEMIES,ALL_ENEMIES}` |
| `qfe` / `pRe` = `isNianLiSpreadMove` / `isNianLiSingleTargetMove`（命之座） | 36 247 08 | `HRe`/`zfe` 集合 |
| `Move.isMultiTarget()` | 3 984 556 | `ALL_OTHERS/ALL_NEAR_OTHERS/ALL_NEAR_ENEMIES/…` |
| `RedirectMoveAbAttr.canRedirect`（引开） | 4 327 365 | `[NEAR_OTHER, OTHER]` → 晶光星群**仍可被引开** |
| `WideGuardConditionFunc`（广域防守） | 3 957 954 | `switch(Fe[s].moveTarget)` → 晶光星群**仍不被广域防守挡下** |
| `DJ.canApplyPreDefend`（先制条件） | 4 269 748 | `!r.isMultiTarget()` |
| `isTypeImmune` / `hitsSubstitute` | 3 984 989 / 3 985 355 | `Le.USER` 判定 |

> 也就是说：**引开（看我嘛/愤怒粉）与广域防守这两个"反制手段"对晶光星群依然无效/无效用**，因为它们读静态字段。这是原版就存在的实现特性，本次改动未改变，但值得知晓。

### 2.4 改动后需要验证的行为

1. **非太晶化**用户 → 单体（`NEAR_OTHER`），只打当前目标，无群体衰减。
2. **任意宝可梦 + 太晶化** → 打全体敌人（`ALL_NEAR_ENEMIES`）。
3. **双打模式（SHUANGDA=9）/ 任意双打战斗 + 太晶化** → 命中 2 个目标，**伤害 ×0.75**；**二游模式下 ×0.5**。
4. **太乐巴戈斯 + 太晶化** → 与改动前完全一致（原条件之一已满足）。
5. **AI 评分**：`getTargetBenefitScore` 等会用 `Lr()` 得到多目标，AI 会更倾向使用它。
6. `sS()` 返回值的连带效果：电心回响、治愈转化、命之座·念力 会把它记作"群攻招式"。

---

## 三、改动 B · 星晶倍率固定为 2 倍（第 5 轮）

### 3.1 前置结论（重要）

**本改版中并不存在任何"星晶倍率"的可调配置。** 已做的全量排查：

| 排查项 | 结果 |
|---|---|
| 关键词 `stellarMultiplier / stellarPower / stellarRate / STELLAR_MULT / stellarBoost / stellarConfig / teraMultiplier / teraBoost / stellarMod / MOD_CONFIG / modConfig` | 全 **0** 命中 |
| 中文 `星晶倍率` | **0** 命中（`星晶` 只出现在 `locales/**` 的招式/特性文案里） |
| `game/server/dist/config/` | **空目录** |
| `settings.json` / `menu.json` 中的倍率字段 | 无 |
| `index-D3KKGO7Y.js`（另一主 chunk，92 处 `setting`）中的 `stellar/Stellar/倍率` | 全 **0** 命中 |
| 各 chunk 的 `STELLAR / isTerastallized / TERAPAGOS` 分布 | **只存在于 `loading-scene-By2k7Qfx.js`**，其余 chunk 全为 0 |

全工程里唯一的"×2"就是 `getAttackTypeEffectiveness` 开头那一个**硬编码三元式**。
因此把"由可调节改为固定为 2 倍、移除原有的可调配置与相关参数"落地为：
**删除那个让倍率在 1×/2× 之间浮动的条件分支，改为恒定返回 2。**

（若你原本指的是别的对象，请见 [3.5 备选方案](#35-备选方案一行可切换)。）

### 3.2 代码位置

**位置**：`Pokemon.getAttackTypeEffectiveness` 方法首行，偏移 **4 491 442**。

**补丁 id**：`stellar-multiplier-fixed`

```diff
  getAttackTypeEffectiveness(s,i,A=!1,a=!0,r){
    var L;
-   if(s===R.STELLAR) return this.isTerastallized ? 2 : 1;
+   if(s===R.STELLAR) return 2;
    const O=this.getTypes(!0,!0), I=E.arena;
    if(s===R.GROUND && (this.isGrounded()||I.hasTag(_e.GRAVITY))) { … }
    let S=O.map(h=>{ const C=new At(MTe(this,s,Do(s,h))); Nn(E.gameMode,rn.TYPE_EFFECTIVENESS,C); … });
    …
  }
```

**语义说明**：此函数挂在**防守方**身上，`s` = 招式属性，`this` = 被攻击方。
- 改前：星晶招式打**已太晶化**的目标 2×，打**未太晶化**目标 1×。
- 改后：星晶招式**恒为 2×**。

**同时保留（未动）的既有事实**：
- 基础克制表 `Do()`（`getTypeDamageMultiplier`）里 `case R.STELLAR: return 1` —— 星晶在基础表里本就无克制死角。
- 挑战系统的属性克制钩子 `Nn(E.gameMode, rn.TYPE_EFFECTIVENESS, C)` 位于 `s===R.STELLAR` 的**提前 return 之后**，因此**星晶永远绕过挑战修正**（例如"逆转之战" `InverseBattleChallenge.applyTypeEffectiveness`）。改动没有改变这一点。

### 3.3 受影响的调用方（`getAttackTypeEffectiveness` 共 19 处调用）

| # | 调用点 | 偏移 | 用途 / 改动后的行为 |
|---|---|---|---|
| 1 | **主伤害路径** `I=new At(… ? this.getAttackTypeEffectiveness(O,s,!1,a,i) : 1)` | 4 490 743 | 星晶招式伤害倍率 → 恒 2×（**核心**） |
| 2 | `getDamageHpRatio`（隐形岩，`R.ROCK`） | 3 963 896 | 岩属性，不涉及星晶 |
| 3 | `getDamageHpRatio`（`R.STEEL`） | 3 973 910 | 钢属性，不涉及 |
| 4 | `getTargetBenefitScore`（`AttackMove`） | 3 990 780 | AI 评分 → 星晶招更"受宠" |
| 5 | `SacrificialAttr` | 3 998 950 | 献祭类特性判定 |
| 6 | `SacrificialAttrOnHit` | 3 999 309 | 同上 |
| 7 | `HalfSacrificialAttr` | 3 999 790 | 同上 |
| 8 | `FlyingTypeMultiplierAttr` | 4 047 199 | 飞行系相关，不涉及星晶 |
| 9 | `COLLISION_COURSE` 条件 `>=2 ? 5461/4096 : 1` | 4 182 516 | 星晶攻击 → 恒 ≥2 → **必然触发该增益** |
| 10 | `ELECTRO_DRIFT` 条件（同上） | 4 182 649 | 同上 |
| 11 | `FieldPriorityMoveImmunity` / `canApplyPreDefend` | 4 268 783 | 免先制判定 |
| 12 | `getAnticipationCondition`（`>=2`） | 4 310 741 | 预知危险预警：星晶招**恒** ≥2 |
| 13 | 幽灵免疫判定 `includes(R.GHOST) \|\| (includes(R.STELLAR) && …)` | 4 324 613 | 属性免疫链 |
| 14 | 钢免疫判定（同上结构） | 4 348 277 | 属性免疫链 |
| 15 | **主伤害路径**（同一处，AI 分支） | 4 490 743 | — |
| 16 | `calculateMoveEffectiveness`（AI 打分 `S=…`) | 4 492 501 | AI 更爱用星晶招 |
| 17 | 同上（第二属性） | 4 492 568 | — |
| 18 | 同上（对 `[R.GHOST, R.STEEL,…]` 数组） | 4 492 626 | — |
| 19 | 同上（最终回写） | 4 492 697 | — |

> 结论：真正的**玩法影响**是 #1（伤害）、#9/#10（星晶必然触发"碰撞路线/电光漂移"式的 ≥2 判定）、#12（预知危险预警强度）、#4/#16-#19（AI 更倾向使用星晶招）。其余为属性免疫/献祭类判定，星晶路径不会走到或不受影响。

### 3.4 改动后需要验证的行为

1. 未太晶化状态下用晶光星群打**未太晶化**目标 → 与改动前对比，伤害应**明显提高**（1× → 2×）。
2. 打**已太晶化**目标 → 数值与改动前一致（2×）。
3. 基础克制表仍为 1×（`Do()` 未动）→ 星晶仍无被抵抗死角。
4. 挑战模式（逆转之战等）中星晶招不受 `applyTypeEffectiveness` 影响 —— 应保持。
5. AI 在敌方持有星晶招时更倾向使出（`getTargetBenefitScore`）。
6. 与"预知危险"特性联动：敌队有星晶招时必定触发预警。
7. 星晶招式来源共 3 类，均受影响：① 晶光星群（现对所有人恒为星晶）② `TERA_BLAST`（太晶属性为星晶时，`TeraBlastPowerAttr` 令威力 100）③ 任何被改成星晶属性的招式。
8. **组合效果提醒**：晶光星群 + 改动 A/B 叠加后 = 120 威力、100 命中、对全体、对**任何**目标恒 2×（等效 240）。这是本次两处改动的合力，属于预期内的强强度，但请确认符合你的设计目标。

### 3.5 备选方案（一行可切换）

若你想要的其实不是"恒 2×"，把 `patch-game.py` 中 `stellar-multiplier-fixed` 的 `'new'` 改成下面任一行即可：

| 想要的语义 | `'new'` 内容 |
|---|---|
| 恒 1.5× | `if(s===R.STELLAR)return 1.5;` |
| 恒 2×（当前） | `if(s===R.STELLAR)return 2;` |
| 保持原版（太晶化才 2×） | `if(s===R.STELLAR)return this.isTerastallized?2:1;` |
| 恒 1×（无克制死角也不增伤） | `if(s===R.STELLAR)return 1;` |

改完执行 `python tools/game-patcher/patch-game.py revert` 再 `apply` 即可（工具会先还原再套用新值）。

---

## 四、其它模式与特性的受影响排查

### 4.1 八大师模式（`GameMode.BDS = 5`）

**结论：无需同步改代码；仅"继承"新规则。**

- 定义位置 2 303 826：`case 5: return new Cn(5,{ isBds:!0, isChallenge:!0, hasTrainers:!0, hasMysteryEncounters:!0, daoguan:!0 }, iSe)`
- 它是一套**挑战标志位组合**，全工程 12 处 `BDS` 引用全部是：成就（`BDS_VICTORY` 2 189…）、会话统计（`bdsSessionsPlayed/Won`）、BGM/训练家判定（与 `isClassic/isHuo/ishuizhi/isShuangda` 并列）、模式名文案。
- **没有任何** Terapagos / Stellar / 属性克制 / 目标判定的专属代码。
- 挑战系统里唯一覆写属性克制的类只有 `InverseBattleChallenge`（3 852 334），而八大师并未挂载它。

✅ **验证要点**：进入八大师模式任意一场战斗，用太晶化后的晶光星群 → 应正常打全体；数值与在经典模式下一致（无模式专属折扣）。

### 4.2 二游模式（`GameMode.ERYOU = 12`）

**结论：受改动 A 影响（一处），受改动 B 影响（叠乘），需按下面的验证点核对。**

二游是**独立的大系统**：`E.gameMode.isEryou`、`E.eryouSession`、`ERYOU_LOBBY / TRAINER_SELECT / STARTER_SELECT(eryou) / HELD_SYNTHESIS / REWARD` 一整套 UI 与相位，还有敌方面板乘区（`Dw(a.level)` 血量 ×N、深渊攻/坦 ×N）、Z 招式替换（`YCe`）、形态禁用回退（小智的皮卡丘等）、深渊机制 buff 图标等。

与本次改动**直接相交**的只有一处 —— **深渊机制乘区**（偏移 15 864 36）：

```js
const jte=[Le.ALL_NEAR_ENEMIES, Le.ALL_ENEMIES, Le.ALL_NEAR_OTHERS, Le.ALL_OTHERS, Le.BOTH_SIDES, Le.ALL];
const RN = { typeDown:.5, physicalDown:.7, specialDown:.7, singleDown:.7, aoeDown:.7 };

function vle(n,s){                       // l(vle,"getEryouAbyssMechanismMultiplier")
  const i=E.eryouSession;
  if(!E.gameMode?.isEryou || i?.kind!=="abyss" || !i.mechanisms?.length || !n.isPlayer()) return 1;
  let A=1;
  for(const O of i.mechanisms) switch(O.id){
    case "typeDown":     O.type!==void 0 && s.type===O.type     && (A*=RN.typeDown);     break;
    case "physicalDown": s.category===B.PHYSICAL                && (A*=RN.physicalDown); break;
    case "specialDown":  s.category===B.SPECIAL                 && (A*=RN.specialDown);  break;
    case "singleDown":   !jte.includes(s.moveTarget) && !sS(n,s)          && (A*=RN.singleDown); break;
    case "aoeDown":      (jte.includes(s.moveTarget)|| sS(n,s))           && (A*=RN.aoeDown);    break;
  }
  return A;
}
```

**受影响的机制**：

- `s.moveTarget` 是**静态字段** = `NEAR_OTHER`（晶光星群建类时被 `AttackMove` 构造器硬写），所以 `jte.includes(...)` 恒为 `false`。
- 因此两个机制的判定**完全取决于 `sS(n,s)`（动态）**：
  - 改动前：非太乐巴戈斯用户 `sS=false` → 命中 `singleDown`（×0.7），不命中 `aoeDown`。
  - 改动后：**太晶化**用户 `sS=true` → **不再吃 `singleDown`，改为吃 `aoeDown`**。
- `singleDown` 与 `aoeDown` **数值相同（都是 0.7）**，所以：
  - 深渊**同时**存在 `singleDown` 与 `aoeDown` → **净效果不变**；
  - 深渊**只有** `singleDown` → 晶光星群**变强**（免掉 ×0.7）；
  - 深渊**只有** `aoeDown` → 晶光星群**变弱**（新增 ×0.7）。

**受改动 B 影响**：二游深渊的敌方增伤/减伤、面板乘区、`typeDown/physicalDown/specialDown` 都是**独立乘区**，与星晶 2× **相乘**。此外二游的**群体伤害衰减是 0.5（而非 0.75）**：
```js
Ie = E.gameMode?.isEryou ? .5 : .75;  k = ee>1 ? Ie : 1;   // @4 509 257
```
→ 改动 A 让晶光星群在二游双打里吃 **×0.5**，比其它模式更狠。

✅ **验证要点**：
1. 二游（非深渊，`kind!=="dungeon/abyss"`）战斗中晶光星群照常工作。
2. 深渊层：分别构造"仅 `singleDown`"与"仅 `aoeDown`"两种机制，确认伤害从 0.7 倍的那一档平滑切换（数值应相同）。
3. 二游双打：太晶化 + 晶光星群 → 两个目标各 ×0.5，与星晶 2× 叠乘后核对总伤害。
4. 深渊要害档位读取（`getEryouAbyssCritStageBonus`）、副本强化状态标（`syncEryouAbyssBuffBadges`）不应报错（有 `try/catch` + `console.warn`）。

### 4.3 第三特性（多被动："特性的三被动"）

**结论：无需同步改代码；但它能让"任意宝可梦"拿到太晶相关特性，从而放大改动 A 的覆盖面 —— 需要留意。**

实现链路：

| 环节 | 位置 | 说明 |
|---|---|---|
| 数据字段 | `customPokemonData.triplePassives`（长度 3 的数组） | 4 481 844 复制、4 591 844 `setTriplePassive` |
| 挑战挂载 | `TRIPLE_PASSIVE` 挑战（`c1`/`ZD`），`applyStarterModify` / `applyPokemonInBattle` | 3 858 321 / 3 858 358 |
| 天赋挂载 | 天赋 id = 10（`_.id===10 && _.value>0`） | 20 740 20，文案「觉醒了三被动能力！」 |
| 随机生成 | `generateTriplePassives` | 20 740 20：排除 `CSSL1..18`、`WONDER_GUARD`、`NEUTRALIZING_GAS`；另排除 `CLOUD_NINE`/`AIR_LOCK`；再排除本体已有特性；随机取 3 个 |
| 挑战版排除表 | `getTriplePassiveExcludedAbilities()` | 3 858 688：`CSSL1..18` + `WONDER_GUARD` + `KBTX..KBTX11` |
| 生效 | `getAllPassiveAbilities()` → `getAbilityAttrs()` | 4 482 540 / 4 482 963：主特性 attrs + 3 个被动的 attrs **合并生效** |
| 判定入口 | `hasAbility` / `hasAbilityWithAttr` / `hasAbilityInCurrentSlot` | 4 484 920+ 全部遍历被动 |
| UI | `SummaryUiHandler`：`createMultiplePassiveGrid` / `populateMultiplePassiveGrid`，「特性和被动」4 格 | 2 253 492 / 2 278 603 |

与本次改动的关系：

- 三被动**不覆写**属性克制或目标判定，也没有 Terapagos/Stellar 专属分支 → **改动 A/B 无需为它做任何同步调整**。
- 但随机池**没有排除** `TERA_SHIFT`（太晶形变）/ `TERA_SHELL`（太晶甲壳），所以任何宝可梦都可能抽到它们：
  - `TERA_SHIFT` 只做**形态切换**（`new Ee(o.TERA_SHIFT,9).attr(LO,n=>n.getFormKey()?0:1)…`，4 370 889），**不会**把 `isTerastallized` 置真 —— 全场唯有 `TerastallizePhase.end()`（2 531 468）会置真。
  - 因此抽到 `TERA_SHIFT` **不会**自动满足改动 A 的 `isTerastallized` 条件，也不会改变 `getTeraType()`（后者要求 `hasSpecies(TERAPAGOS)`，4 489 336）。
- 三被动是**乘区叠加**：若同时抽到属性增伤类特性，会与星晶 2× 相乘。

✅ **验证要点**：
1. 抽满三被动的宝可梦：面板「特性和被动」应显示 1 主 + 3 被动，战斗中特性生效无报错。
2. `setTriplePassive` / 融合（4 590 454 融合取被动）后被动数量仍为 3。
3. 抽到 `TERA_SHIFT`/`TERA_SHELL` 时：确认**不会**自动太晶化（`isTerastallized` 仍为 false），晶光星群仍为单体。

### 4.4 其它相关模式速查

| 模式 | `modeId` | 与改动 A/B 的关系 |
|---|---|---|
| 经典 CLASSIC | 0 | 继承新规则 |
| 无尽 ENDLESS | 1 | 继承；无专属克制覆盖 |
| 融合无尽 SPLICED_ENDLESS | 2 | 继承；融合被动会叠加（同 4.3） |
| 每日 DAILY | 3 | 继承 |
| 挑战 CHALLENGE | 4 | 继承；**逆转之战**的 `applyTypeEffectiveness` 对星晶**不生效**（提前 return） |
| 八大师 BDS | 5 | 见 4.1 |
| 火箭队 HUO | 6 | 仅标志位，继承 |
| 高种族值 HARD | 7 | 仅标志位，继承 |
| 挥指 HUIZHI | 8 | 仅标志位，继承（招式随机 → 可能随机到晶光星群） |
| **双打 SHUANGDA** | 9 | **重点**：改动 A 在此模式触发**群体衰减 ×0.75**（二游 ×0.5） |
| PT搜打撤 PT_SOUDACHE | 10 | `isPtTalentMode`（= `isPtSoudache && hasDynamicBalance`）下的天赋群攻加成 `mSe` 走**静态**字段 → 不受改动 A 影响；改动 B 的 2× 与 PT 倍率相乘 |
| P5X | 11 | `hasDynamicBalance:!0`；P5X 感电/万钧等"单体招式/非全体敌人招式"文案判定见 21 16 49 一带，若相关技能用 `sS()` 动态判定则受影响（晶光星群是普通/星晶系，一般不触发其电/火系条件） |
| 二游 EROY | 12 | 见 4.2 |

---

## 五、验证记录

### 5.1 语法校验

```
$ python tools/game-patcher/patch-game.py verify
OK   loading-scene-By2k7Qfx.js
```

### 5.2 改动范围证明（逐字符重建比对）

用 `patch-game.py` 的 `PATCHES` 依次把 3 处替换套回原文备份，再与当前文件逐字符比对：

```
补丁数 = 3
重建字符数 = 4822861   当前文件 = 4822861
>>> 逐字符完全一致 = True
```

→ 当前文件 = 原文件 + **恰好 3 处替换**，没有任何附带改动。

### 5.3 行为级单元验证（隔离抽取被改代码）

脚本：`.workbuddy/scratch/test_stellar_patches.cjs`（从一个 4.88 MB bundle 中定点抽出 3 段代码，注入枚举/基类桩后执行）：

```
PASS 原版 · 普通宝可梦+未太晶化 => 不生效            {applied:false, value:0}
PASS 原版 · 太乐巴戈斯+太晶化 => 星晶                {applied:true,  value:18}
PASS 补丁后 · 普通宝可梦+未太晶化 => 星晶            {applied:true,  value:18}
PASS 补丁后 · 太乐巴戈斯+太晶化 => 星晶              {applied:true,  value:18}
    原版目标函数 : (n,s,i)=>n.hasSpecies(e.TERAPAGOS)&&n.isTerastallized?Le.ALL_NEAR_ENEMIES:Le.NEAR_OTHER
    补丁后目标函数: (n,s,i)=>n.isTerastallized?Le.ALL_NEAR_ENEMIES:Le.NEAR_OTHER
PASS 原版 · 非太乐巴戈斯+太晶化 => 单体(3)
PASS 原版 · 太乐巴戈斯+太晶化 => 全体(6)
PASS 补丁后 · 非太乐巴戈斯+未太晶化 => 单体(3)   [保留 isTerastallized]
PASS 补丁后 · 非太乐巴戈斯+太晶化 => 全体(6)
PASS 补丁后 · 太乐巴戈斯+太晶化 => 全体(6)
    原版倍率分支 : if(s===R.STELLAR)return this.isTerastallized?2:1;
    补丁后倍率分支: if(s===R.STELLAR)return 2;
PASS 原版 · 星晶攻 × 未太晶化防守方 => 1x
PASS 原版 · 星晶攻 × 已太晶化防守方 => 2x
PASS 补丁后 · 星晶攻 × 未太晶化防守方 => 2x
PASS 补丁后 · 星晶攻 × 已太晶化防守方 => 2x
PASS 补丁后 · 非星晶攻 => 保持原判定

==== 结果: 14 通过 / 0 失败 ====
```

### 5.4 可回滚验证（md5）

```
改动后 md5     = 9df3722915a8084751d878cf5485b6d6
还原后 md5     = 854e6fe8265699ba3ac9b6c8bbbdb380   （= 原文 md5，逐字节一致）
重新应用后 md5 = 9df3722915a8084751d878cf5485b6d6
```

---

## 六、可回滚与日常操作

```bash
# 查看补丁状态
python tools/game-patcher/patch-game.py list

# 应用全部 / 单条
python tools/game-patcher/patch-game.py apply
python tools/game-patcher/patch-game.py apply tera-starstorm-target

# 撤销全部（从 backup 还原）
python tools/game-patcher/patch-game.py revert

# 语法校验
python tools/game-patcher/patch-game.py verify
```

**新增改动**：编辑 `patch-game.py` 顶部的 `PATCHES` 列表，填 `id / file / desc / old / new` 即可（`old` 必须在原文中唯一）。

---

## 七、可继续调整的功能点（既有备份）

> 每项给出：**改动位置 → 用途 → 预期效果**。★ = 改动小、性价比高。

### A. 晶光星群 / 星晶 线

| # | 功能点 | 位置 | 用途 | 预期效果 |
|---|---|---|---|---|
| A1 ✅ | 晶光星群**群体化**解除限制 | 招式定义 `.attr(zR,…)` | 让非太乐巴戈斯也能打全体 | **已完成**（本次改动 A），保留 `isTerastallized` |
| A2 ★ | 晶光星群**物/特自适应**解除限制 | `TeraMoveCategoryAttr.apply` 里的 `s.isTerastallized&&` | 非太晶化也能自动选更高攻的一侧 | 物攻手/特攻手都能打出高伤，无需先太晶化 |
| A3 ✅ | 星晶**克制倍率**固定 | `getAttackTypeEffectiveness` | 控制星晶招式强度 | **已完成**（本次改动 B），恒 2×；若要 1.5× 见 3.5 |
| A4 | 去掉 `.partial()` 标记 | 晶光星群定义末尾 | 走"完全实现"的显示 | 招式名不再显示 "(P)" |
| A5 | 星晶**太晶增伤**放宽 | 伤害计算 `s.isTerastallized&&Te===R.STELLAR&&(!s.stellarTypesBoosted.includes(d)\|\|s.hasSpecies(e.TERAPAGOS))` | 让非太乐巴戈斯也享受星晶太晶增伤 | 太晶化为星晶后 +0.2/+0.5 增伤对所有宝可梦生效（上限 2.25） |
| A6 | 太乐巴戈斯**星晶形态**解锁条件 | 形态数据 / 进化条件 | 自由获得星晶形态 | 非太乐巴戈斯也能进入星晶形态（改动面较大，需动形态表） |
| A7 | **广域防守 / 引开**对晶光星群生效 | `WideGuardConditionFunc`(3 957 954)、`RedirectMoveAbAttr.canRedirect`(4 327 365) | 补上"群体化"后的反制手段 | 改动 A 让晶光星群实打实打全体，但这两个反制仍读**静态** `moveTarget` 而失效；若想补齐，改为调用 `sS()` 动态判定 |

### B. PT（PT搜打撤）线

| # | 功能点 | 位置 | 用途 | 预期效果 |
|---|---|---|---|---|
| B1 ★ | **本局 PT 直接修改** | 存档字段 `ptSoudacheEarned` | 免刷、直接调本局 PT | 存档修改器加输入框：改成 999999 即可随便花 |
| B2 ★ | **PT 获取全局倍率** | `xw()`：`…ptMultiplier??1` | 一劳永逸调整产速 | 改成 `??5` → 本局所有 PT 收入 ×5 |
| B3 | **区间挑战奖励**调值 | 挑战池 `ptReward`（8 条） | 平衡各难度回报 | 调高某条 → 选该难度立刻拿更多 PT |
| B4 | **区间增益消耗**调值 | 同上 `ptCost`（如"增幅"5000） | 让增益更易/更难买 | 改小 → 便宜能用 |
| B5 | **天赋商店刷新费** | `Dh(n)` / `PM(n,s)=Dh(n)*(s+1)` | 控制刷新成本 | 改成固定 `*1` → 刷新永远最便宜 |
| B6 | **死战不退加成** | 结算 `T=Math.floor(A*.5)` | 调节该模式收益 | 改 `.5` → PT 翻倍 |
| B7 | **死亡惩罚**减免 | `E.ptSoudacheEarned=0` | 降低挫败感 | 改为 `*=0.5` 或删除 |
| B8 | **起始 PT / 起始道具** | `ptSoudacheStartingItems` | 开局给资源 | 缩短前期爬坡 |
| B9 | **护符金币 PT 加成** | 撤离结算 20%/个 | 强化该道具 | 金币流收益更高 |

### C. 其它高价值候选

| # | 功能点 | 用途 | 预期效果 |
|---|---|---|---|
| C1 | 天赋系统参数（`refreshCount` 上限 5、`pityCounter` 保底） | 控制天赋获取节奏 | 提高上限/降低保底 → 更快拿到想要的天赋 |
| C2 | 天赋商店 PT 定价（`Dh` 基数/阶梯 `mIe`/`BIe`） | 整体调价 | 全商店打折或涨价 |
| C3 | 存档修改器侧补 **PT 编辑面板** | 免手工改 JSON | 与 B1 配套，图形化改 PT（零风险，推荐先做） |
| C4 | 三被动随机池排除 `TERA_SHIFT`/`TERA_SHELL` | 避免形态异常 | 在 `generateTriplePassives`(2 074 020) / `getTriplePassiveExcludedAbilities`(3 858 688) 的排除表里加入 |

---

## 八、搜打撤（PT）存档导入放行（第 9 轮）

### 8.1 问题现象

用户导出的 PT 存档 `sessionData1_Guest (1).prsv` **无法导入游戏**，被提示：

> **PT搜打撤模式的存档不允许导入！**
> 请使用游戏内的撤离功能保存PT。

该提示是**改版作者主动加的限制**（原版 PokeRogue 没有这段逻辑），目的是逼玩家走"游戏内撤离"这条正规存档路径。

### 8.2 先排除的干扰项

在动手前逐项证伪，确认**唯一**的拦路点就是这个守卫：

| 假设 | 结论 | 依据 |
|---|---|---|
| 存档文件损坏 / 密钥不对 | ❌ 排除 | 文件是 CryptoJS 的 base64(`Salted__`) 密文；用游戏内同一密钥 `QN="x0i2O7WRiANTqPmZ"` 走 EVP_BytesToKey(MD5)+AES-256-CBC 解出 **12 243 字符合法 JSON** |
| 结构校验不过（`party`/`enemyParty`/`timestamp`） | ❌ 排除 | `party` 长度 1、`enemyParty` 长度 1、`timestamp=1791552223451`，三项齐全 |
| `gameVersion` 不匹配触发迁移 | ❌ 排除 | 存档 `gameVersion="5.1.0"`，而当前游戏版本常量正是 `const _P="5.1.0"`，**完全一致**，不触发任何迁移 |
| 离线模式下 `Er()` 联系服务器失败 | ❌ 排除 | `ai`(=bypassLogin) = `hPe()\|\|(typeof window.Capacitor!=="undefined")\|\|false`；index chunk 会先执行 `pe=Oj(globalThis)` 把 `window.Capacitor` 挂上，故 `ai=true`，`Er()` 直接返回、不联网（这也解释了文件名里的 `_Guest`） |
| 存档修改器读不出来 | ❌ 排除 | 修改器能正常解密并把 PT 面板渲染出来 |
| **游戏内的 PT 导入守卫** | ✅ **真凶** | 见下 |

### 8.3 根因：两处守卫，其中一处是笔误

**守卫 ①（真正生效的那处）** — 在 `loading-scene-By2k7Qfx.js` 的 `GameData.importData()`，`case Vi.SESSION` 分支：

```js
case Vi.SESSION:
  const f = this.parseSessionData(L);
  if (h = !!f.party && !!f.enemyParty && !!f.timestamp,
      h && f.gameMode === $t.PT_SOUDACHE && !ye.PT_MODE_ALLOW_IMPORT_OVERRIDE) {
    E.ui.showText(`PT搜打撤模式的存档不允许导入！\n请使用游戏内的撤离功能保存PT。`, null, () => E.ui.showText("", 0), St(3e3));
    return;
  }
  break;
```

`$t.PT_SOUDACHE = 10`，而本存档 `gameMode = 10` → 命中拦截。

**守卫 ②（本环境下不执行，但有笔误）** — 在 `index-D3KKGO7Y.js` 的 `Uj()`（`patchMobileExport`）里，它**整体替换**了 `window.gameData.importData`：

```js
case 1:
  const m = JSON.parse(u);
  if (o = !!m.party && !!m.enemyParty && !!m.timestamp,
      o && m.gameMode === 6 && !Gj.PT_MODE_ALLOW_IMPORT_OVERRIDE) {   // ← 这里
    alert(`PT搜打撤模式的存档不允许导入！\n请使用游戏内的撤离功能保存PT。`), y(); return;
  }
  break;
```

`=== 6` 是**笔误**：`GameMode` 枚举里 `6 = HUO(火箭队)`、`10 = PT_SOUDACHE`，
与它自己的提示文案"PT搜打撤模式"自相矛盾 —— 疑似把 `10` 误写成了十进制 `6`。

> **为什么守卫 ② 在本机不会触发**：`Uj()` 开头是 `if(!yh.isNativePlatform())return;`，
> 而 `isNativePlatform()` ⇔ `getPlatform() !== "web"`，平台只在 `window.androidBridge`
> 或 `window.webkit.messageHandlers.bridge` 存在时才是 `android`/`ios`。
> 本机是 nativefier 打包的 Windows Electron，两个探针都不存在 → 平台 = `"web"`
> → `Uj()` **立即 return**，移动端补丁根本没挂上 → 导入实际走的是**守卫 ①**。
> （即便如此，守卫 ② 的笔误仍然要修，否则一旦哪天做成安卓包，它会去拦错模式。）

### 8.4 为什么改一个开关就能同时解掉两处

两处守卫读的是**同一个对象**：

```
index-D3KKGO7Y.js:
    const Bj = {};                                  // 用户覆盖配置的合并点，全文件仅此一处，从不被改写
    const oT = class oT { constructor(){ ... this.PT_MODE_ALLOW_IMPORT_OVERRIDE = !1 ... } };
    r(oT, "DefaultOverrides");
    let Fg = oT;
    const Nj = new Fg,        // 唯一一次实例化
          Gj = { ...Nj, ...Bj };                    // ⇒ Gj 是 DefaultOverrides 的逐字拷贝
    ...
    export { ..., Gj as O, ... };

loading-scene-By2k7Qfx.js:
    import { ..., O as ye, ... } from "./index-D3KKGO7Y.js";
                          ↑ 同一个对象的两个名字：ye === Gj
```

所以 `this.PT_MODE_ALLOW_IMPORT_OVERRIDE = !0` 之后：
- 守卫 ① 的 `!ye.PT_MODE_ALLOW_IMPORT_OVERRIDE` → `!true` = **false** → 不再拦截；
- 守卫 ② 的 `!Gj.PT_MODE_ALLOW_IMPORT_OVERRIDE` → `!true` = **false** → 不再拦截。

且全工程只有 3 处引用该字段（1 处定义 + 2 处守卫），**没有任何运行时写入方**，所以默认值即最终值，不会被别处改回去。

### 8.5 补丁内容（2 条，均在 `index-D3KKGO7Y.js`）

| id | old | new | 作用 |
|---|---|---|---|
| `pt-save-import-allow` | `this.PT_MODE_ALLOW_IMPORT_OVERRIDE=!1` | `this.PT_MODE_ALLOW_IMPORT_OVERRIDE=!0` | 总开关置为"允许"，同时解掉两处守卫 |
| `pt-save-import-gamemode-literal` | `o&&m.gameMode===6&&!Gj.PT_MODE_ALLOW_IMPORT_OVERRIDE` | `o&&m.gameMode===10&&!Gj.PT_MODE_ALLOW_IMPORT_OVERRIDE` | 修正移动端守卫的枚举值笔误 |

> `loading-scene-By2k7Qfx.js` **本次未做任何改动** —— 这正是"使用作者预留的总开关"而非"砸掉守卫"的好处：
> 主分支的既有 3 个补丁保持原样，不引入任何新的中文文案往返风险。

### 8.6 验证记录

1. **语法校验**（`patch-game.py verify`）：
   ```
   OK   loading-scene-By2k7Qfx.js
   OK   index-D3KKGO7Y.js
   ```
2. **字节校验**：`this.PT_MODE_ALLOW_IMPORT_OVERRIDE=!1` → 0 处、`=!0` → 1 处；
   `m.gameMode===6&&!Gj…` → 0 处、`m.gameMode===10&&!Gj…` → 1 处。文件体积 2 686 315 → **2 686 316** B（`===6`→`===10` 净 +1 字节）。
3. **行为级回归测试**（`.workbuddy/scratch/bin/pt_guard_test.cjs`，**21 项全部通过**）：
   从两个 chunk 里**原文抽出**守卫表达式，喂进 `new Function` 求值：

   | 用例 | 补丁前 | 补丁后 |
   |---|---|---|
   | PT 存档（`gameMode=10`）走主菜单导入 | **被拦** ✅复现 | **放行** ✅ |
   | 火箭队存档（`gameMode=6`） | 不受该守卫影响 | 不受影响 |
   | 经典模式（`gameMode=0`） | 不受影响 | 不受影响 |
   | 缺 `enemyParty` 的坏存档 | 判无效 | **仍判无效**（补丁没有放宽有效性校验） |
   | 移动端守卫 `===10`（关掉总开关单独验） | 拦不到 PT、误拦火箭队 | 正确拦 PT、不再误拦火箭队 |

4. **端到端回归测试**（`.workbuddy/scratch/bin/pt_import_e2e.cjs`，**11 项全部通过**）：
   把 `loading-scene` 里**真实的 `importData` 方法原文**（2154 字符）连同括号配平一起抽出来，
   用桩替换 DOM / FileReader / CryptoJS / 网络 / UI，喂入用户那份**真实存档的明文**，
   验证完整控制流：

   | 场景 | 补丁前 | 补丁后 |
   |---|---|---|
   | 提示文案 | `PT搜打撤模式的存档不允许导入！…` | `Your session data will be overridden…Proceed?` |
   | `localStorage` 写入 | **无**（在 `return` 处截断） | **`sessionData1_Guest`**，且内容为加密串 |
   | `window.location.reload()` | 未触发 | **触发 1 次** |
   | 缺 `enemyParty` 的坏存档 | 判无效 | **仍判无效**，不写库、不刷新 |

### 8.7 使用方式

1. 完全关闭游戏窗口（Electron 进程），重新运行 `game/start-game.bat`；
2. 主菜单 → **设置 → 导入存档** → 弹出「选择要导入到的存档位。」→ 选 **存档位 2**；
3. 选择 `sessionData1_Guest (1).prsv`；
4. 弹出 `Your session data will be overridden and the page will reload. Proceed?` → 确认；
5. 写入 `localStorage["sessionData1_Guest"]` → `window.location.reload()`，导入完成。

> ⚠️ **存档位与文件名的对应关系（容易踩坑，属原版设计而非本改版的 bug）**
>
> 存储键由 `kS(Vi.SESSION, slot)` 生成，源码为：
> ```js
> case Vi.SESSION: let i = "sessionData"; return s && (i += s), i;
> ```
> 即 **slot=0 时是 `sessionData`，slot≥1 时才追加数字**（slot 1 → `sessionData1`）。
>
> | 菜单显示 | `slot` 实参 | 生成的键 | 导出文件名 |
> |---|---|---|---|
> | 存档位 1 | 0 | `sessionData` | `sessionData_Guest.prsv` |
> | **存档位 2** | **1** | **`sessionData1`** | **`sessionData1_Guest.prsv`** ← 本次这份 |
> | 存档位 3 | 2 | `sessionData2` | `sessionData2_Guest.prsv` |
>
> 菜单里的 `slotNumber` 取自 `U+1`，而传进 `importData` / `tryExportData` 的是 `U`，
> 所以**文件名里的数字 = 菜单位号 − 1**。要还原这份存档，必须选 **存档位 2**；
> 若误选"存档位 1"，文件会被写进 `sessionData_Guest`，即覆盖掉**另一个槽位**的存档。
>
> 另外注意：`importData` 的第一参数是**数据类型**、第二参数才是**槽位**
> （菜单调用原文：`E.gameData.importData(Vi.SESSION, L)`）。
> 导出侧同理：`tryExportData(s, i=0)` 内为 `` `${kS(s,i)}_${ze.username}.prsv` ``。

### 8.8 回滚

```bash
# 只撤销 PT 导入放行（改回 !1），恢复"禁止导入 PT 存档"
python tools/game-patcher/patch-game.py revert pt-save-import-allow

# 或者直接从备份还原整个 index chunk
cp tools/game-patcher/backup/index-D3KKGO7Y.js.orig game/server/dist/assets/index-D3KKGO7Y.js

# 撤销全部 7 条补丁（两个文件都还原到最初）
python tools/game-patcher/patch-game.py revert
```


---

## 九、太晶招式类别与归无之光属性（第 10 轮）

> 本节为 2026-10 目录整理时的**补丁化追认**：以下两处改动此前以手工编辑方式直接作用于
> `game/server/dist/assets/loading-scene-By2k7Qfx.js`，未留下补丁记录；现已补入
> `tools/game-patcher/patch-game.py`（`tera-move-category-attr` / `nihil-light-category`），
> 并经「原文件 + 全部 7 条补丁 = 当前文件」逐字符重建校验确认无损。

### 9.1 tera-move-category-attr · 太晶招式类别判定去太晶化条件

**位置**：`TeraMoveCategoryAttr`（混淆名 `rZ`），`game/server/dist/assets/loading-scene-By2k7Qfx.js`。

```diff
- return s.isTerastallized && s.getEffectiveStat(p.ATK, …) > s.getEffectiveStat(p.SPATK, …)
+ return                          s.getEffectiveStat(p.ATK, …) > s.getEffectiveStat(p.SPATK, …)
```

即：删除 `isTerastallized` 前置条件，改为**无条件**按「攻击 vs 特攻」高低把太晶招式分入物理/特殊类别。
原版逻辑下，未太晶化时该属性直接返回 false，招式类别回落到静态定义；改后任何状态下都动态判定。

### 9.2 nihil-light-category · 归无之光招式属性 龙 → 自定义属性 CS

**位置**：归无之光（NIHIL_LIGHT）招式定义行，`game/server/dist/assets/loading-scene-By2k7Qfx.js`。

```diff
- new v(t.NIHIL_LIGHT, R.DRAGON, B.SPECIAL, 200, 100, 5, -1, 0, 9)
+ new v(t.NIHIL_LIGHT, R.CS,     B.SPECIAL, 200, 100, 5, -1, 0, 9)
```

即：招式**属性**由龙(DRAGON)改为改版自定义属性 CS。`R.CS` 是本改版在 `PokemonType` 枚举中
`STELLAR(18)` 之后新增的自定义属性（枚举值 19），克制表中普通系等招式打该属性为 2×；
改后归无之光按 CS 参与克制结算与属性一致加成（STAB），而非龙属性。

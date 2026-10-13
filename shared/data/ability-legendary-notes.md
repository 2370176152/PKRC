# 特性数据与「传说」属性说明

> 适用工程：本仓库（PokeRogue 中文改版，仅含打包产物 `game/server/dist`）
> 数据来源：`game/server/dist/assets/loading-scene-By2k7Qfx.js`、`game/server/dist/assets/index-D3KKGO7Y.js`、
> `game/server/dist/locales/zh-CN/*.json`。所有数值均由引擎分支**直接还原**，未作推断；推断项均已单独标注。

---

## 一、「传说」属性是什么

### 1.1 定义

「传说」是代码里**真实存在的第 20 个属性枚举值**，不是俗称、也不是宝可梦分类。

| 项目 | 值 | 出处 |
| --- | --- | --- |
| 枚举名 | `Type.CS` | `R=(n=>(n[n.UNKNOWN=-1]="UNKNOWN", … n[n.STELLAR=18]="STELLAR", n[n.CS=19]="CS", n))(R\|\|{})` |
| 数值编号 | `19` | 同上，紧跟 `STELLAR=18`；其后的下个枚举已是 `Gender`，说明 19 就是属性表末尾 |
| 中文名 | 传说 | `locales/zh-CN/pokemon-info.json` → `"Type": { … "STELLAR":"星晶", "CS":"传说", "HJ":"净空" }` |
| 内存配色 | `[168,168,120]` | `getTypeRgb()`，与「一般」系**同色**（占位色，未单独设计） |

补充：i18n 里还有一条 `"HJ":"净空"`，但引擎 `Type` 枚举中**没有 HJ 对应值**（枚举只到 `CS=19`），属纯文本残留。

### 1.2 作用机制：一张「反向」相克表

伤害计算入口为 `getTypeDamageMultiplier(attackType, defType)`，打包后为 `Do(n,s)`，外层 `switch` 走 **防守方**。

```js
function Do(n, s) {                       // n = 攻击属性, s = 防守属性
  if (n === R.UNKNOWN || s === R.UNKNOWN) return 1;
  switch (s) {                            // ← 按防守方分支
    case R.NORMAL:   switch (n) { case R.FIGHTING: case R.CS: return 2; … }
    case R.FIGHTING: switch (n) { case R.FLYING: … case R.CS: return 2; … }
    … 共 18 个普通属性，每一个的 switch(n) 里都写了 case R.CS: return 2 …
    case R.CS:      switch (n) { case R.CS: return 2; default: return .5 }   // ★ 传说防守
    case R.STELLAR: return 1;                                                 // ★ 星晶防守
  }
  return 1;
}
```

由此得到传说的完整行为：

- **进攻**：传说属性招式对**全部 18 种普通属性**都是 **×2**（效果拔群）——攻无不克。
- **自攻**：传说 → 传说 也是 **×2**。
- **防守**：被**任何**其他属性攻击都是 **×0.5**（效果不佳）；**只有被传说攻击才是 ×2**——防无不挡。
- 对星晶：传说 → 星晶 **×1**；星晶 → 传说 **×0.5**（星晶作为攻方落在 `default`）。

### 1.3 完整对照（引擎实录）

**传说 作为攻击方**

| 目标属性 | 一般 | 格斗 | 飞行 | 毒 | 地面 | 岩石 | 虫 | 幽灵 | 钢 | 火 | 水 | 草 | 电 | 超能力 | 冰 | 龙 | 恶 | 妖精 | 传说 | 星晶 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 倍率 | **×2** | **×2** | **×2** | **×2** | **×2** | **×2** | **×2** | **×2** | **×2** | **×2** | **×2** | **×2** | **×2** | **×2** | **×2** | **×2** | **×2** | **×2** | **×2** | ×1 |

**传说 作为防守方**

| 攻击属性 | 一般 | 格斗 | 飞行 | 毒 | 地面 | 岩石 | 虫 | 幽灵 | 钢 | 火 | 水 | 草 | 电 | 超能力 | 冰 | 龙 | 恶 | 妖精 | 传说 | 星晶 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 倍率 | ×0.5 | ×0.5 | ×0.5 | ×0.5 | ×0.5 | ×0.5 | ×0.5 | ×0.5 | ×0.5 | ×0.5 | ×0.5 | ×0.5 | ×0.5 | ×0.5 | ×0.5 | ×0.5 | ×0.5 | ×0.5 | **×2** | ×0.5 |

### 1.4 与其他属性的区别

| 对比项 | 传说 `CS` = 19 | 星晶 `STELLAR` = 18 | 未知 `UNKNOWN` = -1 |
| --- | --- | --- | --- |
| 进攻（对普通 18 属性） | 全部 **×2** | 全部 ×1 | 全部 ×1 |
| 防守（受普通 18 属性） | 全部 **×0.5** | 全部 ×1 | 全部 ×1 |
| 自相攻击 | ×2 | ×1 | ×1 |
| 代码写法 | 独立 `case R.CS: switch(n){…}` | `case R.STELLAR: return 1` | 函数开头提前 return 1 |
| 配色 | `[168,168,120]`（同「一般」） | `[255,255,255]` 纯白 | `[0,0,0]`（default） |
| 是否可作材料本属性 | **否**（被 `allMaterialTypes()` 排除） | **否**（同样被排除） | 否（负值天然排除） |
| 天气 / 场地 / 状态关联 | **无**，纯相克表条目 | 无 | 无 |

一句话概括：**星晶让克制关系失效（全属性中性），传说把克制关系推到极致（全属性压制）。**

### 1.5 游戏内改写为「传说」的唯一代码路径

`csTypeAttr`（打包后类名 `uX`，别名 `IW`）继承 `MoveEffectAttr`，触发时机 `POST_TARGET`：

```js
class uX extends Ht {
  constructor(removedType, messageCallback) {
    super(true, { trigger: Gs.POST_TARGET });
    this.removedType = removedType;
    this.messageCallback = messageCallback;
  }
  apply(s, i, A, a) {
    if (!super.apply(s, i, A, a) || (s.isTerastallized && s.getTeraType() === this.removedType)) return false;
    const O = [...s.getTypes(true)],
          I = O.findIndex(S => S === this.removedType);
    return I !== 1 && (O[I] = R.CS),   // ← 把 removedType 原地替换为「传说」
           s.summonData.types = O, s.updateInfo(),
           this.messageCallback && this.messageCallback(s), true;
  }
}
```

- 把目标身上指定的 `removedType` 属性**原地替换为 `R.CS`（传说）**；
- 若目标已太晶化、且太晶属性恰好等于 `removedType`，**直接返回 false 不生效**；
- `I !== 1` 的守卫使「属性位于索引 1」时跳过替换（继承自复制型 attr 的写法）；
- **唯一调用方**：球雷姆专属招式 `BFSJ`（冰属性 · 威力 70 · PP 3）
  `.attr(IW, R.DRAGON, …"moveTriggers:qiuleimu")`，即把目标的「龙」属性改成「传说」；
- 该招式另带条件 `getTypes().some(t => t===DRAGON || t===CS || t===ICE)`，并附加 `BURNED_UP` 与 `TAR_BFSJ` 标记。

### 1.6 三个容易被混淆的「传说」

| 名称 | 是什么 | 位置 |
| --- | --- | --- |
| **传说（属性）** | `Type.CS = 19`，本文档主角 | `Type` 枚举 / `getTypeDamageMultiplier` |
| **传说（特性档位）** | PT 商店稀有度档位，`getAbilityTierAndPrice()` 中 `sR` 池返回 `"传说"`/`"UP传说"`，共 **65** 个特性 | `function pp(n,s)` |
| **传说（宝可梦）** | PT 搜打撤的模式日志 `[PT搜打撤] ✨ 传说触发！`，判定 `(legendary \|\| mythical) && !subLegendary` | 传说弹窗逻辑 |
| **传说（预留特性）** | `chuanshuo` / `cssb` 两条本地化里名为「传说」的特性，**未接入枚举、无实现**；仅有触发文案 `chuanshuoTypeChange`、`chuanshuoTypeChangeWeather` | `locales/zh-CN/ability.json` |

---

## 二、特性数据总览

- 特性总数：**387** 条（`Abilities` 枚举 0–387，其中 `NONE=0` 不计入）
- 原版特性：**320** 条
- 改版新增特性：**67** 条（CSSW 19 + CSSL 18 + KBTX 12 + 神威/超梦装甲/水晶之躯/招财猫/高雅之躯/蜂王 等）
- 名称与说明覆盖率：**100%**（`locales/zh-CN/ability.json` 389 条 ⊇ 枚举 387 条；多出的 `chuanshuo`、`cssb` 为未接入枚举的预留项）

### 2.1 PT 商店分档

判定顺序来自 `getAbilityTierAndPrice()`：传说池 → 史诗 → 稀有 → 史诗(硬编码) → 稀有(硬编码) → 普通 → 白板。

| PT 档位 | PT 价格 | 数量 | 判定规则 |
| --- | ---: | ---: | --- |
| 传说(UP池) | 1300 | 65 | `sR` 数组命中（CSSW 19 + CSSL 18 + 顶级特性 28）| 
| 史诗 | 1000 | 62 | `baseTotal ≥ 640` 的宝可梦身上、命中 `isEpicAbility()` 的 18 个特性；或硬编码表 `U_e`（59 项）| 
| 稀有 | 750 | 70 | 同上一批宝可梦身上的其余特性（动态集合 `YRe`）；或硬编码表 `d_e`（67 项）| 
| 普通 | 500 | 37 | 硬编码表 `M_e`（40 项）| 
| 白板 | 500 | 153 | 未进入任何池 | 

> 说明：`WRe`/`YRe` 不是静态表，而是 `f_e()` 运行时遍历全部宝可梦、筛出 `baseTotal ≥ D_e(=640)` 者，再按 `P_e()`（`isEpicAbility`）二分生成。

### 2.2 引擎层级分布（`new Ee(o.X, N)` 的第二参数）

| 层级 | 数量 | 占比 |
| ---: | ---: | ---: |
| 3 | 76 | 19.6% |
| 4 | 47 | 12.1% |
| 5 | 41 | 10.6% |
| 6 | 27 | 7.0% |
| 7 | 42 | 10.9% |
| 8 | 34 | 8.8% |
| 9 | 120 | 31.0% |

### 2.3 触发条件分布（前 20）

| 触发条件 | 数量 |
| --- | ---: |
| 常驻 / 被动 | 148 |
| 出场时 | 92 |
| 成为招式目标时（伤害结算前） | 72 |
| 使用招式前 | 66 |
| 规则标签（不单独触发） | 51 |
| 受到招式攻击后 | 43 |
| 区域切换后 | 36 |
| 濒死时 | 22 |
| 成为招式目标时（吸引） | 21 |
| 常驻（能力值修正） | 19 |
| 每回合结束时 | 17 |
| 将陷入异常状态时 | 15 |
| — | 14 |
| 自身能力等级将变化时 | 13 |
| 使用招式后 | 12 |
| 常驻（无视对手特性） | 10 |
| 将受到天气伤害时 | 8 |
| 常驻（优先度修正） | 8 |
| 战斗开始时 | 7 |
| 将被一击必杀时 | 4 |

### 2.4 字段口径

| 字段 | 口径 |
| --- | --- |
| **特性名称** | `locales/zh-CN/ability.json` 的 `name`（枚举名 → lowerCamelCase 键 的映射已校验，387/387 命中）|
| **效果说明** | 同上文件的 `description`，已去掉原文的换行 |
| **触发条件** | 由特性代码里各 `.attr(类, …)` 的**继承链**回溯到抽象基类（如 `PostSummonAbAttr` / `PostDefendAbAttr` / `TypeImmunityAbAttr`）后归类；一条特性可有多个触发点 |
| **数值范围** | 反向解析 `.attr()` 的**实参**：能力名、属性、天气、场地、异常状态、战斗标记、招式名已译成中文；倍率 / 百分数 / 等级 / 分数原样输出。若代码未写显式参数，则回退到说明文字中的数值并标注 |
| **适用范围** | 原版/改版新增 + PT 档位与价格 + 引擎层级 + 是否属于传说(UP)池 + 是否被三被动随机池排除 |

---

## 三、完整特性表（387 条）

字段：特性名称 / 效果说明 / 触发条件 / 数值范围 / 适用范围。按枚举编号排序。
`★` = 改版新增特性。

| # | 特性名称 | 效果说明 | 触发条件 | 数值范围 | 适用范围 |
| ---: | --- | --- | --- | --- | --- |
| 1 | 恶臭<br><sub>Stench</sub><br><sub><code>STENCH</code></sub> | 通过释放臭臭的气味，在攻击的时候，有时会使对手畏缩。 | 使用招式后 | 使用招式后有 10% 几率使目标畏缩 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:3 |
| 2 | 降雨<br><sub>Drizzle</sub><br><sub><code>DRIZZLE</code></sub> | 出场时，会将天气变为下雨。 | 出场时 ／ 区域切换后 | 出场时把天气变为下雨；切换区域后把天气变为下雨 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:3 \| 传说/UP特性池 |
| 3 | 加速<br><sub>Speed Boost</sub><br><sub><code>SPEED_BOOST</code></sub> | 每一回合速度会变快。 | 每回合结束时 | —（由代码固定，无显式参数） | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:3 |
| 4 | 战斗盔甲<br><sub>Battle Armor</sub><br><sub><code>BATTLE_ARMOR</code></sub> | 被坚硬的甲壳守护着，不会被对手的攻击击中要害。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:3 |
| 5 | 结实<br><sub>Sturdy</sub><br><sub><code>STURDY</code></sub> | 在ＨＰ全满时，即使受到招式攻击，也不会被一击打倒。一击必杀的招式也没有效果。 | 将被一击必杀时 ／ 成为招式目标时（伤害结算前） | 受到攻击时触发：；免疫一击必杀 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:3 |
| 6 | 湿气<br><sub>Damp</sub><br><sub><code>DAMP</code></sub> | 通过把周围都弄湿，使谁都无法使用自爆等爆炸类的招式。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:3 |
| 7 | 柔软<br><sub>Limber</sub><br><sub><code>LIMBER</code></sub> | 因为身体柔软，不会变为麻痹状态。 | 将陷入异常状态时 | 免疫麻痹 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:3 |
| 8 | 沙隐<br><sub>Sand Veil</sub><br><sub><code>SAND_VEIL</code></sub> | 在沙暴的时候，闪避率会提高。 | 将受到天气伤害时 ／ 常驻（能力值修正） | 常驻能力倍率修正：回避 1.2；免疫天气伤害 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:3 |
| 9 | 静电<br><sub>Static</sub><br><sub><code>STATIC</code></sub> | 身上带有静电，有时会让接触到的对手麻痹。 | 受到招式攻击后 | 被接触招式命中时使对手陷入麻痹（几率 30%） | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:3 |
| 10 | 蓄电<br><sub>Volt Absorb</sub><br><sub><code>VOLT_ABSORB</code></sub> | 受到电属性的招式攻击时，不会受到伤害，而是会回复。 | 成为招式目标时（伤害结算前） | 免疫电属性招式并回复 HP | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:3 |
| 11 | 储水<br><sub>Water Absorb</sub><br><sub><code>WATER_ABSORB</code></sub> | 受到水属性的招式攻击时，不会受到伤害，而是会回复。 | 成为招式目标时（伤害结算前） | 免疫水属性招式并回复 HP | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:3 |
| 12 | 迟钝<br><sub>Oblivious</sub><br><sub><code>OBLIVIOUS</code></sub> | 因为感觉迟钝，不会变为着迷和被挑衅状态。对威吓也毫不动摇。 | 常驻 / 被动 | 免疫[着迷,挑衅]；免疫对手的威吓/降能力效果 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:3 |
| 13 | 无关天气<br><sub>Cloud Nine</sub><br><sub><code>CLOUD_NINE</code></sub> | 任何天气的影响都会消失。 | 出场时 ／ 常驻 / 被动 ／ 濒死时 | (条件)；濒死时触发： | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:3 |
| 14 | 复眼<br><sub>Compound Eyes</sub><br><sub><code>COMPOUND_EYES</code></sub> | 因为拥有复眼，招式的命中率会提高。 | 常驻（能力值修正） | 常驻能力倍率修正：命中 1.3 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:3 |
| 15 | 不眠<br><sub>Insomnia</sub><br><sub><code>INSOMNIA</code></sub> | 因为有着睡不着的体质，所以不会陷入睡眠状态。 | 将陷入异常状态时 ／ 常驻 / 被动 | 免疫睡眠；免疫困倦 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:3 |
| 16 | 变色<br><sub>Color Change</sub><br><sub><code>COLOR_CHANGE</code></sub> | 自己的属性会变为从对手处所受招式的属性。 | 受到招式攻击后 | 受到攻击后属性变化： | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:3 |
| 17 | 免疫<br><sub>Immunity</sub><br><sub><code>IMMUNITY</code></sub> | 因为体内拥有免疫能力，不会变为中毒状态。 | 将陷入异常状态时 | 免疫中毒 剧毒 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:3 |
| 18 | 引火<br><sub>Flash Fire</sub><br><sub><code>FLASH_FIRE</code></sub> | 受到火属性的招式攻击时，吸收火焰，自己使出的火属性招式会变强。 | 成为招式目标时（伤害结算前） | 免疫火属性招式并附加引火强化 1 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:3 |
| 19 | 鳞粉<br><sub>Shield Dust</sub><br><sub><code>SHIELD_DUST</code></sub> | 被鳞粉守护着，不会受到招式的追加效果影响。 | 成为招式目标时（伤害结算前） | 无视招式的追加效果 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:3 |
| 20 | 我行我素<br><sub>Own Tempo</sub><br><sub><code>OWN_TEMPO</code></sub> | 因为我行我素，不会变为混乱状态。对威吓也毫不动摇。 | 常驻 / 被动 | 免疫混乱；免疫对手的威吓/降能力效果 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:3 |
| 21 | 吸盘<br><sub>Suction Cups</sub><br><sub><code>SUCTION_CUPS</code></sub> | 用吸盘牢牢贴在地面上，让替换宝可梦的招式和道具无效。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:3 |
| 22 | 威吓<br><sub>Intimidate</sub><br><sub><code>INTIMIDATE</code></sub> | 出场时威吓对手，让其退缩，降低对手的攻击。 | 出场时 | 出场时使目标能力变化：攻击 -1 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:3 \| 传说/UP特性池 |
| 23 | 踩影<br><sub>Shadow Tag</sub><br><sub><code>SHADOW_TAG</code></sub> | 踩住对手的影子使其无法逃走或替换。 | 常驻 / 被动 | (条件) | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:3 |
| 24 | 粗糙皮肤<br><sub>Rough Skin</sub><br><sub><code>ROUGH_SKIN</code></sub> | 受到攻击时，用粗糙的皮肤弄伤接触到自己的对手。 | 受到招式攻击后 | 被接触招式命中时反伤对手（1/8 最大 HP） | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:3 |
| 25 | 神奇守护<br><sub>Wonder Guard</sub><br><sub><code>WONDER_GUARD</code></sub> | 不可思议的力量，只有效果绝佳的招式才能击中。 | 成为招式目标时（伤害结算前） ／ 规则标签（不单独触发） | 只会被效果拔群的招式击中（其余免疫） | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:3 \| 传说/UP特性池 \| 三被动随机池排除 |
| 26 | 飘浮<br><sub>Levitate</sub><br><sub><code>LEVITATE</code></sub> | 从地面浮起，从而不会受到地面属性招式的攻击。 | 成为招式目标时（伤害结算前） | 免疫地面属性招式 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:3 |
| 27 | 孢子<br><sub>Effect Spore</sub><br><sub><code>EFFECT_SPORE</code></sub> | 受到攻击时，有时会把接触到自己的对手变为中毒、麻痹或睡眠状态。 | 受到招式攻击后 | —（由代码固定，无显式参数） | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:3 |
| 28 | 同步<br><sub>Synchronize</sub><br><sub><code>SYNCHRONIZE</code></sub> | 将自己的中毒、麻痹或灼伤状态传染给对手。 | 常驻 / 被动 ／ 陷入异常状态后 | —（由代码固定，无显式参数） | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:3 |
| 29 | 恒净之躯<br><sub>Clear Body</sub><br><sub><code>CLEAR_BODY</code></sub> | 不会因为对手的招式或特性而被降低能力。 | 自身能力等级将变化时 | 保护能力不被降低： | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:3 |
| 30 | 自然回复<br><sub>Natural Cure</sub><br><sub><code>NATURAL_CURE</code></sub> | 回到同行队伍后，异常状态就会被治愈。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:3 |
| 31 | 避雷针<br><sub>Lightning Rod</sub><br><sub><code>LIGHTNING_ROD</code></sub> | 将电属性的招式吸引到自己身上，不会受到伤害，而是会提高特攻。 | 成为招式目标时（伤害结算前） ／ 成为招式目标时（吸引） | 吸引并免疫电属性招式；被电属性招式命中时免疫并提升能力：特攻 1 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:3 |
| 32 | 天恩<br><sub>Serene Grace</sub><br><sub><code>SERENE_GRACE</code></sub> | 托天恩的福，招式的追加效果容易出现。 | 招式效果结算时 | 2 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:3 \| 传说/UP特性池 |
| 33 | 悠游自如<br><sub>Swift Swim</sub><br><sub><code>SWIFT_SWIM</code></sub> | 下雨天气时，速度会提高。 | 常驻（能力值修正） | 常驻能力倍率修正：速度 2 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:3 |
| 34 | 叶绿素<br><sub>Chlorophyll</sub><br><sub><code>CHLOROPHYLL</code></sub> | 晴朗天气时，速度会提高。 | 常驻（能力值修正） | 常驻能力倍率修正：速度 2 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:3 |
| 35 | 发光<br><sub>Illuminate</sub><br><sub><code>ILLUMINATE</code></sub> | 通过让周围变亮来保持命中率不会被降低。 | 常驻 / 被动 ／ 常驻（双打判定） ／ 自身能力等级将变化时 | 保护能力不被降低：命中；双打模式加成；回避 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:3 |
| 36 | 复制<br><sub>Trace</sub><br><sub><code>TRACE</code></sub> | 出场时，复制对手的特性，变为与之相同的特性。 | 出场时 ／ 规则标签（不单独触发） | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:3 |
| 37 | 大力士<br><sub>Huge Power</sub><br><sub><code>HUGE_POWER</code></sub> | 物理攻击的威力会变为２倍。 | 常驻（能力值修正） | 常驻能力倍率修正：攻击 2 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:3 \| 传说/UP特性池 |
| 38 | 毒刺<br><sub>Poison Point</sub><br><sub><code>POISON_POINT</code></sub> | 有时会让接触到自己的对手变为中毒状态。 | 受到招式攻击后 | 被接触招式命中时使对手陷入中毒（几率 30%） | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:3 |
| 39 | 精神力<br><sub>Inner Focus</sub><br><sub><code>INNER_FOCUS</code></sub> | 拥有经过锻炼的精神，而不会因对手的攻击而畏缩。对威吓也毫不动摇。 | 常驻 / 被动 | 免疫畏缩；免疫对手的威吓/降能力效果 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:3 |
| 40 | 熔岩铠甲<br><sub>Magma Armor</sub><br><sub><code>MAGMA_ARMOR</code></sub> | 将炽热的熔岩覆盖在身上，不会变为冰冻状态。 | 将陷入异常状态时 | 免疫冰冻 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:3 |
| 41 | 水幕<br><sub>Water Veil</sub><br><sub><code>WATER_VEIL</code></sub> | 将水幕裹在身上，不会变为灼伤状态。 | 将陷入异常状态时 | 免疫灼伤 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:3 |
| 42 | 磁力<br><sub>Magnet Pull</sub><br><sub><code>MAGNET_PULL</code></sub> | 用磁力吸住钢属性的宝可梦，使其无法逃走。 | 常驻 / 被动 | (条件) | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:3 |
| 43 | 隔音<br><sub>Soundproof</sub><br><sub><code>SOUNDPROOF</code></sub> | 通过屏蔽声音，不受到声音招式的影响。 | 成为招式目标时（伤害结算前） | 免疫特定招式 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:3 |
| 44 | 雨盘<br><sub>Rain Dish</sub><br><sub><code>RAIN_DISH</code></sub> | 下雨天气时，会缓缓回复ＨＰ。 | 常驻 / 被动 | 下雨大雨天气下每回合回复 HP | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:3 |
| 45 | 扬沙<br><sub>Sand Stream</sub><br><sub><code>SAND_STREAM</code></sub> | 出场时，会把天气变为沙暴。 | 出场时 ／ 区域切换后 | 出场时把天气变为沙暴；切换区域后把天气变为沙暴 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:3 \| 传说/UP特性池 |
| 46 | 压迫感<br><sub>Pressure</sub><br><sub><code>PRESSURE</code></sub> | 给予对手压迫感，大量减少其使用招式的ＰＰ。 | 出场时 ／ 常驻 / 被动 | 出场时发布提示消息 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:3 |
| 47 | 厚脂肪<br><sub>Thick Fat</sub><br><sub><code>THICK_FAT</code></sub> | 因为被厚厚的脂肪保护着，会让火属性和冰属性的招式伤害减半。 | 成为招式目标时（伤害结算前） | 受到属性伤害倍率修正：火 0.5；受到属性伤害倍率修正：冰 0.5 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:3 |
| 48 | 早起<br><sub>Early Bird</sub><br><sub><code>EARLY_BIRD</code></sub> | 即使变为睡眠状态，也能以２倍的速度提早醒来。 | 常驻 / 被动 | 睡眠 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:3 |
| 49 | 火焰之躯<br><sub>Flame Body</sub><br><sub><code>FLAME_BODY</code></sub> | 有时会让接触到自己的对手变为灼伤状态。 | 受到招式攻击后 | 被接触招式命中时使对手陷入灼伤（几率 30%） | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:3 |
| 50 | 逃跑<br><sub>Run Away</sub><br><sub><code>RUN_AWAY</code></sub> | 一定能从野生宝可梦那儿逃走。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:3 |
| 51 | 锐利目光<br><sub>Keen Eye</sub><br><sub><code>KEEN_EYE</code></sub> | 多亏了锐利的目光，命中率不会被降低。 | 自身能力等级将变化时 | 保护能力不被降低：命中 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:3 |
| 52 | 怪力钳<br><sub>Hyper Cutter</sub><br><sub><code>HYPER_CUTTER</code></sub> | 因为拥有以力量自豪的钳子，不会被对手降低攻击。 | 自身能力等级将变化时 | 保护能力不被降低：攻击 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:3 |
| 53 | 捡拾<br><sub>Pickup</sub><br><sub><code>PICKUP</code></sub> | 有时会捡来对手用过的道具，冒险过程中也会捡到。 | 战斗结束后 ／ 规则标签（不单独触发） | —（由代码固定，无显式参数） | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:3 |
| 54 | 懒惰<br><sub>Truant</sub><br><sub><code>TRUANT</code></sub> | 如果使出招式，下一回合就会休息。 | 出场时 | 出场时附加懒惰 1 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:3 |
| 55 | 活力<br><sub>Hustle</sub><br><sub><code>HUSTLE</code></sub> | 自己的攻击变高，但命中率会降低。 | 常驻（能力值修正） | 常驻能力倍率修正：攻击 1.5；常驻能力倍率修正：命中 0.8 (条件) | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:3 |
| 56 | 迷人之躯<br><sub>Cute Charm</sub><br><sub><code>CUTE_CHARM</code></sub> | 有时会让接触到自己的对手着迷。 | 受到招式攻击后 | 受到攻击后触发：30 着迷 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:3 |
| 57 | 正电<br><sub>Plus</sub><br><sub><code>PLUS</code></sub> | 出场的伙伴之间如果有正电或负电特性的宝可梦，自己的特攻会提高。 | 常驻 / 被动 | Ss 特攻 1.5 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:3 |
| 58 | 负电<br><sub>Minus</sub><br><sub><code>MINUS</code></sub> | 出场的伙伴之间如果有正电或负电特性的宝可梦，自己的特攻会提高。 | 常驻 / 被动 | Ss 特攻 1.5 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:3 |
| 59 | 阴晴不定<br><sub>Forecast</sub><br><sub><code>FORECAST</code></sub> | 受天气的影响，会变为水属性、火属性或冰属性中的某一个。 | 出场时 ／ 常驻 / 被动 ／ 规则标签（不单独触发） | 阴晴不定 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:3 |
| 60 | 黏着<br><sub>Sticky Hold</sub><br><sub><code>STICKY_HOLD</code></sub> | 因为道具是粘在黏性身体上的，所以不会被对手夺走。 | 规则标签（不单独触发） | 防止道具被夺取 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:3 |
| 61 | 蜕皮<br><sub>Shed Skin</sub><br><sub><code>SHED_SKIN</code></sub> | 通过蜕去身上的皮，有时会治愈异常状态。 | 常驻 / 被动 | Mu | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:3 |
| 62 | 毅力<br><sub>Guts</sub><br><sub><code>GUTS</code></sub> | 如果变为异常状态，会拿出毅力，攻击会提高。 | 常驻 / 被动 | Ss 攻击 1.5 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:3 |
| 63 | 神奇鳞片<br><sub>Marvel Scale</sub><br><sub><code>MARVEL_SCALE</code></sub> | 如果变为异常状态，神奇鳞片会发生反应，防御会提高。 | 常驻 / 被动 | Ss 防御 1.5 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:3 |
| 64 | 污泥浆<br><sub>Liquid Ooze</sub><br><sub><code>LIQUID_OOZE</code></sub> | 吸收了污泥浆的对手会因强烈的恶臭而受到伤害，减少ＨＰ。 | 受到招式攻击后 | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:3 |
| 65 | 茂盛<br><sub>Overgrow</sub><br><sub><code>OVERGROW</code></sub> | ＨＰ减少的时候，草属性的招式威力会提高。 | 使用招式前 | 草 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:3 |
| 66 | 猛火<br><sub>Blaze</sub><br><sub><code>BLAZE</code></sub> | ＨＰ减少的时候，火属性的招式威力会提高。 | 使用招式前 | 火 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:3 |
| 67 | 激流<br><sub>Torrent</sub><br><sub><code>TORRENT</code></sub> | ＨＰ减少的时候，水属性的招式威力会提高。 | 使用招式前 | 水 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:3 |
| 68 | 虫之预感<br><sub>Swarm</sub><br><sub><code>SWARM</code></sub> | ＨＰ减少的时候，虫属性的招式威力会提高。 | 使用招式前 | 虫 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:3 |
| 69 | 坚硬脑袋<br><sub>Rock Head</sub><br><sub><code>ROCK_HEAD</code></sub> | 即使使出会受反作用力伤害的招式，ＨＰ也不会减少。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:3 |
| 70 | 日照<br><sub>Drought</sub><br><sub><code>DROUGHT</code></sub> | 出场时，会将天气变为晴朗。 | 出场时 ／ 区域切换后 | 出场时把天气变为晴天；切换区域后把天气变为晴天 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:3 \| 传说/UP特性池 |
| 71 | 沙穴<br><sub>Arena Trap</sub><br><sub><code>ARENA_TRAP</code></sub> | 在战斗中让对手无法逃走。 | 常驻 / 被动 ／ 常驻（双打判定） | (条件)；双打模式加成 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:3 |
| 72 | 干劲<br><sub>Vital Spirit</sub><br><sub><code>VITAL_SPIRIT</code></sub> | 通过激发出干劲，不会变为睡眠状态。 | 将陷入异常状态时 ／ 常驻 / 被动 | 免疫睡眠；免疫困倦 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:3 |
| 73 | 白色烟雾<br><sub>White Smoke</sub><br><sub><code>WHITE_SMOKE</code></sub> | 被白色烟雾保护着，不会被对手降低能力。 | 自身能力等级将变化时 | 保护能力不被降低： | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:3 |
| 74 | 瑜伽之力<br><sub>Pure Power</sub><br><sub><code>PURE_POWER</code></sub> | 因瑜伽的力量，物理攻击的威力会变为２倍。 | 常驻（能力值修正） | 常驻能力倍率修正：攻击 2 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:3 \| 传说/UP特性池 |
| 75 | 硬壳盔甲<br><sub>Shell Armor</sub><br><sub><code>SHELL_ARMOR</code></sub> | 被坚硬的壳保护着，对手的攻击不会击中要害。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:3 |
| 76 | 气闸<br><sub>Air Lock</sub><br><sub><code>AIR_LOCK</code></sub> | 所有天气的影响都会消失。 | 出场时 ／ 常驻 / 被动 ／ 濒死时 | (条件)；濒死时触发： | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:3 |
| 77 | 蹒跚<br><sub>Tangled Feet</sub><br><sub><code>TANGLED_FEET</code></sub> | 在混乱状态时，闪避率会提高。 | 常驻 / 被动 | Ss 回避 2 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:4 |
| 78 | 电气引擎<br><sub>Motor Drive</sub><br><sub><code>MOTOR_DRIVE</code></sub> | 受到电属性的招式攻击时，不会受到伤害，而是速度会提高。 | 成为招式目标时（伤害结算前） | 被电属性招式命中时免疫并提升能力：速度 1 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:4 |
| 79 | 斗争心<br><sub>Rivalry</sub><br><sub><code>RIVALRY</code></sub> | 面对性别相同的对手，会燃起斗争心，变得更强。而面对性别不同的，则会变弱。 | 使用招式前 | 满足条件时招式威力提升：(条件) 1.25；满足条件时招式威力提升：(条件) 0.75 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:4 |
| 80 | 不屈之心<br><sub>Steadfast</sub><br><sub><code>STEADFAST</code></sub> | 每次畏缩时，不屈之心就会燃起，速度也会提高。 | 常驻 / 被动 | 畏缩时能力变化：速度 1 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:4 |
| 81 | 雪隐<br><sub>Snow Cloak</sub><br><sub><code>SNOW_CLOAK</code></sub> | 下雪天气时，闪避率会提高。 | 将受到天气伤害时 ／ 常驻（能力值修正） | 常驻能力倍率修正：回避 1.2；免疫天气伤害 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:4 |
| 82 | 贪吃鬼<br><sub>Gluttony</sub><br><sub><code>GLUTTONY</code></sub> | 原本ＨＰ变得很少时才会吃树果，在ＨＰ还有一半时就会把它吃掉。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:4 |
| 83 | 愤怒穴位<br><sub>Anger Point</sub><br><sub><code>ANGER_POINT</code></sub> | 要害被击中时，会大发雷霆，攻击力变为最大。 | 受到招式攻击后 | 被击中要害后能力变化：攻击 6 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:4 |
| 84 | 轻装<br><sub>Unburden</sub><br><sub><code>UNBURDEN</code></sub> | 失去所持有的道具时，速度会提高。 | 失去道具后 | 轻装 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:4 |
| 85 | 耐热<br><sub>Heatproof</sub><br><sub><code>HEATPROOF</code></sub> | 耐热的体质会让火属性的招式伤害减半。 | 常驻 / 被动 ／ 成为招式目标时（伤害结算前） | 受到属性伤害倍率修正：火 0.5；0.5 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:4 |
| 86 | 单纯<br><sub>Simple</sub><br><sub><code>SIMPLE</code></sub> | 能力变化会变为平时的２倍。 | 常驻 / 被动 | 2 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:4 \| 传说/UP特性池 |
| 87 | 干燥皮肤<br><sub>Dry Skin</sub><br><sub><code>DRY_SKIN</code></sub> | 下雨天气时和受到水属性的招式时，ＨＰ会回复。晴朗天气时和受到火属性的招式时，ＨＰ会减少。 | 常驻 / 被动 ／ 成为招式目标时（伤害结算前） | 晴天大日照日晶月华天气下每回合受到伤害；下雨大雨天气下每回合回复 HP；受到属性伤害倍率修正：火 1.25；免疫水属性招式并回复 HP | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:4 |
| 88 | 下载<br><sub>Download</sub><br><sub><code>DOWNLOAD</code></sub> | 比较对手的防御和特防，根据较低的那项能力相应地提高自己的攻击或特攻。 | 出场时 | —（由代码固定，无显式参数） | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:4 |
| 89 | 铁拳<br><sub>Iron Fist</sub><br><sub><code>IRON_FIST</code></sub> | 使用拳类招式的威力会提高。 | 使用招式前 | 满足条件时招式威力提升：(条件) 1.2 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:4 |
| 90 | 毒疗<br><sub>Poison Heal</sub><br><sub><code>POISON_HEAL</code></sub> | 变为中毒状态时，ＨＰ不会减少，反而会增加起来。 | 常驻 / 被动 ／ 每回合结束时 | 每回合结束治愈异常状态；剧毒 中毒 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:4 |
| 91 | 适应力<br><sub>Adaptability</sub><br><sub><code>ADAPTABILITY</code></sub> | 与自身同属性的招式威力会提高。 | 规则标签（不单独触发） | 本系加成提升 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:4 |
| 92 | 连续攻击<br><sub>Skill Link</sub><br><sub><code>SKILL_LINK</code></sub> | 如果使用连续招式，总是能使出最高次数。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:4 |
| 93 | 湿润之躯<br><sub>Hydration</sub><br><sub><code>HYDRATION</code></sub> | 下雨天气时，异常状态会治愈。 | 每回合结束时 | 每回合结束触发： | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:4 |
| 94 | 太阳之力<br><sub>Solar Power</sub><br><sub><code>SOLAR_POWER</code></sub> | 晴朗天气时，特攻会提高，而每回合ＨＰ会减少。 | 常驻 / 被动 ／ 常驻（能力值修正） | 晴天大日照日晶月华天气下每回合受到伤害；常驻能力倍率修正：特攻 1.5 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:4 |
| 95 | 飞毛腿<br><sub>Quick Feet</sub><br><sub><code>QUICK_FEET</code></sub> | 变为异常状态时，速度会提高。 | 常驻 / 被动 | Ss 速度 2；Ss 速度 1.5 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:4 |
| 96 | 一般皮肤<br><sub>Normalize</sub><br><sub><code>NORMALIZE</code></sub> | 无论是什么属性的招式，全部会变为一般属性。威力会少量提高。 | 使用招式前 | 一般属性招式威力×1.2 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:4 |
| 97 | 狙击手<br><sub>Sniper</sub><br><sub><code>SNIPER</code></sub> | 击中要害时，威力会变得更强。 | 常驻 / 被动 | 1.5 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:4 |
| 98 | 魔法防守<br><sub>Magic Guard</sub><br><sub><code>MAGIC_GUARD</code></sub> | 不会受到攻击以外的伤害。 | 将受到间接伤害时 | 免疫间接伤害 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:4 |
| 99 | 无防守<br><sub>No Guard</sub><br><sub><code>NO_GUARD</code></sub> | 由于无防守战术，双方使出的招式都必定会击中。 | 常驻 / 被动 ／ 常驻（双打判定） | 双打模式加成 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:4 \| 传说/UP特性池 |
| 100 | 慢出<br><sub>Stall</sub><br><sub><code>STALL</code></sub> | 使出招式的顺序必定会变为最后。 | 常驻（优先度修正） | 招式优先度修正：(条件) -0.2 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:4 |
| 101 | 技术高手<br><sub>Technician</sub><br><sub><code>TECHNICIAN</code></sub> | 攻击时可以将低威力招式的威力提高。 | 使用招式前 | 满足条件时招式威力提升：(条件) 1.5 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:4 |
| 102 | 叶子防守<br><sub>Leaf Guard</sub><br><sub><code>LEAF_GUARD</code></sub> | 晴朗天气时，不会变为异常状态。 | 将陷入异常状态时 | 免疫 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:4 |
| 103 | 笨拙<br><sub>Klutz</sub><br><sub><code>KLUTZ</code></sub> | 无法使用持有的道具。 | — | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:4 |
| 104 | 破格<br><sub>Mold Breaker</sub><br><sub><code>MOLD_BREAKER</code></sub> | 可以不受对手特性的干扰，向对手使出招式。 | 出场时 ／ 常驻（无视对手特性） | 出场时发布提示消息；使出招式时无视对手特性 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:4 |
| 105 | 超幸运<br><sub>Super Luck</sub><br><sub><code>SUPER_LUCK</code></sub> | 因为拥有超幸运，攻击容易击中对手的要害。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:4 |
| 106 | 引爆<br><sub>Aftermath</sub><br><sub><code>AFTERMATH</code></sub> | 变为濒死时，会对接触到自己的对手造成伤害。 | 濒死时 | 被接触招式击倒时反伤对手（1/4 最大 HP） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:4 |
| 107 | 危险预知<br><sub>Anticipation</sub><br><sub><code>ANTICIPATION</code></sub> | 可以察觉到对手拥有的危险招式。 | 常驻 / 被动 | Tn (条件) | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:4 |
| 108 | 预知梦<br><sub>Forewarn</sub><br><sub><code>FOREWARN</code></sub> | 出场时，只读取１个对手拥有的招式。 | 出场时 | 说明中的数值：１ | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:4 |
| 109 | 纯朴<br><sub>Unaware</sub><br><sub><code>UNAWARE</code></sub> | 可以无视对手的能力变化，进行攻击。 | 常驻 / 被动 | [攻击,防御,特攻,特防,命中,回避] | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:4 |
| 110 | 有色眼镜<br><sub>Tinted Lens</sub><br><sub><code>TINTED_LENS</code></sub> | 可以将效果不好的招式以通常的威力使出。 | 使用招式前 | 2 (条件) | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:4 |
| 111 | 过滤<br><sub>Filter</sub><br><sub><code>FILTER</code></sub> | 受到效果绝佳的攻击时，可以减弱其威力。 | 成为招式目标时（伤害结算前） | 受伤倍率修正：(条件) 0.75 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:4 |
| 112 | 慢启动<br><sub>Slow Start</sub><br><sub><code>SLOW_START</code></sub> | 在５回合内，攻击和速度减半。 | 出场时 | 出场时附加慢启动 5 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:4 |
| 113 | 胆量<br><sub>Scrappy</sub><br><sub><code>SCRAPPY</code></sub> | 一般属性和格斗属性的招式可以击中幽灵属性的宝可梦。对威吓也毫不动摇。 | 常驻 / 被动 ／ 规则标签（不单独触发） | 无视对手的属性免疫；免疫对手的威吓/降能力效果 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:4 |
| 114 | 引水<br><sub>Storm Drain</sub><br><sub><code>STORM_DRAIN</code></sub> | 将水属性的招式引到自己身上，不会受到伤害，而是会提高特攻。 | 成为招式目标时（伤害结算前） ／ 成为招式目标时（吸引） | 吸引并免疫水属性招式；被水属性招式命中时免疫并提升能力：特攻 1 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:4 |
| 115 | 冰冻之躯<br><sub>Ice Body</sub><br><sub><code>ICE_BODY</code></sub> | 下雪天气时，会缓缓回复ＨＰ。 | 将受到天气伤害时 ／ 常驻 / 被动 | 免疫天气伤害；冰雹下雪天气下每回合回复 HP | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:4 |
| 116 | 坚硬岩石<br><sub>Solid Rock</sub><br><sub><code>SOLID_ROCK</code></sub> | 受到效果绝佳的攻击时，可以减弱其威力。 | 成为招式目标时（伤害结算前） | 受伤倍率修正：(条件) 0.75 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:4 |
| 117 | 降雪<br><sub>Snow Warning</sub><br><sub><code>SNOW_WARNING</code></sub> | 出场时，会将天气变为下雪。 | 出场时 ／ 区域切换后 | 出场时把天气变为下雪；切换区域后把天气变为下雪 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:4 \| 传说/UP特性池 |
| 118 | 采蜜<br><sub>Honey Gather</sub><br><sub><code>HONEY_GATHER</code></sub> | 战斗结束时，有时候会捡来甜甜蜜。 | 战斗结束后 ／ 规则标签（不单独触发） | —（由代码固定，无显式参数） | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:4 |
| 119 | 察觉<br><sub>Frisk</sub><br><sub><code>FRISK</code></sub> | 出场时，可以察觉对手的特性。 | 出场时 | —（由代码固定，无显式参数） | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:4 |
| 120 | 舍身<br><sub>Reckless</sub><br><sub><code>RECKLESS</code></sub> | 自己会因反作用力受伤的招式，其威力会提高。 | 使用招式前 | 满足条件时招式威力提升：(条件) 1.2 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:4 |
| 121 | 多属性<br><sub>Multitype</sub><br><sub><code>MULTITYPE</code></sub> | 根据持有的石板或Ｚ纯晶，自己的属性会改变。 | 规则标签（不单独触发） | —（由代码固定，无显式参数） | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:4 |
| 122 | 花之礼<br><sub>Flower Gift</sub><br><sub><code>FLOWER_GIFT</code></sub> | 晴朗天气时，自己与同伴的攻击和特防能力会提高。 | 出场时 ／ 常驻 / 被动 ／ 规则标签（不单独触发） | Ss 攻击 1.5；Ss 特防 1.5；KO 攻击 1.5；KO 特防 1.5；花之礼 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:4 |
| 123 | 梦魇<br><sub>Bad Dreams</sub><br><sub><code>BAD_DREAMS</code></sub> | 给予睡眠状态的对手伤害。 | 每回合结束时 | 每回合结束触发： | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:4 |
| 124 | 顺手牵羊<br><sub>Pickpocket</sub><br><sub><code>PICKPOCKET</code></sub> | 盗取接触到自己的对手的道具。 | 受到招式攻击后 | 受到攻击后触发：(条件) | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:5 |
| 125 | 强行<br><sub>Sheer Force</sub><br><sub><code>SHEER_FORCE</code></sub> | 招式的追加效果消失，但因此能以更高的威力使出招式。 | 使用招式前 ／ 招式效果结算时 | 满足条件时招式威力提升：(条件) 1.3；0 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:5 |
| 126 | 唱反调<br><sub>Contrary</sub><br><sub><code>CONTRARY</code></sub> | 能力的变化发生逆转，原本提高时会降低，而原本降低时会提高。 | 常驻 / 被动 | -1 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:5 \| 传说/UP特性池 |
| 127 | 紧张感<br><sub>Unnerve</sub><br><sub><code>UNNERVE</code></sub> | 让对手紧张，使其无法食用树果。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:5 |
| 128 | 不服输<br><sub>Defiant</sub><br><sub><code>DEFIANT</code></sub> | 被对手降低能力时，攻击会大幅提高。 | 自身能力等级变化后 | 自身能力变化后再变化：(条件) 攻击 2 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:5 |
| 129 | 软弱<br><sub>Defeatist</sub><br><sub><code>DEFEATIST</code></sub> | ＨＰ减半时，会变得软弱，攻击和特攻会减半。 | 常驻（能力值修正） | 常驻能力倍率修正：攻击 0.5；常驻能力倍率修正：特攻 0.5 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:5 |
| 130 | 诅咒之躯<br><sub>Cursed Body</sub><br><sub><code>CURSED_BODY</code></sub> | 受到攻击时，有时会把对手的招式变为定身法状态。 | 受到招式攻击后 | 受到攻击后封锁对手招式 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:5 |
| 131 | 治愈之心<br><sub>Healer</sub><br><sub><code>HEALER</code></sub> | 有时会治愈异常状态的同伴。 | 常驻 / 被动 | Mu | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:5 |
| 132 | 友情防守<br><sub>Friend Guard</sub><br><sub><code>FRIEND_GUARD</code></sub> | 可以减少我方的伤害。 | 成为招式目标时（伤害结算前） | 减少我方受到的伤害：0.75 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:5 |
| 133 | 碎裂铠甲<br><sub>Weak Armor</sub><br><sub><code>WEAK_ARMOR</code></sub> | 受到物理招式的伤害时，防御会降低，速度会大幅提高。 | 受到招式攻击后 | 受到攻击后自身能力变化：(条件) 防御 -1；受到攻击后自身能力变化：(条件) 速度 2 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:5 |
| 134 | 重金属<br><sub>Heavy Metal</sub><br><sub><code>HEAVY_METAL</code></sub> | 自身的重量会变为２倍。 | 常驻 / 被动 | 2 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:5 |
| 135 | 轻金属<br><sub>Light Metal</sub><br><sub><code>LIGHT_METAL</code></sub> | 自身的重量会减半。 | 常驻 / 被动 | 0.5 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:5 |
| 136 | 多重鳞片<br><sub>Multiscale</sub><br><sub><code>MULTISCALE</code></sub> | ＨＰ全满时，受到的伤害会变少。 | 成为招式目标时（伤害结算前） | 受伤倍率修正：(条件) 0.5 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:5 |
| 137 | 中毒激升<br><sub>Toxic Boost</sub><br><sub><code>TOXIC_BOOST</code></sub> | 变为中毒状态时，物理招式的威力会提高。 | 使用招式前 | 满足条件时招式威力提升：(条件) 1.5 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:5 |
| 138 | 受热激升<br><sub>Flare Boost</sub><br><sub><code>FLARE_BOOST</code></sub> | 变为灼伤状态时，特殊招式的威力会提高。 | 使用招式前 | 满足条件时招式威力提升：(条件) 1.5 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:5 |
| 139 | 收获<br><sub>Harvest</sub><br><sub><code>HARVEST</code></sub> | 可以多次制作出已被使用掉的树果。 | 每回合结束时 | 每回合结束获得道具/树果 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:5 |
| 140 | 心灵感应<br><sub>Telepathy</sub><br><sub><code>TELEPATHY</code></sub> | 读取我方的攻击，并闪避其招式伤害。 | 成为招式目标时（伤害结算前） | 免疫特定招式 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:5 |
| 141 | 心情不定<br><sub>Moody</sub><br><sub><code>MOODY</code></sub> | 每一回合，能力中的某项会大幅提高，而某项会降低。 | 每回合结束时 | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:5 |
| 142 | 防尘<br><sub>Overcoat</sub><br><sub><code>OVERCOAT</code></sub> | 不会受到沙暴的伤害。也不会受到粉末类和孢子类招式的影响。 | 将受到天气伤害时 ／ 成为招式目标时（伤害结算前） | 免疫天气伤害；免疫特定招式 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:5 |
| 143 | 毒手<br><sub>Poison Touch</sub><br><sub><code>POISON_TOUCH</code></sub> | 只通过接触就有可能让对手变为中毒状态。 | 使用招式后 | 使用招式后触发：30 中毒 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:5 |
| 144 | 再生力<br><sub>Regenerator</sub><br><sub><code>REGENERATOR</code></sub> | 退回同行队伍后，ＨＰ会少量回复。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:5 |
| 145 | 健壮胸肌<br><sub>Big Pecks</sub><br><sub><code>BIG_PECKS</code></sub> | 不会受到防御降低的效果。 | 自身能力等级将变化时 | 保护能力不被降低：防御 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:5 |
| 146 | 拨沙<br><sub>Sand Rush</sub><br><sub><code>SAND_RUSH</code></sub> | 沙暴天气时，速度会提高。 | 将受到天气伤害时 ／ 常驻（能力值修正） | 常驻能力倍率修正：速度 2；免疫天气伤害 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:5 |
| 147 | 奇迹皮肤<br><sub>Wonder Skin</sub><br><sub><code>WONDER_SKIN</code></sub> | 成为不易受到变化招式攻击的身体。 | 成为招式目标时（伤害结算前） | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:5 |
| 148 | 分析<br><sub>Analytic</sub><br><sub><code>ANALYTIC</code></sub> | 如果在最后使出招式，招式的威力会提高。 | 使用招式前 | 满足条件时招式威力提升：(条件) 1.3 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:5 |
| 149 | 幻觉<br><sub>Illusion</sub><br><sub><code>ILLUSION</code></sub> | 假扮成同行队伍中的最后一只宝可梦出场，迷惑对手。 | 规则标签（不单独触发） | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:5 |
| 150 | 变身者<br><sub>Imposter</sub><br><sub><code>IMPOSTER</code></sub> | 变身为当前面对的宝可梦。 | 出场时 ／ 规则标签（不单独触发） | —（由代码固定，无显式参数） | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:5 |
| 151 | 穿透<br><sub>Infiltrator</sub><br><sub><code>INFILTRATOR</code></sub> | 可以穿透对手的壁障或替身进行攻击。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:5 |
| 152 | 木乃伊<br><sub>Mummy</sub><br><sub><code>MUMMY</code></sub> | 被对手接触到后，会将对手变为木乃伊。 | 受到招式攻击后 | 受到攻击后把特性转移给对手 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:5 |
| 153 | 自信过度<br><sub>Moxie</sub><br><sub><code>MOXIE</code></sub> | 如果打倒对手，就会充满自信，攻击会提高。 | 常驻 / 被动 | 攻击 1 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:5 |
| 154 | 正义之心<br><sub>Justified</sub><br><sub><code>JUSTIFIED</code></sub> | 受到恶属性的招式攻击时，因为正义感，攻击会提高。 | 受到招式攻击后 | 受到攻击后自身能力变化：(条件) 攻击 1 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:5 |
| 155 | 胆怯<br><sub>Rattled</sub><br><sub><code>RATTLED</code></sub> | 受到恶属性、幽灵属性和虫属性的攻击或威吓时，会因胆怯而速度提高。 | 受到招式攻击后 ／ 常驻 / 被动 | 受到攻击后自身能力变化：(条件) 速度 1；速度 1 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:5 |
| 156 | 魔法镜<br><sub>Magic Bounce</sub><br><sub><code>MAGIC_BOUNCE</code></sub> | 可以不受到由对手使出的变化招式影响，并将其反弹。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:5 |
| 157 | 食草<br><sub>Sap Sipper</sub><br><sub><code>SAP_SIPPER</code></sub> | 受到草属性的招式攻击时，不会受到伤害，而是攻击会提高。 | 成为招式目标时（伤害结算前） | 被草属性招式命中时免疫并提升能力：攻击 1 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:5 |
| 158 | 恶作剧之心<br><sub>Prankster</sub><br><sub><code>PRANKSTER</code></sub> | 可以率先使出变化招式。 | 常驻（优先度修正） | 招式优先度修正：(条件) 1 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:5 \| 传说/UP特性池 |
| 159 | 沙之力<br><sub>Sand Force</sub><br><sub><code>SAND_FORCE</code></sub> | 沙暴天气时，岩石属性、地面属性和钢属性的招式威力会提高。 | 使用招式前 ／ 将受到天气伤害时 | 岩石1.3招式威力提升；地面1.3招式威力提升；钢1.3招式威力提升；免疫天气伤害 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:5 |
| 160 | 铁刺<br><sub>Iron Barbs</sub><br><sub><code>IRON_BARBS</code></sub> | 用铁刺给予接触到自己的对手伤害。 | 受到招式攻击后 | 被接触招式命中时反伤对手（1/8 最大 HP） | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:5 |
| 161 | 达摩模式<br><sub>Zen Mode</sub><br><sub><code>ZEN_MODE</code></sub> | ＨＰ变为一半以下时，样子会改变。 | 出场时 ／ 战斗开始时 ／ 每回合结束时 ／ 规则标签（不单独触发） | (条件)；每回合结束变换形态 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:5 |
| 162 | 胜利之星<br><sub>Victory Star</sub><br><sub><code>VICTORY_STAR</code></sub> | 自己和同伴的命中率会提高。 | 常驻 / 被动 ／ 常驻（能力值修正） | 常驻能力倍率修正：命中 1.1；命中 1.1 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:5 |
| 163 | 涡轮火焰<br><sub>Turboblaze</sub><br><sub><code>TURBOBLAZE</code></sub> | 可以不受对手特性的干扰，向对手使出招式。 | 出场时 ／ 常驻（无视对手特性） | 出场时发布提示消息；使出招式时无视对手特性 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:5 |
| 164 | 兆级电压<br><sub>Teravolt</sub><br><sub><code>TERAVOLT</code></sub> | 可以不受对手特性的干扰，向对手使出招式。 | 出场时 ／ 常驻（无视对手特性） | 出场时发布提示消息；使出招式时无视对手特性 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:5 |
| 165 | 芳香幕<br><sub>Aroma Veil</sub><br><sub><code>AROMA_VEIL</code></sub> | 可以防住向自己和同伴发出的心灵攻击。 | 常驻 / 被动 | [着迷,挑衅,定身法,无理取闹,回复封锁] | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:6 |
| 166 | 花幕<br><sub>Flower Veil</sub><br><sub><code>FLOWER_VEIL</code></sub> | 我方的草属性宝可梦能力不会降低，也不会变为异常状态。 | 将陷入异常状态时 ／ 常驻 / 被动 ／ 自身能力等级将变化时 | (条件)；(条件) 困倦 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:6 |
| 167 | 颊囊<br><sub>Cheek Pouch</sub><br><sub><code>CHEEK_POUCH</code></sub> | 无论是哪种树果，食用后，ＨＰ都会回复。 | 常驻 / 被动 | 1/3 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:6 |
| 168 | 变幻自如<br><sub>Protean</sub><br><sub><code>PROTEAN</code></sub> | 变为与自己使出的招式相同的属性。每次出场战斗仅生效一次。 | 使用招式前 | —（由代码固定，无显式参数） | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:6 \| 传说/UP特性池 |
| 169 | 毛皮大衣<br><sub>Fur Coat</sub><br><sub><code>FUR_COAT</code></sub> | 对手给予的物理招式的伤害会减半。 | 成为招式目标时（伤害结算前） | 受伤倍率修正：(条件) 0.5 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:6 \| 传说/UP特性池 |
| 170 | 魔术师<br><sub>Magician</sub><br><sub><code>MAGICIAN</code></sub> | 夺走被自己的招式击中的对手的道具。 | 使用招式后 | 使用招式后夺取对手道具（几率 ?%） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:6 |
| 171 | 防弹<br><sub>Bulletproof</sub><br><sub><code>BULLETPROOF</code></sub> | 可以防住对手的球和弹类招式。 | 成为招式目标时（伤害结算前） | 免疫特定招式 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:6 |
| 172 | 好胜<br><sub>Competitive</sub><br><sub><code>COMPETITIVE</code></sub> | 如果被对手降低能力，特攻会大幅提高。 | 自身能力等级变化后 | 自身能力变化后再变化：(条件) 特攻 2 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:6 |
| 173 | 强壮之颚<br><sub>Strong Jaw</sub><br><sub><code>STRONG_JAW</code></sub> | 因为颚部强壮，啃咬类招式的威力会提高。 | 使用招式前 | 满足条件时招式威力提升：(条件) 1.5 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:6 |
| 174 | 冰冻皮肤<br><sub>Refrigerate</sub><br><sub><code>REFRIGERATE</code></sub> | 一般属性的招式会变为冰属性。威力会少量提高。 | 使用招式前 | 冰属性招式威力×1.2 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:6 |
| 175 | 甜幕<br><sub>Sweet Veil</sub><br><sub><code>SWEET_VEIL</code></sub> | 自己和同伴的宝可梦不会变为睡眠状态。 | 将陷入异常状态时 ／ 常驻 / 被动 | 睡眠；困倦 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:6 |
| 176 | 战斗切换<br><sub>Stance Change</sub><br><sub><code>STANCE_CHANGE</code></sub> | 如果使出攻击招式，会变为刀剑形态，如果使出招式 会变为盾牌形态 。 | 规则标签（不单独触发） | —（由代码固定，无显式参数） | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:6 |
| 177 | 疾风之翼<br><sub>Gale Wings</sub><br><sub><code>GALE_WINGS</code></sub> | ＨＰ全满时，飞行属性的招式可以率先使出。 | 常驻（优先度修正） | 招式优先度修正：(条件) 1 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:6 |
| 178 | 超级发射器<br><sub>Mega Launcher</sub><br><sub><code>MEGA_LAUNCHER</code></sub> | 波动和波导类招式的威力会提高。 | 使用招式前 | 满足条件时招式威力提升：(条件) 1.5 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:6 |
| 179 | 草之毛皮<br><sub>Grass Pelt</sub><br><sub><code>GRASS_PELT</code></sub> | 在青草场地时，防御会提高。 | 常驻 / 被动 | Ss 防御 1.5 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:6 |
| 180 | 共生<br><sub>Symbiosis</sub><br><sub><code>SYMBIOSIS</code></sub> | 同伴使用道具时，会把自己持有的道具传递给同伴。 | — | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:6 |
| 181 | 硬爪<br><sub>Tough Claws</sub><br><sub><code>TOUGH_CLAWS</code></sub> | 接触到对手的招式威力会提高。 | 使用招式前 | 满足条件时招式威力提升：(条件) 1.3 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:6 |
| 182 | 妖精皮肤<br><sub>Pixilate</sub><br><sub><code>PIXILATE</code></sub> | 一般属性的招式会变为妖精属性。威力会少量提高。 | 使用招式前 | 妖精属性招式威力×1.2 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:6 |
| 183 | 黏滑<br><sub>Gooey</sub><br><sub><code>GOOEY</code></sub> | 对于用攻击接触到自己的对手，会降低其速度。 | 受到招式攻击后 | 受到攻击后自身能力变化：(条件) 速度 -1 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:6 |
| 184 | 飞行皮肤<br><sub>Aerilate</sub><br><sub><code>AERILATE</code></sub> | 一般属性的招式会变为飞行属性。威力会少量提高。 | 使用招式前 | 飞行属性招式威力×1.2 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:6 |
| 185 | 亲子爱<br><sub>Parental Bond</sub><br><sub><code>PARENTAL_BOND</code></sub> | 亲子俩可以合计攻击２次。 | 使用招式前 | 0.25 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:6 |
| 186 | 暗黑气场<br><sub>Dark Aura</sub><br><sub><code>DARK_AURA</code></sub> | 全体的恶属性招式变强。 | 使用招式前 ／ 出场时 | 出场时发布提示消息；恶 4/3 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:6 |
| 187 | 妖精气场<br><sub>Fairy Aura</sub><br><sub><code>FAIRY_AURA</code></sub> | 全体的妖精属性招式变强。 | 使用招式前 ／ 出场时 | 出场时发布提示消息；妖精 4/3 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:6 |
| 188 | 气场破坏<br><sub>Aura Break</sub><br><sub><code>AURA_BREAK</code></sub> | 让气场的效果发生逆转，降低威力。 | 常驻 / 被动 | ro 恶 9/16；ro 妖精 9/16；Tn (条件) | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:6 |
| 189 | 始源之海<br><sub>Primordial Sea</sub><br><sub><code>PRIMORDIAL_SEA</code></sub> | 变为不会受到火属性攻击的天气。 | 出场时 ／ 区域切换后 ／ 常驻 / 被动 | 出场时把天气变为大雨；切换区域后把天气变为大雨 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:6 \| 传说/UP特性池 |
| 190 | 终结之地<br><sub>Desolate Land</sub><br><sub><code>DESOLATE_LAND</code></sub> | 变为不会受到水属性攻击的天气。 | 出场时 ／ 区域切换后 ／ 常驻 / 被动 | 出场时把天气变为大日照；切换区域后把天气变为大日照 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:6 \| 传说/UP特性池 |
| 191 | 德尔塔气流<br><sub>Delta Stream</sub><br><sub><code>DELTA_STREAM</code></sub> | 变为令飞行属性的弱点消失的天气。 | 出场时 ／ 区域切换后 ／ 常驻 / 被动 | 出场时把天气变为乱流；切换区域后把天气变为乱流 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:6 \| 传说/UP特性池 |
| 192 | 持久力<br><sub>Stamina</sub><br><sub><code>STAMINA</code></sub> | 受到攻击时，防御会提高。 | 受到招式攻击后 | 受到攻击后自身能力变化：(条件) 防御 1 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:7 |
| 193 | 跃跃欲逃<br><sub>Wimp Out</sub><br><sub><code>WIMP_OUT</code></sub> | ＨＰ变为一半时，会慌慌张张逃走，退回同行队伍中。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:7 |
| 194 | 危险回避<br><sub>Emergency Exit</sub><br><sub><code>EMERGENCY_EXIT</code></sub> | ＨＰ变为一半时，为了回避危险，会退回到同行队伍中。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:7 |
| 195 | 遇水凝固<br><sub>Water Compaction</sub><br><sub><code>WATER_COMPACTION</code></sub> | 受到水属性的招式攻击时，防御会大幅提高。 | 受到招式攻击后 | 受到攻击后自身能力变化：(条件) 防御 2 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:7 |
| 196 | 不仁不义<br><sub>Merciless</sub><br><sub><code>MERCILESS</code></sub> | 攻击中毒状态的对手时，必定会击中要害。 | 常驻 / 被动 | (条件) | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:7 |
| 197 | 界限盾壳<br><sub>Shields Down</sub><br><sub><code>SHIELDS_DOWN</code></sub> | ＨＰ变为一半时，壳会坏掉，变得有攻击性。 | 出场时 ／ 常驻 / 被动 ／ 战斗开始时 ／ 每回合结束时 ／ 规则标签（不单独触发） | (条件)；每回合结束变换形态；La；mE 困倦 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:7 |
| 198 | 蹲守<br><sub>Stakeout</sub><br><sub><code>STAKEOUT</code></sub> | 可以对替换出场的对手以２倍的伤害进行攻击。 | 使用招式前 | 满足条件时招式威力提升：(条件) 2 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:7 |
| 199 | 水泡<br><sub>Water Bubble</sub><br><sub><code>WATER_BUBBLE</code></sub> | 降低自己受到的火属性招式的威力，不会灼伤。 | 使用招式前 ／ 将陷入异常状态时 ／ 成为招式目标时（伤害结算前） | 受到属性伤害倍率修正：火 0.5；水2招式威力提升；免疫灼伤 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:7 \| 传说/UP特性池 |
| 200 | 钢能力者<br><sub>Steelworker</sub><br><sub><code>STEELWORKER</code></sub> | 钢属性的招式威力会提高。 | 使用招式前 | 钢招式威力提升 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:7 |
| 201 | 怒火冲天<br><sub>Berserk</sub><br><sub><code>BERSERK</code></sub> | 因对手的攻击ＨＰ变为一半时，特攻会提高。 | 受到招式攻击后 | 受到攻击且满足 HP 条件时能力变化：(条件) 0.5 特攻 1 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:7 |
| 202 | 拨雪<br><sub>Slush Rush</sub><br><sub><code>SLUSH_RUSH</code></sub> | 下雪天气时，速度会提高。 | 常驻（能力值修正） | 常驻能力倍率修正：速度 2 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:7 |
| 203 | 远隔<br><sub>Long Reach</sub><br><sub><code>LONG_REACH</code></sub> | 可以不接触对手就使出所有的招式。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:7 |
| 204 | 湿润之声<br><sub>Liquid Voice</sub><br><sub><code>LIQUID_VOICE</code></sub> | 所有的声音招式都变为水属性。 | 使用招式前 | 水属性招式威力×1 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:7 |
| 205 | 先行治疗<br><sub>Triage</sub><br><sub><code>TRIAGE</code></sub> | 可以率先使出回复招式。 | 常驻（优先度修正） | 招式优先度修正：(条件) 3 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:7 |
| 206 | 电气皮肤<br><sub>Galvanize</sub><br><sub><code>GALVANIZE</code></sub> | 一般属性的招式会变为电属性。威力会少量提高。 | 使用招式前 | 电属性招式威力×1.2 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:7 |
| 207 | 冲浪之尾<br><sub>Surge Surfer</sub><br><sub><code>SURGE_SURFER</code></sub> | 电气场地时，速度会变为２倍。 | 常驻 / 被动 | Ss 速度 2 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:7 |
| 208 | 鱼群<br><sub>Schooling</sub><br><sub><code>SCHOOLING</code></sub> | ＨＰ多的时候会聚起来变强。ＨＰ剩余量变少时，群体会分崩离析。 | 出场时 ／ 战斗开始时 ／ 每回合结束时 ／ 规则标签（不单独触发） | (条件)；每回合结束变换形态 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:7 |
| 209 | 画皮<br><sub>Disguise</sub><br><sub><code>DISGUISE</code></sub> | 通过画皮覆盖住身体，可以防住１次攻击。 | 常驻 / 被动 ／ 成为招式目标时（伤害结算前） ／ 战斗开始时 ／ 规则标签（不单独触发） | tr 画皮 0；(条件) 0 画皮 (条件) (条件)；(条件) | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:7 |
| 210 | 牵绊变身<br><sub>Battle Bond</sub><br><sub><code>BATTLE_BOND</code></sub> | 打倒对手时，与训练家的牵绊会增强，自己的攻击、特攻、速度会提高。 | 常驻 / 被动 ／ 战斗开始时 ／ 规则标签（不单独触发） | (条件)；攻击 1；特攻 1；速度 1 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:7 |
| 211 | 群聚变形<br><sub>Power Construct</sub><br><sub><code>POWER_CONSTRUCT</code></sub> | ＨＰ变为一半时，细胞们会赶来支援，变为完全体形态。 | 常驻 / 被动 ／ 规则标签（不单独触发） | Mr (条件)；LO (条件)；oR (条件) | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:7 |
| 212 | 腐蚀<br><sub>Corrosion</sub><br><sub><code>CORROSION</code></sub> | 可以使钢属性和毒属性的宝可梦也陷入中毒状态。 | 常驻 / 被动 | [中毒,剧毒] [钢,毒] | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:7 |
| 213 | 绝对睡眠<br><sub>Comatose</sub><br><sub><code>COMATOSE</code></sub> | 总是半梦半醒的状态，绝对不会醒来。可以就这么睡着进行攻击。 | 将陷入异常状态时 ／ 常驻 / 被动 ／ 规则标签（不单独触发） | 免疫(条件)；免疫困倦 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:7 |
| 214 | 女王的威严<br><sub>Queenly Majesty</sub><br><sub><code>QUEENLY_MAJESTY</code></sub> | 向对手施加威慑力，使其无法对我方使出先制招式。 | 成为招式目标时（伤害结算前） | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:7 |
| 215 | 飞出的内在物<br><sub>Innards Out</sub><br><sub><code>INNARDS_OUT</code></sub> | 被对手打倒的时候，会给予对手相当于ＨＰ剩余量的伤害。 | 濒死时 | 濒死时触发： | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:7 |
| 216 | 舞者<br><sub>Dancer</sub><br><sub><code>DANCER</code></sub> | 有谁使出跳舞招式时，自己也能就这么接着使出跳舞招式。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:7 |
| 217 | 蓄电池<br><sub>Battery</sub><br><sub><code>BATTERY</code></sub> | 会提高我方的特殊招式的威力。 | 常驻 / 被动 | 特殊 1.3 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:7 |
| 218 | 毛茸茸<br><sub>Fluffy</sub><br><sub><code>FLUFFY</code></sub> | 会将对手所给予的接触类招式的伤害减半，但火属性招式的伤害会变为２倍。 | 成为招式目标时（伤害结算前） | 受伤倍率修正：(条件) 0.5；受伤倍率修正：(条件) 2 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:7 |
| 219 | 鲜艳之躯<br><sub>Dazzling</sub><br><sub><code>DAZZLING</code></sub> | 让对手吓一跳，使其无法对我方使出先制招式。 | 成为招式目标时（伤害结算前） | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:7 |
| 220 | 魂心<br><sub>Soul-Heart</sub><br><sub><code>SOUL_HEART</code></sub> | 宝可梦每次变为濒死状态时，特攻会提高。 | 常驻 / 被动 | 特攻 1 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:7 |
| 221 | 卷发<br><sub>Tangling Hair</sub><br><sub><code>TANGLING_HAIR</code></sub> | 对于用攻击接触到自己的对手，会降低其速度。 | 受到招式攻击后 | 受到攻击后自身能力变化：(条件) 速度 -1 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:7 |
| 222 | 接球手<br><sub>Receiver</sub><br><sub><code>RECEIVER</code></sub> | 继承被打倒的同伴的特性，变为相同的特性。 | 常驻 / 被动 ／ 规则标签（不单独触发） | —（由代码固定，无显式参数） | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:7 |
| 223 | 化学之力<br><sub>Power of Alchemy</sub><br><sub><code>POWER_OF_ALCHEMY</code></sub> | 继承被打倒的同伴的特性，变为相同的特性。 | 常驻 / 被动 ／ 规则标签（不单独触发） | —（由代码固定，无显式参数） | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:7 |
| 224 | 异兽提升<br><sub>Beast Boost</sub><br><sub><code>BEAST_BOOST</code></sub> | 打倒对手的时候，自己最高的那项能力会提高。 | 常驻 / 被动 | (条件) 1 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:7 |
| 225 | ＡＲ系统<br><sub>RKS System</sub><br><sub><code>RKS_SYSTEM</code></sub> | 根据持有的存储碟，自己的属性会改变。 | 规则标签（不单独触发） | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:7 |
| 226 | 电气制造者<br><sub>Electric Surge</sub><br><sub><code>ELECTRIC_SURGE</code></sub> | 出场时，会布下电气场地。 | 出场时 ／ 区域切换后 | 出场时布置电气场地；切换区域后布置电气场地 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:7 \| 传说/UP特性池 |
| 227 | 精神制造者<br><sub>Psychic Surge</sub><br><sub><code>PSYCHIC_SURGE</code></sub> | 出场时，会布下精神场地。 | 出场时 ／ 区域切换后 | 出场时布置精神场地；切换区域后布置精神场地 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:7 \| 传说/UP特性池 |
| 228 | 薄雾制造者<br><sub>Misty Surge</sub><br><sub><code>MISTY_SURGE</code></sub> | 出场时，会布下薄雾场地。 | 出场时 ／ 区域切换后 | 出场时布置薄雾场地；切换区域后布置薄雾场地 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:7 \| 传说/UP特性池 |
| 229 | 青草制造者<br><sub>Grassy Surge</sub><br><sub><code>GRASSY_SURGE</code></sub> | 出场时，会布下青草场地。 | 出场时 ／ 区域切换后 | 出场时布置青草场地；切换区域后布置青草场地 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:7 \| 传说/UP特性池 |
| 230 | 金属防护<br><sub>Full Metal Body</sub><br><sub><code>FULL_METAL_BODY</code></sub> | 不会因为对手的招式或特性而被降低能力。 | 自身能力等级将变化时 | 保护能力不被降低： | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:7 |
| 231 | 幻影防守<br><sub>Shadow Shield</sub><br><sub><code>SHADOW_SHIELD</code></sub> | ＨＰ全满时，受到的伤害会变少。 | 成为招式目标时（伤害结算前） | 受伤倍率修正：(条件) 0.5 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:7 |
| 232 | 棱镜装甲<br><sub>Prism Armor</sub><br><sub><code>PRISM_ARMOR</code></sub> | 受到效果绝佳的攻击时，可以减弱其威力。 | 成为招式目标时（伤害结算前） | 受伤倍率修正：(条件) 0.75 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:7 |
| 233 | 脑核之力<br><sub>Neuroforce</sub><br><sub><code>NEUROFORCE</code></sub> | 效果绝佳的攻击，威力会变得更强。 | 使用招式前 | 满足条件时招式威力提升：(条件) 1.25 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:7 |
| 234 | 不挠之剑<br><sub>Intrepid Sword</sub><br><sub><code>INTREPID_SWORD</code></sub> | 首次出场时，攻击会提高。 | 出场时 | 出场时使目标能力变化：攻击 1 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:8 |
| 235 | 不屈之盾<br><sub>Dauntless Shield</sub><br><sub><code>DAUNTLESS_SHIELD</code></sub> | 首次出场时，防御会提高。 | 出场时 | 出场时使目标能力变化：防御 1 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:8 |
| 236 | 自由者<br><sub>Libero</sub><br><sub><code>LIBERO</code></sub> | 变为与自己使出的招式相同的属性。每次出场战斗仅生效一次。 | 使用招式前 | —（由代码固定，无显式参数） | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:8 |
| 237 | 捡球<br><sub>Ball Fetch</sub><br><sub><code>BALL_FETCH</code></sub> | 没有携带道具时，会拾取第１个投出后捕捉失败的精灵球。 | 每回合结束时 | 说明中的数值：１ | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:8 |
| 238 | 棉絮<br><sub>Cotton Down</sub><br><sub><code>COTTON_DOWN</code></sub> | 受到攻击后撒下棉絮，降低除自己以外的所有宝可梦的速度。 | 受到招式攻击后 | 受到攻击后自身能力变化：(条件) 速度 -1 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:8 |
| 239 | 螺旋尾鳍<br><sub>Propeller Tail</sub><br><sub><code>PROPELLER_TAIL</code></sub> | 能无视具有吸引对手招式效果的特性或招式的影响。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:8 |
| 240 | 镜甲<br><sub>Mirror Armor</sub><br><sub><code>MIRROR_ARMOR</code></sub> | 只反弹自己受到的能力降低效果。 | 自身能力等级将变化时 | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:8 |
| 241 | 一口导弹<br><sub>Gulp Missile</sub><br><sub><code>GULP_MISSILE</code></sub> | 冲浪或潜水时会叼来猎物。受到伤害时，会吐出猎物进行攻击。 | 规则标签（不单独触发） | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:8 |
| 242 | 坚毅<br><sub>Stalwart</sub><br><sub><code>STALWART</code></sub> | 能无视具有吸引对手招式效果的特性或招式的影响。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:8 |
| 243 | 蒸汽机<br><sub>Steam Engine</sub><br><sub><code>STEAM_ENGINE</code></sub> | 受到水属性或火属性的招式攻击时，速度会巨幅提高。 | 受到招式攻击后 | 受到攻击后自身能力变化：(条件) 速度 6 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:8 |
| 244 | 庞克摇滚<br><sub>Punk Rock</sub><br><sub><code>PUNK_ROCK</code></sub> | 声音招式的威力会提高。受到的声音招式伤害会减半。 | 使用招式前 ／ 成为招式目标时（伤害结算前） | 满足条件时招式威力提升：(条件) 1.3；受伤倍率修正：(条件) 0.5 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:8 |
| 245 | 吐沙<br><sub>Sand Spit</sub><br><sub><code>SAND_SPIT</code></sub> | 受到攻击时，会刮起沙暴。 | 受到招式攻击后 | 受到攻击后触发：沙暴 (条件) | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:8 |
| 246 | 冰鳞粉<br><sub>Ice Scales</sub><br><sub><code>ICE_SCALES</code></sub> | 由于有冰鳞粉的守护，受到的特殊攻击伤害会减半。 | 成为招式目标时（伤害结算前） | 受伤倍率修正：(条件) 0.5 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:8 |
| 247 | 熟成<br><sub>Ripen</sub><br><sub><code>RIPEN</code></sub> | 使树果成熟，效果变为２倍。 | 常驻 / 被动 | 说明中的数值：２倍 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:8 |
| 248 | 结冻头<br><sub>Ice Face</sub><br><sub><code>ICE_FACE</code></sub> | 头部的冰会代替自己承受物理攻击，但是样子会改变。下雪时，冰会恢复原状。 | 常驻 / 被动 ／ 成为招式目标时（伤害结算前） ／ 战斗开始时 ／ 规则标签（不单独触发） | tr 冰面 0；天气变化时附加冰面；(条件) 0 冰面 (条件)；(条件) | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:8 |
| 249 | 能量点<br><sub>Power Spot</sub><br><sub><code>POWER_SPOT</code></sub> | 只要处在相邻位置，招式的威力就会提高。 | 常驻 / 被动 | [特殊,物理] 1.3 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:8 |
| 250 | 拟态<br><sub>Mimicry</sub><br><sub><code>MIMICRY</code></sub> | 宝可梦的属性会根据场地的状态而变化。 | 出场时 | —（由代码固定，无显式参数） | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:8 |
| 251 | 除障<br><sub>Screen Cleaner</sub><br><sub><code>SCREEN_CLEANER</code></sub> | 出场时，敌方和我方的光墙、反射壁和极光幕的效果会消失。 | 出场时 | [极光幕,光墙,反射壁] | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:8 |
| 252 | 钢之意志<br><sub>Steely Spirit</sub><br><sub><code>STEELY_SPIRIT</code></sub> | 我方的钢属性攻击威力会提高。 | 使用招式前 | 钢 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:8 |
| 253 | 灭亡之躯<br><sub>Perish Body</sub><br><sub><code>PERISH_BODY</code></sub> | 受到接触类招式攻击时，双方都会在３回合后变为濒死状态。替换后效果消失。 | 受到招式攻击后 | 受到攻击后触发：4 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:8 |
| 254 | 游魂<br><sub>Wandering Spirit</sub><br><sub><code>WANDERING_SPIRIT</code></sub> | 与使用接触类招式攻击自己的宝可梦互换特性。 | 受到招式攻击后 | 受到攻击后交换双方特性 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:8 |
| 255 | 一猩一意<br><sub>Gorilla Tactics</sub><br><sub><code>GORILLA_TACTICS</code></sub> | 虽然攻击会提高，但是只能使出一开始所选的招式。 | 使用招式后 | —（由代码固定，无显式参数） | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:8 |
| 256 | 化学变化气体<br><sub>Neutralizing Gas</sub><br><sub><code>NEUTRALIZING_GAS</code></sub> | 让周围充满化学变化气体，特性的效果会消失或者无法发动。 | 出场时 ／ 常驻 / 被动 ／ 规则标签（不单独触发） | 化学变化气体 0 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:8 |
| 257 | 粉彩护幕<br><sub>Pastel Veil</sub><br><sub><code>PASTEL_VEIL</code></sub> | 自己和同伴都不会陷入中毒的异常状态。 | 出场时 ／ 将陷入异常状态时 | 中毒 剧毒 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:8 |
| 258 | 饱了又饿<br><sub>Hunger Switch</sub><br><sub><code>HUNGER_SWITCH</code></sub> | 每回合结束时会在满腹花纹与空腹花纹之间交替改变样子。 | 每回合结束时 ／ 规则标签（不单独触发） | 每回合结束变换形态 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:8 |
| 259 | 速击<br><sub>Quick Draw</sub><br><sub><code>QUICK_DRAW</code></sub> | 有时能比对手先一步行动。 | 常驻 / 被动 | 30 | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:8 |
| 260 | 无形拳<br><sub>Unseen Fist</sub><br><sub><code>UNSEEN_FIST</code></sub> | 如果使出的是接触到对手的招式，就可以无视守护效果进行攻击。 | 规则标签（不单独触发） | —（由代码固定，无显式参数） | 原版 \| PT档位:普通 \| PT价:500 \| 引擎层级:8 |
| 261 | 怪药<br><sub>Curious Medicine</sub><br><sub><code>CURIOUS_MEDICINE</code></sub> | 出场时会从贝壳撒药，将我方的能力变化复原。 | 出场时 | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:8 |
| 262 | 电晶体<br><sub>Transistor</sub><br><sub><code>TRANSISTOR</code></sub> | 电属性的招式威力会提高。 | 使用招式前 | 电招式威力提升 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:8 |
| 263 | 龙颚<br><sub>Dragon’s Maw</sub><br><sub><code>DRAGONS_MAW</code></sub> | 龙属性的招式威力会提高。 | 使用招式前 | 龙招式威力提升 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:8 |
| 264 | 苍白嘶鸣<br><sub>Chilling Neigh</sub><br><sub><code>CHILLING_NEIGH</code></sub> | 打倒对手时会用冰冷的声音嘶鸣并提高攻击。 | 常驻 / 被动 | 攻击 1 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:8 |
| 265 | 漆黑嘶鸣<br><sub>Grim Neigh</sub><br><sub><code>GRIM_NEIGH</code></sub> | 打倒对手时会用恐怖的声音嘶鸣并提高特攻。 | 常驻 / 被动 | 特攻 1 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:8 |
| 266 | 人马一体(白)<br><sub>As One</sub><br><sub><code>AS_ONE_GLASTRIER</code></sub> | 兼备蕾冠王的紧张感和雪暴马的苍白嘶鸣这两种特性。 | 出场时 ／ 常驻 / 被动 ／ 规则标签（不单独触发） | 出场时发布提示消息；攻击 1 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:8 |
| 267 | 人马一体(黑)<br><sub>As One</sub><br><sub><code>AS_ONE_SPECTRIER</code></sub> | 兼备蕾冠王的紧张感和灵幽马的漆黑嘶鸣这两种特性。 | 出场时 ／ 常驻 / 被动 ／ 规则标签（不单独触发） | 出场时发布提示消息；特攻 1 | 原版 \| PT档位:史诗 \| PT价:1000 \| 引擎层级:8 |
| 268 | 甩不掉的气味<br><sub>Lingering Aroma</sub><br><sub><code>LINGERING_AROMA</code></sub> | 被对手接触到后，甩不掉的气味会沾上对手。 | 受到招式攻击后 | 受到攻击后把特性转移给对手 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 269 | 掉出种子<br><sub>Seed Sower</sub><br><sub><code>SEED_SOWER</code></sub> | 受到攻击时，会将脚下变成青草场地。 | 受到招式攻击后 | 受到攻击后触发：青草场地 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 270 | 热交换<br><sub>Thermal Exchange</sub><br><sub><code>THERMAL_EXCHANGE</code></sub> | 受到火属性的招式攻击时，攻击会提高，且不会陷入灼伤状态。 | 受到招式攻击后 ／ 将陷入异常状态时 | 受到攻击后自身能力变化：(条件) 攻击 1；免疫灼伤 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 271 | 愤怒甲壳<br><sub>Anger Shell</sub><br><sub><code>ANGER_SHELL</code></sub> | 因被对手攻击而ＨＰ变为一半时，会因愤怒降低防御和特防。但攻击、特攻、速度会提高。 | 受到招式攻击后 | 受到攻击且满足 HP 条件时能力变化：(条件) 0.5 [攻击,特攻,速度] 1；受到攻击且满足 HP 条件时能力变化：(条件) 0.5 [防御,特防] -1 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 272 | 洁净之盐<br><sub>Purifying Salt</sub><br><sub><code>PURIFYING_SALT</code></sub> | 因洁净的盐而不会陷入异常状态。会让幽灵属性的招式伤害减半。 | 将陷入异常状态时 ／ 成为招式目标时（伤害结算前） | 免疫；受到属性伤害倍率修正：幽灵 0.5 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 273 | 焦香之躯<br><sub>Well-Baked Body</sub><br><sub><code>WELL_BAKED_BODY</code></sub> | 受到火属性的招式攻击时，不会受到伤害，而是会大幅提高防御。 | 成为招式目标时（伤害结算前） | 被火属性招式命中时免疫并提升能力：防御 2 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 274 | 乘风<br><sub>Wind Rider</sub><br><sub><code>WIND_RIDER</code></sub> | 吹起了顺风或受到风的招式攻击时，不会受到伤害，而是会提高攻击。 | 出场时 ／ 成为招式目标时（伤害结算前） | 免疫特定招式并提升能力：(条件) 攻击 1；出场时使目标能力变化：顺风 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 275 | 看门犬<br><sub>Guard Dog</sub><br><sub><code>GUARD_DOG</code></sub> | 受到威吓时，攻击会提高。让替换宝可梦的招式和道具无效。 | 常驻 / 被动 | 攻击 1 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 276 | 搬岩<br><sub>Rocky Payload</sub><br><sub><code>ROCKY_PAYLOAD</code></sub> | 岩石属性的招式威力会提高。 | 使用招式前 | 岩石招式威力提升 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 277 | 风力发电<br><sub>Wind Power</sub><br><sub><code>WIND_POWER</code></sub> | 受到风的招式攻击时，会变为充电状态。 | 受到招式攻击后 | 受到攻击后给对手附加(条件) 充电 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:9 |
| 278 | 全能变身<br><sub>Zero to Hero</sub><br><sub><code>ZERO_TO_HERO</code></sub> | 回到同行队伍后，会变为全能形态。 | 常驻 / 被动 ／ 战斗开始时 ／ 规则标签（不单独触发） | (条件) | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 279 | 发号施令<br><sub>Commander</sub><br><sub><code>COMMANDER</code></sub> | 出场时如果有吃吼霸在场，会进入其口中，从那里发号施令。 | 常驻 / 被动 ／ 常驻（双打判定） ／ 规则标签（不单独触发） | 双打模式加成 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 280 | 电力转换<br><sub>Electromorphosis</sub><br><sub><code>ELECTROMORPHOSIS</code></sub> | 受到伤害时，会变为充电状态。 | 受到招式攻击后 | 受到攻击后给对手附加(条件) 充电 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 281 | 古代活性<br><sub>Protosynthesis</sub><br><sub><code>PROTOSYNTHESIS</code></sub> | 携带着驱劲能量或天气为晴朗时，数值最高的能力会提高。 | 常驻 / 被动 ／ 规则标签（不单独触发） | tr 古代活性 0；天气变化时附加古代活性 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 282 | 夸克充能<br><sub>Quark Drive</sub><br><sub><code>QUARK_DRIVE</code></sub> | 携带着驱劲能量或在电气场地上时，数值最高的能力会提高。 | 常驻 / 被动 ／ 规则标签（不单独触发） | tr 量子引擎 0；量子引擎 0 电气场地 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 283 | 黄金之躯<br><sub>Good as Gold</sub><br><sub><code>GOOD_AS_GOLD</code></sub> | 不会氧化的坚固黄金身躯不会受到对手的变化招式的影响。 | 成为招式目标时（伤害结算前） | 免疫特定招式 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:9 |
| 284 | 灾祸之鼎<br><sub>Vessel of Ruin</sub><br><sub><code>VESSEL_OF_RUIN</code></sub> | 以能呼唤灾厄的鼎的力量降低除自己以外的宝可梦的特攻。 | 出场时 ／ 常驻（能力值修正） | 全场能力倍率 ×0.75；出场时发布提示消息 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 285 | 灾祸之剑<br><sub>Sword of Ruin</sub><br><sub><code>SWORD_OF_RUIN</code></sub> | 以能呼唤灾厄的剑的力量降低除自己以外的宝可梦的防御。 | 出场时 ／ 常驻（能力值修正） | 全场能力倍率 ×0.75；出场时发布提示消息 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 286 | 灾祸之简<br><sub>Tablets of Ruin</sub><br><sub><code>TABLETS_OF_RUIN</code></sub> | 以能呼唤灾厄的简的力量降低除自己以外的宝可梦的攻击。 | 出场时 ／ 常驻（能力值修正） | 全场能力倍率 ×0.75；出场时发布提示消息 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 287 | 灾祸之玉<br><sub>Beads of Ruin</sub><br><sub><code>BEADS_OF_RUIN</code></sub> | 以能呼唤灾厄的勾玉的力量降低除自己以外的宝可梦的特防。 | 出场时 ／ 常驻（能力值修正） | 全场能力倍率 ×0.75；出场时发布提示消息 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 288 | 绯红脉动<br><sub>Orichalcum Pulse</sub><br><sub><code>ORICHALCUM_PULSE</code></sub> | 出场时，会将天气变为晴朗。日照强烈时，会通过古代的脉动升高攻击。 | 出场时 ／ 区域切换后 ／ 常驻 / 被动 | 出场时把天气变为晴天；切换区域后把天气变为晴天；Ss 攻击 4/3 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 289 | 强子引擎<br><sub>Hadron Engine</sub><br><sub><code>HADRON_ENGINE</code></sub> | 出场时，会布下电气场地。处于电气场地时，会通过未来的机关升高特攻。 | 出场时 ／ 区域切换后 ／ 常驻 / 被动 | 出场时布置电气场地；切换区域后布置电气场地；Ss 特攻 4/3 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 290 | 跟风<br><sub>Opportunist</sub><br><sub><code>OPPORTUNIST</code></sub> | 对手的能力提高时，自己也会趁机同样地提高能力。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 291 | 反刍<br><sub>Cud Chew</sub><br><sub><code>CUD_CHEW</code></sub> | 吃了树果后，会在下一回合结束时从胃反刍出来再吃１次。 | — | 说明中的数值：１ | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 292 | 锋锐<br><sub>Sharpness</sub><br><sub><code>SHARPNESS</code></sub> | 提高切割对手的招式的威力。 | 使用招式前 | 满足条件时招式威力提升：(条件) 1.5 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 293 | 大将<br><sub>Supreme Overlord</sub><br><sub><code>SUPREME_OVERLORD</code></sub> | 出场时，攻击和特攻会按照目前被打倒的同伴数量逐渐提升，被打倒越多，提升越多。 | 使用招式前 | 招式威力随条件变化（条件：(条件)） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 294 | 同台共演<br><sub>Costar</sub><br><sub><code>COSTAR</code></sub> | 出场时，复制同伴的能力变化。 | 出场时 | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 295 | 毒满地<br><sub>Toxic Debris</sub><br><sub><code>TOXIC_DEBRIS</code></sub> | 受到物理招式的伤害时，会在对手脚下散布毒菱。 | 受到招式攻击后 | 受到攻击后触发：(条件) 毒菱 | 原版 \| PT档位:稀有 \| PT价:750 \| 引擎层级:9 |
| 296 | 尾甲<br><sub>Armor Tail</sub><br><sub><code>ARMOR_TAIL</code></sub> | 包裹头部的神秘尾巴使对手无法对我方使出先制招式。 | 成为招式目标时（伤害结算前） | —（由代码固定，无显式参数） | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 297 | 食土<br><sub>Earth Eater</sub><br><sub><code>EARTH_EATER</code></sub> | 受到地面属性的招式攻击时，不会受到伤害，而是会得到回复。 | 成为招式目标时（伤害结算前） | 免疫地面属性招式并回复 HP | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 298 | 菌丝之力<br><sub>Mycelium Might</sub><br><sub><code>MYCELIUM_MIGHT</code></sub> | 使出变化招式时，虽然行动必定会变慢，但能不受对手的特性妨碍。 | 常驻 / 被动 ／ 常驻（优先度修正） ／ 常驻（无视对手特性） | 招式优先度修正：(条件) -0.2；(条件)；使出招式时无视对手特性 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 299 | 心眼<br><sub>Mind’s Eye</sub><br><sub><code>MINDS_EYE</code></sub> | 一般属性和格斗属性的招式可以击中幽灵属性的宝可梦。无视对手的闪避率的变化，且命中率不会被降低。 | 常驻 / 被动 ／ 自身能力等级将变化时 ／ 规则标签（不单独触发） | 无视对手的属性免疫；保护能力不被降低：命中；回避 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 300 | 甘露之蜜<br><sub>Supersweet Syrup</sub><br><sub><code>SUPERSWEET_SYRUP</code></sub> | 首次出场时，会散发出甜腻的蜜的香味来降低对手的闪避率。 | 出场时 | 出场时使目标能力变化：回避 -1 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 301 | 款待<br><sub>Hospitality</sub><br><sub><code>HOSPITALITY</code></sub> | 出场时款待同伴，回复其少量ＨＰ。 | 出场时 | 4 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 302 | 毒锁链<br><sub>Toxic Chain</sub><br><sub><code>TOXIC_CHAIN</code></sub> | 凭借含有毒素的锁链的力量，有时能让被招式击中的对手陷入剧毒状态。 | 使用招式后 | 使用招式后触发：30 剧毒 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 303 | 面影辉映<br><sub>Embody Aspect</sub><br><sub><code>EMBODY_ASPECT_TEAL</code></sub> | 将回忆映于心中，让碧草面具发出光辉，提高自己的速度。 | 常驻 / 被动 ／ 规则标签（不单独触发） | 速度 1 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 304 | 面影辉映<br><sub>Embody Aspect</sub><br><sub><code>EMBODY_ASPECT_WELLSPRING</code></sub> | 将回忆映于心中，让水井面具发出光辉，提高自己的特防。 | 常驻 / 被动 ／ 规则标签（不单独触发） | 特防 1 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 305 | 面影辉映<br><sub>Embody Aspect</sub><br><sub><code>EMBODY_ASPECT_HEARTHFLAME</code></sub> | 将回忆映于心中，让火灶面具发出光辉，提高自己的攻击。 | 常驻 / 被动 ／ 规则标签（不单独触发） | 攻击 1 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 306 | 面影辉映<br><sub>Embody Aspect</sub><br><sub><code>EMBODY_ASPECT_CORNERSTONE</code></sub> | 将回忆映于心中，让础石面具发出光辉，提高自己的防御。 | 常驻 / 被动 ／ 规则标签（不单独触发） | 防御 1 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 307 | 太晶变形<br><sub>Tera Shift</sub><br><sub><code>TERA_SHIFT</code></sub> | 出场时，会吸收周围的能量，变为太晶形态。 | 出场时 ／ 规则标签（不单独触发） | (条件) | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 308 | 太晶甲壳<br><sub>Tera Shell</sub><br><sub><code>TERA_SHELL</code></sub> | 甲壳蕴藏着全部属性的力量，会将自己ＨＰ全满时受到的伤害全都变为效果不好。 | 成为招式目标时（伤害结算前） ／ 规则标签（不单独触发） | 满 HP 时受到属性伤害减半 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 309 | 归零化境<br><sub>Teraform Zero</sub><br><sub><code>TERAFORM_ZERO</code></sub> | 太乐巴戈斯变为星晶形态时，蕴藏在它身上的力量会将天气和场地的影响全部归零。 | 常驻 / 被动 ／ 规则标签（不单独触发） | [晴天,下雨,沙暴,冰雹,下雪,浓雾,大雨,大日照,日晶,月华,乱流]；[薄雾场地,电气场地,青草场地,精神场地] | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 310 | 毒傀儡<br><sub>Poison Puppeteer</sub><br><sub><code>POISON_PUPPETEER</code></sub> | 因此宝可梦的招式而陷入中毒状态的对手同时也会陷入混乱状态。 | 使用招式后 ／ 规则标签（不单独触发） | 中毒 剧毒 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 311 | ★ 神威<br><sub></sub><br><sub><code>SHENWEI</code></sub> | 天降神威使得对手全部属性降低一段。 | 出场时 | 出场时使目标能力变化：[攻击,防御,特攻,特防,速度,命中,回避] -1 | 改版新增 \| PT档位:稀有 \| PT价:750 \| 引擎层级:9 |
| 312 | ★ 创世<br><sub></sub><br><sub><code>CSSW</code></sub> | 出场：对手全能力-1。在场：除自身外全场能力×0.75。免疫睡眠/困倦；畏缩时速度+1；招式无视特性。 | 出场时 ／ 将陷入异常状态时 ／ 常驻 / 被动 ／ 常驻（无视对手特性） ／ 常驻（能力值修正） | 出场时使目标能力变化：[攻击,防御,特攻,特防,速度,命中,回避] -1；全场能力倍率 ×0.75；出场时发布提示消息；免疫睡眠；免疫困倦；畏缩时能力变化：速度 1；使出招式时无视对手特性 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 313 | ★ 创世-普<br><sub></sub><br><sub><code>CSSW1</code></sub> | 吸引并免疫一般属性招式（特攻+1）。一般招式威力×1.2（部分除外）；普/格可打幽灵；免疫威吓/神威/创世/创造。 | 使用招式前 ／ 常驻 / 被动 ／ 成为招式目标时（伤害结算前） ／ 成为招式目标时（吸引） ／ 规则标签（不单独触发） | 吸引并免疫一般属性招式；被一般属性招式命中时免疫并提升能力：特攻 1；一般属性招式威力×1.2；无视对手的属性免疫；免疫对手的威吓/降能力效果 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 314 | ★ 创世-火<br><sub></sub><br><sub><code>CSSW2</code></sub> | 吸引并免疫火属性招式（特攻+1）。出场：大日照；晴/大日/日晶/月华时攻击4/3；离场清天气。 | 出场时 ／ 区域切换后 ／ 常驻 / 被动 ／ 成为招式目标时（伤害结算前） ／ 成为招式目标时（吸引） | 吸引并免疫火属性招式；被火属性招式命中时免疫并提升能力：特攻 1；出场时把天气变为大日照；切换区域后把天气变为大日照；Ss 攻击 4/3 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 315 | ★ 创世-水<br><sub></sub><br><sub><code>CSSW3</code></sub> | 吸引并免疫水属性招式（特攻+1）。出场：大雨；下雨/大雨时攻击4/3；离场清天气。 | 出场时 ／ 区域切换后 ／ 常驻 / 被动 ／ 成为招式目标时（伤害结算前） ／ 成为招式目标时（吸引） | 吸引并免疫水属性招式；被水属性招式命中时免疫并提升能力：特攻 1；出场时把天气变为大雨；切换区域后把天气变为大雨；Ss 攻击 4/3 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 316 | ★ 创世-草<br><sub></sub><br><sub><code>CSSW4</code></sub> | 吸引并免疫草属性招式（特攻+1）。出场：青草场地；青草场地时特攻×4/3。 | 出场时 ／ 区域切换后 ／ 常驻 / 被动 ／ 成为招式目标时（伤害结算前） ／ 成为招式目标时（吸引） | 吸引并免疫草属性招式；被草属性招式命中时免疫并提升能力：特攻 1；出场时布置青草场地；切换区域后布置青草场地；Ss 特攻 4/3 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 317 | ★ 创世-电<br><sub></sub><br><sub><code>CSSW5</code></sub> | 吸引并免疫电属性招式（特攻+1）。出场：电气场地；电气场地时特攻×4/3。 | 出场时 ／ 区域切换后 ／ 常驻 / 被动 ／ 成为招式目标时（伤害结算前） ／ 成为招式目标时（吸引） | 吸引并免疫电属性招式；被电属性招式命中时免疫并提升能力：特攻 1；出场时布置电气场地；切换区域后布置电气场地；Ss 特攻 4/3 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 318 | ★ 创世-超<br><sub></sub><br><sub><code>CSSW6</code></sub> | 吸引并免疫超能力属性招式（特攻+1）。出场：精神场地；精神场地时特攻×4/3。 | 出场时 ／ 区域切换后 ／ 常驻 / 被动 ／ 成为招式目标时（伤害结算前） ／ 成为招式目标时（吸引） | 吸引并免疫超能力属性招式；被超能力属性招式命中时免疫并提升能力：特攻 1；出场时布置精神场地；切换区域后布置精神场地；Ss 特攻 4/3 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 319 | ★ 创世-冰<br><sub></sub><br><sub><code>CSSW7</code></sub> | 吸引并免疫冰属性招式（特攻+1）。出场时使对手速度-1，并将天气变为下雪。下雪时速度×1.5。 | 出场时 ／ 区域切换后 ／ 常驻 / 被动 ／ 成为招式目标时（伤害结算前） ／ 成为招式目标时（吸引） | 吸引并免疫冰属性招式；被冰属性招式命中时免疫并提升能力：特攻 1；出场时把天气变为下雪；切换区域后把天气变为下雪；Ss 速度 1.5；出场时使目标能力变化：速度 -1 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 320 | ★ 创世-龙<br><sub></sub><br><sub><code>CSSW8</code></sub> | 吸引并免疫龙属性招式（特攻+1）。龙属性招式威力提高。出场时使对手攻击/特攻各-1。 | 使用招式前 ／ 出场时 ／ 成为招式目标时（伤害结算前） ／ 成为招式目标时（吸引） | 吸引并免疫龙属性招式；被龙属性招式命中时免疫并提升能力：特攻 1；龙招式威力提升；出场时使目标能力变化：[攻击,特攻] -1 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 321 | ★ 创世-恶<br><sub></sub><br><sub><code>CSSW9</code></sub> | 吸引并免疫恶属性招式（特攻+1）。出场时使对手防御/特防各-1。在场时全场恶属性招式威力×4/3。 | 使用招式前 ／ 出场时 ／ 成为招式目标时（伤害结算前） ／ 成为招式目标时（吸引） | 吸引并免疫恶属性招式；被恶属性招式命中时免疫并提升能力：特攻 1；出场时发布提示消息；恶 4/3；出场时使目标能力变化：[防御,特防] -1 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 322 | ★ 创世-妖<br><sub></sub><br><sub><code>CSSW10</code></sub> | 吸引并免疫妖精属性招式（特攻+1）。出场：薄雾场地；薄雾场地时特攻×4/3。 | 出场时 ／ 区域切换后 ／ 常驻 / 被动 ／ 成为招式目标时（伤害结算前） ／ 成为招式目标时（吸引） | 吸引并免疫妖精属性招式；被妖精属性招式命中时免疫并提升能力：特攻 1；出场时布置薄雾场地；切换区域后布置薄雾场地；Ss 特攻 4/3 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 323 | ★ 创世-格<br><sub></sub><br><sub><code>CSSW11</code></sub> | 吸引并免疫格斗属性招式（特攻+1）。招式无视对手特性。一般/格斗招式可命中幽灵，且免疫威吓。击败对手后攻/防/速各+1。 | 出场时 ／ 常驻 / 被动 ／ 常驻（无视对手特性） ／ 成为招式目标时（伤害结算前） ／ 成为招式目标时（吸引） ／ 规则标签（不单独触发） | 吸引并免疫格斗属性招式；被格斗属性招式命中时免疫并提升能力：特攻 1；出场时发布提示消息；使出招式时无视对手特性；无视对手的属性免疫；免疫对手的威吓/降能力效果；攻击 1；防御 1；速度 1 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 324 | ★ 创世-飞<br><sub></sub><br><sub><code>CSSW12</code></sub> | 吸引并免疫飞行属性招式（特攻+1）。出场：乱流；乱流时攻击×4/3；飞行招式优先度+1；离场清天气。 | 出场时 ／ 区域切换后 ／ 常驻 / 被动 ／ 常驻（优先度修正） ／ 成为招式目标时（伤害结算前） ／ 成为招式目标时（吸引） | 吸引并免疫飞行属性招式；被飞行属性招式命中时免疫并提升能力：特攻 1；出场时把天气变为乱流；切换区域后把天气变为乱流；Ss 攻击 4/3；招式优先度修正：(条件) 1 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 325 | ★ 创世-毒<br><sub></sub><br><sub><code>CSSW13</code></sub> | 吸引并免疫毒属性招式（特攻+1）。命中：使对手剧毒（无视钢/毒免疫）。 | 使用招式后 ／ 常驻 / 被动 ／ 成为招式目标时（伤害结算前） ／ 成为招式目标时（吸引） ／ 规则标签（不单独触发） | 吸引并免疫毒属性招式；被毒属性招式命中时免疫并提升能力：特攻 1；使用招式后触发：100 剧毒；[中毒,剧毒] [钢,毒]；bT 中毒 剧毒 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 326 | ★ 创世-地<br><sub></sub><br><sub><code>CSSW14</code></sub> | 吸引并免疫地面属性招式（特攻+1）。离场前回复少许HP；被变化招式影响后防/特防各+2。 | 受到招式攻击后 ／ 常驻 / 被动 ／ 成为招式目标时（伤害结算前） ／ 成为招式目标时（吸引） | 吸引并免疫地面属性招式；被地面属性招式命中时免疫并提升能力：特攻 1；受到攻击后自身能力变化：(条件) 防御 2；受到攻击后自身能力变化：(条件) 特防 2 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 327 | ★ 创世-岩<br><sub></sub><br><sub><code>CSSW15</code></sub> | 吸引并免疫岩石属性招式（特攻+1）。出场：沙暴；若本回合未替换下场，回合末防/特防各+1。 | 出场时 ／ 区域切换后 ／ 成为招式目标时（伤害结算前） ／ 成为招式目标时（吸引） ／ 每回合结束时 | 吸引并免疫岩石属性招式；被岩石属性招式命中时免疫并提升能力：特攻 1；出场时把天气变为沙暴；切换区域后把天气变为沙暴 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 328 | ★ 创世-虫<br><sub></sub><br><sub><code>CSSW16</code></sub> | 吸引并免疫虫属性招式（特攻+1）。复制敌方能力变化；若本回合未替换下场，回合末攻/速各+1。 | 常驻 / 被动 ／ 成为招式目标时（伤害结算前） ／ 成为招式目标时（吸引） ／ 每回合结束时 | 吸引并免疫虫属性招式；被虫属性招式命中时免疫并提升能力：特攻 1 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 329 | ★ 创世-鬼<br><sub></sub><br><sub><code>CSSW17</code></sub> | 吸引并免疫幽灵属性招式（特攻+1）。受物理命中：防-1，特攻/速度各+2；70%定身对手。 | 受到招式攻击后 ／ 成为招式目标时（伤害结算前） ／ 成为招式目标时（吸引） | 吸引并免疫幽灵属性招式；被幽灵属性招式命中时免疫并提升能力：特攻 1；受到攻击后自身能力变化：(条件) 防御 -1；受到攻击后自身能力变化：(条件) 特攻 2；受到攻击后自身能力变化：(条件) 速度 2；受到攻击后封锁对手招式 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 330 | ★ 创世-钢<br><sub></sub><br><sub><code>CSSW18</code></sub> | 吸引并免疫钢属性招式（特攻+1）。我方钢系招式威力提高；能力不下降；满HP免疫一击倒/一击必杀无效。 | 使用招式前 ／ 将被一击必杀时 ／ 成为招式目标时（伤害结算前） ／ 成为招式目标时（吸引） ／ 自身能力等级将变化时 | 吸引并免疫钢属性招式；被钢属性招式命中时免疫并提升能力：特攻 1；钢；保护能力不被降低：；受到攻击时触发：；免疫一击必杀 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 331 | ★ 超梦装甲X型<br><sub></sub><br><sub><code>KJX</code></sub> | 装甲散发神奇迷雾形成精神场地,每回合提升物攻以及物防各1级,并且成为技能目标提升1级速度,超梦装甲X型脱下后本局游戏无法再次着装. | 出场时 ／ 区域切换后 ／ 受到招式攻击后 ／ 常驻 / 被动 ／ 每回合结束时 | 出场时布置精神场地；切换区域后布置精神场地；Ss 特攻 4/3；受到攻击后自身能力变化：(条件) 速度 1 | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 332 | ★ 超梦装甲Y型<br><sub></sub><br><sub><code>KJY</code></sub> | 装甲散发神奇迷雾形成精神场地,每回合提升特攻以及特防各1级,并且成为技能目标提升1级速度,超梦装甲Y型脱下后本局游戏无法再次着装. | 出场时 ／ 区域切换后 ／ 受到招式攻击后 ／ 常驻 / 被动 ／ 每回合结束时 | 出场时布置精神场地；切换区域后布置精神场地；Ss 特攻 4/3；受到攻击后自身能力变化：(条件) 速度 1 | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 333 | ★ 水晶之躯<br><sub></sub><br><sub><code>SJZQ</code></sub> | 免疫水属性攻击,登场前5回合属性翻倍,被火属性招式攻击物防+2,被格斗属性招式攻击速度+2. | 出场时 ／ 受到招式攻击后 ／ 成为招式目标时（伤害结算前） | 免疫水属性招式并回复 HP；受到攻击后自身能力变化：(条件) 防御 1；受到攻击后自身能力变化：(条件) 速度 1；出场时附加水晶之躯 5 | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 334 | ★ 招财猫<br><sub></sub><br><sub><code>ZCM</code></sub> | 战斗结束时，有时候会捡来金币。金币会转换成金钱以及道具.必定可以逃跑非训练家战斗并且攻击敌人有概率获得他的道具 | 使用招式后 ／ 常驻 / 被动 ／ 战斗结束后 | 使用招式后夺取对手道具（几率 ?%） | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 335 | ★ 高雅之躯<br><sub></sub><br><sub><code>GYZQ</code></sub> | 不会被对手降低能力对方触碰后会陷入迷人状态一般招式会变成妖精属性 | 使用招式前 ／ 受到招式攻击后 ／ 自身能力等级将变化时 | 受到攻击后触发：100 着迷；妖精属性招式威力×1.2；保护能力不被降低： | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 336 | ★ 蜂王<br><sub></sub><br><sub><code>FW</code></sub> | 大针蜂中的王者不会被秒杀，并分出三个分身分别掌握亲子爱，适应力，技术高手 | 使用招式前 ／ 出场时 ／ 将被一击必杀时 ／ 成为招式目标时（伤害结算前） ／ 规则标签（不单独触发） | 0.25；本系加成提升；满足条件时招式威力提升：(条件) 1.5；受到攻击时触发：；免疫一击必杀；出场时附加水晶之躯 5 | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 337 | ★ 蜂王幼体<br><sub></sub><br><sub><code>FW1</code></sub> | 三十年河东，三十年河西，莫欺少虫穷 | — | —（由代码固定，无显式参数） | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 338 | ★ 乌托邦<br><sub></sub><br><sub><code>WTB</code></sub> | 莱希拉姆融入现实后产生的变化，绝对的乌托邦，可以不受对手特性的干扰，向对手使出招式。并且免疫地面伤害的同时小幅度降低受到的特攻伤害。使用交错火焰后会立即额外释放一次交错闪电 | 使用招式后 ／ 出场时 ／ 常驻（无视对手特性） ／ 成为招式目标时（伤害结算前） | 出场时发布提示消息；使出招式时无视对手特性；免疫地面属性招式并回复 HP；受伤倍率修正：(条件) 0.7；使用招式后触发：交错火焰 交错闪电 (条件) | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 339 | ★ 秩序国<br><sub></sub><br><sub><code>ZXG</code></sub> | 捷克罗姆拥抱理想后产生的变化，绝对的秩序，可以不受对手特性的干扰，向对手使出招式。并且免疫地面伤害的同时小幅度降低受到的物理伤害。使用交错闪电后会立即额外释放一次交错火焰 | 使用招式后 ／ 出场时 ／ 常驻（无视对手特性） ／ 成为招式目标时（伤害结算前） | 出场时发布提示消息；使出招式时无视对手特性；免疫地面属性招式并回复 HP；受伤倍率修正：(条件) 0.7；使用招式后触发：交错闪电 交错火焰 (条件) | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 340 | ★ 梦与梦与现实的交织<br><sub></sub><br><sub><code>MM</code></sub> | 梦与梦,现实与现实,真真假假，假假真真处于梦与现实的交织之地，登场时触发一次极光幕持续4回合 | 出场时 ／ 成为招式目标时（伤害结算前） | 受伤倍率修正：(条件) 0.4；极光幕 4 | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 341 | ★ 寒冰之躯<br><sub></sub><br><sub><code>BPZB</code></sub> | 一般属性招式会转成冰属性受到接触类攻击死亡后爆发体内的极冰扣除对面99%血量 | 使用招式前 ／ 濒死时 | 被接触招式击倒时反伤对手（1/0.1 最大 HP）；冰属性招式威力×1.2 | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 342 | ★ 空白特性<br><sub></sub><br><sub><code>CSSL1</code></sub> | 这是一个空白特性。 | — | —（由代码固定，无显式参数） | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 \| 三被动随机池排除 \| 三被动随机池排除 |
| 343 | ★ 创造之力-火<br><sub></sub><br><sub><code>CSSL2</code></sub> | 出场：大日照；晴/大日/日晶/月华时攻击×4/3。被接触招式击倒：反伤对手最大HP的1/10。一般招式变火且威力×1.2。 | 使用招式前 ／ 出场时 ／ 区域切换后 ／ 常驻 / 被动 ／ 濒死时 | 出场时把天气变为大日照；切换区域后把天气变为大日照；Ss 攻击 4/3；被接触招式击倒时反伤对手（1/0.1 最大 HP）；火属性招式威力×1.2 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 \| 三被动随机池排除 |
| 344 | ★ 创造之力-水<br><sub></sub><br><sub><code>CSSL3</code></sub> | 出场：大雨；下雨/大雨时攻击×4/3。被接触招式击倒：反伤对手最大HP的1/10。一般招式变水且威力×1.2。 | 使用招式前 ／ 出场时 ／ 区域切换后 ／ 常驻 / 被动 ／ 濒死时 | 出场时把天气变为大雨；切换区域后把天气变为大雨；Ss 攻击 4/3；被接触招式击倒时反伤对手（1/0.1 最大 HP）；水属性招式威力×1.2 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 \| 三被动随机池排除 |
| 345 | ★ 创造之力-草<br><sub></sub><br><sub><code>CSSL4</code></sub> | 出场：青草场地；青草场地时特攻×4/3。被接触招式击倒：反伤对手最大HP的1/10。一般招式变草且威力×1.2。 | 使用招式前 ／ 出场时 ／ 区域切换后 ／ 常驻 / 被动 ／ 濒死时 | 出场时布置青草场地；切换区域后布置青草场地；Ss 特攻 4/3；被接触招式击倒时反伤对手（1/0.1 最大 HP）；草属性招式威力×1.2 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 \| 三被动随机池排除 |
| 346 | ★ 创造之力-电<br><sub></sub><br><sub><code>CSSL5</code></sub> | 出场：电气场地；电气场地时特攻×4/3。被接触招式击倒：反伤对手最大HP的1/10。一般招式变电且威力×1.2。 | 使用招式前 ／ 出场时 ／ 区域切换后 ／ 常驻 / 被动 ／ 濒死时 | 出场时布置电气场地；切换区域后布置电气场地；Ss 特攻 4/3；被接触招式击倒时反伤对手（1/0.1 最大 HP）；电属性招式威力×1.2 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 \| 三被动随机池排除 |
| 347 | ★ 创造之力-超<br><sub></sub><br><sub><code>CSSL6</code></sub> | 出场：精神场地；精神场地时特攻×4/3。被接触招式击倒：反伤对手最大HP的1/10。一般招式变超能力且威力×1.2。 | 使用招式前 ／ 出场时 ／ 区域切换后 ／ 常驻 / 被动 ／ 濒死时 | 出场时布置精神场地；切换区域后布置精神场地；Ss 特攻 4/3；被接触招式击倒时反伤对手（1/0.1 最大 HP）；超能力属性招式威力×1.2 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 \| 三被动随机池排除 |
| 348 | ★ 创造之力-冰<br><sub></sub><br><sub><code>CSSL7</code></sub> | 出场时使对手速度-1，并将天气变为下雪。下雪时攻击×4/3、速度×1.5。被接触招式击倒时反伤对手最大HP的1/10。一般招式变为冰属性且威力×1.2。 | 使用招式前 ／ 出场时 ／ 区域切换后 ／ 常驻 / 被动 ／ 濒死时 | 出场时把天气变为下雪；切换区域后把天气变为下雪；Ss 攻击 4/3；Ss 速度 1.5；出场时使目标能力变化：速度 -1；被接触招式击倒时反伤对手（1/0.1 最大 HP）；冰属性招式威力×1.2 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 \| 三被动随机池排除 |
| 349 | ★ 创造之力-龙<br><sub></sub><br><sub><code>CSSL8</code></sub> | 龙属性招式威力提高。出场时使对手攻击/特攻各-1。被接触招式击倒时反伤对手最大HP的1/10。一般招式变为龙属性且威力×1.2。 | 使用招式前 ／ 出场时 ／ 成为招式目标时（伤害结算前） ／ 成为招式目标时（吸引） ／ 濒死时 | 吸引并免疫龙属性招式；被龙属性招式命中时免疫并提升能力：特攻 1；龙招式威力提升；出场时使目标能力变化：[攻击,特攻] -1；被接触招式击倒时反伤对手（1/0.1 最大 HP）；龙属性招式威力×1.2 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 \| 三被动随机池排除 |
| 350 | ★ 创造之力-恶<br><sub></sub><br><sub><code>CSSL9</code></sub> | 出场时释放暗黑气场（全场恶系×4/3），并使对手防御/特防各-1。被接触招式击倒时反伤对手最大HP的1/10。一般招式变为恶属性且威力×1.2。 | 使用招式前 ／ 出场时 ／ 濒死时 | 出场时发布提示消息；恶 4/3；出场时使目标能力变化：[防御,特防] -1；被接触招式击倒时反伤对手（1/0.1 最大 HP）；恶属性招式威力×1.2 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 \| 三被动随机池排除 |
| 351 | ★ 创造之力-妖<br><sub></sub><br><sub><code>CSSL10</code></sub> | 出场：薄雾场地；薄雾场地时特攻×4/3。被接触招式击倒：反伤对手最大HP的1/10。一般招式变妖精且威力×1.2。 | 使用招式前 ／ 出场时 ／ 区域切换后 ／ 常驻 / 被动 ／ 濒死时 | 出场时布置薄雾场地；切换区域后布置薄雾场地；Ss 特攻 4/3；被接触招式击倒时反伤对手（1/0.1 最大 HP）；妖精属性招式威力×1.2 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 \| 三被动随机池排除 |
| 352 | ★ 创造之力-格<br><sub></sub><br><sub><code>CSSL11</code></sub> | 招式无视对手特性；一般/格斗招式可命中幽灵，且免疫威吓。击败对手后攻/防/速各+1。被接触招式击倒时反伤对手最大HP的1/10。一般招式变为格斗属性且威力×1.2。 | 使用招式前 ／ 出场时 ／ 常驻 / 被动 ／ 常驻（无视对手特性） ／ 濒死时 ／ 规则标签（不单独触发） | 出场时发布提示消息；使出招式时无视对手特性；无视对手的属性免疫；免疫对手的威吓/降能力效果；攻击 1；防御 1；速度 1；被接触招式击倒时反伤对手（1/0.1 最大 HP）；格斗属性招式威力×1.2 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 \| 三被动随机池排除 |
| 353 | ★ 创造之力-飞<br><sub></sub><br><sub><code>CSSL12</code></sub> | 出场：乱流；乱流时攻击×4/3；飞行招式优先度+1；离场清天气。被接触招式击倒：反伤对手最大HP的1/10。一般招式变飞行且威力×1.2。 | 使用招式前 ／ 出场时 ／ 区域切换后 ／ 常驻 / 被动 ／ 常驻（优先度修正） ／ 濒死时 | 出场时把天气变为乱流；切换区域后把天气变为乱流；Ss 攻击 4/3；招式优先度修正：(条件) 1；被接触招式击倒时反伤对手（1/0.1 最大 HP）；飞行属性招式威力×1.2 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 \| 三被动随机池排除 |
| 354 | ★ 创造之力-毒<br><sub></sub><br><sub><code>CSSL13</code></sub> | 命中：使对手剧毒（无视钢/毒免疫）。被接触招式击倒：反伤对手最大HP的1/10。一般招式变毒且威力×1.2。 | 使用招式前 ／ 使用招式后 ／ 常驻 / 被动 ／ 濒死时 ／ 规则标签（不单独触发） | 使用招式后触发：100 剧毒；[中毒,剧毒] [钢,毒]；bT 中毒 剧毒；被接触招式击倒时反伤对手（1/0.1 最大 HP）；毒属性招式威力×1.2 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 \| 三被动随机池排除 |
| 355 | ★ 创造之力-地<br><sub></sub><br><sub><code>CSSL14</code></sub> | 离场前回复少许HP；被变化招式影响后防/特防各+2。被接触招式击倒：反伤对手最大HP的1/10。一般招式变地面且威力×1.2。 | 使用招式前 ／ 受到招式攻击后 ／ 常驻 / 被动 ／ 濒死时 | 受到攻击后自身能力变化：(条件) 防御 2；受到攻击后自身能力变化：(条件) 特防 2；被接触招式击倒时反伤对手（1/0.1 最大 HP）；地面属性招式威力×1.2 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 \| 三被动随机池排除 |
| 356 | ★ 创造之力-岩<br><sub></sub><br><sub><code>CSSL15</code></sub> | 出场：沙暴；若本回合未替换下场，回合末防/特防各+1。被接触招式击倒：反伤对手最大HP的1/10。一般招式变岩石且威力×1.2。 | 使用招式前 ／ 出场时 ／ 区域切换后 ／ 每回合结束时 ／ 濒死时 | 出场时把天气变为沙暴；切换区域后把天气变为沙暴；被接触招式击倒时反伤对手（1/0.1 最大 HP）；岩石属性招式威力×1.2 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 \| 三被动随机池排除 |
| 357 | ★ 创造之力-虫<br><sub></sub><br><sub><code>CSSL16</code></sub> | 复制敌方能力变化；若本回合未替换下场，回合末攻/速各+1。被接触招式击倒：反伤对手最大HP的1/10。一般招式变虫且威力×1.2。 | 使用招式前 ／ 常驻 / 被动 ／ 每回合结束时 ／ 濒死时 | 被接触招式击倒时反伤对手（1/0.1 最大 HP）；虫属性招式威力×1.2 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 \| 三被动随机池排除 |
| 358 | ★ 创造之力-鬼<br><sub></sub><br><sub><code>CSSL17</code></sub> | 受物理命中：防-1，特攻/速度各+2；70%定身对手。被接触招式击倒：反伤对手最大HP的1/10。一般招式变幽灵且威力×1.2。 | 使用招式前 ／ 受到招式攻击后 ／ 濒死时 | 受到攻击后自身能力变化：(条件) 防御 -1；受到攻击后自身能力变化：(条件) 特攻 2；受到攻击后自身能力变化：(条件) 速度 2；受到攻击后封锁对手招式；被接触招式击倒时反伤对手（1/0.1 最大 HP）；幽灵属性招式威力×1.2 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 \| 三被动随机池排除 |
| 359 | ★ 创造之力-钢<br><sub></sub><br><sub><code>CSSL18</code></sub> | 我方钢系招式威力提高；能力不下降；满HP免疫一击倒/一击必杀无效。被接触招式击倒：反伤对手最大HP的1/10。一般招式变钢且威力×1.2。 | 使用招式前 ／ 将被一击必杀时 ／ 成为招式目标时（伤害结算前） ／ 濒死时 ／ 自身能力等级将变化时 | 钢；保护能力不被降低：；受到攻击时触发：；免疫一击必杀；被接触招式击倒时反伤对手（1/0.1 最大 HP）；钢属性招式威力×1.2 | 改版新增 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 \| 三被动随机池排除 |
| 360 | ★ 世界第一的公主殿下<br><sub></sub><br><sub><code>CCGZ</code></sub> | 免疫岩属性弱点，使用变化技能先制度＋1公主攻击敌人的时无视对方的能力提升 | 常驻 / 被动 ／ 常驻（优先度修正） ／ 成为招式目标时（伤害结算前） | 招式优先度修正：(条件) 1；被草属性招式命中时免疫并提升能力：攻击 0；被水属性招式命中时免疫并提升能力：攻击 0；被钢属性招式命中时免疫并提升能力：攻击 0；被地面属性招式命中时免疫并提升能力：攻击 0；被格斗属性招式命中时免疫并提升能力：攻击 0；[攻击,防御,特攻,特防,命中,回避] | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 361 | ★ 空白特性<br><sub></sub><br><sub><code>KBTX</code></sub> | 这是一个空白特性 | 常驻 / 被动 ／ 规则标签（不单独触发） | —（由代码固定，无显式参数） | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 \| 三被动随机池排除 |
| 362 | ★ 妖精气场<br><sub></sub><br><sub><code>KBTX1</code></sub> | 进入了大地守护状态 | 使用招式前 ／ 使用招式后 ／ 出场时 ／ 常驻 / 被动 | 出场时发布提示消息；妖精 4/3 | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 \| 三被动随机池排除 |
| 363 | ★ 空白特性<br><sub></sub><br><sub><code>KBTX2</code></sub> | 这是一个空白特性 | 出场时 | 撒菱；大晴天；增强拳；吹飞；吼叫；龙尾 | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 \| 三被动随机池排除 |
| 364 | ★ 空白特性<br><sub></sub><br><sub><code>KBTX3</code></sub> | 这是一个空白特性 | — | —（由代码固定，无显式参数） | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 \| 三被动随机池排除 |
| 365 | ★ 空白特性<br><sub></sub><br><sub><code>KBTX4</code></sub> | 这是一个空白特性 | — | —（由代码固定，无显式参数） | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 \| 三被动随机池排除 |
| 366 | ★ 空白特性<br><sub></sub><br><sub><code>KBTX5</code></sub> | 这是一个空白特性 | — | —（由代码固定，无显式参数） | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 \| 三被动随机池排除 |
| 367 | ★ 空白特性<br><sub></sub><br><sub><code>KBTX6</code></sub> | 这是一个空白特性 | — | —（由代码固定，无显式参数） | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 \| 三被动随机池排除 |
| 368 | ★ 空白特性<br><sub></sub><br><sub><code>KBTX7</code></sub> | 这是一个空白特性 | — | —（由代码固定，无显式参数） | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 \| 三被动随机池排除 |
| 369 | ★ 空白特性<br><sub></sub><br><sub><code>KBTX8</code></sub> | 这是一个空白特性 | — | —（由代码固定，无显式参数） | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 \| 三被动随机池排除 |
| 370 | ★ 空白特性<br><sub></sub><br><sub><code>KBTX9</code></sub> | 这是一个空白特性 | — | —（由代码固定，无显式参数） | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 \| 三被动随机池排除 |
| 371 | ★ 空白特性<br><sub></sub><br><sub><code>KBTX10</code></sub> | 这是一个空白特性 | — | —（由代码固定，无显式参数） | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 \| 三被动随机池排除 |
| 372 | ★ 空白特性<br><sub></sub><br><sub><code>KBTX11</code></sub> | 这是一个空白特性 | — | —（由代码固定，无显式参数） | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 \| 三被动随机池排除 |
| 373 | ★ 梦<br><sub></sub><br><sub><code>MM1</code></sub> | 受到的伤害减半 | 成为招式目标时（伤害结算前） | 受伤倍率修正：(条件) 0.5 | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 374 | ★ 冰盾<br><sub></sub><br><sub><code>BINGDUN</code></sub> | 下雪天气时，每回合回复HP的六分之一。被厚实的冰雪覆盖，使火属性、冰属性、飞行属性和水属性的招式伤害减半。出场时，会将天气变为下雪。受到攻击时，防御和特防会同时提高。 | 出场时 ／ 区域切换后 ／ 受到招式攻击后 ／ 将受到天气伤害时 ／ 常驻 / 被动 ／ 成为招式目标时（伤害结算前） | 出场时把天气变为下雪；切换区域后把天气变为下雪；受到属性伤害倍率修正：火 0.5；受到属性伤害倍率修正：冰 0.5；受到属性伤害倍率修正：飞行 0.5；受到属性伤害倍率修正：水 0.5；受到攻击后自身能力变化：(条件) 防御 1；受到攻击后自身能力变化：(条件) 特防 1；免疫天气伤害；冰雹下雪天气下每回合回复 HP | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 375 | ★ 冰矛<br><sub></sub><br><sub><code>BINGMAO</code></sub> | 身体表面覆盖着如矛般尖锐的冰晶，在冰雹或雪花飞舞时如鱼得水，攻击、特攻和速度提升至惊人的两倍。凛冽寒气形成的屏障可以无视对手特性的限制，同时将火焰、超能和飞行攻击的威力减弱一半。 | 出场时 ／ 将受到天气伤害时 ／ 常驻（无视对手特性） ／ 常驻（能力值修正） ／ 成为招式目标时（伤害结算前） | 常驻能力倍率修正：速度 2；常驻能力倍率修正：攻击 2；常驻能力倍率修正：特攻 2；免疫天气伤害；出场时发布提示消息；使出招式时无视对手特性；受到属性伤害倍率修正：火 0.5；受到属性伤害倍率修正：超能力 0.5；受到属性伤害倍率修正：飞行 0.5；出场时附加水晶之躯 1 | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 376 | ★ 反转<br><sub></sub><br><sub><code>FANZHUAN</code></sub> | 被里世界能量反转的宝可梦能力变化会变得相反并且其基础能力值顺序会被完全反转（HP、攻击、防御、特攻、特防、速度全部倒置）。 | 常驻 / 被动 | -1 | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 377 | ★ 一心<br><sub></sub><br><sub><code>YIXIN</code></sub> | 融合苍响和藏玛然特，姐弟同心产生质变，敌方使用物攻特攻招式自动释放一次剑王斩，敌方使用变化招式自动释放一次盾王镇。 | 常驻 / 被动 | —（由代码固定，无显式参数） | 改版新增 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 378 | 消防员<br><sub>Firefighter</sub><br><sub><code>FIREFIGHTER</code></sub> | 敌方宝可梦使用火属性招式攻击后，持有该特性的宝可梦处于后台，会询问是否替换上场。选择替换：强制替换上场并全能力加3；选择不替换：提升己方场上宝可梦随机一个能力1个等级。 | 出场时 | 说明中的数值：3 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 379 | 贯穿钻<br><sub>Drill Through</sub><br><sub><code>GUANCHUAN_ZUAN</code></sub> | 使用接触类招式时，可以无视对手的守住效果，但只能造成原本1/4的伤害。 | 规则标签（不单独触发） | 说明中的数值：1/4 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 380 | 超级日光<br><sub>Super Sunlight</sub><br><sub><code>CHAOJI_RIGUANG</code></sub> | 即使天气不是大晴天，也能以大晴天状态使用招式。 | 常驻 / 被动 | 晴天 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 381 | 辣椒喷发<br><sub>Pepper Eruption</sub><br><sub><code>LAJIAO_PENFA</code></sub> | 受到招式伤害时，会让对手陷入灼伤状态。 | 受到招式攻击后 | 受到攻击后触发：100 灼伤 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 382 | 日神降临<br><sub>Divine Sun Descent</sub><br><sub><code>RISHENG</code></sub> | 出场时，会将天气变为大日。大日天气效果：火系/钢系招式威力提升50%；该天气下索尔迦雷欧受到的所有效果绝佳招式伤害变为1倍；索尔迦雷欧在场时，除他以外的宝可梦每回合双防降低一个等级（双方都降低）。 | 出场时 ／ 区域切换后 ／ 常驻 / 被动 | 出场时把天气变为日晶；切换区域后把天气变为日晶 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 383 | 月神降临<br><sub>Moonlit Descent</sub><br><sub><code>YUESHENG</code></sub> | 出场时，会将天气变为辉月。辉月天气效果：幽灵系/超能力系招式威力提升50%；该天气下露奈雅拉受到的所有效果绝佳招式伤害变为1倍；露奈雅拉在场时，除它以外的宝可梦每回合速度和命中降低一个等级（双方都降低）。 | 出场时 ／ 区域切换后 ／ 常驻 / 被动 | 出场时把天气变为月华；切换区域后把天气变为月华 | 原版 \| PT档位:传说(UP池) \| PT价:1300 \| 引擎层级:9 \| 传说/UP特性池 |
| 384 | 鳗鳗高升<br><sub>Eelevate</sub><br><sub><code>ELEVATE</code></sub> | 免疫地面系招式；撒菱、毒菱、黏黏网等入场陷阱无效；打倒对手时，自身最高的能力值会提高1阶。 | 常驻 / 被动 ／ 成为招式目标时（伤害结算前） | 免疫地面属性招式；(条件) 1 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 385 | 烈火鬃毛<br><sub>Fire Mane</sub><br><sub><code>FIRE_MANE</code></sub> | 火属性招式的威力提升50%。 | 使用招式前 | 火招式威力提升 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 386 | 波导防护<br><sub>Aura Guard</sub><br><sub><code>AURA_GUARD</code></sub> | 因接触类招式而受到的伤害会减半。 | 成为招式目标时（伤害结算前） | 受伤倍率修正：(条件) 0.5 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |
| 387 | 龙之皮肤<br><sub>Dragonize</sub><br><sub><code>DRAGONIZE</code></sub> | 一般属性的招式会变为龙属性，威力会变为1.2倍。 | 使用招式前 | 龙属性招式威力×1.2 | 原版 \| PT档位:白板 \| PT价:500 \| 引擎层级:9 |

---

## 四、改版新增特性清单（67 条）

| # | 枚举ID | 名称 | PT 档位 | 引擎层级 |
| ---: | --- | --- | --- | ---: |
| 311 | `SHENWEI` | 神威 | 稀有 | 9 |
| 312 | `CSSW` | 创世 | 传说(UP池) | 9 |
| 313 | `CSSW1` | 创世-普 | 传说(UP池) | 9 |
| 314 | `CSSW2` | 创世-火 | 传说(UP池) | 9 |
| 315 | `CSSW3` | 创世-水 | 传说(UP池) | 9 |
| 316 | `CSSW4` | 创世-草 | 传说(UP池) | 9 |
| 317 | `CSSW5` | 创世-电 | 传说(UP池) | 9 |
| 318 | `CSSW6` | 创世-超 | 传说(UP池) | 9 |
| 319 | `CSSW7` | 创世-冰 | 传说(UP池) | 9 |
| 320 | `CSSW8` | 创世-龙 | 传说(UP池) | 9 |
| 321 | `CSSW9` | 创世-恶 | 传说(UP池) | 9 |
| 322 | `CSSW10` | 创世-妖 | 传说(UP池) | 9 |
| 323 | `CSSW11` | 创世-格 | 传说(UP池) | 9 |
| 324 | `CSSW12` | 创世-飞 | 传说(UP池) | 9 |
| 325 | `CSSW13` | 创世-毒 | 传说(UP池) | 9 |
| 326 | `CSSW14` | 创世-地 | 传说(UP池) | 9 |
| 327 | `CSSW15` | 创世-岩 | 传说(UP池) | 9 |
| 328 | `CSSW16` | 创世-虫 | 传说(UP池) | 9 |
| 329 | `CSSW17` | 创世-鬼 | 传说(UP池) | 9 |
| 330 | `CSSW18` | 创世-钢 | 传说(UP池) | 9 |
| 331 | `KJX` | 超梦装甲X型 | 白板 | 9 |
| 332 | `KJY` | 超梦装甲Y型 | 白板 | 9 |
| 333 | `SJZQ` | 水晶之躯 | 白板 | 9 |
| 334 | `ZCM` | 招财猫 | 白板 | 9 |
| 335 | `GYZQ` | 高雅之躯 | 白板 | 9 |
| 336 | `FW` | 蜂王 | 白板 | 9 |
| 337 | `FW1` | 蜂王幼体 | 白板 | 9 |
| 338 | `WTB` | 乌托邦 | 白板 | 9 |
| 339 | `ZXG` | 秩序国 | 白板 | 9 |
| 340 | `MM` | 梦与梦与现实的交织 | 白板 | 9 |
| 341 | `BPZB` | 寒冰之躯 | 白板 | 9 |
| 342 | `CSSL1` | 空白特性 | 传说(UP池) | 9 |
| 343 | `CSSL2` | 创造之力-火 | 传说(UP池) | 9 |
| 344 | `CSSL3` | 创造之力-水 | 传说(UP池) | 9 |
| 345 | `CSSL4` | 创造之力-草 | 传说(UP池) | 9 |
| 346 | `CSSL5` | 创造之力-电 | 传说(UP池) | 9 |
| 347 | `CSSL6` | 创造之力-超 | 传说(UP池) | 9 |
| 348 | `CSSL7` | 创造之力-冰 | 传说(UP池) | 9 |
| 349 | `CSSL8` | 创造之力-龙 | 传说(UP池) | 9 |
| 350 | `CSSL9` | 创造之力-恶 | 传说(UP池) | 9 |
| 351 | `CSSL10` | 创造之力-妖 | 传说(UP池) | 9 |
| 352 | `CSSL11` | 创造之力-格 | 传说(UP池) | 9 |
| 353 | `CSSL12` | 创造之力-飞 | 传说(UP池) | 9 |
| 354 | `CSSL13` | 创造之力-毒 | 传说(UP池) | 9 |
| 355 | `CSSL14` | 创造之力-地 | 传说(UP池) | 9 |
| 356 | `CSSL15` | 创造之力-岩 | 传说(UP池) | 9 |
| 357 | `CSSL16` | 创造之力-虫 | 传说(UP池) | 9 |
| 358 | `CSSL17` | 创造之力-鬼 | 传说(UP池) | 9 |
| 359 | `CSSL18` | 创造之力-钢 | 传说(UP池) | 9 |
| 360 | `CCGZ` | 世界第一的公主殿下 | 白板 | 9 |
| 361 | `KBTX` | 空白特性 | 白板 | 9 |
| 362 | `KBTX1` | 妖精气场 | 白板 | 9 |
| 363 | `KBTX2` | 空白特性 | 白板 | 9 |
| 364 | `KBTX3` | 空白特性 | 白板 | 9 |
| 365 | `KBTX4` | 空白特性 | 白板 | 9 |
| 366 | `KBTX5` | 空白特性 | 白板 | 9 |
| 367 | `KBTX6` | 空白特性 | 白板 | 9 |
| 368 | `KBTX7` | 空白特性 | 白板 | 9 |
| 369 | `KBTX8` | 空白特性 | 白板 | 9 |
| 370 | `KBTX9` | 空白特性 | 白板 | 9 |
| 371 | `KBTX10` | 空白特性 | 白板 | 9 |
| 372 | `KBTX11` | 空白特性 | 白板 | 9 |
| 373 | `MM1` | 梦 | 白板 | 9 |
| 374 | `BINGDUN` | 冰盾 | 白板 | 9 |
| 375 | `BINGMAO` | 冰矛 | 白板 | 9 |
| 376 | `FANZHUAN` | 反转 | 白板 | 9 |
| 377 | `YIXIN` | 一心 | 白板 | 9 |

### 4.1 三被动随机池的排除规则（`getTriplePassiveExcludedAbilities()`）

```js
getTriplePassiveExcludedAbilities(){
  const s = [...Array.from({length:18},(A,a)=>o[`CSSL${a+1}`])].filter(Boolean);   // excludedAbilities
  const i = [o.CSSL1 … o.CSSL18, o.WONDER_GUARD,
             o.KBTX, o.KBTX1 … o.KBTX11].filter(Boolean);                        // weatherImmuneAbilities
  return { excludedAbilities: s, weatherImmuneAbilities: i };
}
```

- 随机池 = `Object.values(Abilities)` 去掉 `NONE`、去掉 `s`、去掉 `i`。
- 因此 **CSSL1–CSSL18（创造之力系列）永远无法通过三被动随机获得**；`WONDER_GUARD`（神奇守护）与 `KBTX`/`KBTX1–KBTX11` 也被排除。

---

## 五、产物文件

| 文件 | 内容 |
| --- | --- |
| `特性数据表.xlsx` | 5 个工作表：特性总表（387）、分档汇总、改版专属特性（67）、触发条件统计、传说属性说明 |
| `特性数据表_总表.csv` | 同上主表，UTF-8-BOM，14 列 |
| `特性数据表.json` | 结构化原始数据（含 `引擎属性链` 原文，便于二次加工）|
| `特性数据与传说属性说明.html` | 可离线浏览的交互页：4 个标签页、387 行可搜索/筛选/排序、相克网格 |
| `特性与传说属性说明.md` | 本文档 |

### 5.1 数据可靠性说明

- **枚举 / 名称 / 说明**：100% 来自游戏自身资源，无推断。
- **相克倍率**：由 `getTypeDamageMultiplier()` 的 21 个 `case` 分支逐条还原，已做全量校验（18 个普通属性的防守分支均含 `case R.CS: return 2`）。
- **触发条件**：由 221 个 `AbAttr` 类的继承链自动归类（脚本解析 `l(类名,"原名")` 与 `class X extends Y` 得到），是**阶段级**结论，不保证覆盖每个边界条件。
- **数值范围**：来自 `.attr()` 实参；仍有个别复杂条件式（箭头函数、`FormBlockDamageAbAttr` 等）只能标注为 `(条件)`，此时请以同行的**引擎属性链**原文为准。

---

_文档生成自工程内打包产物，未修改任何游戏文件。_
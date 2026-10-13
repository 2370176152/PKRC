# PokeRogue 改版存档格式分析 & 修改器适配要点

> 目标：为「原本面向官方 PokeRogue 的存档修改器」适配本改版游戏。
> 本文件基于改版本体（`game/server/dist/assets/loading-scene-*.js`）与真实存档样本（本地下载目录下的 `*.prsv`）逆向得出。
> 状态：**已完成适配，详见同目录 [`适配说明.md`](./适配说明.md)**。以下为前置逆向分析记录（§2.5 为本轮「模式数据面板」新增字段）。

---

## 一、存档体系（改版实测）

### 1.1 两类存档文件（导出后缀 `.prsv`）
| 文件 | 对应游戏内 | 内容 |
|---|---|---|
| `data_<账号>.prsv` | 系统存档（全局进度） | trainerId、dexData、starterData、gameStats、unlocks、vouchers、eggs… |
| `sessionData<N>_<账号>.prsv` | 局内存档（槽位 N） | seed、party、enemyParty、modifiers、arena、waveIndex、challenges… |

### 1.2 加密方式（关键）
- 算法：**CryptoJS AES**，输出为 OpenSSL 加盐格式。
- 文件内容 = `base64( "Salted__" + salt(8B) + ciphertext )`，实测文件头 `U2FsdGVkX1…` 即 `Salted__`。
- 密钥（passphrase）为**硬编码常量**：`x0i2O7WRiANTqPmZ`
  （源码：`DO.AES.encrypt(json, QN)` / `DO.AES.decrypt(str, QN).toString(DO.enc.Utf8)`）
- 派生方式：OpenSSL `EVP_BytesToKey`（MD5、1 轮）→ AES-256-CBC、PKCS7 填充、key 32B + iv 16B。
- 解密后得到 **JSON 字符串**。

> 若原版修改器使用相同密钥，可复用；否则解密/回写层必须换成上面的 1.12 改版密钥。

### 1.3 JSON 键名混淆（系统存档）
系统存档写出前会做字符串替换（`convertSystemDataStr`）：

映射表 `OM`（真实键 → 混淆键）：

| 真实键 | 混淆键 | 真实键 | 混淆键 |
|---|---|---|---|
| seenAttr | `$sa` | candyCount | `$x` |
| caughtAttr | `$ca` | friendship | `$f` |
| natureAttr | `$na` | abilityAttr | `$a` |
| seenCount | `$s` | passiveAttr | `$pa` |
| caughtCount | `$c` | valueReduction | `$vr` |
| hatchedCount | `$hc` | classicWinCount | `$wc` |
| ivs | `$i` | moveset | `$m` |
| eggMoves | `$em` | | |

另有：`$pAttr` → `$pa`（旧兼容），以及写入时把 `"trainerId":…`、`"secretId":…` **覆盖为当前账号的值**。
→ 修改器必须：读档时反混淆，存档时按当前账号回填 trainerId/secretId，否则会串号/进不去。

---

## 二、官方版 vs 改版的差异（实测样本）

样本：`sessionData1_Guest.prsv`（改版）、`sessionData1_naoshimian.prsv`（较旧/无自定义字段）、`data_naoshimian.prsv`
- `gameVersion` = **`1.12.0.11`**（改版）

### 2.1 `sessionData` 新增字段
```
playerFaints
moreMoneyLessMoneyBonus
ptSoudacheEarned
ptSoudacheStartingItems
ptSoudacheRetreatFloors
ptSoudachePassiveEnabled
ptSoudacheNoRetreatMode
dynamicBalanceEnabled
talentSystemData
name
```
`talentSystemData` 结构（天赋系统）：
```json
{ "acquiredTalents": [], "history": [], "refreshCount": 0, "pityCounter": 0 }
```

### 2.2 `party[i]`（宝可梦对象）新增字段
- **`customPokemonData`**（改版战斗状态，含天赋效果）实测键：
  `spriteScale, ability, passive, nature, types, hitsRecCount,
   menghuoMenghuoWave, menghuoMenghuoFireStacks,
   bugYanWave, bugYanTriggersThisWave, bugYanPermanentStacks,
   iceAgeSpDefBoost, iceAgeAllStatsBoost, iceAgeAtkBoost, iceAgeDefReduction,
   stoneAgeDefBoost, stoneAgeAllStatsBoost, stoneAgeAtkBoost, stoneAgeSpDefReduction,
   industrialAgeDefBoost, industrialAgeSpDefBoost, industrialAge…`
- **`p5xRuntime`**（P5X/解明系统运行时）实测键：
  `p5xEffects, seaGuardLayers, seaGuardDefRatio, seaGuardAtkRatio,
   jiemingShareRatio, jiemingShareBonus, jiemingShield, jiemingShieldBroken,
   jiemingShieldSeaGuardCost, controlBlockCharges, nextTurnSpeedMultiplier,
   p5xUsedConsumableIds`

### 2.3 `gameMode` 取值扩展
改版新增模式，官方 `0–4` 之外还有 **5–12**（八大师/火箭队/高种族值/挥指/双打/PT搜打撤/P5X/二游）。
→ 修改器若用官方枚举做下拉/校验，需扩展，否则读档报错或选项错位。

### 2.4 其他
- `challenges` 新增：相同宝可梦、随机进化、三被动(`id=10`)、无免费治疗；`SuijiChallenge(id=9, value>=3)` 会启用三被动随机池。
- 属性/物种/招式枚举在改版中可能超出官方范围（含改版新增物种与"源龟虫型"等），枚举校验需放宽。

### 2.5 模式数据字段（八大师 / 二游 / 第三特性，本轮补充）
**系统存档** `data_<账号>.prsv`
```
eryouData: {                       // 二游模式系统进度（引擎 createDefaultEryouData / normalizeEryouData）
  version: 1, candy: 0, goldCandy: 0,
  breakthroughMaterials: {}, evolutionGenes: {}, heldItems: {}, heldItemAssignments: {},
  pokemon: { <speciesId>: { level, breakthroughs, unlockedForms: [..], selectedForm } },
  presetTeam: [], extraPresetTeams: [[],[]]（共 hl-1=2 组）, presetTeamIndex: 0,
  dungeonUnlocks: { "material:9": 3, exp: 2, ... },   // 键 = dungeonType[:attribute]，值 1..7（TE）
  abyssUnlocked: 1,                                   // 1..10（Ma）
  abyssFirstClear: { "3": true, ... },                // 本周已首通的层
  abyssFirstClearWeek: "2026-W41",                    // UTC+8、周三 4:00 切周
  abyssFirstClearAnchor: 1759... ,                    // 毫秒时间戳，与周键配套
  unlockedRestricted: [], rewardedRuns: []            // rewardedRuns 最多保留 128 条
}
```
`gameStats` 改版新增计数（引擎 `GameStats.load` 以 `|| 0` 兜底，缺失合法）：
`bdsSessionsPlayed`/`bdsSessionsWon`(八大师)、`huoSessionsPlayed`/`Won`(火箭队)、`huizhiSessionsPlayed`/`Won`(挥指)、
`shuangdaSessionsPlayed`/`Won`(双打)、`ptSoudacheSessionsPlayed`/`Won`(PT搜打撤)。成就 `BDS_VICTORY` 条件 = `bdsSessionsWon >= 1`。

**会话存档** `sessionData<N>_<账号>.prsv`
```
eryouSession: {                    // 仅二游模式（gameMode === 12）
  kind: "dungeon" | "abyss",      // 引擎 normalizeEryouSession 之外一律返回 null
  level: 1,                       // 副本 1..7（TE = YR.length） / 深渊 1..10（Ma）
  dungeonType: "material"|"exp"|"heldItem"|"pt",   // 副本子类型
  attribute: 9,                   // 仅材料本使用（0..17）
  mechanisms: [ { id, type? } ],   // 深渊机制：typeDown(可带 type)/physicalDown/specialDown/singleDown/aoeDown
  rewardId: "<ts>-<16位随机>"      // 同一 rewardId 会被引擎拒绝重复发奖
}
party[i].customPokemonData.triplePassives: [a, b, c]   // 第三特性，长度必须恰为 3
```
- 引擎 `hasPassive()` 把「`triplePassives` 为非空数组」直接视为拥有被动，**无需**再置 `party[i].passive`。
- `getAllPassiveAbilities()` 仅在 `triplePassives.length > 0` 时启用；`setTriplePassive(i, id)` 要求 `length === 3`。
- 三被动随机池排除：`CSSL1–18`、`WONDER_GUARD`、`KBTX`、`KBTX1–11`。

### 2.6 搜打撤 / 火箭队 / 高种族值 / 挥指（第 7 轮补充）

#### 2.6.1 搜打撤（PT_SOUDACHE，`gameMode = 10`）—— 唯一有大量可编辑持久数据的模式

**系统存档** `data_<账号>.prsv`
```
pt: 0,                                  // PT 货币，跨局持久；引擎 addPt: Math.max(0, Math.min(6e8, pt + floor(n)))
ptShop: {                               // 每次进入搜打撤时刷新的商店状态
  date: "",                             // 上次刷新日期（用于判断是否需要重刷）
  offers: [],                           // 当前报价列表
  pityCounter: 0,                       // 保底计数
  refreshCount: 0,                      // 手动刷新次数；费用 = min(100*(refreshCount+1), 500)
  weeklyUpPassive: …, weekString: …      // 每周被动升级（透传）
},
talentCodexDiscovered: [],              // 已发现天赋图鉴
ptSoudacheData: {                       // 引擎 initPtSoudacheData()
  pokemonInventory: { <27只初始宝可梦speciesId>: 0 },   // -1=无限次 / 0=未拥有 / >0=剩余次数
  eggMovesUnlocked: {}, passivesUnlocked: {},
  ptBalance: 0,                         // 局内结算 PT
  borrowedPokemon: {},                  // ⚠️ 引擎 getSystemSaveData() 保存时会置为 {}，实际不持久化
  juexingStoneCount: 0,                 // 觉醒石
  constellations:      { <speciesId>: 0..6 },              // 命之座等级（qA=6）
  constellationChoices:{ <speciesId>: { "1": "hp|atk|def|spatk|spdef|spd", "2": …, "5": … } },
  constellationModes:  { <speciesId>: { "1": "generic|exclusive", "2": …, "5": …, "6": … } },
  version: 1,
  dailyStarterDate: "", dailyStarters: [],   // 每日无限次御三家（按天刷新）
  intervalChallenge: undefined               // 待领奖的区间挑战（瞬时，引擎 dse() 清空）
}
```
关键常量（引擎）：`qA=6`（最高命）、`lU=[2,3,4,6,8,10]`（第 N 命所需觉醒石，重置按前缀和退还）、
`nSe={1:15,2:20,5:25}`（属性加成点）、`oSe=[1,2,5]`（可自选属性的命座层）、
`rSe` 属性键映射、6 命 + `generic` 时加成 ×2、`eT` = 27 只初始宝可梦物种 ID。

**会话存档** `sessionData<N>_<账号>.prsv`
```
ptSoudacheEarned: 0,                    // 本局已获得 PT（引擎上限 1e5）
ptSoudacheStartingItems: [],            // 开局携带道具（引擎内为 Map<道具ID,数量>）
ptSoudacheRetreatFloors: [],            // 撤退锚点楼层（引擎 generatePtSoudacheRetreatFloors：含 19/109/197）
ptSoudachePassiveEnabled: false,        // 开局全队被动
ptSoudacheNoRetreatMode: false,         // 禁止撤退模式
dynamicBalanceEnabled: false,           // 天赋模式（hasDynamicBalance）→ 最大波数 220
talentSystemData: {                     // 天赋系统
  acquiredTalents: [{ talentId, stacks, acquiredWave, refreshPtSpent }],
  history: [{ talentId, talentName, wave, refreshPtSpent, timestamp }],
  refreshCount: 0, pityCounter: 0, superBackpack?: …
}
```
模式常量：`getMaxWaves` = 200（`hasDynamicBalance` 时 220）、`isWaveFinal` = 波数 === 200（220）、
`getClearScoreBonus` = **0**（PT 模式按 PT 结算，无通关分数加成）、`getEnemyModifierChance` = 6/18。
通关计数：普通 `ptSoudacheSessionsPlayed/Won`；天赋模式 `ptSoudacheTalentSessionsPlayed/Won`；
另更新 `gameStats.highestPtEarned = max(highestPtEarned, ptSoudacheEarned)`（仅通关时）。
**无 PT 专属成就**。

#### 2.6.2 火箭队（HUO，`gameMode = 6`）
- **无任何专属存档字段**（既无会话字段、也无专属 `gameStats` 以外的数据）。
- 常量：`getMaxWaves`/`isWaveFinal` = 200、`getClearScoreBonus` = 5000、`getEnemyModifierChance` = 6/18。
- 独有机制 `huojiandui`（训练家战 / Boss 终点生物群系 / 神秘遭遇可捕获）是 **`GameMode` 内的纯代码标记**，存档无字段。
- 系统侧仅有 `gameStats.huoSessionsPlayed/Won`；成就 `HUO_VICTORY` 条件 = `huoSessionsWon >= 1`。

#### 2.6.3 高种族值挑战（HARD，`gameMode = 7`）
- **无任何专属存档字段**。
- 常量：`getMaxWaves`/`isWaveFinal` = 50、`getClearScoreBonus` = 5000、`getEnemyModifierChance` = 6/18。
- 过滤规则为代码常量：`hasHighTierFilter`、`bossStages = [1..48]`、
  `getFilteredSpecies(wave)` → `bossStages.includes(wave) ? baseTotal ≥ 600 : baseTotal ≥ 550`、
  `getOverrideSpecies(wave)` → Boss 段 `baseTotal ≥ 580`（排除无极汰那 ETERNATUS）。
- **无专属 `gameStats` 计数**（通关仅记经典成就 `CLASSIC_VICTORY`）。

#### 2.6.4 挥指（HUIZHI，`gameMode = 8`）
- **无任何专属存档字段**。
- 常量：`getMaxWaves`/`isWaveFinal` = 50、`getClearScoreBonus` = 5000、`getEnemyModifierChance` = 6/18。
- 挥指招式来自**内存 overrides 对象**（入口 chunk `index-*.js` 的 `DefaultOverrides`）：
  `HUIZHI_MOVESET_OVERRIDE` / `HUIZHI_OPP_MOVESET_OVERRIDE` = `[METRONOME, METRONOME, METRONOME, METRONOME]`；
  改版 mod 覆盖对象 `Bj = {}`（空）且 **不参与持久化** → 存档层不可修改。
- 系统侧仅有 `gameStats.huizhiSessionsPlayed/Won`；成就 `HUIZHI_VICTORY` 条件 = `huizhiSessionsWon >= 1`。

---

## 三、适配范围与关键改动点（待代码到位后落实）

| # | 层次 | 改动点 | 说明 |
|---|---|---|---|
| 1 | 解密层 | 密钥/算法对齐 | 使用改版密钥 `x0i2O7WRiANTqPmZ`；保持 OpenSSL 加盐 + AES-256-CBC 读写 |
| 2 | 反混淆层 | OM 映射 | 读档反混淆、存档回填；`$pAttr`→`$pa`；trainerId/secretId 回填当前账号 |
| 3 | 数据模型 | sessionData | 增加/透传：`playerFaints, moreMoneyLessMoneyBonus, ptSoudache*, dynamicBalanceEnabled, talentSystemData, name` |
| 4 | 数据模型 | party[i] | 增加/透传：`customPokemonData`、`p5xRuntime`（**未知子字段必须无损保留**） |
| 5 | 枚举层 | gameMode / challenges / species / moves | 扩展到改版取值，放宽范围校验 |
| 6 | 序列化层 | 回写一致性 | JSON 键序、数值类型（int/bool）保持；重新 AES 加密；文件后缀/编码保持 |
| 7 | 版本校验 | gameVersion | 白名单放宽到 `1.12.x`（并允许未知版本以"尽力而为"模式打开） |
| 8 | **未知字段策略** | 无损透传 | ⚠️ 最关键：编辑器**不得丢弃它不认识的字段**，否则存档会损坏/回档 |

**核心原则：一切"不认识"的字段都原样保留（read → patch → write 只改用户显式修改的键）。**

---

## 四、风险与保护措施
1. 改档前**自动备份**原 `.prsv`。
2. 保证**官方存档仍可编辑**（不破坏原功能：向后兼容）。
3. 写回后用改版本体实际导入验证（菜单 → 管理数据 → 导入数据）。
4. 保持加密/混淆逻辑与原实现等价（避免校验失败）。

---

## 五、待办
- [x] 修改器源码已归档至 `tools/save-editor/`（数据表 `tools/save-editor/data/`，脚本 `tools/save-editor/scripts/`）
- [x] 通读其结构，定位解密/反混淆/数据模型/序列化模块
- [x] 按上表逐项适配，并回归测试官方存档不受影响
- [x] 修复 `customPokemonData.types` 数据丢失缺陷（改版 CS=19 属性被抹除）
- [x] 重新生成物种/招式/特性/招式详情数据表（对齐改版枚举）
- [x] 修正 `validateSaveData` 对 `battleData` 的误报
- [x] 扩展 `TRANSLATIONS.gameModes` 到改版 `0–12`
- [x] 新增「模式数据」面板：八大师(BDS) / 二游(ERYOU) / 第三特性(triplePassives) 的读写与快捷操作
- [x] 补齐 `eryouData` / `eryouSession` / `triplePassives` 字段逆向记录（见 §2.5）
- [x] 在同一面板补齐搜打撤(PT_SOUDACHE) / 火箭队(HUO) / 高种族值挑战(HARD) / 挥指(HUIZHI) 四模式，
      含 `pt` / `ptShop` / `ptSoudacheData`（命之座 + 库存）/ `ptSoudache*` 会话字段的读写与快捷操作，
      并显式标注三类「无存档字段」模式的不可编辑项（见 §2.6）
- [ ] （可选）把 `eryouData.pokemon[].moveset` / `heldItems` / `evolutionGenes` 也做成可视化编辑
- [ ] （可选）为二游「材料本 × 18 属性」提供批量解锁（当前一键解锁只覆盖 4 类基础键 + 存档已有键）
- [ ] （可选）搜打撤：`ptSoudacheStartingItems` 逐项编辑（需先确认引擎 `Map` 序列化后的键值形态）
- [ ] （可选）搜打撤：`talentSystemData.acquiredTalents` 逐条增删（当前仅整项重置）

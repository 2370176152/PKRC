# 38 · UI · H-13 走查 blocked 项归账（预判版 v1）

> **任务**：派单 37 §五 **H-13**（走查 `blocked` 项的 UI 缺口归账，🟠 high，10-26 ~ 10-29）
> **状态**：🟡 **预判版** —— H-2 走查实跑（10-21~10-26）尚未开始，本文以 **gate 静态探测实测**为机器依据
> **产出日期**：2026-10-19（第六阶段 WD1）
> **消费方**：H-2（执行期预期对照）· H-3（10-26 起并入 L2/L3 台账）· 前端（i18n/UI 缺口定位）

---

## 一、口径声明（为什么是预判版，以及它是什么）

H-13 验收标准 ① 是「从 H-2 的 `blocked` **结果**中提取全部 UI 类缺口」——实测 blocked 集要等 H-2 实跑
（10-21~10-26）才存在。但 F-14 已建成 **gate 静态闸门**（`tools/walkthrough/lib/gates.mjs`），
它用「字符串字面量在产物 JS 中的命中」逐点判定「该画面在这个产物里有没有可能渲染出来」——
这正是 blocked 的**机器级预判**，且已在真实 dist 上实测。

**本表两个用途**（都不是抢先交付，而是降低 H-13 风险）：

1. **H-2 执行期预期对照**：跑出来的结果与本表对不上 ⇒ 要么 gate 标记漂移、要么真回归，当场可判
2. **H-13 归账骨架**：六域归账框架、根因分类、工作量级全部预填，10-26 拿到实测 blocked 集后只做「核对/校正」，不做从头分析

**校正机制**（§八）：10-26 H-2 数据到位后逐点核对，一致 → 确认；不一致 → 记录差异原因；随后出正式版并入 L2/L3。

---

## 二、机器实测：gate 双产物探测（2026-10-19 实跑）

```bash
node tools/walkthrough/cli.mjs --gates --product both
```

### 2.1 汇总

| 产物 | 版本 | 可渲染 | blocked |
|---|---|---|---|
| **A**（modder 原产物） | `loading-scene-By2k7Qfx.js` 4.7MB + `index-D3KKGO7Y.js` 2.6MB | **51/51** | 0 |
| **B**（自构建） | `loading-scene-CoDM4HK8.js` 2.7MB + `index-fj-aLRGF.js` 1.0MB | **29/51** | **22** |

按系统（B）：

| 系统 | 点数 | A | B | 系统 | 点数 | A | B |
|---|---|---|---|---|---|---|---|
| boot | 3 | 3/3 | 3/3 | callingcard | 3 | 3/3 | **0/3** |
| talent | 11 | 11/11 | **10/11** | dianxin | 1 | 1/1 | **0/1** |
| eryou | 4 | 4/4 | **0/4** | legendary-popup | 2 | 2/2 | **0/2** |
| pt-soudache | 3 | 3/3 | 3/3 | misc | 14 | 14/14 | **9/14** |
| jieming | 3 | 3/3 | 3/3 | healer | 2 | 2/2 | **1/2** |
| nianli | 2 | 2/2 | **0/2** | p5x | 3 | 3/3 | **0/3** |

### 2.2 13 个「B 零命中」标记的 A→B 计数（实测）

| gate 标记 | A | B | 性质 |
|---|---:|---:|---|
| `abyss` | 89 | **0** | 字符串（ERYOU 深渊） |
| `二游` | 27 | **0** | 中文字面量（ERYOU 养成） |
| `talentViewer:` | 3 | **0** | i18n key（天赋查看器） |
| `healer:` | 8 | **0** | i18n key（healer UI） |
| `nian-li:` | 2 | **0** | i18n key（念力 HUD） |
| `p5x_atk_up` | 4 | **0** | 效果 id（P5X） |
| `container_calling_card_gauge` | 1 | **0** | 容器资源 key（呼符槽） |
| `shock:spatk-echo` | 2 | **0** | i18n key（点心回响） |
| `传说` | 9 | **0** | 中文字面量（传说弹窗） |
| `constellation:` | 1 | **0** | i18n key（命座） |
| `superBackpack` | 3 | **0** | 标识符（超背包） |
| `arenaTag:chengfengOnAdd` | 1 | **0** | i18n key（程风场地） |
| `arenaTag:kongjian` | 2 | **0** | i18n key（空间场地） |

> 对照：`海之守护` 12→8、`搜打撤` 56→12、`talent:talents.` 69→66、`meloetta:` 7→6、`mew:` 7→4
> —— **部分命中**即 gate 透传，说明 B 的 JS 里 i18n key 字面量整体在（t() 调用点保留），
> 零命中 = **承载这些 key 的代码路径整个没进 bundle**（tree-shake），不是 locales 外置。

---

## 三、22 点 blocked 逐点归因总表

「根因置信度」：**确证** = E-1/源码注释直证 ｜ **强推断** = 多源印证 ｜ **待定性** = 须 H-2 实跑或补查

| # | 点 ID | 类 | blame | 标记 A→B | 根因（置信度） | 归账域 |
|---|---|---|---|---|---|---|
| 1 | `talent.codex` | S | C-2 | `talentViewer:` 3→0 | `TalentCodexUiHandler`(gV) 未迁 + `TalentViewerUiHandler`(GV) 已迁未实例化（**确证**：E-1 §1.7 + talent-system.ts 头注释「UI 层不在本文件」） | ① TalentCodex/TalentViewer |
| 2 | `eryou.synthesis` | S | C-1 | `二游` 27→0 | `eryou-ui.ts` 未接（486 declare，L3 挂账）（**确证**：E-1 §1.6） | ⑦ eryou-ui.ts 系列（L3） |
| 3 | `eryou.battle` | B | C-1+A-2 | `abyss` 89→0 | 同上（**确证**） | ⑦ |
| 4 | `eryou.shop` | S | C-1 | `abyss` 89→0 | 同上（**确证**） | ⑦ |
| 5 | `eryou.abyss-buff` | H | C-1 | `abyss` 89→0 | 同上（**确证**） | ⑦ |
| 6 | `healer.wish` | P | C-6 | `healer:` 8→0 | `HealerWishPhase` 是**裸类未接 Phase 体系** ⇒ UI 代码不可达被摇掉（**强推断**：第三十五批记录「类存在≠能入队」+ gate 零命中 + E-1 的 3 宿主不含 WishPhase） | ⑨ i18n/Phase 缺口 |
| 7 | `nianli.stacks` | H | C-6 | `nian-li:` 2→0 | 战斗钩子已接（E-1 ✅）但**层数 HUD 显示代码**未接（**强推断**：catalog note「无 mod 侧注册函数」+ key 零命中） | ⑨ |
| 8 | `nianli.burst` | B | C-6 | `nian-li:` 2→0 | 同上（**强推断**） | ⑨ |
| 9 | `p5x.turnorder` | H | C-5+A-11 | `p5x_atk_up` 4→0 | P5X 模式入口 + `UnitCard` 顺序条未接；`p5x-turn-order.ts` 已交付但宿主未接（**强推断**：E-1 §1.11 + F-11 挂账 + gate 零命中） | ⑥ UnitCard |
| 10 | `p5x.turnorder.hide` | H | C-5 | `p5x_atk_up` 4→0 | 同上（**强推断**） | ⑥ |
| 11 | `p5x.effect` | A | C-5+A-11 | `p5x_atk_up` 4→0 | 同上（**强推断**） | ⑥ |
| 12 | `callingcard.gauge` | H | C-7 | `container_calling_card_gauge` 1→0 | 容器注册代码未进 B；`callingcard-system.ts` 已在迁移镜像但**镜像与构建树不同步**（**待定性**） | ⑧ callingcard |
| 13 | `callingcard.resolve` | P | C-7 | 同上 | 同上（**待定性**） | ⑧ |
| 14 | `callingcard.command` | S | C-7 | 同上 | 同上（**待定性**） | ⑧ |
| 15 | `dianxin.echo` | B | C-6 | `shock:spatk-echo` 2→0 | 战斗钩子已接（E-1 ✅）但**回响结算 Phase 的播报/UI** 未进 bundle（**待定性**） | ⑨ |
| 16 | `legendary.popup` | A | C-8 专项 | `传说` 9→0 | HTML 模块 chunk（313KB）未进 B bundle（**确证**：U-7 已记 HTML 模块 + gate 零命中） | ⑩ legendary-popup |
| 17 | `legendary.helper` | A | C-8 专项 | `传说` 9→0 | 同上（**确证**） | ⑩ |
| 18 | `misc.constellation.codex` | S | 命座数据表 | `constellation:` 1→0 | `PtConstellationUiHandler` 未接线（**确证**：E-1 §1.9「类本体命中 43，入口在未接线文件」） | ③ PtConstellation |
| 19 | `misc.constellation.node` | S | 命座数据表 | `constellation:` 1→0 | 同上（**确证**） | ③ |
| 20 | `misc.super-backpack` | S | C-3 | `superBackpack` 3→0 | `SuperBackpackUiHandler` 接线未做；数据层全闭合（**确证**：E-1 §1.8） | ⑤ SuperBackpack |
| 21 | `misc.terrain.chengfeng` | B | C-11 | `arenaTag:chengfengOnAdd` 1→0 | 程风场地 ArenaTag 代码/key 未进 B（**待定性**：不在 E-1 的 11 系统表） | ⑪ terrain |
| 22 | `misc.terrain.kongjian` | B | C-11 | `arenaTag:kongjian` 2→0 | 同上（**待定性**） | ⑪ |

---

## 四、根因五分法（本表核心增量：blocked ≠ UI handler 缺口）

若只按 H-13 验收 ② 的六域归账，**11/22 的点会掉出视野**。按根因重分：

| 类 | 根因 | 点数 | 占比 | 处置方向 |
|---|---|---:|---:|---|
| **A** | **UI handler 接线缺口**（5 大 UI 缺口系统） | **11** | 50% | 六域归账（§五） |
| **A'** | UI 容器/资源注册缺失（callingcard） | 3 | 14% | 待定性后立项 |
| **B** | i18n key 型 blocked（系统代码 E-1 标 ✅ 完整） | 4 | 18% | 查 Phase/HUD 接线，**不是 UI handler 缺口** |
| **B'** | 特性数据缺失（terrain ArenaTag） | 2 | 9% | 待定性 |
| **C** | HTML chunk 打包缺失（legendary-popup） | 2 | 9% | 打包配置（U-7 已记，差异不挂 S7 账） |

**关键读数**（两种切法，都指向同一结论：验收 ② 的六域装不下 22 点）：

- **按「5 个 UI 缺口系统」切**（E-1 §2 的 🟡 五项：talent / eryou / p5x / constellation / super-backpack）：
  **只占 11 点**（talent 1 + eryou 4 + p5x 3 + constellation 2 + super-backpack 1）；
  **另外 11 点不在 5 系统里**（healer 1 · nianli 2 · callingcard 3 · dianxin 1 · legendary 2 · terrain 2）
- **按「验收 ② 六域」切**：§五表 A 只覆盖 **7 点**（①1 + ③2 + ⑤1 + ⑥3；② TalentShop 与 ④ 觉醒 UI 为 0），
  **其余 15 点无域可归** ⇒ 必须由表 B 的四个附加域（⑦~⑪）承接

---

## 五、归账表

### 5.1 表 A · H-13 验收 ② 的六域（对应 5 个 UI 缺口系统）

| # | 域 | 依赖的未接线 handler | 预判 blocked 点 | 缺什么界面 | 预计工作量级 | 建议归属 |
|---|---|---|---|---|---|---|
| ① | **TalentCodex / TalentViewer** | `TalentCodexUiHandler`(gV) **未迁**；`TalentViewerUiHandler`(GV) **已迁未实例化** | `talent.codex`（1） | 天赋图鉴网格 + 卡片界面（judgement note：删除 F-12 的 innerText 断言后走 diff） | **中**（gV 迁移 TalentCodex18571 + GV 实例化 + ui.ts 注册） | **L2** |
| ② | **TalentShopUiHandler** | `TalentShopUiHandler`(PV) **未迁** | **0 gate-blocked**；latent risk：`talent.shop`（§六） | 天赋商店条目 + 价格界面 | **中**（PV 迁移 TalentShop12767） | **L2**（latent，待 H-2 定性） |
| ③ | **PtConstellationUiHandler** | `PtConstellationUiHandler` **未接线** | `misc.constellation.codex` + `misc.constellation.node`（2） | 命之座图鉴 / 节点连线界面 | **中**（constellation-ui.ts 28KB declare 已清零、类本体命中 43 ⇒ 差 ui.ts 注册 + 实例化 + 走查） | **L2** |
| ④ | **觉醒 UI** | eryou-ui.ts 系列（**L3 已有挂账**） | **0**（catalog 无觉醒画面点；觉醒石结算 `carryOutAwakeningStones` 随 PT 通关流程 **H-1** 补迁） | — | **不重估**（L3：两批施工失败实证） | **L3 已有** |
| ⑤ | **SuperBackpackUiHandler** | `SuperBackpackUiHandler` **未接线** | `misc.super-backpack`（1） | 超级背包网格界面 | **小-中**（mod-super-backpack.ts 数据层全闭合、文件干净 ⇒ 接线 + 注册即可） | **L2** |
| ⑥ | **UnitCard**（P5X 顺序条） | `UnitCard` **未迁**（4858 字符）+ P5X 模式入口 | `p5x.turnorder` + `p5x.turnorder.hide` + `p5x.effect`（**3**，同因并列） | P5X 回合顺序条（UnitCard 内 2 处 `setP5XTurnOrderFocus`） | **中**（UnitCard 迁移 + p5x-turn-order.ts 已由 F-11 交付 ⇒ 接线） | **L2** |

### 5.2 表 B · 六域之外的附加域（防止 9 点掉出视野）

| # | 域 | 预判 blocked 点 | 根因 | 预计工作量级 | 建议归属 |
|---|---|---|---|---|---|
| ⑦ | **eryou-ui.ts 系列**（11 Eryou handler） | eryou 4 点 | 486 declare + 6463 字符单行长；三十三/三十四批两败 | **已判定不可行**（AST 级工程） | **L3 已有**（UI 组件 61） |
| ⑧ | **callingcard 容器**（四系统共用槽位类，不在 11 系统表） | callingcard 3 点 | `container_calling_card_gauge` 注册代码未进 B | **待定性**（H-2 后定） | 定性后入 L2 |
| ⑨ | **i18n/Phase 缺口**（healer·nianli·dianxin） | healer.wish + nianli×2 + dianxin.echo（4） | `HealerWishPhase` 裸类未接 / 层数 HUD 未接 / 回响结算播报未进 bundle | **小**（接 Phase 体系或补 HUD 挂点；**不是 UI handler 迁移**） | **L2** |
| ⑩ | **legendary-popup HTML chunk** | legendary×2（2） | 313KB HTML chunk 未进 B bundle | **小-中**（打包配置；U-7 已记「不走 Phaser 管线」） | L2（或打包项） |
| ⑪ | **terrain ArenaTag**（程风/空间，不在 11 系统表） | misc.terrain×2（2） | ArenaTag 代码/key 未进 B | **待定性** | 定性后入 L2 |

---

## 六、latent risk：gate 透传 ≠ 可走查（4 点，预期 unreached/fail 而非 blocked）

这 4 点 gate 全部透传（B 有命中），但 **route 目标本身就在未迁代码里** ⇒ H-2 实跑大概率
`unreached`/`fail`。与 gate-blocked 分开统计，否则会误判「走查通过」：

| 点 | gate（B 命中） | route 目标 | 预期 | 说明 |
|---|---|---|---|---|
| `talent.shop` | `talent:talents.` 69→**66** | `showTalentShop` | **unreached** | 宿主 `TalentShopUiHandler`(PV) 未迁；产物原文有「注册表为空 → `l0()` 兜底」⇒ 也可能走到兜底界面（届时按 diff 判） |
| `pt.start` | `搜打撤` 56→**12** | `PtSoudacheStartPhase` | **unreached** | StartPhase 未迁；**H-1 正在补**（10-23 前）⇒ 补完复测转通 |
| `pt.shop` | `搜打撤` 12 | PT 商店 UI 链 | unreached/fail | 随 H-1 的 PT 收口复测 |
| `pt.settle` | `搜打撤` 12 | PT 结算 UI 链 | unreached/fail | 随 H-1 |

> **规则**：这 4 点若在 H-2 报出 `blocked`（而非 unreached），说明根因比预判深（gate 标记漂移或
> B 产物又有变化），须回报并回查本表。

---

## 七、对 E-1 / M3 判据的新发现（4 条，供 H-3 参考）

1. 🔴 **「✅ 完整」系统也可能 gate-blocked**：healer / nianli / dianxin 三系统 E-1 均标 ✅ 完整
   （战斗钩子宿主已接），但 B 的 gate 分别 blocked 1/2/1 点。根因都不在战斗逻辑，而在
   **Phase 接线（HealerWishPhase 裸类）/ HUD 显示 / 结算播报**。
   ⇒ **L1-2「行为口径」的正确性再获实证**：符号/宿主完整 ≠ 画面可渲染；这 4 点是「走查才能发现」的典型。
2. 🔴 **callingcard 与 terrain 不在 E-1 的 11 系统表**：callingcard 是四系统共用槽位类、terrain
   （程风/空间）是 ArenaTag 域。二者的 blocked 点（3+2）在 11 系统核查表里**无行可归** ⇒ 建议 H-3
   建 L2 时给这两个域单独立项，不要硬塞进 11 系统。
3. ✅ ** eryou 4 点与 L3 记录完全吻合**（`abyss`/`二游` 零命中 ⇔ E-1 §1.6 的 L3 挂账）⇒ L3 判断
   被机器数据背书，H-3 核销 L3 时可直接引用本表 §2.2。
4. ✅ **legendary-popup 的 C-8 专项定位成立**：`传说` A=9→B=0 与 U-7「HTML 模块不走 Phaser 管线」
   互证；这 2 点的差异**不挂 S7 账**（judgement.mjs 已有同注）。

---

## 八、L2/L3 并入路径（H-13 正式版作业规程，10-26 ~ 10-29）

```
10-21~10-26  H-2 实跑 51 点 × 双产物，产出实测 blocked 集 + 五态裁定
      │
10-26        ┌─ 逐点核对：本表 22 点 vs 实测 blocked
      │      │   · 一致 → 确认（根因置信度升级为「实证」）
      │      │   · 实测有而本表无 → 新缺口，补行（疑 gate 标记漏判或新回归）
      │      │   · 本表有而实测无 → B 产物已变化或 gate 漂移，记录差异原因
      │      └─ latent risk 4 点核对：预期 unreached/fail；报 blocked 则回报
      │
10-27~10-29  出 H-13 正式版：
      │      · 表 A 六域 + 表 B 四域，每条补「实测证据指针」（H-2 报告点 + 证据包 manifest 编号）
      │      · 按域并入 H-3 的 L2 台账（归属文件 / 复现路径 / 预计窗口）
      │      · L3 已有项（ eryou-ui 系列 61）不重复挂账，只做引用
      │      · 「~291 其余」级别的模糊条目不得出现（M3 判据文档 §五 要求）
```

**预判的 L2 新增项**（按域，供 H-3 建台账时直接取用）：
TalentCodex/TalentViewer 接线 · TalentShopUiHandler 迁移 · PtConstellationUiHandler 接线 ·
SuperBackpackUiHandler 接线 · UnitCard+P5X 顺序条 · healer WishPhase · nianli HUD · dianxin 回响播报 ·
callingcard 容器（待定性）· terrain ArenaTag（待定性）· legendary chunk 打包。
**预判的 L3 既有项**：eryou-ui.ts 系列（不重估）。

---

## 九、给 H-2 执行者的交叉核对清单（5 条）

1. **22 点预期 blocked**（§三总表）：若某点居然渲染成功 ⇒ B 产物有新变化或 gate 标记漂移，回报 UI 复核
2. **latent risk 4 点**（§六）：预期 `unreached`/`fail`；若报 `blocked` 说明根因比预判深，回报
3. **五态口径不变**：blocked = 该画面在本产物无实现（不计失败）；unreached = route 失败；unproven = 弱证明（不得声称已走查）
4. **51 点锁定**：不因 blocked 集中而增删画面点（派单 37 §0.2）
5. **证据按 B-12 归档**：每点的 gate 判定理由（`reason` 字段）建议一并写入证据 manifest，供 H-13 正式版引用

---

## 附：本表数据复现命令

```bash
# gate 双产物探测（本表 §二数据源）
node tools/walkthrough/cli.mjs --gates --product both

# 逐点 blocked + blame 交叉（本表 §三）
node -e "import('./tools/walkthrough/lib/gates.mjs').then(async ({probeCatalog})=>{
  const {CATALOG}=await import('./tools/walkthrough/scenarios/catalog.mjs');
  const {JUDGEMENTS}=await import('./tools/walkthrough/lib/judgement.mjs');
  for(const s of probeCatalog(CATALOG,'B'))for(const p of s.points)
    if(!p.present)console.log(p.id, JUDGEMENTS[p.id].class, JUDGEMENTS[p.id].blame, p.reason);
})"
```

---

> **UI Designer** · 2026-10-19（第六阶段 WD1）
> **下一步**：H-2 实跑数据到位（10-26）后按 §八 规程出正式版；本预判表随之归档为「预期对照」证据。

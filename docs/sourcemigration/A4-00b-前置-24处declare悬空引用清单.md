# 🔴 A4-00b 前置 · **24 处 `declare` 悬空引用**清单（P0 · 启动阻断）

> 发现者：**F-10 自动化走查环境**（`tools/walkthrough/`），首次运行即命中
> 发现时间：2026-10-16 ｜ 发现方式：**A｜B 双产物对比**（O-9b）
> 归属任务：`A4-00b-2`（补迁 27 项）→ 本清单为**其前置输入**（精确落点 + 参考实现）
> 严重级：**P0 —— 阻断全部功能等价验证**（A4-01/A4-04 无法进行）

---

## 一、一句话结论

**A4-00 并入迁移文件时，为「让本批可编译」保留了 24 处 `declare` 占位。
`declare` 在 TypeScript 中**零 emit** —— 被调用时变成对未定义全局的裸引用，
运行期必抛 `ReferenceError`。**

其中 **`safeT` 在 boot 阶段即被调用** ⇒ 自构建产物 `game/server/dist/`
**黑屏、无法进入游戏**。全仓 `tsc` 0 错、`vite build` EXIT=0 **完全检测不到**。

---

## 二、症状（F-10 实测证据）

```
node tools/walkthrough/cli.mjs --scenario boot --product both
```

| 项 | **A** modder 原产物 | **B** 自构建产物 |
|---|---|---|
| 画面就绪 | ✅ 3.1s（stdDev 77.6） | ❌ **30s 超时（stdDev 0，纯黑）** |
| 未捕获异常 | 0 | **2** |
| 控制台 error | 0 | 4 |
| 缺失资源(404) | 16 | 12 |
| 像素差异率 | — | **53.0%**（包围盒 1280×701，几乎全屏） |

B 版两条未捕获异常：

```
① ReferenceError: safeT is not defined
     at createAttackTalent (assets/loading-scene-CoDM4HK8.js:17:1907)
     at generateTestTalents (…)

② Uncaught (in promise) SyntaxError: Unexpected non-whitespace character after JSON
     at position 4 (line 1 column 5)
```

> ② 是 ① 的下游：boot 中断后，客户端把 404 响应体（`404 Not Found: /locales/en/…`）
> 当作 JSON 解析（`"404"` 是合法 JSON 数字，第 4 字节起非法）⇒ 报错。**非独立缺陷。**

**证据包**：`tools/walkthrough/evidence/boot-A-B/`（含 A｜B 并排图、`report.html`、`report.json`）

---

## 三、根因

`src/data/systems/*.ts` 中的写法：

```ts
declare function safeT(key: string, defaultValue: string): string; // 产物 `es`
```

- `declare function` 是**环境声明**（ambient）：告诉 tsc「这个名字存在」，**不产生任何 JS**。
- 因 src 内**没有** `import`/定义，rollup/rolldown 也不认为它是模块内绑定
  ⇒ 调用点被原样输出为**裸标识符** `safeT(...)` ⇒ 运行期查全局 ⇒ **ReferenceError**。

**对照：A 版（modder 原产物）里它是真函数**（keepNames 反查）：

```js
function es(n,s){const i=M.t(n,s);return typeof i=="string"&&i.length>0?i:s}l(es,"safeT");
```

⇒ **修复 = 按产物 keepNames 把实现搬进来**，把 `declare` 换成真实函数体。

---

## 四、全量清单（24 处）

### 4.1 `src/data/systems/talent-system.ts`（14 处 · 行 97–110）

| # | 行 | 符号 | 产物短名 | 用途 | A 版实现 |
|---:|---:|---|---|---|---|
| 1 | 97 | `safeT` | `es` | i18n 容错翻译 | ✅ 已核（见 §三） |
| 2 | 98 | `createSpeciesPartyWeightModifiers` | `KN` | 队伍权重修饰器 | ✅ 已核 |
| 3 | 99 | `runInstantEffect` | `v_e` | 天赋**获取**即时效果 | ✅ 已核 |
| 4 | 100 | `TALENT_RELEASE_ITEM_ID` | `Rre` | 常量（释放道具 id） | 待核 |
| 5 | 101 | `TALENT_ID_ZICAN` | `xNe` | 常量（自残） | 待核 |
| 6 | 102 | `TALENT_ID_STATUS_SYNC` | `Lue` | 常量（状态同步） | 待核 |
| 7 | 103 | `TALENT_ID_BAD_DREAMS` | `Dse` | 常量（恶梦） | 待核 |
| 8 | 104 | `isYijianQingyuanActiveFor` | `Rg` | 一剑清源判定 | 待核 |
| 9 | 105 | `isXingxiangActiveFor` | `PS` | 星象激活判定 | ✅ 已核 |
| 10 | 106 | `getXingxiangIndex` | `CI` | 星象索引 | ✅ 已核 |
| 11 | 107 | `getXingxiangName` | `kw` | 星象名 | ✅ 已核 |
| 12 | 108 | `switchXingxiang` | `Wh` | 星象切换（含中文播报） | ✅ 已核 |
| 13 | 109 | `applyXingxiangWindEffect` | `nue` | 星象风效果 | 待核 |
| 14 | 110 | `getCurrentWave` | `I0` | 当前波次 | ⚠️ **A 版 keepNames 实为 `getCurrentWave$1`**（重名消歧后缀） |

### 4.2 `src/data/systems/pt-soudache-system.ts`（10 处 · 行 73–83）

| # | 行 | 符号 | 产物短名 | 用途 |
|---:|---:|---|---|---|
| 15 | 73 | `getActiveChallenge` | `DS` | 取当前挑战 |
| 16 | 74 | `playerPartyRootSpecies` | `rg` | 队伍根种族 |
| 17 | 75 | `settlePendingChallengeReward` | `ore` | 结算待发挑战奖励 |
| 18 | 76 | `getDynamicBalanceManager` | `vl` | 动态平衡管理器（✅ 已核：A 版 `function vl(){return nH||(nH=new Zm),nH}`） |
| 19 | 77 | `getStarterDataList` | `ms` | 初始宝可梦数据表 |
| 20 | 79 | `serializePokemon` | `qn`/`mR`/`OL`/`RL`/`oL` | 存档序列化器（**断言待定性**） |
| 21 | 80 | `serializeModifier` | 同上 | 同上 |
| 22 | 81 | `serializeArena` | 同上 | 同上 |
| 23 | 82 | `serializeTrainer` | 同上 | 同上 |
| 24 | 83 | `serializeChallenge` | 同上 | 同上 |

> **范围封闭声明**：全仓 `grep "declare function|declare const|declare var"` 命中 **27 处**，
> 其中 **3 处是上游合法的编译期完备性断言**（`EnsureAllArenaTagTypesAreMapped` /
> `EnsureAllBattlerTagTypesAreMapped` / `EnsureAllPositionalTagsTurnIntoTheirArgumentsWhenSerialized`），
> **不属于本清单**。⇒ **悬空引用恰为 24 处，范围已封闭。**

---

## 五、🔴 为什么之前的 gate 全绿（判据盲区）

| 已有 gate | 结果 | 为什么漏掉 |
|---|---|---|
| `tsc` 全仓 0 错 | ✅ 通过 | `declare` **专为「让 tsc 满意」而存在** —— 它恰好消除了唯一的报错 |
| `vite build` EXIT=0 | ✅ 通过 | `declare` 零 emit，**构建产物语法合法**；裸标识符在 JS 里是合法表达式 |
| 签名复测（覆盖率 67.78%）| ✅ 通过 | 统计的是**符号是否出现在 bundle**；`safeT` 出现了（63 次）⇒ 反而被算作「命中」 |
| A4-00 验收 ② `TODO(接入锚点)`=0 | ✅ 通过 | 与 `declare` 无关 |
| **未做：运行实测** | — | **本条是唯一能发现的判据** ⇒ 正是 F-10 存在的理由 |

**⇒ 结论：`declare` 占位使「可编译」与「可运行」严重脱钩。**
**任何「只做静态检查」的 gate 对这类缺陷一律失明。**

---

## 六、影响面

| 影响 | 说明 |
|---|---|
| **B 版产物不可用** | `dist/` 当前**黑屏**，游戏完全无法进入 |
| **A4-01 11 系统走查** | 前置即不满足（跑不起来）⇒ **本阶段关键路径被堵** |
| **A4-04 全流程回归** | 同上 |
| **A5-01b「产物可启动」验收** | 该条验收**实际未达成**（此前判断偏乐观） |
| 已上线状态的影响 | `dist/` 仍挂「未验证」标注（O-10）⇒ **标注方向正确，但性质应从「未验证」升级为「已知不可启动」** |

> ⚠️ 另注：B 版另有 **12 项资源 404**（`/locales/en/biomes.json`、`/fonts/*.ttf`、
> `/manifest.json` 等）—— 其中 `/locales/en/biomes.json` **请求名与现有文件 `biome.json` 不符**
> （单复数差异），疑为 mod 侧新增 locale 命名。**此项归 B-9（资源补全）/ A4-00b，与本清单分开跟踪。**

---

## 七、修复建议（按优先级）

### 优先级 P0（阻断级，必须先做）

**这 24 项属 `A4-00b-2`（补迁）+ `A3-补` 的交集。建议并入同一批处理，方法统一：**

1. 对每一项，用 **keepNames 反查**在 **A 版产物**中定位实现（`grep '"<符号名>"' dist.modder-backup-*`）；
2. 逐字还原为真实函数/常量，**替换 `declare`**；
3. `tsc` → `vite build` → **`node tools/walkthrough/cli.mjs --scenario boot --product both`**；
4. 判据：B 版 **就绪 + 0 未捕获异常 + 像素差异率显著下降**。

> **顺序建议**：先只修 `safeT`（1 行）验证「黑屏→可启动」，
> 再批量处理其余 23 项（其中 4 个 `TALENT_ID_*` 常量与 5 个 `serialize*` 需先定性）。

### 优先级 P1

5. 修正 §六 的 12 项资源 404（B-9 域），特别是 `biomes.json` 的命名核对。
6. 解除 `dist/` 的「未验证」标注前，**必须**先跑通 F-10 的 `boot` 场景。

### ⛔ 不建议

- **不要**把 `declare` 改成 `const x: any = undefined` —— 那只是把 `ReferenceError`
  换成 `TypeError: x is not a function`，**更晚、更难定位**。
- **不要**只改 `safeT` 就宣布修复 —— 其余 23 项会在后续路径上逐个引爆。

---

## 八、与现有台账的挂接

| 台账 | 挂接方式 |
|---|---|
| `A4-00b-2`（补迁 27 项）| 本清单 **24 项** 与其口径一致（同为 (d)/(d2) 类），**合并为 27+24 的封闭范围**（需 owner 确认是否重算总数） |
| `A4-00-前置-A3归属遗漏清单.md` | 本清单是「**同一批挂账**」的**运行时后果量化**（此前只记了「编译期占位」） |
| `A3-迁移规范.md §8.1` | 建议新增**勘误 E15**（见 §九） |
| `A4-01-产物验证状态.md` | 状态需从「未验证」改为「**已知不可启动（`safeT` 悬空）**」，附本清单 |

---

## 九、方法论沉淀（建议登记 勘误 **E15**）

> **E15 —— `declare` 占位不是「占位」，是「运行期定时炸弹」。**
> 前序勘误 E10/E11 已记录「`declare ... any` 掩盖**类型**不匹配」；
> **E15 进一步指出更严重的后果：`declare` 还会掩盖「符号**根本不存在**」**。
>
> - **症状**：`tsc` 0 错 + `build` EXIT=0 + 签名覆盖率把该符号计为「命中」，
>   但运行期 `ReferenceError`，游戏直接黑屏。
> - **判据**：**只要源里出现 `declare function/const/var` 且全树无同名定义 ⇒ 一律视为 P0 缺陷**，
>   不得以「仅为让本批可编译」为由保留。
> - **检测**：`grep -rn "declare function\|declare const\|declare var" <src>` 后
>   逐个核验「全树是否存在真实定义」；**F-10 的 `boot` 场景是运行侧的兜底检测。**
> - **规则**：迁移占位**只允许用可运行的实现**（哪怕是最小空实现 `export function f(){}`），
>   **禁止用 `declare`**。

**一句话**：`declare` 让「编译通过」与「能跑」脱钩 —— **静态 gate 必须配一条运行时 gate。**

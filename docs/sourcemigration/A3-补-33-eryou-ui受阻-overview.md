# A3-补 第三十三批 · eryou-ui.ts 施工受阻（已回滚）

## 一句话结论

三条施工路全部失败，**已完整回滚、tsc 0 错、代码零变更**。
本批实际价值是**把工作量量化定案** + 挖出 1 处上游 API 差异 + 定下 2 条施工禁忌。

## 侦察产出：174 个依赖的真实构成

| 类别 | 数量 | 能否零风险落 |
|---|---:|---|
| **已迁·可直接 import** | **17** | ✅ 可以 |
| **字面量**（47 数值 + 3 文案 = 50；另 37 个是引用型不可抄） | **87** | ✅ 部分可以 |
| **keepNames 命中但未迁** | **66** | ❌ 11k 字符实现 + **140 个二级依赖** |

另定位枚举/上游 API：`E`=globalScene · `M`=i18next · `w`=Button · `F`=TextStyle ·
`R`=PokemonType · `V`=UiMode · `Is`=ERYOU 道具类型（MATERIAL/EXP/HELD_ITEM/PT）

## 三条路怎么失败的

### 路 A：整体替换 declare 块（37–522 行）→ 1899 个错

66 个未迁依赖失去 declare 占位，tsc 立刻爆炸（TS2304 656 · TS2339 1132 · TS2345 30）。

中途我看到「只剩 3 个错」差点收工——**那是假象**：我把未解析的 declare 挪到了文件末尾，
等于把问题藏起来而不是解决它。

### 路 B：保守替换 73 项 + 保留 412 declare → 残留 45 错

| 错类 | 数量 | 根因 |
|---|---:|---|
| TS2345 `type '16' not assignable to '2'` | 30 | `addTextObject` 上游 API 变了 |
| TS2300 `Duplicate identifier` | 6 | import 的符号仍在 declare 名单里 |
| TS2339 `BattleScene.pushPhase/shiftPhase` | 4 | 新树收进 `phaseManager` |
| 其他 | 6 | — |

### 路 C：正则批量改写 5 参调用 → 命中 0 处

`eryou-ui.ts` 是产物逐字转写，类体内代码压成**单行 + 嵌套 10+ 层**，
`re(x, y, content, F.X, Y, 16)` 这类调用的正则改写根本匹配不上。

## 新发现的 API 差异：`addTextObject` 第 5 参

| 树 | 第 5 参 | 传数字 `16` 的行为 |
|---|---|---|
| 产物 `re(n,s,i,A,a)` | 隐式 any | `if(a){ if(a.fontSize){…} S=Object.assign(S,a) }` ⇒ 数字包装无 `.fontSize` ⇒ **被静默忽略** |
| 新树 `addTextObject(...)` | `Phaser TextStyle` 对象 | TS2345 拒绝 |

正解是本地包装把数字转 `{ fontSize: "Npx" }` —— 语义等价，且**比产物更正确**（产物那个数字本来就是无效的）。

## 定下的两条施工禁忌

1. **declare 只能逐项替换，绝不能整体替换 declare 块。** 整体替换会一次性暴露上千个错误，
   既无法定位也无法回滚。一次只换**已 resolve 的 1 项**，每项跑 tsc 验。
2. **单行长代码不能用正则批量改。** 判据：迁移产物文件若 `wc -l` 远小于字符数，
   说明含超长行 ⇒ 放弃正则，改用 AST 或人工。

## 后续批施工顺序

1. 30 处 `addTextObject` 数字字号 → `re2` 包装（纯手工、零风险、可独立完成）
2. 逐项替换 17 个已迁符号的 declare（一次一项 + tsc 验）
3. 50 个字面量建 const 表（`bS`=320 · `BI`=36 · `nA`=26 …）
4. 66 个未迁依赖按域拆批（等级/进化/突破/合成/深渊/周常/图标绘制）
5. `BattleScene.pushPhase/shiftPhase/clearPhaseQueue` → `phaseManager.*`

## 指标

回滚后全部不变：命中 2245 · 覆盖率 71.84% · tree-shake 294 · 残差 540 · **tsc EXIT=0**。
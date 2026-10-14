# B-2 · `.gitignore` 与新目录覆盖复核记录

> **派单来源**：`15-第二阶段任务分发.md` §五 B-2
> **执行日期**：2026-10-14（第二阶段 WD1）
> **执行人**：后端工程师
> **结论**：**发现并修复 7 个前瞻性缺口**；原有规则无误伤；已固化为可重复执行的校验脚本。

---

## 一、验收对照

| 派单要求 | 结果 |
|---|---|
| ① `docs/archive/**`、`docs/sourcemigration/**` 均**不被**忽略 | ✅ 通过（11 条路径实测） |
| ② 中间产物均被忽略 | ✅ 通过（45 条路径实测）——**但补了 7 个第二阶段 + 1 个 B-4 的缺口** |
| ③ 产出复核记录表 | ✅ 本文档 |

> **二次修订（2026-10-14，B-4 期间）**：新增 5 条发布中间/备份目录规则（缺口 #8），
> 断言从 74 → **83** 条，并已与真实 `git check-ignore` 交叉校验 **11/11 一致**。
> 详见 §三 缺口 #8 与 §4.1。

---

## 二、原状评估（改之前）

`.gitignore` 原有 6 组规则，对第一阶段的内容**覆盖完整**：

| 组 | 覆盖对象 | 状态 |
|---|---|---|
| 二进制游戏资产 | `dist/images` `dist/audio` `dist/fonts` `pokerogue-win32-x64` | ✅ 生效 |
| Node 便携运行时 | `shared/runtime/node.exe` 等 8 项 + `node_modules` | ✅ 生效 |
| 二进制数据表 | `*.xlsx` `*.png` `*.prsv` | ✅ 生效 |
| 日志/临时/缓存 | `*.log` `node_output.txt` `.workbuddy/` | ✅ 生效 |
| `.build-tools/*` + `!.build-tools/*.py` | 只留可复现的 `.py` | ✅ 生效（16 个 .py 入库，其余全排除） |
| 上游树/旧产物/原始副本 | `upstream-pokerogue/` `dist-a12/` `PKRC/` | ✅ 生效 |

**两个方向均验证无误伤**：`git ls-files`（2,203 个已跟踪文件）无一被规则命中。

---

## 三、发现的缺口（第二阶段 7 个 + B-4 补 1 个）

派单只要求复核**现有**目录，但这些规则在第一阶段用不到、**第二阶段 A3-13 一跑构建就会立刻踩到**：

| # | 缺口路径 | 会用什么命令产生 | 漏忽略的后果 |
|---|---|---|---|
| 1 | `docs/sourcemigration/A3-migration/dist/` | `vite build` | 🔴 **数百 MB 构建产物进仓库**，且每次构建内容都变，永久污染 diff |
| 2 | `dist/`（仓库根） | 若在根目录构建 | 同上 |
| 3 | `*.tsbuildinfo` | `tsc -b` / vite | 增量编译缓存，内容含绝对路径（泄露本机路径） |
| 4 | `.vite/` | vite 依赖预构建 | 缓存目录，体积大且无意义 |
| 5 | `coverage/` | 测试覆盖率 | 中间产物 |
| 6 | `.pnpm-store/` | pnpm 存储 | 体积大 |
| 7 | `docs/sourcemigration/A3-migration/node_modules/` | `pnpm install` | ⚠️ 已被通用 `node_modules/` 覆盖，**非缺口**（列出以示已查） |
| **8** | `game/server/{.release-staging,backups,dist.old,dist.rollback-*,dist.broken}/` | **B-4 发布脚本** | 🔴 **GB 级数据进仓库**（见本节下方缺口 #8） |

### 修法（新增 6 条规则）

```gitignore
# ① 迁移树的构建输出（锚定到该目录，避免误伤别处）
docs/sourcemigration/A3-migration/dist/

# ② 仓库根级 dist/
#    注意用 /dist/ 而非 dist/：后者匹配任意深度的 dist/，
#    会把 game/server/dist/（发行版资产，需入库）也拖下水。
#    且 A5-01 产物切换需要往 game/server/dist/ 新增文件，
#    一旦被忽略就会静默漏提交。
/dist/

# ③ TypeScript 增量编译缓存
*.tsbuildinfo

# ④ Vite 缓存 / 覆盖率 / pnpm 存储
.vite/
coverage/
.pnpm-store/
```

> **关键设计判断**：为什么用 `/dist/` 而不是 `dist/`
> `dist/` 无前导斜杠 = 匹配**任意深度**的 `dist` 目录 → `game/server/dist/` 会被命中。
> 已跟踪文件不受影响（gitignore 只管未跟踪文件），但 **A5-01 切换产物时要往该目录新增文件**，
> 这些新文件会被静默忽略 → **发行版资产漏提交，且不报错**。
> 用 `/dist/`（锚定仓库根）彻底规避。已用 5 条 `game/server/dist/**` 路径实测确认无误伤。

### 缺口 #8：B-4 发布脚本的中间/备份目录（2026-10-14 补）

做 B-4 设计时发现：发布流程会在 `game/server/` 下产生**每份约 758 MB** 的目录，且**全都不被忽略**。

| 路径 | 产生者 | 漏忽略的后果 |
|---|---|---|
| `game/server/.release-staging/` | 发布组装暂存 | 🔴 758 MB 进仓库 |
| `game/server/backups/` | 历史备份（默认保留 3 份） | 🔴 **2.3 GB 进仓库** |
| `game/server/dist.old/` | 原子切换的临时改名 | 🔴 758 MB |
| `game/server/dist.rollback-*/` | 手动回滚现场 | 🔴 758 MB |
| `game/server/dist.broken/` | 冒烟失败现场 | 🔴 758 MB |

**修法（新增 5 条规则，`dist*` 不能用通配）**：

```gitignore
game/server/.release-staging/
game/server/backups/
game/server/dist.old/
game/server/dist.rollback-*/
game/server/dist.broken/
```

> ⚠️ **为什么逐条点名，不用 `dist*` 通配？**
> 因为 `game/server/dist/` 本身**必须入库**（JS/CSS/HTML 是发行版产物）。
> `dist*` 会把 `dist/` 一起拖下水 → 发行版代码全部漏提交。
> 这正是缺口 #2 用 `/dist/` 而非 `dist/` 的同一个坑，只是这次出现在**兄弟目录**层面。
>
> **反向探针**：`dist.old/` 是精确路径分量规则，加了两条 SEMANTIC_PROBES
> （`dist.older/`、`dist.rollback2/`）确保它不会过度匹配。

---

## 四、复核方法（可复现）

新增 `tools/verify-gitignore.cjs`，把本次复核固化为 **83 条断言**：

```bash
node tools/verify-gitignore.cjs          # 人类可读
node tools/verify-gitignore.cjs --json   # 机器可读
node tools/verify-gitignore.cjs --strict # 额外要求断言路径真实存在（防断言表过期）
```

### 4.1 断言分组

| 组 | 条数 | 断言内容 |
|---|---|---|
| 必须可跟踪 | 38 | 归档报告、源码化清单 JSON、A3 迁移源码、**发行版资产**、工具、`.build-tools/*.py` |
| 必须被忽略 | 45 | 上游树、`.build-tools` 中间产物、**A3-13 构建产物**、tsbuildinfo、node_modules、二进制资产、**B-4 发布中间/备份目录**、日志 |
| 语义探针 | 5 | 锁定「兄弟文件不被父目录规则误伤」「精确路径分量不被通配误伤」的语义 |

### 4.2 🔴 实现选择：为什么不用 `git check-ignore` 子进程

脚本第一版用 `git check-ignore` 判定，但在本环境 **spawn 可执行文件被沙箱禁止（EBUSY）**，脚本直接崩溃。
改为**纯 JS 复刻 gitignore 匹配语义**（48 条规则的解析 + 逐级前缀匹配 + 父目录排除不可复活）。

**纯 JS 实现必须证明与 git 行为一致**，否则就是自洽但错误。故做交叉校验：

```
导出断言路径 → 逐条跑 git check-ignore → 与我的实现比对
第一批（B-2，74 条）：✅ 74/74 完全一致
第二批（B-4 新增 11 条）：✅ 11/11 完全一致
```

### 4.3 交叉校验抓到的自身错误

断言表里原本写了 `PKRC-repo.bundle.bak` **应被忽略**——这是错的：

- 规则是 `PKRC/`（目录），而 `PKRC-repo.bundle.bak` 是它的**兄弟文件**，不在其内部
- `git check-ignore -v` 实测确认：**未忽略**（退出码 1）
- 我的纯 JS 实现给出的也是「未忽略」→ **实现正确，断言错误**

已将该路径移入 `SEMANTIC_PROBES`（语义探针组），并把这条认知写进注释。

> 这条记录的价值：它同时证明了①实现与真实 git 吻合；②断言表本身也需要被测试。

---

## 五、复核结论表

| 检查项 | 方法 | 结果 |
|---|---|---|
| `docs/archive/**` 不被忽略 | `git check-ignore` × 3 | ✅ |
| `docs/sourcemigration/**` 不被忽略 | × 12（含 1.1 MB 的 `a2-cn-anchors.json`） | ✅ |
| `docs/sourcemigration/A3-migration/src/**` 不被忽略 | × 3 | ✅ |
| `game/server/dist/**` 不被误伤 | × 8（含 assets/locales/battle-anims 子目录） | ✅ |
| `.build-tools/*.py` 保持入库 | × 3 | ✅ |
| `.build-tools` 其余全部排除 | × 14（zip/tgz/ts/json/exe/克隆树） | ✅ |
| `upstream-pokerogue/` 排除 | × 2 | ✅ |
| **A3-13 构建产物排除（新增）** | × 3 | ✅ 修复后 |
| **tsbuildinfo 排除（新增）** | × 2 | ✅ 修复后 |
| **根级 `/dist/` 排除（新增）** | × 2 | ✅ 修复后 |
| **`.vite/` `coverage/` `.pnpm-store/` 排除（新增）** | × 3 | ✅ 修复后 |
| **B-4 发布中间/备份目录排除（新增）** | × 7 | ✅ 修复后 |
| **`dist*` 通配的反向探针（新增）** | × 2（`dist.older/`、`dist.rollback2/` 必须可跟踪） | ✅ 无误伤 |
| node_modules 任意深度排除 | × 2 | ✅ |
| 已跟踪文件零误伤 | `git ls-files \| check-ignore` | ✅ 2,203 个文件无一命中 |

---

## 六、遗留与建议

| # | 事项 | 归属 | 说明 |
|---|---|---|---|
| 1 | `PKRC-repo.bundle.bak` 当前**未**被忽略 | 后端 | 若产生该备份文件，需单独加 `PKRC-repo.bundle.*` 规则；**当前不加**（避免误伤入库的 `PKRC-repo.bundle` 本身——它被 `PKRC-repo.bundle.bak` 的通配规则排除在外，需精确写法） |
| 2 | 全栈 WIP 文件未提交 | 全栈 | 工作区现有 `.build-tools/max-type-probe*.py`、`a34-*.py`、`A3-迁移规范.md` 等未跟踪文件，属全栈 A3-01/02 产出，**后端不代为提交** |

> **注**：第 1 项的精确写法（若将来需要）：
> `PKRC-repo.bundle.*` + `!PKRC-repo.bundle`（先排除全部变体，再单独放行主文件）。
> 当前不需要，故不提前加规则——**避免为想象中的需求增加复杂度**。

# B-16 · `dist/` 卫生：剔除遗留打包文件

> **派单**：`docs/delegation/32-第五阶段任务分发.md` §六 B-16（🟡 low，10-19 ~ 10-20，**已降级**）
> **降级原因**：O-15 已闭环（个人自用 ⇒ 授权不适用）⇒ 不做授权追溯，只做构建产物整洁性
> **状态**：已执行 · 残留已剔除 · 根因已定位 · **已在合并管线加过滤（防复发）**
> **日期**：2026-10-19

---

## 一、结论

| 验收项 | 结果 |
|---|---|
| ① `images/mingzuo.zip`（189 KB）从 `dist/` 剔除 | ✅ 已剔除（先隔离备份，SHA256 校验一致） |
| ② 顺带扫 `dist/` 是否还有其他 `.zip` / `.psd` / 备份残留 | ✅ 全量扫描（38k 文件）：**只有这 1 个** |
| ③ 不再做授权追溯 | ✅ 未做；只做了「来源定位」以判断**会不会复发** |

**额外的关键发现（超出派单字面要求，但决定了修复是否有意义）**：
> 该文件来自原始发行包 `PKRC.zip`，而 **E-5（A5-01b）会从同一个包重新并资产**
> ⇒ 只删一次等于没删。故已在 B-9 的合并管线里加**打包残留过滤**，让修复不被下一次发布抹掉。

---

## 二、扫描结果（全量，不是抽样）

扫 `game/server/dist`（38,062 文件 / 756.9 MB）与 `game/server/dist.modder-backup-20261016`，
按 `\.(zip|rar|7z|psd|bak|old|orig|tmp|swp)$` 匹配：

| 根 | 命中 |
|---|---|
| `game/server/dist` | **1 个**：`images/mingzuo.zip`（193,753 B） |
| `game/server/dist.modder-backup-20261016` | **0 个** |

用户可见的构建产物里没有第二处垃圾。

---

## 三、根因：作者把美术交付的压缩包解压后忘了删原件

```text
PKRC.zip（D:\Work\Pokemon\PKRC.zip，777 MB，原始发行包）
└── PKRC/server/dist/images/
    ├── mingzuo/            ← 7 张 PNG（chant / cleanse / flame / guard / hat / vigor / wish）
    └── mingzuo.zip         ← 193,753 B ← **就是这个**（打包原件，解压后没删）
```

**三条判定，逐条有据**：

| 判据 | 结论 |
|---|---|
| 它在原始发行包里**与解压后的目录并存** | ⇒ 是「解压后忘删」的典型痕迹，不是有意的运行时资产 |
| 在整个 `dist/` 的 `*.js / *.json / *.html / *.css / *.webmanifest` 里搜 `mingzuo` | **零命中** ⇒ 运行期不引用这个压缩包 |
| `dist.modder-backup-20261016`（代码部分）里没有它 | ⇒ 它跟着**资产**进来，不跟代码 |

> ⚠️ 同时发现：连 `images/mingzuo/` 那 7 张 PNG 在整个 bundle 里也**搜不到引用**。
> 但**派单只授权剔除 `.zip`**，PNG 属于资产目录的破坏性改动 ⇒ **本次不动，只登记**（见 §六）。

---

## 四、执行记录（可回退）

```bash
# ① 隔离备份（.build-tools/* 已被 .gitignore 忽略，不会入库）
mkdir -p .build-tools/quarantine
cp -p game/server/dist/images/mingzuo.zip .build-tools/quarantine/mingzuo.zip.20261019

# ② 校验备份与原件逐字节一致
sha256sum game/server/dist/images/mingzuo.zip .build-tools/quarantine/mingzuo.zip.20261019
#   35009f60cca04bb2dabb9507d5b526e9a015faa0d842422735a1024fea6acd86  （两者相同）

# ③ 剔除
rm -f game/server/dist/images/mingzuo.zip

# ④ 复验
node tools/asset-pipeline.cjs verify
```

复验结果：

```
—— 14 类中 14 类就位
✅ 无打包残留（.zip/.psd/.bak/…）
❌ 发现 18 个零字节文件（拷贝/解包事故的痕迹）
```

> 14 类**仍全部就位**（剔除没伤到任何资源类）；剩余的 ❌ 是**既有挂账项**
> （18 个零字节空壳文件，第一阶段已登记「运行时无害，清理需授权」），**与本次无关**。

**三重可回退**：① `.build-tools/quarantine/` 有逐字节备份；② 原始 `PKRC.zip` 里本来就有；
③ `dist/` 是构建产物，可用 B-9 管线重新组装。

---

## 五、防复发：在合并管线加残留过滤（本任务的核心价值）

### 5.1 为什么必须做

E-5（A5-01b）的验收是「8 类资源全部到位」，其资产来源就是**同一个发行包**。
若只删一次，下一次 `merge` / `publish` 会把这个 189 KB 的 zip 原样带回来 ——
**这种情况下「清理」只是表演**。

### 5.2 实现（`tools/asset-pipeline.cjs`）

新增三个导出：

| 名字 | 作用 |
|---|---|
| `PACKAGING_RESIDUE_RE` | `/\.(zip\|rar\|7z\|psd\|bak\|old\|orig\|tmp\|swp)$/i` |
| `findResidue(root)` | 递归找残留，返回排序后的相对路径 |
| `pruneResidue(root, logFn)` | 删除并**逐个记日志**（不静默） |

挂接点：

| 位置 | 行为 |
|---|---|
| `runMergePlan(pre, { pruneResidue: true })` | 合并落盘后剔除残留。**显式 opt-in**，不做隐式删除 |
| `asset-pipeline.cjs merge`（CLI） | 默认剔除；`--keep-residue` 关闭 |
| `release.cjs publish` | 传 `pruneResidue: true`（发布产物必须干净） |
| `verifyDist()` | 新增 `r.residue`，在 `[5/6]` 里**告警但不计入 `failures`** |

**为什么 verify 只告警不判失败**：残留是整洁性问题，不是功能问题。
做成失败项会让「发布门禁」因为一个 189KB 的 zip 而拦下一次正常发布 —— 那是错的优先级。
但必须让它**可见**，否则「校验通过」会掩盖一堆垃圾文件。

---

## 六、遗留与建议（如实）

1. **`images/mingzuo/` 的 7 张 PNG 同样零引用**（219 KB），但**派单未授权，本次不动**。
   建议：由所有者确认后一次性清理（同属「作者交付残留」类）。
   **注意**：这是**资产目录**改动，按项目纪律需授权 —— 我不单方面做。
2. **残留过滤只覆盖后缀黑名单**。若将来出现「解压后遗留的目录」（如 `mingzuo/` 这种
   无人引用的素材目录），黑名单识别不到 —— 那需要「引用可达性」分析，成本高且易误判，
   当前不做（`verify` 的 `refs` 只覆盖 `index.html` / `manifest.webmanifest` 的字面量引用）。
3. **`.zip` 里 189 KB 的隔离备份留在 `.build-tools/quarantine/`**（gitignored）。
   确认无需回退后可自行删除。
4. **本次改动顺带影响 `merge` 的默认行为**（默认剔除残留）。
   若某次确实需要把 `.zip` 放进 dist，用 `--keep-residue`。已写进 verify 的提示文案。

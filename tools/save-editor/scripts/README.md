# 存档修改器 · 数据表生成与校验脚本

本目录的脚本为 `../save-editor.html` 生成 / 校验 `../data/` 下的数据表。
除特别说明外，均应在**项目根目录**下用 Node（`node scripts/xxx.cjs`）或 Python 3 运行。

## 目录约定

- 数据表输入：`../data/`（与 `save-editor.html` 的 `<script src="data/...">` 一一对应）
- 历史原始备份：`../backups/original/`
- 游戏产物：`../../game/server/dist/`（需完整副本，含 `assets/` 与 `locales/`）

## 重新生成数据表（改版更新后）

```bash
# 在项目根目录执行（纯标准库，可重复运行）
python tools/save-editor/scripts/gen-from-dist.py
```

读取 `game/server/dist` 中的枚举与文案，重新生成 `tools/save-editor/data/` 下的数据表。

## 脚本分类

### 数据表生成（依赖游戏产物，需完整副本）

| 脚本 | 产出 | 说明 |
| --- | --- | --- |
| `gen-from-dist.py` | `data/*.js` | 主生成器：从 `game/server/dist` 逆向生成宝可梦 / 特性 / 技能 / 形态等数据表 |
| `gen-name-mappings.cjs` | `data/*-names.js` | 名称映射表 |
| `gen-species-abilities.cjs` | `data/species-abilities.js` | 宝可梦-特性对应表 |
| `gen-move-info.cjs` | `data/move-info.js` | 技能详情表 |
| `gen-modifier-*.cjs` | `data/modifier-*.js` | 修改器（Modifier）名称 / 分类 / 描述 / 展开表 |

### 校验与调试（只读，不改数据）

| 脚本 | 用途 |
| --- | --- |
| `verify-classes.cjs` | 校验 HTML 引用的类名与 `data/modifier-classes.js` 一致 |
| `verify-mappings.cjs` | 校验名称映射覆盖度 |
| `inspect-save.cjs` / `inspect-save2.cjs` | 解析 .prsv 存档结构（调试用） |
| `dump-pokemon.cjs` | 导出宝可梦数据快照 |
| `test-modifier-fix.cjs` / `test-soul-dew-fix.cjs` | 修改器逻辑回归测试 |

### 一次性维护脚本（历史遗产，保留备查）

| 脚本 | 说明 |
| --- | --- |
| `add-fake-species.cjs` | 追加虚构宝可梦条目 |
| `add-fused-pokemon-console.js` / `add-fused-pokemon-online-console.js` | 融合宝可梦控制台注入 |
| `gen-modifier-classes-v2.cjs` | modifier-classes 的第二版生成器（已被 gen-from-dist.py 取代） |

> 部分早期脚本（`gen-modifier-*.cjs` 等）引用上游 pokerogue 源码目录（`../src`、
> `../dist/locales/zh-Hans`），这些路径在本发行版中不存在——它们是从官方源码仓库
> 生成数据表的历史遗产，仅在使用上游源码树时才有意义；日常重新生成请用
> `gen-from-dist.py`。

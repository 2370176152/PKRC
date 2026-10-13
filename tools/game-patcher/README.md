# 游戏补丁工具（patch-game.py）

本工程**不含 TypeScript 源码**，所有魔改都直接作用于 Vite 构建产物
（`game/server/dist/assets/*.js`）。本工具用「精确字符串替换」实施补丁，
自带备份 / 撤销 / 状态查询 / 语法校验。

## 用法

在项目根目录下执行：

```bash
python tools/game-patcher/patch-game.py list        # 列出全部补丁及当前状态
python tools/game-patcher/patch-game.py apply       # 应用全部（已应用的会跳过）
python tools/game-patcher/patch-game.py apply <id>  # 只应用某一条
python tools/game-patcher/patch-game.py revert      # 从 backup/*.orig 还原全部
python tools/game-patcher/patch-game.py verify      # node --check 语法校验被改文件
```

- `backup/` 下的 `*.orig` 是**被改文件的原始版本**，首次 apply 时自动生成、之后永不覆盖，
  是 revert 的唯一依据，请勿删除。
- 补丁只对**精确匹配**生效：`old` 字符串必须在目标文件中恰好出现一次，
  否则该补丁报 `UNKNOWN` 并跳过（不会误改）。

## 维护：新增 / 调整补丁

编辑本文件顶部的 `PATCHES` 列表，每条补丁的字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 唯一标识（小写连字符），`apply <id>` 按此指定 |
| `file` | 相对项目根的路径，如 `game/server/dist/assets/loading-scene-By2k7Qfx.js` |
| `desc` | 人类可读的改动说明 |
| `old` | 被替换的原文（必须在文件中唯一） |
| `new` | 替换后的文本 |

调整既有补丁（例如改倍率）时，先 `revert` 再改 `PATCHES` 再 `apply`：
工具会先从 `.orig` 还原文件，再套用新值，不会叠加。

改版游戏更新（chunk 哈希变化）后的迁移方法：用新文件的对应片段更新各补丁的
`old` / `new`，并同步替换 `backup/*.orig` 为新原始文件。

## 当前补丁清单（7 条）

| id | 目标文件 | 效果 |
| --- | --- | --- |
| `tera-starstorm-type` | loading-scene | 晶光星群一律按星晶属性结算 |
| `tera-starstorm-target` | loading-scene | 晶光星群无条件命中全体 |
| `stellar-multiplier-fixed` | loading-scene | 星晶倍率恒 2× |
| `pt-save-import-allow` | index | 放行 PT 存档导入 |
| `pt-save-import-gamemode-literal` | index | 移动端模式判定 6 → 10 |
| `tera-move-category-attr` | loading-scene | 太晶招式类别去太晶化条件 |
| `nihil-light-category` | loading-scene | 归无之光属性 龙 → CS |

逐条补丁的技术细节（代码位置、影响面分析）见 [../../docs/patch-notes.md](../../docs/patch-notes.md)。

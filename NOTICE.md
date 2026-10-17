# NOTICE

## 上游项目

本项目基于开源项目 [pagefaultgames/pokerogue](https://github.com/pagefaultgames/pokerogue)，
继承其 **GNU Affero General Public License v3.0**（见 [LICENSE](LICENSE)）。

游戏构建产物（`game/server/dist/`）由上游 TypeScript 源码经 Vite 构建得到，
本仓库中的补丁（`tools/game-patcher/patch-game.py`）与文档为发行版整理过程中新增。

## 宝可梦版权

「Pokémon」「宝可梦」及相关名称、角色形象为 Nintendo / Creatures Inc. / GAME FREAK inc. 的商标与版权。
本项目为非营利粉丝作品，与上述公司无任何关联；如权利人认为不妥，请联系仓库所有者处理。

## 汉化与打包

- 汉化整合与离线打包：B 站「黑咖啡和冰月亮」
- UI 套件：「呆猫」

## ⚠️ 授权未确认的第三方素材

以下素材由**原发行版（魔改者）新增**，**本仓库无法追溯其内容来源与授权状态**。
在授权确认前，**请勿将含该素材的发行包用于对外分发**（自用 / 小范围共享不在此限）。

| 路径 | 体积 | 用途 | 来源状态 |
|---|---:|---|---|
| `game/server/dist/images/mingzuo/` | ~212 KB | 「命之座」系统图标（chant / cleanse / flame / guard / hat / vigor / wish 等） | ❓ **未确认** |
| `game/server/dist/images/p5x-buffs/` | 待清点 | P5X 状态图标 | ❓ **未确认** |
| `game/server/dist/images/events/` | 待清点 | 活动图（万圣节 2024 / Pokémon Day 2025 等） | ❓ 部分源自上游，需核 |
| `game/server/dist/images/cg/` | 待清点 | 通关 CG（`end_f` / `end_m`） | ❓ **未确认** |
| `game/server/dist/images/character/` | 待清点 | 劲敌立绘 | ❓ **未确认** |

> **清点与处置**：由第五阶段 **B-16** 完成逐项清点（路径 / 体积 / 来源状态 / 处置），
> 结果将回填本表。已知待剔除项：`images/mingzuo.zip`（189 KB 遗留打包文件，不应出现在构建产物中）。

## 已知功能缺口

本改版采用「产物 → 源码」重建方式，部分魔改功能尚未完全迁移。
**已知缺口的用户可见清单**见 [`docs/sourcemigration/已知功能缺口-用户版.md`](docs/sourcemigration/已知功能缺口-用户版.md)。

## 整理说明（2026-10）

本仓库由原发行版（根目录平铺、中文目录名）整理为结构化布局：
游戏主体 → `game/`、工具 → `tools/`、共享资源 → `shared/`、文档 → `docs/`，
二进制资产（图片 / 音频 / 字体 / Electron 外壳 / Node 运行时）不入库，
放置位置见 [README.md](README.md)「组装指南」。

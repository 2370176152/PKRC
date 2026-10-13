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

## 整理说明（2026-10）

本仓库由原发行版（根目录平铺、中文目录名）整理为结构化布局：
游戏主体 → `game/`、工具 → `tools/`、共享资源 → `shared/`、文档 → `docs/`，
二进制资产（图片 / 音频 / 字体 / Electron 外壳 / Node 运行时）不入库，
放置位置见 [README.md](README.md)「组装指南」。

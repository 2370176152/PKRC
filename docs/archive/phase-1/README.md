# 第一阶段归档 · 索引

> **归档对象**：PKRC 改造 · 第一阶段「源码化奠基」
> **归档日期**：2026-10-14
> **代码快照**：分支 `sourcemigration` @ `55c261f`（11 个提交）
> **状态**：✅ **已归档**（出口判据全部达成，1 项遗留转交第二阶段）

---

## 一、为什么归档

第一阶段的目标是**把"产物即源码"的不可维护状态，换成"有版本控制 + 可追溯魔改地图"的可维护基线**。

该目标已达成，且第二阶段的输入（魔改点清单、公共底座、角色供料）全部就绪。为避免阶段边界模糊、交付物被后续改动覆盖，本阶段所有产出**冻结归档**。

---

## 二、本目录内容

| 文件 | 说明 |
|---|---|
| `README.md` | 本索引（归档说明 + 交付物清单 + 出口判据） |
| `PHASE-1-归档报告.md` | **主报告**：交付成果汇总 + 变更记录 + 里程碑完成状态 + 风险处置 |
| `manifest.json` | 机读清单（提交记录 + 交付物 + 里程碑，供工具消费） |

---

## 三、交付物清单（本阶段冻结）

### 3.1 源码化主线（全栈）

| 交付物 | 路径 | 规模 |
|---|---|---|
| A0 上游定位报告 | `docs/sourcemigration/A0-上游定位报告.md` | 29 KB |
| A1 构建复现报告 | `docs/sourcemigration/A1-构建复现报告.md` | — |
| A2 魔改点提取报告 | `docs/sourcemigration/A2-魔改点提取报告.md` | — |
| A2 魔改点清单 | `docs/sourcemigration/A2-魔改点清单.md` | 11 系统说明 |
| A3 魔改迁移报告 | `docs/sourcemigration/A3-魔改迁移报告.md` | — |
| **命座框架（公共底座）** | `docs/sourcemigration/A3-migration/src/data/systems/constellation-framework.ts` | 444 行 |
| **NIANLI 样板系统** | `docs/sourcemigration/A3-migration/src/data/systems/nianli-system.ts` | 494 行 |
| **枚举扩展** | `docs/sourcemigration/A3-migration/src/enums/extensions.ts` | 96 行 |
| 类名→上游文件映射 | `docs/sourcemigration/classname-map.{json,txt}` | 2,571 类 / 1,347 命中 |
| 中文锚点数据 | `docs/sourcemigration/a2-cn-anchors.json` | 3,086 锚点 |
| 类名四分类数据 | `docs/sourcemigration/a2-classify.json` | 297 类 |

### 3.2 角色供料（前端 / UI / 后端）

| 角色 | 交付物 | 路径 | 实测证据 |
|---|---|---|---|
| 前端 | pointerdown 清点表 | `docs/delegation/10-前端-pointerdown清点表.md` | 55 处 / 64 UiMode |
| 前端 | 手势解析器原型 | `tools/input-layer/gesture-resolver.js` | **38/38 测试通过** |
| 前端 | 供料执行报告 | `docs/delegation/11-前端-A0并行供料执行报告.md` | — |
| UI | 字号映射表 | `docs/delegation/11-UI设计师-字号映射表.md` | 119 次 / 27 种 |
| UI | 文案清点表 | `docs/delegation/13-UI-文案清点表.md` | 2,440 处 |
| UI | 视觉规范 | `docs/visual-spec.md` | 7 级 Token 体系 |
| 后端 | 服务层重构 | `game/server/server.cjs` + `logger.cjs` | — |
| 后端 | 服务层测试 | `game/server/test-server.cjs` | **35/35 通过** |
| 后端 | 技术栈决策 ADR | `docs/tech-stack-decision.md` | D1–D10 |
| 后端 | 资产清点工具 | `tools/inventory-assets.cjs` | 只读可复现 |

### 3.3 管理与协作

| 交付物 | 路径 |
|---|---|
| 四角色派单与协作契约 | `docs/delegation/00` ~ `04` |
| v2 任务看板 | `docs/delegation/05-v2-任务看板.md` |
| v2 源码化优先重构方案 | `docs/delegation/08-v2源码化优先-重构方案.md` |
| 并行工作清单 | `docs/delegation/09-并行工作清单.md` |
| 整体进度报告（审计） | `docs/delegation/14-整体进度报告.md` |

---

## 四、阶段出口判据（逐条核验）

| # | 出口判据 | 结果 | 证据 |
|---|---|---|---|
| E-1 | 上游版本可锁定 | ✅ | V1.11.22 / 基线 `90df65097b6d`（2026-06-08） |
| E-2 | 构建链可复现 | ✅ | Node 24.9.0 + pnpm 10.33.2 |
| E-3 | 魔改点清单齐全 | ✅ | 3,086 锚点 / 297 类 / 11 系统 |
| E-4 | **魔改点含上游文件映射**（原 R-2） | ✅ | `classname-map.json` 1,347 类命中 |
| E-5 | 公共底座已落地 | ✅ | 命座框架 14 函数 |
| E-6 | 样板系统端到端跑通 | ✅ | NIANLI 30 函数，tsc 零错误 |
| E-7 | 三角色供料完成 | ✅ | 前端 38/38、后端 35/35、UI 三表 |
| E-8 | **版本控制建立**（原 R-1） | ✅ | 11 提交 / 2,203 文件 / 分支 `sourcemigration` |
| E-9 | 敏感信息清理 | ✅ | 7 类本机痕迹清零 |

**结论**：**9/9 达成** → 阶段可以正式关闭。

> ⚠️ **唯一遗留**：代码推送因网络链路问题未完成（见主报告 §五）。**该遗留不阻塞第二阶段开工**（全栈在本地继续工作）。

---

## 五、下一步

第二阶段派单见 **`docs/delegation/15-第二阶段任务分发.md`**。

- 阶段目标：完成 A3 剩余 10 系统迁移 → A4 等价性验证 → A5 产物切换（**达成 M3 / M4 / M5**）
- 周期：2026-10-14 ～ 2026-10-27（10 个工作日）

---

> **归档责任**：项目所有者
> **归档不变量**：本目录内文件一经归档不再修改；后续变更以新版本文件另存。

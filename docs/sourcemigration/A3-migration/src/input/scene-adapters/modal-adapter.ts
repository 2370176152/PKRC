/**
 * modal-adapter.ts —— 场景适配器：模态族（上游**已有** pointerdown，纳入注册表即可）
 * ---------------------------------------------------------------------------
 * 归属：前端 S6-4（场景适配）｜ 来源：F-8（接口先定，实现后填）
 * 覆盖矩阵：F-4 §一 第 13 行「模态 / 表单 / 管理员 / 登录」（v1 矩阵未列，F-4 补录）
 * 承接清单：F-7 §2.1（上游已有 pointerdown 的 6 文件）
 * 锚点树  ：90df65097b6d（v1.11.22）｜ 定位：src/input/scene-adapters/modal-adapter.ts
 *
 * ✅ 本场景是 12 场景中**唯一无需新建交互**的一类：
 *    上游已有 canvas 层 pointerdown（modal-ui-handler.ts:138 / form-modal-ui-handler.ts:137,144 /
 *    admin-ui-handler.ts:210 / login-register-info-container-ui-handler.ts:104,108,112 /
 *    oauth-providers-ui-handler.ts:94,104）⇒ S6 **只纳入统一注册表**，不重写、不改造。
 *
 * 状态：**桩（stub）** —— 实现待 M5 解锁后由 S6-4 填充（含「纳入注册表」）。
 * ---------------------------------------------------------------------------
 * @module input/scene-adapters/modal
 */

import { UiMode } from "#enums/ui-mode";
import type { InteractionSpec, SceneAdapter } from "../types.js";

export class ModalAdapter implements SceneAdapter {
  readonly matrixRow = 13;
  readonly label = "模态 / 表单 / 管理员 / 登录（上游已有，纳入注册表）";
  readonly modes = [
    UiMode.MESSAGE,
    UiMode.CONFIRM,
    UiMode.ADMIN,
    UiMode.LOGIN_OR_REGISTER,
    UiMode.LOGIN_FORM,
    UiMode.REGISTRATION_FORM,
    UiMode.CHANGE_PASSWORD_FORM,
    UiMode.SESSION_RELOAD,
    UiMode.UNAVAILABLE,
  ] as const;

  /** 归一版 `pointerReady()`（F-7 §3.4）；模态族可见即活 */
  isActive(): boolean {
    // TODO(S6-4): 复用上游既有可见性判定
    return false;
  }

  /** 本场景的声明式交互条目（上游已有实现 → 纳入注册表） */
  specs(): InteractionSpec[] {
    // TODO(S6-4): 把上游既有 pointerdown 纳入统一注册表
    //   modal 按钮 → {kind:"custom", fn:() => buttonActions[i]()}   （modal-ui-handler.ts:138）
    //   表单确认   → {kind:"button", button:Button.ACTION}           （form-modal-ui-handler.ts:137/144）
    //   管理员     → {kind:"custom", fn}                             （admin-ui-handler.ts:210）
    //   登录/OAuth → {kind:"custom", fn}                             （login-*/oauth-*）
    return [];
  }
}

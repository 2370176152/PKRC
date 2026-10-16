/**
 * gesture-resolver.ts —— 手势判定纯逻辑层（S6 输入层）
 * ---------------------------------------------------------------------------
 * 归属：前端 S6（v2 看板）｜ 来源：v1 派单 02 §4.2 / 09 并行清单 §2.3（F-3）
 * 形态：F-6（JS → TS，**加类型、零逻辑改动**）｜ 原型：tools/input-layer/gesture-resolver.js
 *
 * 文件头 5 要素：
 *   ① 系统名    ：输入层 · 手势判定纯逻辑（click / drag / longpress / wheel）
 *   ② 来源      ：**新写**（非产物迁移 —— 无对应产物 chunk / 无压缩符号可对照）
 *   ③ 逆向方式  ：不适用（本文件非从产物逆向，是 S6 新增源码）
 *   ④ 锚点树    ：.build-tools/tarball-src/pokerogue-90df65097b6df76f713e6bd108afa84499e8b993（v1.11.22）
 *   ⑤ 定位      ：src/input/gesture-resolver.ts
 *
 * 设计约束（必须遵守）：
 *   1. **零 Phaser / DOM 依赖** —— 本文件不 import 任何 Phaser / DOM 模块，
 *      可在 Node 中直接单测（v1 §4.2 "要求"）。
 *   2. **纯函数优先** —— 所有判定可脱离运行时状态单测；仅 GestureResolver
 *      保留最小内部状态（按下点、时间戳），且状态可被 reset() 清空。
 *   3. **配置驱动** —— 所有阈值来自 input-config.json 的 gesture 段，
 *      不在代码里硬编码（v1 §二 原则 4）。
 *
 * 调用关系：
 *   pointer-manager.ts（原生事件总控）
 *        ↓ 传入归一化后的 PointerSample
 *   gesture-resolver.ts（本文件：判定 click / drag / longpress）
 *        ↓ 产出 GestureResult
 *   input-arbiter.ts（同帧去重 + 设备仲裁）
 *        ↓
 *   legacy-bridge.ts（语义 → Button）
 * ---------------------------------------------------------------------------
 * 注：本文件**不需要** `TODO(接入锚点 90df65097b6d)` 区块 ——
 *     零外部依赖，不引用任何上游符号，接入锚点（A4-00）时可直接落位。
 * @module input/gesture-resolver
 */

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

/** 手势配置（与 input-config.json 的 gesture 段一一对应） */
export interface GestureConfig {
  /** 视为"点击"的最大按下时长（ms） */
  clickMaxDurationMs: number;
  /** 视为"拖拽"的最小位移（px） */
  dragThresholdPx: number;
  /** 连点防抖窗口（ms），窗口内二次点击被吸收 */
  doubleClickDebounceMs: number;
  /** 长按判定阈值（ms） */
  longPressMs: number;
  /** 滚轮节流窗口（ms） */
  wheelThrottleMs: number;
  /** 是否归一化 wheel 的 deltaMode */
  wheelDeltaNormalize: boolean;
}

/** 手势类型 */
export type GestureType = "click" | "drag" | "longpress" | "none";

/**
 * 指针采样。
 *
 * `downTime` / `upTime` 为可选：pointerdown 采样带 `downTime`，pointerup 采样带 `upTime`，
 * 二者共用同一结构（与原型 JS 一致，迁移时不拆分类型）。
 */
export interface PointerSample {
  /** Pointer id（多指/多设备区分） */
  readonly id: number;
  /** 世界坐标 x（**不是** CSS 像素，v1 §4.1） */
  readonly x: number;
  /** 世界坐标 y */
  readonly y: number;
  /** 按钮：0=左 1=中 2=右 */
  readonly button: MouseButtonValue;
  /** 是否触摸来源（用于滑动/长按的差异化策略） */
  readonly wasTouch: boolean;
  /** 按下时刻（performance.now() 口径；pointerdown 采样专有） */
  readonly downTime?: number;
  /** 抬起时刻（点击判定时传入；pointerup 采样专有） */
  readonly upTime?: number;
}

/** 一次「按下 → 抬起」的手势判定结果 */
export interface GestureResult {
  readonly type: GestureType;
  /** 原始按钮（click / context 用；none 时为 -1） */
  readonly button: number;
  /** 按下到抬起时长 */
  readonly durationMs: number;
  /** 按下到抬起位移 */
  readonly distancePx: number;
}

/** 抬起时的可选参数 */
export interface PointerUpOptions {
  /** 白名单元素可跳过连点吸收 */
  readonly skipDebounce?: boolean;
}

/**
 * 滚轮事件的最小结构（刻意不引用 DOM `WheelEvent`，以保持零 DOM 依赖）。
 * 字段可选：`normalizeWheelDelta` 对空对象/缺字段有安全降级。
 */
export interface WheelEventLike {
  readonly deltaY?: number;
  readonly deltaMode?: number;
}

/** 滚轮节流器签名：传入当前时间戳，返回是否放行 */
export type WheelThrottle = (now: number) => boolean;

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

/** 默认配置（与 input-config.json 的 gesture 段一一对应） */
export const DEFAULT_GESTURE_CONFIG: Readonly<GestureConfig> = Object.freeze({
  /** 视为"点击"的最大按下时长（ms） */
  clickMaxDurationMs: 250,
  /** 视为"拖拽"的最小位移（px） */
  dragThresholdPx: 8,
  /** 连点防抖窗口（ms），窗口内二次点击被吸收 */
  doubleClickDebounceMs: 180,
  /** 长按判定阈值（ms） */
  longPressMs: 500,
  /** 滚轮节流窗口（ms） */
  wheelThrottleMs: 60,
  /** 是否归一化 wheel 的 deltaMode */
  wheelDeltaNormalize: true,
});

/** Phaser Pointer 的 input 按钮常量（与 PointerButtons 一致，避免依赖 Phaser） */
export const MOUSE_BUTTON = Object.freeze({
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2,
} as const);

/** 鼠标按钮取值类型（0=左 1=中 2=右） */
export type MouseButtonValue = (typeof MOUSE_BUTTON)[keyof typeof MOUSE_BUTTON];

/** wheel 事件的 deltaMode 常量（DOM_DELTA_*） */
export const WHEEL_DELTA_MODE = Object.freeze({
  PIXEL: 0,
  LINE: 1,
  PAGE: 2,
} as const);

/** wheel deltaMode 取值类型 */
export type WheelDeltaModeValue = (typeof WHEEL_DELTA_MODE)[keyof typeof WHEEL_DELTA_MODE];

/** 每"行"换算的像素数（浏览器默认行高约 16px，取 16 与主流实现一致） */
const PIXELS_PER_LINE = 16;
/** 每"页"换算的像素数（保守取值，用于 deltaMode=PAGE） */
const PIXELS_PER_PAGE = 800;

// ---------------------------------------------------------------------------
// 纯函数
// ---------------------------------------------------------------------------

/**
 * 计算两点欧氏距离。
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 合并用户配置与默认配置（仅取 gesture 段，缺失项回落默认）。
 */
export function normalizeConfig(userCfg?: Partial<GestureConfig>): GestureConfig {
  return { ...DEFAULT_GESTURE_CONFIG, ...(userCfg || {}) };
}

/**
 * 判定一次「按下 → 抬起」的手势类型。
 *
 * 判定优先级（v1 §4.2 表格）：
 *   1. 位移 > dragThresholdPx        → drag
 *   2. 时长 > longPressMs            → longpress
 *   3. 时长 > clickMaxDurationMs     → drag（降级：按住过久不算点击）
 *   4. 其余                          → click
 *
 * 注意：`button === MIDDLE` 一律返回 `none`（v1 §4.2 "中键忽略"）。
 */
export function resolveGesture(
  down: PointerSample | null | undefined,
  up: PointerSample | null | undefined,
  config?: Partial<GestureConfig>,
): GestureResult {
  const cfg = normalizeConfig(config);

  if (!down || !up) {
    return { type: "none", button: -1, durationMs: 0, distancePx: 0 };
  }
  if (down.button === MOUSE_BUTTON.MIDDLE) {
    return { type: "none", button: down.button, durationMs: 0, distancePx: 0 };
  }

  const durationMs = Math.max(0, (up.upTime ?? 0) - (down.downTime ?? 0));
  const distancePx = distance(down.x, down.y, up.x, up.y);

  if (distancePx > cfg.dragThresholdPx) {
    return { type: "drag", button: down.button, durationMs, distancePx };
  }
  if (durationMs > cfg.longPressMs) {
    return { type: "longpress", button: down.button, durationMs, distancePx };
  }
  if (durationMs > cfg.clickMaxDurationMs) {
    // 介于 clickMaxDuration 与 longPress 之间：按住过久，不视为点击
    return { type: "drag", button: down.button, durationMs, distancePx };
  }
  return { type: "click", button: down.button, durationMs, distancePx };
}

/**
 * 连点防抖判定。
 *
 * @returns true = 应被吸收（丢弃）
 */
export function shouldDebounce(
  lastClickAt: number | null | undefined,
  now: number,
  config?: Partial<GestureConfig>,
): boolean {
  const cfg = normalizeConfig(config);
  if (lastClickAt == null) return false;
  const delta = now - lastClickAt;
  // delta < 0 视为时钟回拨，不吸收（保守放行）
  if (delta < 0) return false;
  return delta < cfg.doubleClickDebounceMs;
}

/**
 * 归一化 wheel 事件 delta 为「逻辑步数」（±N）。
 *
 * 处理三件事：
 *   1. `deltaMode` 归一（LINE/PAGE → 像素）；
 *   2. 不同浏览器/设备的 delta 量级归一（取符号 + 步长）；
 *   3. 返回可直接喂给 scrollBy 的整数步。
 *
 * @returns 正 = 向下/向后，负 = 向上/向前，0 = 忽略
 */
export function normalizeWheelDelta(
  event: WheelEventLike | null | undefined,
  config?: Partial<GestureConfig>,
): number {
  const cfg = normalizeConfig(config);
  if (!event || typeof event.deltaY !== "number" || event.deltaY === 0) return 0;

  let delta = event.deltaY;

  if (cfg.wheelDeltaNormalize) {
    switch (event.deltaMode) {
      case WHEEL_DELTA_MODE.LINE:
        delta *= PIXELS_PER_LINE;
        break;
      case WHEEL_DELTA_MODE.PAGE:
        delta *= PIXELS_PER_PAGE;
        break;
      case WHEEL_DELTA_MODE.PIXEL:
      default:
        // 已是像素，无需换算
        break;
    }
  }

  // 归一为 ±1 步（UI 是列表翻页语义，不是像素滚动）
  return delta > 0 ? 1 : -1;
}

/**
 * 滚轮节流器（**纯状态**，不依赖定时器，便于测试与确定性）。
 *
 * 用法：
 *   const t = createWheelThrottle(cfg);
 *   if (t(now)) { ...scroll... }   // 返回 true 表示放行
 */
export function createWheelThrottle(config?: Partial<GestureConfig>): WheelThrottle {
  const cfg = normalizeConfig(config);
  let lastAt: number | null = null;
  return function allow(now: number): boolean {
    if (lastAt == null || now - lastAt >= cfg.wheelThrottleMs) {
      lastAt = now;
      return true;
    }
    return false;
  };
}

// ---------------------------------------------------------------------------
// 手势状态机（对外主入口）
// ---------------------------------------------------------------------------

/**
 * 手势状态机 —— 对外主入口。
 *
 * 负责在「pointerdown → pointermove → pointerup」序列中维护最小状态，
 * 并产出最终手势。**不持有任何 Phaser 引用**。
 *
 * 与 pointer-manager 的约定：
 *   - pointerDown(sample)   按下
 *   - pointerMove(sample)   移动（仅用于提前判定拖拽，可选）
 *   - pointerUp(sample)     抬起 → 返回 GestureResult
 *   - cancel()              pointerupoutside / blur / 失焦 → 复位
 */
export class GestureResolver {
  config: GestureConfig;
  downSample: PointerSample | null;
  lastClickAt: number | null;
  /** 是否已越过拖拽阈值（越过后再移动不再改变性质） */
  dragging: boolean;

  constructor(config?: Partial<GestureConfig>) {
    this.config = normalizeConfig(config);
    this.downSample = null;
    this.lastClickAt = null;
    this.dragging = false;
  }

  /**
   * 更新配置（热配置支持）。
   */
  setConfig(config?: Partial<GestureConfig>): void {
    this.config = normalizeConfig(config);
  }

  /**
   * pointerdown 采样。
   */
  pointerDown(sample: PointerSample): void {
    this.downSample = { ...sample, downTime: sample.downTime ?? 0 };
    this.dragging = false;
  }

  /**
   * pointermove 采样。越过阈值即标记拖拽（供 pointer-manager 提前切视觉态）。
   *
   * @returns 是否处于拖拽态
   */
  pointerMove(sample: PointerSample): boolean {
    if (!this.downSample) return false;
    if (this.dragging) return true;
    const d = distance(this.downSample.x, this.downSample.y, sample.x, sample.y);
    if (d > this.config.dragThresholdPx) {
      this.dragging = true;
    }
    return this.dragging;
  }

  /**
   * pointerup 采样 → 产出最终手势。
   *
   * @param opts skipDebounce：白名单元素可跳过连点吸收
   */
  pointerUp(sample: PointerSample, opts: PointerUpOptions = {}): GestureResult {
    if (!this.downSample) {
      return { type: "none", button: -1, durationMs: 0, distancePx: 0 };
    }
    const down = this.downSample;
    const result = resolveGesture(down, sample, this.config);
    this.downSample = null;
    this.dragging = false;

    if (result.type === "click") {
      const now = sample.upTime ?? 0;
      if (!opts.skipDebounce && shouldDebounce(this.lastClickAt, now, this.config)) {
        // 被连点防抖吸收
        return { ...result, type: "none" };
      }
      this.lastClickAt = now;
    }
    return result;
  }

  /**
   * 复位（pointerupoutside / window.blur / visibilitychange / Phaser BLUR）。
   * 依据 v1 §4.1「失焦复位」要求。
   */
  cancel(): void {
    this.downSample = null;
    this.dragging = false;
  }

  /** 完整复位（含连点窗口），用于 config 切换等场景 */
  reset(): void {
    this.cancel();
    this.lastClickAt = null;
  }
}

export default GestureResolver;

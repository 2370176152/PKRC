/**
 * input-arbiter.js —— 键鼠共存仲裁纯逻辑层
 * ---------------------------------------------------------------------------
 * 归属：前端 S6（v2 看板 S6-3）｜ 来源：派单 15 §三 F-3 ｜ v1 派单 02 §4.3
 *
 * 设计约束（与 gesture-resolver.js 一致）：
 *   1. **零 Phaser 依赖** —— 不得 import Phaser / DOM，可在 Node 直接单测。
 *   2. **纯逻辑优先** —— 所有判定可脱离运行时单测。
 *   3. **配置驱动** —— 阈值来自 input-config.json 的 coexist 段。
 *
 * 目标架构位置（v2 源码化后）：
 *   src/input/input-arbiter.ts
 *
 * 四类职责（v1 §4.3 表格）：
 *   ① 设备标记：维护 lastDevice（keyboard / mouse / touch / gamepad）
 *   ② 同帧去重：(button, frameId) 重复即丢弃
 *   ③ 切换冷却：键鼠切换有 switchDebounceMs 冷却
 *   ④ 键盘不被抢占：鼠标只在 down/up 成功配对后派发一次
 * ---------------------------------------------------------------------------
 * @module input-arbiter
 */

/** 输入设备类型（扩展上游 inputMethod：新增 "mouse"） */
export const DEVICE = Object.freeze({
  KEYBOARD: "keyboard",
  MOUSE: "mouse",
  TOUCH: "touch",
  GAMEPAD: "gamepad",
});

/** 默认配置（与 input-config.json 的 coexist 段对应） */
export const DEFAULT_ARBITER_CONFIG = Object.freeze({
  /** 键鼠切换冷却（ms） */
  switchDebounceMs: 120,
  /** 鼠标点击是否同步键盘光标（由 focus-coordinator 消费） */
  mouseActivatesFocusSync: true,
  /**
   * 键盘是否保留完全控制权。
   * true = 键盘「按住连发」期间，鼠标动作只更新 lastDevice、但不放行
   *        （避免鼠标抢掉键盘的按住连发语义，v1 §4.3 ④）。
   * 注意：鼠标**仍会**更新 lastDevice —— 它只是不抢「按住中」的键盘输入。
   */
  keyboardKeepsFullControl: true,
  /** 同帧去重是否启用 */
  sameFrameDedupe: true,
});

/**
 * @typedef {Object} ActionRequest
 * @property {string} device    设备类型（DEVICE 之一）
 * @property {number} button    Button 语义值
 * @property {number} frameId   当前帧号（scene.game.loop.frame 口径）
 * @property {number} [at]      时间戳（performance.now() 口径，用于切换冷却）
 * @property {string} [source]  来源标识（调试用，如 "party.slot.2"）
 */

/**
 * @typedef {Object} ArbiterDecision
 * @property {boolean} accept   是否放行
 * @property {string} reason    放行/拒绝原因（accepted / frame-dup / switch-cooldown / disabled）
 */

/**
 * 合并用户配置与默认配置（仅取 coexist 段）。
 * @param {Partial<typeof DEFAULT_ARBITER_CONFIG>} [userCfg]
 * @returns {typeof DEFAULT_ARBITER_CONFIG}
 */
export function normalizeArbiterConfig(userCfg) {
  return { ...DEFAULT_ARBITER_CONFIG, ...(userCfg || {}) };
}

/**
 * 同帧去重器 —— 纯函数式，无内部状态，便于在 reducer 中使用。
 *
 * 规则：同一帧内，相同 `(device, button)` 只允许一次。
 *
 * @param {ActionRequest} req
 * @param {Set<string>} seenSet  已派发集合（形如 "mouse:0@12345"）
 * @returns {boolean} true = 是重复（应丢弃）
 */
export function isSameFrameDuplicate(req, seenSet) {
  const key = `${req.device}:${req.button}@${req.frameId}`;
  return seenSet.has(key);
}

/**
 * 生成同帧去重键。
 * @param {ActionRequest} req
 * @returns {string}
 */
export function dedupeKey(req) {
  return `${req.device}:${req.button}@${req.frameId}`;
}

/**
 * 判定是否处于「切换冷却」窗口。
 *
 * @param {number|null|undefined} lastOtherDeviceAt 上一次**其他设备**生效的时间戳
 * @param {number} now                              本次时间戳
 * @param {Partial<typeof DEFAULT_ARBITER_CONFIG>} [config]
 * @returns {boolean} true = 处于冷却中（应拒绝）
 */
export function isInSwitchCooldown(lastOtherDeviceAt, now, config) {
  const cfg = normalizeArbiterConfig(config);
  if (lastOtherDeviceAt == null) return false;
  const delta = now - lastOtherDeviceAt;
  // 时钟回拨：保守放行
  if (delta < 0) return false;
  return delta < cfg.switchDebounceMs;
}

/**
 * InputArbiter —— 仲裁状态机主入口。
 *
 * 与 pointer-manager / legacy-bridge 的调用约定：
 *   const arbiter = new InputArbiter(config);
 *   const { accept, reason } = arbiter.submit({ device, button, frameId, at });
 *   if (accept) legacyBridge.dispatch(button);
 *   arbiter.endFrame();   // 每帧末调用，清空同帧集合
 */
export class InputArbiter {
  /**
   * @param {Partial<typeof DEFAULT_ARBITER_CONFIG>} [config]
   * @param {{ enabled?: boolean }} [opts] enabled=false 时全部拒绝（兜底开关）
   */
  constructor(config, opts = {}) {
    this.config = normalizeArbiterConfig(config);
    this.enabled = opts.enabled !== false;
    /** @type {string} */
    this.lastDevice = DEVICE.KEYBOARD;
    /** @type {Set<string>} 当前帧已派发的键 */
    this.frameSeen = new Set();
    /** @type {number} 当前帧号 */
    this.currentFrame = -1;
    /** @type {number|null} 当前设备最近一次生效时间（切换冷却基准） */
    this.lastDeviceAt = null;
    /** @type {number|null} 最近一次设备切换时刻（诊断用） */
    this.lastSwitchAt = null;
    /** @type {number|null} 上一次任一设备生效时间 */
    this.lastAcceptedAt = null;
    /** 键盘是否处于按住状态（keyboardKeepsFullControl 用） */
    this.keyboardHeld = false;
  }

  /**
   * 热更新配置。
   * @param {Partial<typeof DEFAULT_ARBITER_CONFIG>} config
   */
  setConfig(config) {
    this.config = normalizeArbiterConfig(config);
  }

  /** 运行时开关（input-config.json: enabled） */
  setEnabled(enabled) {
    this.enabled = !!enabled;
  }

  /**
   * 提交一个动作请求，返回仲裁决定。
   *
   * @param {ActionRequest} req
   * @returns {ArbiterDecision}
   */
  submit(req) {
    if (!this.enabled) {
      return { accept: false, reason: "disabled" };
    }
    if (!req || !req.device) {
      return { accept: false, reason: "invalid" };
    }

    // 帧号变化 → 翻帧（自动 endFrame，防止调用方忘记）
    if (req.frameId !== this.currentFrame) {
      this.currentFrame = req.frameId;
      this.frameSeen.clear();
    }

    // ② 同帧去重
    if (this.config.sameFrameDedupe) {
      const key = dedupeKey(req);
      if (this.frameSeen.has(key)) {
        return { accept: false, reason: "frame-dup" };
      }
      this.frameSeen.add(key);
    }

    // ③ 跨设备切换冷却
    //    语义：与「上一次**不同设备**生效的时刻」比较。
    //    实现：跟踪上一次生效时使用的设备 lastDevice，以及它生效的时间 lastDeviceAt。
    const now = req.at ?? 0;
    const isOtherDevice = req.device !== this.lastDevice;
    if (isOtherDevice && isInSwitchCooldown(this.lastDeviceAt, now, this.config)) {
      // 冷却期内拒绝「其他设备」，但已放行的键不撤销
      return { accept: false, reason: "switch-cooldown" };
    }

    // ④ 键盘完全控制权：键盘「按住连发」期间，鼠标动作不放行
    //    （但仍更新 lastDevice —— 鼠标确实被使用了）
    if (this.config.keyboardKeepsFullControl && req.device === DEVICE.MOUSE && this.keyboardHeld) {
      return { accept: false, reason: "keyboard-held" };
    }

    // 更新设备标记：设备变化时记录切换时刻
    if (isOtherDevice) {
      this.lastSwitchAt = now;
    }
    this.lastDevice = req.device;
    this.lastDeviceAt = now;
    this.lastAcceptedAt = now;
    return { accept: true, reason: "accepted" };
  }

  /**
   * 标记键盘是否处于「按住」状态（由 UiInputs 的 input_down/input_up 驱动）。
   * 用途：keyboardKeepsFullControl=true 时，按住期间屏蔽鼠标动作。
   * @param {boolean} held
   */
  setKeyboardHeld(held) {
    this.keyboardHeld = !!held;
  }

  /**
   * 帧末调用：清空同帧集合。若调用方用 frameId 自动翻帧，此方法可选。
   */
  endFrame() {
    this.frameSeen.clear();
  }

  /**
   * 复位（失焦 / blur / visibilitychange）。
   */
  reset() {
    this.frameSeen.clear();
    this.lastDeviceAt = null;
    this.lastSwitchAt = null;
    this.lastAcceptedAt = null;
    this.currentFrame = -1;
    this.keyboardHeld = false;
    // lastDevice 保留：失焦不改变用户最后使用的设备
  }

  /**
   * 诊断快照（供 pkrc.debug）。
   * @returns {object}
   */
  snapshot() {
    return {
      enabled: this.enabled,
      lastDevice: this.lastDevice,
      currentFrame: this.currentFrame,
      frameSeenSize: this.frameSeen.size,
      lastAcceptedAt: this.lastAcceptedAt,
      lastDeviceAt: this.lastDeviceAt,
      lastSwitchAt: this.lastSwitchAt,
      keyboardHeld: this.keyboardHeld,
    };
  }
}

export default InputArbiter;

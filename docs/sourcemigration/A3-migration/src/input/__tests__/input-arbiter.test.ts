/**
 * input-arbiter.test.ts —— S6 输入层单元测试（键鼠仲裁）
 * ---------------------------------------------------------------------------
 * 运行：见 tools/input-layer/verify-ts.mjs（tsc 编译后 node 执行）
 * 迁移：F-6（JS → TS，**断言同构迁移**）｜ 原型：tools/input-layer/input-arbiter.test.js
 *
 * 无任何第三方依赖。
 * 覆盖：v1 派单 02 §4.3 四类职责 + 派单 15 §三 F-3 验收（≥15 项）
 * ---------------------------------------------------------------------------
 */

import {
  InputArbiter,
  DEVICE,
  DEFAULT_ARBITER_CONFIG,
  isSameFrameDuplicate,
  dedupeKey,
  isInSwitchCooldown,
  normalizeArbiterConfig,
  type ActionRequest,
} from "../input-arbiter.js";

// -------------------------- 极简测试框架 --------------------------
let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } catch (err) {
    failed++;
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    console.log(`      \x1b[31m${err instanceof Error ? err.message : String(err)}\x1b[0m`);
  }
}
function assertEqual(actual: unknown, expected: unknown, msg = ""): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${msg}\n      期望: ${e}\n      实际: ${a}`);
}
function assertTrue(cond: unknown, msg = "断言失败"): void {
  if (!cond) throw new Error(msg);
}

const mk = (o: Partial<ActionRequest> = {}): ActionRequest => ({ device: DEVICE.MOUSE, button: 0, frameId: 1, at: 0, ...o });

// ========================== 1. 同帧去重（②） ==========================
console.log("\n\x1b[1m[1] 同帧去重 —— (device,button,frame) 唯一（v1 §4.3 ②）\x1b[0m");

test("首次提交 → 放行", () => {
  const a = new InputArbiter();
  assertEqual(a.submit(mk({ frameId: 100 })).accept, true);
});

test("同帧同设备同按钮二次提交 → frame-dup 拒绝", () => {
  const a = new InputArbiter();
  a.submit(mk({ frameId: 100, button: 0 }));
  const r = a.submit(mk({ frameId: 100, button: 0 }));
  assertEqual(r.accept, false);
  assertEqual(r.reason, "frame-dup");
});

test("同帧不同按钮 → 均放行", () => {
  const a = new InputArbiter();
  assertEqual(a.submit(mk({ frameId: 100, button: 0 })).accept, true);
  assertEqual(a.submit(mk({ frameId: 100, button: 2 })).accept, true);
});

test("同帧不同设备 → 均放行（去重键含 device，且避开切换冷却）", () => {
  const a = new InputArbiter();
  assertEqual(a.submit(mk({ frameId: 100, device: DEVICE.KEYBOARD, button: 0, at: 1000 })).accept, true);
  assertEqual(a.submit(mk({ frameId: 100, device: DEVICE.MOUSE, button: 0, at: 2000 })).accept, true);
});

test("翻帧后同按钮 → 再次放行", () => {
  const a = new InputArbiter();
  a.submit(mk({ frameId: 100, button: 0 }));
  assertEqual(a.submit(mk({ frameId: 101, button: 0 })).accept, true);
});

test("endFrame() 显式清帧后 → 再次放行", () => {
  const a = new InputArbiter();
  a.submit(mk({ frameId: 100, button: 0 }));
  a.endFrame();
  assertEqual(a.submit(mk({ frameId: 100, button: 0 })).accept, true);
});

test("同帧去重可关闭（sameFrameDedupe=false）", () => {
  const a = new InputArbiter({ sameFrameDedupe: false });
  a.submit(mk({ frameId: 100, button: 0 }));
  assertEqual(a.submit(mk({ frameId: 100, button: 0 })).accept, true);
});

test("isSameFrameDuplicate / dedupeKey 纯函数", () => {
  const s = new Set<string>();
  const r = mk({ frameId: 7, button: 1, device: DEVICE.MOUSE });
  assertEqual(isSameFrameDuplicate(r, s), false);
  s.add(dedupeKey(r));
  assertEqual(isSameFrameDuplicate(r, s), true);
});

// ========================== 2. 跨设备切换冷却（③） ==========================
console.log("\n\x1b[1m[2] 切换冷却 —— switchDebounceMs 120（v1 §4.3 ③）\x1b[0m");

test("首次鼠标 → 放行，lastDevice=mouse", () => {
  const a = new InputArbiter();
  const r = a.submit(mk({ frameId: 1, device: DEVICE.MOUSE, at: 1000 }));
  assertEqual(r.accept, true);
  assertEqual(a.lastDevice, DEVICE.MOUSE);
});

test("键鼠快速切换（间隔 <120ms）→ 拒绝", () => {
  const a = new InputArbiter();
  a.submit(mk({ frameId: 1, device: DEVICE.KEYBOARD, button: 5, at: 1000 })); // 键盘建立基准
  const r = a.submit(mk({ frameId: 2, device: DEVICE.MOUSE, button: 0, at: 1050 })); // 50ms 后切鼠标
  assertEqual(r.accept, false);
  assertEqual(r.reason, "switch-cooldown");
});

test("键鼠切换间隔 ≥120ms → 放行", () => {
  const a = new InputArbiter();
  a.submit(mk({ frameId: 1, device: DEVICE.KEYBOARD, button: 5, at: 1000 }));
  const r = a.submit(mk({ frameId: 2, device: DEVICE.MOUSE, button: 0, at: 1120 }));
  assertEqual(r.accept, true);
});

test("冷却窗口边界：恰好 120ms → 放行", () => {
  const a = new InputArbiter();
  a.submit(mk({ frameId: 1, device: DEVICE.KEYBOARD, button: 5, at: 1000 }));
  assertEqual(a.submit(mk({ frameId: 2, device: DEVICE.MOUSE, button: 0, at: 1120 })).accept, true);
});

test("冷却窗口边界：119ms → 拒绝", () => {
  const a = new InputArbiter();
  a.submit(mk({ frameId: 1, device: DEVICE.KEYBOARD, button: 5, at: 1000 }));
  assertEqual(a.submit(mk({ frameId: 2, device: DEVICE.MOUSE, button: 0, at: 1119 })).accept, false);
});

test("同设备连续输入不受冷却影响", () => {
  const a = new InputArbiter();
  a.submit(mk({ frameId: 1, device: DEVICE.MOUSE, at: 1000 }));
  assertEqual(a.submit(mk({ frameId: 2, device: DEVICE.MOUSE, button: 1, at: 1001 })).accept, true);
});

test("isInSwitchCooldown 时钟回拨 → 放行", () => {
  assertEqual(isInSwitchCooldown(1000, 900), false);
});

// ========================== 3. 键盘不被抢占（④） ==========================
console.log("\n\x1b[1m[3] 键盘完全控制权 —— keyboardKeepsFullControl（v1 §4.3 ④）\x1b[0m");

test("键盘先输入 → lastDevice=keyboard", () => {
  const a = new InputArbiter();
  a.submit(mk({ frameId: 1, device: DEVICE.KEYBOARD, button: 5, at: 1000 }));
  assertEqual(a.lastDevice, DEVICE.KEYBOARD);
});

test("keyboardKeepsFullControl=true：键盘按住期间，鼠标动作不放行", () => {
  const a = new InputArbiter({ keyboardKeepsFullControl: true });
  a.submit(mk({ frameId: 1, device: DEVICE.KEYBOARD, button: 5, at: 1000 }));
  a.setKeyboardHeld(true); // 键盘按住中
  const r = a.submit(mk({ frameId: 2, device: DEVICE.MOUSE, button: 0, at: 2000 }));
  assertEqual(r.accept, false);
  assertEqual(r.reason, "keyboard-held");
});

test("keyboardKeepsFullControl=true：键盘松开后，鼠标动作恢复放行", () => {
  const a = new InputArbiter({ keyboardKeepsFullControl: true });
  a.submit(mk({ frameId: 1, device: DEVICE.KEYBOARD, button: 5, at: 1000 }));
  a.setKeyboardHeld(true);
  a.submit(mk({ frameId: 2, device: DEVICE.MOUSE, button: 0, at: 2000 })); // 拒绝
  a.setKeyboardHeld(false);
  assertEqual(a.submit(mk({ frameId: 3, device: DEVICE.MOUSE, button: 0, at: 2100 })).accept, true);
});

test("keyboardKeepsFullControl=true：鼠标仍更新 lastDevice（只是不抢按住中的键盘）", () => {
  const a = new InputArbiter({ keyboardKeepsFullControl: true });
  a.submit(mk({ frameId: 1, device: DEVICE.KEYBOARD, button: 5, at: 1000 }));
  a.submit(mk({ frameId: 2, device: DEVICE.MOUSE, button: 0, at: 2000 }));
  assertEqual(a.lastDevice, DEVICE.MOUSE, "鼠标实际被使用，lastDevice 应更新");
});

test("keyboardKeepsFullControl=false：键盘按住期间，鼠标动作仍放行", () => {
  const a = new InputArbiter({ keyboardKeepsFullControl: false });
  a.submit(mk({ frameId: 1, device: DEVICE.KEYBOARD, button: 5, at: 1000 }));
  a.setKeyboardHeld(true);
  assertEqual(a.submit(mk({ frameId: 2, device: DEVICE.MOUSE, button: 0, at: 2000 })).accept, true);
});

test("鼠标 → 触摸：正常切换设备（非 mouse 特例）", () => {
  const a = new InputArbiter();
  a.submit(mk({ frameId: 1, device: DEVICE.MOUSE, at: 1000 }));
  a.submit(mk({ frameId: 2, device: DEVICE.TOUCH, button: 0, at: 2000 }));
  assertEqual(a.lastDevice, DEVICE.TOUCH);
});

// ========================== 4. 兜底开关（enabled） ==========================
console.log("\n\x1b[1m[4] 兜底开关 —— enabled=false（验收 2-G）\x1b[0m");

test("enabled=false → 全部拒绝，reason=disabled", () => {
  const a = new InputArbiter({}, { enabled: false });
  const r = a.submit(mk({ frameId: 1 }));
  assertEqual(r.accept, false);
  assertEqual(r.reason, "disabled");
});

test("setEnabled(true) → 恢复放行（即刻回到原行为的能力）", () => {
  const a = new InputArbiter({}, { enabled: false });
  a.setEnabled(true);
  assertEqual(a.submit(mk({ frameId: 1 })).accept, true);
});

// ========================== 5. 复位与诊断 ==========================
console.log("\n\x1b[1m[5] 复位（失焦）与诊断快照（验收 2-E）\x1b[0m");

test("reset() 清空帧内状态与冷却基准", () => {
  const a = new InputArbiter();
  a.submit(mk({ frameId: 100, at: 1000 }));
  a.reset();
  assertEqual(a.frameSeen.size, 0);
  assertEqual(a.lastDeviceAt, null);
  assertEqual(a.currentFrame, -1);
});

test("reset() 后同帧同键可再次放行", () => {
  const a = new InputArbiter();
  a.submit(mk({ frameId: 100, button: 0, at: 1000 }));
  a.reset();
  assertEqual(a.submit(mk({ frameId: 100, button: 0, at: 2000 })).accept, true);
});

test("reset() 保留 lastDevice（失焦不改变设备身份）", () => {
  const a = new InputArbiter();
  a.submit(mk({ frameId: 1, device: DEVICE.MOUSE, at: 1000 }));
  a.reset();
  assertEqual(a.lastDevice, DEVICE.MOUSE);
});

test("snapshot() 返回诊断字段", () => {
  const a = new InputArbiter();
  a.submit(mk({ frameId: 42, device: DEVICE.MOUSE, at: 1000 }));
  const s = a.snapshot();
  assertEqual(s.lastDevice, DEVICE.MOUSE);
  assertEqual(s.currentFrame, 42);
  assertTrue(typeof s.frameSeenSize === "number");
});

// ========================== 6. 边界与鲁棒性 ==========================
console.log("\n\x1b[1m[6] 边界与鲁棒性\x1b[0m");

test("非法请求（缺 device）→ invalid 拒绝，不抛错", () => {
  const a = new InputArbiter();
  assertEqual(a.submit(null).reason, "invalid");
  assertEqual(a.submit({}).reason, "invalid");
});

test("缺 frameId → 不抛错", () => {
  const a = new InputArbiter();
  const r = a.submit({ device: DEVICE.MOUSE, button: 0 });
  assertEqual(r.accept, true);
});

test("配置缺省项回落默认值", () => {
  const cfg = normalizeArbiterConfig({ switchDebounceMs: 200 });
  assertEqual(cfg.switchDebounceMs, 200);
  assertEqual(cfg.sameFrameDedupe, DEFAULT_ARBITER_CONFIG.sameFrameDedupe);
});

test("热更新配置生效", () => {
  const a = new InputArbiter({ sameFrameDedupe: true });
  a.setConfig({ sameFrameDedupe: false });
  a.submit(mk({ frameId: 1, button: 0 }));
  assertEqual(a.submit(mk({ frameId: 1, button: 0 })).accept, true);
});

// ========================== 汇总 ==========================
console.log("\n" + "─".repeat(60));
if (failed === 0) {
  console.log(`\x1b[32m\x1b[1m全部通过：${passed} 项\x1b[0m`);
} else {
  console.log(`\x1b[31m\x1b[1m失败：${failed} 项，通过：${passed} 项\x1b[0m`);
  process.exitCode = 1;
}
console.log("─".repeat(60));

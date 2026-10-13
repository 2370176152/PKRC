/**
 * gesture-resolver.test.js —— F-3 单元测试
 * ---------------------------------------------------------------------------
 * 运行：node tools/input-layer/gesture-resolver.test.js
 * 无任何第三方依赖（不用 vitest/jest），保证在 A0 未完成、pnpm 未安装时也能跑。
 *
 * 覆盖：v1 派单 02 §4.2 判定表 + 09 并行清单 §2.3 的 5 个用例 + S2 验收 2-C/2-D
 * ---------------------------------------------------------------------------
 */

import {
  GestureResolver,
  resolveGesture,
  normalizeWheelDelta,
  shouldDebounce,
  createWheelThrottle,
  distance,
  MOUSE_BUTTON,
  WHEEL_DELTA_MODE,
} from "./gesture-resolver.js";

// -------------------------- 极简测试框架 --------------------------
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    console.log(`      \x1b[31m${err.message}\x1b[0m`);
  }
}

function assertEqual(actual, expected, msg = "") {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${msg}\n      期望: ${e}\n      实际: ${a}`);
  }
}

function assertTrue(cond, msg = "断言失败") {
  if (!cond) throw new Error(msg);
}

/** 构造按下采样 */
function mkDown({ id = 1, x = 0, y = 0, t = 0, button = MOUSE_BUTTON.LEFT, wasTouch = false } = {}) {
  return { id, x, y, downTime: t, button, wasTouch };
}
/** 构造抬起采样 */
function mkUp({ id = 1, x = 0, y = 0, t = 0, button = MOUSE_BUTTON.LEFT, wasTouch = false } = {}) {
  return { id, x, y, upTime: t, button, wasTouch };
}

// ========================== 1. resolveGesture ==========================
console.log("\n\x1b[1m[1] resolveGesture —— 点击 / 拖拽 / 长按判定（v1 §4.2 表格）\x1b[0m");

test("短按不移动 (100ms, 0px) → click", () => {
  const r = resolveGesture(mkDown({ t: 0 }), mkUp({ t: 100 }));
  assertEqual(r.type, "click", "短按应判定为 click");
});

test("短按微移 (100ms, 位移 5px < 阈值 8) → click", () => {
  const r = resolveGesture(mkDown({ x: 0, y: 0, t: 0 }), mkUp({ x: 3, y: 4, t: 100 })); // 3-4-5 直角三角形
  assertEqual(r.type, "click", "位移 5px 未越阈值应仍为 click");
  assertEqual(Math.round(r.distancePx), 5);
});

test("短按大移 (100ms, 位移 15px > 阈值 8) → drag", () => {
  const r = resolveGesture(mkDown({ x: 0, y: 0, t: 0 }), mkUp({ x: 15, y: 0, t: 100 }));
  assertEqual(r.type, "drag", "位移 15px 越过阈值应为 drag");
});

test("边界：位移恰好等于阈值 8px → click（不越界即 click）", () => {
  const r = resolveGesture(mkDown({ x: 0, y: 0, t: 0 }), mkUp({ x: 8, y: 0, t: 50 }));
  assertEqual(r.type, "click");
});

test("边界：位移 8.01px → drag", () => {
  const r = resolveGesture(mkDown({ x: 0, y: 0, t: 0 }), mkUp({ x: 8.01, y: 0, t: 50 }));
  assertEqual(r.type, "drag");
});

test("长按 (300ms, 0px) → 降级为 drag（按住过久不算点击）", () => {
  const r = resolveGesture(mkDown({ t: 0 }), mkUp({ t: 300 }));
  assertEqual(r.type, "drag", "300ms 未达 longPress 500 但超 click 250，应降级 drag");
});

test("长按 (600ms, 0px) → longpress", () => {
  const r = resolveGesture(mkDown({ t: 0 }), mkUp({ t: 600 }));
  assertEqual(r.type, "longpress");
});

test("边界：恰好 250ms → click（不越界）", () => {
  const r = resolveGesture(mkDown({ t: 0 }), mkUp({ t: 250 }));
  assertEqual(r.type, "click");
});

test("边界：恰好 500ms → drag（未越 longPress 500）", () => {
  const r = resolveGesture(mkDown({ t: 0 }), mkUp({ t: 500 }));
  assertEqual(r.type, "drag");
});

test("中键 (button=1) → none（v1 §4.2 中键忽略）", () => {
  const r = resolveGesture(mkDown({ button: MOUSE_BUTTON.MIDDLE, t: 0 }), mkUp({ button: MOUSE_BUTTON.MIDDLE, t: 50 }));
  assertEqual(r.type, "none");
});

test("右键 (button=2) 短按 → click，button 透传为 2", () => {
  const r = resolveGesture(mkDown({ button: MOUSE_BUTTON.RIGHT, t: 0 }), mkUp({ button: MOUSE_BUTTON.RIGHT, t: 50 }));
  assertEqual(r.type, "click");
  assertEqual(r.button, 2, "button 应透传右键");
});

test("位移优先于时长（长时 + 大位移 → drag 而非 longpress）", () => {
  const r = resolveGesture(mkDown({ x: 0, y: 0, t: 0 }), mkUp({ x: 50, y: 0, t: 600 }));
  assertEqual(r.type, "drag", "位移判定优先级高于长按");
});

test("缺参数安全降级 → none 不抛错", () => {
  assertEqual(resolveGesture(null, null).type, "none");
  assertEqual(resolveGesture(mkDown(), null).type, "none");
});

// ========================== 2. 连点防抖 ==========================
console.log("\n\x1b[1m[2] shouldDebounce —— 连点防抖（验收 2-C）\x1b[0m");

test("首次点击（无历史）→ 不吸收", () => {
  assertEqual(shouldDebounce(null, 1000), false);
});

test("间隔 150ms (< 180) → 吸收", () => {
  assertEqual(shouldDebounce(1000, 1150), true, "180ms 窗口内应吸收");
});

test("间隔恰好 180ms → 不吸收（不越界）", () => {
  assertEqual(shouldDebounce(1000, 1180), false);
});

test("间隔 200ms (> 180) → 不吸收", () => {
  assertEqual(shouldDebounce(1000, 1200), false);
});

test("时钟回拨（now < last）→ 不吸收（保守放行）", () => {
  assertEqual(shouldDebounce(1000, 900), false);
});

// ========================== 3. 滚轮归一化 ==========================
console.log("\n\x1b[1m[3] normalizeWheelDelta —— deltaMode 归一（v1 §4.2 滚轮）\x1b[0m");

test("像素模式 deltaY>0 → +1 步", () => {
  assertEqual(normalizeWheelDelta({ deltaY: 120, deltaMode: WHEEL_DELTA_MODE.PIXEL }), 1);
});

test("像素模式 deltaY<0 → -1 步", () => {
  assertEqual(normalizeWheelDelta({ deltaY: -120, deltaMode: WHEEL_DELTA_MODE.PIXEL }), -1);
});

test("LINE 模式（Firefox）deltaY=3 → +1 步", () => {
  assertEqual(normalizeWheelDelta({ deltaY: 3, deltaMode: WHEEL_DELTA_MODE.LINE }), 1);
});

test("PAGE 模式 deltaY=1 → +1 步", () => {
  assertEqual(normalizeWheelDelta({ deltaY: 1, deltaMode: WHEEL_DELTA_MODE.PAGE }), 1);
});

test("deltaY=0 → 0（忽略）", () => {
  assertEqual(normalizeWheelDelta({ deltaY: 0, deltaMode: WHEEL_DELTA_MODE.PIXEL }), 0);
});

test("空事件安全降级 → 0", () => {
  assertEqual(normalizeWheelDelta(null), 0);
  assertEqual(normalizeWheelDelta({}), 0);
});

test("关闭归一化时不做 deltaMode 换算（但符号仍保留）", () => {
  assertEqual(normalizeWheelDelta({ deltaY: 3, deltaMode: WHEEL_DELTA_MODE.LINE }, { wheelDeltaNormalize: false }), 1);
});

// ========================== 4. 滚轮节流 ==========================
console.log("\n\x1b[1m[4] createWheelThrottle —— 滚轮节流（验收 3-E）\x1b[0m");

test("首次一定放行", () => {
  const allow = createWheelThrottle();
  assertEqual(allow(1000), true);
});

test("60ms 内连滚 → 只放行一次", () => {
  const allow = createWheelThrottle({ wheelThrottleMs: 60 });
  assertEqual(allow(1000), true, "首次放行");
  assertEqual(allow(1010), false, "10ms 后应被节流");
  assertEqual(allow(1030), false, "30ms 后应被节流");
  assertEqual(allow(1055), false, "55ms 后应被节流");
  assertEqual(allow(1061), true, "61ms 后应放行");
});

// ========================== 5. GestureResolver 状态机 ==========================
console.log("\n\x1b[1m[5] GestureResolver —— 状态机（验收 2-D 拖拽阈值 / 2-E 失焦复位）\x1b[0m");

test("down → up 完整点击流程", () => {
  const g = new GestureResolver();
  g.pointerDown(mkDown({ x: 10, y: 10, t: 0 }));
  const r = g.pointerUp(mkUp({ x: 10, y: 10, t: 100 }));
  assertEqual(r.type, "click");
});

test("pointerMove 越过阈值 → dragging=true", () => {
  const g = new GestureResolver();
  g.pointerDown(mkDown({ x: 0, y: 0, t: 0 }));
  assertEqual(g.pointerMove(mkUp({ x: 5, y: 0 })), false, "5px 未越阈值");
  assertEqual(g.pointerMove(mkUp({ x: 20, y: 0 })), true, "20px 越阈值");
  assertEqual(g.dragging, true);
});

test("未按下时 pointerMove → false（不误判）", () => {
  const g = new GestureResolver();
  assertEqual(g.pointerMove(mkUp({ x: 100, y: 100 })), false);
});

test("连点：200ms 内连点 5 次 → 只生效 1 次（验收 2-C）", () => {
  const g = new GestureResolver();
  let effective = 0;
  // 5 次点击，间隔 40ms（共 200ms），均在 180ms 防抖窗口内
  for (let i = 0; i < 5; i++) {
    const t = i * 40;
    g.pointerDown(mkDown({ x: 0, y: 0, t }));
    const r = g.pointerUp(mkUp({ x: 0, y: 0, t: t + 10 }));
    if (r.type === "click") effective++;
  }
  assertEqual(effective, 1, "180ms 防抖窗口内应只生效 1 次");
});

test("skipDebounce 白名单可绕过防抖", () => {
  const g = new GestureResolver();
  g.pointerDown(mkDown({ t: 0 }));
  const r1 = g.pointerUp(mkUp({ t: 10 }));
  g.pointerDown(mkDown({ t: 20 }));
  const r2 = g.pointerUp(mkUp({ t: 30 }), { skipDebounce: true });
  assertEqual(r1.type, "click");
  assertEqual(r2.type, "click", "白名单应绕过防抖");
});

test("cancel() 复位后 up 不再产出 click（验收 2-E 失焦复位）", () => {
  const g = new GestureResolver();
  g.pointerDown(mkDown({ x: 0, y: 0, t: 0 }));
  g.cancel();
  const r = g.pointerUp(mkUp({ x: 0, y: 0, t: 100 }));
  assertEqual(r.type, "none", "取消后不应有残留手势");
  assertEqual(g.dragging, false);
});

test("reset() 同时清空连点窗口", () => {
  const g = new GestureResolver();
  g.pointerDown(mkDown({ t: 0 }));
  g.pointerUp(mkUp({ t: 10 })); // 生效点击，记录 lastClickAt=10
  g.reset();
  g.pointerDown(mkDown({ t: 20 }));
  const r = g.pointerUp(mkUp({ t: 30 })); // 距上次仅 20ms，若未 reset 会被吸收
  assertEqual(r.type, "click", "reset 后不应受历史连点影响");
});

test("热更新配置生效", () => {
  const g = new GestureResolver({ dragThresholdPx: 100 });
  g.pointerDown(mkDown({ x: 0, y: 0, t: 0 }));
  assertEqual(g.pointerUp(mkUp({ x: 20, y: 0, t: 50 })).type, "click", "阈值 100 时 20px 仍是 click");
  g.setConfig({ dragThresholdPx: 10 });
  g.pointerDown(mkDown({ x: 0, y: 0, t: 1000 }));
  assertEqual(g.pointerUp(mkUp({ x: 20, y: 0, t: 1050 })).type, "drag", "阈值改 10 后 20px 应为 drag");
});

test("config 缺省项回落默认值", () => {
  const g = new GestureResolver({ dragThresholdPx: 50 }); // 其余未传
  assertEqual(g.config.clickMaxDurationMs, 250, "未传项应回落默认 250");
  assertEqual(g.config.doubleClickDebounceMs, 180);
});

// ========================== 6. 工具函数 ==========================
console.log("\n\x1b[1m[6] distance —— 距离计算\x1b[0m");

test("3-4-5 直角三角形", () => {
  assertEqual(distance(0, 0, 3, 4), 5);
});
test("同点距离为 0", () => {
  assertEqual(distance(7, 7, 7, 7), 0);
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

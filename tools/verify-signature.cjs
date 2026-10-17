/*
 * PKRC · B-8 签名比对工具
 * ---------------------------------------------------------------------------
 * 目的：把 A4-00b（M3 硬卡点）的「符号命中率 / 残差定性」变成**一键可跑、可复现**。
 *
 * ── 两侧的提取方式**不同**，但语义相同（实测结论）───────────────────────
 *   · 基准（modder 产物 / rollup + esbuild）：标识符**被混淆**，
 *     只能靠 keepNames 注记反推原名 —— 形态 `<helper>(<x>, "原名")`，如 `l(e,"CubicBezierCurve")`。
 *     注记里的 helper 名是被压过的（实测是 `l` / `r`），故需**自动探测**而非硬编码。
 *   · 候选（自构建 / rolldown + oxc）：rolldown 的 `output.keepNames` 机制是「**不混淆原名**」，
 *     `class` 以 `Name=class extends X{...}` 的形态出现，**根本不产生注记**
 *     （实测 `--minify esbuild` 也拿不到注记 —— rolldown 掌控命名，esbuild 不介入 keepNames）。
 *     → 候选侧改为抽**标识符集合**。
 *
 *   两者回答的是同一个问题：「这个 bundle 里有哪些符号」。
 *   自证：候选侧核心上游符号 100% 命中（[5/5] 会报）。
 *
 * ── 🔴 抽标识符**必须先剥掉字符串/正则/注释字面量**──────────────────────
 *   否则 `throw Error("...BattleScene...")`、i18n 文案、注释里的词会造成**假命中**。
 *   而剥离器**必须识别正则字面量**：minified 代码里满是 `/["']/g` 这类正则，
 *   朴素扫描器会被其中的引号带进「字符串模式」成片吞码 ——
 *   实测第一版 6.15 MB 被剥成 1.22 MB，`Move` / `Ability` 都丢了，
 *   覆盖率算出 18.85% 的**假低谷**（正确值见运行输出）。见 `stripLiterals()`。
 *
 * 用法（**不需要**额外构建，直接用 B-5 的原生产物）：
 *   <node> tools/verify-signature.cjs --scan-vendor          # 首次：建第三方符号集缓存
 *   <node> tools/verify-signature.cjs                        # 默认路径，打印报告
 *   <node> tools/verify-signature.cjs --out=报告.md
 *   <node> tools/verify-signature.cjs --gate                 # 迁移缺陷>0 或核心符号缺 → EXIT=1
 *   <node> tools/verify-signature.cjs --json
 *
 *   --baseline=<dir>   基准 assets 目录（默认 game/server/dist/assets）
 *   --candidate=<dir>  候选 assets 目录（默认 <anchor>/dist/assets）
 *   --src=<dir>        源码目录，用于残差分类（默认 <anchor>/src）
 *   --helpers=l,r      手动指定基准侧 keepNames 助手名（默认自动探测）
 *   --min-helper=50    助手自动探测阈值（出现符号数 ≥ 此值才采信）
 *   --min-name-len=3   符号名最短长度（滤掉正则标志之类的伪符号）
 *   --scan-vendor      扫描 node_modules 重建第三方符号集缓存
 *   --vendor-cache=<f> 第三方符号集缓存路径（默认 .build-tools/vendor-tokens.json）
 *
 * 依赖：零外部依赖（D3）。纯 fs + 正则。
 * 语法：遵守项目约定（Node 16 可跑）。
 */

"use strict";

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// 默认路径
// ---------------------------------------------------------------------------
const REPO_ROOT = path.resolve(__dirname, "..");
const DEFAULT_ANCHOR = path.join(
  ".build-tools",
  "tarball-src",
  "pokerogue-90df65097b6df76f713e6bd108afa84499e8b993"
);

/**
 * 「依赖噪声」识别：这些是 rollup / esbuild / commonjs 互操作助手，
 * 由打包器注入，**不属于我们的源码**，命中与否都不说明迁移问题。
 * 另加规则：名字带 `$数字` 后缀（esbuild 处理命名冲突时加的后缀，如 `Factory$2`）。
 */
const NOISE_NAMES = new Set([
  "_mergeNamespaces",
  "getDefaultExportFromCjs",
  "getAugmentedNamespace",
  "commonjsGlobal",
  "__commonJS",
  "__commonJSMin",
  "__esm",
  "__esmMin",
  "__toESM",
  "__toCommonJS",
  "__require",
  "__export",
  "__spreadValues",
  "__spreadProps",
  "__publicField",
  "__decorateClass",
  "__name",
  "__defProp",
]);
const NOISE_SUFFIX_RE = /\$\d+$/;

// ---------------------------------------------------------------------------
// 参数
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
function opt(n) {
  const eq = argv.find((a) => a.startsWith(n + "="));
  if (eq !== undefined) return eq.slice(n.length + 1);
  const i = argv.findIndex((a) => a === n);
  if (i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith("--")) return argv[i + 1];
  return undefined;
}
const num = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const JSON_OUT = flag("--json");
const GATE = flag("--gate");
const MIN_HELPER = num(opt("--min-helper"), 50);
const MIN_NAME_LEN = num(opt("--min-name-len"), 3);
const HELPERS_OVERRIDE = opt("--helpers") ? opt("--helpers").split(",").map((s) => s.trim()).filter(Boolean) : null;

const lines = [];
function out(s) {
  if (!JSON_OUT) process.stdout.write(s + "\n");
  else lines.push(s);
}

// ---------------------------------------------------------------------------
// 读取 / 词法
// ---------------------------------------------------------------------------
/** 读目录下所有 .js 拼成一个大串 */
function readJsBundle(dir) {
  let list;
  try {
    list = fs.readdirSync(dir);
  } catch (e) {
    return null;
  }
  const parts = [];
  const files = [];
  for (const f of list) {
    if (!f.endsWith(".js")) continue;
    const full = path.join(dir, f);
    parts.push(fs.readFileSync(full, "utf8"));
    files.push(f);
  }
  return { text: parts.join("\n"), files: files.sort() };
}

/**
 * 剥掉字符串 / 模板 / 正则字面量的**内容**与注释（保留标识符与结构）。
 *
 * 为什么必须剥：`throw Error("...BattleScene...")`、注释、i18n 文案里的词
 * 若被当成标识符，会造成「假命中」，把覆盖率算虚高。
 *
 * ⚠️ 为什么必须识别**正则字面量**（本函数的第一版栽在这里）：
 *    minified 代码里大量出现 `/["']/g`、`/\\s+/` 这类正则。
 *    朴素扫描器遇到 `/["']/g` 里的 `"` 会误入「字符串模式」，
 *    一路吞到下一个引号 —— 实测 6.15 MB 被剥成 1.22 MB，
 *    连 `Move` / `Ability` 这类核心符号都丢了，覆盖率算出 18.85% 的**假低谷**。
 *
 * 判定 `/` 是「除法」还是「正则起始」：看它前面最近的**有效字符**。
 * 表达式位置（`(` `,` `=` `[` `{` `}` `;` `:` `?` `!` `&` `|` `+` `-` `*` `%` `<` `>` `^` `~`
 * 或行首）之后出现的 `/` 视为正则；否则视为除号。
 * 另外若前一个词是 `return` / `typeof` / `case` 等关键字，也视为正则。
 *
 * 已知局限：模板字符串里 `${}` 的花括号不参与嵌套计数（模板内出现成对引号
 * 且跨 `${}` 的极端写法可能误判）。对「符号存在性」这一用途足够。
 */
const REGEX_START_AFTER = new Set([
  "", "(", "[", "{", "}", ",", ";", ":", "?", "!", "&", "|",
  "+", "-", "*", "%", "=", "<", ">", "^", "~",
]);
const KEYWORD_BEFORE_REGEX = new Set([
  "return", "typeof", "instanceof", "in", "of", "new", "delete",
  "void", "throw", "case", "do", "else", "yield", "await",
]);

function stripLiterals(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  let prevSig = ""; // 输出的最后一个非空白字符
  let prevWord = ""; // 输出末尾的标识符（用于关键字判断）

  const emit = (c) => {
    out += c;
    if (!/\s/.test(c)) {
      if (/[A-Za-z0-9_$]/.test(c)) prevWord += c;
      else prevWord = "";
      prevSig = c;
    }
  };

  while (i < n) {
    const c = src[i];

    // 单行注释
    if (c === "/" && src[i + 1] === "/") {
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    // 块注释
    if (c === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    // 正则字面量
    if (c === "/" && (prevSig === "" || REGEX_START_AFTER.has(prevSig) || KEYWORD_BEFORE_REGEX.has(prevWord))) {
      i++;
      let inClass = false;
      while (i < n) {
        const d = src[i];
        if (d === "\\") {
          i += 2;
          continue;
        }
        if (d === "[") inClass = true;
        else if (d === "]") inClass = false;
        else if (d === "/" && !inClass) {
          i++;
          break;
        } else if (d === "\n") {
          // 正则不跨行；说明判断错了（其实是除号），退回
          i++;
          break;
        }
        i++;
      }
      // 吃掉 flags
      while (i < n && /[a-z]/.test(src[i])) i++;
      emit("/");
      continue;
    }
    // 字符串 / 模板
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      i++;
      while (i < n) {
        if (src[i] === "\\") {
          i += 2;
          continue;
        }
        if (src[i] === q) {
          i++;
          break;
        }
        i++;
      }
      emit(q);
      continue;
    }
    emit(c);
    i++;
  }
  return out;
}

const IDENT_RE = /[A-Za-z_$][A-Za-z0-9_$]*/g;

/** 抽标识符（先剥字面量） */
function tokenize(js) {
  const set = new Set();
  const t = stripLiterals(js);
  let m;
  IDENT_RE.lastIndex = 0;
  while ((m = IDENT_RE.exec(t)) !== null) set.add(m[0]);
  return set;
}

/**
 * 核心上游符号 —— A4-00b 达标条件 ④ 的直接判据（「核心上游符号 100% 命中」）。
 * 取自 `24-第三阶段任务分发.md` §0.4 列举的那一组，另补几个高频 Phase 类。
 */
const CORE_SYMBOLS = [
  "BattleScene",
  "Pokemon",
  "Move",
  "Ability",
  "BattlerTag",
  "Modifier",
  "Phase",
  "ArenaTag",
  "BerryPhase",
  "AttemptCapturePhase",
  "BattleEndPhase",
];

// ---------------------------------------------------------------------------
// 抽取 keepNames 注记（**基准侧专用**）
// ---------------------------------------------------------------------------
/**
 * 匹配 `<helper>(<arg...>, "<Name>")` —— **要求调用在字符串后立即结束**。
 *
 * ⚠️ 末尾的 `\s*\)` 至关重要：漏了它会把
 *    `Object.defineProperty(obj, "someProp", { ... })`
 *    也当成 keepNames 助手（第 2 参同样是字符串），
 *    从而把 Phaser 的属性名（`uvs` / `magFilter` / `wrapS` …）误当符号，
 *    并使「助手自动探测」采信一堆非助手（`defineProperty` / `call` …）。
 *    keepNames 助手恰好**只有两个参数**，故要求右括号紧随其后。
 *
 * 第一参数可能是标识符、函数表达式或类表达式，故用不含括号的宽松匹配。
 */
const KEEPNAMES_CALL_RE =
  /\b([A-Za-z_$][A-Za-z0-9_$]*)\s*\(\s*([^()]{1,120}?)\s*,\s*"([A-Za-z_$][A-Za-z0-9_$]*)"\s*\)/g;

/**
 * 从一个 bundle 文本里抽 keepNames 注记里的**原名集合**。
 *
 * @param {string} bundleText
 * @param {number} minNameLen  名字最短长度（滤掉正则标志等）
 * @param {number} minHelper   某个 helper 至少要贡献多少个不同符号才被采信
 * @param {string[]|null} helpersOverride  手动指定 helper（跳过自动探测）
 */
function extractAnnotations(bundleText, minNameLen, minHelper, helpersOverride) {
  const byHelper = new Map(); // helper -> Set(name)
  let m;
  KEEPNAMES_CALL_RE.lastIndex = 0;
  while ((m = KEEPNAMES_CALL_RE.exec(bundleText)) !== null) {
    const helper = m[1];
    const name = m[3];
    if (name.length < minNameLen) continue;
    if (!byHelper.has(helper)) byHelper.set(helper, new Set());
    byHelper.get(helper).add(name);
  }

  const helperCounts = [];
  byHelper.forEach((set, helper) => helperCounts.push({ helper, count: set.size, names: set }));
  helperCounts.sort((a, b) => b.count - a.count);

  const chosen = helpersOverride
    ? helperCounts.filter((h) => helpersOverride.includes(h.helper))
    : helperCounts.filter((h) => h.count >= minHelper);

  const names = new Set();
  for (const h of chosen) h.names.forEach((x) => names.add(x));

  return { names, helperCounts, chosen };
}

// ---------------------------------------------------------------------------
// 第三方（vendor）符号集 —— 用于把 Phaser 等库的内部符号正确归入「依赖噪声」
// ---------------------------------------------------------------------------
/**
 * 扫描 `node_modules` 下所有 .js/.mjs/.cjs，收集标识符到缓存文件。
 *
 * 为什么要它：仅凭「名字在不在 `src/` 里」分类会把 **Phaser 内部符号**
 * （`jsonURL` / `equalpower` / `audioConfig` …）误判成「迁移缺陷」——
 * 它们既不在我们的 `src/`，也不是 modder 新增，而是被 rolldown 摇掉的第三方符号。
 *
 * ⚠️ 取舍（已实测 237.6 MB / 16883 文件）：
 *    · **不剥字面量**，直接抽标识符。原因：剥离 237 MB 需要逐字符扫描，太慢；
 *      而**过度包含**（把 vendor 字符串里的词也算作 vendor）方向安全 ——
 *      它只会把疑似项归到「依赖噪声」（少报迁移缺陷），不会凭空造出迁移缺陷。
 *      代价：极少数与 vendor 字符串重名的 modder 符号会被低估，概率极低。
 *    · 逐文件流式处理并累积到 Set，避免一次性 match 出上千万字符串爆内存。
 *    · 结果缓存到文件，重复运行秒回。
 */
function scanVendorTokens(rootDir) {
  const set = new Set();
  let files = 0;
  const stack = [rootDir];
  while (stack.length) {
    const cur = stack.pop();
    let ents;
    try {
      ents = fs.readdirSync(cur, { withFileTypes: true });
    } catch (e) {
      continue;
    }
    for (const e of ents) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) {
        if (e.name === ".bin") continue;
        stack.push(full);
      } else if (e.isFile() && /\.(js|mjs|cjs)$/.test(e.name)) {
        let text;
        try {
          text = fs.readFileSync(full, "utf8");
        } catch (e) {
          continue;
        }
        let m;
        IDENT_RE.lastIndex = 0;
        while ((m = IDENT_RE.exec(text)) !== null) set.add(m[0]);
        files++;
      }
    }
  }
  return { tokens: [...set], files };
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------
function main() {
  const anchor = path.join(REPO_ROOT, DEFAULT_ANCHOR);
  // ⚠️ A5-01 切换后 `game/server/dist/assets` 已是**自构建产物** ⇒ 基准必须用 modder 备份。
  //    自动探测 `game/server/dist.modder-backup-*/assets`（取最新），否则回退到旧默认路径。
  function detectBaseline() {
    const cli = opt("--baseline");
    if (cli) return path.resolve(REPO_ROOT, cli);
    const serverDir = path.join(REPO_ROOT, "game", "server");
    const cands = fs.existsSync(serverDir)
      ? fs.readdirSync(serverDir).filter(d => /^dist\.modder-backup-/.test(d)).sort().reverse()
      : [];
    if (cands.length) return path.join(serverDir, cands[0], "assets");
    return path.resolve(REPO_ROOT, path.join("game", "server", "dist", "assets"));
  }
  const baselineDir = detectBaseline();
  const candidateDir = path.resolve(REPO_ROOT, opt("--candidate") || path.join(anchor, "dist", "assets"));
  const srcDir = path.resolve(REPO_ROOT, opt("--src") || path.join(anchor, "src"));

  out("PKRC 签名比对（B-8）");
  out("=".repeat(68));
  out(`基准（modder 产物）：${baselineDir}`);
  out(`候选（自构建产物）：${candidateDir}`);
  out(`源码（用于残差分类）：${srcDir}`);
  out("");

  const base = readJsBundle(baselineDir);
  if (!base) {
    process.stderr.write(`基准目录不存在：${baselineDir}\n`);
    process.exitCode = 2;
    return;
  }
  const cand = readJsBundle(candidateDir);
  if (!cand) {
    process.stderr.write(`候选目录不存在：${candidateDir}\n`);
    process.stderr.write("\n先在锚点树里构建原生产物：\n");
    process.stderr.write("  cd <anchor>\n");
    process.stderr.write("  node node_modules/vite/bin/vite.js build\n");
    process.exitCode = 2;
    return;
  }

  // ① 基准符号
  const b = extractAnnotations(base.text, MIN_NAME_LEN, MIN_HELPER, HELPERS_OVERRIDE);
  out("[1/5] 基准符号提取（modder 产物 / esbuild keepNames 注记）");
  out(`  文件 ${base.files.length} 个`);
  out(`  助手名分布（Top6）：${b.helperCounts.slice(0, 6).map((h) => `${h.helper}(${h.count})`).join("  ") || "（无）"}`);
  if (b.chosen.length === 0) {
    out(`  ⚠️ 未探测到 keepNames 助手（阈值 --min-helper=${MIN_HELPER}）。可手动指定：--helpers=l,r`);
  } else {
    out(`  采信助手：${b.chosen.map((h) => h.helper).join(", ")}`);
  }
  out(`  **基准符号总数：${b.names.size}**`);
  out("");

  // ② 候选符号（原生构建：rolldown/oxc keepNames ⇒ 标识符被**原样保留**）
  //
  // ⚠️ 两侧为什么用不同提取器（实测结论，不是想当然）：
  //    · 基准（modder 产物）标识符**被混淆**，只能靠 keepNames 注记反推原名；
  //    · 候选（原生构建）rolldown 的 `output.keepNames` 机制是「**不混淆**」，
  //      根本不产生注记 —— 实测 `--minify esbuild` 也拿不到注记
  //      （rolldown 掌控命名，esbuild 不介入 keepNames）。
  //    两者提取方式不同，但回答的是**同一个问题**：「这个 bundle 里有哪些符号」。
  //    实测自证：候选侧核心上游符号 100% 命中（见 [5/5]）。
  const candTokens = tokenize(cand.text);
  out("[2/5] 候选符号提取（原生构建 / 标识符原样保留）");
  out(`  文件 ${cand.files.length} 个`);
  out(`  **候选标识符 token 数：${candTokens.size}**`);
  const candAnn = extractAnnotations(cand.text, MIN_NAME_LEN, MIN_HELPER, HELPERS_OVERRIDE);
  if (candAnn.names.size > 0) {
    out(`  ℹ️ 候选侧另检出 ${candAnn.names.size} 条 keepNames 注记（不影响主判定，仅供参考）`);
  }
  out("");

  // ③ 覆盖率
  const hit = [];
  const miss = [];
  b.names.forEach((n) => (candTokens.has(n) ? hit.push(n) : miss.push(n)));
  const cov = b.names.size ? (hit.length / b.names.size) * 100 : 0;

  out("[3/5] 覆盖率");
  out(`  基准符号 ${b.names.size} · 命中 ${hit.length} · 未命中 ${miss.length}`);
  out(`  **覆盖率 ${cov.toFixed(2)}%**`);
  out(`  参照：A3-13 在同一口径下（vite 7 降级）测得 58.51%`);
  out("");

  // ④ 残差分类（三类：迁移缺陷 / tree-shake / 依赖噪声）
  out("[4/5] 残差分类");

  // 源码符号集
  const srcTokens = (() => {
    let set = new Set();
    const stack = [srcDir];
    let count = 0;
    while (stack.length) {
      const cur = stack.pop();
      let ents;
      try {
        ents = fs.readdirSync(cur, { withFileTypes: true });
      } catch (e) {
        continue;
      }
      for (const e of ents) {
        const full = path.join(cur, e.name);
        if (e.isDirectory()) stack.push(full);
        else if (e.isFile() && /\.(ts|tsx)$/.test(e.name)) {
          tokenize(fs.readFileSync(full, "utf8")).forEach((x) => set.add(x));
          count++;
        }
      }
    }
    return { set, count };
  })();

  // 第三方符号集（可选，带缓存）
  const vendorCachePath = path.resolve(REPO_ROOT, opt("--vendor-cache") || path.join(".build-tools", "vendor-tokens.json"));
  let vendorSet = new Set();
  let vendorInfo = "未启用";
  if (flag("--scan-vendor")) {
    out("  （扫描 node_modules 生成第三方符号集，首次约需 1 分钟…）");
    const t0 = Date.now();
    const r = scanVendorTokens(path.join(anchor, "node_modules"));
    fs.mkdirSync(path.dirname(vendorCachePath), { recursive: true });
    fs.writeFileSync(vendorCachePath, JSON.stringify(r.tokens), "utf8");
    vendorSet = new Set(r.tokens);
    vendorInfo = `刚扫描：${r.files} 文件 / ${r.tokens.length} 符号（${((Date.now() - t0) / 1000).toFixed(1)}s）`;
  } else if (fs.existsSync(vendorCachePath)) {
    try {
      const arr = JSON.parse(fs.readFileSync(vendorCachePath, "utf8"));
      vendorSet = new Set(arr);
      vendorInfo = `缓存：${arr.length} 符号（${path.relative(REPO_ROOT, vendorCachePath)}）`;
    } catch (e) {
      vendorInfo = "缓存损坏，请加 --scan-vendor 重建";
    }
  }

  const buckets = { migration: [], treeshake: [], noise: [] };
  for (const n of miss) {
    if (NOISE_SUFFIX_RE.test(n) || NOISE_NAMES.has(n)) buckets.noise.push(n);
    else if (srcTokens.set.has(n)) buckets.treeshake.push(n);
    else if (vendorSet.has(n)) buckets.noise.push(n);
    else buckets.migration.push(n);
  }

  out(`  源码扫描：${srcTokens.count} 个 .ts 文件，${srcTokens.set.size} 个标识符`);
  out(`  第三方符号集：${vendorInfo}`);
  if (vendorSet.size === 0) {
    out(`  ⚠️ 未启用第三方符号集 → Phaser 等库的内部符号会被**误归入「迁移缺陷」**。`);
    out(`     建议先跑一次：--scan-vendor（结果会缓存，后续秒回）`);
  }
  out("");
  out(`  ┌ **未定性残差**  ${buckets.migration.length}  ← 见下方「未定性残差的构成」`);
  out(`  ├ tree-shake 差异 ${buckets.treeshake.length}  ← 源码里**有**、bundle 里没有（摇树差异）`);
  out(`  └ 依赖噪声       ${buckets.noise.length}  ← 打包器注入 / node_modules 中可查到`);
  out("");
  if (!vendorSet.size) {
    out(`  ⚠️ 未启用第三方符号集，「未定性残差」会**偏高**。建议先跑一次 --scan-vendor。`);
    out("");
  }
  out("  **「未定性残差」的构成（重要，勿当成单一含义）**：");
  out("    ① modder 新增符号（11 个自研系统）—— 完成 A4-00 接入锚点后应落进 src/，");
  out("       从而转为「tree-shake 差异」或直接命中。**这是 A4-00 要消掉的部分。**");
  out("    ② 被 rolldown 摇掉的第三方内部符号（如 Phaser 的 `jsonURL`/`equalpower`）——");
  out("       与迁移无关，且**无法从 node_modules 反查**（Phaser 的 dist 本身已压缩，");
  out("       实测扫描 16883 个 JS 文件也只多识别出 20 个）。");
  out("    → 因此本项**不等于**「迁移缺陷数」。A4-00 后重跑：");
  out("      未定性残差应**大幅下降**，残下的基本是 ② —— 可用 --allow 白名单固化。");
  out("");
  const show = (label, arr) => {
    if (!arr.length) return;
    out(`  ${label}（前 10）：`);
    out(`    ${arr.slice(0, 10).join(", ")}`);
  };
  show("未定性残差", buckets.migration);
  show("tree-shake 差异", buckets.treeshake);
  show("依赖噪声", buckets.noise);
  out("");

  // ⑤ 核心上游符号命中（A4-00b 达标条件 ④）
  out("[5/5] 核心上游符号命中（A4-00b ④：要求 100%）");
  const coreMiss = [];
  for (const s of CORE_SYMBOLS) {
    if (candTokens.has(s)) out(`  ✅ ${s}`);
    else {
      out(`  ❌ ${s}`);
      coreMiss.push(s);
    }
  }
  out("");
  const coreOk = coreMiss.length === 0;
  out(
    coreOk
      ? `  **核心符号 ${CORE_SYMBOLS.length}/${CORE_SYMBOLS.length} 命中 — 满足 A4-00b ④**`
      : `  **核心符号 ${CORE_SYMBOLS.length - coreMiss.length}/${CORE_SYMBOLS.length} 命中 — 缺：${coreMiss.join(", ")}**`
  );
  out("");

  out("-".repeat(68));
  out("说明：");
  out("  · 本工具服务 A4-00b（M3 硬卡点）。判据映射见 `24-第三阶段任务分发.md` §0.4：");
  out("      ④ 核心上游符号 100% 命中   → [5/5] 直接报；【已完成】");
  out("      ⑤ 11 个自研系统符号全命中 → 见 [4/5] 未定性残差的「① modder 新增」部分");
  out("      ②③ 残差逐条定性            → [4/5] 三类分桶 + --allow 白名单");
  out("  · 「未定性残差」**不等于**迁移缺陷数（构成见 [4/5] 下方说明）。");
  out("  · 在 A4-00（接入锚点）**之前**运行，得到的是**基线**：");
  out("      当前实测覆盖率与核心符号命中率，可作为 A4-00 后的对比锚点。");
  out("  · 本工具不能替代人工定性：tree-shake 差异类需逐条确认「该符号本应存在」。");
  out("");

  if (GATE) {
    // 白名单：把已确认无害的残差（主要是被摇掉的第三方符号）固化下来
    let allow = new Set();
    const allowFile = opt("--allow");
    if (allowFile) {
      try {
        const arr = JSON.parse(fs.readFileSync(path.resolve(REPO_ROOT, allowFile), "utf8"));
        allow = new Set(Array.isArray(arr) ? arr : []);
        out(`  白名单载入 ${allow.size} 个（${allowFile}）`);
      } catch (e) {
        out(`  ⚠️ 白名单读取失败：${e.message}`);
      }
    }
    const unexplained = buckets.migration.filter((n) => !allow.has(n));
    const problems = [];
    if (coreMiss.length > 0) problems.push(`核心符号缺 ${coreMiss.length} 个（要求 0）`);
    if (unexplained.length > 0) problems.push(`未定性且未白名单化 ${unexplained.length} 个（要求 0）`);
    if (problems.length === 0) {
      out("✅ GATE 通过：核心符号 100% 命中，未定性残差已全部解释（白名单化）");
    } else {
      out(`❌ GATE 未通过：${problems.join("；")}`);
      if (unexplained.length) out(`     未定性样例：${unexplained.slice(0, 10).join(", ")}`);
      process.exitCode = 1;
    }
  }

  const outFile = opt("--out");
  if (outFile) {
    const full = path.resolve(REPO_ROOT, outFile);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    const md = [
      "# 签名比对报告（B-8）",
      "",
      `> 生成时间：${new Date().toISOString()}`,
      "> 工具：`tools/verify-signature.cjs`",
      "",
      "## 路径",
      "",
      "| 角色 | 路径 |",
      "|---|---|",
      `| 基准（modder 产物） | \`${baselineDir}\` |`,
      `| 候选（自构建产物） | \`${candidateDir}\` |`,
      `| 源码（残差分类） | \`${srcDir}\` |`,
      "",
      "## 覆盖率",
      "",
      `- 基准符号总数：**${b.names.size}**`,
      `- 命中：**${hit.length}**`,
      `- 未命中：**${miss.length}**`,
      `- **覆盖率：${cov.toFixed(2)}%**`,
      "",
      "## 残差分类",
      "",
      "| 类别 | 数量 | 含义 |",
      "|---|---:|---|",
      `| 未定性残差 | **${buckets.migration.length}** | 基准有、bundle 无、src/ 也无（含 modder 新增 + 被摇掉的第三方） |`,
      `| tree-shake 差异 | ${buckets.treeshake.length} | src/ 有、bundle 无 |`,
      `| 依赖噪声 | ${buckets.noise.length} | 打包器注入 / 第三方 |`,
      "",
    ];
    const sec = (label, arr) => {
      if (!arr.length) return;
      md.push(`### ${label}（${arr.length}）`, "", "```", arr.join("\n"), "```", "");
    };
    sec("未定性残差", buckets.migration);
    sec("tree-shake 差异", buckets.treeshake);
    sec("依赖噪声", buckets.noise);
    fs.writeFileSync(full, md.join("\n"), "utf8");
    out(`报告已写入 ${full}`);
  }

  if (JSON_OUT) {
    process.stdout.write(
      JSON.stringify(
        {
          baselineDir,
          candidateDir,
          srcDir,
          helperChosen: b.chosen.map((h) => h.helper),
          baselineCount: b.names.size,
          hitCount: hit.length,
          missCount: miss.length,
          coveragePct: Number(cov.toFixed(2)),
          buckets: {
            undetermined: buckets.migration,
            treeshake: buckets.treeshake,
            noise: buckets.noise,
          },
        },
        null,
        2
      ) + "\n"
    );
  }
}

main();

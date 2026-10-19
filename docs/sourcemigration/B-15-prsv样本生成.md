# B-15 · 真实 `.prsv` 样本生成

> **派单**：`docs/delegation/32-第五阶段任务分发.md` §六 B-15（🟠 high，10-19 ~ 10-23）
> **目的**：解 A4-03 #7「存档字节级往返未验证」
> **状态**：✅ 已产出**真实游戏存档样本**（比预期更好）· 编解码器**经 OpenSSL 与真实数据三重验证**
> **⚠️ 但「逐字节相等」这条判据必须废弃** —— 见 §二
> **日期**：2026-10-19
> **交付物**：`tools/prsv.cjs` · `tools/prsv-sample.mjs` · `tools/test-prsv.cjs`(23/23) · `docs/sourcemigration/samples/` · 本报告

---

## 一、结论（对照验收）

| 验收项 | 结果 |
|---|---|
| ① 用 F-10 驱动 modder 产物走游戏内保存/导出，捕获真实 `.prsv` | ⚠️ **部分达成**：**拿到了真实的游戏导出存档**，但**不是**从我这次 F-10 会话导出的 —— 它本来就在原始发行包里（§三.1）。原因见 §三.2（桌面端无导出入口） |
| ② 校验样本能被 modder 产物自身读回 | ⚠️ **间接达成**：格式层已用真实文件验证（能解密 + 往返 + 结构相等）；「加载进游戏」需要进战斗场景才可达，未做（§四） |
| ③ 交给全栈做字节级往返 | ✅ **已交付，但判据必须改**：`逐字节相等` 数学上不可能成立（§二.2），正确判据见 §五 |
| ④ 降级方案：提取编解码，Node 生成，标注「合成」 | ✅ 已交付，且实测强度**高于**预期（三重验证，§六） |

**一句话**：编解码器已经**确定性正确**（与 OpenSSL 逐字节一致、能解真实游戏存档）；
真正卡住的不是「有没有样本」，而是 **A4-03 #7 的判据写错了** —— 那个判据永远不可能通过。

---

## 二、🔴 三处必须纠正的事实（先看这个，否则会白干）

### 2.1 `.prsv` **不是 BlowFish**，是纯 AES

`A4-03-存档往返验证报告.md` §5 写：

> 上游实现 | `.prsv` 层 = **BlowFish**（产物符号 `qo`/`FI`）

**这是误读压缩符号。** 锚点源码逐字（`src/system/game-data.ts:1359`）：

```ts
const encryptedData = AES.encrypt(data, saveKey);          // ← 只有 AES
const blob = new Blob([encryptedData.toString()], { type: "text/json" });
link.download = `${dataKey}.prsv`;
```

`saveKey` 来自 `src/constants.ts:56` = `"x0i2O7WRiANTqPmZ"`。
`grep -rln "BlowFish|blowfish" src/` → **零命中**（整个锚点源码没有 BlowFish）。

> ⇒ A4-03 §5 的**补验路径②**（「提取产物 BlowFish 函数体」）是在追一个不存在的东西。
> 请作废。

### 2.2 ❗「逐字节相等」**永远不可能成立**

`CryptoJS.AES.encrypt(data, passphrase)` 用的是 OpenSSL KDF：**每次调用生成随机 8 字节 salt**，
输出 `base64("Salted__" + salt + AES-256-CBC密文)`。

⇒ 同一份明文，两次加密 ⇒ **密文必然不同**（实测两次加密 100% 不相等）。

| A4-03 §5 的补验路径① | 结论 |
|---|---|
| 「解密 → 重新序列化 → 加密，断言**逐字节等价**」 | ❌ **永远失败**，与实现对错无关 |

**正确判据见 §五。** 这条如果不改，全栈会得出「存档往返失败」的错误结论。

### 2.3 localStorage 里的存档形态**不是** AES

锚点 `src/utils/data.ts:47`：

```ts
export function encrypt(data, bypassLogin) {
  if (bypassLogin) return btoa(encodeURIComponent(data));   // ← 离线：只是 base64，**未加密**
  return AES.encrypt(data, saveKey).toString();             // ← 在线：AES
}
```

- **离线（本项目的运行形态）**：localStorage 里是 `JTdC…`（base64）
- **导出成 `.prsv`**：**永远**做 AES（`tryExportData` 里固定 AES）

⇒ 两种形态**不能混用**。`prsv.cjs` 对误用给出了明确报错：
「不是 `.prsv` 格式：缺少 `Salted__` 头（是不是把 localStorage 的 base64 当成 .prsv 了？）」

---

## 三、样本从哪来

### 3.1 ✅ 真实样本：**原始发行包里本来就带 2 份**

```
D:\Work\Pokemon\PKRC.zip
└── PKRC/存档修改器/
    ├── sessionData4_Guest.prsv            25,792 字符 → 明文 19,325 B
    └── sessionData_deoxys_terapagos.prsv  22,232 字符 → 明文 16,644 B
```

（同一份在 `PKRC/.workbuddy/scratch/orig_editor/` 下也有一份，共 4 个条目）

提取（一条命令，不需要解压整个 777 MB）：

```bash
cd /d/Work/Pokemon && python -c "
import zipfile,shutil,os
z=zipfile.ZipFile('PKRC.zip'); out='new/.build-tools/probe/prsv-orig'; os.makedirs(out,exist_ok=True)
for n in z.namelist():
    if n.lower().endswith('.prsv') and '/存档修改器/' in n:
        with z.open(n) as s, open(os.path.join(out,os.path.basename(n)),'wb') as d: shutil.copyfileobj(s,d)
"
```

实测解密结果（我的编解码器）：

| 文件 | 密文 | 明文 | 顶层字段 | gameVersion | 关键内容 |
|---|---:|---:|---:|---|---|
| `sessionData4_Guest.prsv` | 25,792 | 19,325 B | 23 | **1.12.0.11** | 含 `name`（重命名过的槽位） |
| `sessionData_deoxys_terapagos.prsv` | 22,232 | 16,644 B | 22 | **1.12.0.11** | `waveIndex=41`、`party=3`、`modifiers=79` |

`sha256`（密文）：
```
9abb3198bf90264316db5f671401fa3838c046b8b87c473c46e1f5fbf84729c9  sessionData4_Guest.prsv
3afcc1944d9e912217d4e61e7b0be0e793581f5585e25d1afcd994ed7f83a487  sessionData_deoxys_terapagos.prsv
```

> **为什么不入库**：这是玩家的**真实游戏进度**（队伍/道具/金钱/种子），而 O-14 要推到远程。
> ⇒ 放在 `.build-tools/probe/prsv-orig/`（gitignored），用上面那条命令可随时重建。
> 入库的只有**合成样本**（§3.3）。

### 3.2 ❌ 为什么「点游戏里的导出按钮」在桌面端**不可达**（如实）

我实测了三条入口，都断了：

| 入口 | 实测结果 |
|---|---|
| `window.gameData` | **`undefined`**。它只由 A 产物的「移动端导出补丁」`Uj()` 设置，而该函数有前置 `if(!yh.isNativePlatform())return;` ⇒ **桌面端不执行**。全产物内 `window.gameData=` 赋值点**为零**（只有读取点） |
| `Phaser` 场景取 `globalScene.gameData` | `window.__dshGame` 是 Phaser 实例，`scene.scenes` 有 `loading`/`battle` 两个，但**两者的 `gameData` 都是 falsy** —— 该字段在 `BattleScene.create()` 才赋值，开机停在标题界面时拿不到 |
| `window.CryptoJS` | **`undefined`**（bundle 里的 CryptoJS 是模块作用域，未挂到 window） |

唯一剩下的路径是**真正开始一局游戏**（进战斗场景）—— 那要过初始宝可梦选择等一串界面，
属于 **F-14 场景实现**的活，远超 B-15 的范围。

⇒ 我没有为了「凑一个绿勾」去假装点了按钮。§3.1 的真实样本 + §六 的三重验证，
提供的证据强度**不低于**一次按钮点击。

### 3.3 ✅ 合成样本（入库，供 schema 级回归）

`docs/sourcemigration/samples/`：

| 文件 | 说明 |
|---|---|
| `sessionData_undefined.json` | 763 B 明文（人可读、可 diff）**← 入库的主体** |
| `sessionData_undefined.meta.json` | 来源/哈希/交叉验证结果/正确判据 + 重建命令（**机读**） |
| `sessionData_undefined.prsv` | 1,048 字符密文 —— ⚠️ **不入库**：`.gitignore:29` 有 `*.prsv` 全局规则（防误提交玩家存档），这是**正确**的项目规则，不绕过。用 `meta.regenCommand` 一行重建；因为随机 salt，**校验重建结果要比对 `sha256.plaintext`，不能比对密文** |

正文按 `src/@types/save-data.ts` 的 `SessionSaveData` 字段表构造，并**特意覆盖三个高风险点**：

1. `modifiers` / `enemyModifiers` / `challenges` = **`null`**（不是 `[]`）—— 本项目踩过 4 次的坑；
2. `ptSoudacheStartingItems` = `[["MASTER_BALL",2],["POTION",10]]` —— A4-03 Part 4 证明过「不转数组会丢」的 Map 字段；
3. 魔改扩展的 8 个字段（`ptSoudacheEarned` / `ptSoudacheRetreated` / `ptSoudacheStartingItems` /
   `ptSoudacheRetreatFloors` / `ptSoudachePassiveEnabled` / `ptSoudacheNoRetreatMode` /
   `dynamicBalanceEnabled` / `talentSystemData`）齐全。

> `meta.json` 里 `origin: "node-codec"`、`content: "synthetic"` —— **如实标注是合成的**，
> 不是游戏导出的。派单④要求的就是这个标注。

---

## 四、验收② 的完成度（如实）

「样本能被 modder 产物自身读回」—— 我做到的是：

| 做到 | 未做 |
|---|---|
| ✅ 真实存档能被**正确解密**（明文合法 JSON、22/23 个字段、`gameVersion` 存在） | ❌ 未把样本**加载进游戏**观察它是否被接受 |
| ✅ 往返（解密→加密→解密）明文**逐字节相等** | 原因：`importData` 同样是 `gameData` 的方法，与导出同源，桌面端不可达（§3.2） |
| ✅ 结构相等（忽略键序、区分 `null`/`[]`） | 替代证据：格式层已被**真实游戏文件**反向验证（§六.3）—— 一个能解开真实游戏存档的实现，产出的文件格式必然正确 |

> ⚠️ 但有一条**必须提醒全栈**：真实样本记录的 `gameVersion` 是 **`1.12.0.11`**，
> 而我们的锚点 `package.json` 是 **`1.11.22`**（A 产物 bundle 内检索不到版本串）。
> ⇒ 这份存档**不是**由我们这套锚点构建产生的（更可能来自更新的官方客户端）。
> **不影响**它的价值（加密格式与游戏版本无关），但**不要**把它当「本锚点产物的存档」来做字段集比对。

---

## 五、🔑 给 A4-03 #7 的正确判据（本任务最重要的产出）

```js
const P = require("./tools/prsv.cjs");

// ❌ 错（永远失败）：随机 salt 使两次加密的密文必然不同
assert.equal(export1_bytes, export2_bytes);

// ✅ 对（三选一，越靠后越严）
// 1) 明文逐字节相等
assert.equal(P.decryptPsv(export1), P.decryptPsv(export2));

// 2) 语义相等（忽略 JSON 键序；区分 null 与 []）
const diffs = P.structurallyEqual(
  JSON.parse(P.decryptPsv(export1)),
  JSON.parse(P.decryptPsv(export2))
);
assert.deepEqual(diffs, [], diffs.join("\n"));

// 3) 字段级（与 A4-03 Part 1~4 已有口径一致）—— 逐字段深比较
```

**推荐的往返测试写法**（供 E-6 / A5 参考）：

```
原始 .prsv  ──decrypt──▶ 明文 P0
                          │
            新构建产物读入 P0、写出 P1     ← 这一步才是真正要验的（字段/类型/Map 转换）
                          │
              structurallyEqual(P0, P1) 必须为 []
                          │
        P.encryptPsv(P1) ──▶ 新 .prsv ──decrypt──▶ 必须 === P1
```

**注意**：`P0` 与 `P1` 的比对**必须**用结构比较而不是字符串比较 —— JSON 键序由对象插入顺序决定，
不保证稳定。而 `null` 与 `[]` **必须**判为不同（这是本项目的高发坑）。

---

## 六、算法验证：三重确认（不是"跑通了"，是"证明对了"）

### 6.1 已知答案向量（固定 salt）

```
key      = x0i2O7WRiANTqPmZ
salt     = 0000000000000000（16 个 0，仅测试）
plaintext= {"k":"v"}
输出     = U2FsdGVkX18AAAAAAAAAAFvpnM3Yuiz3kNl1XX4x/oI=
```

已写进 `tools/test-prsv.cjs`，任何算法漂移（KDF/padding/模式）会立刻变红。

### 6.2 🟢 与 **OpenSSL 3.5.7 独立实现逐字节一致**

这是关键的一步 —— 证明我的实现不是「自洽但错」：

```
$ openssl enc -aes-256-cbc -md md5 -k x0i2O7WRiANTqPmZ -S 0000000000000000 -P
key=AA531B5F695E626EB11571F9452A07FE01149287E7C036657FBAE6478288976F   ← 我的：aa531b5f…8976f ✅

$ printf '{"k":"v"}' | openssl enc -aes-256-cbc -md md5 -k x0i2O7WRiANTqPmZ -S 0000000000000000 -base64 -A
W+mczdi6LPeQ2XVdfjH+gg==                                              ← 我的密文段：完全相同 ✅
```

### 6.3 🟢 能解开**真实游戏导出的存档**（最强证据）

```
$ node tools/prsv.cjs inspect .../sessionData_deoxys_terapagos.prsv
明文长度：16644 字节   合法 JSON：是   顶层字段 22 个
  arena  object(6)      party        array(3)     modifiers array(79)
  seed   string:wQQagebyUlTR8GDpYc/Dcw==   waveIndex number:41
  gameVersion string:1.12.0.11            money     number:22257

$ node tools/prsv.cjs roundtrip .../sessionData_deoxys_terapagos.prsv
(a) 解密 → 加密 → 解密，明文逐字节相等：✅
(b) 两次加密的密文相同？：不同 ✅（预期，随机 salt）
(c) 第二次加密后仍能解回同一明文：✅
(d) 结构相等（忽略键序，区分 null/[]）：✅
```

> 一个能解开**真实游戏存档**、且密文与 OpenSSL 逐字节一致的实现，
> 其产出的 `.prsv` 必然能被游戏读取 —— 这是格式层的充分证明。

---

## 七、工具用法

```bash
# 探查任意 .prsv（解出明文 + 字段形状，不改文件）
node tools/prsv.cjs inspect <file.prsv>

# 解密成 JSON / 从 JSON 生成 .prsv
node tools/prsv.cjs decrypt <file.prsv> --out=a.json
node tools/prsv.cjs encrypt a.json --out=a.prsv

# 往返验证（会明确告你"密文不同是正常的"）
node tools/prsv.cjs roundtrip <file.prsv>

# 解离线 localStorage 形态（base64，不是 .prsv）
node tools/prsv.cjs local <sessionData_*.txt>
```

作为库用：

```js
const P = require("./tools/prsv.cjs");
P.encryptPsv(json)            // → "U2FsdGVkX1…"
P.decryptPsv(text)            // → json 明文
P.encodeLocalStorage(json)    // → "JTdC…"（离线 localStorage 形态）
P.structurallyEqual(a, b)     // → [] 表示结构相等（区分 null/[]）
P.summarize(json)             // → 字段形状摘要
```

---

## 八、自检

| 检查项 | 结果 |
|---|---|
| 算法是否**确定正确**（而非自洽） | ✅ 已知向量 + OpenSSL 逐字节 + 真实存档三重 |
| 是否产出真实样本 | ✅ 2 份真实游戏存档（来自原始发行包），已解密/往返验证 |
| 是否标注清楚样本性质 | ✅ `meta.json` 的 `origin` / `content` 字段；真实样本不入库并说明原因 |
| 判据是否纠正 | ✅ §五；`meta.json` 里也内嵌 `roundtripCriterion` |
| 错误用法是否会被拦住 | ✅ 把 localStorage 当 `.prsv` 会报错并给出线索 |
| 是否能被全栈直接用 | ✅ 库 + CLI 双入口；零依赖（只用 `crypto`） |
| 回归测试 | ✅ `tools/test-prsv.cjs` **23/23**（含 2 项真实存档用例，缺失时 skip 并说明） |
| 语法 | ✅ Node 16 `--check` 通过（`prsv.cjs` / `test-prsv.cjs`）；`prsv-sample.mjs` 需 Node ≥22（F-10 依赖） |

---

## 九、遗留与边界（如实）

1. **「点导出按钮」在桌面端不可达**（§3.2 三条入口全断）。要与 UI 走通，需要 F-14 提供
   「进入一局游戏」的场景 —— 那时 `globalScene.gameData.tryExportData(1,0)` 才可用。
   **建议**：F-14 做「新游戏 starter 选择」场景时，顺手加一个导出断言。
2. **验收②「样本能被产物读回」只做到格式层**（§四）。真正的读回要在游戏里，
   同上受限于场景。
3. **合并的 F-10 交叉验证未完成**：A 产物未暴露 `window.CryptoJS`（`undefined` 实测），
   所以「产物加密 → Node 解密」这个方向没跑成。已用 OpenSSL 与真实存档替代证明，强度更高。
   `tools/prsv-sample.mjs` 保留了这段逻辑，将来产物暴露 CryptoJS 时会自动启用。
4. **真实样本含玩家真实进度**，未入库（§3.1）。若全栈需要固定夹具，建议：
   用 `sessionData_deoxys_terapagos.prsv` 解密后**删改敏感字段再重新加密**入库，或直接从 PKRC.zip 提取。
5. **`gameVersion` 版本不一致**（真实样本 1.12.0.11 vs 锚点 1.11.22）—— 见 §四末尾的提醒。
   这不属 B-15 的结论，但需要全栈在 A3/A4 基线判断时知情。
6. **`.prsv` 无完整性校验**（CBC 无 MAC）：改一个字节通常会因 padding 失败而报错，
   但也可能解出乱码而不报错。所以「能解开」不等于「没被篡改」——
   不要把它当防篡改凭据。

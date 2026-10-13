# shared/runtime — 便携 Node 运行时放置处

本目录约定放置**便携版 Node.js 运行时**（随发行版分发，无需系统安装 Node）。
二进制文件不入库（见根 .gitignore），从原发行包根目录复制以下文件到此：

```
node.exe
npm / npm.cmd
npx / npx.cmd
corepack / corepack.cmd
nodevars.bat
install_tools.bat
node_etw_provider.man
node_modules/            # express 等服务器依赖（或在 game/ 下 npm install 后复制）
```

## express 依赖

`game/server/server.cjs` 只依赖 `express`（声明见 `game/package.json`）。
两种准备方式任选其一：

1. 从原发行包根目录复制整个 `node_modules/` 到本目录；
2. 在 `game/` 目录下执行 `..\shared\runtime\npm install`（用本目录的便携 npm）。

> 注：`game/package.json` 中还声明了 `http-proxy-middleware`，但 `server.cjs`
> 并未引用它（疑似遗留依赖），安装缺失不影响运行。

## 启动链

```
game/start-game.bat
  ├─ shared/runtime/node.exe  game/server/server.cjs   （Express 静态服务，监听 8000）
  └─ game/pokerogue-win32-x64/pokerogue.exe            （Electron 加载 localhost:8000）
```

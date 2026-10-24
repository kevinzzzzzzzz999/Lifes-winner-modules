# Application Shell / 独立应用壳

A working local document and workspace shell extracted from InkSpace's application entry and window routing. Open a folder, browse real files, preview text, switch tabs, and open several independent windows. / 从 InkSpace 应用入口与窗口路由拆出的可运行软件壳：选择真实文件夹、浏览文档、只读预览文本、切换标签和管理多个窗口。

The core is a standalone Node library with **no production dependencies**. A separate Electron example has its own pinned dependencies and lockfile. / 核心是无生产依赖的独立 Node 库；Electron 示例自带固定版本依赖和锁文件。

## Download, install and run / 下载后安装与启动

Extract the `application-shell` ZIP and enter its top-level folder, where `index.cjs` and `package.json` are located. Requires Node **24.15+**, npm, and a graphical desktop for the example. / 解压后进入包含 `index.cjs`、`package.json` 的文件夹。需要 Node 24.15+、npm；示例需要桌面图形环境。

```sh
cd application-shell
npm install --ignore-scripts
npm test
cd examples/electron
npm ci --ignore-scripts
node node_modules/electron/install.js
npm start
```

The last install command downloads Electron's official binary. npm packages come from the official npm registry; Electron binaries come from the official Electron GitHub releases. Electron **44.3.0** and Playwright **1.62.1** are locked in the example. No full InkSpace installation, original App directory, or account is required. / 最后一条安装命令下载 Electron 官方运行文件。npm 包来自官方 registry，Electron 来自官方 GitHub Releases。无需安装完整版、无需原 App 目录或账户。

- **Open workspace / 打开工作区**: choose a folder using the native picker. A new window lists supported files and nested folders.
- **Open document / 打开文档**: choose one document. Only that file is authorized; adjacent files stay inaccessible.
- **Tabs / 标签**: select files to open; a second selection focuses the existing tab. Use **Cmd/Ctrl K** to filter and switch open tabs.
- **Windows / 窗口**: use New window, Cmd/Ctrl N, or Cmd/Ctrl Shift O. Each window has its own permissions and tabs.
- **Home / 首页**: cover the workspace and return without resetting reading state. Reactivating the application preserves the chosen route.
- **System opens / 系统打开**: the host listens for `open-file` and `open-url` before ready. Pending document requests survive renderer reloads until explicitly acknowledged.

UTF-8 text, Markdown, JSON, Notebook source, code, TeX, CSV and HTML are previewed as **plain text**, up to **512 KiB** per file. HTML/scripts are never executed. Supported binary documents return a descriptor stating that a host editor is required. / UTF-8 文本、Markdown、JSON、Notebook 源文件、代码、TeX、CSV 和 HTML 均以纯文本只读预览，单文件上限 512 KiB。二进制文档明确提示接入专用编辑器。

## Standalone library / 单独作为库使用

From the extracted folder, this complete example creates its own synthetic document, reads it through a workspace capability, and removes it. / 在解压目录执行；示例只创建和读取自己的临时测试文件。

```sh
node <<'JS'
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { DocumentCapabilities, DocumentTabs, HomeLaunchState } = require('./index.cjs');
(async () => {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'shell-example-'));
  try {
    await fs.writeFile(path.join(root, 'hello.md'), '# Hello\nA standalone workspace.');
    const capabilities = new DocumentCapabilities();
    const workspace = await capabilities.grantVault(root); // host-selected path only
    const tabs = new DocumentTabs();
    await tabs.open(workspace.id, 'hello.md', (id, name) => capabilities.read(id, name));
    console.log(tabs.current().document.text);
    const home = new HomeLaunchState();
    home.continueToWorkspace();
    home.phaseChanged('background');
    home.phaseChanged('active');
    console.log({ showsHome: home.showsHome }); // false: workspace stays open
  } finally { await fs.rm(root, { recursive: true, force: true }); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
JS
```

To install into another project, pack this standalone folder, then install its tarball from your project. / 接入其他项目时先打包，再在目标项目安装生成的文件。

```sh
npm pack --ignore-scripts
# In your own project / 在你的项目中：
npm install /path/to/inkspace-modules-application-shell-0.1.0.tgz --ignore-scripts
```

```js
const { DocumentCapabilities, WindowContexts, ExternalDocumentOpen,
  ScopedIPCRouter, DocumentTabs, HomeLaunchState,
  parseOpenURL, routeOpenURL, installDocumentMenu } = require('@inkspace-modules/application-shell');
```

`/path/to/...` above is a placeholder for the tarball you just made. There is no sibling-package or original-App dependency. / 上面的 `/path/to/...` 需要替换为刚生成文件的位置，不依赖其他模块的源码目录。

## Host contracts and system integration / 宿主契约与系统入口

- `DocumentCapabilities.grantVault(absoluteCanonicalFolder)` and `grantDocument(absoluteCanonicalFile)` are **main-process only** and must follow an explicit picker/OS selection. `descriptor()` returns UUID/name/kind, never an absolute path. `list(id, relativePath)` and `read(id, relativePath)` validate the capability, root identity and path again; hidden paths, traversal, symbolic links and multiply-linked files are rejected. Folder listings are capped at 4096 entries. / 授权函数只用于宿主侧，必须来自用户的文件或文件夹选择；网页侧只接收 UUID 和相对名称。
- `WindowContexts` requires Electron-like windows with `webContents.id`, `mainFrame`, `send()` and destruction checks. `invoke(event, input, callback)` checks the exact main frame and per-window grant, and preserves the initiating context across awaits. It does **not** make an untrusted loader safe by itself. / IPC 始终核验发起窗口与主 frame，不以当前焦点决定权限。
- `ExternalDocumentOpen.configure({vaults, windows, createWindow, reveal})` uses the supplied adapters. Install OS handlers before ready, enqueue a host-selected absolute document, then let the renderer subscribe and call `list(context)`. Acknowledge only after successful display. `reset()` keeps requests during reload; `remove()` clears a closed window. The included example wires this end to end. / 系统打开请求先排队，成功显示后确认，重载不丢请求。
- `DocumentTabs.open(id, path, loader)` deduplicates tabs and ignores superseded reads. `markDirty()` plus `close()` protects host editor drafts; a host must save or explicitly discard. This read-only demo creates no drafts. / 接入编辑器后可设置 dirty 状态保护未保存内容。
- `HomeLaunchState` is a JavaScript port of the original pure iOS routing model. It preserves the chosen workspace through activation/background transitions. It does not implement SwiftUI scenes, iOS document associations, or native editors. / 这是 iOS 启动路由模型的可移植实现，原生 SwiftUI 场景与编辑器仍由接入者提供。

`parseOpenURL()` accepts only `inkspace-shell-demo://open?workspace=<UUID>&path=<relative-document>`; the workspace must already have been explicitly authorized in this running session. Duplicate/extra parameters, absolute paths, network URLs and traversal are rejected. No persistent workspace history is saved. A cold process therefore cannot restore a former session UUID. / 协议只打开本次会话已授权工作区里的相对文档，关闭重启后不恢复旧授权。

**The demo never registers or changes any OS file/protocol association**, including `inkspace://`. To integrate OS clicks into your own packaged app, deliberately choose your own scheme and document associations, configure its platform manifest, and wire Electron's `open-file`, `open-url` and `second-instance` events as shown in `main.cjs`. macOS protocol launch requires a packaged app declaration. The demo uses a fresh temporary profile on every CLI launch, so separate launches have separate sessions; it does not claim cross-process single-instance persistence. / 本示例不改任何系统默认软件或协议。需要打包后的系统点击入口时，由接入者明确配置自己的协议和文档类型，再连接已提供的处理器。

The renderer has no Node access, generic IPC channel, arbitrary filesystem API, command execution, remote navigation, popup, camera/microphone permission or active HTML preview. Only three bundled UI assets are served by the internal scheme. Selected documents go through bounded read-only APIs. Its own temporary profile is removed on clean quit; an abnormal termination can leave that empty-demo cache in the OS temporary directory. / 网页端没有 Node、通用命令或任意路径接口；临时配置仅属于本示例，正常退出时删除。

## Validation / 验证

```sh
npm test
cd examples/electron
npm run test:e2e
```

Core tests use newly created synthetic files: real directory/document grants, symlink/hard-link and replacement rejection, text limits, sender/window isolation, asynchronous context retention, early-open queue, reload acknowledgement, URL routing, tabs, dirty close and home lifecycle. The Electron test launches an actual process and checks rendered file previews, nested browsing, quick switch, multiple windows, isolated grants, OS event adapters, reload and renderer restrictions. The trusted native picker **result** is substituted with synthetic paths; the native picker dialog UI and OS registration are not automated. / 核心检查使用合成文件；Electron 检查真正启动进程、读取文件并操作窗口。测试替换的是宿主原生选择器返回值，未声称自动点击系统选择器或登记系统协议。

Validated on Apple Silicon macOS with Node 24.19.0. Linux/Windows require Electron's normal supported desktop/runtime dependencies and have not been run here. See [Electron protocol documentation](https://www.electronjs.org/docs/latest/api/protocol) and [application lifecycle documentation](https://www.electronjs.org/docs/latest/api/app). Source mappings and exact original-file hashes are in [ORIGIN.md](resources/ORIGIN.md).

The complete InkSpace editors, account/cloud services, native iOS shell, packaging, signing, notarization and automatic updating are host integration work. This download already runs as a local read-only document shell; connect a real editor by replacing the bounded `vaults.read` loader and retaining the window and grant checks. / 完整编辑器、账户云服务、原生 iOS 壳、签名打包与自动更新需要宿主集成；当前下载本身可以独立运行成本地只读文档壳。

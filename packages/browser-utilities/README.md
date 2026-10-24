# 网页会话与链接工具

URL验证、文件链接路由、浏览会话存储、AI页面就绪检查、粘贴/下载与权限策略。

URL validation, session restoration and browser/AI integration helpers with a host-supplied browser engine.

## 从独立ZIP开始

下载 `node-browser-utilities.zip`，解压后进入包含 `package.json` 的 `browser-utilities/` 目录。安装要求是 Node.js 24.15 或以上以及 npm。

```sh
cd browser-utilities
npm install --ignore-scripts
npm test
```

这三个命令在本包目录执行，不要求存在 `packages/` 父目录。原应用不参与安装。功能需要的浏览器、原生桥、运行引擎或调用者接口见下方“使用边界”。

## 接入自己的项目

先在解压的本包目录生成 npm 安装包：

```sh
npm pack --ignore-scripts
```

再进入你自己的 Node.js 项目，安装生成的文件：

```sh
npm install /path/to/inkspace-modules-browser-utilities-0.1.0.tgz --ignore-scripts
```

这种安装会按本包的 `package.json` 获取声明的 npm 依赖。包名仅用于本地项目引用；无需登录 npm，也不需要完整 Life's winner。安装后可运行以下最小示例：

```js
const tools = require('@inkspace-modules/browser-utilities');
console.log(tools.urls.webURL('https://example.test'));
```

## API 命名空间

- `urls` → [源码与函数签名](sources/main/browser-security.cjs)
- `routing` → [源码与函数签名](sources/main/browser-link-routing.cjs)
- `sessions` → [源码与函数签名](sources/main/browser-state.cjs)
- `web` → [源码与函数签名](sources/main/board-web-url.cjs)
- `network` → [源码与函数签名](sources/main/board-web-network.cjs)
- `providers` → [源码与函数签名](sources/main/ai-web-providers.cjs)
- `pageHealth` → [源码与函数签名](sources/main/ai-page-health.cjs)
- `downloads` → [源码与函数签名](sources/main/ai-downloads.cjs)
- `mediaPermissions` → [源码与函数签名](sources/main/ai-media-permissions.cjs)
- `images` → [源码与函数签名](sources/main/ai-image-transfer.cjs)

- `extensions` → [源码与函数签名](sources/main/browser-extensions.cjs)

原始函数签名保留在 `sources/`；`lib/` 中的 TypeScript 已转换为 CommonJS，可直接 require，无需现场编译。

## 依赖

Node.js 24.15 或以上。

无外部 npm 依赖，只使用 Node.js 标准库。

## 扩展管理服务

`tools.extensions.BrowserExtensions` 保留原扩展快照安装、权限摘要、启停、卸载和状态持久化逻辑。调用方显式注入 `session.extensions`（`loadExtension`/`removeExtension`）、`dialog`（目录选择/确认）和 `getWindow`，以及自己授权的私有状态目录 `directory`。本包不导入 Electron，不创建窗口、不执行真实浏览器扩展；可连接支持这些接口的浏览器宿主。

```js
const {BrowserExtensions} = tools.extensions;
// hostSession / hostDialog / hostWindowCallback 由调用方提供。
const manager = new BrowserExtensions({
  session: hostSession, dialog: hostDialog, getWindow: hostWindowCallback,
  directory: extensionStateDirectory
});
await manager.initialize();
```

拒绝复制符号链接、过深目录、超大文件和不受支持的文件类型。安装使用独立快照；更改原扩展文件夹不会悄悄改变已接受的副本。真实浏览器对扩展API的兼容性仍需要调用方验证。

## 使用边界

URL/会话数据处理可在Node使用；页面、权限、剪贴板等策略接受宿主对象，不附带浏览器界面或用户登录状态。需要真实浏览器的行为仍由调用者集成与验收。

服务类仅保存调用者指定的位置；应传入独立测试目录和明确授权的输入。模块不附带用户笔记、登录状态、设备标识或服务密钥。

## 验证

运行 `npm test`。相关应用回归已迁移到本包的 `test/`，直接通过本包副本调用；未迁移的整应用验收不属于此包的通过声明。本次新增能力还通过了 npm pack 后的新消费者安装与包内行为测试；未使用完整App、真实浏览器/钥匙串或外部网络。逐包检查汇总在 GitHub 下载目录的 `modules.json` 与 `VALIDATION.md`；这两个汇总文件不参与本包运行。 本次已在仓库外的独立副本验证：46 项测试通过，0 失败、0 跳过。

## 许可

原创代码采用本包 `LICENSE` 中的 MIT 许可。第三方 npm 依赖和保留在 vendor 目录的组件继续遵守各自许可。

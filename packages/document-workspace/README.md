# 文档链接与工作区状态

内部文档链接、文件树/标签状态、自动保存接受规则、文档缩放、快捷键、富文本和公式片段。

Workspace links, document zoom, Notebook source state, Markdown and math formatting utilities.

## 从独立ZIP开始

下载 `node-document-workspace.zip`，解压后进入包含 `package.json` 的 `document-workspace/` 目录。安装要求是 Node.js 24.15 或以上以及 npm。

```sh
cd document-workspace
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
npm install /path/to/inkspace-modules-document-workspace-0.1.0.tgz --ignore-scripts
```

这种安装会按本包的 `package.json` 获取声明的 npm 依赖。包名仅用于本地项目引用；无需登录 npm，也不需要完整 InkSpace。安装后可运行以下最小示例：

```js
const tools = require('@inkspace-modules/document-workspace');
console.log(tools.links.internalFileAnchor('inkspace://open?file=notes%2Fexample.md'));
console.log(tools.zoom.clampDocumentZoom(10));
```

## API 命名空间

- `links` → [源码与函数签名](sources/shared/internal-file-links.ts)
- `tree` → [源码与函数签名](sources/renderer/file-tree-management.ts)
- `kinds` → [源码与函数签名](sources/renderer/workspace-file-kinds.ts)
- `tabs` → [源码与函数签名](sources/renderer/external-open-tabs.ts)
- `autosave` → [源码与函数签名](sources/renderer/autosave-tabs.ts)
- `zoom` → [源码与函数签名](sources/renderer/document-zoom.ts)
- `workspace` → [源码与函数签名](sources/renderer/PDFWorkspaceState.ts)
- `pagePreviews` → [源码与函数签名](sources/renderer/BoardPagePreviews.ts)
- `shortcuts` → [源码与函数签名](sources/renderer/app-shortcuts.ts)
- `menus` → [源码与函数签名](sources/main/document-menu.cjs)
- `contextMenu` → [源码与函数签名](sources/main/editable-context-menu.cjs)
- `richText` → [源码与函数签名](sources/renderer/clipboard-rich-text.ts)
- `math` → [源码与函数签名](sources/renderer/rich-text-math.ts)
- `exportView` → [源码与函数签名](sources/renderer/export-view.ts)
- `externalOpen` → [源码与函数签名](sources/main/external-document-open.cjs)
- `preparationDeadline` → [源码与函数签名](sources/renderer/office-preparation-deadline.ts)

原始函数签名保留在 `sources/`；`lib/` 中的 TypeScript 已转换为 CommonJS，可直接 require，无需现场编译。

## 依赖

Node.js 24.15 或以上。

- `katex@0.18.7`
- `marked@18.0.13`

## 使用边界

链接/缩放/状态规则是纯函数。富文本解析、公式HTML、Canvas导出与宿主菜单动作需要调用者提供DOM或宿主动作接口；本包不附带窗口、浏览器或编辑器UI。

服务类仅保存调用者指定的位置；应传入独立测试目录和明确授权的输入。模块不附带用户笔记、登录状态、设备标识或服务密钥。

## 验证

运行 `npm test`。相关应用回归已迁移到本包的 `test/`，直接通过本包副本调用；未迁移的整应用验收不属于此包的通过声明。逐包检查汇总在 GitHub 下载目录的 `modules.json` 与 `VALIDATION.md`；这两个汇总文件不参与本包运行。 本次已在仓库外的独立副本验证：13 项测试通过，0 失败、0 跳过。

## 许可

原创代码采用本包 `LICENSE` 中的 MIT 许可。第三方 npm 依赖和保留在 vendor 目录的组件继续遵守各自许可。

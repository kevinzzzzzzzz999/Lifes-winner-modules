# PDF文档工具

原有OneNote连续画布重排、几何校验、批注隐藏预览、阅读缩放与选区计算；另提供显式PDF合并和页提取封装。

Extract or combine PDF pages, handle OneNote PDF layouts and calculate PDF view geometry.

## 从独立ZIP开始

下载 `node-pdf-tools.zip`，解压后进入包含 `package.json` 的 `pdf-tools/` 目录。安装要求是 Node.js 24.15 或以上以及 npm。

```sh
cd pdf-tools
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
npm install /path/to/inkspace-modules-pdf-tools-0.1.0.tgz --ignore-scripts
```

这种安装会按本包的 `package.json` 获取声明的 npm 依赖。包名仅用于本地项目引用；无需登录 npm，也不需要完整 InkSpace。安装后可运行以下最小示例：

```js
const tools = require('@inkspace-modules/pdf-tools');
console.log(tools.zoom.clampPDFReaderZoom(100));
// await tools.extractPDFPages(pdfBytes, [0, 2]); // zero-based page indices
```

## API 命名空间

- `preview` → [源码与函数签名](sources/main/board-pdf-preview.cjs)
- `oneNote` → [源码与函数签名](sources/main/onenote-pdf.cjs)
- `geometry` → [源码与函数签名](sources/main/onenote-geometry-guard.cjs)
- `hd` → [源码与函数签名](sources/main/onenote-hd.cjs)
- `zoom` → [源码与函数签名](sources/renderer/pdf-reader-zoom.ts)
- `capture` → [源码与函数签名](sources/renderer/pdf-selection-capture.ts)
- `browserLinks` → [源码与函数签名](sources/renderer/browser-pdf-links.ts)
- `translationExport` → [源码与函数签名](sources/main/pdf-translation-export.cjs)

原始函数签名保留在 `sources/`；`lib/` 中的 TypeScript 已转换为 CommonJS，可直接 require，无需现场编译。

## 依赖

Node.js 24.15 或以上。

- `pdf-lib@1.17.1`

## 使用边界

PDF字节工具依赖pdf-lib；合并/提取封装只处理显式传入的字节，不改磁盘原件。Canvas选区绘制需要浏览器上下文。连续OneNote重排保留原实现的支持范围和拒绝规则。

服务类仅保存调用者指定的位置；应传入独立测试目录和明确授权的输入。模块不附带用户笔记、登录状态、设备标识或服务密钥。

## 验证

运行 `npm test`。相关应用回归已迁移到本包的 `test/`，直接通过本包副本调用；未迁移的整应用验收不属于此包的通过声明。逐包检查汇总在 GitHub 下载目录的 `modules.json` 与 `VALIDATION.md`；这两个汇总文件不参与本包运行。 本次已在仓库外的独立副本验证：33 项测试通过，0 失败、0 跳过。

## 许可

原创代码采用本包 `LICENSE` 中的 MIT 许可。第三方 npm 依赖和保留在 vendor 目录的组件继续遵守各自许可。

## PDF合并与拆分封装

`mergePDFs([bytesA, bytesB])` 按输入顺序复制页面；`extractPDFPages(bytes, [0, 2])` 按从零开始的页码及指定顺序提取页面；`splitPDF(bytes, [[0, 1], [2]])` 返回多个PDF字节结果。三个异步函数不读写磁盘。

这三个小封装是独立模块库新增的组合层，底层使用已声明的 pdf-lib；完整软件已有的OneNote重排和批注预览源实现同时保留。页级复制不保证复制文档级书签、交互表单或签名状态。输入、页数和输出大小有明确上限；加密或无效PDF由pdf-lib拒绝。

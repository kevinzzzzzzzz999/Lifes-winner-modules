# Office、PDF、TeX与文档笔记

DOCX/PPTX生成和模型回读、PDF模型封装、TeX进程适配、文档内容提取与旁注文件计划。

Reusable Office/PDF document models, TeX process adapters, content extraction and margin-note plans with explicit renderers and storage interfaces.

## 从独立ZIP开始

下载 `node-office-documents.zip`，解压后进入包含 `package.json` 的 `office-documents/` 目录。需要 Node.js 24.15 或以上以及 npm。

```sh
cd office-documents
npm install --ignore-scripts
npm test
```

这些命令在本包解压目录执行，不要求存在 `packages/` 父目录。

## 接入自己的项目

先在解压目录生成 npm 安装包：

```sh
npm pack --ignore-scripts
```

再在自己的 Node.js 项目中安装：

```sh
npm install /path/to/inkspace-modules-office-documents-0.1.0.tgz --ignore-scripts
```

安装将获取声明的 npm 依赖。无需完整 Life's winner，也无需登录 npm。最小 DOCX 生成示例：

```js
const tools = require('@inkspace-modules/office-documents');
const model = {version:1, format:'docx', title:'Example', blocks:[{kind:'paragraph', text:'Example text'}]};
tools.office.createOffice(model).then(bytes => console.log(bytes.length));
```

## API 命名空间

- `model` → [源码与函数签名](sources/main/editable-document-model.cjs)
- `office` → [源码与函数签名](sources/main/editable-office.cjs)
- `docxPreview` → [源码与函数签名](sources/main/docx-preview.cjs)
- `images` → [源码与函数签名](sources/main/office-embedded-images.cjs)
- `legacyDoc` → [源码与函数签名](sources/main/legacy-doc-preview.cjs)
- `pdf` → [可编辑PDF模型与打印适配](sources/main/document-pdf.cjs)
- `tex` → [Tectonic进程和缓存适配](sources/main/tex-service.cjs)
- `noteExtraction` → [提取/旁注文件计划](sources/main/note-extraction.cjs)

原始函数签名保留在 `sources/`；`lib/` 中的 TypeScript 已转换为 CommonJS，可直接 require，无需现场编译。

## 依赖

Node.js 24.15 或以上。

- `@xmldom/xmldom@0.8.15`
- `jszip@3.10.2`
- `mammoth@1.12.3`
- `pdf-lib@1.17.1`

## 文档提取与旁注

结构化DOCX/PPTX模型可以直接转成Markdown计划；PDF正文提取需要调用者提供自己的文本解析器。`createTextFile`是可选的写入接口，不提供时只返回文档计划：

```js
const tools = require('@inkspace-modules/office-documents');
(async () => {
  const extracted = await tools.noteExtraction.extractNote({
    path: 'documents/Example.docx', language: 'en',
    model: {version:1, format:'docx', title:'Example', blocks:[{kind:'heading', text:'Topic'}, {kind:'paragraph', text:'Synthetic content'}]}
  });
  console.log(extracted.name, extracted.content);
  console.log(tools.noteExtraction.marginNoteDocument({path:'documents/Example.pdf'}).name);
})();
```

`extractNote(input, host)`的可选host字段为 `extractPDFText(input)`、`htmlToText(html)` 和 `createTextFile(document)`。PDF解析返回 `{text, truncated}`；创建文件接收 `{parentPath, name, content, truncated}`。已有原文路径只作为来源引用，本包不会自行扫描资料库。

## PDF与TeX接入要求

- `pdf.createEditablePDF(model, printPDF)`需要一个返回真实PDF字节的渲染回调。`pdf.readPDFModel(bytes)`可独立读回本格式附带的模型；任意第三方PDF不一定含这种模型。
- `pdf.printDocumentPDF(model, {electron:{BrowserWindow,session}})`是显式的Electron打印适配，调用者自行提供Electron。纯Office创建、模型解析与笔记计划不要求Electron。
- `new tex.TexService({runtimePath, dataDirectory, seedCachePath, vaultService, onlyCached})`需要调用者提供Tectonic程序和可写状态目录；`seedCachePath`可选。包内没有Tectonic二进制或离线TeX资源。
- TeX的 `vaultService.snapshot(request, limit)`返回 `{data:Buffer, sha256}`；`createData(vaultId, parentPath, name, data)`接收编译出的PDF并返回包含 `path` 的结果。编译请求含 `{vaultId, path, expectedSHA256}`。未提供真实运行引擎时，`info()`报告不可用；进程替身测试不是实际TeX排版验证。
- 只支持现有基础Office模型，不承诺完全还原Word/PowerPoint排版；旧`.doc`只读转换使用Mac系统textutil，其他平台需提供转换器。

服务只使用调用者提供的输入和位置。示例为合成内容；包内不附带账号、凭据或用户资料。

## 验证

运行 `npm test`。相关应用回归已迁移到本包的 `test/`，直接通过本包副本调用；未迁移的整应用验收不属于此包的通过声明。逐包汇总位于GitHub下载目录的 `modules.json` 与 `VALIDATION.md`，不参与本包运行。 本轮新增PDF、TeX适配和笔记提取后，重新npm打包并安装到全新消费项目，11项测试全部通过，0失败、0跳过。TeX相关测试使用合成编译器验证进程与文件保护，不代表真实Tectonic排版已实测。

## 许可

原创代码采用本包 `LICENSE` 中的 MIT 许可。第三方 npm 依赖和保留在 vendor 目录的组件继续遵守各自许可。

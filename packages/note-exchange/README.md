# 笔记交换与纲要

Markdown/缩进纲要与白板转换、BoardNotes归档解析、对象解码、受限导入导出流程。

Markdown outline and note-archive conversion helpers, including the supported BoardNotes format.

## 从独立ZIP开始

下载 `node-note-exchange.zip`，解压后进入包含 `package.json` 的 `note-exchange/` 目录。安装要求是 Node.js 24.15 或以上以及 npm。

```sh
cd note-exchange
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
npm install /path/to/inkspace-modules-note-exchange-0.1.0.tgz --ignore-scripts
```

这种安装会按本包的 `package.json` 获取声明的 npm 依赖。包名仅用于本地项目引用；无需登录 npm，也不需要完整 InkSpace。安装后可运行以下最小示例：

```js
const tools = require('@inkspace-modules/note-exchange');
console.log(tools.outline.parseOutline('# Example\n## Section'));
```

## API 命名空间

- `exchange` → [源码与函数签名](sources/main/note-exchange.cjs)
- `outline` → [源码与函数签名](sources/main/note-outline.cjs)
- `archives` → [源码与函数签名](sources/main/boardnotes-zip.cjs)
- `objects` → [源码与函数签名](sources/main/boardnotes-objects.cjs)
- `format` → [源码与函数签名](sources/main/boardnotes-format.cjs)

原始函数签名保留在 `sources/`；`lib/` 中的 TypeScript 已转换为 CommonJS，可直接 require，无需现场编译。

## 依赖

Node.js 24.15 或以上。

- `pdf-lib@1.17.1`

## 使用边界

归档与纲要纯函数可直接使用。导入导出类需授权资料库接口；需要选择文件的方法接受调用者传入的dialog接口，未引入Electron。原Worker与相对路径资源一起保留。

服务类仅保存调用者指定的位置；应传入独立测试目录和明确授权的输入。模块不附带用户笔记、登录状态、设备标识或服务密钥。

## 验证

运行 `npm test`。相关应用回归已迁移到本包的 `test/`，直接通过本包副本调用；未迁移的整应用验收不属于此包的通过声明。逐包检查汇总在 GitHub 下载目录的 `modules.json` 与 `VALIDATION.md`；这两个汇总文件不参与本包运行。 本次已在仓库外的独立副本验证：1 项测试通过，0 失败、0 跳过。

## 许可

原创代码采用本包 `LICENSE` 中的 MIT 许可。第三方 npm 依赖和保留在 vendor 目录的组件继续遵守各自许可。

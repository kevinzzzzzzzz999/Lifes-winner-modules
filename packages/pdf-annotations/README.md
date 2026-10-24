# PDF批注与扩展记录

PDF批注侧车记录、投影、图层状态、原生笔迹字段及页边扩展模型。

PDF annotation sidecars and extended-page records with caller-provided storage.

## 从独立ZIP开始

下载 `node-pdf-annotations.zip`，解压后进入包含 `package.json` 的 `pdf-annotations/` 目录。安装要求是 Node.js 24.15 或以上以及 npm。

```sh
cd pdf-annotations
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
npm install /path/to/inkspace-modules-pdf-annotations-0.1.0.tgz --ignore-scripts
```

这种安装会按本包的 `package.json` 获取声明的 npm 依赖。包名仅用于本地项目引用；无需登录 npm，也不需要完整 InkSpace。安装后可运行以下最小示例：

```js
const tools = require('@inkspace-modules/pdf-annotations');
console.log(tools.layers.sidecarPath('example.pdf'));
```

## API 命名空间

- `layers` → [源码与函数签名](sources/main/pdf-layer-service.cjs)
- `nativeInk` → [源码与函数签名](sources/main/pdf-native-ink.cjs)
- `extensionModel` → [源码与函数签名](sources/main/pdf-extend-model.cjs)
- `extensionStore` → [源码与函数签名](sources/main/pdf-extend-service.cjs)

原始函数签名保留在 `sources/`；`lib/` 中的 TypeScript 已转换为 CommonJS，可直接 require，无需现场编译。

## 依赖

Node.js 24.15 或以上。

无外部 npm 依赖，只使用 Node.js 标准库。

## 使用边界

格式验证和记录投影可直接使用；文件存储服务需提供资料库root/resolve/snapshot等接口。不会自行修改原PDF，也不提供PencilKit编码器。

服务类仅保存调用者指定的位置；应传入独立测试目录和明确授权的输入。模块不附带用户笔记、登录状态、设备标识或服务密钥。

## 验证

运行 `npm test`。相关应用回归已迁移到本包的 `test/`，直接通过本包副本调用；未迁移的整应用验收不属于此包的通过声明。逐包检查汇总在 GitHub 下载目录的 `modules.json` 与 `VALIDATION.md`；这两个汇总文件不参与本包运行。 本次已在仓库外的独立副本验证：1 项测试通过，0 失败、0 跳过。

## 许可

原创代码采用本包 `LICENSE` 中的 MIT 许可。第三方 npm 依赖和保留在 vendor 目录的组件继续遵守各自许可。

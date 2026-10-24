# 离线数值计算

表达式解析、采样、微积分近似、回归/时间序列、现金流/贷款/债券/期权等教育数值函数。

An offline numerical expression engine with calculus, statistics, regression and financial math helpers.

## 从独立ZIP开始

下载 `node-math-lab.zip`，解压后进入包含 `package.json` 的 `math-lab/` 目录。安装要求是 Node.js 24.15 或以上以及 npm。

```sh
cd math-lab
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
npm install /path/to/inkspace-modules-math-lab-0.1.0.tgz --ignore-scripts
```

这种安装会按本包的 `package.json` 获取声明的 npm 依赖。包名仅用于本地项目引用；无需登录 npm，也不需要完整 InkSpace。安装后可运行以下最小示例：

```js
const tools = require('@inkspace-modules/math-lab');
const f = tools.engine.compile('x*x');
console.log(f({x:3}));
```

## API 命名空间

- `engine` → [源码与函数签名](sources/math-lab/engine.js)
- `simple` → [源码与函数签名](sources/math-lab/simple-core.js)

- `mathExport` → [源码与函数签名](sources/main/math-export.cjs)

原始函数签名保留在 `sources/`；`lib/` 中的 TypeScript 已转换为 CommonJS，可直接 require，无需现场编译。

## 依赖

Node.js 24.15 或以上。

无外部 npm 依赖，只使用 Node.js 标准库。

## 工作表导出校验

`tools.mathExport.decodeMathExport({name, mime, dataBase64})` 解析有界的 PNG、CSV 或 JSON 导出请求，返回 `{data, extension, name}`。它不会写文件、读剪贴板或触发浏览器下载；调用方决定保存位置。

```js
const json = Buffer.from(JSON.stringify({answer: 42})).toString('base64');
const output = tools.mathExport.decodeMathExport({
  name: 'worksheet.json', mime: 'application/json', dataBase64: json
});
console.log(output.name, output.data.toString('utf8'));
```

该校验保留8 MiB大小上限、严格base64/MIME/JSON/UTF-8检查和文件名净化。PNG检查只核对签名，不替代完整图像解码。

## 使用边界

现有双精度教育计算引擎；没有实时市场数据、联网、符号代数或数值精度保证。独立网页资源同时提供，财务公式不是投资建议。

服务类仅保存调用者指定的位置；应传入独立测试目录和明确授权的输入。模块不附带用户笔记、登录状态、设备标识或服务密钥。

## 验证

运行 `npm test`。相关应用回归已迁移到本包的 `test/`，直接通过本包副本调用；未迁移的整应用验收不属于此包的通过声明。本次新增能力还通过了 npm pack 后的新消费者安装与包内行为测试；未使用完整App、真实浏览器/钥匙串或外部网络。逐包检查汇总在 GitHub 下载目录的 `modules.json` 与 `VALIDATION.md`；这两个汇总文件不参与本包运行。 本次已在仓库外的独立副本验证：5 项测试通过，0 失败、0 跳过。

## 许可

原创代码采用本包 `LICENSE` 中的 MIT 许可。第三方 npm 依赖和保留在 vendor 目录的组件继续遵守各自许可。

# Python与IPython运行协议

显式运行Python、Notebook单元格读取与受限输出协议、重启和运行请求控制。

Python process and Notebook execution protocols, buffered output, cancellation and explicit kernel lifecycle.

## 从独立ZIP开始

下载 `node-notebook-runtime.zip`，解压后进入包含 `package.json` 的 `notebook-runtime/` 目录。安装要求是 Node.js 24.15 或以上以及 npm。Python执行回归还需要Python 3，可通过 `INKSPACE_TEST_PYTHON` 指定测试解释器。

```sh
cd notebook-runtime
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
npm install /path/to/inkspace-modules-notebook-runtime-0.1.0.tgz --ignore-scripts
```

这种安装会按本包的 `package.json` 获取声明的 npm 依赖。包名仅用于本地项目引用；无需登录 npm，也不需要完整 Life's winner。安装后可运行以下最小示例：

```js
const tools = require('@inkspace-modules/notebook-runtime');
const data = Buffer.from(JSON.stringify({nbformat:4, metadata:{}, cells:[{cell_type:'code', source:['1+1']}]}));
console.log(tools.notebooks.readCells(data, [0]));
```

## API 命名空间

- `notebooks` → [源码与函数签名](sources/main/notebook-service.cjs)
- `python` → [源码与函数签名](sources/main/python-service.cjs)
- `runController` → [源码与函数签名](sources/renderer/notebook-run-controller.ts)

原始函数签名保留在 `sources/`；`lib/` 中的 TypeScript 已转换为 CommonJS，可直接 require，无需现场编译。

## 依赖

Node.js 24.15 或以上。

无外部 npm 依赖，只使用 Node.js 标准库。

## 准备真实IPython运行环境

格式读取和运行状态等纯Node API可直接使用。当前真实Notebook进程服务限定 **Apple Silicon Mac、macOS 14或以上**。随包的固定轮子锁支持 **CPython 3.14**；需要该解释器和pip。下面的准备步骤从官方PyPI安装带摘要锁定的IPython、NumPy、Pandas、Matplotlib、psutil及Excel读取依赖到调用者指定的新目录，不修改系统Python。

```sh
python3 resources/prepare-runtime.py --destination /path/to/ipy-runtime
node resources/smoke-runtime.cjs --runtime /path/to/ipy-runtime --python /absolute/path/to/python3.14
```

两个路径是需要自行替换的示例；`--python`应指向运行准备步骤所用的同一个CPython 3.14。目标运行目录必须是不存在的新目录，并放在本包源码之外。准备步骤不输出或写入本机账号/解释器绝对路径到PROVENANCE。

生成的目录结构为：

```text
ipy-runtime/
  PROVENANCE.json
  packages/
    IPython/
    ...
```

`PROVENANCE.json`是可用性契约，至少包含 `pythonVersion` 和 `packages:[{name,version}]`。本包的 `resources/kernel.py` 是运行helper，不需要从完整应用寻找。真实smoke使用三段合成代码验证IPython结果、跨请求变量延续、Matplotlib PNG输出和正常关闭；不读取用户Notebook。

## NotebookService宿主契约

构造 `new tools.notebooks.NotebookService({vaultService, runtimePath, packagesPath, helperPath, dataDirectory})`：

- `runtimePath`：上面CPython 3.14可执行文件的绝对路径。
- `packagesPath`：生成的 `ipy-runtime/packages`；上一级必须有有效的 `PROVENANCE.json`。
- `helperPath`：本包 `resources/kernel.py` 的绝对路径。
- `dataDirectory`：调用者提供的可写状态目录。
- `vaultService.snapshot(request, maximumBytes)`：返回 `{data:Buffer, sha256, full}`，其中 `full` 是调用者授权的原Notebook完整路径。

运行请求包含 `{vaultId, path, expectedSHA256, runId, cellIndices}`；`path`以`.ipynb`结尾，`runId`为UUID，`expectedSHA256`为输入Notebook字节的SHA256。输出从服务的 `event` 事件读取；显式调用 `close()` 或 `dispose()`释放进程。完整的最小接入代码就在 `resources/smoke-runtime.cjs`。

没有内置Python二进制。代码执行使用本机进程权限，不是操作系统隔离；只有调用者显式请求才执行提供的代码。`info().pythonVersion`来自准备目录的元数据，缺失时返回 `unknown`，不冒称自动探测结果。

## 验证

本轮另从官方PyPI按锁定摘要准备了全新运行目录，在npm打包后的独立消费项目执行真实IPython检查：3个合成单元格、42/43结果、同一kernel变量延续、Matplotlib PNG输出和正常关闭均通过。此集成检查使用随包锁文件准备的外部运行目录；不计入下方18项生命周期回归。

运行 `npm test`。相关应用回归已迁移到本包的 `test/`，直接通过本包副本调用；未迁移的整应用验收不属于此包的通过声明。逐包检查汇总在 GitHub 下载目录的 `modules.json` 与 `VALIDATION.md`；这两个汇总文件不参与本包运行。 本次已在仓库外的独立副本验证：18 项测试通过，0 失败、0 跳过。

## 许可

原创代码采用本包 `LICENSE` 中的 MIT 许可。第三方 npm 依赖和保留在 vendor 目录的组件继续遵守各自许可。

运行协议回归使用合成代码；执行这部分测试需要 Python 3。可用 `INKSPACE_TEST_PYTHON` 指定本机测试解释器。测试不会读取用户 Notebook。

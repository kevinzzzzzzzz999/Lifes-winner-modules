# 知识索引与空间数学

Markdown链接/标签/模糊链接消歧、资料库扫描搜索、知识宫殿和漫游场景数学。

Index Markdown notes, tags, outgoing links, backlinks and search results using a caller-supplied document source.

## 从独立ZIP开始

下载 `node-knowledge-search.zip`，解压后进入包含 `package.json` 的 `knowledge-search/` 目录。安装要求是 Node.js 24.15 或以上以及 npm。

```sh
cd knowledge-search
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
npm install /path/to/inkspace-modules-knowledge-search-0.1.0.tgz --ignore-scripts
```

这种安装会按本包的 `package.json` 获取声明的 npm 依赖。包名仅用于本地项目引用；无需登录 npm，也不需要完整 Life's winner。安装后可运行以下最小示例：

```js
const tools = require('@inkspace-modules/knowledge-search');
console.log(tools.links.tagsOf('#example [[Second note]]'));
```

## API 命名空间

- `links` → [源码与函数签名](sources/main/knowledge-service.cjs)
- `palace` → [源码与函数签名](sources/renderer/knowledge-palace-math.ts)
- `metadata` → [源码与函数签名](sources/renderer/knowledge-space-metadata.ts)
- `walkMath` → [源码与函数签名](sources/renderer/knowledge-walk-math.ts)
- `walkRenderer` → [源码与函数签名](sources/renderer/knowledge-walk-renderer.ts)
- `walkGL` → [源码与函数签名](sources/renderer/knowledge-walk-gl.ts)

原始函数签名保留在 `sources/`；`lib/` 中的 TypeScript 已转换为 CommonJS，可直接 require，无需现场编译。

## 依赖

Node.js 24.15 或以上。

无外部 npm 依赖，只使用 Node.js 标准库。

## 使用边界

链接与数学函数可直接使用；KnowledgeService扫描需注入授权资料库接口，WebGL实际绘制需调用者提供浏览器Canvas/WebGL2。无示例私人资料。

服务类仅保存调用者指定的位置；应传入独立测试目录和明确授权的输入。模块不附带用户笔记、登录状态、设备标识或服务密钥。

## 验证

运行 `npm test`。相关应用回归已迁移到本包的 `test/`，直接通过本包副本调用；未迁移的整应用验收不属于此包的通过声明。逐包检查汇总在 GitHub 下载目录的 `modules.json` 与 `VALIDATION.md`；这两个汇总文件不参与本包运行。 本次已在仓库外的独立副本验证：1 项测试通过，0 失败、0 跳过。

## 许可

原创代码采用本包 `LICENSE` 中的 MIT 许可。第三方 npm 依赖和保留在 vendor 目录的组件继续遵守各自许可。

# 文档工作台 · iPhone / iPad PWA

静态浏览器应用，不依赖 Node、Electron、npm 或原 life'winner 安装。正式运行文件固定为 `index.html`、`app.js`、`logic.js`、`styles.css`，使用上一级的 `shared.js` / `shared.css`。主屏幕 manifest、图标、每应用独立 scope 的 Service Worker 和 HTTPS 托管由上级移动站点统一生成。

功能包括系统文件选择、真实 UTF-8 文本读取、最多 12 个标签、新建文本、编辑副本、明确保存到本机、重新打开本机草稿、删除草稿，以及独立的下载与系统分享按钮。导入文本默认只读，编辑永远不覆盖原文件。导出固定为 `text/plain;charset=utf-8` 的 `.txt` 副本。

输入按扩展名白名单、512 KiB 字节上限、严格 UTF-8 解码、常见二进制签名和控制字符逐层校验；未知类型先拒绝再读取。HTML、Markdown、文件名、错误和草稿内容只进入 DOM 的 `textContent` / `value` / `setAttribute`，没有 `innerHTML`、`eval`、远端资源或脚本预览。

本机草稿仅由用户点击保存后写入 `documents-drafts-v1`，不读取其他应用的存储键。最多 24 份、合计 3 MiB UTF-8 文本。加载时验证完整记录；读取失败时禁止覆盖已有草稿，但保留打开、编辑、导出能力。写入失败时不更新界面的“已保存”标记。清理网站数据、无痕模式、卸载或系统回收可能丢失草稿，帮助页面建议导出重要文件；不会承诺浏览器持久存储永不丢失。

## 逻辑验证

```sh
node tests.mjs
```

17 项测试，无 npm 依赖。覆盖 UTF-8/BOM/多字节上限、空文件、文件读取失败、二进制与未知类型拒绝、错误输入容器、纯文本导出、标签去重和未保存保护、草稿 schema/容量、更新前不改变原记录。

`tests.mjs` 和本说明不需要部署。浏览器与 iPhone/iPad 视口、离线、真实下载、存储失败和分享按钮检查，由移动站点统一 QA 执行。系统原生选择器和系统分享菜单是否由自动化实际点击，需要在站点 QA 报告中单独说明。

## 给统一浏览器 QA 的操作入口

- 文件选择：`#file-input`，程序输入合成文件后等待 `#preview-text`。
- 新建 / 编辑：`#new-document`、`#edit-copy`、`#editor-text`、`#document-filename`。
- 草稿保存与重开：`#save-draft`、`#saved-library`、`#saved-list .saved-open`。
- 导出 / 分享：`#export-file`、`#share-file`。使用真实用户点击事件以保留 iOS 分享手势权限。
- HTML 安全：导入 `.html` 内含脚本或图片事件，确认内容为可见文字，页面不产生脚本副作用或外部请求。
- 保存失败：让本次 `localStorage.setItem` 抛出配额错误，再点保存；旧草稿不变，当前仍有未保存修改，错误提示建议导出。
- 读取损坏：给本应用键写入无效 JSON 后重开，确认不覆写旧值，仍能导出新文本。
- 离线：等待本应用 scope 激活并显示可离线，再在离线环境重开、编辑/保存/重开草稿；不要把首次离线访问当作已安装验证。

# 文档工作台 / Document Workbench · Life's winner

希望每一个使用我开源功能的人，都是各自的 Life's winner。

## 中文

在 iPhone / iPad 的 Safari 打开此工具，点“添加到主屏幕”查看步骤，再用 Safari 分享菜单选择“添加到主屏幕”。首次使用需要联网加载，等页面显示“可离线使用”后再离线打开。三个工具分别安装；不需要 Node.js、Xcode、开发者账号或安装包。右上角 `English` / `中文` 可切换语言，选择会保留在当前工具中。切换语言不会重载页面，也不会清空标签、修改文字或改变文件名。

“打开文本文件”使用系统文件选择器，只读取你明确选择的文件。支持 UTF-8 文本、Markdown、代码、Notebook 源文件，单文件最多 512 KiB、同时最多 12 个标签。打开后只读预览；“编辑副本”可修改文字与副本名称；“新建文本”从空白开始。HTML、Markdown 与代码按文字显示，不执行脚本。这是轻量文本工具，不支持 PDF、Office、图片、未知类型或高级代码编辑。

只有点“保存到本机”才会保留草稿，最多 24 份、合计 3 MiB 文本。草稿只在当前设备、浏览器或主屏幕应用中，不自动同步或备份。清除网站数据、卸载、无痕浏览或系统回收存储可能使草稿丢失。“导出 .txt”生成 UTF-8 文本下载；“分享 / 存到文件”优先调用系统文件分享，不支持时下载副本。保存位置由你选择，重要内容请定期导出。浏览器版已有草稿在安装前请先导出，再在主屏幕应用内打开。

读取草稿失败时禁止覆写旧数据，仍可打开、编辑和导出文本。保存失败时不会标记为“已保存”。原文件始终不会被覆盖；切换标签和语言保留本页副本，离开页面前请保存或导出。没有内容上传、账户、统计或远程资源。

## English

Open this tool in Safari on iPhone or iPad. Tap **Add to Home Screen** for instructions, then choose **Add to Home Screen** in Safari’s Share menu. The first visit needs a connection; wait for **Ready for offline use** before reopening offline. Install each tool separately. No Node.js, Xcode, developer account or application package is needed. Use **English** / **中文** at the top to change language. The choice is remembered for this tool. Switching does not reload the page, clear tabs, change filenames or discard edits.

**Open text files** uses the system picker and reads only files you choose. It accepts UTF-8 text, Markdown, code and Notebook source, up to 512 KiB per file and 12 open tabs. Documents open read-only. **Edit copy** changes a local text copy and its name; **New text** starts a blank document. HTML, Markdown and code remain literal text; scripts are never executed. This is a lightweight text tool, without PDF, Office, image, unknown-format or advanced code editing support.

Only **Save locally** keeps a draft, with a limit of 24 drafts and 3 MiB of text in total. Drafts stay in this device’s current browser or home-screen app; there is no automatic sync or backup. Website data removal, uninstalling, private browsing or system storage cleanup can erase them. **Export .txt** downloads a UTF-8 text copy. **Share / Save to Files** opens native file sharing where supported, otherwise downloads a copy. You choose where to save it. Export important work regularly. Export browser drafts before installation, then open them inside the installed app.

Unreadable stored drafts are never overwritten; opening, editing and exporting still work. Failed saves never mark the copy as saved. Originals are never overwritten. Switching tabs and languages preserves current copies; save or export before leaving. There are no accounts, analytics, remote resources or content uploads.

## Source and validation / 源码与验证

Static runtime files are `index.html`, `app.js`, `logic.js`, `styles.css`, using `../shared.js` and `../shared.css`. The parent mobile-site build supplies HTTPS hosting, icons, manifests and a separate Service Worker scope for each tool. There are no npm runtime dependencies or dependencies on the original application. Technical IDs, storage schema and `documents-drafts-v1` remain compatible.

```sh
node tests.mjs
```

19 dependency-free tests cover UTF-8/BOM, byte limits, binary/unknown-type rejection, failed reads, literal text export, tab deduplication/unsaved protection, draft validation/capacity, English error messages and safe localized filenames. `README.md` and `tests.mjs` are not deployed. Browser QA additionally checks open/edit/save/export, multi-tab language switching without lost edits, persisted language, phone/iPad layout, storage failures and literal HTML. Native iOS picker/share-sheet taps and real device installation remain separate manual checks.

输入按扩展名白名单、512 KiB 字节上限、严格 UTF-8 解码、二进制签名和控制字符校验；未知类型先拒绝再读取。用户文件名、内容、错误和草稿只进入 DOM 的 `textContent` / `value` / `setAttribute`，没有 `innerHTML` 或 `eval`。语言仅更新显示文案，错误 code 和已保存内容保持原样。

QA selectors: `#file-input`, `#new-document`, `#edit-copy`, `#editor-text`, `#document-filename`, `#save-draft`, `#saved-list .saved-open`, `#export-file`, `#share-file`, `[data-language]`. Use synthetic files and real click events for download/share checks. Verify the app’s own offline-ready state before testing offline; a first-ever offline visit is not an installation test.

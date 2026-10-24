# 人生赢家 / Life's winner · iPhone / iPad

希望每一个使用我开源功能的人，都是各自的 Life's winner。

I hope everyone who uses my open-source tools can be their own Life's winner.

三个工具分别打开、分别添加到主屏幕。无需完整版、开发者账号、Xcode、Node.js、付款或注册；右上角切换中文 / English，语言按工具保存，切换不清空当前编辑。

Open and install each tool separately. No full application, developer account, Xcode, Node.js, payment or registration is needed. Switch 中文 / English at the top; each tool remembers its language without clearing current edits.

| 工具 / Tool | 直接打开 / Open now | 功能 / Features |
| --- | --- | --- |
| 书写画板 / Writing | [打开 / Open](https://kevinzzzzzzzz999.github.io/Lifes-winner-modules/writing/) | 笔迹、形状、演示工具、文字卡、复制与可见拖动、JSON 导入导出。<br>Ink, shapes, presentation aids, text cards, visible copy/drag and JSON import/export. |
| 偏好方案 / Preferences | [打开 / Open](https://kevinzzzzzzzz999.github.io/Lifes-winner-modules/preferences/) | 语言、布局、工具栏、笔栏、手势与播放配置，试写预览及 JSON。<br>Language, layout, toolbar, pen, gesture/playback settings, drawing preview and JSON. |
| 文档工作台 / Documents | [打开 / Open](https://kevinzzzzzzzz999.github.io/Lifes-winner-modules/documents/) | UTF-8 文本预览、编辑副本、多标签、本机草稿、导出与分享。<br>UTF-8 previews, editable copies, tabs, local drafts, export and sharing. |

[全部工具 / All tools](https://kevinzzzzzzzz999.github.io/Lifes-winner-modules/) · [隐私与范围 / Privacy and scope](https://kevinzzzzzzzz999.github.io/Lifes-winner-modules/privacy.html) · [源码与自托管 / Source and self-hosting](samples/mobile-web/README.md)

## 安装 / Installation

1. 用 iPhone 或 iPad 的 Safari 打开一个工具。<br>Open one tool in Safari on iPhone or iPad.
2. Safari 分享 → 添加到主屏幕 → 添加；如有“作为网页 App 打开”，保持开启。找不到时向下滑动分享菜单。<br>Safari Share → Add to Home Screen → Add. Keep Open as Web App enabled if shown; scroll down the share menu if needed.
3. 打开主屏幕图标，首次联网并等待“可离线使用”。其他工具按需分别安装。<br>Open its Home Screen icon online once and wait for Ready for offline use. Install other tools separately as needed.

也可以直接在 Safari 使用，建议近期 iOS/iPadOS。源码 ZIP 不是 iOS 原生 IPA；不需要自行编译。

You can also use Safari directly; a recent iOS/iPadOS is recommended. The source ZIP is not a native IPA, and no compilation is needed.

## 保存与隐私 / Saving and privacy

- 没有账号、广告、统计、追踪或内容上传接口；不扫描完整软件资料。托管方仍收到普通静态请求和连接信息，内容及文件名不放入请求或网址。<br>No accounts, ads, analytics, tracking or content-upload endpoints; full-app data is not scanned. Hosts still receive ordinary static requests/connection information, without content or filenames in requests or URLs.
- 草稿只在当前设备、浏览器或主屏幕应用中，不自动跨设备同步；安装前后的存储可能不同。安装前先导出重要内容，再在安装后的工具中打开。<br>Drafts stay in the current device/browser/home-screen app without device sync. Installed storage may differ from Safari: export important work before installation, then reopen it in the installed tool.
- 清理网站数据、卸载或系统回收可能删除草稿。**重要内容请导出到“文件”。** 系统分享只在主动点击后触发，由你选择目标。<br>Site-data removal, uninstalling or storage cleanup can erase drafts. **Export important work to Files.** Sharing happens only after your click, and you choose its destination.
- 三个工具独立安装范围、草稿键和缓存；只下载所选工具。同源逻辑隔离不是系统安全沙盒。<br>Each tool has its own install scope, draft keys and cache; only the selected tool downloads. Same-origin logical isolation is not an operating-system sandbox.

## 使用范围 / Limits

画板采用独立格式，不包含原生 PencilKit 压力纹理、无限缩放、完整套索或内建手写识别。复制后选中新副本并保持拖动可见，选择模式长按粘贴内部剪贴板；系统随手写取决于设备与系统。

Writing uses its own format, without native PencilKit pressure textures, infinite zoom, a full lasso or built-in handwriting recognition. Copy selects the new copy and keeps it visible while dragging; long press in Select mode pastes its internal clipboard. System Scribble depends on the device/OS.

偏好方案只影响本工具预览与导出，不改变系统或完整软件；部分配置供宿主接入，不代表内含 AI、翻译或媒体引擎。

Preferences affects only this tool's preview/export, without changing system or full-app settings. Some options are configuration for another host; they do not include AI, translation or media engines.

文档只处理常见 UTF-8 文本，单文件 ≤512 KiB。PDF、Office、图片和媒体请用合适软件。编辑副本并导出 `.txt`，不覆盖原文件。

Documents handles supported UTF-8 text up to 512 KiB per file. Use suitable apps for PDF, Office, images and media. Edits stay in copies and export as `.txt`, without overwriting originals.

## 每月更新与验证 / Monthly updates and validation

每月审查已完成更新，通过隐私及相关验证后发布。新离线版本等待当前工具所有窗口关闭后接管；先保存或导出，再关闭重开，不强刷编辑、不跨设备同步个人内容。

Completed changes are reviewed monthly and published after privacy and relevant checks. New offline versions wait until all windows of the current tool close. Save/export, close and reopen; updates do not force an editing refresh or synchronize personal content.

浏览器检查包括手机/iPad 布局、WebKit/Chrome、实际导出、无外部内容请求和离线重开。它们不能替代真实设备 Apple Pencil、系统分享面板和主屏幕安装按钮检查；首次请用非重要内容试用。

Browser checks cover phone/iPad layouts, WebKit/Chrome, actual exports, no external content requests and offline reopening. They do not replace physical-device Apple Pencil, native share-sheet or Home Screen installation checks. Start with non-critical content.

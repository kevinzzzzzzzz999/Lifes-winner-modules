# 人生赢家 / Life's winner · 独立模块 / Modules

希望每一个使用我开源功能的人，都是各自的 Life's winner。

I hope everyone who uses my open-source tools can be their own Life's winner.

从 Mac、iPad、iPhone 完整软件拆出的独立工具与组件。完整软件在 `Lifes-winner` 仓库，功能库在 `Lifes-winner-modules` 仓库。技术包名、API、格式和存储标记保持兼容。

Standalone tools and reusable components from the integrated Mac, iPad and iPhone application. The full application is in `Lifes-winner`; reusable modules are in `Lifes-winner-modules`. Technical package names, APIs, formats and storage identifiers remain compatible.

## 普通用户 / Ready-to-use tools

| 工具 / Tool | 获取与安装 / Get and install |
| --- | --- |
| iPhone / iPad 书写、偏好与文档 / Writing, Preferences and Documents | 仓库首页的正式 HTTPS 入口；Safari → 分享 → 添加到主屏幕。<br>Use the published HTTPS links on the repository home page; Safari → Share → Add to Home Screen. |
| Mac 独立应用 / Standalone Mac apps | 本仓库 Releases 的已验证 ZIP；解压后把 `.app` 拖入“应用程序”。<br>Choose a verified ZIP from Releases, extract it and move the `.app` to Applications. |
| 安装与限制 / Installation and limits | [移动工具 / Mobile tools](samples/mobile-web/README.md) · [Mac 指南 / Mac guide](samples/packaging/macos/DOWNLOAD-HELP.md) |

普通使用者不需要安装 Xcode、Node.js 或完整版软件。Mac 需要 macOS 13+，应用为无个人身份的 ad-hoc 签名、未经过 Apple 公证，首次打开可能需要按系统提示确认。iPhone/iPad 为主屏幕网页应用，首次联网加载并等待“可离线使用”，源码 ZIP 不是 IPA 安装包。工具可切换中文 / English；各自功能范围见说明。

These tools need no Xcode, Node.js or full application. Mac apps require macOS 13+, use ad-hoc signing without a personal identity and are not Apple-notarized; first opening may need system approval. iPhone/iPad tools are home-screen web apps: load online once and wait for Ready for offline use. A source ZIP is not an installable IPA. The tools offer 中文 / English; see each guide for its scope.

## 开发者入口 / Developer entry points

| 内容 / Contents | 源码与说明 / Source and guide |
| --- | --- |
| 20 个 JavaScript / Node.js 包 / 20 Node packages | [packages/](packages/)：白板、笔迹、PDF、文档、Notebook、存储、搜索、学习、日历、浏览器、翻译、媒体、数学与应用壳。<br>Boards, ink, PDF, documents, notebooks, storage, search, study, calendars, browsers, translation, media, mathematics and an application shell. |
| 18 个 Swift 产品 / 18 Swift products | [swift/](swift/)：原生模型与 Apple 框架工具；各产品单独说明平台要求。<br>Native models and Apple-framework tools, with product-specific platform requirements. |
| React UI | [ui/](ui/)：30 个表面、10 个入口；按需提供宿主适配。<br>30 surfaces and 10 entry points with explicit host adapters. |
| Obsidian 伴侣 / Companion | [integrations/obsidian/](integrations/obsidian/)：可安装白板查看伴侣。<br>Installable board-viewing companion. |
| Safari 分享剪藏 / Share clipper | [integrations/safari-share-clipper/](integrations/safari-share-clipper/)：扩展源码，需自己的承载 App 和签名。<br>Extension source requiring your own containing app and signing. |

仓库首页提供逐包下载，每个 ZIP 包含源码、README、许可和已声明的依赖闭包。Node 包解压后在包目录安装依赖并测试；Swift ZIP 在 Xcode 添加本地 Package；React 需要构建。外部 Python/IPython、OCR、FFmpeg、Tectonic、AI/翻译账号、浏览器宿主和文件授权按包说明准备，不依赖完整软件的隐式配置。

Individual downloads on the repository home page include source, a README, license and the declared dependency closure. Extract Node packages and install dependencies inside their own directory; add Swift ZIPs as local packages in Xcode; build React components before integration. Supply documented Python/IPython, OCR, FFmpeg, Tectonic, AI/translation accounts, browser hosts and file authorization explicitly.

## 可运行示例 / Runnable starters

| 功能 / Feature | 库 / Library | 示例 / Example |
| --- | --- | --- |
| 书写与演示 / Writing and presentation | [InkSpaceWritingAids](swift/Documentation/InkSpaceWritingAids/README.md) | [WritingAidsDemo](samples/writing-aids/README.md) |
| 语言、布局、工具栏与手势 / Language, layout, toolbars and gestures | [InkSpacePreferences](swift/Documentation/InkSpacePreferences/README.md) | [PreferencesDemo](samples/preferences/README.md) |
| 文档路由和多窗口 / Document routing and windows | [application-shell](packages/application-shell/README.md) | 包内 Electron 示例 / Included Electron example |

Swift 示例需 macOS 与 Xcode/Swift；Electron 源示例需 Node.js 与声明依赖。每个独立 Swift ZIP 包含 `Example/`；克隆仓库使用上表 `samples/`。示例只用合成内容和独立存储，不读取完整软件的私人资料。Apple Pencil、系统随手写和协议登记仍按平台说明接入。

Swift samples require macOS and Xcode/Swift; the Electron source example requires Node.js and declared dependencies. Individual Swift ZIPs include `Example/`; use the linked `samples/` when cloning the repository. Samples use synthetic content and isolated storage, without reading the full application's private data. Apple Pencil, system Scribble and protocol registration retain their documented platform requirements.

## 验证、隐私与更新 / Validation, privacy and updates

[功能与边界 / Features and limits](FEATURES.md) · [验证 / Validation](VALIDATION.md) · [Node 验证 / Node checks](NODE-VALIDATION.md)

共记录 63 个真实功能组。源码与模块化不代表完整软件的所有设备稳定性、云同步或压力流程已解决；每项实际验证和剩余依赖单独标明。请先用合成样例与非重要文件试用。

The catalog records 63 real feature groups. Source availability and modularization do not establish full-app device stability, cloud sync or every stress workflow. Actual checks and remaining dependencies are listed separately; start with synthetic samples or non-critical files.

发布排除个人笔记、课件、账号、凭据、设备记录、私人路径、开发缓存与个人签名材料。工具只处理主动导入或选择的内容；主屏幕工具没有内容上传接口，但静态托管方仍会收到普通网页请求。草稿不跨设备自动同步，清理网站数据或系统回收可能删除草稿，重要内容请导出。

Releases exclude personal notes, course materials, accounts, credentials, device records, private paths, development caches and personal signing materials. Tools process explicitly selected/imported content. Home-screen tools have no content-upload endpoint; static hosts still receive ordinary page requests. Drafts do not sync between devices and may be erased by site-data or storage cleanup; export important work.

每月检查已完成更新，经过隐私审查和相关测试后同步源码、模块与已验证应用。离线更新等待工具安全关闭重开，不强制刷新正在编辑的页面。

Completed changes are reviewed monthly and synchronized after privacy and relevant validation checks. Offline updates wait for a safe close/reopen without forcing a refresh during editing.

项目自有代码采用 [MIT License](LICENSE)，允许使用、修改、分发和商用，保留许可及版权声明。第三方组件保持各自许可，来源记录使用相对路径。

Original code is MIT-licensed: use, modify, redistribute or use commercially while keeping copyright and license notices. Third-party components retain their licenses; provenance uses relative source paths.

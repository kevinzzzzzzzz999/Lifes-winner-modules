# 人生赢家 / Life's winner · 独立模块 / Modules

希望每一个使用我开源功能的人，都是各自的 Life's winner。
I hope everyone who uses my open-source tools can be their own Life's winner.

可单独下载的功能、应用与组件，来自 Mac、iPad、iPhone 完整软件。
Standalone tools and reusable building blocks from the integrated Mac, iPad and iPhone application.

[Node 源码 / Node source](packages/) · [Swift 产品 / Swift products](Package.swift) · [React 组件 / React components](ui/README.md) · [完整软件 / Full application](https://github.com/kevinzzzzzzzz999/Lifes-winner) · [覆盖审计 / Coverage](coverage-audit.json)

## iPhone / iPad：打开并安装 / Open and install

三个工具分别打开、分别安装。只需 Safari，无需 Xcode、Node.js、开发者账号或完整版软件。
Open each tool separately in Safari. No developer tools, account or full application are needed.

| 工具 / Tool | 直接使用 / Open now |
| --- | --- |
| 书写画板 / Writing | [打开 / Open](https://kevinzzzzzzzz999.github.io/Lifes-winner-modules/writing/) |
| 偏好方案 / Preferences | [打开 / Open](https://kevinzzzzzzzz999.github.io/Lifes-winner-modules/preferences/) |
| 文档工作台 / Documents | [打开 / Open](https://kevinzzzzzzzz999.github.io/Lifes-winner-modules/documents/) |

Safari → 分享 → 添加到主屏幕。首次联网打开，等“可离线使用”。右上角切换中文 / English，不会清空当前编辑。
Safari → Share → Add to Home Screen. Open online once and wait for Ready for offline use. Switch 中文 / English at the top without clearing current edits.

草稿只在当前设备/浏览器，重要内容请导出到“文件”。清理网站数据或系统回收可能删除草稿。这些是轻量独立工具，不等同于完整原生编辑器。
Drafts stay on this device/browser and may be removed by site-data or system storage cleanup. Export important work to Files. These are lightweight standalone tools, with the limits in [安装与范围 / Installation and limits](MOBILE-APPS.md).

## Mac：下载即用 / Ready-to-open Mac apps

下载 ZIP、解压，把 `.app` 拖入“应用程序”。无需 Xcode、Node.js、Python 或完整版。
Download the ZIP, extract it and move the `.app` to Applications. No developer tools or full application are required.

| 应用 / App | 下载 / Download |
| --- | --- |
| 书写画板 / Life's winner Writing | [通用版 / Universal](https://github.com/kevinzzzzzzzz999/Lifes-winner-modules/releases/download/desktop-v0.1.2/InkSpace-Writing-macos-universal.zip) |
| 偏好方案 / Life's winner Preferences | [通用版 / Universal](https://github.com/kevinzzzzzzzz999/Lifes-winner-modules/releases/download/desktop-v0.1.2/InkSpace-Preferences-macos-universal.zip) |
| 文档工作台 / Life's winner Document Workbench | [Apple Silicon](https://github.com/kevinzzzzzzzz999/Lifes-winner-modules/releases/download/desktop-v0.1.2/document-workbench-macos-arm64.zip) · [Intel](https://github.com/kevinzzzzzzzz999/Lifes-winner-modules/releases/download/desktop-v0.1.2/document-workbench-macos-x64.zip) |

[发行下载 / Release](https://github.com/kevinzzzzzzzz999/Lifes-winner-modules/releases/tag/desktop-v0.1.2) · [安装与范围 / Installation and limits](DESKTOP-APPS.md) · [下载验收 / Download checks](DOWNLOAD-CHECKS.md)

需要 macOS 13+。当前应用为匿名 ad-hoc 签名、未经 Apple 公证；首次打开可能需要使用者按系统提示确认。
Requires macOS 13+. Apps use ad-hoc signing without a personal identity and are not Apple-notarized. macOS may require a first-open approval; see the installation guide.

## 开发者：选择模块 / Choose a module

**20 个 Node 包 / Node packages · 18 个 Swift 产品 / Swift products · 30 个 React 表面 / React surfaces（10 个入口 / entry points）**，另有 Obsidian 与 Safari 集成。

| 目标 / Goal | 入口 / Start here |
| --- | --- |
| PDF / Office 文档 / Documents | [PDF](node-pdf-tools.zip?raw=1) · [批注 / Annotations](node-pdf-annotations.zip?raw=1) · [Office/PDF/TeX](node-office-documents.zip?raw=1) |
| 白板、笔迹、合并 / Boards, ink and merge | [格式 / Format](node-board-model.zip?raw=1) · [笔迹 / Ink](node-board-ink.zip?raw=1) · [合并 / Merge](node-board-merge.zip?raw=1) |
| 笔记、学习、日历 / Notes, study and calendars | [搜索 / Search](node-knowledge-search.zip?raw=1) · [学习 / Study](node-study-tools.zip?raw=1) · [日历 / Calendar](node-task-calendar.zip?raw=1) |
| 原生 Swift / Native Swift | 下方按产品下载 / Download individual products below |
| React 编辑器与工作台 / React editors and workspaces | [组件与宿主契约 / Components and host contract](ui/README.md) |

## 快速试用 / Quick start

下载并解压 [node-math-lab.zip](node-math-lab.zip?raw=1)，进入包目录运行：
Download and extract the ZIP, enter its directory, then run:

```sh
cd math-lab
npm install --ignore-scripts
npm test
```

```js
const { engine } = require('./index.cjs');
const square = engine.compile('x*x');
console.log(square({ x: 3 })); // 9
```

每个 ZIP 都有可编辑源码、README 和许可。Node 包先解压并安装声明依赖；Swift 包添加本地 Package；React 组件先构建并提供所需宿主。
Each ZIP includes editable source, its README and license. Extract Node packages and install their declared dependencies; add Swift ZIPs as local packages; build React components and provide their documented host adapters.

![独立 React 运行示例，合成资料 / Independent React example using synthetic data](ui-demo.png)

## 运行条件 / Runtime requirements

源码包面向开发者。浏览器、Python/IPython、OCR、FFmpeg、Tectonic、Apple 框架或文件授权按包说明准备；AI/翻译服务使用你自己的账号。Safari 分享扩展需要承载 App 与签名。
Source packages are for developers. Supply any documented browser host, Python/IPython, OCR, FFmpeg, Tectonic, Apple framework or file authorization. AI/translation services use your own account. Safari extension source needs a containing app and signing.

书写、偏好与应用壳另有可运行示例；Mac 二进制应用和上方主屏幕工具面向普通使用者。
Writing, preferences and the application shell also include runnable samples. Use the Mac apps or home-screen tools above for tools that do not require development setup.

[完整模块源码 ZIP / Complete module workspace source](Lifes-winner-modules-source-2026-10-24-r6.zip?raw=1) · 浏览 / Browse packages / swift / ui / integrations。

## JavaScript / Node.js

| 功能 / Module | 内容 / Contents | 下载 / Download |
| --- | --- | --- |
| [白板格式与元素 / Board format and elements](packages/board-model/README.md) | 白板 JSON 解析、格式校验、节点与连线操作、笔迹位置及子白板链接。<br>Parse/validate board JSON, nodes, links, ink positions and child-board references. | [ZIP](node-board-model.zip?raw=1) |
| [白板坐标与笔迹回放 / Ink coordinates and replay](packages/board-ink/README.md) | 合并位置、笔迹裁切路径、绘制计划、回放时间线与高清PDF裁块计划。<br>Placement, ink clipping, paint plans, replay timelines and PDF crop plans. | [ZIP](node-board-ink.zip?raw=1) |
| [白板合并与撤回 / Board merge and history](packages/board-merge/README.md) | 来源检查、笔迹平移、合并结果、事务撤回、历史快照与编辑器快照接受规则。<br>Source checks, ink transforms, transactional undo and history acceptance. | [ZIP](node-board-merge.zip?raw=1) |
| [PDF文档工具 / PDF tools](packages/pdf-tools/README.md) | 原有OneNote连续画布重排、几何校验、批注隐藏预览、阅读缩放与选区计算；另提供显式PDF合并和页提取封装。<br>Continuous-page layout, geometry and selection helpers; explicit PDF merge/extract wrappers. | [ZIP](node-pdf-tools.zip?raw=1) |
| [PDF批注与扩展记录 / PDF annotation records](packages/pdf-annotations/README.md) | PDF批注侧车记录、投影、图层状态、原生笔迹字段及页边扩展模型。<br>Sidecar annotations, projections, layers, native-ink fields and page extensions. | [ZIP](node-pdf-annotations.zip?raw=1) |
| [Office、PDF、TeX与文档笔记 / Office, PDF, TeX and notes](packages/office-documents/README.md) | 基础Office创建与模型回读、可编辑PDF封装、文档提取/旁注计划及Tectonic进程适配；渲染器、TeX引擎和文件接口由调用者提供。<br>Document creation/readback, editable PDFs, note plans and Tectonic process adapters; provide declared renderers/engines. | [ZIP](node-office-documents.zip?raw=1) |
| [Notebook数据与格式 / Notebook data and formats](packages/notebook-data/README.md) | CSV/TSV解析、Excel工作簿Worker、Notebook格式/容量/输出校验、目录与运行事件归并。<br>CSV/TSV, Excel worker, Notebook validation, outlines and run-event merging. | [ZIP](node-notebook-data.zip?raw=1) |
| [Python与IPython运行协议 / Python and IPython runtime](packages/notebook-runtime/README.md) | Python/Notebook运行协议、真实IPython环境准备、输出/取消与kernel生命周期；实际执行限定受支持的Apple Silicon Mac与外部CPython环境。<br>Kernel lifecycle, output/cancellation and environment preparation; execution requires a supported Apple Silicon Mac and external CPython. | [ZIP](node-notebook-runtime.zip?raw=1) |
| [知识索引与空间数学 / Knowledge search and spaces](packages/knowledge-search/README.md) | Markdown链接/标签/模糊链接消歧、资料库扫描搜索、知识宫殿和漫游场景数学。<br>Markdown links/tags, link resolution, vault search and scene mathematics. | [ZIP](node-knowledge-search.zip?raw=1) |
| [本地文件与原子写入 / Local files and atomic writes](packages/file-storage/README.md) | 相对路径校验、UTF-8解码、排他持久写入、文件身份检查、受限流复制、最近目录及诊断存储。<br>Path validation, strict UTF-8, durable writes, identity checks and bounded copy. | [ZIP](node-file-storage.zip?raw=1) |
| [笔记交换与纲要 / Note exchange and outlines](packages/note-exchange/README.md) | Markdown/缩进纲要与白板转换、BoardNotes归档解析、对象解码、受限导入导出流程。<br>Markdown/outline/board conversion, archive parsing and bounded import/export. | [ZIP](node-note-exchange.zip?raw=1) |
| [学习卡片与复习 / Study cards and review](packages/study-tools/README.md) | 卡片/填空格式、学习事件投影、CSV/TSV问答导入去重、复习记录与题纲。<br>Card/cloze formats, event projection, CSV/TSV import and review records. | [ZIP](node-study-tools.zip?raw=1) |
| [清单日历与ICS / Tasks, calendars and ICS](packages/task-calendar/README.md) | 任务清单、快速笔记、日历模型、ICS导入导出、日历文件及提醒调度。<br>Checklists, quick notes, calendar models, ICS import/export and reminder scheduling. | [ZIP](node-task-calendar.zip?raw=1) |
| [网页会话与链接工具 / Browser sessions and links](packages/browser-utilities/README.md) | URL验证、文件链接路由、浏览会话存储、AI页面就绪检查、粘贴/下载与权限策略。<br>URL/file routing, sessions, extension management, paste/download and permission policy. | [ZIP](node-browser-utilities.zip?raw=1) |
| [翻译请求与凭据存储接口 / Translation adapters](packages/translation-tools/README.md) | 请求选区归一化、供应商配置、响应解析、取消/超时及注入式凭据加密存储。<br>Request selection, providers, response parsing, cancellation and injected secure credential storage. | [ZIP](node-translation-tools.zip?raw=1) |
| [媒体工程与字幕 / Media projects and subtitles](packages/media-tools/README.md) | 剪辑项目验证、混音/速度/FFmpeg参数、字幕格式与侧车记录、视频流访问和播放状态逻辑。<br>Project validation, mix/speed/FFmpeg arguments, subtitles and playback state. | [ZIP](node-media-tools.zip?raw=1) |
| [离线数值计算 / Offline numerical tools](packages/math-lab/README.md) | 表达式解析、采样、微积分近似、回归/时间序列、现金流/贷款/债券/期权等教育数值函数。<br>Expressions, sampling, calculus approximations, regression and educational finance functions. | [ZIP](node-math-lab.zip?raw=1) |
| [文档链接与工作区状态 / Document workspace state](packages/document-workspace/README.md) | 内部文档链接、文件树/标签状态、自动保存接受规则、文档缩放、快捷键、富文本和公式片段。<br>Internal links, file tabs, autosave acceptance, zoom, shortcuts and rich-text fragments. | [ZIP](node-document-workspace.zip?raw=1) |
| [本地OCR调用与选区坐标 / Local OCR protocol](packages/ocr-tools/README.md) | 有界OCR进程协议、图像输入检查、选区像素与页坐标转换。<br>Bounded OCR processes, image checks and pixel/page coordinate conversion. | [ZIP](node-ocr-tools.zip?raw=1) |
| [独立应用壳与系统文档入口 / Application shell and document entry](packages/application-shell/README.md) | 可运行的本地文档/工作区软件壳：原生文件选择、逐窗口权限、系统打开队列、多窗口、文本预览、标签与快捷切换；附安全 Electron 示例。 Independent document/workspace shell with a runnable Electron demo.<br>Runnable Electron sample with explicit file access, window lifecycle, tabs and safe text previews. | [ZIP](node-application-shell.zip?raw=1) |

## SwiftPM

每份 ZIP 只含所选产品、依赖闭包与必要资源。解压后选择 Xcode → Add Local Package，或添加 SwiftPM 本地路径。
Each ZIP contains one product, its dependency closure and required resources. Extract it and use Xcode → Add Local Package, or a local SwiftPM package path.

| 产品 / Product | 用途 / Purpose | 下载 / Download |
| --- | --- | --- |
| [InkSpaceTextHistory](swift/Documentation/InkSpaceTextHistory/README.md) | 文本撤销与重做<br>Text undo/redo | [ZIP](swift-InkSpaceTextHistory.zip?raw=1) |
| [InkSpaceOutline](swift/Documentation/InkSpaceOutline/README.md) | Markdown 树形纲要转换<br>Markdown tree outlines | [ZIP](swift-InkSpaceOutline.zip?raw=1) |
| [InkSpaceSubtitles](swift/Documentation/InkSpaceSubtitles/README.md) | 字幕解析和时间点查询<br>Subtitle parsing and time queries | [ZIP](swift-InkSpaceSubtitles.zip?raw=1) |
| [InkSpacePaths](swift/Documentation/InkSpacePaths/README.md) | 资料库路径校验<br>Workspace path validation | [ZIP](swift-InkSpacePaths.zip?raw=1) |
| [InkSpaceGeometry](swift/Documentation/InkSpaceGeometry/README.md) | 页面排版、打印分块与文字选择几何<br>Page layout, print tiles and text-selection geometry | [ZIP](swift-InkSpaceGeometry.zip?raw=1) |
| [InkSpaceStudy](swift/Documentation/InkSpaceStudy/README.md) | 学习卡片、事件排程与CSV/TSV<br>Study cards, scheduling and CSV/TSV | [ZIP](swift-InkSpaceStudy.zip?raw=1) |
| [InkSpaceChecklist](swift/Documentation/InkSpaceChecklist/README.md) | 课程清单格式和状态变换<br>Course checklist formats and state | [ZIP](swift-InkSpaceChecklist.zip?raw=1) |
| [InkSpacePDFRecords](swift/Documentation/InkSpacePDFRecords/README.md) | PDF图层、批注和增页记录<br>PDF layers, annotations and page extensions | [ZIP](swift-InkSpacePDFRecords.zip?raw=1) |
| [InkSpaceMediaTimeline](swift/Documentation/InkSpaceMediaTimeline/README.md) | 音视频工程模型与时间线计算<br>Media project models and timeline mathematics | [ZIP](swift-InkSpaceMediaTimeline.zip?raw=1) |
| [InkSpaceAI](swift/Documentation/InkSpaceAI/README.md) | 导图AI请求、图片翻译与凭据存储<br>Mind-map AI, image translation and credential adapters | [ZIP](swift-InkSpaceAI.zip?raw=1) |
| [InkSpaceWebClips](swift/Documentation/InkSpaceWebClips/README.md) | 网页剪藏与链接处理<br>Web clips and links | [ZIP](swift-InkSpaceWebClips.zip?raw=1) |
| [InkSpaceSpeechText](swift/Documentation/InkSpaceSpeechText/README.md) | 中英文朗读分段与高亮坐标<br>Chinese/English speech segments and highlight ranges | [ZIP](swift-InkSpaceSpeechText.zip?raw=1) |
| [InkSpaceStorage](swift/Documentation/InkSpaceStorage/README.md) | 协调文件读写与冲突保护<br>Coordinated files and conflict protection | [ZIP](swift-InkSpaceStorage.zip?raw=1) |
| [InkSpaceOCR](swift/Documentation/InkSpaceOCR/README.md) | 本机PDF/图片文字识别<br>Local PDF/image text recognition | [ZIP](swift-InkSpaceOCR.zip?raw=1) |
| [InkSpaceExcelPictures](swift/Documentation/InkSpaceExcelPictures/README.md) | XLSX内嵌图片读取<br>Embedded XLSX pictures | [ZIP](swift-InkSpaceExcelPictures.zip?raw=1) |
| [InkSpaceScanPDF](swift/Documentation/InkSpaceScanPDF/README.md) | 多页PDF汇编和安全导出<br>Multi-page PDF assembly and safe export | [ZIP](swift-InkSpaceScanPDF.zip?raw=1) |
| [InkSpaceWritingAids](swift/Documentation/InkSpaceWritingAids/README.md) | 辅助书写与演示：停留直线与六形拟合、波浪/填色、高亮置底、激光、胶带、文字卡及可选iPad系统手写输入；附Mac交互画布。<br>Shape fitting, writing/presentation aids and a runnable Mac canvas | [ZIP](swift-InkSpaceWritingAids.zip?raw=1) |
| [InkSpacePreferences](swift/Documentation/InkSpacePreferences/README.md) | 独立语言/布局、工具栏与笔栏、Pencil操作选择、字幕外观及播放偏好，显式隔离持久化<br>Isolated language/layout, toolbar, gesture, subtitle and playback preferences | [ZIP](swift-InkSpacePreferences.zip?raw=1) |

## 组件与集成 / Components and integrations

| 组件 / Component | 内容与要求 / Contents and requirements | 下载 / Download |
| --- | --- | --- |
| [React UI](ui/README.md) | 30 个表面、10 个入口；编辑器、旁注、图谱、白板/PDF、Notebook、学习与媒体。需 React 与宿主适配。<br>30 surfaces, 10 entry points; requires React and documented host adapters. | [ZIP](react-ui-components.zip?raw=1) |
| [Obsidian 伴侣 / Companion](integrations/obsidian/README.md) | 独立白板查看伴侣；原生打开/书写需协议处理程序。<br>Installable board-viewing companion; native open/write actions need a registered protocol handler. | [ZIP](obsidian-companion.zip?raw=1) |
| [Safari 分享剪藏 / Share clipper](integrations/safari-share-clipper/README.md) | 扩展源码，需自己的承载 App、target 和 Apple 签名；未完成独立真机验收。<br>Extension source requiring your containing app, target and Apple signing; no independent physical-device acceptance claimed. | [ZIP](safari-share-clipper.zip?raw=1) |

## 范围与验证 / Scope and validation

[下载验收 / Download checks](DOWNLOAD-CHECKS.md) · [63 个功能组 / Feature groups](FEATURES.md) · [覆盖审计 / Coverage](coverage-audit.json) · [实际结果 / Results](VALIDATION.md) · [Node 验证 / Node checks](NODE-VALIDATION.md) · [SHA256 清单 / SHA256 manifest](download-manifest.json)

20 个 Node 包共记录 242 项回归。Swift 原有 16 个独立消费者与新增产品分别验收；React 45 次独立挂载与严格 TypeScript 消费检查通过。各包仍有明确平台与引擎边界。
242 recorded Node behavior checks across 20 packages; Swift independent-consumer checks and new-product acceptance are recorded separately. React has 45 independent mounts plus strict TypeScript consumer checks. These do not establish full-app device stability or remove documented host/engine requirements.

## 隐私、许可与每月更新 / Privacy, license and monthly updates

下载不附带个人笔记、课件、账号、密钥、设备记录、个人签名、私人路径或开发日志。只处理你主动选择或导入的内容；网页托管方仍会收到普通静态请求。
Downloads exclude personal notes, course materials, accounts, secrets, device records, personal signing identities, private paths and development logs. Tools process content you explicitly choose/import. Static hosting providers still receive ordinary page requests.

每月检查已完成更新，经隐私检查和相关测试后同步源码、模块和已验证应用。离线工具的新版本等待安全关闭重开，不自动同步个人草稿。
Completed changes are reviewed monthly and synchronized after privacy and relevant validation checks. Offline updates wait for a safe close/reopen and never synchronize personal drafts between devices.

项目自有代码采用 [MIT License](LICENSE)，可使用、修改、分发和商用，保留版权与许可声明。第三方组件保留原许可。
Original code is MIT-licensed: use, modify, redistribute or use commercially while keeping copyright/license notices. Third-party components retain their own licenses.

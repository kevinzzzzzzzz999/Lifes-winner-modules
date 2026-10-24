# InkSpace 功能目录与独立模块边界

本目录按已脱敏完整软件的真实源码整理，共 **63 个功能组**（复核新增旁注与提取笔记两组）。同一功能中的菜单、按钮和快捷键没有拆成多个“软件”。完整 InkSpace 软件仍保留；本仓库提供可复用核心及独立集成，并明确仍需应用宿主或进一步解耦的界面。

## 如何阅读

- **来源相对路径**相对于完整 InkSpace 软件仓库根目录；本文件中的 `desktop/`、`ios/`、`obsidian/` 是来源定位，不表示本模块仓库把整个原App重复打包。
- **JS**是已经抽取的20个独立库域，具体导出和验证以各包README、入口、`modules.json`及测试为准。`JS核心`不表示该功能的所有原界面已变成独立App。
- **Swift域**表示原生可复用边界，最终可导入的product/target以Swift包的 `Package.swift` 和模块说明为准；不能把UIKit/PencilKit界面直接当跨平台纯库。
- **需宿主/待解耦**表示仍依赖Electron、React、SwiftUI、PencilKit、WebKit、系统文件选择器、钥匙串、网络提供方或外部运行时。未完成的独立应用不能标成已可安装。
- 这里记录的是源码存在的能力与边界；不宣称本次重新完成所有真机、云同步或压力验收。原生大规模套索稳定性、部分UI流程和平台覆盖限制继续适用。

## 独立核心域

JS按20个领域组织：`board-model`、`board-ink`、`board-merge`、`pdf-tools`、`pdf-annotations`、`office-documents`、`notebook-data`、`notebook-runtime`、`knowledge-search`、`file-storage`、`note-exchange`、`study-tools`、`task-calendar`、`browser-utilities`、`translation-tools`、`media-tools`、`math-lab`、`document-workspace`、`ocr-tools`、`application-shell`。这是一组可独立加载的库，不是20个桌面安装程序。

[Swift产品清单](swift-modules.json)目前声明18个product：`InkSpaceTextHistory`、`InkSpaceOutline`、`InkSpaceSubtitles`、`InkSpacePaths`、`InkSpaceGeometry`、`InkSpaceStudy`、`InkSpaceChecklist`、`InkSpacePDFRecords`、`InkSpaceMediaTimeline`、`InkSpaceAI`、`InkSpaceWebClips`、`InkSpaceSpeechText`、`InkSpaceStorage`、`InkSpaceOCR`、`InkSpaceExcelPictures`、`InkSpaceScanPDF`、`InkSpacePreferences`、`InkSpaceWritingAids`。原16个product已完成SwiftPM测试及arm64 iOS Simulator无签名构建；新增两个产品的独立示例、行为测试与SDK检查另见验证记录，具体平台、API和行为验证范围以Swift包说明为准；未纳入纯库的原生UI仍在表中标明。后续拆分必须保持格式、数据完整性、原功能和宿主接口约束。

## React界面的独立使用边界

`@inkspace/ui`另提供30个原有React表面、10个分域ESM入口和类型声明，见 [React源码包](react-ui-components.zip)内的 README 与 HOST-CONTRACT.md。代码编辑/文档预览/结构编辑/知识图/宫殿漫游等可由props独立驱动；便签、日历、Notebook、白板、媒体、OCR等使用明确注入的文件/资源/运行时适配器。缺失宿主能力必须显示错误，不能回退到完整App全局接口或伪造结果。

这补充了下表中的UI抽取边界，不表示所有原生界面、浏览器内核、完整App壳或外部运行时均已变为独立软件。组件从原公开源码依赖闭包抽取，没有复制`App.tsx`、Electron主进程或preload。

## 1. 资料库、文件与工作空间

| ID | 功能组 | 使用者可见范围 | 来源相对路径 | 独立形式与剩余依赖 |
| --- | --- | --- | --- | --- |
| A01 | 本地资料库与授权 | 选择自己的本地/iCloud资料文件夹，列举文件与白板，读取授权范围内的原件。 | `desktop/src/main/vault-service.cjs`<br>`desktop/src/renderer/Sidebar.tsx`<br>`ios/InkSpace/Documents/DocumentLibrary.swift` | JS `file-storage`；Swift `InkSpacePaths`/`InkSpaceStorage`；系统授权与文件夹界面需宿主 |
| A02 | 文件整理与回收 | 多选、创建、重命名、复制/移动、分享、废纸篓及恢复，保持文件操作冲突检查。 | `desktop/src/main/vault-file-management.cjs`<br>`desktop/src/renderer/FileManagementDialog.tsx`<br>`ios/InkSpace/FileManagement/` | JS `file-storage`；Swift `InkSpaceStorage`提供底层IO部分；文件管理界面需解耦；UI `tools`文件管理组件，操作通过回调/适配器 |
| A03 | 最近浏览与多窗口 | 最近文件/文件夹、重新打开、多标签/并排布局、独立文件夹窗口和窗口状态恢复。 | `desktop/src/main/window-contexts.cjs`<br>`desktop/src/renderer/App.tsx`<br>`ios/InkSpace/Core/WorkspaceWindowPersistence.swift`<br>`ios/InkSpace/UI/RecentBrowseSection.swift` | JS 文件/浏览器状态核心部分；Electron/SwiftUI窗口壳仍需宿主 |
| A04 | 全文搜索、标签与双向关联 | 受限文本扫描、关键词结果、标签、Markdown出链/反链、歧义链接提示；不声称全文搜索所有PDF。 | `desktop/src/main/knowledge-service.cjs`<br>`desktop/src/renderer/KnowledgePanel.tsx` | JS `knowledge-search`；搜索界面需解耦 |
| A05 | 文件变更与同步衔接 | 外部文件变化刷新、冲突保护、iCloud下载状态与后台刷新衔接；云文件传输仍由系统负责。 | `desktop/src/main/vault-watch.cjs`<br>`desktop/src/main/vault-watch-lifecycle.cjs`<br>`ios/InkSpace/Core/BoardBackgroundRefreshController.swift`<br>`ios/InkSpace/Core/VaultFileIO.swift` | JS `file-storage`部分；Swift `InkSpaceStorage`；iCloud协调/系统后台任务需原生宿主，不是独立云同步服务 |

## 2. 文档、代码与计算

| ID | 功能组 | 使用者可见范围 | 来源相对路径 | 独立形式与剩余依赖 |
| --- | --- | --- | --- | --- |
| B01 | 文字与代码编辑 | 纯文字、Python/LaTeX/HTML等源文件编辑、保存、撤销、文件导出和原应用打开。 | `desktop/src/renderer/EditorPane.tsx`<br>`desktop/src/renderer/WorkspaceFileEditor.tsx`<br>`desktop/src/main/source-file-export.cjs` | JS 文件核心；编辑器组件已抽取；保存/运行宿主API需显式提供；UI `editor`受控代码/文字编辑 |
| B02 | Markdown与富文本公式 | Markdown原文/预览、标题纲要、链接、富文本与行内公式、Markdown内嵌白板及打开跳转。 | `desktop/src/renderer/EditorPane.tsx`<br>`desktop/src/renderer/rich-text-math.ts`<br>`ios/InkSpace/UI/MarkdownDocumentView.swift`<br>`ios/InkSpace/Documents/BoardRichTextRenderer.swift`<br>`desktop/src/renderer/BoardEmbed.tsx` | JS 文档核心部分；Swift `InkSpaceTextHistory`/`InkSpaceOutline`；编辑和渲染UI需宿主；UI `documents`预览及`editor`文字组件 |
| B03 | 标准文档创建与结构编辑 | 创建DOCX、PPTX及带可编辑源模型的PDF，编辑标题/段落/列表并保存；PDF渲染需注入，不等于完整Office套件。 | `desktop/src/renderer/NewDocumentDialog.tsx`<br>`desktop/src/renderer/StandaloneDocumentEditor.tsx`<br>`desktop/src/main/editable-office.cjs`<br>`desktop/src/main/document-pdf.cjs` | JS `office-documents`；结构编辑器界面需解耦；UI `documents`结构化编辑，保存由调用方实现 |
| B04 | Office和图片阅读 | Word/PowerPoint/图片/Markdown阅读与关联阅读PDF，原文和批注版双入口、保留源文件。 | `desktop/src/renderer/DocumentPreview.tsx`<br>`desktop/src/main/docx-preview.cjs`<br>`ios/InkSpace/Documents/OfficeDocumentRenderer.swift`<br>`ios/InkSpace/UI/InlineImageReadingView.swift` | JS `office-documents`；原生转换/系统渲染与阅读UI仍需宿主；UI `documents`承载已转换内容，转换能力需服务适配 |
| B05 | Excel阅读与嵌图 | 工作簿/工作表、保存的公式值、单元格阅读版及嵌入图片；不声称完全还原Excel排版/图表。 | `desktop/src/main/excel-reading.cjs`<br>`desktop/src/main/office-embedded-images.cjs`<br>`ios/InkSpace/Documents/ExcelDocumentRenderer.swift`<br>`ios/InkSpace/UI/ExcelPicturesReadingView.swift` | JS `office-documents`/`notebook-data`；Swift `InkSpaceExcelPictures`提取嵌图；完整工作表渲染界面需宿主 |
| B06 | CSV/TSV/JSON数据预览 | 数据文件解析、表格预览与列/行浏览；与Notebook变量导入分开。 | `desktop/src/renderer/DataFilePreview.tsx`<br>`desktop/src/renderer/data-file-parsers.ts` | JS `notebook-data`解析域；预览组件需解耦；UI `documents` CSV/HTML预览 |
| B07 | 本地Python脚本 | 显式运行、取消、输出/错误、超时与大小限制；需要使用者提供Python运行环境。 | `desktop/src/main/python-service.cjs`<br>`desktop/src/renderer/PythonConsole.tsx` | JS `notebook-runtime`；执行环境需注入，不含Python二进制或桌面界面 |
| B08 | Jupyter Notebook编辑运行 | 代码/Markdown单元格、语法色、快捷键、纲要、逐格/连续运行、结果显示与保存。 | `desktop/src/renderer/NotebookEditor.tsx`<br>`desktop/src/renderer/NotebookCode.tsx`<br>`desktop/src/renderer/notebook-run-controller.ts`<br>`desktop/src/main/notebook-service.cjs` | JS `notebook-runtime`与格式核心；编辑与HTML输出组件已抽取；执行/数据接口需适配；UI `notebook`，运行/保存仍为显式回调及宿主接口 |
| B09 | Notebook表格数据交换 | CSV/TSV/Excel多表导入、表头/变量选择、数据导出与运行中数据交换。 | `desktop/src/main/notebook-data.cjs`<br>`desktop/src/main/notebook-data-worker.cjs`<br>`desktop/src/renderer/NotebookCSVPicker.tsx`<br>`desktop/src/renderer/NotebookCSVExport.tsx` | JS `notebook-data`；部分操作依赖可选Python科学计算/Excel组件 |
| B10 | LaTeX编译与公式排版 | 编辑TeX，主动调用Tectonic编译PDF，管理缓存、取消和诊断；完整离线TeX缓存需另备。 | `desktop/src/main/tex-service.cjs`<br>`desktop/scripts/packaging/prepare-latex.mjs`<br>`desktop/src/renderer/EditorPane.tsx` | JS `office-documents.tex`提供独立TexService；调用方提供Tectonic、缓存、资料快照/发布接口，未附带TeX二进制。 |
| B11 | 科学计算与数学工作台 | 表达式、函数采样/绘图、数值微分积分、梯度/Hessian、CSV统计、OLS、时间序列和财务数值函数、工作表导出请求校验；不是符号代数系统。 | `desktop/src/renderer/MathWorkbench.tsx`<br>`ios/InkSpace/Resources/MathLab/`<br>`ios/InkSpace/UI/MathWorkbenchView.swift`<br>`ios/InkSpace/UI/FloatingCalculatorOverlay.swift`<br>`desktop/src/main/math-export.cjs` | JS `math-lab`数值引擎；现有Web/浮动界面仍需运行壳，参见包说明；UI `tools`数学浮窗，静态资源URL显式传入 |
| B12 | 旁注空白区 | 为原文创建关联Markdown旁注、插入图片、编辑/预览、右侧或下方布局及保存。 | `desktop/src/renderer/App.tsx`<br>`desktop/src/renderer/MarginPanel.tsx` | UI `MarginNotes`可由props独立驱动；Node `office-documents.noteExtraction`提供旁注文档/图片链接组装；文件创建/保存由调用方注入。 |
| B13 | 提取为Markdown笔记 | 从PDF/Office/表格文字生成带原件链接的Markdown新笔记，保留截断提示，不覆盖原文件。 | `desktop/src/renderer/App.tsx`<br>`desktop/src/renderer/PDFViewer.tsx` | JS `office-documents.noteExtraction`提供Markdown生成及可注入读取/发布的提取流程；PDF/HTML提取器与文件发布由调用方提供。 |

## 3. 白板、手写与输出

| ID | 功能组 | 使用者可见范围 | 来源相对路径 | 独立形式与剩余依赖 |
| --- | --- | --- | --- | --- |
| C01 | 白板文件与浏览导航 | 白板JSON校验、对象/连线/定位点、总览、缩放平移、目录定位、最后一笔定位与保存视口。 | `desktop/src/main/board-json.cjs`<br>`desktop/src/main/board-validation.cjs`<br>`desktop/src/renderer/BoardViewer.tsx`<br>`ios/InkSpace/Core/Models.swift`<br>`ios/InkSpace/Core/BoardInkLocator.swift` | JS `board-model`；Swift `InkSpaceGeometry`仅可复用几何部分；完整画布与存储协调需宿主；UI `board`，资源/操作需适配 |
| C02 | 原生手写与工具预设 | PencilKit书写、橡皮、高亮、粗线、直尺、笔色/粗细/透明度预设及原生撤销重做。 | `ios/InkSpace/Canvas/NativeBoardCanvas.swift`<br>`ios/InkSpace/UI/BoardSheets.swift`<br>`desktop/src/native/InkSpaceInkHelper.swift` | JS `board-ink`仅笔迹数据/桥接相关核心；PencilKit画布与Mac helper需Apple宿主，仍需解耦 |
| C03 | 圈选、变换与排版 | 混合笔迹/对象圈选、移动缩放、复制粘贴、成组/拆组、对齐排布及历史保护。 | `desktop/src/main/board-operations.cjs`<br>`desktop/src/renderer/BoardArrangeToolbar.tsx`<br>`ios/InkSpace/Canvas/BoardLassoSelection.swift`<br>`ios/InkSpace/Core/BoardLassoClipboard.swift` | JS `board-ink`/`board-model`核心；原生手势/撤销系统需宿主，压力稳定性问题仍保留；UI `board`原有选择/排布界面与操作回调 |
| C04 | 文字、公式和思维导图节点 | 文字/公式节点、富文本输入、样式和连接箭头、可编辑图形框架。 | `desktop/src/renderer/GraphWorkspace.tsx`<br>`desktop/src/main/board-elements.cjs`<br>`ios/InkSpace/UI/BoardRichTextEditor.swift`<br>`ios/InkSpace/UI/BoardSheets.swift` | JS `board-model`；Swift `InkSpaceTextHistory`；节点/图形组件可挂载，写入与附件需适配；UI `knowledge`思维导图和`editor`富文本组件 |
| C05 | 文档卡片与页面展开 | PDF/Office/图片加入白板、按纵向/横向/网格展开、缩放和收起；原文仍保留。 | `desktop/src/main/board-file-cards.cjs`<br>`desktop/src/main/board-operations.cjs`<br>`ios/InkSpace/UI/DocumentExpansionSheet.swift`<br>`ios/InkSpace/Documents/SourceDocumentRenderStore.swift` | JS `board-model`/`office-documents`核心；文档渲染和画布布局UI需宿主；UI `board`，文档转换与写入仍需宿主 |
| C06 | 子白板与入口嵌入 | 创建/连接子白板、父子跳转、嵌入预览与原文件定位。 | `desktop/src/main/board-child-links.cjs`<br>`desktop/src/renderer/ChildBoardPortal.tsx`<br>`ios/InkSpace/UI/ChildBoardsSheet.swift`<br>`ios/InkSpace/Canvas/BoardChildCanvasOverlay.swift` | JS `board-model`；跨画布入口/窗口路由仍需解耦；UI `board`内子白板入口，需文件/会话接口 |
| C07 | 白板合并与明确撤回 | 来源预览、自选位置、平移缩放、合并记录和撤回；保持原板与既有笔迹。 | `desktop/src/main/board-merge.cjs`<br>`desktop/src/renderer/BoardMergeDialog.tsx`<br>`ios/InkSpace/Core/BoardMerge.swift`<br>`ios/InkSpace/UI/BoardMergeView.swift` | JS `board-merge`；合并放置界面和原生笔迹变换需宿主 |
| C08 | 原文重关联与引用修复 | 源文件移动/变化时核对摘要并重关联PDF与批注引用，保留失败/冲突保护。 | `desktop/src/main/board-relink.cjs`<br>`desktop/src/main/board-relink-stream.cjs`<br>`desktop/src/renderer/BoardRelinkDialog.tsx`<br>`ios/InkSpace/Documents/VaultPathResolver.swift` | JS `board-model`/`pdf-tools`域；交互确认与原生协调需宿主；UI `board`内重关联操作，需宿主确认/存储接口 |
| C09 | 辅助书写与演示 | 几何辅助、停留直线、高亮底层、激光轨迹、胶带复习遮挡和系统随手写转文字卡；胶带不是隐私涂黑。 | `ios/InkSpace/Core/BoardHeldLineStroke.swift`<br>`ios/InkSpace/Core/BoardWritingAid.swift`<br>`ios/InkSpace/UI/BoardWritingAidSettingsView.swift`<br>`ios/InkSpace/UI/BoardWritingAidScribbleView.swift` | Swift `InkSpaceWritingAids`提供停留直线/六形拟合、波浪/填色、高亮置底、激光、胶带/存储、文字卡及可选iOS Scribble适配；附可启动Mac画布。PKStroke接线、真实Pencil与系统识别仍需对应宿主/硬件 |
| C10 | 历史版本、备份与恢复 | 自动/手动本机历史、容量设置、可编辑ZIP备份、导入恢复独立副本及附件检查。 | `desktop/src/main/board-history-service.cjs`<br>`ios/InkSpace/Core/LocalBoardBackupStore.swift`<br>`ios/InkSpace/Backup/`<br>`ios/InkSpace/UI/BoardBackupSettingsView.swift` | JS `board-merge.history`历史核心；完整备份/恢复界面及原生归档尚未独立提取 |
| C11 | 分页、打印与图片/PDF导出 | Letter纸框、页序、裁剪、分页PDF/PNG/JPEG与当前视图输出；平台导出能力不同。 | `desktop/src/renderer/board-export.tsx`<br>`desktop/src/renderer/ExportDialog.tsx`<br>`ios/InkSpace/Core/BoardPrintExporter.swift`<br>`ios/InkSpace/UI/BoardPrintPagesView.swift` | JS `pdf-tools`部分；Swift `InkSpaceGeometry`分页几何；实际页面渲染/系统打印需宿主，非同一导出接口 |
| C12 | 现存笔迹回放 | 播放/暂停/倍速、背景、显示模式和镜头控制；只读回放仍存在的笔迹，缺失时间不补造历史。 | `desktop/src/renderer/ink-replay.ts`<br>`desktop/src/renderer/InkReplayDialog.tsx`<br>`ios/InkSpace/Core/InkReplay.swift`<br>`ios/InkSpace/UI/InkReplayView.swift` | JS `board-ink`回放核心；Web回放组件已抽取；PencilKit与系统独立窗仍需宿主；UI `board`笔迹回放，资源需适配 |

## 4. 阅读、PDF与内容提取

| ID | 功能组 | 使用者可见范围 | 来源相对路径 | 独立形式与剩余依赖 |
| --- | --- | --- | --- | --- |
| D01 | PDF独立阅读 | PDF页面、目录、文本选择、缩放/定位与高倍率可视区绘制。 | `desktop/src/renderer/PDFViewer.tsx`<br>`desktop/src/renderer/pdf-reader-zoom.ts`<br>`ios/InkSpace/PDFExtension/PDFOutlineView.swift`<br>`ios/InkSpace/PDFWorkspace/PhonePDFReader.swift` | JS `pdf-tools`；Swift `InkSpaceGeometry`部分；PDF.js阅读组件已抽取；PDFKit仍需原生宿主；UI `pdf`单页渲染/阅读器 |
| D02 | 并排阅读与白板联动 | 同源/双PDF阅读窗格、白板与文档切换、阅读状态和选区联动。 | `desktop/src/renderer/PDFWorkspace.tsx`<br>`desktop/src/renderer/PDFBoardStudyLayout.tsx`<br>`ios/InkSpace/PDFWorkspace/PDFWorkspaceView.swift`<br>`ios/InkSpace/PDFWorkspace/BoardPDFWorkspaceView.swift` | PDF状态/几何核心；多窗格阅读工作台尚需解耦 |
| D03 | PDF高亮与独立笔迹图层 | 文本高亮、手写/图层开关、标准注释写回和本白板注释去重/归属保护。 | `desktop/src/main/pdf-layer-service.cjs`<br>`desktop/src/main/pdf-native-ink.cjs`<br>`desktop/src/renderer/PDFLayers.tsx`<br>`ios/InkSpace/Documents/PDFAnnotationWritebackService.swift` | JS `pdf-annotations`；Swift `InkSpacePDFRecords`提供记录/归档部分；PencilKit投影/写回与图层UI需宿主 |
| D04 | PDF增页与页外扩展笔记 | 在PDF旁增加阅读/手写空间、扩展块、页序、原文引用及合成输出。 | `desktop/src/main/pdf-extend-model.cjs`<br>`desktop/src/renderer/PDFExtend.tsx`<br>`ios/InkSpace/PDFExtension/PDFExtensionModel.swift`<br>`ios/InkSpace/PDFExtension/PDFExtensionExporter.swift` | JS `pdf-annotations.extensionModel`/`extensionStore`；Swift `InkSpacePDFRecords`模型/几何；交互编辑和PDF渲染需宿主；UI `pdf`内扩展功能仍需控制器/记录适配 |
| D05 | 原文摘录、截图与回链定位 | 文本/区域截图摘录、保存原文位置、白板选区定位、原文/批注版返回跳转。 | `desktop/src/main/pdf-visual-excerpt.cjs`<br>`desktop/src/renderer/board-source-navigation.ts`<br>`ios/InkSpace/PDFWorkspace/PDFImageExcerpt.swift`<br>`ios/InkSpace/PDFExtension/PDFSourceReference.swift` | JS `pdf-tools`/`board-model`核心；截取/选区和文档路由需宿主 |
| D06 | 本机OCR | PDF/图片/选区文字识别、文本框位置、结果检查和另存，不覆盖源文档。 | `desktop/src/main/local-ocr-service.cjs`<br>`desktop/src/native/ocr/LocalOCR.swift`<br>`ios/InkSpace/Core/LocalOCR.swift`<br>`ios/InkSpace/UI/LocalOCRView.swift` | Swift `InkSpaceOCR`系统识别核心；需Apple Vision及调用宿主，桌面CLI/界面需另封装，不是纯JS识别器；JS `ocr-tools`加UI `tools`；识别运行时必须另提供 |
| D07 | 朗读与跟随高亮 | 白板文字/PDF/OCR内容朗读、暂停/速度和当前段高亮。 | `desktop/src/renderer/BoardSpeech.tsx`<br>`ios/InkSpace/Core/BoardReadAloudController.swift`<br>`ios/InkSpace/Core/BoardReadAloudPDF.swift`<br>`ios/InkSpace/PDFWorkspace/PDFReadAloudControls.swift` | Swift `InkSpaceSpeechText`提供文本预处理；浏览器Speech/AVSpeech、OCR及跟随高亮UI需宿主解耦 |
| D08 | 选区/整段/页面翻译 | 选择文本或图像、提供方/密钥设置、页面范围翻译、显示与导出。 | `desktop/src/main/translation-service.cjs`<br>`desktop/src/renderer/PDFRangeTranslation.tsx`<br>`ios/InkSpace/AI/PDFTranslationClient.swift`<br>`ios/InkSpace/PDFWorkspace/PDFWorkspaceTranslationExport.swift` | JS `translation-tools`；Swift `InkSpaceAI`翻译客户端；联网服务、密钥存储和界面需使用者配置；UI `tools`设置及`pdf`选区流程；没有附带账号/服务 |
| D09 | 相机扫描与扫描页整理 | 系统相机扫描、扫描页编辑、命名与保存到所选文件夹的PDF。 | `ios/InkSpace/UI/DocumentScannerView.swift`<br>`ios/InkSpace/UI/ScannedPageEditor.swift`<br>`ios/InkSpace/Documents/ScannedPDFExport.swift` | Swift `InkSpaceScanPDF`提供扫描页生成PDF核心；相机扫描/页面编辑界面仍需独立App或宿主 |
| D10 | OneNote连续PDF与高清对照 | OneNote导出PDF的连续布局、分片几何与高清来源匹配/发布保护。 | `desktop/src/main/onenote-pdf.cjs`<br>`desktop/src/main/onenote-hd.cjs`<br>`desktop/src/main/onenote-geometry-guard.cjs`<br>`desktop/src/main/onenote-publication.cjs` | JS `pdf-tools`算法域；通用高清匹配预览/确认流程未全部接入UI，不声称解析.one笔记本或自动恢复任意原图 |

## 5. 知识整理、学习与计划

| ID | 功能组 | 使用者可见范围 | 来源相对路径 | 独立形式与剩余依赖 |
| --- | --- | --- | --- | --- |
| E01 | 笔记关系图与思维结构 | 从Markdown链接生成知识图、浏览节点关系，白板节点图使用独立编辑机制。 | `desktop/src/main/knowledge-service.cjs`<br>`desktop/src/renderer/GraphWorkspace.tsx`<br>`desktop/src/renderer/MindSourcePreview.tsx` | JS `knowledge-search`/`board-model`；图谱组件已抽取；源内容读取需适配；UI `knowledge`图谱/思维导图 |
| E02 | 知识空间、记忆宫殿与漫游 | 按真实文件夹显示平面/三维空间、容量统计、摆放排序与可行走浏览。 | `desktop/src/renderer/KnowledgeSpace.tsx`<br>`desktop/src/renderer/KnowledgePalace.tsx`<br>`desktop/src/renderer/KnowledgeWalkthrough.tsx`<br>`desktop/src/renderer/knowledge-walk-renderer.ts` | 文件元数据核心可复用；React/WebGL空间组件已抽取；文件接口需显式提供；UI `knowledge`空间/宫殿/漫游，扫描文件夹需适配 |
| E03 | 手机批注与待处理评论 | 独立评论/高亮记录、笔画/原文定位、跨端读取、删除标记和待处理列表。 | `desktop/src/main/review-service.cjs`<br>`desktop/src/renderer/ReviewPanel.tsx`<br>`ios/InkSpace/Core/BoardReviews.swift`<br>`ios/InkSpace/UI/BoardReviewViews.swift` | JS `study-tools`评论核心；原生记录/UI及跨文件定位需宿主；UI `study`批注列表props驱动，记录读取由调用方提供 |
| E04 | 问答、挖空与图像遮挡复习 | 问答卡、富文本/图片答案、挖空、遮挡区、评分、到期队列与间隔复习记录。 | `desktop/src/main/study-model.cjs`<br>`desktop/src/renderer/StudyPanel.tsx`<br>`ios/InkSpace/Study/StudyModel.swift`<br>`ios/InkSpace/Study/StudyImageAnswer.swift` | JS `study-tools`；Swift `InkSpaceStudy`模型/排程；复习面板和画布取材需解耦；UI `study`学习面板，需记录/来源接口 |
| E05 | 学习卡片CSV/TSV交换 | 两列问答预览、去重、分批导入/重试和导出；文本交换不含笔迹/遮挡/复习历史。 | `desktop/src/main/study-transfer-model.cjs`<br>`desktop/src/renderer/StudyTransferPanel.tsx`<br>`ios/InkSpace/Study/StudyCSV.swift`<br>`ios/InkSpace/Study/StudyTransferView.swift` | JS `study-tools`；Swift `InkSpaceStudy`学习CSV；选文件/导入确认UI需宿主；UI `study`内原导入流程，需选择器/记录接口 |
| E06 | 任务与课程清单 | 任务排序、截止日期、完成/归档、进度和诗词奖励，保存在用户资料中。 | `desktop/src/renderer/course-checklist.ts`<br>`desktop/src/renderer/CourseChecklist.tsx`<br>`ios/InkSpace/CourseChecklist/` | JS `task-calendar`；Swift `InkSpaceChecklist`格式/模型；清单组件已抽取；保存需宿主；UI `planning`任务清单 |
| E07 | 随手便签 | 快速记事项、排序/编辑/完成/归档，与现有任务清单共用记录和截止日期。 | `desktop/src/renderer/quick-notes.ts`<br>`desktop/src/renderer/QuickNotes.tsx` | JS `task-calendar`便签逻辑；桌面组件已抽取；存储需宿主，原生端没有等同实现；UI `planning`便签，共用任务记录 |
| E08 | 日历、ICS与提醒 | 日程/课程和任务日期、ICS导入导出、重复事项、系统通知及提醒去重。 | `desktop/src/renderer/calendar-model.ts`<br>`desktop/src/renderer/calendar-ics.ts`<br>`desktop/src/renderer/TaskCalendar.tsx`<br>`desktop/src/main/calendar-service.cjs` | JS `task-calendar`；系统通知由宿主注入；不声称连接Google/Outlook云日历；UI `planning`日历；系统通知仍需宿主 |
| E09 | 通用笔记交换与纲要 | PDF/图片/Markdown/音视频原件副本、Markdown纲要转节点、节点标题树导出；私有原档可仅保留。 | `desktop/src/main/note-exchange.cjs`<br>`desktop/src/main/note-outline.cjs`<br>`ios/InkSpace/Exchange/NoteExchange.swift`<br>`ios/InkSpace/Exchange/NoteOutline.swift` | JS `note-exchange`；Swift `InkSpaceOutline`纲要；导入导出选择器与画布组装需宿主；其他笔记应用私有档不自动解码；UI `tools`笔记交换；文件对话框/写入需适配 |
| E10 | BoardNotes原生格式转换 | 解析支持的.boardNotes归档，保留可识别手写、图片/PDF/文字及位置，保留原档和转换记录。 | `desktop/src/main/boardnotes-format.cjs`<br>`desktop/src/main/boardnotes-import.cjs`<br>`desktop/src/main/boardnotes-objects.cjs`<br>`desktop/src/main/boardnotes-file-zip.cjs` | JS `note-exchange`；原生笔迹转换仍需注入PencilKit bridge，不能声称任意归档全部还原；UI `tools`交换流程，原生笔迹bridge仍需宿主 |

## 6. 网页、剪藏与AI

| ID | 功能组 | 使用者可见范围 | 来源相对路径 | 独立形式与剩余依赖 |
| --- | --- | --- | --- | --- |
| F01 | 内置浏览器 | 多标签、地址搜索、前后退、查找、独立缩放、恢复会话和下载。 | `desktop/src/main/browser-service.cjs`<br>`desktop/src/browser/browser.js`<br>`desktop/src/main/browser-state.cjs`<br>`ios/InkSpace/Browser/EmbeddedBrowserPanel.swift` | JS `browser-utilities`仅URL/状态等核心；Electron/WebKit浏览器宿主尚需独立封装 |
| F02 | 浏览器扩展管理 | 本地解包扩展安装/启停/移除与权限说明；iOS支持受限MV3内容脚本/样式/存储。 | `desktop/src/main/browser-extensions.cjs`<br>`desktop/src/main/browser-security.cjs`<br>`ios/InkSpace/Browser/BrowserExtensionHost.swift`<br>`ios/InkSpace/Browser/BrowserExtensionManagerView.swift` | JS `browser-utilities.urls.extensionSummary`与`extensions.BrowserExtensions`提供权限摘要、快照安装、启停和移除；显式注入session/dialog，实际扩展运行需浏览器宿主，不承诺全部Chrome扩展兼容 |
| F03 | 网页摘录、截图与PDF剪藏 | 用户主动选择文字/图片/网页PDF、剪藏到资料库/白板，导入版本化inkclip文件。 | `desktop/src/main/browser-clips.cjs`<br>`desktop/src/main/board-web-url.cjs`<br>`ios/InkSpace/Browser/BrowserWebClip.swift`<br>`ios/InkSpace/Core/BoardWebClipPath.swift` | JS `browser-utilities`；Swift `InkSpaceWebClips`剪藏格式/路径核心；取网页内容/写白板需宿主，Safari来源集成见H02 |
| F04 | AI网页助手与附件衔接 | 隔离AI网页、提供方切换、用户登录、显式截图/图片粘贴、下载和网页健康状态。 | `desktop/src/main/ai-panel.cjs`<br>`desktop/src/main/ai-image-transfer.cjs`<br>`desktop/src/renderer/AIPanel.tsx`<br>`ios/InkSpace/AI/ChatGPTWebSession.swift` | JS `browser-utilities`部分纯校验；AI网页工作区需浏览器宿主与用户账号，发送仍由用户操作 |
| F05 | 原生高级AI API会话 | 用户自己的API服务/模型/密钥、白板临时截图与高级提问界面。 | `ios/InkSpace/AI/AIClient.swift`<br>`ios/InkSpace/AI/AIWorkspaceView.swift`<br>`ios/InkSpace/AI/TemporaryBoardCapture.swift` | Swift `InkSpaceAI`客户端；截图、钥匙串、联网及会话UI需宿主，不提供服务端或共享密钥 |

## 7. 音视频、字幕与制作

| ID | 功能组 | 使用者可见范围 | 来源相对路径 | 独立形式与剩余依赖 |
| --- | --- | --- | --- | --- |
| G01 | 视频/音频播放与浮窗 | 本地媒体播放、倍速/快进、白板视频叠层、独立/浮动播放窗。 | `desktop/src/main/video-service.cjs`<br>`desktop/src/renderer/VideoPlayer.tsx`<br>`desktop/src/renderer/FloatingVideo.tsx`<br>`ios/InkSpace/Video/BoardVideoPlayerView.swift` | JS `media-tools`流/格式核心；原生AVPlayer或浏览器视频和窗口需宿主；UI `media`播放器，媒体URL/字幕需适配 |
| G02 | 字幕与原媒体关联 | SRT/VTT/TXT解析、字幕选择/关联、时间定位、外观与持久化。 | `desktop/src/main/video-subtitles.cjs`<br>`desktop/src/renderer/useVideoSubtitles.ts`<br>`ios/InkSpace/Video/BoardVideoSubtitles.swift`<br>`ios/InkSpace/Video/BoardSubtitleAssociationStore.swift` | JS `media-tools`；Swift `InkSpaceSubtitles`；字幕显示和文件选择需宿主；UI `media`播放器字幕界面 |
| G03 | 非破坏式媒体剪辑与导出 | 时间线裁剪/拆分/排序、倍速/音量、转场、画中画/混音、字幕和项目保存、视频/音频渲染输出。 | `desktop/src/main/media-editor-compose.cjs`<br>`desktop/src/renderer/MediaEditor.tsx`<br>`ios/InkSpace/MediaEditor/MediaEffectsEditor.swift`<br>`ios/InkSpace/MediaEditor/MediaExportService.swift` | JS `media-tools`；Swift `InkSpaceMediaTimeline`项目/时间线/字幕导入；FFmpeg需另提供，AVFoundation渲染和编辑器UI需宿主；UI `media`剪辑器，未附带FFmpeg/AVFoundation渲染服务 |

## 8. 独立集成与跨平台支持

| ID | 功能组 | 使用者可见范围 | 来源相对路径 | 独立形式与剩余依赖 |
| --- | --- | --- | --- | --- |
| H01 | Obsidian白板查看器 | 已有白板/PDF/文字/公式/连线/定位点查看、Markdown嵌入、搜索定位和原文件打开。 | `obsidian/inkspace-companion/`<br>`obsidian/tests/companion.test.cjs` | 独立集成 `integrations/obsidian/`：可安装到Obsidian；查看无需完整InkSpace；原生创建/书写需系统inkspace协议处理程序 |
| H02 | Safari系统分享剪藏 | 显式分享标题/URL/选中文字，系统文件选择器保存版本化JSON供任意兼容导入器消费。 | `ios/OptionalShareExtension/` | 源码集成 `integrations/safari-share-clipper/`：不依赖完整App源码；仍需签名承载App及扩展target，尚未独立target构建/真机验收 |
| H03 | 语言、外观与操作偏好 | 英文/简体中文、布局/侧栏、工具栏自定义、笔工具预设、Pencil双击/握压、字号/无障碍语义和播放等本机设置。 | `desktop/src/renderer/i18n.ts`<br>`desktop/src/renderer/PanelLayout.tsx`<br>`ios/InkSpace/UI/AppSettingsView.swift`<br>`ios/InkSpace/UI/BoardToolbarCustomizationView.swift`<br>`ios/InkSpace/Core/BoardPencilGestureSettings.swift` | Swift `InkSpacePreferences`提供92条双语本地化、布局、工具栏/笔栏、Pencil操作选择、字幕/播放等数据与隔离持久化；附可启动Mac设置示例。系统事件与服务执行由宿主提供，不自动读取原App偏好 |
| H04 | 本机问题记录与诊断导出 | 受限问题记录、状态/错误码和手动导出，不把私人日志作为发布内容。 | `desktop/src/main/diagnostics.cjs`<br>`ios/InkSpace/Core/DiagnosticsCenter.swift`<br>`ios/InkSpace/UI/DiagnosticsCenterView.swift` | JS `file-storage.diagnostics`已提供独立诊断记录；系统导出界面和原生诊断中心尚未独立提取 |
| H05 | 完整应用壳与系统入口 | 统一首页/路由、资料选择、窗口生命周期、系统文件打开和inkspace协议，装配所有模块。 | `desktop/src/main/main.cjs`<br>`desktop/src/preload/preload.cjs`<br>`desktop/src/renderer/App.tsx`<br>`ios/InkSpace/InkSpaceApp.swift` | JS `application-shell`提供窗口/权限/系统打开队列、协议/文档路由、标签/快速切换及首页状态；附可启动Electron只读文档壳。完整编辑器和原生SwiftUI场景仍由集成方装配，示例不登记系统协议 |

## 独立集成的实际验证

- `integrations/obsidian/` 包含可直接安装的三个插件文件、可编辑JavaScript源码、MIT许可和35项已有合成回归。主文件/样式/manifest与完整软件公开副本一致；README只调整独立目录链接及安装边界。语法、manifest、安装输入与35项回归通过。没有操作真实Obsidian仓库。
- `integrations/safari-share-clipper/` 保留可复用扩展源码。plist、JavaScript/Swift源语法及选中文字/长度限制合成检查通过，与主App导入格式静态对应。没有承载App/已生成target，未进行签名安装、Safari真机或端到端导入验收。
- 当前公开来源没有 `desktop/external-clipper/`。不能把不存在的Chrome/Edge插件列为已交付；现有桌面/原生程序的剪藏导入能力仍保留在F03。

## 目录覆盖复核

以桌面首页/命令入口、主界面与后端服务、原生首页/工具栏/设置、核心存储与各功能文件夹、Obsidian注册命令/文件菜单/Markdown嵌入为交叉依据复核。目录覆盖：文件管理与多窗口、文本/Office/代码、计算与Notebook、白板/笔迹/备份/打印、PDF与OCR/翻译/朗读、扫描、知识空间/学习/任务/日历、笔记交换、网页/AI、媒体/字幕/回放、系统集成和偏好诊断。

未把开发测试器、设备安装/续签工具、私人样例、构建缓存或第三方依赖的每个内部函数计为使用者软件。对于仅存在算法、源码集成或受外部组件限制的能力，表中明确保留对应边界。新增功能或模块要同步更新本目录，并复核是否出现新的依赖耦合与隐私内容。

## 本轮独立覆盖复核

本轮按首页、命令/工具栏、文件/文档工作流和原生各功能目录重新核对，新增 B12「旁注空白区」、B13「提取为Markdown笔记」，并补明Markdown内嵌白板、最后一笔定位、直尺与系统快速切换入口。PDF增页、历史与诊断的模块映射已校正。

[机器可核验的逐功能覆盖矩阵](coverage-audit.json)逐组记录实际Node导出、Swift产品、React组件、独立下载文件和仍在原App中的部分。矩阵不把“源码已公开”写成“所有功能均已有独立成品”。PencilKit画布/辅助笔、原生完整备份恢复、多窗格工作台、浏览器/AI网页宿主、原生渲染与系统入口仍有未提取部分；Safari仍是需自行集成的扩展源码。

公开ZIP中的路径是解压后的源码定位，不是本仓库展开目录的网页链接。Node包、Swift产品和React组件的运行环境/依赖需按各下载包README准备。

## 三个可分别安装的主屏幕工具

life'winner（人生赢家）新增书写画板、偏好方案和文档工作台的 iPhone / iPad 网页主屏幕版本；每个工具独立安装、离线缓存和本机草稿，无需 Xcode、Node.js 或完整版。其可编辑源与具体边界见 [主屏幕工具说明](samples/mobile-web/README.md)。它们是分别适配的轻量应用，不意味着下表所有功能已经变成完整独立App。

希望每一个使用我开源功能的人，都是各自的 life'winner。

# InkSpace Modules · 散装功能库

从 InkSpace（人生赢家）提取的独立功能源码。完整软件包含 Mac、iPad、iPhone 三个版本，另保留在同一账号的 **inkspace** 仓库。

这里可以按功能单独下载：**19 个 Node / JavaScript 包、16 个 SwiftPM 产品、29 个 React 界面表面（10 个分域入口）**，以及 Obsidian 和 Safari 分享集成。

每个 ZIP 包包含可编辑源码、使用说明和许可。先解压，再按包内 README 安装依赖或添加本地 Swift 包；React 组件需要构建，并按说明提供所需宿主接口。

## JavaScript / Node.js 独立功能

| 功能 | 内容 | 下载 |
| --- | --- | --- |
| 白板格式与元素 | 白板 JSON 解析、格式校验、节点与连线操作、笔迹位置及子白板链接。 | [board-model](node-board-model.zip) |
| 白板坐标与笔迹回放 | 合并位置、笔迹裁切路径、绘制计划、回放时间线与高清PDF裁块计划。 | [board-ink](node-board-ink.zip) |
| 白板合并与撤回 | 来源检查、笔迹平移、合并结果、事务撤回、历史快照与编辑器快照接受规则。 | [board-merge](node-board-merge.zip) |
| PDF文档工具 | 原有OneNote连续画布重排、几何校验、批注隐藏预览、阅读缩放与选区计算；另提供显式PDF合并和页提取封装。 | [pdf-tools](node-pdf-tools.zip) |
| PDF批注与扩展记录 | PDF批注侧车记录、投影、图层状态、原生笔迹字段及页边扩展模型。 | [pdf-annotations](node-pdf-annotations.zip) |
| Office文档模型 | 基础DOCX/PPTX生成和自身模型回读、外部文档只读预览、嵌入图片与ZIP容量检查。 | [office-documents](node-office-documents.zip) |
| Notebook数据与格式 | CSV/TSV解析、Excel工作簿Worker、Notebook格式/容量/输出校验、目录与运行事件归并。 | [notebook-data](node-notebook-data.zip) |
| Python与IPython运行协议 | 显式运行Python、Notebook单元格读取与受限输出协议、重启和运行请求控制。 | [notebook-runtime](node-notebook-runtime.zip) |
| 知识索引与空间数学 | Markdown链接/标签/模糊链接消歧、资料库扫描搜索、知识宫殿和漫游场景数学。 | [knowledge-search](node-knowledge-search.zip) |
| 本地文件与原子写入 | 相对路径校验、UTF-8解码、排他持久写入、文件身份检查、受限流复制、最近目录及诊断存储。 | [file-storage](node-file-storage.zip) |
| 笔记交换与纲要 | Markdown/缩进纲要与白板转换、BoardNotes归档解析、对象解码、受限导入导出流程。 | [note-exchange](node-note-exchange.zip) |
| 学习卡片与复习 | 卡片/填空格式、学习事件投影、CSV/TSV问答导入去重、复习记录与题纲。 | [study-tools](node-study-tools.zip) |
| 清单日历与ICS | 任务清单、快速笔记、日历模型、ICS导入导出、日历文件及提醒调度。 | [task-calendar](node-task-calendar.zip) |
| 网页会话与链接工具 | URL验证、文件链接路由、浏览会话存储、AI页面就绪检查、粘贴/下载与权限策略。 | [browser-utilities](node-browser-utilities.zip) |
| 翻译请求与凭据存储接口 | 请求选区归一化、供应商配置、响应解析、取消/超时及注入式凭据加密存储。 | [translation-tools](node-translation-tools.zip) |
| 媒体工程与字幕 | 剪辑项目验证、混音/速度/FFmpeg参数、字幕格式与侧车记录、视频流访问和播放状态逻辑。 | [media-tools](node-media-tools.zip) |
| 离线数值计算 | 表达式解析、采样、微积分近似、回归/时间序列、现金流/贷款/债券/期权等教育数值函数。 | [math-lab](node-math-lab.zip) |
| 文档链接与工作区状态 | 内部文档链接、文件树/标签状态、自动保存接受规则、文档缩放、快捷键、富文本和公式片段。 | [document-workspace](node-document-workspace.zip) |
| 本地OCR调用与选区坐标 | 有界OCR进程协议、图像输入检查、选区像素与页坐标转换。 | [ocr-tools](node-ocr-tools.zip) |

## SwiftPM 原生模块

每份下载只公开一个产品，并包含它的依赖闭包及必要资源。解压后在 Xcode 中选择 Add Local Package，或用 SwiftPM 的本地 package 路径添加。

| 产品 | 用途 | 下载 |
| --- | --- | --- |
| InkSpaceTextHistory | 文本撤销与重做 | [源码包](swift-InkSpaceTextHistory.zip) |
| InkSpaceOutline | Markdown 树形纲要转换 | [源码包](swift-InkSpaceOutline.zip) |
| InkSpaceSubtitles | 字幕解析和时间点查询 | [源码包](swift-InkSpaceSubtitles.zip) |
| InkSpacePaths | 资料库路径校验 | [源码包](swift-InkSpacePaths.zip) |
| InkSpaceGeometry | 页面排版、打印分块与文字选择几何 | [源码包](swift-InkSpaceGeometry.zip) |
| InkSpaceStudy | 学习卡片、事件排程与CSV/TSV | [源码包](swift-InkSpaceStudy.zip) |
| InkSpaceChecklist | 课程清单格式和状态变换 | [源码包](swift-InkSpaceChecklist.zip) |
| InkSpacePDFRecords | PDF图层、批注和增页记录 | [源码包](swift-InkSpacePDFRecords.zip) |
| InkSpaceMediaTimeline | 音视频工程模型与时间线计算 | [源码包](swift-InkSpaceMediaTimeline.zip) |
| InkSpaceAI | 导图AI请求、图片翻译与凭据存储 | [源码包](swift-InkSpaceAI.zip) |
| InkSpaceWebClips | 网页剪藏与链接处理 | [源码包](swift-InkSpaceWebClips.zip) |
| InkSpaceSpeechText | 中英文朗读分段与高亮坐标 | [源码包](swift-InkSpaceSpeechText.zip) |
| InkSpaceStorage | 协调文件读写与冲突保护 | [源码包](swift-InkSpaceStorage.zip) |
| InkSpaceOCR | 本机PDF/图片文字识别 | [源码包](swift-InkSpaceOCR.zip) |
| InkSpaceExcelPictures | XLSX内嵌图片读取 | [源码包](swift-InkSpaceExcelPictures.zip) |
| InkSpaceScanPDF | 多页PDF汇编和安全导出 | [源码包](swift-InkSpaceScanPDF.zip) |

## 组件与独立集成

| 组件 | 内容与要求 | 下载 |
| --- | --- | --- |
| React UI | 29个表面、10个分域入口；包括编辑器、图谱、知识空间、白板/PDF、Notebook、日历、学习、媒体等。需要React和明确的宿主适配；包内有构建与接入说明。 | [React组件源码](react-ui-components.zip) |
| Obsidian伴侣 | 可安装的白板查看伴侣；查看无需完整InkSpace，原生打开/书写需要系统协议处理程序。 | [Obsidian源码](obsidian-companion.zip) |
| Safari分享剪藏 | 扩展源码，需要自己的承载App、扩展target和Apple签名；未完成独立真机验收。 | [分享扩展源码](safari-share-clipper.zip) |

## 范围与验证

[61个功能组与依赖边界](FEATURES.md) · [实际验证结果](VALIDATION.md) · [下载包摘要](download-manifest.json)

19个Node包198项测试通过；16个Swift产品20项行为测试和iOS模拟器构建通过；React组件44次独立挂载检查通过。它们是可复用功能、组件或源码集成，平台宿主、外部引擎和界面依赖见包内说明。完整软件已有的设备稳定性问题仍按原记录保留。

## 隐私、许可与更新

不附带个人笔记、课件、账号、密钥、设备记录、签名、私人路径或开发日志。原始代码采用 [MIT License](LICENSE)，第三方代码保持各自许可。后续完成的软件更新会在隐私检查和相关验证后同步这些功能下载。

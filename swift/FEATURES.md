# 原生功能与独立模块范围

这个目录提供18个可分别导入的Swift库产品；完整原生软件的功能按下表逐组核对。状态中的「部分抽取」表示只有列出的逻辑已经形成独立库，其余代码仍保留在完整应用，需要进一步定义宿主界面、会话或存储接口。没有把完整App复制进单个target，也没有把未编译的界面目录算作独立软件。

| 原生功能组 | 已可独立复用的产品/范围 | 仍在完整App中的部分及依赖原因 |
|---|---|---|
| 文本草稿撤销/重做 | `InkSpaceTextHistory`，有界历史与分支重做规则 | 具体编辑器焦点、UIKit/SwiftUI文本选择仍由宿主负责 |
| Markdown树纲要导入/导出 | `InkSpaceOutline`，树/标题/列表解析与编码 | `Exchange/NoteExchange*`将树映射到白板节点和持久化，依赖BoardStore/BoardDocument |
| 无限白板、节点、连线、定位点 | 部分几何在`InkSpaceGeometry` | `Core/Models.swift`、BoardStore及主Canvas混合文档、UI状态、PencilKit类型，需要单独的文档/会话公开协议 |
| PDF页面网格、垂直/水平展开 | `InkSpaceGeometry`的PageGrid | 创建白板页面项、预览资源、事务提交依赖文档模型和资源库 |
| 打印框、分块与整页布局 | `InkSpaceGeometry`的PrintPageGeometry | `BoardPrintExporter`绘制完整白板、公式、图片和笔迹，需要宿主提供完整渲染/资源接口 |
| Apple Pencil书写、笔刷、高亮、橡皮 | 保留完整App源码 | NativeBoardCanvas、调色板和笔迹生命周期深度依赖UIKit/PencilKit/BoardStore，尚无独立画布库产品 |
| 套索选择、移动、缩放、复制、撤销 | 可复用几何中的视口/代际验证 | 实际笔迹选择、系统Undo及保存跨画布生命周期，仍与NativeBoardCanvas和BoardStore关联；两万笔稳定性问题没有因拆包自动修复 |
| 书写辅助、手写输入设置、手势和工具栏 | `InkSpaceWritingAids`的几何、激光、高亮、胶带/文字模型及独立演示；`InkSpacePreferences`的手势、工具栏、笔预设和持久化 | 原生PKStroke应用、Pencil事件接线与完整Canvas由宿主负责；Scribble适配依赖UIKit和系统手写能力 |
| 白板合并、子白板与来源定位 | 保留完整App源码 | `BoardMerge*`、ChildBoards及Store事务需要BoardDocument、笔迹/资源复制和冲突保存协议 |
| 笔迹回放 | 保留完整App源码 | `InkReplay*`需要白板笔迹归档、时间序列及Canvas显示宿主，未伪装为字幕或媒体时间线模块 |
| PDF图层、批注记录、删除与冲突投影 | `InkSpacePDFRecords` | PDFKit显示、原生书写覆盖层、文件回写仍在PDFWorkspace和Documents路径 |
| PDF增页/留白块及历史 | `InkSpacePDFRecords`的数据模型、事件校验、冲突投影和切片几何 | `PDFExtensionReader/Store/Exporter`依赖PDFKit、PencilKit、图片资源库及宿主编辑状态 |
| 原生PDF笔迹载荷 | `InkSpacePDFRecords.PDFNativeInkArchive`提供有界opaque Data格式 | 不解析或重放PencilKit归档；实际原生笔迹解析仍由Apple框架/完整App完成 |
| PDF增量写回与批注归属 | 保留完整App源码 | PDFIncrementalInkWriter/PDFInkProjection需要BoardDocument、笔迹投影、批注所有权和逐项回读验证接口 |
| PDF阅读、目录、分页、并排、缩放、高亮 | 记录模型和几何已抽取 | `PDFWorkspaceReader/Pane/Controls`、PhonePDFReader与窗口/文件/播放状态相连，需要独立PDF阅读宿主协议 |
| 图像、Markdown、Word/PPT、Excel和公式阅读 | 图片提取在`InkSpaceExcelPictures`；通用资源和JS逻辑见同仓库其它模块 | Swift渲染包装器依赖WKWebView、QuickLook/PDFKit、Bundle资源及BoardStore缓存，尚未做独立Swift阅读器产品 |
| XLSX内嵌图片、关系和资产解码 | `InkSpaceExcelPictures` | Excel单元格编辑、公式执行、工作簿写入和图表绘制不属于此只读模块 |
| 相机扫描、裁切与PDF保存 | `InkSpaceScanPDF`负责页序汇编和另名保存 | `DocumentScannerView/ScannedPageEditor`需要VisionKit/UIKit相机和图片编辑宿主，未打包为独立摄像头App |
| 本机OCR及文字选择位图 | `InkSpaceOCR`提供PDF/图片识别与有界图像；`InkSpaceGeometry`提供结果代际和坐标规则 | Live Text界面、选中文字菜单及当前白板截图依赖VisionKit/UIKit/Canvas宿主 |
| 中英文朗读、词语高亮 | `InkSpaceSpeechText`提供语言分段、UTF-16范围和高亮坐标 | AVSpeechSynthesizer、音频会话及播放/暂停状态仍在BoardReadAloudController与PDF阅读器中 |
| 学习卡片、挖空、图像遮挡、事件排程 | `InkSpaceStudy`的数据校验、排程投影、CSV/TSV及确定性ID | StudySession、StudyRepository和CardEditor需要文件事件库、App白板节点及UI会话接口 |
| 课程清单、完成/归档与诗词奖励 | `InkSpaceChecklist`，JSON验证/状态变换和包内通用诗词 | CourseChecklistStore/View需要文件冲突与授权目录/窗口状态，未转成独立清单App |
| 音视频工程、剪辑时间线、转场/混音参数 | `InkSpaceMediaTimeline`提供模型校验、时间计算和字幕解析 | AVFoundation合成、导入、预览、导出进度和效果UI仍在MediaEditor各服务中，需要公开资源/渲染会话边界 |
| SRT/VTT/TXT字幕与时间查询 | `InkSpaceSubtitles` | AVPlayer绑定、字幕关联文件CAS持久化和播放器视图仍与BoardVideoRequest/资料库绑定 |
| 网页剪藏、URL策略、链接文本 | `InkSpaceWebClips` | 内置WKWebView浏览器、历史/标签、网页权限和文件下载不是这个模块的内容 |
| Safari分享扩展 | 完整仓库的`ios/OptionalShareExtension/`提供历史源码和手动集成说明 | 需要iOS Share Extension target/宿主嵌入及真实Safari验收，未列入Swift库产品 |
| 浏览器扩展脚本/样式与本地存储 | 保留完整App源码 | BrowserExtensionHost依赖WKWebView、用户脚本世界、下载/授权流程和App状态，需要独立宿主协议 |
| 导图AI、截图翻译及多服务请求 | `InkSpaceAI`提供客户端、格式校验、可注入翻译transport及Keychain接口 | AIWorkspaceView、ChatGPTWebPanel/Session及临时白板截图依赖UI、WebView和BoardStore；真实第三方账号行为未验收 |
| 文件授权、相对路径与目录安全 | `InkSpacePaths` | 系统文件/文件夹选择器和书签授权由宿主UI负责 |
| 协调文件读写、指纹冲突保护、Obsidian包装笔记 | `InkSpaceStorage` | 云同步传输、跨设备事务、完整白板格式迁移不由此模块提供 |
| 文件管理、最近浏览、目录切换 | 底层读写/路径模块可复用 | DocumentLibrary/VaultFileManagement、RecentBrowse和资料库侧栏包含App路由、授权与窗口状态，未作为独立文件管理App |
| 备份、恢复、回收与自动保存 | 底层协调读写在`InkSpaceStorage` | LocalBoardBackupStore、BackupArchive、BoardBackupController及后台生命周期依赖BoardDocument、资源清单、App调度和恢复界面 |
| iPad多窗口、iPhone布局与窗口恢复 | 保留完整App源码 | WorkspaceSceneRegistry/Persistence、iPad/iPhone各视图需要SwiftUI/UIKit scene环境和App会话所有权，不是无界面的通用库 |
| 设置、本地化、诊断和辅助功能 | `InkSpacePreferences`提供本地化、布局、工具栏/手势/播放设置及显式独立存储，附macOS设置示例 | 原App的完整设置路由和辅助功能界面树由宿主装配；诊断另有Node的file-storage.diagnostics |

## 实际可独立使用的含义

库产品有公开类型、方法和必要构造器；外部测试target使用普通`import`，不使用`@testable`。除少量明确的包内依赖外，可只选择一个product集成进自己的软件。最低声明平台为macOS 13与iOS/iPadOS 18；没有声明Linux/Windows兼容。

测试使用临时合成资料，未操作真实设备、私人课程、真实AI服务或Keychain。精确验证范围见[验证记录](Documentation/VALIDATION.md)。完整仓库保留表中尚未形成独立库的原生功能源码；模块目录和清单不把它们标记为已经完成独立软件化。

# InkSpace Swift Modules

16个独立库产品，每个产品是单独Swift target，可以只把所需产品加入自己的软件。它们不依赖完整App的BoardStore、主窗口或私人资料。它们是供开发者集成的库，不是16个可双击启动的成品App；完整应用的界面/硬件流程保留在完整仓库。

最低声明平台为macOS 13和iOS/iPadOS 18，Swift 5.9及以上。Apple框架模块没有声明Linux/Windows支持。

## 选择功能

| Swift产品 | 用途 | 包内依赖 |
|---|---|---|
| [InkSpaceTextHistory](Documentation/InkSpaceTextHistory/README.md) | 文本撤销与重做 | 无 |
| [InkSpaceOutline](Documentation/InkSpaceOutline/README.md) | Markdown 树形纲要转换 | 无 |
| [InkSpaceSubtitles](Documentation/InkSpaceSubtitles/README.md) | 字幕解析和时间点查询 | 无 |
| [InkSpacePaths](Documentation/InkSpacePaths/README.md) | 资料库路径校验 | 无 |
| [InkSpaceGeometry](Documentation/InkSpaceGeometry/README.md) | 页面排版、打印分块与文字选择几何 | 无 |
| [InkSpaceStudy](Documentation/InkSpaceStudy/README.md) | 学习卡片、事件排程与CSV/TSV | InkSpacePaths |
| [InkSpaceChecklist](Documentation/InkSpaceChecklist/README.md) | 课程清单格式和状态变换 | 无 |
| [InkSpacePDFRecords](Documentation/InkSpacePDFRecords/README.md) | PDF图层、批注和增页记录 | 无 |
| [InkSpaceMediaTimeline](Documentation/InkSpaceMediaTimeline/README.md) | 音视频工程模型与时间线计算 | 无 |
| [InkSpaceAI](Documentation/InkSpaceAI/README.md) | 导图AI请求、图片翻译与凭据存储 | 无 |
| [InkSpaceWebClips](Documentation/InkSpaceWebClips/README.md) | 网页剪藏与链接处理 | 无 |
| [InkSpaceSpeechText](Documentation/InkSpaceSpeechText/README.md) | 中英文朗读分段与高亮坐标 | 无 |
| [InkSpaceStorage](Documentation/InkSpaceStorage/README.md) | 协调文件读写与冲突保护 | InkSpacePaths |
| [InkSpaceOCR](Documentation/InkSpaceOCR/README.md) | 本机PDF/图片文字识别 | 无 |
| [InkSpaceExcelPictures](Documentation/InkSpaceExcelPictures/README.md) | XLSX内嵌图片读取 | 无 |
| [InkSpaceScanPDF](Documentation/InkSpaceScanPDF/README.md) | 多页PDF汇编和安全导出 | InkSpaceStorage |

## 添加到自己的软件

本次发行提供完整源码ZIP与每个产品的独立ZIP。下载并解压后，在Xcode选择 Add Local Package，指向含 Package.swift 的目录；SwiftPM使用 `.package(path: "本地解压目录")`。完整源码解压根目录和本 swift/ 子目录都保留有效 Package.swift，可只选择需要的 library product。

本地测试可使用`.package(path: "../inkspace-modules")`；也可使用同一源码的子目录清单`.package(path: "../inkspace-modules/swift")`（此时package identity是`swift`）。不要同时添加根目录和子目录清单，以免重复定义target。

```swift
import Foundation
import InkSpaceOutline

let data = try NoteOutline.encode(titles: ["Root", "Child"], edges: [(0, 1)])
let nodes = try NoteOutline.parse(data)
```

## 构建与验证

在仓库根目录运行`swift test`；也可运行`swift test --package-path swift`。测试target只使用普通`import`，验证公开API可被其它软件使用。完整验证范围见[验证记录](Documentation/VALIDATION.md)，未拆分的App流程和原因见[原生功能目录](FEATURES.md)。

源代码和资源不包含开发者账号、API密钥、设备文件或课程资料。第三方云服务调用由集成方提供自己的账号与密钥；本次测试没有进行真实服务调用或Keychain读写。

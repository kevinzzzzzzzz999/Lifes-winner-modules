# life'winner Modules · 散装功能库

希望每一个使用我开源功能的人，都是各自的 life'winner。

Reusable parts of life'winner, separated from the integrated notes application.

这里保存从 life'winner（人生赢家）拆出的独立功能库。完整软件另保留在同一 GitHub 账号的 `inkspace` 仓库中。你可以只取需要的包，也可以组合使用。

## 普通用户：直接使用 Mac 应用

本仓库的 Releases 发行区提供书写画板、偏好方案编辑器和文档工作台的应用下载，使用者无需安装开发工具。选择应用 ZIP，解压后将其中的 `.app` 放入“应用程序”。芯片选择、用途、保存与首次系统确认见[下载与使用指南](samples/packaging/macos/DOWNLOAD-HELP.md)。

对应的[公开构建配方](samples/packaging/macos/README.md)记录了源码到应用的发行适配；个人资料、私人配置、开发缓存和个人签名身份不属于发行内容。下面的库/组件入口面向需要集成源码的开发者。

## 选择功能

- **JavaScript / Node.js**：白板数据、笔迹、合并、PDF、Office、Notebook、文件存储、搜索、笔记交换、学习、任务日历、浏览器工具、翻译、媒体与数学计算。包目录见 [`packages/`](packages/)，准确的API、依赖和例子见各包 README。
- **Swift**：可分别导入的原生产品，见 [`swift/`](swift/)。每个产品的 Apple 框架和平台要求单独说明。
- **Obsidian**：可安装的独立伴侣，见 [`integrations/obsidian/`](integrations/obsidian/)。
- **Safari 分享剪藏**：可复用扩展源代码，见 [`integrations/safari-share-clipper/`](integrations/safari-share-clipper/)。它需要自己的承载应用与签名配置。

完整功能清单和边界见 [FEATURES.md](FEATURES.md)，共覆盖 63 个真实功能组。已提取的核心代码与需要平台宿主的界面分别标明；没有把所有功能都宣称为现成独立安装程序。

## 三个独立使用入口 / Three standalone starters

| 功能 | 库与说明 | 独立运行示例 |
| --- | --- | --- |
| 书写与演示辅助 | [InkSpaceWritingAids](swift/Documentation/InkSpaceWritingAids/README.md) | [WritingAidsDemo](samples/writing-aids/README.md) |
| 语言、布局、工具栏与操作偏好 | [InkSpacePreferences](swift/Documentation/InkSpacePreferences/README.md) | [InkSpacePreferencesDemo](samples/preferences/README.md) |
| 首页、文档路由和多窗口应用壳 | [application-shell](packages/application-shell/README.md) | 包内 Electron 示例，按该包说明启动 |

它们不需要完整 life'winner。Swift 示例需要 macOS 和 Xcode/Swift 工具链；应用壳示例需要 Node.js 和声明的 Electron 依赖。发布的独立 Swift ZIP 自带 `Example/`，可以直接按随包说明启动；克隆完整仓库时使用上表 `samples/` 入口。示例采用合成内容与独立存储，不读取原 App 的笔记、账号和偏好。Apple Pencil、系统随手写和系统协议登记等能力按包内平台说明接入。

## JavaScript 使用

需要 Node.js 24.15 或更新版本。下载或克隆本仓库后：

```sh
npm install
npm test
```

每个 `packages/` 子目录都是自己的 npm 包，可以通过本地目录安装到其他项目；它们不需要完整 life'winner 应用的 Electron 入口。PDF、Office、Python、翻译和媒体等功能仍有各自的软件、账号或宿主接口要求，请先阅读包说明。

## Swift 使用

使用 Swift Package Manager 添加 `swift/` 中的包，选择自己需要的 product。纯逻辑库与 Apple 专属库的平台要求不同；SwiftUI、PencilKit、Vision、PDFKit 等依赖不会被伪装成跨平台功能。

具体产品、构建指令和实际验证以 Swift 包说明为准。

## 状态与验证

这是开发中的模块源码发行。模块化不代表原完整软件的所有界面、设备稳定性和云同步问题都已解决。首次拆分的实际测试见 [VALIDATION.md](VALIDATION.md)，各包的限制见各自 README。

## 隐私、许可与来源

仓库只包含经检查的软件源码、测试和必要通用资源。个人资料、笔记、账号、凭据、设备信息和签名不属于发布内容。示例使用合成数据。

项目代码使用 [MIT License](LICENSE)。第三方代码保留原许可；各包记录原完整软件中的相对来源，后续更新必须同时核对完整软件和模块实现。首次拆分与集成边界见功能清单。

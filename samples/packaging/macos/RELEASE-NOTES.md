三个可以分别下载使用的 Mac 小软件，已经包含运行组件。使用时无需安装 Xcode、Node.js、Python 或完整版 InkSpace，也无需注册账号。

| 软件 | 下载 | 用途 |
| --- | --- | --- |
| 书写画板 · InkSpace Writing | [Mac 通用版]({{ASSET_BASE}}InkSpace-Writing-macos-universal.zip) | 独立矢量画板、形状辅助、文字卡、胶带复习和 JSON 保存 |
| 偏好方案编辑器 · InkSpace Preferences | [Mac 通用版]({{ASSET_BASE}}InkSpace-Preferences-macos-universal.zip) | 创建、保存、导入和导出独立偏好方案 |
| 文档工作台 · Document Workbench | [Apple 芯片版]({{ASSET_BASE}}document-workbench-macos-arm64.zip) · [Intel 版]({{ASSET_BASE}}document-workbench-macos-x64.zip) | 本地只读文本预览、标签与多窗口浏览 |

需要 macOS 13 或更新版本。前两个通用版适用于 Apple Silicon 和 Intel；文档工作台按“关于本机”显示的芯片选择。

下载表格中的 ZIP，双击解压，把其中的 `.app` 拖到“应用程序”，再双击打开。应用内提供使用帮助，[完整安装和保存说明]({{ASSET_BASE}}READ-ME-FIRST.md)也可单独下载。

**首次打开：**本版本使用不含个人身份的 ad-hoc 签名，尚未经过 Apple 公证。macOS 可能阻止首次打开；确认来源及文件完整性后，由使用者自行按照 [Apple 官方说明](https://support.apple.com/zh-cn/102445)，在“系统设置 → 隐私与安全性”中确认。保留系统安全保护，不需要执行终端命令。受管理的 Mac 可能限制此操作。

画板通过显式 JSON 导出保存；偏好工具只管理自己的方案，不修改 Mac 或原 InkSpace 设置。工作台仅预览有界 UTF-8 文本，PDF、Office、媒体等文件使用适合的专用软件。应用不附带私人笔记、账户凭据、本机配置或个人签名材料，不自动上传笔记或设置。

[下载摘要]({{ASSET_BASE}}SHA256SUMS.txt) · [构建清单]({{ASSET_BASE}}desktop-apps.json) · [两种芯片的启动验证]({{ASSET_BASE}}desktop-validation.json)。源码及精确构建配方保留在本仓库，许可为 MIT，第三方组件保留各自许可。最低系统声明与实际测试范围请以验证记录为准。

Download, unzip, move the app to Applications, and open it. No external developer tools or account are needed. These apps are ad-hoc signed and not Apple-notarized; a first-open confirmation may be required. Native tools are Universal; select the matching chip for Document Workbench.

# life'winner · 直接使用 Mac 应用 · 0.1.0

希望每一个使用我开源功能的人，都是各自的 life'winner。

这三个应用已经包含运行所需组件，使用时无需安装 Xcode、Node.js、Python 或完整版 life'winner，也不需要账号。

| 应用 | 做什么 | 下载 |
| --- | --- | --- |
| 书写画板 · life'winner Writing | 独立矢量绘图、形状辅助、文字卡与复习胶带；显式保存和打开自己的JSON绘图 | [Mac通用版](https://github.com/kevinzzzzzzzz999/inkspace-modules/releases/download/desktop-v0.1.0/InkSpace-Writing-macos-universal.zip) |
| 偏好方案编辑器 · life'winner Preferences | 编辑、保存、导入和导出一份独立偏好方案 | [Mac通用版](https://github.com/kevinzzzzzzzz999/inkspace-modules/releases/download/desktop-v0.1.0/InkSpace-Preferences-macos-universal.zip) |
| 文档工作台 · life'winner Document Workbench | 只读预览本地文本，使用标签和多窗口浏览 | [Apple芯片版](https://github.com/kevinzzzzzzzz999/inkspace-modules/releases/download/desktop-v0.1.0/document-workbench-macos-arm64.zip) · [Intel版](https://github.com/kevinzzzzzzzz999/inkspace-modules/releases/download/desktop-v0.1.0/document-workbench-macos-x64.zip) |

[全部下载文件和版本记录](https://github.com/kevinzzzzzzzz999/inkspace-modules/releases/tag/desktop-v0.1.0) · [完整使用指南](samples/packaging/macos/DOWNLOAD-HELP.md)

## 安装

1. 需要macOS 13或更新版本。前两个通用版可用于Apple Silicon和Intel Mac；文档工作台按“关于本机”显示的芯片选择。
2. 下载表格里的ZIP并双击解压。
3. 将其中的`.app`拖入“应用程序”，然后双击打开。应用内有使用帮助。

本版本使用不包含个人身份的ad-hoc签名，尚未经过Apple公证。从互联网下载后，macOS可能阻止首次打开；确认来源和文件完整性后，由使用者按[Apple官方说明](https://support.apple.com/zh-cn/102445)，在“系统设置 → 隐私与安全性”中自行确认。受管理的Mac可能限制此操作。保留系统保护，不需要终端命令。

## 使用范围与文件

书写画板退出前用Export JSON保存；它不会自动保存，也不直接读写完整life'winner白板。偏好工具只管理自己的独立方案，不改变Mac系统或原life'winner设置，不执行AI/翻译/播放/Pencil动作。文档工作台只读预览512 KiB以内UTF-8文本；PDF、Office、图片和媒体等文件请用适合的软件打开，退出后不保存工作区历史。

应用不附带个人笔记、账号凭据、设备记录、本机开发路径、配置或个人签名材料。绘图与方案由使用者选择位置保存；工作台只读取主动选择的文件。没有自动笔记上传，也不需要连接AI账号。

## 验证与源码

应用由公开源码和官方运行组件构建。Apple芯片和Intel的云端构建机均完成启动检查；文档工作台完成成品窗口和合成文本预览检查。完整交互范围、公开下载后的摘要和隐私验收见[验收说明](DOWNLOAD-CHECKS.md)。最低系统声明不表示已经在每个旧系统版本上实际运行。

[文件摘要](https://github.com/kevinzzzzzzzz999/inkspace-modules/releases/download/desktop-v0.1.0/SHA256SUMS.txt) · [构建清单](https://github.com/kevinzzzzzzzz999/inkspace-modules/releases/download/desktop-v0.1.0/desktop-apps.json) · [两种芯片验证](https://github.com/kevinzzzzzzzz999/inkspace-modules/releases/download/desktop-v0.1.0/desktop-validation.json) · [可复现构建配方](samples/packaging/macos/README.md)

当前链接保留既有 Mac 0.1.0 发行文件，应用内可能仍显示历史名称；life'winner 品牌会在后续新版本中统一。兼容下载文件名、技术标识与已有链接保持不变，历史发行不改写。

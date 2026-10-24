# Mac 版下载、安装与使用

这三个小软件可以分别下载、直接使用。下载好的应用已经包含运行需要的组件，无需安装 Node.js、Xcode、Python 或完整版 InkSpace，也不需要注册账号。

## 先选一个下载

| 软件 | 适合做什么 | 下载文件 |
| --- | --- | --- |
| 书写画板 · InkSpace Writing | 画线、整理形状、放文字卡，用胶带遮挡复习，保存自己的绘图 | `InkSpace-Writing-macos-universal.zip` |
| 偏好方案编辑器 · InkSpace Preferences | 编辑、保存和分享独立的语言、布局、笔栏及操作偏好方案 | `InkSpace-Preferences-macos-universal.zip` |
| 文档工作台 · Document Workbench | 打开本地文件夹、只读查看文本，在多个标签和窗口间切换 | M 系列 Mac 选 `document-workbench-macos-arm64.zip`；Intel Mac 选 `document-workbench-macos-x64.zip` |

这些应用的最低系统要求为 macOS 13。前两份是 Universal 包，Apple Silicon 与 Intel Mac 使用同一份下载；文档工作台需要按芯片选择。

不确定芯片时，点屏幕左上角苹果菜单中的“关于本机”：显示 Apple M 系列芯片就选 arm64，显示 Intel 处理器就选 x64。经过实际运行验证的系统和芯片，以本次发行记录为准。

## 下载后怎么安装

1. 在软件的下载入口选择上表中的 ZIP 文件。普通使用请选择应用下载，不必下载源码工作区。
2. 下载完成后，在 Finder 中双击 ZIP 解压。
3. 找到 `InkSpace Writing.app`、`InkSpace Preferences.app`，或“文档工作台.app”，拖入“应用程序”文件夹。
4. 到“应用程序”中双击打开。Finder 可能省略显示名称末尾的 `.app`。

可以只装其中一个，也可以全部安装。文档工作台已自带 Electron 运行组件，不需要另外安装 Node.js 或浏览器。

## 第一次打开时出现安全提示

这些版本使用不含个人证书的本地 ad-hoc 签名，尚未经过 Apple 公证。从互联网下载后，macOS 可能阻止首次打开；这不保证在每台 Mac 上都能直接打开。

只有在你确认下载来源可信、文件没有被改动，并决定继续时，才按 [Apple 官方首次打开说明](https://support.apple.com/zh-cn/102445)操作：先尝试打开一次，再到“系统设置 → 隐私与安全性”。如果系统提供“仍要打开”，由你自行选择并确认后续提示。部分受管理的 Mac 可能不提供这个选项。

如果系统提示软件会损坏电脑或文件已损坏，请停止打开，回到发行页核对文件或联系维护者。保留系统安全保护即可，不需要执行终端命令。

## 书写画板：怎样画、怎样保存

打开 InkSpace Writing 后，可以用鼠标或触控板画线。它是独立矢量画板，适合临时画图、演示和复习。

- **Hold line / Hold shape**：画出直线或所选形状的轮廓，停住片刻；出现预览后松开。
- **Wave / Fill**：生成波浪线，或将闭合轮廓填色。
- **Laser**：临时激光轨迹，松开后逐渐消失。
- **Tape / Reveal tape**：添加遮挡胶带，再按需揭开。胶带适合复习遮挡，不是永久涂黑或隐私删除。
- **文字卡**：输入文字后提交到画板。Mac 版不会将手写识别成文字。
- **Undo / ⌘Z**：撤销；**Clear**：清空当前画板。

退出前点 **Export JSON**，选择位置保存。以后用 **Open JSON** 打开本工具的绘图文件。画板不会自动替你保存；激光、未提交的文字草稿和撤销历史不在导出文件中。

这种 JSON 是本工具自己的文件，不是完整 InkSpace 白板格式；它不会自动打开或修改原来的笔记资料库。

## 偏好方案：保存的是一份独立方案

InkSpace Preferences 提供语言与布局、工具栏与笔栏、Pencil 操作选项、播放与字幕外观四页设置。你可以试着调整参数，保存方案，或导出给其他组件使用。

这些选择只影响本工具的方案和演示。它不会修改 Mac 系统或原 InkSpace 的偏好，也不会执行翻译、AI、播放或 Apple Pencil 硬件动作。

- **Save / 保存**：把当前方案保存在本机，下次打开本工具时恢复。
- **Reload / 重新读取**：回到上次保存的方案，放弃当前未保存修改。
- **Reset defaults / 恢复默认**：先恢复当前预览；点保存后才长期保留。
- **Import / 导入方案**：打开本工具支持的 JSON 方案，导入后还需点保存。
- **Export / 导出方案**：将当前方案另存到你选择的位置，便于备份或分享。

导入格式错误、过大或不兼容的文件时，本工具会拒绝导入并保留当前方案。它不能用来直接导入 Mac 系统设置或其他软件的配置文件。

## 文档工作台：本地只读查看

在 Document Workbench 中，点“打开文档”选择一个文件，或点“打开工作区”选择一个文件夹。可以打开多个标签、筛选切换已打开的文档，也可以另开窗口。

当前版本只读预览 UTF-8 文本，单个文件上限为 512 KiB，约 0.5 MB。Markdown、代码、TeX、CSV、HTML 和 Notebook 源文件按文本显示，不执行其中的脚本。PDF、Office、图片、音视频等二进制文件，请使用适合该格式的软件打开。

工作台不会编辑或覆盖这些文件。每个窗口的文件访问各自独立；选择单个文件不会自动允许读取相邻文件。退出后不保存工作区历史，下次需要重新选择。

这是一款本地文档工作台，不包含完整 InkSpace 的所有编辑器、手写画布或云同步。

## 文件与隐私

绘图和方案由你选择保存或导出；文档工作台只读取你主动选择的文件或文件夹。这三个工具不上传个人笔记，不需要账号，也不附带凭据、私人笔记或其他用户资料。

你自己输入的文字可能出现在绘图或方案导出文件中，分享前请查看内容。退出应用不会删除已经保存或导出的文件。

## English summary

Download the ZIP, extract it, move the `.app` to Applications, and open it. No Node.js, Xcode or account is needed. Writing and Preferences are Universal macOS 13+ apps; choose arm64 or x64 for Document Workbench. Writing saves its own drawings through explicit JSON export. Preferences edits independent plans. Workbench previews bounded local text read-only. These ad-hoc-signed apps are not Apple-notarized; follow [Apple’s guidance](https://support.apple.com/en-us/102445) and keep system protections enabled.

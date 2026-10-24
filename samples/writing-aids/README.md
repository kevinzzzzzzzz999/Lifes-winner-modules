# Writing Aids Playground / 辅助书写与演示画布

一个可以单独运行的 Mac 小工具，使用 `InkSpaceWritingAids`。无需完整 Life's winner、账号、第三方包或服务器；启动时是空白画布，示例数据为代码生成的虚构内容。

需要 macOS 13+、Swift 5.9+ 与 Xcode 命令行开发工具。进入包含本 README 和 `Package.swift` 的目录，运行：

```sh
bash script/build_and_run.sh
```

脚本会构建 `WritingAidsDemo`，在本目录 `dist` 生成 `.app`，对它做本地 ad-hoc 签名后启动；不需要 Apple 账号或开发者证书。该签名用于本机运行，不代表 Apple 公证或可直接向其他 Mac 分发的安装包。SwiftPM 单独构建和行为测试：

```sh
swift build --product WritingAidsDemo
swift test
```

可使用脚本的 `--verify`、`--debug`、`--logs` 模式。`WRITING_AIDS_BUILD_DIR`、`WRITING_AIDS_DIST_DIR` 可指定构建和 App 输出目录，便于只读源码和隔离验证。脚本只终止同名示例进程，重新启动本示例。源码仓库的 manifest 只依赖本仓库的 `InkSpaceWritingAids` 产品；独立 ZIP 内的 Example manifest 只依赖 ZIP 根的同名库，不需要下载完整源工作区。

## 试用

| 工具 | 用法 |
| --- | --- |
| Hold line | 鼠标画一条大致直线，停住至少 0.65 秒；绿色预览出现后松开 |
| Hold shape | 选择圆、椭圆、矩形、三角形、箭头或坐标轴，画对应轮廓并停住；无法拟合时保留原线 |
| Ink / Highlighter | 普通矢量笔迹/半透明高亮；勾选置底后，只有新高亮移动到普通笔迹下面 |
| Laser | 拖动红色激光，松开后消失；不会加入导出文件 |
| Wave / Fill | 拖动生成弧长波浪线，或围出区域，松开自动闭合填充 |
| Tape / Reveal tape | 画粗遮挡条；选择 Reveal tape 后点击同一位置揭开或重新遮挡 |
| Create text card | 编辑上方文字并生成卡片；Mac 用键盘，iPad 的系统手写适配见库文档 |

`Synthetic example` 添加虚构的高亮、直线、文字卡和胶带，方便立即测试揭开。`Undo` 或 ⌘Z 撤销本次会话最多 30 步。`Clear` 创建新的空白示例。所有内容只在内存，退出不会自动保存。

`Toggle tapes` 为键盘和辅助功能使用者提供全部胶带的揭开/遮挡按钮；画布里的点击仍可逐条操作。

`Export JSON…` 只把当前示例图画、胶带和文字导出到你选择的位置；`Open JSON…` 可以重新打开它。文件采用示例自己的版本化 JSON，不是完整 Life's winner 白板格式；激光、草稿、撤销栈不导出。原生字体/窗口行为由 macOS 负责，不复制 PencilKit 纹理。没有网络访问、真实笔记读取、自动上传或后台同步。

## Integration

The sample is a small host for the standalone module: it supplies mouse points, monotonic time, a canvas, an undo history, explicit file selection, and host acceptance of text cards. The library supplies fitting, bounded geometry, highlighter ordering, laser state, tape geometry/persistence primitives, and draft acknowledgement. Native iPad Scribble requires the separately provided system input adapter and a supported device; this Mac demo does not recognize handwriting.

See the `InkSpaceWritingAids` library README for API examples, source mapping and host boundaries. This sample uses MIT-licensed Life's winner source and synthetic data only.

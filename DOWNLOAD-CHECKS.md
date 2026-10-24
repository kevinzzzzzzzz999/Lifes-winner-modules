# 公开下载与使用验收 / Public download and usage checks

验收日期：2026-10-24。模块源码修订：`11fb58cf27dc4dbe44f50b6f35f6e27635413df2`；完整软件源码修订：`d65fcddd1de4b66b52ccef4d12707c763ea07936`。

**实际通过未登录的 GitHub 公开下载链接获取了全部 40 份归档：38 份独立功能下载、完整模块工作区、完整软件源码。40/40 的 SHA-256 与发布清单一致。** 验收没有用本机准备上传的文件冒充公开下载结果。

All 40 archives were fetched anonymously through their public GitHub download links. Their SHA-256 digests match the published manifests. Usability checks below distinguish reusable libraries from installable applications.

## 下载之后是否能用

| 范围 | 实际检查 | 使用条件 |
| --- | --- | --- |
| 19 个 Node.js 功能包 | 每个最终公开 ZIP 独立解压、`npm pack`、安装到全新消费者；19/19 个 README 示例、217/217 项行为测试通过，0 失败、0 跳过 | Node.js 与声明依赖；外部引擎及宿主接口见各包说明 |
| 16 个 SwiftPM 产品 | 各自独立消费者编译、链接并运行 API；最终下载的源码、资源和清单与已运行版本逐字节相同 | 相应 Apple SDK、系统版本与框架 |
| 公开 URL 接入 SwiftPM | 新项目通过公开 HTTPS 仓库 URL 与上述固定修订匿名取回源码，仅依赖 InkSpaceOutline，构建及纲要编码/解析运行成功 | 在 Xcode/SwiftPM 中选择所需 product；ZIP 则解压后添加本地 package |
| React UI 0.1.1 | 最终下载的 217 个成员与验收版本完全一致；30 个界面表面、45 次挂载/交互检查、严格 TypeScript 独立消费者和生产构建通过 | 安装声明依赖并构建；15 个表面由 props 驱动，15 个需要显式宿主能力 |
| Obsidian 伴侣 | 最终下载包重新执行 35/35 项回归，0 失败、0 跳过 | 需要 Obsidian；原生打开/书写需要兼容的系统协议处理程序；未做真实 Obsidian UI 验收 |
| Safari 分享集成 | 最终包许可、说明链接及已验收的 Swift/JavaScript/plist 源字节核对通过；此前独立 iOS SDK 类型检查与合成预处理检查通过 | 源码集成，需要承载 App、扩展 target 和签名；尚无独立真机安装验收 |
| 完整模块工作区 | 公开 ZIP 可解压，根 Package.swift、Swift 与 UI 内容和独立包一致 | 按包内说明选择功能和依赖 |
| 完整 InkSpace | 公开源码 ZIP 可下载且摘要一致，仓库中展开源码可浏览 | 当前发布的是源码预览，需要依照[完整软件说明](https://github.com/kevinzzzzzzzz999/inkspace)构建；本轮未新增安装包或全设备稳定性结论 |

Node 测试使用 Node.js 24.19.0 / npm 12.2.1，各消费者独立解析依赖，没有使用完整 App 的依赖目录或 NODE_PATH。上述安装包由官方 npm 工具在本地生成，尚未发布到 npm 注册表。

Notebook 的真实 IPython 执行此前已在独立环境中验证：三个合成单元格、变量延续、Matplotlib PNG 与正常关闭；最终包的 18 份相关代码/运行输入与该版本一致。OCR、FFmpeg、Tectonic、AI/翻译服务与系统授权等条件仍以各包说明为准，未实际运行的外部服务没有计入通过结果。

## 功能有没有漏项

[63 个功能组](FEATURES.md)已经逐项登记，[覆盖审计](coverage-audit.json)记录真实导出、下载入口和依赖边界。其中原生书写辅助、应用偏好、完整应用壳三组目前仍在完整 App 源码中，尚未拆成独立产品。其余条目中的核心库、界面组件和集成源码也按各自条件使用。

“可以独立使用”表示可接入其他项目，无需完整 InkSpace；它不表示每份 ZIP 都是能双击启动的 App。

## 自行复核

1. 从[模块目录](README.md)选择 ZIP，按包内 README 解压、安装与运行示例。
2. 用[下载清单](download-manifest.json)核对归档 SHA-256；完整工作区逐文件摘要见[source-tree-manifest.json](source-tree-manifest.json)。
3. 查看[Node 验证细节](NODE-VALIDATION.md)、[其他验证记录](VALIDATION.md)以及源码中的测试。

这些结论适用于本页固定修订及摘要相同的归档。未来源码或依赖变化后，需要重新验证受影响功能；已有完整软件设备稳定性限制仍保留在原验证记录中。

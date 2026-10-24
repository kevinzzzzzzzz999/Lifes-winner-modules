# Swift模块验证记录

日期：2026-10-24。使用Xcode 27.1所带Swift工具链；测试内容全部为临时合成资料。

## 通过的检查

- 仓库根和`swift/`子目录的SwiftPM manifest均通过`dump-package`。16个library products、17个targets（含测试target）的名称、依赖和resources配置一致，根target路径明确指向`swift/Sources/`。
- `swift test --package-path swift`：20项测试，0失败。
- 从仓库根运行`swift test`：同样20项测试，0失败。
- 测试target使用普通`import`分别导入16个产品，未使用`@testable`；验证公开接口、资源Bundle和实际链接均可用。
- `xcodebuild -scheme InkSpaceModules-Package -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -configuration Debug ARCHS=arm64 CODE_SIGNING_ALLOWED=NO build`：`BUILD SUCCEEDED`。构建16个独立产品，没有安装或启动设备。

所有构建产物置于本地临时目录，不属于发布源码。

## 行为测试

| 主题 | 实际检查 |
|---|---|
| 文本历史 | Undo/Redo、撤销后新分支、20步历史上限 |
| 纲要 | 标题转义往返、父子关系、环和非法缩进拒绝 |
| 字幕 | 重叠字幕、结束时间排他、无效VTT和容量拒绝 |
| 路径 | 已存在文件解析、目录穿越及指向根外的符号链接拒绝 |
| 页面/打印 | 原点/缩放几何、非法比例、分页框有效性 |
| 文字选择 | 旧分析代际拒绝、世界坐标变换和位图预算 |
| 学习卡片 | CSV多行往返、公式转义、坏引号、确定性ID、挖空、事件校验、排程和非法日期 |
| 课程清单 | 包内诗词资源、添加/完成/奖励、归档后拒绝切换和坏格式 |
| PDF记录 | 图层/批注校验、颜色归一、删除投影、增页事件往返和切片几何 |
| 媒体模型 | 剪辑范围/速度/时长验证及字幕长度边界 |
| AI | 导图结构和密钥/模型输入格式；注入假transport返回翻译和认证失败，不调用网络 |
| 网页 | URL凭据/协议拒绝、惰性HTML转义、剪藏JSON读取 |
| 朗读文本 | 中英文分段、UTF-16范围、词表去重、上下原点转换 |
| 文件存储 | 指纹匹配写入、外部变更拒绝覆盖、非法目录拒绝 |
| OCR | 默认/指定页码和50页边界；未评估识别准确率 |
| XLSX图片 | 损坏/非ZIP输入拒绝；未跑完整工作簿语料 |
| 扫描PDF | 合成PDF按页输出、重名另存、原文件字节保持及空页列表拒绝 |

## 适用范围

macOS 13、iOS/iPadOS 18是包声明的最低平台；本次没有逐一运行最低系统版本。Apple框架依赖不代表Linux/Windows兼容。

没有进行真实Apple Pencil、大范围白板套索、iCloud跨设备、Safari分享扩展、真实AI账号请求或Keychain运行测试。完整App中仍耦合的功能见[原生功能目录](../FEATURES.md)，不计入这16个独立产品的已验证范围。

# InkSpaceAI

导图AI请求、图片翻译与凭据存储。这是可单独 `import InkSpaceAI` 的Swift库，无需安装完整InkSpace应用。

最低声明平台：macOS 13、iOS/iPadOS 18；Swift 5.9及以上。框架：Foundation, Security。无其它InkSpace target依赖。

## API

`AIClient.outline, AIOutline.validatedCount, PDFTranslationClient.translate, PDFTranslationTransport, PDFTranslationInput, APIKeyStore, PDFTranslationKeyStore`

## 示例

示例中未定义的文件URL/数据由调用方提供；涉及throws/async的片段放入相应调用上下文。

```swift
import Foundation
import InkSpaceAI
let tree = AIOutline(title: "Root", children: [AIOutline(title: "Child")])
let count = try tree.validatedCount()
let checkedModel = try PDFTranslationInput.model("example-model")
// 在async上下文中，使用自己的PNG/model/key调用PDFTranslationClient().translate(...)。
```

## 范围与约束

调用者提供模型和自己的服务密钥。默认模型名称仅继承源码，服务是否开放/收费不由本库保证。翻译transport可注入；测试只用假transport，未请求真实服务或操作Keychain。包内默认Keychain服务名使用InkSpace.Modules命名，独立于完整App。

## 来源

从完整应用中以下源文件抽取并公开API、增加公开构造器或最小适配；原应用未被改写：

- `ios/InkSpace/AI/AIClient.swift`
- `ios/InkSpace/AI/PDFTranslationClient.swift`
- `ios/InkSpace/AI/PDFTranslationProvider.swift`

验证细节见 [总验证记录](../VALIDATION.md)。

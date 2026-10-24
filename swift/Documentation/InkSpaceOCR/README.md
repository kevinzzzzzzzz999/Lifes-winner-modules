# InkSpaceOCR

本机PDF/图片文字识别。这是可单独 `import InkSpaceOCR` 的Swift库，无需安装完整InkSpace应用。

最低声明平台：macOS 13、iOS/iPadOS 18；Swift 5.9及以上。框架：Foundation, Vision, CoreGraphics, ImageIO, PDFKit。无其它InkSpace target依赖。

## API

`LocalOCR.recognize(url:pages:customWords:progress:), imageForSelection(url:), selectedPages(range:pageCount:)`

## 示例

示例中未定义的文件URL/数据由调用方提供；涉及throws/async的片段放入相应调用上下文。

```swift
import Foundation
import InkSpaceOCR
import CoreGraphics
let pages = try LocalOCR.selectedPages(range: 1...3, pageCount: 10)
// async上下文：let result = try await LocalOCR.recognize(url: authorizedFile, pages: 1...3)
```

## 范围与约束

支持原生PDF文本提取和本机Vision识别；仍受系统识别语言、图片质量和内存限制。本次编译与页码边界测试通过，未把模型/硬件准确率作为已验收。输入文件保持只读，带取消和容量限制。

## 来源

从完整应用中以下源文件抽取并公开API、增加公开构造器或最小适配；原应用未被改写：

- `ios/InkSpace/Core/LocalOCR.swift`

验证细节见 [总验证记录](../VALIDATION.md)。

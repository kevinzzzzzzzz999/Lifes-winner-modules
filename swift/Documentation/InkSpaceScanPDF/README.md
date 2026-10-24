# InkSpaceScanPDF

多页PDF汇编和安全导出。这是可单独 `import InkSpaceScanPDF` 的Swift库，无需安装完整InkSpace应用。

最低声明平台：macOS 13、iOS/iPadOS 18；Swift 5.9及以上。框架：Foundation, PDFKit; depends on InkSpaceStorage。包内依赖：InkSpaceStorage。

## API

`ScannedPDFExport.save(pages:root:relativeDirectory:title:)`

## 示例

示例中未定义的文件URL/数据由调用方提供；涉及throws/async的片段放入相应调用上下文。

```swift
import Foundation
import InkSpaceScanPDF
let saved = try ScannedPDFExport.save(pages: suppliedPages, root: authorizedRoot, relativeDirectory: "", title: "Scan")
```

## 范围与约束

接收调用方提供的PDFPage，按顺序汇编并另存，自动避开重名文件；不包含摄像头扫描UI、裁边或旋转编辑器。已用合成PDF测试保存/重名保护。

## 来源

从完整应用中以下源文件抽取并公开API、增加公开构造器或最小适配；原应用未被改写：

- `ios/InkSpace/Documents/ScannedPDFExport.swift`

验证细节见 [总验证记录](../VALIDATION.md)。

# InkSpacePDFRecords

PDF图层、批注和增页记录。这是可单独 `import InkSpacePDFRecords` 的Swift库，无需安装完整InkSpace应用。

最低声明平台：macOS 13、iOS/iPadOS 18；Swift 5.9及以上。框架：Foundation, CoreGraphics。无其它InkSpace target依赖。

## API

`PDFWorkspaceEvent.make/decodeValidated/encoded, PDFWorkspaceProjection.project, PDFExtensionEvent.decodeValidated, PDFExtensionGeometry.slices`

## 示例

示例中未定义的文件URL/数据由调用方提供；涉及throws/async的片段放入相应调用上下文。

```swift
import Foundation
import InkSpacePDFRecords
import CoreGraphics
let layer = PDFWorkspaceLayer(name: "Notes")
let event = try PDFWorkspaceEvent.make(layer: layer)
let checked = try PDFWorkspaceEvent.decodeValidated(event.encoded())
let view = PDFWorkspaceProjection.project([checked])
```

## 范围与约束

这是JSON记录、冲突投影和留白布局模块，不是PDF文件导出器。原生笔迹载荷仅作为有界opaque Data保存，不解析PencilKit。输入应经decodeValidated；事件投影前使用make/decodeValidated取得有效时间。

## 来源

从完整应用中以下源文件抽取并公开API、增加公开构造器或最小适配；原应用未被改写：

- `ios/InkSpace/PDFWorkspace/PDFWorkspaceEvent.swift`
- `ios/InkSpace/PDFExtension/PDFNativeInkArchive.swift`
- `ios/InkSpace/PDFExtension/PDFExtensionModel.swift`
- `ios/InkSpace/PDFExtension/PDFExtensionGeometry.swift`

验证细节见 [总验证记录](../VALIDATION.md)。

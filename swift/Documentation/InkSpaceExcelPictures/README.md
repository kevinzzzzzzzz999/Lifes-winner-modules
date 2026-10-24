# InkSpaceExcelPictures

XLSX内嵌图片读取。这是可单独 `import InkSpaceExcelPictures` 的Swift库，无需安装完整InkSpace应用。

最低声明平台：macOS 13、iOS/iPadOS 18；Swift 5.9及以上。框架：Foundation, ImageIO, CryptoKit, zlib, Darwin。无其它InkSpace target依赖。

## API

`ExcelEmbeddedPictures.read(data:), read(url:), decode(_:maximumDimension:), ExcelPictureBook`

## 示例

示例中未定义的文件URL/数据由调用方提供；涉及throws/async的片段放入相应调用上下文。

```swift
import Foundation
import InkSpaceExcelPictures
let book = try ExcelEmbeddedPictures.read(data: workbookData)
for sheet in book.sheets { print(sheet.name, sheet.pictures.count) }
```

## 范围与约束

只读XLSX绘图关系及图片，绝不执行宏或抓取外部资源；不写工作簿、不渲染图表/组合形状，不支持旧XLS图片。保留ZIP、XML和像素容量限制。

## 来源

从完整应用中以下源文件抽取并公开API、增加公开构造器或最小适配；原应用未被改写：

- `ios/InkSpace/Documents/ExcelEmbeddedPictures.swift`

验证细节见 [总验证记录](../VALIDATION.md)。

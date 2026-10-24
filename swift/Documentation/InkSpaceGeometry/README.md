# InkSpaceGeometry

页面排版、打印分块与文字选择几何。这是可单独 `import InkSpaceGeometry` 的Swift库，无需安装完整InkSpace应用。

最低声明平台：macOS 13、iOS/iPadOS 18；Swift 5.9及以上。框架：Foundation, CoreGraphics。无其它InkSpace target依赖。

## API

`PageGrid.expansionLayout, PrintPageGeometry.frames/validate, BoardTextSelectionSnapshotKey, BoardTextSelectionGeneration`

## 示例

示例中未定义的文件URL/数据由调用方提供；涉及throws/async的片段放入相应调用上下文。

```swift
import Foundation
import InkSpaceGeometry
import CoreGraphics
let frames = try PageGrid.expansionLayout(pageSizes: [CGSize(width: 612, height: 792)], at: .zero)
let printFrames = try PrintPageGeometry.frames(for: CGRect(x: 10, y: 10, width: 1200, height: 1800))
```

## 范围与约束

纯几何和分析结果代际判断；不渲染PDF、手写或VisionKit界面。保留画布边界、2000页等限制。PageGrid旧App格式错误被独立PageGridError替代。

## 来源

从完整应用中以下源文件抽取并公开API、增加公开构造器或最小适配；原应用未被改写：

- `ios/InkSpace/Core/PageGrid.swift`
- `ios/InkSpace/Core/PrintPageGeometry.swift`
- `ios/InkSpace/Core/BoardTextSelectionGeometry.swift`

验证细节见 [总验证记录](../VALIDATION.md)。

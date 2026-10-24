# InkSpaceTextHistory

文本撤销与重做。这是可单独 `import InkSpaceTextHistory` 的Swift库，无需安装完整InkSpace应用。

最低声明平台：macOS 13、iOS/iPadOS 18；Swift 5.9及以上。框架：Foundation。无其它InkSpace target依赖。

## API

`DraftTextHistory.init(initialText:), track(_:), undo(), redo(), current, canUndo, canRedo`

## 示例

示例中未定义的文件URL/数据由调用方提供；涉及throws/async的片段放入相应调用上下文。

```swift
import Foundation
import InkSpaceTextHistory
var history = DraftTextHistory(initialText: "A")
history.track("B")
let previous = history.undo() // "A"
```

## 范围与约束

不包含编辑器界面、文件写入或系统 UndoManager。最多保留20步、400万UTF-16历史字符。

## 来源

从完整应用中以下源文件抽取并公开API、增加公开构造器或最小适配；原应用未被改写：

- `ios/InkSpace/Core/DraftTextHistory.swift`

验证细节见 [总验证记录](../VALIDATION.md)。

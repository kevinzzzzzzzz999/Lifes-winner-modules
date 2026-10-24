# InkSpaceOutline

Markdown 树形纲要转换。这是可单独 `import InkSpaceOutline` 的Swift库，无需安装完整InkSpace应用。

最低声明平台：macOS 13、iOS/iPadOS 18；Swift 5.9及以上。框架：Foundation。无其它InkSpace target依赖。

## API

`NoteOutline.parse(_:), encode(titles:edges:), NoteOutlineNode`

## 示例

示例中未定义的文件URL/数据由调用方提供；涉及throws/async的片段放入相应调用上下文。

```swift
import Foundation
import InkSpaceOutline
let data = try NoteOutline.encode(titles: ["Root", "Child"], edges: [(0, 1)])
let nodes = try NoteOutline.parse(data)
```

## 范围与约束

只支持标题和列表形成的树，不包含普通正文Markdown渲染、任意多父图或导图界面。保留1MiB、500节点和12层上限。

## 来源

从完整应用中以下源文件抽取并公开API、增加公开构造器或最小适配；原应用未被改写：

- `ios/InkSpace/Exchange/NoteOutline.swift`

验证细节见 [总验证记录](../VALIDATION.md)。

# InkSpaceChecklist

课程清单格式和状态变换。这是可单独 `import InkSpaceChecklist` 的Swift库，无需安装完整InkSpace应用。

最低声明平台：macOS 13、iOS/iPadOS 18；Swift 5.9及以上。框架：Foundation, CoreFoundation, CryptoKit。无其它InkSpace target依赖。

## API

`CourseChecklistDocument.create/decode/applying, CoursePoem.bundled, CourseChecklistTask`

## 示例

示例中未定义的文件URL/数据由调用方提供；涉及throws/async的片段放入相应调用上下文。

```swift
import Foundation
import InkSpaceChecklist
let poems = try CoursePoem.bundled()
let checklist = try CourseChecklistDocument.create(title: "Example")
let changed = try checklist.applying(.add(text: "Read", section: "Study"), poems: poems)
```

## 范围与约束

清单模型、验证和纯状态变换，不包含文件冲突存储或清单界面。诗词为包内通用资源，通过Bundle.module读取，最多1000任务/1MiB。

## 来源

从完整应用中以下源文件抽取并公开API、增加公开构造器或最小适配；原应用未被改写：

- `ios/InkSpace/CourseChecklist/CourseChecklistModel.swift`

验证细节见 [总验证记录](../VALIDATION.md)。

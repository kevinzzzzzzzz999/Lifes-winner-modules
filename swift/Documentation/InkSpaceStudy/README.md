# InkSpaceStudy

学习卡片、事件排程与CSV/TSV。这是可单独 `import InkSpaceStudy` 的Swift库，无需安装完整InkSpace应用。

最低声明平台：macOS 13、iOS/iPadOS 18；Swift 5.9及以上。框架：Foundation, CoreFoundation, CryptoKit。包内依赖：InkSpacePaths。

## API

`StudyCSV.parse/export/stableID, StudyEvent.decode/data/normalized, StudyProjection.cards, StudyCloze, StudyContentBlock`

## 示例

示例中未定义的文件URL/数据由调用方提供；涉及throws/async的片段放入相应调用上下文。

```swift
import Foundation
import InkSpaceStudy
let pairs = [StudyCSVPair(question: "Question", answer: "Answer")]
let csv = try StudyCSV.export(pairs, delimiter: ",", formulaProtection: true)
let rows = try StudyCSV.parse(csv.data, delimiter: ",", header: false)
```

## 范围与约束

不包含卡片界面、App白板节点转换或StudyRepository文件库。新建原始事件后须normalized()或经decode/data校验，再读取派生日期/做投影；CSV导出没有表头，回读header应为false。

## 来源

从完整应用中以下源文件抽取并公开API、增加公开构造器或最小适配；原应用未被改写：

- `ios/InkSpace/Study/StudyModel.swift`
- `ios/InkSpace/Study/StudyRichContent.swift`
- `ios/InkSpace/Study/StudyCSV.swift`

验证细节见 [总验证记录](../VALIDATION.md)。

# InkSpaceSpeechText

中英文朗读分段与高亮坐标。这是可单独 `import InkSpaceSpeechText` 的Swift库，无需安装完整InkSpace应用。

最低声明平台：macOS 13、iOS/iPadOS 18；Swift 5.9及以上。框架：Foundation, CoreGraphics。无其它InkSpace target依赖。

## API

`BoardReadAloudText.languageRuns/vocabulary/topLeftRect, BoardReadAloudLine.highlight`

## 示例

示例中未定义的文件URL/数据由调用方提供；涉及throws/async的片段放入相应调用上下文。

```swift
import Foundation
import InkSpaceSpeechText
import CoreGraphics
let runs = BoardReadAloudText.languageRuns("Hello 世界")
let vocabulary = BoardReadAloudText.vocabulary("Term A\nTerm B")
```

## 范围与约束

不包含AVSpeechSynthesizer播放控制、语音选择、OCR分析或App会话状态。范围按UTF-16计量，保留中文/拉丁字符分段规则。

## 来源

从完整应用中以下源文件抽取并公开API、增加公开构造器或最小适配；原应用未被改写：

- `ios/InkSpace/Core/BoardReadAloudText.swift`

验证细节见 [总验证记录](../VALIDATION.md)。

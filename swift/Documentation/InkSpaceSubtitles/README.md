# InkSpaceSubtitles

字幕解析和时间点查询。这是可单独 `import InkSpaceSubtitles` 的Swift库，无需安装完整InkSpace应用。

最低声明平台：macOS 13、iOS/iPadOS 18；Swift 5.9及以上。框架：Foundation。无其它InkSpace target依赖。

## API

`BoardSubtitleParser.parse(data:fileExtension:), BoardSubtitleDocument.text(at:), BoardSubtitleCue`

## 示例

示例中未定义的文件URL/数据由调用方提供；涉及throws/async的片段放入相应调用上下文。

```swift
import Foundation
import InkSpaceSubtitles
let data = Data("1\n00:00:00,000 --> 00:00:01,000\nHello\n".utf8)
let subtitles = try BoardSubtitleParser.parse(data: data, fileExtension: "srt")
let text = subtitles.text(at: 0.5)
```

## 范围与约束

不包含播放器、字幕关联持久化或导入界面。支持SRT/VTT/TXT和重叠cue查询，保留2MiB、一万段等限制。

## 来源

从完整应用中以下源文件抽取并公开API、增加公开构造器或最小适配；原应用未被改写：

- `ios/InkSpace/Video/BoardVideoSubtitles.swift`

验证细节见 [总验证记录](../VALIDATION.md)。

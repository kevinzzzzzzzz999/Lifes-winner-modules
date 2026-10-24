# InkSpaceMediaTimeline

音视频工程模型与时间线计算。这是可单独 `import InkSpaceMediaTimeline` 的Swift库，无需安装完整InkSpace应用。

最低声明平台：macOS 13、iOS/iPadOS 18；Swift 5.9及以上。框架：Foundation。无其它InkSpace target依赖。

## API

`MediaProject.validate/duration/clipStarts/audioHeadroom, MediaSource, MediaClip, MediaCaptionImporter.parse`

## 示例

示例中未定义的文件URL/数据由调用方提供；涉及throws/async的片段放入相应调用上下文。

```swift
import Foundation
import InkSpaceMediaTimeline
var project = MediaProject()
let source = MediaSource(path: "media/example.mp4", name: "Example", duration: 12, hasVideo: true, hasAudio: true)
project.sources = [source]
project.clips = [MediaClip(sourceID: source.id, start: 2, end: 10)]
try project.validate()
```

## 范围与约束

模型、范围验证、转场/混音数值及字幕解析可独立复用；不包含AVFoundation渲染、媒体素材读取或剪辑界面。先validate再使用派生播放/混音计算。

## 来源

从完整应用中以下源文件抽取并公开API、增加公开构造器或最小适配；原应用未被改写：

- `ios/InkSpace/MediaEditor/MediaProject.swift`
- `ios/InkSpace/MediaEditor/MediaCaptionImporter.swift`

验证细节见 [总验证记录](../VALIDATION.md)。

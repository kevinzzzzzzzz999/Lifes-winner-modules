# InkSpaceWebClips

网页剪藏与链接处理。这是可单独 `import InkSpaceWebClips` 的Swift库，无需安装完整InkSpace应用。

最低声明平台：macOS 13、iOS/iPadOS 18；Swift 5.9及以上。框架：Foundation (NSDataDetector on Apple platforms)。无其它InkSpace target依赖。

## API

`BrowserWebClip.read(from:), BoardWebCardContent.safeURL/escape/frameHTML, BoardTextWebLinks.links/richHTML`

## 示例

示例中未定义的文件URL/数据由调用方提供；涉及throws/async的片段放入相应调用上下文。

```swift
import Foundation
import InkSpaceWebClips
let url = BoardWebCardContent.safeURL("https://example.com")
let escaped = BoardWebCardContent.escape("<text>")
// 在MainActor调用BoardTextWebLinks.links(text:html:)。
```

## 范围与约束

不包含WebView、登录会话、下载管理或浏览器扩展执行器。移除了创建App BoardItem的接口，以便独立使用；剪藏读取保留512KB限制和HTTP(S)校验。

## 来源

从完整应用中以下源文件抽取并公开API、增加公开构造器或最小适配；原应用未被改写：

- `ios/InkSpace/Browser/BrowserWebClip.swift`

验证细节见 [总验证记录](../VALIDATION.md)。

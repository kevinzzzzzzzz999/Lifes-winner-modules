# InkSpacePaths

资料库路径校验。这是可单独 `import InkSpacePaths` 的Swift库，无需安装完整InkSpace应用。

最低声明平台：macOS 13、iOS/iPadOS 18；Swift 5.9及以上。框架：Foundation。无其它InkSpace target依赖。

## API

`VaultPath.isSafeRelative(_:), VaultPathResolver.resolve(relativePath:within:)`

## 示例

示例中未定义的文件URL/数据由调用方提供；涉及throws/async的片段放入相应调用上下文。

```swift
import Foundation
import InkSpacePaths
let valid = VaultPath.isSafeRelative("notes/example.md")
let file = VaultPathResolver.resolve(relativePath: "notes/example.md", within: authorizedRoot)
```

## 范围与约束

resolve只返回已存在且解析符号链接后仍位于根目录内的URL。它不向用户索取系统文件夹权限，也不替代写入时的协调和并发检查。

## 来源

从完整应用中以下源文件抽取并公开API、增加公开构造器或最小适配；原应用未被改写：

- `ios/InkSpace/Documents/VaultPathResolver.swift`
- `ios/InkSpace/Core/Models.swift (VaultPath only)`

验证细节见 [总验证记录](../VALIDATION.md)。

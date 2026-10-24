# InkSpaceStorage

协调文件读写与冲突保护。这是可单独 `import InkSpaceStorage` 的Swift库，无需安装完整InkSpace应用。

最低声明平台：macOS 13、iOS/iPadOS 18；Swift 5.9及以上。框架：Foundation, CryptoKit。包内依赖：InkSpacePaths。

## API

`VaultFileIO.read/write/fingerprint/ensureObsidianNote, BoardStorageLocations.directory/scan`

## 示例

示例中未定义的文件URL/数据由调用方提供；涉及throws/async的片段放入相应调用上下文。

```swift
import Foundation
import InkSpaceStorage
let storage = VaultFileIO()
// async上下文，target为调用方授权根目录内的新文件：
let fingerprint = try await storage.write(Data("Example".utf8), to: target, expectedFingerprint: nil)
let read = try await storage.read(target)
```

## 范围与约束

默认每个actor串行本地写入；跨actor/进程/云端不是分布式事务。调用方负责取得根目录访问授权。写入必须提供读取时fingerprint；新建时传nil，目标已存在会拒绝覆盖。

## 来源

从完整应用中以下源文件抽取并公开API、增加公开构造器或最小适配；原应用未被改写：

- `ios/InkSpace/Core/VaultFileIO.swift`
- `ios/InkSpace/Core/BoardStorageLocations.swift`

验证细节见 [总验证记录](../VALIDATION.md)。

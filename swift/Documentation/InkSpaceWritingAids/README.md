# InkSpaceWritingAids

独立的辅助书写与演示工具库：停留直线、圆/椭圆/矩形/三角形/箭头/坐标轴拟合、波浪线、闭合填色多边形、高亮置底、激光轨迹、遮挡胶带、文字卡草稿与 iPad 系统手写输入适配。无需完整 InkSpace 应用或用户仓库；附可操作的 Mac 画布示例。

Standalone writing and presentation primitives, with a macOS drawing playground and an optional native iPad Scribble input. MIT licensed; no account, server, third-party dependency, or network access.

最低平台：macOS 13、iOS/iPadOS 18；Swift 5.9+。核心框架为 Foundation、CoreGraphics。`ScribbleInput.swift` 仅在 iOS 编译，使用系统 SwiftUI 和 UIKit；Mac 示例额外使用 SwiftUI、AppKit、Combine、UniformTypeIdentifiers。不依赖其他 InkSpace target，也不包含资源或识别模型。

## 示例

```swift
import Foundation
import CoreGraphics
import InkSpaceWritingAids

// Feed screen-space points and a monotonic timestamp from your own input system.
var tracker = HeldLineTracker(point: CGPoint(x: 40, y: 80), time: 0)
tracker.append(CGPoint(x: 120, y: 81), time: 0.1)
tracker.append(CGPoint(x: 240, y: 80), time: 0.2)
let fitted = tracker.confirmIfQuiet(at: 0.9, duration: 0.65)
if let fitted {
    let projected = WritingAidStrokeGeometry.projectedOntoLine(tracker.samples, line: fitted)
    print(projected?.count ?? 0)
}

let wave = try WritingAidStrokeGeometry.wavy(
    points: [CGPoint(x: 40, y: 100), CGPoint(x: 300, y: 100)],
    width: 3, wavelength: 24, amplitude: 5,
    worldSize: CGSize(width: 1000, height: 1000))

let boardID = UUID()
let tape = WritingAidTape(points: [.init(x: 40, y: 100), .init(x: 300, y: 100)],
                          width: 24, color: .init(red: 0.2, green: 0.35, blue: 0.85))
let document = WritingAidTapeDocument(boardID: boardID, tapes: [tape])
let bytes = try document.encoded() // Memory only. The host chooses whether/where to write.
let restored = try WritingAidTapeDocument.decode(bytes, boardID: boardID)
let revealed = try restored.toggling(tape.id)
print(wave.count, revealed.tapes[0].isRevealed)
```

Mac 交互示例的可执行产品名为 `WritingAidsDemo`。进入示例中包含 `Package.swift`、`README.md` 的目录，运行 `bash script/build_and_run.sh`；脚本构建并启动一个有独立名称的 `.app`。源码仓库中该目录为 `samples/writing-aids`，独立下载包中为 `Example`。只需 Xcode 命令行开发工具，不需要完整 InkSpace。示例目录内的 README 说明每个工具和 JSON 导出方法。

## API

| 功能 | 公共入口 | 宿主提供 |
| --- | --- | --- |
| 停留直线 | `HeldLineTracker.append/confirmIfQuiet/finish/line` | 屏幕坐标、单调时间、定时检查、最终事务 |
| 六种形状 | `HeldShapeTracker`, `WritingAidShape`, `shape(through:kind:)` | 明确选择的形状、输入样本；关闭模式不拟合 |
| 波浪与填色 | `WritingAidStrokeGeometry.wavy/fillPolygon/projectedOntoLine` | 世界大小、宽度、渲染与撤销 |
| 高亮置底/回放 | `WritingAidHighlighterUnderlay.applyingCompletedSuffix/replayOrder` | 笔画分类、空笔画判断、完整内容相等比较 |
| 激光 | `WritingAidLaserTrail`, `WritingAidLaserPresentation` | 释放时间、每帧时间与绘制；轨迹不会自动写入文件 |
| 胶带 | `WritingAidTape`, `WritingAidTapeDocument`, `WritingAidTapeGeometry` | 文档 UUID、样式、显示和点击；揭开不修改原笔迹 |
| 文字卡 | `WritingAidTextDraft`, `WritingAidTextSubmission`, `WritingAidSessionToken` | 识别或键盘输入、会话变化、接受/拒绝卡片事务 |
| 可选持久化 | `WritingAidTapeRepository.load/save`, `encoded/decode` | 明确选择并授权的本地目录；并发写入必须携带原 revision |
| iPad 手写输入 | `WritingAidScribbleInput`, `WritingAidScribbleCardInput` | SwiftUI 的文字 binding 和明确的提交回调 |

形状拟合保留原算法的拒绝条件，不会把任何涂鸦强制变成选中的形状。直线/形状最多接收 2,048 个样本；波浪/填色输入最多 4,096 点；世界边长最多 8,000,000；填色边长最多 4,096。形状拟合以屏幕点为单位；波浪/填色/胶带采用宿主世界单位。调用者负责坐标转换，不能把缩放后的触摸位置直接当作世界坐标持久化。

高亮泛型接口返回新的笔画数组，原始笔画本身不会重建。`areEquivalent` 必须比较宿主所有可编辑字段。若使用 PencilKit，需包括 transform、ink、原生路径、mask、randomSeed 等；只比较 ID 会削弱事务保护。返回 nil 时保留当前图画。回放顺序需在按时间排序前保留原来源索引；库不会把旧高亮全局重新排序。

## iPad 原生手写接入

以下视图可直接放入 iOS SwiftUI 页面。`cards` 是示例宿主内存，不是 InkSpace 私有模型。

```swift
#if os(iOS)
import SwiftUI
import InkSpaceWritingAids

struct MyWritingInput: View {
    @State private var draft = ""
    @State private var cards: [String] = []
    var body: some View {
        WritingAidScribbleCardInput(text: $draft, fontSize: 24) { acceptedText in
            cards.append(acceptedText)
            return true // Return false if the host could not accept/save the card.
        }
    }
}
#endif
```

这是使用 `UITextView`、`UIScribbleInteraction` 的系统输入框。Apple Pencil、iPadOS 的“随手写”设置、系统支持的语言及设备能力决定识别是否可用；iPhone 或不支持手写的环境仍可打字。它没有附带 OCR，也不把笔迹传给远程服务。回调只有宿主接受后才清空当前文字；拒绝时保留草稿。异步保存流程应使用 `WritingAidScribbleInput` 加 `WritingAidTextDraft`，保存成功后调用 `acknowledge`，不要提前清空绑定。

## 保存、隐私与宿主边界

库实例化、切换工具、画激光和加载不存在的胶带文件均不会创建目录。只有显式调用 `WritingAidTapeRepository.save` 才会在调用者选择的目录创建 `.inkspace/writing-aids/<document-uuid>.json`。保存使用文件协调、原子替换和 revision 前置条件；未知版本、损坏数据、错误文档 ID、符号链接或冲突都以错误返回，调用者需保留草稿和原文件。目录应由宿主独占或可信地管理；这不是针对恶意并发文件系统修改的隔离容器。没有用户默认偏好读取、钥匙串、日志上传或网络请求。

胶带 v1 JSON 与原公开实现的字段/版本保持兼容：最多 500 条胶带、200,000 个点、4 MiB；非空 `anchorItemID` 明确拒绝，卡片相对定位由未来宿主协议实现。`WritingAidSettings` 只有值与范围归一化，偏好保存策略由宿主选择。激光最多保留 12 条轨迹，按释放时间衰减，默认 0.8 秒。

原生 `PKStroke` 的压力、倾角、时间、纹理、mask、转换、原生 Undo 分组、只替换观察到的末笔这些事务仍由 PencilKit 宿主负责。本库输出几何，不假装能直接改写任意 `PKDrawing`。Mac 示例用 SwiftUI Canvas 展示；高亮是半透明矢量样式，填色是多边形，画面不等同于 PencilKit 纹理。Mac 的文字卡由键盘输入；真正手写识别只能在 iPad 系统输入面上使用。原 App 的画布滚动、套索、PDF 投影、卡片布局、Apple Pencil 双击/挤压及持久撤销栈均没有被隐式带入。

## 来源映射

从公开完整应用以下文件抽取和解耦；原应用未被修改：

| 原文件 | 此模块 | 解耦处理 |
| --- | --- | --- |
| `ios/InkSpace/Core/BoardPencilGestureSettings.swift` | `HeldGeometry.swift` | 保留停留阈值、采样上限、拟合和方向；去掉全局偏好读取/通知 |
| `ios/InkSpace/Core/BoardHeldLineStroke.swift` | `StrokeGeometry.projectedOntoLine` | 提取逐点投影；原生笔画属性复制由宿主执行 |
| `ios/InkSpace/Core/BoardWritingAid.swift` | `WritingAidModels.swift` | 公开值类型/构造器、范围校验、胶带 v1 编解码；不读 UserDefaults |
| `ios/InkSpace/Core/BoardWritingAidStrokes.swift` | `StrokeGeometry.swift` | 保留弧长波浪采样、闭合/面积/复杂度限制；返回点/多边形而非 PKDrawing |
| `ios/InkSpace/Core/BoardHighlighterUnderlay.swift` | `HighlighterUnderlay.swift` | 将新高亮置底和回放索引算法泛型化，宿主提供完整笔画比较 |
| `ios/InkSpace/Canvas/BoardWritingAidOverlay.swift` | `TapeGeometry.swift`, `PresentationAndText.swift` | 保留局部原点胶带路径、点击判断、12 条激光/消退；宿主拥有图层与输入 |
| `ios/InkSpace/Core/BoardWritingAidRepository.swift` | `TapeRepository.swift` | 显式目录、协调/原子保存、revision 冲突与版本保护 |
| `ios/InkSpace/UI/BoardWritingAidScribbleView.swift` | `PresentationAndText.swift`, `ScribbleInput.swift` | 草稿确认与代际保护，独立系统输入面；不带原 App 卡片/store |

额外防护：公开波浪 API 在转换采样数为整数前检查上限；公开直线 API 拒绝非正/非有限的最小长度；胶带世界范围检查补齐原宿主保证的上限。

## 验证与限制

独立源码目录的消费者编译、11 项合成数据行为测试、Mac GUI 示例构建和 iOS Simulator SDK 类型检查用于验证可接入性；不依赖原 App 的私有类型或文件。测试覆盖六形拟合、停留/移动、边界与复杂度拒绝、胶带揭开/编码/保存冲突/未知版本/符号链接、文字草稿拒绝与旧确认、高亮顺序及激光衰减。Mac 示例可以导出/重新打开自己的 JSON；该文件不是原 App 的白板文件，也不包含激光。iPad 真机 Apple Pencil 和系统语言识别尚未验收；库不承诺手写识别准确率。

公开文件使用合成示例，并由发布流程运行隐私 denylist 扫描；构建目录、设备内容和本机绝对路径不进入下载包。

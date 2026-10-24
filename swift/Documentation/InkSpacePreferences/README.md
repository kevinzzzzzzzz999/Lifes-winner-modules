# InkSpacePreferences

可独立复用的语言、布局、工具栏、笔栏、Pencil操作选择和播放/字幕外观偏好。只依赖 Foundation、CoreGraphics；支持 macOS 13+、iOS 18+。不需要完整 Life's winner、资料库、账号或服务密钥。

## 示例

源码附带可启动的 macOS 设置演示 `InkSpacePreferencesDemo`。在本独立下载包根目录运行：

```sh
bash Example/script/build_and_run.sh
```

脚本构建并启动有独立标识的 `.app`，给本机构建的示例添加临时ad-hoc签名，不使用Apple账号、个人证书或私钥；这不代表已经公证的公众安装包。也可进入示例 `Package.swift` 所在目录运行 `swift run InkSpacePreferencesDemo`，或在 Xcode 打开它运行。演示提供语言切换、面板宽度、14项工具栏显隐、笔预设/混排、Pencil动作与停留时间、字幕外观和播放偏好。

演示从七种初始笔样式与合成标识开始。默认仅使用系统临时目录下自己独立的 `InkSpacePreferencesDemo/settings.json`，存储域为 `com.example.inkspace.preferencesdemo`。点“保存”后重新读取，或退出重开，可验证持久化；临时目录可能被系统清理。正式产品请为 `FilePreferencesStorage` 提供自己的持久位置。不会读取完整App偏好或真实笔记。

在示例目录运行 `swift test` 可执行16项偏好行为测试。无界面持久化检查可用 `swift run InkSpacePreferencesDemo --self-test /tmp/preferences-synthetic.json`，再以另一个进程运行 `swift run InkSpacePreferencesDemo --verify-persistence /tmp/preferences-synthetic.json`；两次命令只访问明确指定的合成测试文件。

## 库接入

在 Xcode 添加此目录为 Local Package，或在 SwiftPM 中依赖此产品。由调用者同时指定存储位置和自己的域名：

```swift
import Foundation
import InkSpacePreferences

func saveLanguage(in fileURL: URL) throws {
    let store = try PreferencesStore(
        domain: "com.example.myapp.preferences",
        storage: FilePreferencesStorage(fileURL: fileURL))
    var settings = try store.load()
    settings.language = .en
    settings.toolbar.setVisible(false, for: .ruler)
    _ = try store.save(settings)
    let reopened = try store.load()
    assert(reopened.language == .en)
}
```

也可显式使用 `UserDefaultsPreferencesStorage(domain:)`，或实现 `PreferencesDataStorage`。UserDefaults适配器读取准确的命名持久域，不使用 `.standard` 或全局/注册搜索列表的回退。`MemoryPreferencesStorage`可供预览和测试。

## 内容与接口

| 内容 | 主要API |
| --- | --- |
| 语言与原桌面92条中英字典 | `InterfaceLanguage.initial`、`LanguagePreference.resolved`、`PreferencesLocalizer.text` |
| 面板默认值、宽度约束和窗口适配 | `PanelLayoutPreferences.normalized`、`fitted` |
| 14项工具栏显隐 | `BoardToolbarFunction`、`BoardToolbarVisibility` |
| 笔样式、选择、删除和混排 | `SavedPenSettings`、`NativePaletteSettings`的校验/整理/移动/恢复 |
| Pencil动作、停留和几何模式选择 | `BoardPencilGestureSettings`、`BoardPencilLineSettings`、`BoardPencilShapeSettings` |
| 笔栏停靠 | `BoardPaletteDockSettings.frame` |
| 播放、字幕外观与回放模式 | `PlaybackPreferences`、`SubtitleAppearancePreferences`、`ReplayDisplayMode` |
| 网页AI与翻译服务选择 | `AIWebsitePreference`、`TranslationServicePreference`；仅选择枚举 |
| 隔离保存与重读 | `PreferencesSnapshot`、`PreferencesStore`及三种存储适配器 |

## 默认值与校验

布局默认280/480点，规范化到200...520与320...960；适配小窗口不改写保存宽度。工具栏默认全部显示，剔除未知bit。Pencil双击/握压默认跟随系统，停留直线默认开启、0.65秒并约束至0.35...1.5秒；几何模式默认关闭。七种笔初始样式来自原公开源码，但使用固定合成UUID，不导入任何原应用工具记录。

快进步长为1/3/5/15/30秒，默认5秒；速度选项0.25...2倍，默认1倍。字幕默认20点、白字、黑背景不透明度78%，描边0；字号12...48、描边0...4、背景不透明度0...1，颜色使用`#RRGGBB`。回放默认淡化未来笔迹。

文件和存储域均需显式提供。JSON上限65536字节；版本或域不匹配、损坏JSON、无效笔设置均报错，不在读取时覆盖原数据。保存先完成校验与规范化，再执行原子文件写入。多进程写入需要宿主协调；本库不是密钥或密码存储。

## 平台与边界

iOS可消费所有值模型、校验与存储接口；已通过iOS 18模拟器SDK类型检查。macOS演示实际提供设置界面和持久化。真实Apple Pencil事件、PencilKit工具/绘制、系统笔栏、停留后几何拟合、视频/字幕渲染、系统语言入口、翻译/AI网络调用由承载应用接入。Pencil硬件与系统可用性须由宿主判断，不能由枚举存在推定支持。

界面跟随系统明暗外观；原公开设置没有全局主题开关，本库也未增加。系统字号/VoiceOver等环境由承载App和SwiftUI处理，工具栏设置不会删除文件或改变书写权限。不会自动迁移完整App的旧UserDefaults键；需要迁移的调用方应在获得授权后显式构造`PreferencesSnapshot`。

来源及逐项改造记录见[metadata.json](metadata.json)，均对应完整公开源包中的路径。原创代码沿用 MIT License。

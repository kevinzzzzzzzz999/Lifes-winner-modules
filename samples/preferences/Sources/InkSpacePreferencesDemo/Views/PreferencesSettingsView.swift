import SwiftUI
import InkSpacePreferences

struct PreferencesSettingsView: View {
    @ObservedObject var model: PreferencesModel
    private var language: InterfaceLanguage { model.value.language.resolved(preferredLanguages: Locale.preferredLanguages) }
    private func l(_ zh: String, _ en: String) -> String { language == .zh ? zh : en }
    var body: some View {
        VStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 6) {
                Text(l("独立偏好设置", "Independent preferences")).font(.title2.weight(.semibold))
                Text(l("示例数据保存在独立文件中。修改后点保存，再重新读取验证。", "Synthetic data in a separate file. Save changes, then reload to verify.")).font(.callout).foregroundStyle(.secondary)
            }.frame(maxWidth: .infinity, alignment: .leading).padding()
            TabView {
                general.tabItem { Label(l("语言与布局", "Language & layout"), systemImage: "globe") }
                ToolbarPreferencesView(model: model, language: language).tabItem { Label(l("工具与笔栏", "Toolbar & pens"), systemImage: "pencil.tip.crop.circle") }
                pencil.tabItem { Label(l("Pencil操作", "Pencil actions"), systemImage: "hand.draw") }
                playback.tabItem { Label(l("播放与外观", "Playback & style"), systemImage: "captions.bubble") }
            }.padding(.horizontal)
            HStack {
                Text(model.status).font(.caption).foregroundStyle(.secondary).accessibilityIdentifier("preferences.status")
                Spacer()
                Button(l("恢复默认", "Reset defaults")) { model.reset() }.accessibilityIdentifier("preferences.reset")
                Button(l("重新读取", "Reload")) { model.reload() }.accessibilityIdentifier("preferences.reload")
                Button(l("保存", "Save")) { model.save() }.keyboardShortcut("s", modifiers: .command).buttonStyle(.borderedProminent).accessibilityIdentifier("preferences.save")
            }.padding()
        }
    }
    private var general: some View {
        Form {
            Picker(l("界面语言", "Interface language"), selection: model.binding(\.language)) {
                Text(l("跟随系统", "Follow system")).tag(LanguagePreference.system)
                Text("简体中文").tag(LanguagePreference.zh); Text("English").tag(LanguagePreference.en)
            }.accessibilityIdentifier("preferences.language")
            Text(PreferencesLocalizer.text("emptyTitle", language: language)).font(.headline)
            Text(PreferencesLocalizer.text("emptyBody", language: language)).foregroundStyle(.secondary)
            Section(l("面板布局", "Panel layout")) {
                Toggle(l("显示文件侧栏", "Show file sidebar"), isOn: model.binding(\.panels.leftOpen))
                slider(l("文件侧栏宽度", "File sidebar width"), value: model.binding(\.panels.leftWidth), range: 200...520)
                slider(l("助手侧栏宽度", "Assistant sidebar width"), value: model.binding(\.panels.rightWidth), range: 320...960)
                Text(l("窗口缩小时仅调整显示宽度，保留所选宽度。", "Small windows fit the display without changing your preferred widths.")).font(.caption).foregroundStyle(.secondary)
            }
            Text(l("界面跟随macOS明暗外观。iOS系统语言仍由承载App的系统设置管理。", "The demo follows macOS appearance. iOS system language remains a host App setting.")).font(.caption).foregroundStyle(.secondary)
        }.formStyle(.grouped)
    }
    private var pencil: some View {
        Form {
            Picker(l("双击", "Double-tap"), selection: model.binding(\.gestures.doubleTap)) { ForEach(BoardPencilGestureSettings.Action.allCases, id: \.self) { Text($0.rawValue).tag($0) } }
            Picker(l("握压", "Squeeze"), selection: model.binding(\.gestures.squeeze)) { ForEach(BoardPencilGestureSettings.Action.allCases, id: \.self) { Text($0.rawValue).tag($0) } }
            Toggle(l("停留辅助直线", "Hold for a straight line"), isOn: model.binding(\.holdLine.isEnabled))
            slider(l("停留秒数", "Hold duration in seconds"), value: model.binding(\.holdLine.holdDuration), range: BoardPencilLineSettings.durationRange, step: 0.05)
            Picker(l("几何辅助", "Geometry assistance"), selection: model.binding(\.geometry.shape)) { ForEach(BoardPencilShapeSettings.Shape.allCases, id: \.self) { Text($0.rawValue).tag($0) } }
            Picker(l("笔栏停靠", "Palette edge"), selection: model.binding(\.dock.edge)) { ForEach(BoardPaletteDockSettings.Edge.allCases, id: \.self) { Text($0.rawValue).tag($0) } }
            Toggle(l("最小化笔栏", "Minimize palette"), isOn: model.binding(\.dock.isMinimized))
            Toggle(l("使用系统笔栏", "Request system palette"), isOn: model.binding(\.dock.usesSystemPalette))
            Text(l("此处保存操作选择。真实Apple Pencil事件、PencilKit书写和系统笔栏由iOS承载应用实现。", "These controls save requested actions. Actual Apple Pencil events, PencilKit drawing and the system palette require an iOS host.")).font(.caption).foregroundStyle(.secondary)
        }.formStyle(.grouped)
    }
    private var playback: some View {
        Form {
            Picker(l("快进秒数", "Seek seconds"), selection: model.binding(\.playback.seekInterval)) { ForEach(PlaybackPreferences.seekIntervals, id: \.self) { Text(String($0)).tag($0) } }
            Picker(l("播放速度", "Playback rate"), selection: model.binding(\.playback.playbackRate)) { ForEach(PlaybackPreferences.playbackRates, id: \.self) { Text(String(format: "%g×", $0)).tag($0) } }
            Picker(l("回放显示", "Replay display"), selection: model.binding(\.playback.replayMode)) { ForEach(ReplayDisplayMode.allCases, id: \.self) { Text($0.rawValue).tag($0) } }
            Picker(l("AI网页服务", "AI website choice"), selection: model.binding(\.aiWebsite)) { ForEach(AIWebsitePreference.allCases, id: \.self) { Text($0.rawValue).tag($0) } }
            Picker(l("翻译服务选择", "Translation service choice"), selection: model.binding(\.translationService)) { ForEach(TranslationServicePreference.allCases, id: \.self) { Text($0.rawValue).tag($0) } }
            Section(l("字幕外观", "Subtitle appearance")) {
                slider(l("字号", "Font size"), value: model.binding(\.playback.subtitles.fontSize), range: 12...48)
                TextField(l("文字颜色 #RRGGBB", "Text color #RRGGBB"), text: model.binding(\.playback.subtitles.textColor))
                TextField(l("描边颜色 #RRGGBB", "Outline color #RRGGBB"), text: model.binding(\.playback.subtitles.strokeColor))
                slider(l("描边粗细", "Outline width"), value: model.binding(\.playback.subtitles.strokeWidth), range: 0...4, step: 0.5)
                TextField(l("背景颜色 #RRGGBB", "Background color #RRGGBB"), text: model.binding(\.playback.subtitles.backgroundColor))
                slider(l("背景不透明度", "Background opacity"), value: model.binding(\.playback.subtitles.backgroundOpacity), range: 0...1, step: 0.01)
            }
        }.formStyle(.grouped)
    }
    private func slider(_ title: String, value: Binding<Double>, range: ClosedRange<Double>, step: Double = 1) -> some View {
        VStack(alignment: .leading) { HStack { Text(title); Spacer(); Text(String(format: "%g", value.wrappedValue)).monospacedDigit() }; Slider(value: value, in: range, step: step).accessibilityLabel(title) }
    }
}

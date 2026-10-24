import Foundation
import SwiftUI
import InkSpacePreferences

@main @MainActor enum PreferencesDemoEntry {
    static func main() {
        if CommandLine.arguments.contains("--self-test") || CommandLine.arguments.contains("--verify-persistence") {
            do { try persistenceProbe(); exit(0) }
            catch { print("Preferences persistence probe failed"); exit(1) }
        }
        PreferencesDemoApp.main()
    }
    private static func persistenceProbe() throws {
        let args = CommandLine.arguments
        guard let option = args.firstIndex(where: { $0 == "--self-test" || $0 == "--verify-persistence" }), args.indices.contains(option + 1) else { throw PreferencesError.invalidFileURL }
        let store = try PreferencesStore(domain: PreferencesModel.domain, storage: FilePreferencesStorage(fileURL: URL(fileURLWithPath: args[option + 1])))
        if args[option] == "--self-test" {
            var value = PreferencesSnapshot()
            value.language = .zh; value.panels.leftWidth = 412
            value.toolbar.setVisible(false, for: .ruler)
            value.gestures.squeeze = .palette; value.holdLine.holdDuration = 1.1
            value.playback.subtitles.fontSize = 28
            _ = try store.save(value)
        }
        let value = try store.load()
        guard value.language == .zh, value.panels.leftWidth == 412, !value.toolbar.isVisible(.ruler),
              value.gestures.squeeze == .palette, value.holdLine.holdDuration == 1.1, value.playback.subtitles.fontSize == 28 else { throw PreferencesError.unsupportedVersion }
        print("{\"preferencesPersistence\":\"passed\",\"syntheticData\":true}")
    }
}

struct PreferencesDemoApp: App {
    @StateObject private var model: PreferencesModel
    init() {
        let args = CommandLine.arguments
        let file: URL
        if let option = args.firstIndex(of: "--store"), args.indices.contains(option + 1) {
            file = URL(fileURLWithPath: args[option + 1])
        } else {
            file = FileManager.default.temporaryDirectory.appendingPathComponent("InkSpacePreferencesDemo/settings.json")
        }
        do { let model = try PreferencesModel(fileURL: file); _model = StateObject(wrappedValue: model) }
        catch { fatalError("Could not initialize the explicit demo preference store") }
    }
    var body: some Scene {
        WindowGroup("Preferences Demo") { PreferencesSettingsView(model: model).frame(minWidth: 640, minHeight: 640) }
        Settings { PreferencesSettingsView(model: model).frame(width: 720, height: 680) }
    }
}

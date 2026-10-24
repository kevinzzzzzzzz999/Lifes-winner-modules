import AppKit
import SwiftUI
import UniformTypeIdentifiers
import InkSpacePreferences

/// Distribution-only controls. The development sample remains unchanged.
@MainActor struct PlanTransferControls: View {
    @ObservedObject var model: PreferencesModel
    var body: some View {
        HStack {
            Button("导入方案 / Import…", action: importPlan).accessibilityIdentifier("preferences.plan.import")
            Button("导出方案 / Export…", action: exportPlan).accessibilityIdentifier("preferences.plan.export")
        }
    }
    private func importPlan() {
        let panel = NSOpenPanel()
        panel.title = "导入偏好方案 / Import preference plan"
        panel.allowedContentTypes = [.json]; panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        panel.begin { response in
            guard response == .OK, let url = panel.url else { return }
            do {
                let accessed = url.startAccessingSecurityScopedResource()
                defer { if accessed { url.stopAccessingSecurityScopedResource() } }
                let size = try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? Int.max
                guard size <= PreferencesStore.maximumBytes else { throw PreferencesError.tooLarge }
                let data = try Data(contentsOf: url)
                guard data.count <= PreferencesStore.maximumBytes else { throw PreferencesError.tooLarge }
                let candidate = try PreferencesStore(domain: PreferencesModel.domain, storage: MemoryPreferencesStorage(data: data)).load()
                model.value = candidate
                model.status = "方案已导入；点保存保留 / Imported; Save to keep"
            } catch { model.status = "导入失败，当前方案已保留 / Import rejected; current plan preserved. " + error.localizedDescription }
        }
    }
    private func exportPlan() {
        do {
            let memory = MemoryPreferencesStorage()
            _ = try PreferencesStore(domain: PreferencesModel.domain, storage: memory).save(model.value)
            guard let data = try memory.read() else { throw PreferencesError.invalidFileURL }
            let panel = NSSavePanel()
            panel.title = "导出偏好方案 / Export preference plan"
            panel.nameFieldStringValue = "InkSpace-preferences-plan.json"
            panel.allowedContentTypes = [.json]
            panel.begin { response in
                guard response == .OK, let url = panel.url else { return }
                do {
                    let accessed = url.startAccessingSecurityScopedResource()
                    defer { if accessed { url.stopAccessingSecurityScopedResource() } }
                    try data.write(to: url, options: .atomic)
                    model.status = "方案已导出 / Plan exported"
                } catch { model.status = error.localizedDescription }
            }
        } catch { model.status = error.localizedDescription }
    }
}

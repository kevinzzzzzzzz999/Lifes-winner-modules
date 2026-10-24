import Foundation
import SwiftUI
import InkSpacePreferences

@MainActor final class PreferencesModel: ObservableObject {
    static let domain = "com.example.inkspace.preferencesdemo"
    @Published var value = PreferencesSnapshot() {
        didSet { if value != oldValue { status = "Unsaved changes · 尚未保存" } }
    }
    @Published var status = "Synthetic defaults · not saved yet"
    let store: PreferencesStore
    init(fileURL: URL) throws {
        store = try PreferencesStore(domain: Self.domain, storage: FilePreferencesStorage(fileURL: fileURL))
        reload()
    }
    func save() {
        do { value = try store.save(value); status = "Saved · 已保存" }
        catch { status = error.localizedDescription }
    }
    func reload() {
        do { value = try store.load(); status = "Loaded · 已重新读取" }
        catch { status = error.localizedDescription }
    }
    func reset() { value = PreferencesSnapshot(); status = "Defaults restored in preview · Save to keep" }
    func binding<T>(_ key: WritableKeyPath<PreferencesSnapshot, T>) -> Binding<T> {
        Binding(get: { self.value[keyPath: key] }, set: { self.value[keyPath: key] = $0; self.status = "Unsaved changes · 尚未保存" })
    }
}

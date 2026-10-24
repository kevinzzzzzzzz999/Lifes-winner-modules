import SwiftUI
import InkSpacePreferences

struct ToolbarPreferencesView: View {
    @ObservedObject var model: PreferencesModel
    let language: InterfaceLanguage
    private func l(_ zh: String, _ en: String) -> String { language == .zh ? zh : en }
    var body: some View {
        Form {
            Section(l("工具栏按钮", "Toolbar buttons")) {
                ForEach(BoardToolbarFunction.allCases) { function in
                    Toggle(isOn: Binding(get: { model.value.toolbar.isVisible(function) }, set: { model.value.toolbar.setVisible($0, for: function); model.status = "Unsaved changes · 尚未保存" })) {
                        Label(function.title(language: language), systemImage: function.symbol)
                    }.accessibilityIdentifier("preferences.toolbar." + function.id)
                }
                Button(l("显示全部按钮", "Show all buttons")) { model.value.toolbar = BoardToolbarVisibility() }
            }
            Section(l("自定义笔", "Saved pens")) {
                ForEach(model.value.savedPens.pens) { savedPen in
                    HStack {
                        TextField(l("名称", "Name"), text: pen(savedPen, \.name))
                        Picker(l("类型", "Kind"), selection: pen(savedPen, \.kind)) { ForEach(SavedPenKind.allCases, id: \.self) { Text($0.rawValue).tag($0) } }.frame(width: 160)
                        Button(l("删除", "Remove")) {
                            model.value.savedPens = model.value.savedPens.removingPen(savedPen.id)
                            reconcile()
                        }
                    }
                    HStack { Text(l("粗细", "Width")); Slider(value: pen(savedPen, \.width), in: 0.5...32); Text(String(format: "%g", savedPen.width)).monospacedDigit() }
                    HStack { Text(l("透明度", "Opacity")); Slider(value: pen(savedPen, \.alpha), in: 0...1) }
                    HStack {
                        Text("R"); Slider(value: pen(savedPen, \.red), in: 0...1).accessibilityLabel(l("红色分量", "Red component"))
                        Text("G"); Slider(value: pen(savedPen, \.green), in: 0...1).accessibilityLabel(l("绿色分量", "Green component"))
                        Text("B"); Slider(value: pen(savedPen, \.blue), in: 0...1).accessibilityLabel(l("蓝色分量", "Blue component"))
                    }
                }
                Button(l("添加示例笔", "Add a sample pen")) {
                    model.value.savedPens.pens.append(SavedPen(name: "Sample pen", red: 0.15, green: 0.4, blue: 0.8))
                    reconcile()
                }
            }
            Section(l("混排笔栏顺序", "Mixed palette order")) {
                ForEach(Array(model.value.palette.entries.enumerated()), id: \.element.id) { index, entry in
                    HStack {
                        Text(entry.penID.flatMap { id in model.value.savedPens.pens.first { $0.id == id }?.name } ?? String(describing: entry))
                        Spacer()
                        Button(l("上移", "Up")) { move(index, by: -1) }.disabled(index == 0)
                        Button(l("下移", "Down")) { move(index, by: 1) }.disabled(index == model.value.palette.entries.count - 1)
                        if entry.isUtility { Button(l("隐藏", "Hide")) { model.value.palette = model.value.palette.removing(entry) } }
                    }
                }
                HStack { ForEach(NativePaletteEntry.utilities) { entry in Button(l("恢复", "Restore") + " " + String(describing: entry)) { model.value.palette = model.value.palette.restoringUtility(entry) } } }
            }
        }.formStyle(.grouped)
    }
    private func pen<T>(_ original: SavedPen, _ key: WritableKeyPath<SavedPen,T>) -> Binding<T> {
        Binding(get: { (model.value.savedPens.pens.first { $0.id == original.id } ?? original)[keyPath: key] }, set: {
            guard let index = model.value.savedPens.pens.firstIndex(where: { $0.id == original.id }) else { return }
            model.value.savedPens.pens[index][keyPath: key] = $0; model.status = "Unsaved changes · 尚未保存"
        })
    }
    private func reconcile() {
        do { model.value.palette = try model.value.palette.reconciled(penIDs: model.value.savedPens.pens.map(\.id)) }
        catch { model.status = error.localizedDescription }
    }
    private func move(_ index: Int, by offset: Int) {
        do { model.value.palette = try model.value.palette.moving(fromOffsets: IndexSet(integer: index), toOffset: offset > 0 ? index + 2 : index - 1) }
        catch { model.status = error.localizedDescription }
    }
}

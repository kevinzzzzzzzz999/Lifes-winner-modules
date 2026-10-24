import SwiftUI
import Combine
import InkSpaceWritingAids

struct ContentView: View {
    @StateObject private var model = Playground()
    @State private var exporting = false
    @State private var importing = false
    private let timer = Timer.publish(every: 0.05, on: .main, in: .common).autoconnect()
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Picker("Tool", selection: $model.tool) {
                    ForEach(DemoTool.allCases) { tool in Text(tool.rawValue).tag(tool) }
                }.frame(width: 240)
                if model.tool == .shape {
                    Picker("Shape", selection: $model.shape) {
                        ForEach(WritingAidShape.allCases.filter { $0 != .off }, id: \.self) { shape in
                            Text(shape.rawValue.capitalized).tag(shape)
                        }
                    }.frame(width: 180)
                }
                Spacer()
                Button("Synthetic example", action: model.seedExample)
                Button("Toggle tapes", action: model.toggleAllTapes).disabled(model.document.tapes.tapes.isEmpty)
                Button("Undo", action: model.undo).keyboardShortcut("z").disabled(!model.canUndo)
                Button("Clear", action: model.clear)
            }
            HStack {
                Toggle("New highlights below ink", isOn: $model.highlightsBelowInk).toggleStyle(.checkbox)
                TextField("Text card draft", text: $model.text)
                    .textFieldStyle(.roundedBorder).onSubmit { model.createCard() }
                Button("Create text card", action: model.createCard)
                    .disabled(model.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            DrawingSurface(model: model)
                .background(.background)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(.quaternary))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            HStack {
                Text(model.status).font(.callout).foregroundStyle(.secondary).frame(maxWidth: .infinity, alignment: .leading)
                Button("Open JSON…") { importing = true }
                Button("Export JSON…") { exporting = true }
            }
            Text("Local playground • no network • nothing saves until Export • iPad Scribble is a separate system input adapter")
                .font(.caption).foregroundStyle(.secondary)
        }
        .padding(16)
        .onReceive(timer) { _ in model.checkHold(at: ProcessInfo.processInfo.systemUptime) }
        .fileExporter(isPresented: $exporting, document: PlaygroundFile(document: model.document), contentType: .json,
                      defaultFilename: "writing-aids-example") { result in
            switch result {
            case .success: model.status = "Playground JSON exported to the location you chose."
            case .failure(let error): model.status = error.localizedDescription
            }
        }
        .fileImporter(isPresented: $importing, allowedContentTypes: [.json]) { result in
            do {
                let url = try result.get()
                let accessed = url.startAccessingSecurityScopedResource()
                defer { if accessed { url.stopAccessingSecurityScopedResource() } }
                let size = try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? Int.max
                guard size <= PlaygroundFile.maximumBytes else { throw WritingAidError.tooComplex }
                let bytes = try Data(contentsOf: url)
                guard bytes.count <= PlaygroundFile.maximumBytes else { throw WritingAidError.tooComplex }
                try model.load(JSONDecoder().decode(DemoDocument.self, from: bytes))
            } catch { model.status = error.localizedDescription }
        }
    }
}

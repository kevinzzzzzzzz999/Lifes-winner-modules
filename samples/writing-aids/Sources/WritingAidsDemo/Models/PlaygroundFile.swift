import SwiftUI
import UniformTypeIdentifiers
import InkSpaceWritingAids

struct PlaygroundFile: FileDocument {
    static var readableContentTypes: [UTType] { [.json] }
    static let maximumBytes = 16 * 1024 * 1024
    var document: DemoDocument
    init(document: DemoDocument) { self.document = document }
    init(configuration: ReadConfiguration) throws {
        guard let data = configuration.file.regularFileContents, data.count <= Self.maximumBytes else {
            throw WritingAidError.tooComplex
        }
        document = try JSONDecoder().decode(DemoDocument.self, from: data)
        try document.validate()
    }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        try document.validate()
        let encoder = JSONEncoder(); encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        let bytes = try encoder.encode(document)
        guard bytes.count <= Self.maximumBytes else { throw WritingAidError.tooComplex }
        return FileWrapper(regularFileWithContents: bytes)
    }
}

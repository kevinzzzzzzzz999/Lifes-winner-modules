import Foundation

/// All I/O is opt-in. Merely showing a board or choosing another pen creates no
/// directory. A revision precondition prevents one window replacing another's tape.
public actor WritingAidTapeRepository {
    public init() {}
    public func load(boardID: UUID, rootURL: URL) throws -> WritingAidTapeDocument {
        try Task.checkCancellation()
        let accessed = rootURL.startAccessingSecurityScopedResource()
        defer { if accessed { rootURL.stopAccessingSecurityScopedResource() } }
        let url = try location(boardID: boardID, rootURL: rootURL, create: false)
        guard FileManager.default.fileExists(atPath: url.path) else { return WritingAidTapeDocument(boardID: boardID) }
        var result: Result<WritingAidTapeDocument, Error>?
        var coordinationError: NSError?
        NSFileCoordinator().coordinate(readingItemAt: url, options: [], error: &coordinationError) { safeURL in
            result = Result { try self.read(safeURL, boardID: boardID) }
        }
        if let coordinationError { throw coordinationError }
        guard let result else { throw WritingAidError.unavailable }
        return try result.get()
    }

    /// Returns the new committed revision. On error the caller keeps its draft
    /// visible and retries explicitly; errors are never converted into an empty file.
    public func save(_ document: WritingAidTapeDocument, rootURL: URL,
              expectedRevision: UInt64) throws -> WritingAidTapeDocument {
        try Task.checkCancellation()
        try document.validate()
        guard document.revision == expectedRevision else { throw WritingAidError.revisionConflict }
        let accessed = rootURL.startAccessingSecurityScopedResource()
        defer { if accessed { rootURL.stopAccessingSecurityScopedResource() } }
        let url = try location(boardID: document.boardID, rootURL: rootURL, create: true)
        var result: Result<WritingAidTapeDocument, Error>?
        var coordinationError: NSError?
        NSFileCoordinator().coordinate(writingItemAt: url, options: .forReplacing, error: &coordinationError) { safeURL in
            result = Result {
                let current = FileManager.default.fileExists(atPath: safeURL.path)
                    ? try self.read(safeURL, boardID: document.boardID)
                    : WritingAidTapeDocument(boardID: document.boardID)
                guard current.revision == expectedRevision, expectedRevision < UInt64.max else { throw WritingAidError.revisionConflict }
                var next = document; next.revision = expectedRevision + 1
                let encoder = JSONEncoder(); encoder.outputFormatting = [.sortedKeys]
                let data = try encoder.encode(next)
                guard data.count <= WritingAidTapeDocument.maximumBytes else { throw WritingAidError.tooComplex }
                try Task.checkCancellation()
                try self.rejectSymlink(safeURL)
                try data.write(to: safeURL, options: .atomic)
                return next
            }
        }
        if let coordinationError { throw coordinationError }
        guard let result else { throw WritingAidError.unavailable }
        return try result.get()
    }

    private func read(_ url: URL, boardID: UUID) throws -> WritingAidTapeDocument {
        try rejectSymlink(url)
        let values = try url.resourceValues(forKeys: [.fileSizeKey, .isRegularFileKey])
        guard values.isRegularFile == true, let size = values.fileSize,
              size <= WritingAidTapeDocument.maximumBytes else { throw WritingAidError.tooComplex }
        let bytes = try Data(contentsOf: url, options: .mappedIfSafe)
        guard bytes.count <= WritingAidTapeDocument.maximumBytes else { throw WritingAidError.tooComplex }
        // Decode the version first: unknown versions and malformed data are never
        // silently replaced. The original bytes stay available for a newer app.
        let version = try JSONDecoder().decode(Version.self, from: bytes)
        guard version.version == WritingAidTapeDocument.currentVersion else { throw WritingAidError.unsupportedVersion }
        let result = try JSONDecoder().decode(WritingAidTapeDocument.self, from: bytes)
        guard result.boardID == boardID else { throw WritingAidError.wrongBoard }
        try result.validate()
        return result
    }
    private struct Version: Decodable { var version: Int }

    private func location(boardID: UUID, rootURL: URL, create: Bool) throws -> URL {
        guard rootURL.isFileURL else { throw WritingAidError.unsafeLocation }
        let root = rootURL.standardizedFileURL
        var isDirectory: ObjCBool = false
        guard FileManager.default.fileExists(atPath: root.path, isDirectory: &isDirectory), isDirectory.boolValue else { throw WritingAidError.unsafeLocation }
        try rejectSymlink(root)
        var directory = root
        for name in [".inkspace", "writing-aids"] {
            directory.appendPathComponent(name, isDirectory: true)
            try rejectSymlink(directory)
            if FileManager.default.fileExists(atPath: directory.path, isDirectory: &isDirectory) {
                guard isDirectory.boolValue else { throw WritingAidError.unsafeLocation }
            } else if create {
                try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: false)
            }
        }
        let url = directory.appendingPathComponent(boardID.uuidString.lowercased() + ".json")
        try rejectSymlink(url)
        return url
    }

    private func rejectSymlink(_ url: URL) throws {
        // attributesOfItem sees a link itself, including a dangling link.
        if let attributes = try? FileManager.default.attributesOfItem(atPath: url.path),
           attributes[.type] as? FileAttributeType == .typeSymbolicLink { throw WritingAidError.unsafeLocation }
    }
}

import Foundation

public enum SavedPenKind: String, Codable, CaseIterable, Sendable {
    case pen, fountainPen, monoline, pencil, marker, watercolor, crayon, reed
    /// Reed requires a supporting platform tool; no PencilKit object is created.
    public static func supportedCases(includingReed: Bool) -> [Self] { allCases.filter { includingReed || $0 != .reed } }
}

public struct SavedPen: Codable, Equatable, Identifiable, Sendable {
    public var id: UUID
    public var name: String
    public var kind: SavedPenKind
    public var red: Double
    public var green: Double
    public var blue: Double
    public var alpha: Double
    public var width: Double
    public init(id: UUID = UUID(), name: String = "New pen", kind: SavedPenKind = .pen,
                red: Double = 0, green: Double = 0, blue: Double = 0, alpha: Double = 1, width: Double = 2) {
        self.id = id; self.name = name; self.kind = kind; self.red = red; self.green = green; self.blue = blue; self.alpha = alpha; self.width = width
    }
    public var toolIdentifier: String { "inkspace.savedPen.\(id.uuidString)" }
}

public struct SavedPenSettings: Codable, Equatable, Sendable {
    public var pens: [SavedPen]
    public var selectedID: UUID?
    public init(pens: [SavedPen] = [], selectedID: UUID? = nil) { self.pens = pens; self.selectedID = selectedID }
    /// The original seven initial tool styles with deterministic synthetic IDs.
    /// No saved tool state is migrated or read from another application.
    public static var defaults: Self {
        let kinds: [SavedPenKind] = [.pen, .fountainPen, .monoline, .pencil, .marker, .watercolor, .crayon]
        let names = ["Ballpoint", "Fountain pen", "Monoline", "Pencil", "Marker", "Watercolor", "Crayon"]
        let widths: [Double] = [2, 4, 2, 3, 18, 12, 8]
        let colors: [(Double,Double,Double)] = [(0,0,0),(0,0,0),(0,0,0),(1/3,1/3,1/3),(1,0.8,0),(0,0.478,1),(1,0.584,0)]
        return Self(pens: kinds.indices.map { index in
            let color = colors[index]
            return SavedPen(id: UUID(uuidString: String(format: "00000000-0000-0000-0000-%012d", index + 1))!,
                            name: names[index], kind: kinds[index], red: color.0, green: color.1, blue: color.2, width: widths[index])
        })
    }
    public func validate() throws {
        guard pens.count <= 256 else { throw PreferencesError.invalidPalette }
        var ids = Set<UUID>()
        for pen in pens {
            guard ids.insert(pen.id).inserted, !pen.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
                  pen.name.utf8.count <= 256, pen.width.isFinite, pen.width > 0,
                  [pen.red, pen.green, pen.blue, pen.alpha].allSatisfy({ $0.isFinite && (0...1).contains($0) }) else { throw PreferencesError.invalidPalette }
        }
        if let selectedID, !ids.contains(selectedID) { throw PreferencesError.invalidPalette }
    }
    public func removingPen(_ id: UUID) -> Self {
        guard let index = pens.firstIndex(where: { $0.id == id }) else { return self }
        var result = self
        result.pens.remove(at: index)
        if selectedID == id { result.selectedID = result.pens.isEmpty ? nil : result.pens[min(index, result.pens.count - 1)].id }
        return result
    }
}

public enum NativePaletteEntry: Codable, Equatable, Identifiable, Sendable {
    case pen(UUID), eraser, lasso, ruler
    public static let utilities: [Self] = [.eraser, .lasso, .ruler]
    public var id: String {
        switch self {
        case .pen(let id): return "inkspace.savedPen.\(id.uuidString)"
        case .eraser: return "inkspace.palette.eraser"
        case .lasso: return "inkspace.palette.lasso"
        case .ruler: return "inkspace.palette.ruler"
        }
    }
    public var penID: UUID? { if case .pen(let id) = self { return id }; return nil }
    public var isUtility: Bool { penID == nil }
    private enum CodingKeys: String, CodingKey { case kind, penID }
    private enum Kind: String, Codable { case pen, eraser, lasso, ruler }
    public init(from decoder: Decoder) throws {
        let values = try decoder.container(keyedBy: CodingKeys.self)
        switch try values.decode(Kind.self, forKey: .kind) {
        case .pen: self = .pen(try values.decode(UUID.self, forKey: .penID))
        case .eraser: self = .eraser
        case .lasso: self = .lasso
        case .ruler: self = .ruler
        }
        if isUtility && values.contains(.penID) { throw PreferencesError.invalidPalette }
    }
    public func encode(to encoder: Encoder) throws {
        var values = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case .pen(let id): try values.encode(Kind.pen, forKey: .kind); try values.encode(id, forKey: .penID)
        case .eraser: try values.encode(Kind.eraser, forKey: .kind)
        case .lasso: try values.encode(Kind.lasso, forKey: .kind)
        case .ruler: try values.encode(Kind.ruler, forKey: .kind)
        }
    }
}

public struct NativePaletteSettings: Codable, Equatable, Sendable {
    public var version: Int
    public var entries: [NativePaletteEntry]
    public init(version: Int = 1, entries: [NativePaletteEntry] = NativePaletteEntry.utilities) { self.version = version; self.entries = entries }
    public static func migrated(penIDs: [UUID]) -> Self {
        guard let first = penIDs.first else { return Self() }
        return Self(entries: [.pen(first)] + NativePaletteEntry.utilities + penIDs.dropFirst().map(NativePaletteEntry.pen))
    }
    public func validate() throws {
        guard version == 1, entries.count <= 259, Set(entries.map(\.id)).count == entries.count else { throw PreferencesError.invalidPalette }
    }
    /// Removed utilities stay removed; only new pens are inserted.
    public func reconciled(penIDs: [UUID]) throws -> Self {
        try validate()
        guard Set(penIDs).count == penIDs.count else { throw PreferencesError.invalidPalette }
        let available = Set(penIDs)
        var result = self
        result.entries.removeAll { $0.penID.map { !available.contains($0) } ?? false }
        let installed = Set(result.entries.compactMap(\.penID))
        let added = penIDs.filter { !installed.contains($0) }.map(NativePaletteEntry.pen)
        let insertion = result.entries.lastIndex { $0.penID != nil }.map { $0 + 1 } ?? 0
        result.entries.insert(contentsOf: added, at: insertion)
        try result.validate()
        return result
    }
    public func reorderingPens(penIDs: [UUID]) throws -> Self {
        var result = try reconciled(penIDs: penIDs)
        var index = 0
        result.entries = result.entries.map { entry in
            guard entry.penID != nil else { return entry }
            defer { index += 1 }
            return .pen(penIDs[index])
        }
        return result
    }
    public func removing(_ entry: NativePaletteEntry) -> Self { var next = self; next.entries.removeAll { $0 == entry }; return next }
    public func restoringUtility(_ entry: NativePaletteEntry) -> Self {
        guard entry.isUtility, !entries.contains(entry) else { return self }
        var next = self; next.entries.append(entry); return next
    }
    public func moving(fromOffsets offsets: IndexSet, toOffset destination: Int) throws -> Self {
        try validate()
        guard (0...entries.count).contains(destination), offsets.allSatisfy({ entries.indices.contains($0) }) else { throw PreferencesError.invalidMove }
        var next = self
        let moving = offsets.sorted().map { entries[$0] }
        next.entries = entries.enumerated().filter { !offsets.contains($0.offset) }.map(\.element)
        next.entries.insert(contentsOf: moving, at: destination - offsets.filter { $0 < destination }.count)
        return next
    }
}

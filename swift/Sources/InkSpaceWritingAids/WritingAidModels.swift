import Foundation
import CoreGraphics

/// Auxiliary input is a temporary choice, never a globally enabled preference.
public enum WritingAidMode: String, CaseIterable, Codable, Sendable {
    case off, laser, wavy, fill, tape, scribble
}

public struct WritingAidSessionToken: Codable, Equatable, Sendable {
    public var sessionID: UUID
    public var generation: Int
    public var viewportRevision: Int
    public init(sessionID: UUID, generation: Int = 0, viewportRevision: Int = 0) {
        self.sessionID = sessionID; self.generation = generation; self.viewportRevision = viewportRevision
    }
}

/// Value-only settings. Constructing this type never reads or writes preferences.
public struct WritingAidSettings: Codable, Equatable, Sendable {
    public static let fontSizeRange = 12.0...72.0
    public static let pauseDurationRange = 0.4...3.0
    public var fontSize: Double
    public var pauseDuration: Double
    public var automaticallyCreatesText: Bool
    public var laserFadeDuration: Double
    public init(fontSize: Double = 24, pauseDuration: Double = 1.2,
                automaticallyCreatesText: Bool = false, laserFadeDuration: Double = 0.8) {
        self.fontSize = fontSize; self.pauseDuration = pauseDuration
        self.automaticallyCreatesText = automaticallyCreatesText; self.laserFadeDuration = laserFadeDuration
    }
    public var normalized: Self {
        var result = self
        result.fontSize = fontSize.isFinite ? min(72, max(12, fontSize)) : 24
        result.pauseDuration = pauseDuration.isFinite ? min(3, max(0.4, pauseDuration)) : 1.2
        result.laserFadeDuration = laserFadeDuration.isFinite ? min(2, max(0.25, laserFadeDuration)) : 0.8
        return result
    }
}

public struct WritingAidPoint: Codable, Equatable, Sendable {
    public var x: Double
    public var y: Double
    public init(x: Double, y: Double) { self.x = x; self.y = y }
    public init(_ point: CGPoint) { self.init(x: point.x, y: point.y) }
    public var cgPoint: CGPoint { CGPoint(x: x, y: y) }
}

public struct WritingAidColor: Codable, Equatable, Sendable {
    public var red: Double
    public var green: Double
    public var blue: Double
    public var alpha: Double
    public init(red: Double, green: Double, blue: Double, alpha: Double = 1) {
        self.red = red; self.green = green; self.blue = blue; self.alpha = alpha
    }
    public var isValid: Bool { [red, green, blue, alpha].allSatisfy { $0.isFinite && (0...1).contains($0) } }
}

public struct WritingAidTape: Codable, Equatable, Identifiable, Sendable {
    public var id: UUID
    public var points: [WritingAidPoint]
    public var width: Double
    public var color: WritingAidColor
    public var isRevealed: Bool
    /// Version 1 supports board space only. Non-nil attachments fail explicitly.
    public var anchorItemID: UUID?
    public init(id: UUID = UUID(), points: [WritingAidPoint], width: Double,
                color: WritingAidColor, isRevealed: Bool = false, anchorItemID: UUID? = nil) {
        self.id = id; self.points = points; self.width = width; self.color = color
        self.isRevealed = isRevealed; self.anchorItemID = anchorItemID
    }
    public func validate(worldSize: CGSize = CGSize(width: 8_000_000, height: 8_000_000)) throws {
        guard anchorItemID == nil else { throw WritingAidError.unsupportedVersion }
        guard (1...4096).contains(points.count), width.isFinite, width > 0, width <= 4096,
              color.isValid, worldSize.width.isFinite, worldSize.height.isFinite,
              worldSize.width > 0, worldSize.height > 0,
              worldSize.width <= 8_000_000, worldSize.height <= 8_000_000,
              points.allSatisfy({ $0.x.isFinite && $0.y.isFinite && $0.x >= width / 2 && $0.y >= width / 2
                && $0.x + width / 2 <= worldSize.width && $0.y + width / 2 <= worldSize.height }) else {
            throw WritingAidError.invalidGeometry
        }
    }
}

/// Ink remains independent: the compatible v1 sidecar owns only concealment tapes.
public struct WritingAidTapeDocument: Codable, Equatable, Sendable {
    public static let currentVersion = 1
    public static let maximumBytes = 4 * 1024 * 1024
    public static let maximumTapes = 500
    public static let maximumPoints = 200_000
    public var version: Int
    public var boardID: UUID
    public var revision: UInt64
    public var tapes: [WritingAidTape]
    public init(boardID: UUID, revision: UInt64 = 0, tapes: [WritingAidTape] = [], version: Int = currentVersion) {
        self.version = version; self.boardID = boardID; self.revision = revision; self.tapes = tapes
    }
    public func validate() throws {
        guard version == Self.currentVersion else { throw WritingAidError.unsupportedVersion }
        guard tapes.count <= Self.maximumTapes, Set(tapes.map(\.id)).count == tapes.count,
              tapes.reduce(0, { $0 + $1.points.count }) <= Self.maximumPoints else { throw WritingAidError.tooComplex }
        try tapes.forEach { try $0.validate() }
    }
    public func toggling(_ id: UUID) throws -> Self {
        try validate()
        guard let index = tapes.firstIndex(where: { $0.id == id }) else { throw WritingAidError.changedSession }
        var next = self; next.tapes[index].isRevealed.toggle(); return next
    }
    public func encoded() throws -> Data {
        try validate()
        let encoder = JSONEncoder(); encoder.outputFormatting = [.sortedKeys]
        let bytes = try encoder.encode(self)
        guard bytes.count <= Self.maximumBytes else { throw WritingAidError.tooComplex }
        return bytes
    }
    public static func decode(_ bytes: Data, boardID: UUID) throws -> Self {
        guard bytes.count <= maximumBytes else { throw WritingAidError.tooComplex }
        struct Version: Decodable { var version: Int }
        guard try JSONDecoder().decode(Version.self, from: bytes).version == currentVersion else {
            throw WritingAidError.unsupportedVersion
        }
        let document = try JSONDecoder().decode(Self.self, from: bytes)
        guard document.boardID == boardID else { throw WritingAidError.wrongBoard }
        try document.validate(); return document
    }
}

public enum WritingAidError: Error, LocalizedError, Equatable {
    case invalidGeometry, tooComplex, notClosed, changedSession, unsupportedVersion
    case wrongBoard, revisionConflict, unsafeLocation, unavailable, invalidText
    public var errorDescription: String? {
        switch self {
        case .invalidGeometry: return "Geometry is invalid or outside the drawing area."
        case .tooComplex: return "The drawing exceeds the supported size or complexity."
        case .notClosed: return "Draw a closed outline before filling it."
        case .changedSession: return "The document, input session, or draft changed."
        case .unsupportedVersion: return "This version or attachment is unsupported; keep the original file."
        case .wrongBoard: return "The tape file belongs to a different document."
        case .revisionConflict: return "The saved revision changed; reload before editing."
        case .unsafeLocation: return "The requested location is unavailable or contains a symbolic link."
        case .unavailable: return "The tape document could not be read or written."
        case .invalidText: return "Text must contain between 1 and 20,000 characters."
        }
    }
}

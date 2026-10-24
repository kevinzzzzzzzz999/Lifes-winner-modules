import Foundation
import CoreGraphics

/// Ephemeral laser state; it is deliberately excluded from tape persistence.
public struct WritingAidLaserTrail: Identifiable, Equatable, Sendable {
    public let id: UUID
    public let points: [WritingAidPoint]
    public let releasedAt: TimeInterval
    public let fadeDuration: TimeInterval
    public init(points: [CGPoint], releasedAt: TimeInterval, fadeDuration: TimeInterval = 0.8) throws {
        guard (1...4096).contains(points.count), points.allSatisfy({ $0.x.isFinite && $0.y.isFinite }),
              releasedAt.isFinite, fadeDuration.isFinite, (0.25...2).contains(fadeDuration) else {
            throw WritingAidError.invalidGeometry
        }
        id = UUID(); self.points = points.map(WritingAidPoint.init)
        self.releasedAt = releasedAt; self.fadeDuration = fadeDuration
    }
    public func opacity(at time: TimeInterval) -> Double {
        guard time.isFinite else { return 0 }
        return min(1, max(0, 1 - (time - releasedAt) / fadeDuration))
    }
}

/// The overlay retains no more than twelve released trails.
public struct WritingAidLaserPresentation: Sendable {
    public static let maximumTrails = 12
    public private(set) var trails: [WritingAidLaserTrail] = []
    public init() {}
    public mutating func append(_ trail: WritingAidLaserTrail, at time: TimeInterval) {
        removeExpired(at: time); trails.append(trail)
        if trails.count > Self.maximumTrails { trails.removeFirst(trails.count - Self.maximumTrails) }
    }
    public mutating func removeExpired(at time: TimeInterval) { trails.removeAll { $0.opacity(at: time) == 0 } }
    public mutating func clear() { trails.removeAll() }
}

public struct WritingAidTextSubmission: Equatable, Sendable {
    public let token: WritingAidSessionToken
    public let text: String
    public let fontSize: Double
    public let worldAnchor: WritingAidPoint
    public let draftGeneration: UInt64
}

/// Recognition is supplied by the host. This state only validates and acknowledges text.
/// Failed host transactions preserve the draft; stale acknowledgements cannot clear new text.
public struct WritingAidTextDraft: Sendable {
    public static let maximumCharacters = 20_000
    public private(set) var text = ""
    public private(set) var generation: UInt64 = 0
    public private(set) var lastEditTime: TimeInterval?
    public private(set) var isScribbling = false
    public let token: WritingAidSessionToken
    public var anchor: WritingAidPoint
    public init(token: WritingAidSessionToken, anchor: WritingAidPoint) { self.token = token; self.anchor = anchor }
    public mutating func edit(_ text: String, at time: TimeInterval) throws {
        guard text.count <= Self.maximumCharacters, time.isFinite else { throw WritingAidError.invalidText }
        guard generation < UInt64.max else { throw WritingAidError.changedSession }
        self.text = text; generation += 1; lastEditTime = time
    }
    /// Restoring a draft does not schedule automatic submission.
    public mutating func restore(_ text: String) throws {
        try edit(text, at: 0); lastEditTime = nil
    }
    public mutating func setScribbling(_ value: Bool, at time: TimeInterval) {
        isScribbling = value
        if time.isFinite { lastEditTime = time }
    }
    public func submission(currentToken: WritingAidSessionToken, settings: WritingAidSettings,
                           automaticallyAt time: TimeInterval? = nil) throws -> WritingAidTextSubmission? {
        guard token == currentToken else { throw WritingAidError.changedSession }
        guard !isScribbling else { return nil }
        let value = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !value.isEmpty, value.count <= Self.maximumCharacters else { throw WritingAidError.invalidText }
        guard anchor.x.isFinite, anchor.y.isFinite else { throw WritingAidError.invalidGeometry }
        let normalized = settings.normalized
        if let time {
            guard normalized.automaticallyCreatesText, time.isFinite, let edited = lastEditTime,
                  time - edited >= normalized.pauseDuration else { return nil }
        }
        return WritingAidTextSubmission(token: token, text: value, fontSize: normalized.fontSize,
                                        worldAnchor: anchor, draftGeneration: generation)
    }
    /// Call only after the host has committed this exact submission successfully.
    public mutating func acknowledge(_ submission: WritingAidTextSubmission, currentToken: WritingAidSessionToken) throws {
        guard token == currentToken, submission.token == token, submission.draftGeneration == generation,
              submission.text == text.trimmingCharacters(in: .whitespacesAndNewlines), generation < UInt64.max else {
            throw WritingAidError.changedSession
        }
        text = ""; generation += 1; lastEditTime = nil
    }
}

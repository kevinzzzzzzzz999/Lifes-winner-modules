import Foundation

public enum ReplayDisplayMode: String, Codable, CaseIterable, Sendable {
    case progressive, dimmed
    public func opacity(index: Int, visibleCount: Int) -> Double { index < visibleCount ? 1 : self == .dimmed ? 0.18 : 0 }
}
public enum AIWebsitePreference: String, Codable, CaseIterable, Sendable { case chatgpt, deepseek, claude, gemini }
/// Selection only. Credentials, models and network clients belong to the host.
public enum TranslationServicePreference: String, Codable, CaseIterable, Sendable { case openAI, deepSeek, gemini }

/// Appearance fields and bounds extracted from BoardSubtitleAppearance, without
/// UIKit rendering or access to the original application's defaults.
public struct SubtitleAppearancePreferences: Codable, Equatable, Sendable {
    public var fontSize: Double
    public var textColor: String
    public var strokeColor: String
    public var strokeWidth: Double
    public var backgroundColor: String
    public var backgroundOpacity: Double
    public init(fontSize: Double = 20, textColor: String = "#FFFFFF", strokeColor: String = "#000000", strokeWidth: Double = 0,
                backgroundColor: String = "#000000", backgroundOpacity: Double = 0.78) {
        self.fontSize = fontSize; self.textColor = textColor; self.strokeColor = strokeColor; self.strokeWidth = strokeWidth
        self.backgroundColor = backgroundColor; self.backgroundOpacity = backgroundOpacity
    }
    public var normalized: Self {
        Self(fontSize: bounded(fontSize, 12...48, fallback: 20), textColor: Self.hex(textColor, fallback: "#FFFFFF"),
             strokeColor: Self.hex(strokeColor, fallback: "#000000"), strokeWidth: bounded(strokeWidth, 0...4, fallback: 0),
             backgroundColor: Self.hex(backgroundColor, fallback: "#000000"), backgroundOpacity: bounded(backgroundOpacity, 0...1, fallback: 0.78))
    }
    private static func hex(_ value: String, fallback: String) -> String {
        guard value.utf8.count == 7, value.first == "#", value.dropFirst().utf8.allSatisfy({ (48...57).contains($0) || (65...70).contains($0) || (97...102).contains($0) }) else { return fallback }
        return value.uppercased()
    }
}

public struct PlaybackPreferences: Codable, Equatable, Sendable {
    public static let seekIntervals = [1, 3, 5, 15, 30]
    public static let playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
    public var seekInterval: Int
    public var playbackRate: Double
    public var replayMode: ReplayDisplayMode
    public var subtitles: SubtitleAppearancePreferences
    public init(seekInterval: Int = 5, playbackRate: Double = 1, replayMode: ReplayDisplayMode = .dimmed,
                subtitles: SubtitleAppearancePreferences = .init()) {
        self.seekInterval = seekInterval; self.playbackRate = playbackRate; self.replayMode = replayMode; self.subtitles = subtitles
    }
    public var normalized: Self {
        Self(seekInterval: Self.seekIntervals.contains(seekInterval) ? seekInterval : 5,
             playbackRate: Self.playbackRates.contains(playbackRate) ? playbackRate : 1,
             replayMode: replayMode, subtitles: subtitles.normalized)
    }
}

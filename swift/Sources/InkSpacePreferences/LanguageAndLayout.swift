import Foundation

/// The two languages supplied by the original desktop catalog. Locale input is
/// explicit; the library never reads browser, application or system preferences.
public enum InterfaceLanguage: String, Codable, CaseIterable, Sendable {
    case zh, en
    public static func initial(saved: String?, preferredLanguages: [String]) -> Self {
        if let saved, let language = Self(rawValue: saved) { return language }
        return preferredLanguages.first?.lowercased().hasPrefix("zh") == true ? .zh : .en
    }
}

public enum LanguagePreference: String, Codable, CaseIterable, Sendable {
    case system, zh, en
    public func resolved(preferredLanguages: [String]) -> InterfaceLanguage {
        InterfaceLanguage.initial(saved: self == .system ? nil : rawValue, preferredLanguages: preferredLanguages)
    }
}

/// Widths are user intent; fitting a small window never overwrites them.
public struct PanelLayoutPreferences: Codable, Equatable, Sendable {
    public var version: Int = 1
    public var leftWidth: Double
    public var rightWidth: Double
    public var leftOpen: Bool
    public init(leftWidth: Double = 280, rightWidth: Double = 480, leftOpen: Bool = true) {
        self.leftWidth = leftWidth; self.rightWidth = rightWidth; self.leftOpen = leftOpen
    }
    public var normalized: Self {
        Self(leftWidth: bounded(leftWidth, 200...520, fallback: 280),
             rightWidth: bounded(rightWidth, 320...960, fallback: 480), leftOpen: leftOpen)
    }
    public func fitted(viewport: Double, aiOpen: Bool, compactLeftOpen: Bool = false) -> PanelLayoutGeometry {
        let value = normalized
        let viewport = viewport.isFinite ? max(0, viewport) : 0
        let compact = viewport < 900, budget = max(0, viewport - 360)
        let open = compact ? compactLeftOpen : value.leftOpen
        let available = max(0, viewport - 48)
        let left = compact ? min(value.leftWidth, available) : min(value.leftWidth, max(200, budget - (aiOpen ? 320 : 0)))
        let right = compact ? min(value.rightWidth, available) : min(value.rightWidth, max(320, budget - (open ? left : 0)))
        return PanelLayoutGeometry(compact: compact, leftOpen: open, leftWidth: left, rightWidth: right)
    }
}

public struct PanelLayoutGeometry: Equatable, Sendable {
    public let compact: Bool
    public let leftOpen: Bool
    public let leftWidth: Double
    public let rightWidth: Double
}

func bounded(_ value: Double, _ range: ClosedRange<Double>, fallback: Double) -> Double {
    value.isFinite ? min(range.upperBound, max(range.lowerBound, value)) : fallback
}

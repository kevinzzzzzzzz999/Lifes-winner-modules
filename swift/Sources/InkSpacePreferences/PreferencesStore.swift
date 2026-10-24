import Foundation

public enum PreferencesError: Error, LocalizedError, Equatable {
    case invalidDomain, unsupportedVersion, invalidPalette, invalidMove, tooLarge, domainMismatch, invalidFileURL
    public var errorDescription: String? {
        switch self {
        case .invalidDomain: return "Use your own explicit reverse-DNS storage domain."
        case .unsupportedVersion: return "This preference format is unsupported; the stored data was preserved."
        case .invalidPalette: return "Check pen names, identifiers, colors, widths and palette entries."
        case .invalidMove: return "The palette move is outside the current list."
        case .tooLarge: return "The preference document exceeds its size limit."
        case .domainMismatch: return "This preference document belongs to a different storage domain."
        case .invalidFileURL: return "Provide a local file URL for preference storage."
        }
    }
}

public struct PreferencesSnapshot: Codable, Equatable, Sendable {
    public var version: Int = 1
    public var language: LanguagePreference = .system
    public var panels = PanelLayoutPreferences()
    public var toolbar = BoardToolbarVisibility()
    public var gestures = BoardPencilGestureSettings()
    public var holdLine = BoardPencilLineSettings()
    public var geometry = BoardPencilShapeSettings()
    public var dock = BoardPaletteDockSettings()
    public var savedPens = SavedPenSettings.defaults
    public var palette = NativePaletteSettings.migrated(penIDs: SavedPenSettings.defaults.pens.map(\.id))
    public var playback = PlaybackPreferences()
    public var aiWebsite: AIWebsitePreference = .chatgpt
    public var translationService: TranslationServicePreference = .openAI
    public init() {}
    public func normalized() throws -> Self {
        guard version == 1, panels.version == 1 else { throw PreferencesError.unsupportedVersion }
        try savedPens.validate()
        var result = self
        result.panels = panels.normalized
        result.toolbar = BoardToolbarVisibility(hiddenMask: toolbar.hiddenMask)
        result.holdLine = holdLine.normalized
        result.playback = playback.normalized
        result.palette = try palette.reconciled(penIDs: savedPens.pens.map(\.id))
        return result
    }
}

/// Applications can supply a database or encrypted storage adapter instead.
/// No adapter is created implicitly and no original App storage is consulted.
public protocol PreferencesDataStorage {
    func read() throws -> Data?
    func write(_ data: Data) throws
}

public final class MemoryPreferencesStorage: PreferencesDataStorage {
    private var data: Data?
    public init(data: Data? = nil) { self.data = data }
    public func read() throws -> Data? { data }
    public func write(_ data: Data) throws { self.data = data }
}

public struct FilePreferencesStorage: PreferencesDataStorage {
    public let fileURL: URL
    public init(fileURL: URL) throws {
        guard fileURL.isFileURL, !fileURL.hasDirectoryPath else { throw PreferencesError.invalidFileURL }
        self.fileURL = fileURL
    }
    public func read() throws -> Data? {
        guard FileManager.default.fileExists(atPath: fileURL.path) else { return nil }
        let size = try fileURL.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
        guard size <= PreferencesStore.maximumBytes else { throw PreferencesError.tooLarge }
        return try Data(contentsOf: fileURL)
    }
    public func write(_ data: Data) throws {
        guard data.count <= PreferencesStore.maximumBytes else { throw PreferencesError.tooLarge }
        try FileManager.default.createDirectory(at: fileURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try data.write(to: fileURL, options: .atomic)
    }
}

/// Reads the exact named persistent domain, without UserDefaults search-list
/// fallback to standard/global/registration preferences. The domain is required.
public final class UserDefaultsPreferencesStorage: PreferencesDataStorage {
    public let domain: String
    private let defaults: UserDefaults
    private let key = "standalone-preferences.v1"
    public init(domain: String) throws {
        try PreferencesStore.validateDomain(domain)
        guard let defaults = UserDefaults(suiteName: domain) else { throw PreferencesError.invalidDomain }
        self.domain = domain; self.defaults = defaults
    }
    public func read() throws -> Data? { defaults.persistentDomain(forName: domain)?[key] as? Data }
    public func write(_ data: Data) throws {
        guard data.count <= PreferencesStore.maximumBytes else { throw PreferencesError.tooLarge }
        defaults.set(data, forKey: key)
    }
}

/// One JSON document per explicit domain; atomic file writes are available via
/// FilePreferencesStorage. Multiple writers must coordinate at the host level.
public struct PreferencesStore {
    public static let maximumBytes = 65_536
    public let domain: String
    private let storage: any PreferencesDataStorage
    private struct Envelope: Codable { var formatVersion: Int; var domain: String; var preferences: PreferencesSnapshot }
    public init(domain: String, storage: any PreferencesDataStorage) throws {
        try Self.validateDomain(domain)
        self.domain = domain; self.storage = storage
    }
    public static func validateDomain(_ domain: String) throws {
        guard domain.utf8.count <= 200, domain.range(of: "^[A-Za-z][A-Za-z0-9_-]*(\\.[A-Za-z0-9_-]+){2,}$", options: .regularExpression) != nil,
              !domain.hasPrefix("com.apple."), !domain.hasPrefix("org.apple.") else { throw PreferencesError.invalidDomain }
    }
    public func load() throws -> PreferencesSnapshot {
        guard let bytes = try storage.read() else { return PreferencesSnapshot() }
        guard bytes.count <= Self.maximumBytes else { throw PreferencesError.tooLarge }
        let value = try JSONDecoder().decode(Envelope.self, from: bytes)
        guard value.formatVersion == 1 else { throw PreferencesError.unsupportedVersion }
        guard value.domain == domain else { throw PreferencesError.domainMismatch }
        return try value.preferences.normalized()
    }
    @discardableResult public func save(_ snapshot: PreferencesSnapshot) throws -> PreferencesSnapshot {
        let value = try snapshot.normalized()
        let encoder = JSONEncoder(); encoder.outputFormatting = [.sortedKeys, .prettyPrinted]
        let data = try encoder.encode(Envelope(formatVersion: 1, domain: domain, preferences: value))
        guard data.count <= Self.maximumBytes else { throw PreferencesError.tooLarge }
        try storage.write(data)
        return value
    }
}

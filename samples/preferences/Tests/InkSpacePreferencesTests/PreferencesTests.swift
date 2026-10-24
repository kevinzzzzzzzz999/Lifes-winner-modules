import XCTest
import Foundation
import InkSpacePreferences

final class PreferencesTests: XCTestCase {
    private let domain = "com.example.preferences.tests"
    func testLanguageResolutionAndFullCatalog() {
        XCTAssertEqual(InterfaceLanguage.initial(saved: "en", preferredLanguages: ["zh-Hans"]), .en)
        XCTAssertEqual(InterfaceLanguage.initial(saved: "invalid", preferredLanguages: ["zh-TW"]), .zh)
        XCTAssertEqual(LanguagePreference.system.resolved(preferredLanguages: ["fr-FR"]), .en)
        XCTAssertEqual(PreferencesLocalizer.allKeys.count, 92)
        XCTAssertEqual(PreferencesLocalizer.text("save", language: .zh), "保存")
        XCTAssertEqual(PreferencesLocalizer.text("save", language: .en), "Save")
        XCTAssertEqual(PreferencesLocalizer.text("unknown", language: .en, fallback: "Fallback"), "Fallback")
        XCTAssertTrue(PreferencesLocalizer.allKeys.allSatisfy { !PreferencesLocalizer.text($0, language: .zh).isEmpty && !PreferencesLocalizer.text($0, language: .en).isEmpty })
    }
    func testPanelBoundsAndTemporaryWindowFit() {
        let value = PanelLayoutPreferences(leftWidth: .infinity, rightWidth: 3_000)
        XCTAssertEqual(value.normalized.leftWidth, 280)
        XCTAssertEqual(value.normalized.rightWidth, 960)
        let geometry = value.fitted(viewport: 700, aiOpen: true, compactLeftOpen: true)
        XCTAssertTrue(geometry.compact); XCTAssertTrue(geometry.leftOpen)
        XCTAssertEqual(geometry.rightWidth, 652)
        XCTAssertEqual(value.rightWidth, 3_000)
        XCTAssertEqual(value.fitted(viewport: .nan, aiOpen: false).leftWidth, 0)
    }
    func testToolbarMaskSanitizationAndRoundtrip() throws {
        XCTAssertEqual(BoardToolbarVisibility(hiddenMask: -1).hiddenCount, 0)
        var toolbar = BoardToolbarVisibility(hiddenMask: 1 << 30)
        XCTAssertEqual(toolbar.hiddenCount, 0)
        toolbar.setVisible(false, for: .ruler)
        XCTAssertEqual(toolbar.hiddenCount, 1); XCTAssertFalse(toolbar.isVisible(.ruler))
        let data = try JSONEncoder().encode(toolbar)
        XCTAssertEqual(try JSONDecoder().decode(BoardToolbarVisibility.self, from: data), toolbar)
        toolbar.setVisible(true, for: .ruler); XCTAssertEqual(toolbar.hiddenCount, 0)
    }
    func testPencilOptionsAndHoldBounds() throws {
        let value = BoardPencilGestureSettings(doubleTap: .eraser, squeeze: .palette)
        XCTAssertEqual(try JSONDecoder().decode(BoardPencilGestureSettings.self, from: JSONEncoder().encode(value)), value)
        XCTAssertEqual(BoardPencilLineSettings(holdDuration: .nan).normalized.holdDuration, 0.65)
        XCTAssertEqual(BoardPencilLineSettings(holdDuration: 9).normalized.holdDuration, 1.5)
        XCTAssertThrowsError(try JSONDecoder().decode(BoardPencilGestureSettings.self, from: Data(#"{"doubleTap":"execute","squeeze":"system"}"#.utf8)))
    }
    func testDockStaysInsideCanvasAndHandlesHugeToolCount() {
        let canvas = CGRect(x: 30, y: 40, width: 300, height: 200)
        for edge in BoardPaletteDockSettings.Edge.allCases {
            let rect = BoardPaletteDockSettings(edge: edge).frame(in: canvas, toolCount: .max)
            XCTAssertTrue(canvas.contains(rect)); XCTAssertGreaterThan(rect.width, 0)
        }
        XCTAssertEqual(BoardPaletteDockSettings().frame(in: .null, toolCount: 1), .zero)
    }
    func testSavedPensValidateAndSelectionFallsToNeighbour() throws {
        try SavedPenSettings.defaults.validate()
        XCTAssertEqual(SavedPenSettings.defaults.pens.count, 7)
        XCTAssertEqual(SavedPenSettings.defaults, SavedPenSettings.defaults)
        let a = SavedPen(name: "A"), b = SavedPen(name: "B")
        let value = SavedPenSettings(pens: [a,b], selectedID: a.id)
        try value.validate()
        XCTAssertEqual(value.removingPen(a.id).selectedID, b.id)
        XCTAssertNil(value.removingPen(a.id).removingPen(b.id).selectedID)
        XCTAssertThrowsError(try SavedPenSettings(pens: [a,a]).validate())
        XCTAssertThrowsError(try SavedPenSettings(pens: [SavedPen(name: "", alpha: 2)]).validate())
        XCTAssertThrowsError(try SavedPenSettings(pens: [a], selectedID: b.id).validate())
    }
    func testMixedPaletteReconcilesWithoutRestoringHiddenUtility() throws {
        let a = UUID(), b = UUID(), c = UUID()
        let value = NativePaletteSettings.migrated(penIDs: [a,b]).removing(.eraser)
        let next = try value.reconciled(penIDs: [b,c])
        XCTAssertFalse(next.entries.contains(.eraser)); XCTAssertFalse(next.entries.contains(.pen(a)))
        XCTAssertTrue(next.entries.contains(.pen(c)))
        let reordered = try next.reorderingPens(penIDs: [c,b])
        XCTAssertEqual(reordered.entries.compactMap(\.penID), [c,b])
        XCTAssertEqual(reordered.restoringUtility(.eraser).entries.last, .eraser)
    }
    func testPaletteMoveAndMalformedCodingAreRejected() throws {
        let value = NativePaletteSettings()
        XCTAssertEqual(try value.moving(fromOffsets: [0], toOffset: 3).entries, [.lasso,.ruler,.eraser])
        XCTAssertThrowsError(try value.moving(fromOffsets: [3], toOffset: 0))
        XCTAssertThrowsError(try NativePaletteSettings(entries: [.eraser,.eraser]).validate())
        let data = Data(#"{"kind":"eraser","penID":"00000000-0000-0000-0000-000000000000"}"#.utf8)
        XCTAssertThrowsError(try JSONDecoder().decode(NativePaletteEntry.self, from: data))
    }
    func testPlaybackAndAppearanceNormalization() {
        let value = PlaybackPreferences(seekInterval: 9, playbackRate: .nan, subtitles: .init(fontSize: 100, textColor: "#aabbcc", strokeColor: "bad", strokeWidth: -4, backgroundOpacity: .infinity)).normalized
        XCTAssertEqual(value.seekInterval, 5); XCTAssertEqual(value.playbackRate, 1)
        XCTAssertEqual(value.subtitles.fontSize, 48); XCTAssertEqual(value.subtitles.textColor, "#AABBCC")
        XCTAssertEqual(value.subtitles.strokeColor, "#000000"); XCTAssertEqual(value.subtitles.strokeWidth, 0)
        XCTAssertEqual(value.subtitles.backgroundOpacity, 0.78)
        XCTAssertEqual(ReplayDisplayMode.progressive.opacity(index: 2, visibleCount: 1), 0)
        XCTAssertEqual(ReplayDisplayMode.dimmed.opacity(index: 2, visibleCount: 1), 0.18)
    }
    func testStoreNormalizesAndReopensWithoutApp() throws {
        let storage = MemoryPreferencesStorage()
        let store = try PreferencesStore(domain: domain, storage: storage)
        XCTAssertEqual(try store.load(), PreferencesSnapshot())
        var value = PreferencesSnapshot(); value.language = .zh; value.panels.leftWidth = 100
        value.holdLine.holdDuration = 100; value.playback.subtitles.fontSize = 4
        let saved = try store.save(value)
        XCTAssertEqual(saved.panels.leftWidth, 200); XCTAssertEqual(saved.holdLine.holdDuration, 1.5)
        XCTAssertEqual(saved.playback.subtitles.fontSize, 12)
        XCTAssertEqual(try PreferencesStore(domain: domain, storage: storage).load(), saved)
    }
    func testDifferentDomainCannotReadDocument() throws {
        let storage = MemoryPreferencesStorage()
        _ = try PreferencesStore(domain: domain, storage: storage).save(PreferencesSnapshot())
        XCTAssertThrowsError(try PreferencesStore(domain: "com.example.another", storage: storage).load()) { XCTAssertEqual($0 as? PreferencesError, .domainMismatch) }
    }
    func testCorruptAndFutureDocumentsArePreserved() throws {
        let storage = MemoryPreferencesStorage(data: Data("invalid".utf8))
        let store = try PreferencesStore(domain: domain, storage: storage)
        XCTAssertThrowsError(try store.load()); XCTAssertEqual(try storage.read(), Data("invalid".utf8))
        _ = try store.save(PreferencesSnapshot())
        let data = try XCTUnwrap(storage.read())
        let future = Data(String(decoding: data, as: UTF8.self).replacingOccurrences(of: "\"formatVersion\" : 1", with: "\"formatVersion\" : 2").utf8)
        try storage.write(future)
        XCTAssertThrowsError(try store.load()) { XCTAssertEqual($0 as? PreferencesError, .unsupportedVersion) }
        XCTAssertEqual(try storage.read(), future)
    }
    func testOversizeAndInvalidSchemaDoNotReplaceSavedData() throws {
        let storage = MemoryPreferencesStorage()
        let store = try PreferencesStore(domain: domain, storage: storage)
        _ = try store.save(PreferencesSnapshot()); let original = try storage.read()
        var invalid = PreferencesSnapshot(); invalid.version = 2
        XCTAssertThrowsError(try store.save(invalid)); XCTAssertEqual(try storage.read(), original)
        try storage.write(Data(repeating: 0, count: PreferencesStore.maximumBytes + 1))
        XCTAssertThrowsError(try store.load()) { XCTAssertEqual($0 as? PreferencesError, .tooLarge) }
    }
    func testExplicitFileStorageReopensAndPreservesCorruption() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: directory) }
        let url = directory.appendingPathComponent("synthetic.json")
        let store = try PreferencesStore(domain: domain, storage: FilePreferencesStorage(fileURL: url))
        var value = PreferencesSnapshot(); value.aiWebsite = .claude
        _ = try store.save(value)
        XCTAssertEqual(try PreferencesStore(domain: domain, storage: FilePreferencesStorage(fileURL: url)).load().aiWebsite, .claude)
        try Data("broken".utf8).write(to: url)
        XCTAssertThrowsError(try store.load()); XCTAssertEqual(try Data(contentsOf: url), Data("broken".utf8))
    }
    func testUserDefaultsAdapterUsesOnlyExplicitSyntheticDomain() throws {
        let ownDomain = "com.example.preferences.tests." + UUID().uuidString
        defer { UserDefaults(suiteName: ownDomain)?.removePersistentDomain(forName: ownDomain) }
        let storage = try UserDefaultsPreferencesStorage(domain: ownDomain)
        let store = try PreferencesStore(domain: ownDomain, storage: storage)
        XCTAssertEqual(try store.load(), PreferencesSnapshot())
        var value = PreferencesSnapshot(); value.language = .en
        _ = try store.save(value)
        XCTAssertEqual(try PreferencesStore(domain: ownDomain, storage: UserDefaultsPreferencesStorage(domain: ownDomain)).load(), value)
    }
    func testInvalidDomainsAndNonFileStorageAreRejected() {
        for value in ["", "standard", "NSGlobalDomain", "com.apple.test", "../outside"] { XCTAssertThrowsError(try PreferencesStore(domain: value, storage: MemoryPreferencesStorage())) }
        XCTAssertThrowsError(try FilePreferencesStorage(fileURL: URL(string: "https://example.invalid/settings")!))
    }
}

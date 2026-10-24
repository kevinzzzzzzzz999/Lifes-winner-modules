import XCTest
import CoreGraphics
import InkSpaceWritingAids

final class WritingAidsTests: XCTestCase {
    let world = CGSize(width: 1000, height: 1000)
    let blue = WritingAidColor(red: 0.2, green: 0.35, blue: 0.85)

    func testLineRequiresQuietHoldAndMovementInvalidatesConfirmation() throws {
        var tracker = HeldLineTracker(point: CGPoint(x: 40, y: 40), time: 0)
        tracker.append(CGPoint(x: 100, y: 41), time: 0.1)
        tracker.append(CGPoint(x: 180, y: 40), time: 0.2)
        XCTAssertNil(tracker.confirmIfQuiet(at: 0.6, duration: 0.65))
        let line = try XCTUnwrap(tracker.confirmIfQuiet(at: 0.9, duration: 0.65))
        XCTAssertEqual(line.start, CGPoint(x: 40, y: 40)); XCTAssertEqual(line.end, CGPoint(x: 180, y: 40))
        tracker.append(CGPoint(x: 200, y: 40), time: 1)
        XCTAssertNil(tracker.confirmedLine)
        XCTAssertNil(tracker.finish(at: CGPoint(x: 200, y: 40), time: 1.1, duration: 0.65))
    }

    func testLineRejectsBacktrackingCurvesAndInvalidInput() {
        XCTAssertNil(HeldLineTracker.line(through: [.zero, .init(x: 80, y: 0), .init(x: 40, y: 0), .init(x: 100, y: 0)]))
        XCTAssertNil(HeldLineTracker.line(through: [.zero, .init(x: 50, y: 90), .init(x: 100, y: 0)]))
        XCTAssertNil(HeldLineTracker.line(through: [.zero, .init(x: CGFloat.nan, y: 0), .init(x: 100, y: 0)]))
        XCTAssertNil(HeldLineTracker.line(through: [.zero, .init(x: 20, y: 0), .init(x: 40, y: 0)], minimumLength: 0))
    }

    func testAllSixExplicitShapeModesAndClosedCorners() throws {
        let rectangle = [CGPoint(x: 40, y: 40), .init(x: 100, y: 40), .init(x: 180, y: 40),
                         .init(x: 180, y: 100), .init(x: 180, y: 160), .init(x: 100, y: 160),
                         .init(x: 40, y: 160), .init(x: 40, y: 100), .init(x: 40, y: 40)]
        let rect = try XCTUnwrap(HeldShapeTracker.shape(through: rectangle, kind: .rectangle))
        XCTAssertEqual(rect.points.first, rect.points.last); XCTAssertTrue(rect.points.contains(.init(x: 180, y: 160)))
        for kind in [WritingAidShape.circle, .ellipse] {
            let points = (0...48).map { i -> CGPoint in
                let angle = Double(i) / 48 * Double.pi * 2
                return CGPoint(x: 200 + cos(angle) * 90, y: 200 + sin(angle) * (kind == .circle ? 90 : 50))
            }
            let result = try XCTUnwrap(HeldShapeTracker.shape(through: points, kind: kind))
            XCTAssertEqual(result.points.count, 97); XCTAssertEqual(result.points.first, result.points.last)
        }
        let triangle = [CGPoint(x: 100, y: 40), .init(x: 150, y: 100), .init(x: 200, y: 160),
                        .init(x: 100, y: 160), .init(x: 40, y: 160), .init(x: 70, y: 100), .init(x: 100, y: 40)]
        XCTAssertNotNil(HeldShapeTracker.shape(through: triangle, kind: .triangle))
        XCTAssertNotNil(HeldShapeTracker.shape(through: [.init(x: 30, y: 40), .init(x: 100, y: 40), .init(x: 180, y: 40)], kind: .arrow))
        let axes = [CGPoint(x: 40, y: 100), .init(x: 100, y: 100), .init(x: 180, y: 100),
                    .init(x: 100, y: 100), .init(x: 100, y: 40), .init(x: 100, y: 100), .init(x: 100, y: 160)]
        XCTAssertNotNil(HeldShapeTracker.shape(through: axes, kind: .axes))
        XCTAssertNil(HeldShapeTracker.shape(through: rectangle, kind: .off))
    }

    func testWaveEndpointsAndBounds() throws {
        let wave = try WritingAidStrokeGeometry.wavy(points: [.init(x: 40, y: 100), .init(x: 300, y: 100)],
                                                    width: 3, wavelength: 24, amplitude: 5, worldSize: world)
        XCTAssertEqual(wave.first?.x, 40); XCTAssertEqual(wave.last?.x, 300)
        XCTAssertEqual(try XCTUnwrap(wave.last).y, 100, accuracy: 0.0001)
        XCTAssertGreaterThan(try XCTUnwrap(wave.map(\.y).max()), 104)
        XCTAssertThrowsError(try WritingAidStrokeGeometry.wavy(points: [.init(x: 0, y: 0), .init(x: 300, y: 0)],
                                                               width: 3, wavelength: 24, amplitude: 5, worldSize: world))
        XCTAssertThrowsError(try WritingAidStrokeGeometry.wavy(points: [.init(x: 40, y: 100), .init(x: 7_000_000, y: 100)],
                                                               width: 3, wavelength: 2, amplitude: 1,
                                                               worldSize: CGSize(width: 8_000_000, height: 8_000_000)))
    }

    func testFillClosureConcavityAndDegenerateRejection() throws {
        let concave = [CGPoint(x: 40, y: 40), .init(x: 200, y: 40), .init(x: 200, y: 200),
                       .init(x: 120, y: 100), .init(x: 40, y: 200)]
        XCTAssertThrowsError(try WritingAidStrokeGeometry.fillPolygon(points: concave, closureTolerance: 5, worldSize: world))
        let polygon = try WritingAidStrokeGeometry.fillPolygon(points: concave, closureTolerance: 5, worldSize: world, autoClose: true)
        XCTAssertEqual(polygon, concave)
        XCTAssertThrowsError(try WritingAidStrokeGeometry.fillPolygon(points: [.init(x: 40, y: 40), .init(x: 80, y: 80), .init(x: 120, y: 120)],
                                                                     closureTolerance: 5, worldSize: world, autoClose: true))
    }

    func testTapeRoundTripRevealAndWorldSpaceHitTesting() throws {
        let tape = WritingAidTape(points: [.init(x: 4_000_000, y: 4_000_000), .init(x: 4_000_100, y: 4_000_000)], width: 24, color: blue)
        let geometry = try XCTUnwrap(WritingAidTapeGeometry(tape))
        XCTAssertTrue(geometry.contains(worldPoint: .init(x: 4_000_050, y: 4_000_000)))
        XCTAssertFalse(geometry.contains(worldPoint: .init(x: 4_000_050, y: 4_000_020)))
        let document = WritingAidTapeDocument(boardID: UUID(), tapes: [tape])
        let reopened = try WritingAidTapeDocument.decode(document.encoded(), boardID: document.boardID)
        XCTAssertEqual(reopened, document)
        let revealed = try reopened.toggling(tape.id)
        XCTAssertTrue(revealed.tapes[0].isRevealed)
        XCTAssertEqual(revealed.tapes[0].points, document.tapes[0].points)
        XCTAssertThrowsError(try WritingAidTapeDocument.decode(document.encoded(), boardID: UUID()))
        var future = document; future.version = 99
        XCTAssertThrowsError(try future.encoded())
        var attached = tape; attached.anchorItemID = UUID()
        XCTAssertThrowsError(try attached.validate())
    }

    func testRepositoryCreatesOnlyOnExplicitSaveAndRejectsStaleWriters() async throws {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: false)
        defer { try? FileManager.default.removeItem(at: root) }
        let repository = WritingAidTapeRepository(), id = UUID()
        var draft = try await repository.load(boardID: id, rootURL: root)
        XCTAssertFalse(FileManager.default.fileExists(atPath: root.appendingPathComponent(".inkspace").path))
        draft.tapes = [WritingAidTape(points: [.init(x: 40, y: 40), .init(x: 120, y: 40)], width: 20, color: blue)]
        let saved = try await repository.save(draft, rootURL: root, expectedRevision: 0)
        XCTAssertEqual(saved.revision, 1)
        do { _ = try await repository.save(draft, rootURL: root, expectedRevision: 0); XCTFail("Stale write accepted") }
        catch { XCTAssertEqual(error as? WritingAidError, .revisionConflict) }
        let reread = try await repository.load(boardID: id, rootURL: root)
        XCTAssertEqual(reread, saved)
    }

    func testRepositoryPreservesUnsupportedFilesAndRejectsSymlink() async throws {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let directory = root.appendingPathComponent(".inkspace/writing-aids")
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: root) }
        let repository = WritingAidTapeRepository(), id = UUID()
        let file = directory.appendingPathComponent(id.uuidString.lowercased() + ".json")
        let bytes = Data("{\"version\":99}".utf8); try bytes.write(to: file)
        do { _ = try await repository.load(boardID: id, rootURL: root); XCTFail("Future version accepted") }
        catch { XCTAssertEqual(error as? WritingAidError, .unsupportedVersion) }
        XCTAssertEqual(try Data(contentsOf: file), bytes)
        try FileManager.default.removeItem(at: file)
        try FileManager.default.createSymbolicLink(at: file, withDestinationURL: root.appendingPathComponent("missing.json"))
        do { _ = try await repository.load(boardID: id, rootURL: root); XCTFail("Symlink accepted") }
        catch { XCTAssertEqual(error as? WritingAidError, .unsafeLocation) }
    }

    func testTextDraftPreservedUntilExactHostAcknowledgement() throws {
        let token = WritingAidSessionToken(sessionID: UUID())
        var draft = WritingAidTextDraft(token: token, anchor: .init(x: 40, y: 40))
        try draft.edit("  Synthetic text  ", at: 10)
        let settings = WritingAidSettings(automaticallyCreatesText: true)
        XCTAssertNil(try draft.submission(currentToken: token, settings: settings, automaticallyAt: 10.5))
        let submission = try XCTUnwrap(draft.submission(currentToken: token, settings: settings, automaticallyAt: 12))
        XCTAssertEqual(draft.text, "  Synthetic text  ")
        try draft.edit("A newer draft", at: 13)
        XCTAssertThrowsError(try draft.acknowledge(submission, currentToken: token))
        XCTAssertEqual(draft.text, "A newer draft")
        let accepted = try XCTUnwrap(draft.submission(currentToken: token, settings: settings))
        try draft.acknowledge(accepted, currentToken: token); XCTAssertEqual(draft.text, "")
        try draft.restore("Restored")
        XCTAssertNil(try draft.submission(currentToken: token, settings: settings, automaticallyAt: 30))
        draft.setScribbling(true, at: 31)
        XCTAssertNil(try draft.submission(currentToken: token, settings: settings))
        XCTAssertThrowsError(try draft.submission(currentToken: .init(sessionID: UUID()), settings: settings))
    }

    func testLaserIsBoundedAndExpiresAndSettingsNormalize() throws {
        var presentation = WritingAidLaserPresentation()
        for _ in 0..<15 { presentation.append(try WritingAidLaserTrail(points: [.init(x: 40, y: 40)], releasedAt: 10), at: 10) }
        XCTAssertEqual(presentation.trails.count, 12)
        XCTAssertEqual(presentation.trails[0].opacity(at: 10.4), 0.5, accuracy: 0.0001)
        presentation.removeExpired(at: 11); XCTAssertTrue(presentation.trails.isEmpty)
        let normalized = WritingAidSettings(fontSize: .nan, pauseDuration: 99, laserFadeDuration: -1).normalized
        XCTAssertEqual(normalized.fontSize, 24); XCTAssertEqual(normalized.pauseDuration, 3); XCTAssertEqual(normalized.laserFadeDuration, 0.25)
    }

    func testHighlighterMovesOnlyCompletedSuffixAndRejectsEditedBaseline() throws {
        struct Stroke: Equatable { var id: Int; var marker: Bool }
        let historical = [Stroke(id: 0, marker: true), Stroke(id: 1, marker: false), Stroke(id: 2, marker: true)]
        let current = historical + [Stroke(id: 3, marker: false), Stroke(id: 4, marker: true)]
        let change = try XCTUnwrap(WritingAidHighlighterUnderlay.applyingCompletedSuffix(to: current, after: historical,
            enabled: true, isMarker: { $0.marker }, isEmpty: { _ in false }, areEquivalent: ==))
        XCTAssertEqual(change.strokes.map(\.id), [0, 4, 1, 2, 3])
        XCTAssertEqual(change.completedMarkerCount, 1)
        var edited = current; edited[1].id = 99
        XCTAssertNil(WritingAidHighlighterUnderlay.applyingCompletedSuffix(to: edited, after: historical,
            enabled: true, isMarker: { $0.marker }, isEmpty: { _ in false }, areEquivalent: ==))
        let replay = try XCTUnwrap(WritingAidHighlighterUnderlay.replayOrder(sourceIndices: [2, 0, 4]))
        XCTAssertEqual(replay.visibleIndices(visibleCount: 2), [1, 0])
        XCTAssertNil(WritingAidHighlighterUnderlay.replayOrder(sourceIndices: [1, 1]))
    }
}

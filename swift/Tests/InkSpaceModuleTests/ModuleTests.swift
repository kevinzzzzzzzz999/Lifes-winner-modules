import XCTest
import Foundation
import CoreGraphics
import PDFKit
import zlib
import InkSpaceTextHistory
import InkSpaceOutline
import InkSpaceSubtitles
import InkSpacePaths
import InkSpaceGeometry
import InkSpaceStudy
import InkSpaceChecklist
import InkSpacePDFRecords
import InkSpaceMediaTimeline
import InkSpaceAI
import InkSpaceWebClips
import InkSpaceSpeechText
import InkSpaceStorage
import InkSpaceOCR
import InkSpaceExcelPictures
import InkSpaceScanPDF

final class ModuleTests: XCTestCase {
    func testHistoryUndoRedoBranchAndRetention() {
        var history = DraftTextHistory(initialText: "A")
        history.track("B"); history.track("C")
        XCTAssertEqual(history.undo(), "B")
        XCTAssertEqual(history.redo(), "C")
        _ = history.undo(); history.track("D")
        XCTAssertFalse(history.canRedo)
        for value in 0..<40 { history.track(String(value)) }
        var undos = 0
        while history.undo() != nil { undos += 1 }
        XCTAssertEqual(undos, 20)
        XCTAssertNotNil(history.current)
    }
    func testOutlineRoundtripAndCycleRejection() throws {
        let titles = ["Root #1", "Formula *x*", "Child [A]"]
        let data = try NoteOutline.encode(titles: titles, edges: [(0,1),(1,2)])
        let nodes = try NoteOutline.parse(data)
        XCTAssertEqual(nodes.map(\.title), titles)
        XCTAssertEqual(nodes.map(\.parent), [nil, 0, 1])
        XCTAssertThrowsError(try NoteOutline.encode(titles: titles, edges: [(0,1),(1,0)]))
        XCTAssertThrowsError(try NoteOutline.parse(Data("# Title\n   - bad indent".utf8)))
        XCTAssertThrowsError(try NoteOutline.parse(Data("ordinary prose".utf8)))
    }
    func testSubtitleOverlapAndExclusiveEnd() throws {
        let srt = "1\n00:00:01,000 --> 00:00:03,000\nFirst\n\n2\n00:00:02,000 --> 00:00:04,000\nSecond\n"
        let doc = try BoardSubtitleParser.parse(data: Data(srt.utf8), fileExtension: "srt")
        XCTAssertEqual(doc.cues.count, 2)
        XCTAssertEqual(doc.text(at: 2.5), "First\nSecond")
        XCTAssertEqual(doc.text(at: 3), "Second")
        XCTAssertEqual(doc.text(at: 4), "")
        XCTAssertThrowsError(try BoardSubtitleParser.parse(data: Data("invalid".utf8), fileExtension: "vtt"))
        XCTAssertThrowsError(try BoardSubtitleParser.parse(data: Data(repeating: 0, count: BoardSubtitleParser.maximumBytes + 1), fileExtension: "txt"))
    }
    func testVaultResolutionRejectsTraversalAndEscapingSymlink() throws {
        let root = try temporaryDirectory(); defer { try? FileManager.default.removeItem(at: root) }
        let inside = root.appendingPathComponent("file.txt")
        try Data("example".utf8).write(to: inside)
        XCTAssertNotNil(VaultPathResolver.resolve(relativePath: "file.txt", within: root))
        XCTAssertNil(VaultPathResolver.resolve(relativePath: "../file.txt", within: root))
        XCTAssertFalse(VaultPath.isSafeRelative("a//b"))
        let outside = try temporaryDirectory(); defer { try? FileManager.default.removeItem(at: outside) }
        try FileManager.default.createSymbolicLink(at: root.appendingPathComponent("out"), withDestinationURL: outside)
        try Data().write(to: outside.appendingPathComponent("private.txt"))
        XCTAssertNil(VaultPathResolver.resolve(relativePath: "out/private.txt", within: root))
    }
    func testPageExpansionAndPrintGeometry() throws {
        let frames = try PageGrid.expansionLayout(pageSizes: [CGSize(width: 100, height: 200), CGSize(width: 200, height: 100)], at: CGPoint(x: 40, y: 80), options: .init(direction: .horizontal))
        XCTAssertEqual(frames[0].origin, CGPoint(x: 40, y: 80))
        XCTAssertEqual(frames[0].width, 720)
        XCTAssertEqual(frames[0].height, 1440)
        XCTAssertGreaterThan(frames[1].minX, frames[0].maxX)
        XCTAssertThrowsError(try PageGrid.expansionLayout(pageSizes: [CGSize(width: 1, height: 1)], at: .zero, options: .init(scale: 0)))
        let pages = try PrintPageGeometry.frames(for: CGRect(x: 10, y: 10, width: 1200, height: 1800))
        XCTAssertGreaterThan(pages.count, 1)
        XCTAssertNoThrow(try PrintPageGeometry.validate(frames: pages))
    }
    func testSelectionGenerationRejectsStalePixels() {
        let key = BoardTextSelectionSnapshotKey(sessionID: UUID(), boardID: UUID(), size: CGSize(width: 1024, height: 768), offset: .zero, zoom: 2, documentRevision: 1, updatedAt: Date(timeIntervalSince1970: 0))
        var generation = BoardTextSelectionGeneration()
        XCTAssertTrue(generation.replace(with: key))
        let version = generation.value
        XCTAssertTrue(generation.accepts(version, key: key))
        generation.invalidate()
        XCTAssertFalse(generation.accepts(version, key: key))
        XCTAssertEqual(key.worldPoint(for: CGPoint(x: 20, y: 40)), CGPoint(x: 10, y: 20))
        XCTAssertGreaterThan(key.renderScale, 0)
    }
    func testStudyCSVRoundtripAndFormulaEscaping() throws {
        let pair = StudyCSVPair(question: "Question, quoted", answer: "Line 1\nLine 2")
        let exported = try StudyCSV.export([pair], delimiter: ",")
        let rows = try StudyCSV.parse(exported.data, delimiter: ",", header: false)
        XCTAssertEqual(rows.compactMap(\.pair), [pair])
        let protected = try StudyCSV.export([.init(question: "=1+1", answer: "Answer")], delimiter: ",", formulaProtection: true)
        XCTAssertEqual(protected.escapedCells, 1)
        XCTAssertThrowsError(try StudyCSV.parse(Data("\"unterminated".utf8), delimiter: ",", header: false))
        let board = UUID()
        XCTAssertEqual(StudyCSV.stableID(boardID: board, pair: pair, role: "question"), StudyCSV.stableID(boardID: board, pair: pair, role: "question"))
    }
    func testStudyValidationAndScheduling() throws {
        XCTAssertEqual(try StudyCloze.front("The {{answer}} is hidden"), "The […] is hidden")
        XCTAssertThrowsError(try StudyCloze.front("{{unclosed"))
        let item = UUID().uuidString.lowercased(), board = UUID().uuidString.lowercased()
        let event = StudyEvent(id: UUID().uuidString.lowercased(), deviceID: "00000000-0000-4000-8000-000000000001", createdAt: "2026-01-01T00:00:00.000Z", boardID: board, itemID: item, kind: "card", card: .init(question: "Q", answer: "A"))
        let encoded = try event.data()
        XCTAssertEqual(try StudyEvent.decode(encoded).card?.answer, "A")
        let rating = StudyEvent(id: UUID().uuidString.lowercased(), deviceID: "00000000-0000-4000-8000-000000000001", createdAt: "2026-01-01T01:00:00.000Z", boardID: board, itemID: item, kind: "grade", grade: .good)
        let cards = try StudyProjection.cards([rating, event])
        XCTAssertEqual(cards.first?.reviewCount, 1)
        XCTAssertEqual(cards.first?.intervalDays, 1)
        XCTAssertThrowsError(try StudyTime.parse("2026-02-30T00:00:00Z"))
    }
    func testChecklistPackageResourcesAndTransitions() throws {
        let poems = try CoursePoem.bundled()
        XCTAssertFalse(poems.isEmpty)
        let empty = try CourseChecklistDocument.create(title: "Example checklist")
        let added = try empty.applying(.add(text: "Read a chapter", section: "Study"), poems: poems)
        let task = try XCTUnwrap(added.tasks.first)
        let completed = try added.applying(.toggle(task.id), poems: poems)
        XCTAssertTrue(try XCTUnwrap(completed.tasks.first).done)
        XCTAssertNotNil(completed.tasks.first?.rewardId)
        let archived = try completed.applying(.archive(task.id), poems: poems)
        XCTAssertThrowsError(try archived.applying(.toggle(task.id), poems: poems))
        XCTAssertThrowsError(try CourseChecklistDocument.decode(Data("{}".utf8)))
    }
    func testPDFRecordValidationProjectionAndDeletion() throws {
        let layer = PDFWorkspaceLayer(name: "Layer")
        let layerEvent = try PDFWorkspaceEvent.make(layer: layer)
        let annotation = PDFWorkspaceAnnotation(layerID: layer.id, sourceSHA256: String(repeating: "a", count: 64), page: 1, kind: .text, color: "#ff0000", width: 0.01, points: [], rect: .init(x: 0.1, y: 0.1, width: 0.3, height: 0.2), text: "Example")
        let mark = try PDFWorkspaceEvent.make(annotation: annotation)
        let decoded = try PDFWorkspaceEvent.decodeValidated(mark.encoded())
        XCTAssertEqual(decoded.annotation?.color, "#FF0000")
        let deleted = try PDFWorkspaceEvent.deleteAnnotation(annotation.id)
        XCTAssertTrue(PDFWorkspaceProjection.project([layerEvent, mark, deleted]).annotations.isEmpty)
        XCTAssertThrowsError(try PDFWorkspaceEvent.decodeValidated(Data("{}".utf8)))
    }
    func testPDFExtensionGeometryAndStrictEventFormat() throws {
        let block = PDFExtensionBlock.make(page: 1, anchorY: 0.5)
        let event = PDFExtensionEvent.make(block, target: block.id, source: String(repeating: "a", count: 64), base: nil, device: "example-device")
        let decoded = try PDFExtensionEvent.decodeValidated(event.encoded())
        XCTAssertEqual(decoded.block?.id, block.id)
        let slices = PDFExtensionGeometry.slices(pageAspect: 1.5, blocks: [block])
        XCTAssertEqual(slices.count, 3)
        XCTAssertEqual(slices.first?.height, 0.75)
        XCTAssertEqual(PDFExtensionProjection.project([decoded]).current(source: event.sourceSHA256).count, 1)
    }
    func testMediaTimelineValidationAndCaptionLimits() throws {
        var project = MediaProject()
        let source = MediaSource(path: "media/example.mp4", name: "Example", duration: 12, hasVideo: true, hasAudio: true)
        project.sources = [source]
        project.clips = [.init(sourceID: source.id, start: 2, end: 10, speed: 2)]
        XCTAssertEqual(project.duration, 4)
        XCTAssertNoThrow(try project.validate())
        project.clips[0].end = 20
        XCTAssertThrowsError(try project.validate())
        let captions = try MediaCaptionImporter.parse("1\n00:00:00,000 --> 00:00:01,000\nHello\n", fileExtension: "srt", fallback: 0...1, duration: 2)
        XCTAssertEqual(captions.first?.text, "Hello")
        XCTAssertThrowsError(try MediaCaptionImporter.parse("1\n00:00:00,000 --> 00:00:03,000\nToo long\n", fileExtension: "srt", fallback: 0...1, duration: 2))
    }
    func testAIOutlineAndInputValidationWithoutNetwork() throws {
        XCTAssertEqual(try AIOutline(title: "Root", children: [.init(title: "Child")]).validatedCount(), 2)
        XCTAssertThrowsError(try AIOutline(title: " ").validatedCount())
        XCTAssertThrowsError(try PDFTranslationInput.key("bad key"))
        XCTAssertEqual(try PDFTranslationInput.model(" example-model "), "example-model")
        XCTAssertThrowsError(try PDFTranslationInput.model("line\nbreak"))
    }
    func testTranslationUsesInjectedTransportAndChecksCompletion() async throws {
        let json: [String: Any] = ["status":"completed", "output":[["type":"message", "content":[["type":"output_text", "text":"Translated"]]]]]
        let client = PDFTranslationClient(transport: FixtureTransport(data: try JSONSerialization.data(withJSONObject: json), status: 200))
        let png = Data([137,80,78,71,13,10,26,10])
        let text = try await client.translate(png: png, model: "example-model", language: "English", apiKey: "example-key-12345")
        XCTAssertEqual(text, "Translated")
        let unavailable = PDFTranslationClient(transport: FixtureTransport(data: Data(), status: 401))
        do { _ = try await unavailable.translate(png: png, model: "example-model", language: "English", apiKey: "example-key-12345"); XCTFail("Must reject authentication failure") }
        catch PDFTranslationError.authentication {} catch { XCTFail("Unexpected error: \(error)") }
    }
    @MainActor func testWebClipURLPolicyAndInertHTML() throws {
        XCTAssertNil(BoardWebCardContent.safeURL("https://user:password@example.com"))
        XCTAssertNil(BoardWebCardContent.safeURL("javascript:alert(1)"))
        let url = try XCTUnwrap(BoardWebCardContent.safeURL("https://example.com/page"))
        XCTAssertTrue(BoardWebCardContent.frameHTML(url).contains("sandbox="))
        let html = BoardTextWebLinks.richHTML(text: "<example>", links: [])
        XCTAssertTrue(html.contains("&lt;example&gt;"))
        let root = try temporaryDirectory(); defer { try? FileManager.default.removeItem(at: root) }
        let file = root.appendingPathComponent("example.inkclip.json")
        try JSONSerialization.data(withJSONObject: ["format":"inkspace.webclip", "version":1, "title":"Example", "url":url.absoluteString, "text":"Quote"]).write(to: file)
        XCTAssertEqual(try BrowserWebClip.read(from: file).title, "Example")
    }
    func testSpeechRunsPreserveUTF16AndGeometry() {
        let runs = BoardReadAloudText.languageRuns("Hello 世界")
        XCTAssertEqual(runs.map(\.language), ["en-US", "zh-CN"])
        XCTAssertEqual(runs.map(\.range.length).reduce(0,+), "Hello 世界".utf16.count)
        XCTAssertEqual(BoardReadAloudText.vocabulary("A\nA\nB"), ["A", "B"])
        XCTAssertEqual(BoardReadAloudText.topLeftRect(CGRect(x: 0.1, y: 0.2, width: 0.3, height: 0.1)).minY, 0.7, accuracy: 0.000001)
    }
    func testStorageCompareAndSwapProtectsConcurrentContent() async throws {
        let root = try temporaryDirectory(); defer { try? FileManager.default.removeItem(at: root) }
        let file = root.appendingPathComponent("example.txt"), storage = VaultFileIO()
        let fingerprint = try await storage.write(Data("first".utf8), to: file, expectedFingerprint: nil)
        let read = try await storage.read(file)
        XCTAssertEqual(read.1, fingerprint)
        try Data("external".utf8).write(to: file)
        do { _ = try await storage.write(Data("replacement".utf8), to: file, expectedFingerprint: fingerprint); XCTFail("Must preserve concurrent change") }
        catch VaultWriteError.externalChange {} catch { XCTFail("Unexpected error: \(error)") }
        XCTAssertEqual(try String(contentsOf: file, encoding: .utf8), "external")
        XCTAssertThrowsError(try BoardStorageLocations.directory(root: root, relativePath: "../outside"))
    }
    func testOCRRangeLimitsWithoutUsingDeviceOrPrivateDocuments() throws {
        XCTAssertEqual(try LocalOCR.selectedPages(range: nil, pageCount: 100), Array(1...10))
        XCTAssertEqual(try LocalOCR.selectedPages(range: 2...3, pageCount: 3), [2,3])
        XCTAssertThrowsError(try LocalOCR.selectedPages(range: 1...51, pageCount: 100))
        XCTAssertThrowsError(try LocalOCR.selectedPages(range: 0...1, pageCount: 100))
    }
    func testExcelReaderRejectsMalformedPackages() {
        XCTAssertThrowsError(try ExcelEmbeddedPictures.read(data: Data()))
        XCTAssertThrowsError(try ExcelEmbeddedPictures.read(data: Data("not a zip".utf8)))
    }
    func testScannedPDFExportPreservesOrderAndAvoidsOverwrite() throws {
        let root = try temporaryDirectory(); defer { try? FileManager.default.removeItem(at: root) }
        let bytes = NSMutableData(); var box = CGRect(x: 0, y: 0, width: 100, height: 200)
        let consumer = try XCTUnwrap(CGDataConsumer(data: bytes))
        let context = try XCTUnwrap(CGContext(consumer: consumer, mediaBox: &box, nil))
        context.beginPDFPage(nil); context.setFillColor(CGColor(red: 1, green: 0, blue: 0, alpha: 1)); context.fill(box); context.endPDFPage(); context.closePDF()
        let document = try XCTUnwrap(PDFDocument(data: bytes as Data))
        let page = try XCTUnwrap(document.page(at: 0))
        let first = try ScannedPDFExport.save(pages: [page], root: root, relativeDirectory: "", title: "Example")
        let original = try Data(contentsOf: first)
        let second = try ScannedPDFExport.save(pages: [page], root: root, relativeDirectory: "", title: "Example")
        XCTAssertNotEqual(first, second)
        XCTAssertEqual(try Data(contentsOf: first), original)
        XCTAssertEqual(PDFDocument(url: second)?.pageCount, 1)
        XCTAssertThrowsError(try ScannedPDFExport.save(pages: [], root: root, relativeDirectory: "", title: "Empty"))
    }
    private func temporaryDirectory() throws -> URL {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("InkSpaceModuleTest-" + UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: url, withIntermediateDirectories: false)
        return url
    }
}
private struct FixtureTransport: PDFTranslationTransport {
    let data: Data
    let status: Int
    func perform(_ request: URLRequest) async throws -> (Data, Int) { (data, status) }
}

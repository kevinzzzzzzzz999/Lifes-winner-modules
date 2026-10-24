import Foundation
import Combine
import CoreGraphics
import InkSpaceWritingAids

enum DemoTool: String, CaseIterable, Identifiable {
    case ink = "Ink", holdLine = "Hold line", shape = "Hold shape", laser = "Laser"
    case highlighter = "Highlighter", wave = "Wave", fill = "Fill", tape = "Tape", reveal = "Reveal tape"
    var id: String { rawValue }
}

struct DemoStroke: Codable, Identifiable, Equatable {
    var id = UUID()
    var points: [WritingAidPoint]
    var width: Double
    var filled = false
    var highlighted = false
}

struct DemoTextCard: Codable, Identifiable {
    var id = UUID()
    var text: String
    var anchor: WritingAidPoint
}

struct DemoDocument: Codable {
    var version = 1
    var boardID: UUID
    var strokes: [DemoStroke] = []
    var tapes: WritingAidTapeDocument
    var cards: [DemoTextCard] = []
    init(boardID: UUID = UUID()) {
        self.boardID = boardID; tapes = WritingAidTapeDocument(boardID: boardID)
    }
    func validate() throws {
        guard version == 1, tapes.boardID == boardID else { throw WritingAidError.unsupportedVersion }
        try tapes.validate()
        guard strokes.count <= 500, cards.count <= 100,
              strokes.reduce(0, { $0 + $1.points.count }) <= 200_000,
              Set(strokes.map(\.id)).count == strokes.count, Set(cards.map(\.id)).count == cards.count,
              strokes.allSatisfy({ stroke in
                  (1...WritingAidStrokeGeometry.maximumOutputPoints + 1).contains(stroke.points.count)
                    && stroke.width.isFinite && (0.1...4096).contains(stroke.width)
                    && stroke.points.allSatisfy({ $0.x.isFinite && $0.y.isFinite && (0...8_000_000).contains($0.x) && (0...8_000_000).contains($0.y) })
              }), cards.allSatisfy({ !$0.text.isEmpty && $0.text.count <= WritingAidTextDraft.maximumCharacters
                  && $0.anchor.x.isFinite && $0.anchor.y.isFinite }) else { throw WritingAidError.tooComplex }
    }
}

@MainActor final class Playground: ObservableObject {
    @Published var document = DemoDocument()
    @Published var tool: DemoTool = .holdLine { didSet { cancelInput() } }
    @Published var shape: WritingAidShape = .rectangle { didSet { cancelInput() } }
    @Published var points: [CGPoint] = []
    @Published var preview: [CGPoint]?
    @Published var status = "Drag a line, then hold still for 0.65 seconds before releasing."
    @Published var text = "A synthetic text card"
    @Published var highlightsBelowInk = true
    @Published var lasers = WritingAidLaserPresentation()
    private var lineTracker: HeldLineTracker?
    private var shapeTracker: HeldShapeTracker?
    private var worldSize = CGSize.zero
    private var history: [DemoDocument] = []
    private var activeTool: DemoTool?
    var canUndo: Bool { !history.isEmpty }

    func move(to point: CGPoint, size: CGSize, time: TimeInterval) {
        guard point.x.isFinite, point.y.isFinite, point.x >= 0, point.y >= 0,
              point.x <= size.width, point.y <= size.height else { return }
        if points.isEmpty {
            activeTool = tool; worldSize = size
            points = [point]; preview = nil
            lineTracker = HeldLineTracker(point: point, time: time)
            shapeTracker = HeldShapeTracker(point: point, time: time, shape: shape)
            return
        }
        guard points.count < WritingAidStrokeGeometry.maximumInputPoints else {
            cancelInput(); status = "Too many points. Draw a shorter gesture."; return
        }
        lineTracker?.append(point, time: time); shapeTracker?.append(point, time: time)
        if let last = points.last, hypot(last.x - point.x, last.y - point.y) >= 0.75 { points.append(point) }
        preview = nil
    }

    func checkHold(at time: TimeInterval) {
        guard !points.isEmpty else { return }
        if tool == .holdLine, let line = lineTracker?.confirmIfQuiet(at: time, duration: 0.65) {
            preview = [line.start, line.end]; status = "Line fitted. Release to keep it."
        } else if tool == .shape, let result = shapeTracker?.confirmIfQuiet(at: time, duration: 0.65) {
            preview = result.points; status = "\(shape.rawValue.capitalized) fitted. Release to keep it."
        }
    }

    func finish(at point: CGPoint, time: TimeInterval) {
        guard !points.isEmpty, activeTool == tool else { cancelInput(); return }
        defer { cancelInput() }
        do {
            if tool == .reveal {
                if let tape = document.tapes.tapes.reversed().first(where: { WritingAidTapeGeometry($0)?.contains(worldPoint: point) == true }) {
                    remember(); document.tapes = try document.tapes.toggling(tape.id)
                    status = "Tape toggled. The underlying ink remains intact."
                } else { status = "Click a tape to reveal or conceal it." }
                return
            }
            if tool == .laser {
                lasers.append(try WritingAidLaserTrail(points: points, releasedAt: time), at: time)
                status = "Laser fades after release and is excluded from exports."; return
            }
            var output = points
            if tool == .holdLine {
                guard let line = lineTracker?.finish(at: point, time: time, duration: 0.65) else {
                    status = "No straight quiet hold was detected; the original ink was kept."
                    addStroke(points); return
                }
                output = [line.start, line.end]
            } else if tool == .shape {
                guard let result = shapeTracker?.confirmIfQuiet(at: time, duration: 0.65) else {
                    status = "No matching closed outline/quiet hold; the original ink was kept."
                    addStroke(points); return
                }
                output = result.points
            } else if tool == .wave {
                output = try WritingAidStrokeGeometry.wavy(points: points, width: 3, wavelength: 24, amplitude: 5, worldSize: worldSize)
            } else if tool == .fill {
                output = try WritingAidStrokeGeometry.fillPolygon(points: points, closureTolerance: 22, worldSize: worldSize, autoClose: true)
            } else if tool == .tape {
                let tape = WritingAidTape(points: points.map(WritingAidPoint.init), width: 24,
                                          color: WritingAidColor(red: 0.20, green: 0.35, blue: 0.85))
                try tape.validate(worldSize: worldSize)
                var draft = document.tapes; draft.tapes.append(tape); try draft.validate()
                remember(); document.tapes = draft
                status = "Tape added. Choose Reveal tape and click it."; return
            }
            addStroke(output, filled: tool == .fill, highlighted: tool == .highlighter)
            status = "Added \(tool.rawValue.lowercased()). Export saves only this playground document."
        } catch { status = error.localizedDescription }
    }

    private func addStroke(_ points: [CGPoint], filled: Bool = false, highlighted: Bool = false) {
        guard !points.isEmpty, document.strokes.count < 500 else { status = "Stroke limit reached."; return }
        remember()
        let baseline = document.strokes
        document.strokes.append(DemoStroke(points: points.map(WritingAidPoint.init), width: highlighted ? 18 : 3, filled: filled, highlighted: highlighted))
        if let change = WritingAidHighlighterUnderlay.applyingCompletedSuffix(to: document.strokes, after: baseline,
            enabled: highlightsBelowInk, isMarker: { $0.highlighted }, isEmpty: { $0.points.isEmpty }, areEquivalent: ==) {
            document.strokes = change.strokes
        }
    }
    func createCard() {
        do {
            guard document.cards.count < 100 else { throw WritingAidError.tooComplex }
            let token = WritingAidSessionToken(sessionID: document.boardID)
            var draft = WritingAidTextDraft(token: token, anchor: .init(x: 28, y: 40 + Double(document.cards.count % 8) * 42))
            try draft.edit(text, at: ProcessInfo.processInfo.systemUptime)
            guard let submission = try draft.submission(currentToken: token, settings: WritingAidSettings()) else { return }
            remember(); document.cards.append(DemoTextCard(text: submission.text, anchor: submission.worldAnchor))
            try draft.acknowledge(submission, currentToken: token); text = draft.text
            status = "Text card added. Mac typing demonstrates the same host submission boundary."
        } catch { status = error.localizedDescription }
    }
    func undo() { cancelInput(); if let last = history.popLast() { document = last; status = "Undone." } }
    func toggleAllTapes() {
        guard !document.tapes.tapes.isEmpty else { return }
        remember()
        for index in document.tapes.tapes.indices { document.tapes.tapes[index].isRevealed.toggle() }
        status = "Tapes toggled. Revealing a tape leaves its original ink intact."
    }
    func clear() { remember(); cancelInput(); document = DemoDocument(); lasers.clear(); status = "New empty playground. Nothing was saved automatically." }
    func load(_ next: DemoDocument) throws { try next.validate(); remember(); cancelInput(); document = next; lasers.clear(); status = "Playground JSON loaded." }
    func seedExample() {
        remember(); document = DemoDocument(); lasers.clear(); cancelInput()
        document.strokes = [DemoStroke(points: [.init(x: 60, y: 90), .init(x: 390, y: 90)], width: 18, highlighted: true),
                            DemoStroke(points: [.init(x: 60, y: 150), .init(x: 390, y: 150)], width: 3)]
        document.cards = [DemoTextCard(text: "Synthetic example — reveal the tape below", anchor: .init(x: 60, y: 40))]
        document.tapes.tapes = [WritingAidTape(points: [.init(x: 60, y: 150), .init(x: 390, y: 150)], width: 24,
                                             color: .init(red: 0.2, green: 0.35, blue: 0.85))]
        tool = .reveal; status = "Synthetic example loaded. Click the blue tape, or select any drawing tool."
    }
    private func remember() { history.append(document); if history.count > 30 { history.removeFirst() } }
    private func cancelInput() { points = []; preview = nil; lineTracker = nil; shapeTracker = nil; activeTool = nil }
}

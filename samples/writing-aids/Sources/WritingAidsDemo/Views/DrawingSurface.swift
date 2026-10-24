import SwiftUI
import InkSpaceWritingAids

struct DrawingSurface: View {
    @ObservedObject var model: Playground
    var body: some View {
        GeometryReader { proxy in
            TimelineView(.animation(minimumInterval: 1.0 / 30)) { _ in
                Canvas { context, _ in
                    for stroke in model.document.strokes {
                        let path = polyline(stroke.points.map(\.cgPoint), close: stroke.filled)
                        if stroke.filled { context.fill(path, with: .color(.teal.opacity(0.32))) }
                        else {
                            context.stroke(path, with: .color(stroke.highlighted ? .yellow.opacity(0.38) : .primary),
                                           style: StrokeStyle(lineWidth: stroke.width, lineCap: .round, lineJoin: .round))
                        }
                    }
                    for card in model.document.cards {
                        context.draw(Text(card.text).font(.system(size: 24)).foregroundColor(.primary),
                                     at: card.anchor.cgPoint, anchor: .topLeading)
                    }
                    for tape in model.document.tapes.tapes where !tape.isRevealed {
                        if let geometry = WritingAidTapeGeometry(tape) {
                            let path = Path(geometry.path).applying(CGAffineTransform(translationX: geometry.origin.x, y: geometry.origin.y))
                            context.fill(path, with: .color(Color(.sRGB, red: tape.color.red, green: tape.color.green,
                                                                 blue: tape.color.blue, opacity: tape.color.alpha)))
                        }
                    }
                    let now = ProcessInfo.processInfo.systemUptime
                    for trail in model.lasers.trails {
                        context.stroke(polyline(trail.points.map(\.cgPoint)), with: .color(.red.opacity(trail.opacity(at: now))),
                                       style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))
                    }
                    if !model.points.isEmpty {
                        let points = model.preview ?? model.points
                        let path = polyline(points, close: model.tool == .fill)
                        if model.tool == .fill { context.fill(path, with: .color(.teal.opacity(0.2))) }
                        let color: Color = model.tool == .laser ? .red : model.preview == nil ? .accentColor : .green
                        context.stroke(path, with: .color(color), style: StrokeStyle(lineWidth: model.tool == .tape ? 24 : 3,
                                                                                   lineCap: .round, lineJoin: .round))
                    }
                }
            }
            .contentShape(Rectangle())
            .accessibilityLabel("Writing aids drawing area")
            .gesture(DragGesture(minimumDistance: 0).onChanged { value in
                model.move(to: value.location, size: proxy.size, time: ProcessInfo.processInfo.systemUptime)
            }.onEnded { value in
                model.finish(at: value.location, time: ProcessInfo.processInfo.systemUptime)
            })
        }
    }
    private func polyline(_ points: [CGPoint], close: Bool = false) -> Path {
        Path { path in
            guard let first = points.first else { return }
            path.move(to: first)
            if points.count == 1 { path.addLine(to: CGPoint(x: first.x + 0.01, y: first.y)) }
            else { for point in points.dropFirst() { path.addLine(to: point) } }
            if close { path.closeSubpath() }
        }
    }
}

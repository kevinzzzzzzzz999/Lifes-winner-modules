import Foundation
import CoreGraphics

/// Bounded geometry from the native wave/fill factories, without a PKDrawing dependency.
public enum WritingAidStrokeGeometry {
    public static let maximumInputPoints = 4096
    public static let maximumOutputPoints = 65_536
    public static let maximumFillSide: CGFloat = 4096

    public static func wavy(points: [CGPoint], width: CGFloat, wavelength: CGFloat,
                            amplitude: CGFloat, worldSize: CGSize) throws -> [CGPoint] {
        let input = try validated(points, worldSize: worldSize)
        guard input.count >= 2, width.isFinite, (0.1...4096).contains(width),
              wavelength.isFinite, wavelength >= 2, amplitude.isFinite,
              amplitude > 0, amplitude <= wavelength / 2 else { throw WritingAidError.invalidGeometry }
        var cumulative: [CGFloat] = [0]
        for pair in zip(input, input.dropFirst()) { cumulative.append(cumulative.last! + hypot(pair.1.x - pair.0.x, pair.1.y - pair.0.y)) }
        let length = cumulative.last!
        guard length >= max(2, width / 2), length.isFinite else { throw WritingAidError.invalidGeometry }
        let cycles = max(1, (length / wavelength).rounded())
        // Check before converting to Int so an extreme caller-supplied wavelength cannot trap.
        let requested = ceil(cycles * 24)
        guard requested.isFinite, requested <= CGFloat(maximumOutputPoints) else { throw WritingAidError.tooComplex }
        let count = max(25, Int(requested))
        var index = 1, output: [CGPoint] = []; output.reserveCapacity(count + 1)
        for step in 0...count {
            let distance = length * CGFloat(step) / CGFloat(count)
            while index < cumulative.count - 1 && cumulative[index] < distance { index += 1 }
            let a = input[index - 1], b = input[index], segment = cumulative[index] - cumulative[index - 1]
            guard segment > 0 else { continue }
            let progress = (distance - cumulative[index - 1]) / segment
            let base = CGPoint(x: a.x + (b.x - a.x) * progress, y: a.y + (b.y - a.y) * progress)
            let offset = sin(CGFloat.pi * 2 * cycles * distance / length) * amplitude
            output.append(CGPoint(x: base.x - (b.y - a.y) / segment * offset,
                                  y: base.y + (b.x - a.x) / segment * offset))
        }
        try requireInside(output, margin: width / 2, worldSize: worldSize)
        return output
    }

    /// Returns a real polygon, including concavities. The renderer chooses its paint type.
    /// Auto-close is only appropriate for an explicitly chosen fill tool.
    public static func fillPolygon(points: [CGPoint], closureTolerance: CGFloat,
                                    worldSize: CGSize, autoClose: Bool = false) throws -> [CGPoint] {
        var polygon = try validated(points, worldSize: worldSize)
        guard polygon.count >= (autoClose ? 3 : 4), closureTolerance.isFinite, closureTolerance > 0 else { throw WritingAidError.notClosed }
        if !autoClose {
            guard let first = polygon.first, let last = polygon.last,
                  hypot(first.x - last.x, first.y - last.y) <= closureTolerance else { throw WritingAidError.notClosed }
        }
        if polygon.last == polygon.first { polygon.removeLast() }
        guard polygon.count >= 3, let first = polygon.first,
              let second = polygon.first(where: { $0 != first }),
              polygon.contains(where: { $0 != first && $0 != second }) else { throw WritingAidError.invalidGeometry }
        let box = polygon.reduce(CGRect.null) { $0.union(CGRect(x: $1.x, y: $1.y, width: 0.001, height: 0.001)) }
        guard box.width > 1, box.height > 1, box.width <= maximumFillSide,
              box.height <= maximumFillSide else { throw WritingAidError.tooComplex }
        var twiceArea: CGFloat = 0
        for (a, b) in zip(polygon, polygon.dropFirst() + [polygon[0]]) {
            twiceArea += (a.x - box.minX) * (b.y - box.minY) - (b.x - box.minX) * (a.y - box.minY)
        }
        guard abs(twiceArea) >= 2 else { throw WritingAidError.invalidGeometry }
        return polygon
    }

    /// Position-only projection derived from BoardHeldLineStroke. Hosts retain pressure,
    /// timing, ink and undo ownership when replacing native stroke positions.
    public static func projectedOntoLine(_ points: [CGPoint], line: HeldLineTracker.Line) -> [CGPoint]? {
        let start = line.start, dx = line.end.x - start.x, dy = line.end.y - start.y
        let squared = dx * dx + dy * dy
        guard squared.isFinite, squared > 0, points.count <= HeldLineTracker.maximumSamples,
              points.allSatisfy({ $0.x.isFinite && $0.y.isFinite }) else { return nil }
        return points.map { point in
            let t = min(1, max(0, ((point.x - start.x) * dx + (point.y - start.y) * dy) / squared))
            return CGPoint(x: start.x + t * dx, y: start.y + t * dy)
        }
    }

    private static func validated(_ points: [CGPoint], worldSize: CGSize) throws -> [CGPoint] {
        guard points.count <= maximumInputPoints else { throw WritingAidError.tooComplex }
        try requireInside(points, margin: 0, worldSize: worldSize)
        var result: [CGPoint] = []
        for point in points where result.last != point { result.append(point) }
        return result
    }
    private static func requireInside(_ points: [CGPoint], margin: CGFloat, worldSize: CGSize) throws {
        guard worldSize.width.isFinite, worldSize.height.isFinite,
              worldSize.width > 0, worldSize.height > 0,
              worldSize.width <= 8_000_000, worldSize.height <= 8_000_000,
              points.allSatisfy({ $0.x.isFinite && $0.y.isFinite && $0.x >= margin && $0.y >= margin
                && $0.x + margin <= worldSize.width && $0.y + margin <= worldSize.height }) else { throw WritingAidError.invalidGeometry }
    }
}

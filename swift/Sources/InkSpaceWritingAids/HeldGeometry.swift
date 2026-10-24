// Geometry extracted from InkSpace BoardPencilGestureSettings.swift; see documentation.
import Foundation
import CoreGraphics

public enum WritingAidShape: String, Codable, CaseIterable, Sendable {
    case off, circle, ellipse, rectangle, triangle, arrow, axes
}

/// Bounded samples from the passive Pencil observer; fitting happens only after
/// a quiet hold in a shape the user has selected. No PKDrawing is read here.
public struct HeldShapeTracker: Sendable {
    public struct ShapeResult: Equatable, Sendable {
        public let shape: WritingAidShape
        public let points: [CGPoint]
        public let sourceStart: CGPoint
        public let sourceEnd: CGPoint
        public let sourceBounds: CGRect
    }
    public static let maximumSamples = HeldLineTracker.maximumSamples
    public private(set) var samples: [CGPoint] = []
    public private(set) var lastMovementTime: TimeInterval = 0
    public private(set) var confirmedShape: ShapeResult?
    private let selectedShape: WritingAidShape
    private var movementAnchor = CGPoint.zero
    private var valid = true

    public init(point: CGPoint, time: TimeInterval, shape: WritingAidShape) {
        selectedShape = shape
        valid = shape != .off && point.x.isFinite && point.y.isFinite && time.isFinite
        if valid { samples = [point]; movementAnchor = point; lastMovementTime = time }
    }
    public mutating func append(_ point: CGPoint, time: TimeInterval) {
        guard valid, point.x.isFinite, point.y.isFinite, time.isFinite, time >= lastMovementTime else {
            valid = false; confirmedShape = nil; return
        }
        if hypot(point.x - movementAnchor.x, point.y - movementAnchor.y) > 2 {
            movementAnchor = point; lastMovementTime = time; confirmedShape = nil
        }
        guard let last = samples.last, hypot(point.x - last.x, point.y - last.y) >= 0.75 else { return }
        guard samples.count < Self.maximumSamples else { valid = false; confirmedShape = nil; return }
        samples.append(point)
    }
    public mutating func confirmIfQuiet(at time: TimeInterval, duration: TimeInterval) -> ShapeResult? {
        guard valid, time.isFinite, duration.isFinite, duration > 0,
              time - lastMovementTime >= duration else { return nil }
        confirmedShape = Self.shape(through: samples, kind: selectedShape)
        return confirmedShape
    }

    public static func shape(through points: [CGPoint], kind: WritingAidShape) -> ShapeResult? {
        guard kind != .off, points.count >= 3, points.count <= maximumSamples,
              points.allSatisfy({ $0.x.isFinite && $0.y.isFinite }),
              let start = points.first, let end = points.last else { return nil }
        let xs = points.map(\.x), ys = points.map(\.y)
        let bounds = CGRect(x: xs.min()!, y: ys.min()!, width: xs.max()! - xs.min()!, height: ys.max()! - ys.min()!)
        var output: [CGPoint]
        if kind == .axes {
            let diagonal = hypot(bounds.width, bounds.height)
            let center = CGPoint(x: axisCoordinate(xs, near: bounds.midX), y: axisCoordinate(ys, near: bounds.midY))
            guard points.count >= 6, bounds.width >= 48, bounds.height >= 48,
                  diagonal.isFinite, diagonal <= 20_000,
                  center.x >= bounds.minX + 16, center.x <= bounds.maxX - 24,
                  center.y >= bounds.minY + 24, center.y <= bounds.maxY - 16,
                  points.allSatisfy({ min(abs($0.x - center.x), abs($0.y - center.y)) <= max(10, diagonal * 0.12) }) else { return nil }
            let left = CGPoint(x: bounds.minX, y: center.y), right = CGPoint(x: bounds.maxX, y: center.y)
            let top = CGPoint(x: center.x, y: bounds.minY), bottom = CGPoint(x: center.x, y: bounds.maxY)
            let head = min(24, max(10, min(bounds.width, bounds.height) * 0.14))
            // A single connected native path retraces each arrowhead and returns
            // through the origin; no extra stroke or undo operation is created.
            output = [left, right, CGPoint(x: right.x - head, y: right.y + head * 0.55), right,
                      CGPoint(x: right.x - head, y: right.y - head * 0.55), right, center,
                      top, CGPoint(x: top.x - head * 0.55, y: top.y + head), top,
                      CGPoint(x: top.x + head * 0.55, y: top.y + head), top, bottom]
        } else if kind == .arrow {
            guard let shaft = HeldLineTracker.line(through: points, minimumLength: 48) else { return nil }
            let dx = shaft.end.x - shaft.start.x, dy = shaft.end.y - shaft.start.y
            let length = hypot(dx, dy), head = min(28, max(12, length * 0.20))
            let ux = dx / length, uy = dy / length
            let left = CGPoint(x: end.x - ux * head - uy * head * 0.55,
                               y: end.y - uy * head + ux * head * 0.55)
            let right = CGPoint(x: end.x - ux * head + uy * head * 0.55,
                                y: end.y - uy * head - ux * head * 0.55)
            output = [start, end, left, end, right]
        } else {
            let diagonal = hypot(bounds.width, bounds.height)
            guard points.count >= 6, bounds.width >= 28, bounds.height >= 28,
                  diagonal.isFinite, diagonal <= 20_000,
                  hypot(start.x - end.x, start.y - end.y) <= max(14, diagonal * 0.20) else { return nil }
            let area = signedArea(points)
            guard abs(area) >= bounds.width * bounds.height * 0.18 else { return nil }
            let forward: CGFloat = area >= 0 ? 1 : -1
            switch kind {
            case .circle, .ellipse:
                guard max(bounds.width, bounds.height) / min(bounds.width, bounds.height) <= (kind == .circle ? 1.65 : 8) else { return nil }
                let cx = bounds.midX, cy = bounds.midY
                let rx = bounds.width / 2, ry = bounds.height / 2
                guard points.allSatisfy({ point in
                    let radius = hypot((point.x - cx) / rx, (point.y - cy) / ry)
                    return radius >= 0.45 && radius <= 1.55
                }) else { return nil }
                var turn: CGFloat = 0
                var prior = atan2((start.y - cy) / ry, (start.x - cx) / rx)
                for point in points.dropFirst() {
                    let angle = atan2((point.y - cy) / ry, (point.x - cx) / rx)
                    var delta = angle - prior
                    while delta > .pi { delta -= .pi * 2 }
                    while delta < -.pi { delta += .pi * 2 }
                    guard delta * forward >= -0.20 else { return nil }
                    turn += delta; prior = angle
                }
                guard abs(turn) >= .pi * 1.5, abs(turn) <= .pi * 2.7 else { return nil }
                let radius = (rx + ry) / 2
                let xRadius = kind == .circle ? radius : rx, yRadius = kind == .circle ? radius : ry
                let angle = atan2((start.y - cy) / ry, (start.x - cx) / rx)
                output = (0...96).map { step in
                    let a = angle + forward * CGFloat(step) / 96 * .pi * 2
                    return CGPoint(x: cx + cos(a) * xRadius, y: cy + sin(a) * yRadius)
                }
                output[output.count - 1] = output[0]
            case .rectangle:
                let tolerance = max(10, diagonal * 0.16)
                guard points.allSatisfy({ min(min(abs($0.x - bounds.minX), abs($0.x - bounds.maxX)),
                                             min(abs($0.y - bounds.minY), abs($0.y - bounds.maxY))) <= tolerance }) else { return nil }
                var corners = [CGPoint(x: bounds.minX, y: bounds.minY), CGPoint(x: bounds.maxX, y: bounds.minY),
                               CGPoint(x: bounds.maxX, y: bounds.maxY), CGPoint(x: bounds.minX, y: bounds.maxY)]
                if forward < 0 { corners.reverse() }
                output = closedPolygon(corners, startingNear: start)
            case .triangle:
                var hull = convexHull(points)
                while hull.count > 3 {
                    let index = hull.indices.min { left, right in
                        abs(cross(hull[(left + hull.count - 1) % hull.count], hull[left], hull[(left + 1) % hull.count]))
                            < abs(cross(hull[(right + hull.count - 1) % hull.count], hull[right], hull[(right + 1) % hull.count]))
                    }!
                    hull.remove(at: index)
                }
                guard hull.count == 3, abs(signedArea(hull)) >= bounds.width * bounds.height * 0.20,
                      points.allSatisfy({ p in hull.indices.map { distance(p, to: hull[$0], hull[($0 + 1) % 3]) }.min()! <= max(10, diagonal * 0.14) }) else { return nil }
                if forward < 0 { hull.reverse() }
                output = closedPolygon(hull, startingNear: start)
            case .off, .arrow, .axes: return nil
            }
        }
        return ShapeResult(shape: kind, points: output, sourceStart: start, sourceEnd: end, sourceBounds: bounds)
    }

    private static func signedArea(_ points: [CGPoint]) -> CGFloat {
        guard points.count > 2 else { return 0 }
        return points.indices.reduce(0) { sum, i in
            let a = points[i], b = points[(i + 1) % points.count]
            return sum + (a.x * b.y - b.x * a.y) / 2
        }
    }
    private static func axisCoordinate(_ values: [CGFloat], near midpoint: CGFloat) -> CGFloat {
        let sorted = values.sorted()
        var start = 0, bestStart = 0, bestEnd = 0
        for end in sorted.indices {
            while sorted[end] - sorted[start] > 8 { start += 1 }
            let count = end - start, bestCount = bestEnd - bestStart
            if count > bestCount || count == bestCount
                && abs(sorted[(start + end) / 2] - midpoint) < abs(sorted[(bestStart + bestEnd) / 2] - midpoint) {
                bestStart = start; bestEnd = end
            }
        }
        return sorted[(bestStart + bestEnd) / 2]
    }
    private static func cross(_ a: CGPoint, _ b: CGPoint, _ c: CGPoint) -> CGFloat {
        (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
    }
    private static func convexHull(_ points: [CGPoint]) -> [CGPoint] {
        let sorted = points.sorted { $0.x == $1.x ? $0.y < $1.y : $0.x < $1.x }
        var lower: [CGPoint] = [], upper: [CGPoint] = []
        for p in sorted {
            while lower.count >= 2 && cross(lower[lower.count - 2], lower[lower.count - 1], p) <= 0 { lower.removeLast() }
            lower.append(p)
        }
        for p in sorted.reversed() {
            while upper.count >= 2 && cross(upper[upper.count - 2], upper[upper.count - 1], p) <= 0 { upper.removeLast() }
            upper.append(p)
        }
        return Array(lower.dropLast()) + Array(upper.dropLast())
    }
    private static func distance(_ point: CGPoint, to a: CGPoint, _ b: CGPoint) -> CGFloat {
        let q = projection(point, onto: a, b)
        return hypot(point.x - q.x, point.y - q.y)
    }
    private static func projection(_ point: CGPoint, onto a: CGPoint, _ b: CGPoint) -> CGPoint {
        let dx = b.x - a.x, dy = b.y - a.y, squared = dx * dx + dy * dy
        let t = squared > 0 ? min(1, max(0, ((point.x - a.x) * dx + (point.y - a.y) * dy) / squared)) : 0
        return CGPoint(x: a.x + t * dx, y: a.y + t * dy)
    }
    private static func closedPolygon(_ vertices: [CGPoint], startingNear point: CGPoint) -> [CGPoint] {
        let index = vertices.indices.min { a, b in
            distance(point, to: vertices[a], vertices[(a + 1) % vertices.count])
                < distance(point, to: vertices[b], vertices[(b + 1) % vertices.count])
        }!
        let start = projection(point, onto: vertices[index], vertices[(index + 1) % vertices.count])
        return [start] + (1...vertices.count).map { vertices[(index + $0) % vertices.count] } + [start]
    }
}

/// Bounded screen-point geometry. This never reads a PKDrawing while ink moves.
public struct HeldLineTracker: Sendable {
    public struct Line: Equatable, Sendable {
        public let start: CGPoint
        public let end: CGPoint
    }
    public static let maximumSamples = 2_048
    public private(set) var samples: [CGPoint] = []
    public private(set) var lastMovementTime: TimeInterval = 0
    public private(set) var confirmedLine: Line?
    private var movementAnchor = CGPoint.zero
    private var valid = true

    public init(point: CGPoint, time: TimeInterval) {
        valid = point.x.isFinite && point.y.isFinite && time.isFinite
        if valid { samples = [point]; movementAnchor = point; lastMovementTime = time }
    }

    public mutating func append(_ point: CGPoint, time: TimeInterval) {
        guard valid, point.x.isFinite, point.y.isFinite, time.isFinite, time >= lastMovementTime else {
            valid = false; confirmedLine = nil; return
        }
        if hypot(point.x - movementAnchor.x, point.y - movementAnchor.y) > 2 {
            movementAnchor = point; lastMovementTime = time; confirmedLine = nil
        }
        guard let last = samples.last, hypot(point.x - last.x, point.y - last.y) >= 0.75 else { return }
        guard samples.count < Self.maximumSamples else { valid = false; confirmedLine = nil; return }
        samples.append(point)
    }

    public mutating func confirmIfQuiet(at time: TimeInterval, duration: TimeInterval) -> Line? {
        guard valid, time.isFinite, duration.isFinite, duration > 0,
              time - lastMovementTime >= duration else { return nil }
        confirmedLine = Self.line(through: samples)
        return confirmedLine
    }

    /// Finish uses the same quiet-hold rule even if UIKit delivers lift before
    /// the queued timer, and tolerates small tip drift caused by lifting.
    public mutating func finish(at point: CGPoint, time: TimeInterval, duration: TimeInterval,
                         liftTolerance: CGFloat = 6) -> Line? {
        guard point.x.isFinite, point.y.isFinite, time.isFinite,
              liftTolerance.isFinite, liftTolerance >= 0 else { return nil }
        _ = confirmIfQuiet(at: time, duration: duration)
        if let confirmedLine,
           hypot(point.x - confirmedLine.end.x, point.y - confirmedLine.end.y) <= liftTolerance {
            return confirmedLine
        }
        append(point, time: time)
        return confirmIfQuiet(at: time, duration: duration)
    }

    public static func line(through points: [CGPoint], minimumLength: CGFloat = 36) -> Line? {
        guard minimumLength.isFinite, minimumLength > 0, points.count >= 3, points.count <= maximumSamples,
              points.allSatisfy({ $0.x.isFinite && $0.y.isFinite }),
              let start = points.first, let end = points.last else { return nil }
        let dx = end.x - start.x, dy = end.y - start.y
        let length = hypot(dx, dy)
        guard length.isFinite, length >= minimumLength else { return nil }
        let tolerance = min(22, max(4, length * 0.04))
        var distance: CGFloat = 0, previous = start, furthest: CGFloat = 0
        for point in points {
            distance += hypot(point.x - previous.x, point.y - previous.y)
            let along = ((point.x - start.x) * dx + (point.y - start.y) * dy) / length
            let across = abs((point.x - start.x) * dy - (point.y - start.y) * dx) / length
            guard across <= tolerance, along >= -tolerance, along <= length + tolerance,
                  along >= furthest - 4 else { return nil }
            furthest = max(furthest, along); previous = point
        }
        guard distance <= length * 1.18 else { return nil }
        return Line(start: start, end: end)
    }
}

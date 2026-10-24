import Foundation
import CoreGraphics

/// Camera-independent local-origin tape path and hit testing from the iPad overlay.
public struct WritingAidTapeGeometry {
    public struct Key: Equatable {
        var points: [WritingAidPoint]
        var width: Double
        var anchorItemID: UUID?
        init(_ tape: WritingAidTape) {
            points = tape.points; width = tape.width; anchorItemID = tape.anchorItemID
        }
    }
    public let key: Key
    public let path: CGPath
    public let origin: CGPoint
    public let worldBounds: CGRect

    public init?(_ tape: WritingAidTape) {
        guard tape.anchorItemID == nil, let first = tape.points.first,
              (try? tape.validate()) != nil else { return nil }
        key = Key(tape)
        let sourceOrigin = first.cgPoint
        let centerline = CGMutablePath(); centerline.move(to: .zero)
        if tape.points.count == 1 { centerline.addLine(to: CGPoint(x: 0.01, y: 0)) }
        else {
            for point in tape.points.dropFirst() {
                centerline.addLine(to: CGPoint(x: point.x - first.x, y: point.y - first.y))
            }
        }
        let band = centerline.copy(strokingWithWidth: tape.width, lineCap: .round, lineJoin: .round, miterLimit: 1)
        let bandBounds = band.boundingBoxOfPath
        origin = CGPoint(x: sourceOrigin.x + bandBounds.minX, y: sourceOrigin.y + bandBounds.minY)
        var translation = CGAffineTransform(translationX: -bandBounds.minX, y: -bandBounds.minY)
        guard let localBand = band.copy(using: &translation) else { return nil }
        path = localBand
        worldBounds = CGRect(origin: origin, size: bandBounds.size)
    }

    public func contains(worldPoint: CGPoint) -> Bool {
        worldBounds.contains(worldPoint)
            && path.contains(CGPoint(x: worldPoint.x - origin.x, y: worldPoint.y - origin.y))
    }
}


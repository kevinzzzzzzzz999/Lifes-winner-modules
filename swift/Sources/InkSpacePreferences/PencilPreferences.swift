import Foundation
import CoreGraphics

/// These values describe requested actions. A UIKit/PencilKit host must receive
/// hardware events and implement the actions; this library never observes input.
public struct BoardPencilGestureSettings: Codable, Equatable, Sendable {
    public enum Action: String, Codable, CaseIterable, Sendable { case system, eraser, previous, palette, attributes, none }
    public var doubleTap: Action
    public var squeeze: Action
    public init(doubleTap: Action = .system, squeeze: Action = .system) { self.doubleTap = doubleTap; self.squeeze = squeeze }
}

public struct BoardPencilLineSettings: Codable, Equatable, Sendable {
    public static let durationRange = 0.35...1.5
    public var isEnabled: Bool
    public var holdDuration: TimeInterval
    public init(isEnabled: Bool = true, holdDuration: TimeInterval = 0.65) { self.isEnabled = isEnabled; self.holdDuration = holdDuration }
    public var normalized: Self { Self(isEnabled: isEnabled, holdDuration: bounded(holdDuration, Self.durationRange, fallback: 0.65)) }
}

public struct BoardPencilShapeSettings: Codable, Equatable, Sendable {
    public enum Shape: String, Codable, CaseIterable, Sendable { case off, circle, ellipse, rectangle, triangle, arrow, axes }
    public var shape: Shape
    public init(shape: Shape = .off) { self.shape = shape }
}

public struct BoardPaletteDockSettings: Codable, Equatable, Sendable {
    public enum Edge: String, Codable, CaseIterable, Sendable {
        case top, bottom, left, right
        public var isVertical: Bool { self == .left || self == .right }
    }
    public var edge: Edge
    public var isMinimized: Bool
    public var usesSystemPalette: Bool
    public init(edge: Edge = .bottom, isMinimized: Bool = false, usesSystemPalette: Bool = false) {
        self.edge = edge; self.isMinimized = isMinimized; self.usesSystemPalette = usesSystemPalette
    }
    public func frame(in available: CGRect, toolCount: Int) -> CGRect {
        guard !available.isNull, !available.isInfinite, available.width > 0, available.height > 0 else { return .zero }
        let area = available.insetBy(dx: min(8, available.width / 8), dy: min(8, available.height / 8))
        let length: CGFloat = isMinimized || usesSystemPalette ? 52 : CGFloat(max(1, min(1_024, toolCount))) * 52 + 3 * 44 + 12
        let width = min(area.width, edge.isVertical ? 60 : length), height = min(area.height, edge.isVertical ? length : 60)
        switch edge {
        case .top: return CGRect(x: area.midX - width / 2, y: area.minY, width: width, height: height)
        case .bottom: return CGRect(x: area.midX - width / 2, y: area.maxY - height, width: width, height: height)
        case .left: return CGRect(x: area.minX, y: area.midY - height / 2, width: width, height: height)
        case .right: return CGRect(x: area.maxX - width, y: area.midY - height / 2, width: width, height: height)
        }
    }
}

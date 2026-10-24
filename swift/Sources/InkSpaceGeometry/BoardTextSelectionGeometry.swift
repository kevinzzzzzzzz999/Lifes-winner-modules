// Copyright (c) 2026 InkSpace contributors. MIT License.
// Adapted from Core/BoardTextSelectionGeometry.swift in the complete application.
import Foundation
import CoreGraphics

/// Identity of the pixels passed to on-device text analysis. Screen dimensions,
/// world offset and scale are all required: the same text at a different zoom
/// cannot reuse its previous selection geometry.
public struct BoardTextSelectionSnapshotKey: Equatable {
    public init(sessionID: UUID, boardID: UUID, size: CGSize, offset: CGPoint, zoom: CGFloat, documentRevision: Int, updatedAt: Date, previewEpoch: Int = 0, imageRevision: Int = 0, renderedRevision: Int = 0, nativeInkRevision: UInt64 = 0, prefersHighResolution: Bool = false) { self.sessionID = sessionID; self.boardID = boardID; self.size = size; self.offset = offset; self.zoom = zoom; self.documentRevision = documentRevision; self.updatedAt = updatedAt; self.previewEpoch = previewEpoch; self.imageRevision = imageRevision; self.renderedRevision = renderedRevision; self.nativeInkRevision = nativeInkRevision; self.prefersHighResolution = prefersHighResolution }

    public let sessionID: UUID
    public let boardID: UUID
    public let size: CGSize
    public let offset: CGPoint
    public let zoom: CGFloat
    public let documentRevision: Int
    public let updatedAt: Date
    public let previewEpoch: Int
    public let imageRevision: Int
    public let renderedRevision: Int
    /// Native ink changes independently of the document's saved metadata.
    /// A default keeps the existing PDF/video/document consumers compatible.
    public var nativeInkRevision: UInt64 = 0
    /// Explicit in-content recognition may spend more pixels; ordinary reading
    /// retains its smaller idle-analysis budget and never changes ink rendering.
    public var prefersHighResolution = false

    public var isValid: Bool {
        size.width.isFinite && size.height.isFinite && size.width >= 8 && size.height >= 8
            && offset.x.isFinite && offset.y.isFinite && zoom.isFinite && zoom > 0
    }

    public func worldPoint(for screenPoint: CGPoint) -> CGPoint {
        CGPoint(x: (screenPoint.x + offset.x) / zoom, y: (screenPoint.y + offset.y) / zoom)
    }

    public func worldRect(forNormalizedRect rect: CGRect) -> CGRect {
        CGRect(origin: worldPoint(for: CGPoint(x: rect.minX * size.width, y: rect.minY * size.height)),
            size: CGSize(width: rect.width * size.width / zoom, height: rect.height * size.height / zoom))
    }

    public func normalizedRect(forWorldRect rect: CGRect) -> CGRect {
        CGRect(x: (rect.minX * zoom - offset.x) / size.width, y: (rect.minY * zoom - offset.y) / size.height,
            width: rect.width * zoom / size.width, height: rect.height * zoom / size.height)
    }

    /// Speech keeps an immutable transcript. Preview resolution/cache changes
    /// cannot invalidate its world geometry; an actual document edit can.
    public func hasSameDocument(as other: Self) -> Bool {
        sessionID == other.sessionID && boardID == other.boardID && documentRevision == other.documentRevision
            && nativeInkRevision == other.nativeInkRevision
    }

    public func hasSameContent(as other: Self) -> Bool {
        sessionID == other.sessionID && boardID == other.boardID && documentRevision == other.documentRevision
            && updatedAt == other.updatedAt && previewEpoch == other.previewEpoch
            && imageRevision == other.imageRevision && renderedRevision == other.renderedRevision
            && nativeInkRevision == other.nativeInkRevision
    }

    /// VisionKit uses top-left unit coordinates within the custom content view.
    /// The viewport snapshot fills that view, so no crop or world origin is
    /// applied to the native selection a second time.
    public var contentsRect: CGRect { CGRect(x: 0, y: 0, width: 1, height: 1) }

    public var renderScale: CGFloat {
        guard isValid else { return 0 }
        let dimension: CGFloat = prefersHighResolution ? 4096 : 2600
        let pixels: CGFloat = prefersHighResolution ? 12_000_000 : 6_000_000
        let scale = min(prefersHighResolution ? 3 : 2, dimension / max(size.width, size.height),
                        sqrt(pixels / size.width / size.height))
        // UIKit rounds bitmap dimensions up. Quantize down first so a viewport
        // near the pixel limit cannot exceed it by a row and be rejected.
        let rounded = min(floor(size.width * scale) / size.width, floor(size.height * scale) / size.height)
        return rounded > 0 ? rounded.nextDown : 0
    }
}

/// A completed analysis may be installed exactly once, only for the currently
/// requested pixels. Kept independent of UIKit/VisionKit for race tests.
public struct BoardTextSelectionGeneration {
    public init() {}

    public private(set) var value: UInt64 = 0
    public private(set) var key: BoardTextSelectionSnapshotKey?
    @discardableResult public mutating func replace(with next: BoardTextSelectionSnapshotKey?) -> Bool {
        guard key != next else { return false }
        value &+= 1
        key = next
        return true
    }
    public mutating func invalidate() { value &+= 1; key = nil }
    public func accepts(_ generation: UInt64, key candidate: BoardTextSelectionSnapshotKey) -> Bool {
        generation == value && key == candidate && candidate.isValid
    }
}

/// Keep engine-supported identifiers, including Chinese scripts, instead of
/// failing recognition when one hard-coded language is unavailable.
public enum BoardTextRecognitionPolicy {
    public static func languages(supported: [String], preferred: [String] = Locale.preferredLanguages) -> [String] {
        func normalized(_ value: String) -> String { value.replacingOccurrences(of: "_", with: "-").lowercased() }
        var result: [String] = []
        for desired in ["zh-Hans", "zh-Hant", "en-US"] + preferred {
            let target = normalized(desired)
            let scriptTarget = target.hasPrefix("zh-tw") || target.hasPrefix("zh-hk") || target.hasPrefix("zh-mo") ? "zh-hant" :
                target.hasPrefix("zh-cn") || target.hasPrefix("zh-sg") ? "zh-hans" : target
            let match = supported.first { normalized($0) == scriptTarget }
                ?? supported.first { normalized($0).hasPrefix(scriptTarget + "-") }
                ?? (scriptTarget.hasPrefix("zh-") ? nil : supported.first {
                    normalized($0).split(separator: "-").first == scriptTarget.split(separator: "-").first
                })
            if let match, !result.contains(match) { result.append(match) }
            if result.count == 6 { break }
        }
        // An empty locales list lets VisionKit use the device language defaults.
        return result
    }
}

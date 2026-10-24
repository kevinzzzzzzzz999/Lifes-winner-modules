// Copyright (c) 2026 InkSpace contributors. MIT License.
// Adapted from PDFExtension/PDFNativeInkArchive.swift in the complete application.
import Foundation

/// Optional v1 native payload alongside the original normalized interchange
/// points. Old records need no migration and are never rewritten on read.
public struct PDFNativeInkArchive: Codable, Equatable, Sendable {
    public init(version: Int = 1, referenceWidth: Double, data: Data) { self.version = version; self.referenceWidth = referenceWidth; self.data = data }

    public static let maximumDataBytes = 128 * 1024
    public var version: Int = 1
    public var referenceWidth: Double
    public var data: Data
    public var isValid: Bool {
        version == 1 && referenceWidth.isFinite && (1...100_000).contains(referenceWidth)
            && !data.isEmpty && data.count <= Self.maximumDataBytes
    }
    public static func hasValidKeys(_ value: Any?) -> Bool {
        guard let raw = value as? [String: Any] else { return false }
        return Set(raw.keys) == Set(["version", "referenceWidth", "data"])
    }
}

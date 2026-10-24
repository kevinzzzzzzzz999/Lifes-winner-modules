// Copyright (c) 2026 InkSpace contributors. MIT License.
// Adapted from Core/PageGrid.swift in the complete application.
import Foundation
import CoreGraphics

public enum DocumentExpansionDirection: String, CaseIterable, Identifiable, Sendable {
    case vertical, horizontal, grid
    public var id: String { rawValue }
    public var title: String {
        switch self {
        case .vertical: String(localized: "垂直")
        case .horizontal: String(localized: "水平")
        case .grid: String(localized: "网格")
        }
    }
}

public struct DocumentExpansionOptions: Equatable, Sendable {
    public init(direction: DocumentExpansionDirection = .vertical, scale: Double = 1, columns: Int = 4) { self.direction = direction; self.scale = scale; self.columns = columns }

    public var direction: DocumentExpansionDirection = .vertical
    public var scale: Double = 1
    public var columns: Int = 4

    public func validate() throws {
        guard scale.isFinite, (0.25...2).contains(scale) else { throw DocumentExpansionError.invalidScale }
        guard (1...24).contains(columns) else { throw DocumentExpansionError.invalidColumns }
    }
}

public enum DocumentExpansionError: LocalizedError {
    case invalidScale, invalidColumns, invalidPageSize, insufficientSpace
    public var errorDescription: String? {
        switch self {
        case .invalidScale: String(localized: "页面比例必须在 25% 到 200% 之间。")
        case .invalidColumns: String(localized: "网格列数必须在 1 到 24 之间。")
        case .invalidPageSize: String(localized: "PDF 页面尺寸无效，尚未添加任何页面。")
        case .insufficientSpace: String(localized: "当前位置空间不足，请换靠上/靠左位置或缩小页面比例。")
        }
    }
}

/// Geometry only: no PDF decoding, images, or view creation.
public enum PageGrid {
    public static let worldSize: Double = 8_000_000

    /// The chosen point is the first page's exact top-left corner. Validate the
    /// complete batch before returning; never move it or change the user's scale.
    public static func expansionLayout(pageSizes: [CGSize], at point: CGPoint,
                                options: DocumentExpansionOptions = .init()) throws -> [CGRect] {
        try options.validate()
        guard point.x.isFinite, point.y.isFinite,
              point.x >= 0, point.y >= 0, point.x <= worldSize, point.y <= worldSize else {
            throw DocumentExpansionError.insufficientSpace
        }
        guard !pageSizes.isEmpty else { return [] }
        let pageWidth = 720 * options.scale
        let gap = 48 * options.scale
        let heights: [Double] = try pageSizes.map { size in
            guard size.width.isFinite, size.height.isFinite, size.width > 0, size.height > 0 else {
                throw DocumentExpansionError.invalidPageSize
            }
            let height = pageWidth * Double(size.height / size.width)
            guard height.isFinite, height > 0 else { throw DocumentExpansionError.invalidPageSize }
            return height
        }
        let columnCount: Int
        switch options.direction {
        case .vertical: columnCount = 1
        case .horizontal: columnCount = heights.count
        case .grid: columnCount = min(options.columns, heights.count)
        }
        let rowCount = (heights.count - 1) / columnCount + 1
        let rowHeights = (0..<rowCount).map { row in
            heights[(row * columnCount)..<min(heights.count, (row + 1) * columnCount)].max() ?? 0
        }
        let width = Double(columnCount) * pageWidth + Double(columnCount - 1) * gap
        let height = rowHeights.reduce(0, +) + Double(rowCount - 1) * gap
        guard width.isFinite, height.isFinite,
              width <= worldSize - Double(point.x), height <= worldSize - Double(point.y) else {
            throw DocumentExpansionError.insufficientSpace
        }
        var frames: [CGRect] = []
        frames.reserveCapacity(heights.count)
        var rowY = Double(point.y)
        for row in 0..<rowCount {
            for column in 0..<columnCount {
                let index = row * columnCount + column
                guard index < heights.count else { break }
                let frame = CGRect(x: Double(point.x) + Double(column) * (pageWidth + gap),
                                   y: rowY, width: pageWidth, height: heights[index])
                guard frame.minX >= 0, frame.minY >= 0, frame.maxX <= worldSize, frame.maxY <= worldSize else {
                    throw DocumentExpansionError.insufficientSpace
                }
                frames.append(frame)
            }
            rowY += rowHeights[row] + gap
        }
        return frames
    }

    public static func layout(pageSizes: [CGSize], center: CGPoint,
                       columns: Int = 24, pageWidth: Double = 720,
                       gap: Double = 48) throws -> [CGRect] {
        guard !pageSizes.isEmpty else { return [] }
        guard columns > 0, pageWidth.isFinite, pageWidth > 0,
              gap.isFinite, gap >= 0, center.x.isFinite, center.y.isFinite
        else { throw PageGridError.invalidGeometry }
        let columnCount = min(columns, pageSizes.count)
        let heights: [Double] = try pageSizes.map { size in
            guard size.width.isFinite, size.height.isFinite, size.width > 0, size.height > 0
            else { throw PageGridError.invalidGeometry }
            let height = pageWidth * Double(size.height / size.width)
            guard height.isFinite, height > 0 else { throw PageGridError.invalidGeometry }
            return height
        }
        let rowCount = (heights.count + columnCount - 1) / columnCount
        let rowHeights = (0..<rowCount).map { row in
            heights[(row * columnCount)..<min(heights.count, (row + 1) * columnCount)].max() ?? 0
        }
        let width = Double(columnCount) * pageWidth + Double(columnCount - 1) * gap
        let height = rowHeights.reduce(0, +) + Double(rowCount - 1) * gap
        guard width <= worldSize, height <= worldSize else { throw PageGridError.invalidGeometry }
        let startX = max(0, min(worldSize - width, Double(center.x) - width / 2))
        var rowY = max(0, min(worldSize - height, Double(center.y) - height / 2))
        var frames = [CGRect]()
        frames.reserveCapacity(heights.count)
        for row in 0..<rowCount {
            for column in 0..<columnCount {
                let index = row * columnCount + column
                guard index < heights.count else { break }
                frames.append(CGRect(x: startX + Double(column) * (pageWidth + gap),
                                     y: rowY, width: pageWidth, height: heights[index]))
            }
            rowY += rowHeights[row] + gap
        }
        return frames
    }
}

public enum PageGridError: Error { case invalidGeometry }

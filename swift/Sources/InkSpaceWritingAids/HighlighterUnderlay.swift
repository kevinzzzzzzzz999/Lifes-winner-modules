import Foundation

/// The original native highlighter stacking rule, expressed over host-owned stroke values.
/// Equality must compare every editable field; object identity alone is insufficient.
public enum WritingAidHighlighterUnderlay {
    public static let maximumStrokes = 50_000
    public static let maximumCompletedSuffix = 128
    public struct Change<Stroke> {
        public let strokes: [Stroke]
        public let completedMarkerCount: Int
        public let completedStrokeCount: Int
    }
    /// Moves only newly completed markers beneath ordinary ink. Historical order stays intact.
    /// Nil means the host must leave its current drawing unchanged.
    public static func applyingCompletedSuffix<Stroke>(to current: [Stroke], after baseline: [Stroke], enabled: Bool,
                                                       isMarker: (Stroke) -> Bool, isEmpty: (Stroke) -> Bool,
                                                       areEquivalent: (Stroke, Stroke) -> Bool) -> Change<Stroke>? {
        guard enabled else { return nil }
        let suffixCount = current.count - baseline.count
        guard current.count <= maximumStrokes, (1...maximumCompletedSuffix).contains(suffixCount),
              zip(current.prefix(baseline.count), baseline).allSatisfy({ areEquivalent($0.0, $0.1) }) else { return nil }
        let suffix = Array(current.suffix(suffixCount))
        guard suffix.allSatisfy({ !isEmpty($0) }) else { return nil }
        let markers = suffix.filter(isMarker)
        guard !markers.isEmpty else { return nil }
        let destination = baseline.firstIndex(where: { !isMarker($0) }) ?? baseline.count
        if destination == baseline.count {
            guard let ordinary = suffix.firstIndex(where: { !isMarker($0) }),
                  let lastMarker = suffix.lastIndex(where: isMarker), ordinary < lastMarker else { return nil }
        }
        let ordinary = suffix.filter { !isMarker($0) }
        let reordered = Array(baseline.prefix(destination)) + markers + baseline.dropFirst(destination) + ordinary
        return Change(strokes: reordered, completedMarkerCount: markers.count, completedStrokeCount: suffixCount)
    }

    public struct ReplayOrder: Sendable {
        private let paintOrder: [Int]
        public let count: Int
        fileprivate init(_ indices: [Int]) { paintOrder = indices; count = indices.count }
        /// Indices into the chronological stroke array, in their saved paint order.
        public func visibleIndices(visibleCount: Int) -> [Int]? {
            guard visibleCount >= 0, visibleCount <= count else { return nil }
            return paintOrder.filter { $0 < visibleCount }
        }
    }
    /// Build once after chronological sorting. Source indices may have gaps for erased strokes.
    public static func replayOrder(sourceIndices: [Int]) -> ReplayOrder? {
        guard sourceIndices.count <= maximumStrokes, sourceIndices.allSatisfy({ $0 >= 0 }),
              Set(sourceIndices).count == sourceIndices.count else { return nil }
        return ReplayOrder(sourceIndices.indices.sorted { sourceIndices[$0] < sourceIndices[$1] })
    }
}

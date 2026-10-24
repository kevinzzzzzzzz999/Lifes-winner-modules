// Copyright (c) 2026 InkSpace contributors. MIT License.
// Adapted from Core/DraftTextHistory.swift in the complete application.
import Foundation

/// Local editor history only. Never writes the file or reaches another editor's
/// undo manager. Limits bound retained text while the current draft stays intact.
public struct DraftTextHistory {
    public init(initialText: String? = nil) { self.current = initialText }

    public private(set) var current: String?
    private var past: [String] = []
    private var future: [String] = []
    public var canUndo: Bool { !past.isEmpty }
    public var canRedo: Bool { !future.isEmpty }
    public mutating func reset(_ value: String) { current = value; past = []; future = [] }
    public mutating func track(_ value: String) {
        guard let old = current else { reset(value); return }
        guard old != value else { return }
        past.append(old); current = value; future = []; trim()
    }
    public mutating func undo() -> String? {
        guard let value = past.popLast() else { return nil }
        if let current { future.append(current) }
        current = value; trim(); return value
    }
    public mutating func redo() -> String? {
        guard let value = future.popLast() else { return nil }
        if let current { past.append(current) }
        current = value; trim(); return value
    }
    private mutating func trim() {
        while past.count + future.count > 20 || (past + future).reduce(0, { $0 + $1.utf16.count }) > 4_000_000 {
            if !past.isEmpty { past.removeFirst() } else if !future.isEmpty { future.removeFirst() } else { break }
        }
    }
}

// Copyright (c) 2026 InkSpace contributors. MIT License.
// Adapted from Video/BoardVideoSubtitles.swift in the complete application.
import Foundation

public struct BoardSubtitleCue: Sendable {
    public init(start: Double, end: Double, text: String) { self.start = start; self.end = end; self.text = text }

    public let start: Double
    public let end: Double
    public let text: String
}

public struct BoardSubtitleDocument: Sendable {
    public let cues: [BoardSubtitleCue]
    public let plainText: String?
    private let maximumEnd: [Double]
    public init(cues: [BoardSubtitleCue], plainText: String? = nil) {
        self.cues = cues; self.plainText = plainText
        var end = 0.0
        maximumEnd = cues.map { end = max(end, $0.end); return end }
    }
    public func text(at seconds: Double) -> String {
        if let plainText { return plainText }
        guard seconds.isFinite, seconds >= 0 else { return "" }
        var lower = 0, upper = cues.count
        while lower < upper {
            let middle = (lower + upper) / 2
            if cues[middle].start <= seconds { lower = middle + 1 } else { upper = middle }
        }
        var index = lower - 1, active: [String] = []
        while index >= 0 && maximumEnd[index] > seconds && active.count < 8 {
            let cue = cues[index]
            if cue.start <= seconds && seconds < cue.end { active.append(cue.text) }
            index -= 1
        }
        return active.reversed().joined(separator: "\n")
    }
}

public enum BoardSubtitleError: LocalizedError {
    case unsupported, tooLarge, encoding, malformed, unavailable
    public var errorDescription: String? {
        switch self {
        case .unsupported: return String(localized: "请选择 SRT、VTT 或 TXT 字幕文件。")
        case .tooLarge: return String(localized: "字幕读取上限为 2 MB、20 万字符、一万段，每段最多 2000 个字符。")
        case .encoding: return String(localized: "字幕编码无法读取，请另存为 UTF-8 或带字节标记的 UTF-16。")
        case .malformed: return String(localized: "字幕时间码或内容无效；SRT/VTT 需要有效的开始和结束时间。")
        case .unavailable: return String(localized: "字幕暂不可读，请确认文件已下载并重新选择。")
        }
    }
}

public enum BoardSubtitleParser {
    public static let maximumBytes = 2 * 1024 * 1024
    public static func parse(data: Data, fileExtension: String) throws -> BoardSubtitleDocument {
        guard ["srt", "vtt", "txt"].contains(fileExtension.lowercased()) else { throw BoardSubtitleError.unsupported }
        guard data.count <= maximumBytes else { throw BoardSubtitleError.tooLarge }
        let encoding: String.Encoding = data.starts(with: [0xff, 0xfe]) || data.starts(with: [0xfe, 0xff]) ? .utf16 : .utf8
        guard var text = String(data: data, encoding: encoding) else { throw BoardSubtitleError.encoding }
        if text.first == "\u{feff}" { text.removeFirst() }
        guard !text.unicodeScalars.contains(where: { $0.value < 32 && ![9, 10, 13].contains($0.value) }) else { throw BoardSubtitleError.encoding }
        text = text.replacingOccurrences(of: "\r\n", with: "\n").replacingOccurrences(of: "\r", with: "\n").trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { throw BoardSubtitleError.malformed }
        guard text.unicodeScalars.count <= 200_000 else { throw BoardSubtitleError.tooLarge }
        if fileExtension.lowercased() == "txt" {
            return BoardSubtitleDocument(cues: [], plainText: text)
        }
        if fileExtension.lowercased() == "vtt" {
            let header = text.components(separatedBy: "\n")[0]
            guard header == "WEBVTT" || header.hasPrefix("WEBVTT ") || header.hasPrefix("WEBVTT\t") else { throw BoardSubtitleError.malformed }
        }
        var blocks: [[String]] = [], block: [String] = []
        for line in text.components(separatedBy: "\n") {
            if line.trimmingCharacters(in: .whitespaces).isEmpty {
                if !block.isEmpty { blocks.append(block); block = [] }
            } else { block.append(line) }
        }
        if !block.isEmpty { blocks.append(block) }
        var cues: [BoardSubtitleCue] = []
        for (index, lines) in blocks.enumerated() {
            let first = lines[0].trimmingCharacters(in: .whitespaces)
            if fileExtension.lowercased() == "vtt" {
                if index == 0 && (first == "WEBVTT" || first.hasPrefix("WEBVTT ") || first.hasPrefix("WEBVTT\t")) { continue }
                if first == "NOTE" || first.hasPrefix("NOTE ") || first == "STYLE" || first == "REGION" { continue }
            }
            guard let timingIndex = lines.firstIndex(where: { $0.contains("-->") }), timingIndex <= 1 else { throw BoardSubtitleError.malformed }
            if fileExtension.lowercased() == "srt", timingIndex == 1 {
                let index = lines[0].trimmingCharacters(in: .whitespaces)
                guard !index.isEmpty, index.allSatisfy({ $0.isASCII && $0.isNumber }) else { throw BoardSubtitleError.malformed }
            }
            let timing = lines[timingIndex].components(separatedBy: "-->")
            guard timing.count == 2,
                  let start = timestamp(timing[0].trimmingCharacters(in: .whitespaces)),
                  let endToken = timing[1].split(whereSeparator: \.isWhitespace).first,
                  let end = timestamp(String(endToken)), end > start else { throw BoardSubtitleError.malformed }
            let body = lines.dropFirst(timingIndex + 1).joined(separator: "\n")
                .replacingOccurrences(of: "(?i)</?(b|i|u)>", with: "", options: .regularExpression)
                .trimmingCharacters(in: .whitespacesAndNewlines)
            guard !body.isEmpty else { throw BoardSubtitleError.malformed }
            guard body.utf16.count <= 2_000, cues.count < 10_000 else { throw BoardSubtitleError.tooLarge }
            cues.append(BoardSubtitleCue(start: start, end: end, text: body))
        }
        guard !cues.isEmpty else { throw BoardSubtitleError.malformed }
        let sorted = cues.enumerated().sorted { $0.element.start == $1.element.start ? $0.offset < $1.offset : $0.element.start < $1.element.start }.map(\.element)
        return BoardSubtitleDocument(cues: sorted)
    }
    private static func timestamp(_ source: String) -> Double? {
        let parts = source.replacingOccurrences(of: ",", with: ".").split(separator: ":", omittingEmptySubsequences: false)
        guard parts.count == 2 || parts.count == 3 else { return nil }
        func integer(_ text: Substring) -> Int? {
            guard !text.isEmpty, text.count <= 6, text.allSatisfy({ $0.isASCII && $0.isNumber }) else { return nil }
            return Int(text)
        }
        let fraction = parts.last!.split(separator: ".", omittingEmptySubsequences: false)
        guard fraction.count == 2, let seconds = integer(fraction[0]), seconds < 60,
              (1...3).contains(fraction[1].count), let millis = integer(fraction[1]),
              let minutes = integer(parts[parts.count - 2]), minutes < 60 else { return nil }
        let hours: Int
        if parts.count == 3 { guard let value = integer(parts[0]) else { return nil }; hours = value } else { hours = 0 }
        return Double(hours) * 3600 + Double(minutes) * 60 + Double(seconds) + Double(millis) / pow(10, Double(fraction[1].count))
    }
}

private final class SubtitleReadControl: @unchecked Sendable {
    private let lock = NSLock()
    private var cancelled = false
    private var coordinator: NSFileCoordinator?
    func cancel() { lock.lock(); cancelled = true; let coordinator = coordinator; lock.unlock(); coordinator?.cancel() }
    func install(_ value: NSFileCoordinator) throws {
        lock.lock(); let stopped = cancelled; if !stopped { coordinator = value }; lock.unlock()
        if stopped { throw CancellationError() }
    }
    func check() throws { lock.lock(); let stopped = cancelled; lock.unlock(); if stopped { throw CancellationError() } }
}


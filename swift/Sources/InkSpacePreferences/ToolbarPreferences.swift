import Foundation

/// Presentation only. Hiding a button never changes drawing or file contents.
public enum BoardToolbarFunction: Int, Codable, CaseIterable, Identifiable, Sendable {
    case undo, redo, reviews, assistant, locateFiles, lastInk
    case selectText, copyText, translation, viewOptions, penPalette, ruler, boardTools, readAloud
    public var id: String { String(rawValue) }
    public var bit: Int { 1 << rawValue }
    public static let writing: [Self] = [.undo, .redo, .penPalette, .ruler, .boardTools]
    public static let reading: [Self] = [.selectText, .copyText, .translation, .readAloud]
    public static let shared: [Self] = [.reviews, .assistant, .locateFiles, .lastInk, .viewOptions]
    public func title(language: InterfaceLanguage) -> String {
        let titles = ["撤销", "重做", "待批注", "AI 网页", "定位资料", "最后一笔", "选择文字", "复制所选文字", "圈选翻译", "缩放与定位", "笔与颜色", "直尺", "白板工具", "朗读控制"]
        let english = ["Undo", "Redo", "Reviews", "AI website", "Locate files", "Last ink", "Select text", "Copy selected text", "Translate selection", "Zoom and locate", "Pens and colors", "Ruler", "Board tools", "Read aloud"]
        return (language == .zh ? titles : english)[rawValue]
    }
    public var symbol: String {
        ["arrow.uturn.backward", "arrow.uturn.forward", "text.bubble", "sparkles", "doc.text.magnifyingglass", "pencil.tip.crop.circle.badge.arrow.forward", "text.cursor", "doc.on.doc", "character.bubble", "viewfinder", "pencil.tip.crop.circle", "ruler", "square.grid.2x2", "speaker.wave.2"][rawValue]
    }
}

public struct BoardToolbarVisibility: Codable, Equatable, Sendable {
    public static let knownMask = BoardToolbarFunction.allCases.reduce(0) { $0 | $1.bit }
    public private(set) var hiddenMask: Int
    public init(hiddenMask: Int = 0) { self.hiddenMask = hiddenMask >= 0 ? hiddenMask & Self.knownMask : 0 }
    public func isVisible(_ function: BoardToolbarFunction) -> Bool { hiddenMask & function.bit == 0 }
    public mutating func setVisible(_ visible: Bool, for function: BoardToolbarFunction) {
        if visible { hiddenMask &= ~function.bit } else { hiddenMask |= function.bit }
    }
    public var hiddenCount: Int { BoardToolbarFunction.allCases.filter { !isVisible($0) }.count }
    public init(from decoder: Decoder) throws {
        let values = try decoder.container(keyedBy: CodingKeys.self)
        self.init(hiddenMask: try values.decode(Int.self, forKey: .hiddenMask))
    }
    private enum CodingKeys: String, CodingKey { case hiddenMask }
}

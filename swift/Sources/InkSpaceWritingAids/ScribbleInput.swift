#if os(iOS) && canImport(SwiftUI) && canImport(UIKit)
import SwiftUI
import UIKit

/// A system UITextInput surface. iPadOS performs Scribble recognition; no OCR service is used.
/// The binding belongs to the host and is never cleared automatically.
public struct WritingAidScribbleInput: UIViewRepresentable {
    @Binding private var text: String
    private let fontSize: Double
    private let isEditable: Bool
    private let onWritingChanged: (Bool) -> Void
    public init(text: Binding<String>, fontSize: Double = 24, isEditable: Bool = true,
                onWritingChanged: @escaping (Bool) -> Void = { _ in }) {
        _text = text; self.fontSize = WritingAidSettings(fontSize: fontSize).normalized.fontSize
        self.isEditable = isEditable; self.onWritingChanged = onWritingChanged
    }
    public func makeCoordinator() -> Coordinator { Coordinator(self) }
    public func makeUIView(context: Context) -> UITextView {
        let view = UITextView()
        view.delegate = context.coordinator
        view.backgroundColor = .secondarySystemBackground
        view.textContainerInset = UIEdgeInsets(top: 12, left: 12, bottom: 12, right: 12)
        view.addInteraction(UIScribbleInteraction(delegate: context.coordinator))
        view.accessibilityLabel = "Write with Apple Pencil or type text"
        return view
    }
    public func updateUIView(_ view: UITextView, context: Context) {
        context.coordinator.parent = self
        if view.text != text { view.text = text }
        view.font = .systemFont(ofSize: fontSize)
        view.isEditable = isEditable; view.isSelectable = true
        if !isEditable { view.resignFirstResponder() }
    }
    public final class Coordinator: NSObject, UITextViewDelegate, UIScribbleInteractionDelegate {
        fileprivate var parent: WritingAidScribbleInput
        fileprivate init(_ parent: WritingAidScribbleInput) { self.parent = parent }
        public func textView(_ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
            guard parent.isEditable, let source = textView.text, let range = Range(range, in: source) else { return false }
            return source.replacingCharacters(in: range, with: text).count <= WritingAidTextDraft.maximumCharacters
        }
        public func textViewDidChange(_ textView: UITextView) { parent.text = textView.text ?? "" }
        public func scribbleInteraction(_ interaction: UIScribbleInteraction, shouldBeginAt location: CGPoint) -> Bool { parent.isEditable }
        public func scribbleInteractionWillBeginWriting(_ interaction: UIScribbleInteraction) { parent.onWritingChanged(true) }
        public func scribbleInteractionDidFinishWriting(_ interaction: UIScribbleInteraction) { parent.onWritingChanged(false) }
    }
}

/// Minimal independently embeddable editor. Return true only after accepting the text card.
/// A false result preserves the user's input and shows an explicit retry status.
public struct WritingAidScribbleCardInput: View {
    @Binding private var text: String
    private let fontSize: Double
    private let onCommit: (String) -> Bool
    @State private var isWriting = false
    @State private var rejected = false
    public init(text: Binding<String>, fontSize: Double = 24, onCommit: @escaping (String) -> Bool) {
        _text = text; self.fontSize = fontSize; self.onCommit = onCommit
    }
    public var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            WritingAidScribbleInput(text: $text, fontSize: fontSize, onWritingChanged: { isWriting = $0 })
                .frame(minHeight: 140)
            Button("Create text card") {
                let submitted = text.trimmingCharacters(in: .whitespacesAndNewlines)
                if onCommit(submitted) {
                    if text.trimmingCharacters(in: .whitespacesAndNewlines) == submitted { text = "" }
                    rejected = false
                } else { rejected = true }
            }
            .disabled(isWriting || text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                      || text.count > WritingAidTextDraft.maximumCharacters)
            if rejected { Text("The host did not accept the card. Your draft is preserved.").font(.caption) }
        }
    }
}
#endif

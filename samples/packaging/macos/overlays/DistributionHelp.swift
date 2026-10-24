import AppKit
import Foundation

/// An in-app, read-only help window; no browser or network access is required.
@MainActor enum DistributionHelp {
    private static var window: NSWindow?
    static func show() {
        if let window { window.makeKeyAndOrderFront(nil); NSApp.activate(ignoringOtherApps: true); return }
        let window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 760, height: 680),
                              styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
        window.title = "life'winner · 使用帮助 / Help"
        window.isReleasedWhenClosed = false
        let scroll = NSScrollView(frame: NSRect(x: 0, y: 0, width: 760, height: 680))
        scroll.hasVerticalScroller = true
        scroll.autoresizingMask = [.width, .height]
        let text = NSTextView(frame: scroll.contentView.bounds)
        text.isEditable = false; text.isSelectable = true
        text.isRichText = false; text.font = .systemFont(ofSize: 15)
        text.textColor = .labelColor; text.backgroundColor = .textBackgroundColor
        text.textContainerInset = NSSize(width: 20, height: 18)
        text.isVerticallyResizable = true; text.isHorizontallyResizable = false
        text.autoresizingMask = [.width]
        text.textContainer?.widthTracksTextView = true
        if let url = Bundle.main.url(forResource: "HELP", withExtension: "txt"), let content = try? String(contentsOf: url, encoding: .utf8) {
            text.string = content
        } else { text.string = "Help is unavailable. See the included START HERE document. / 请查看随附使用帮助。" }
        scroll.documentView = text
        window.contentView = scroll
        self.window = window
        window.center(); window.makeKeyAndOrderFront(nil); NSApp.activate(ignoringOtherApps: true)
    }
}

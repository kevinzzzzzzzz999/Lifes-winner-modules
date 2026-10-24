import SwiftUI
import AppKit

final class WritingAidsAppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        NSApp.activate(ignoringOtherApps: true)
    }
}

@main
struct WritingAidsApp: App {
    @NSApplicationDelegateAdaptor(WritingAidsAppDelegate.self) private var delegate
    var body: some Scene {
        WindowGroup("Writing Aids Playground") {
            ContentView().frame(minWidth: 860, minHeight: 660)
        }
        .defaultSize(width: 1080, height: 760)
        .commands { CommandGroup(replacing: .newItem) {} }
    }
}

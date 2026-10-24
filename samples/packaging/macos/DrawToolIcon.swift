import AppKit
import Foundation

// Procedural icons: no external images, fonts, AI assets or user data.
guard CommandLine.arguments.count == 3 else { fatalError("usage: DrawToolIcon.swift writing|preferences output.iconset") }
let kind = CommandLine.arguments[1]
let directory = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
let sizes = [("icon_16x16.png",16),("icon_16x16@2x.png",32),("icon_32x32.png",32),("icon_32x32@2x.png",64),
             ("icon_128x128.png",128),("icon_128x128@2x.png",256),("icon_256x256.png",256),("icon_256x256@2x.png",512),
             ("icon_512x512.png",512),("icon_512x512@2x.png",1024)]
for (name, size) in sizes {
    let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB,
        bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
    let transform = NSAffineTransform(); transform.scale(by: CGFloat(size) / 1024); transform.concat()
    let bounds = NSRect(x: 46, y: 46, width: 932, height: 932)
    let background = NSBezierPath(roundedRect: bounds, xRadius: 208, yRadius: 208)
    let a = kind == "writing" ? NSColor(calibratedRed: 0.16, green: 0.36, blue: 0.84, alpha: 1) : NSColor(calibratedRed: 0.08, green: 0.49, blue: 0.48, alpha: 1)
    let b = kind == "writing" ? NSColor(calibratedRed: 0.42, green: 0.25, blue: 0.70, alpha: 1) : NSColor(calibratedRed: 0.12, green: 0.28, blue: 0.50, alpha: 1)
    NSGradient(starting: a, ending: b)!.draw(in: background, angle: 45)
    NSColor.white.setStroke(); NSColor.white.setFill()
    if kind == "writing" {
        let pencil = NSBezierPath()
        pencil.move(to: NSPoint(x: 260, y: 350)); pencil.line(to: NSPoint(x: 652, y: 742))
        pencil.line(to: NSPoint(x: 746, y: 648)); pencil.line(to: NSPoint(x: 354, y: 256)); pencil.close(); pencil.fill()
        let nib = NSBezierPath(); nib.move(to: .init(x: 240, y: 236)); nib.line(to: .init(x: 272, y: 342)); nib.line(to: .init(x: 346, y: 268)); nib.close(); nib.fill()
        let wave = NSBezierPath(); wave.lineWidth = 48; wave.lineCapStyle = .round
        wave.move(to: .init(x: 480, y: 270)); wave.curve(to: .init(x: 800, y: 270), controlPoint1: .init(x: 570, y: 410), controlPoint2: .init(x: 690, y: 130)); wave.stroke()
    } else {
        for (y, x) in [(CGFloat(720),CGFloat(400)),(CGFloat(512),CGFloat(650)),(CGFloat(304),CGFloat(460))] {
            let line = NSBezierPath(); line.lineWidth = 52; line.lineCapStyle = .round
            line.move(to: .init(x: 244, y: y)); line.line(to: .init(x: 780, y: y)); line.stroke()
            a.setFill(); NSBezierPath(ovalIn: .init(x: x-82, y: y-82, width: 164, height: 164)).fill()
            NSColor.white.setFill(); NSBezierPath(ovalIn: .init(x: x-57, y: y-57, width: 114, height: 114)).fill()
        }
    }
    NSGraphicsContext.restoreGraphicsState()
    try bitmap.representation(using: .png, properties: [:])!.write(to: directory.appendingPathComponent(name))
}

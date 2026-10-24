// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "InkSpaceModules",
    platforms: [.macOS(.v13), .iOS("18.0")],
    products: [
        .library(name: "InkSpaceTextHistory", targets: ["InkSpaceTextHistory"]),
        .library(name: "InkSpaceOutline", targets: ["InkSpaceOutline"]),
        .library(name: "InkSpaceSubtitles", targets: ["InkSpaceSubtitles"]),
        .library(name: "InkSpacePaths", targets: ["InkSpacePaths"]),
        .library(name: "InkSpaceGeometry", targets: ["InkSpaceGeometry"]),
        .library(name: "InkSpaceStudy", targets: ["InkSpaceStudy"]),
        .library(name: "InkSpaceChecklist", targets: ["InkSpaceChecklist"]),
        .library(name: "InkSpacePDFRecords", targets: ["InkSpacePDFRecords"]),
        .library(name: "InkSpaceMediaTimeline", targets: ["InkSpaceMediaTimeline"]),
        .library(name: "InkSpaceAI", targets: ["InkSpaceAI"]),
        .library(name: "InkSpaceWebClips", targets: ["InkSpaceWebClips"]),
        .library(name: "InkSpaceSpeechText", targets: ["InkSpaceSpeechText"]),
        .library(name: "InkSpaceStorage", targets: ["InkSpaceStorage"]),
        .library(name: "InkSpaceOCR", targets: ["InkSpaceOCR"]),
        .library(name: "InkSpaceExcelPictures", targets: ["InkSpaceExcelPictures"]),
        .library(name: "InkSpaceScanPDF", targets: ["InkSpaceScanPDF"]),
        .library(name: "InkSpacePreferences", targets: ["InkSpacePreferences"]),
        .library(name: "InkSpaceWritingAids", targets: ["InkSpaceWritingAids"])
    ],
    targets: [
        .target(name: "InkSpaceTextHistory", path: "swift/Sources/InkSpaceTextHistory"),
        .target(name: "InkSpaceOutline", path: "swift/Sources/InkSpaceOutline"),
        .target(name: "InkSpaceSubtitles", path: "swift/Sources/InkSpaceSubtitles"),
        .target(name: "InkSpacePaths", path: "swift/Sources/InkSpacePaths"),
        .target(name: "InkSpaceGeometry", path: "swift/Sources/InkSpaceGeometry"),
        .target(name: "InkSpaceStudy", dependencies: ["InkSpacePaths"], path: "swift/Sources/InkSpaceStudy"),
        .target(name: "InkSpaceChecklist", path: "swift/Sources/InkSpaceChecklist", resources: [.process("Resources")]),
        .target(name: "InkSpacePDFRecords", path: "swift/Sources/InkSpacePDFRecords"),
        .target(name: "InkSpaceMediaTimeline", path: "swift/Sources/InkSpaceMediaTimeline"),
        .target(name: "InkSpaceAI", path: "swift/Sources/InkSpaceAI"),
        .target(name: "InkSpaceWebClips", path: "swift/Sources/InkSpaceWebClips"),
        .target(name: "InkSpaceSpeechText", path: "swift/Sources/InkSpaceSpeechText"),
        .target(name: "InkSpaceStorage", dependencies: ["InkSpacePaths"], path: "swift/Sources/InkSpaceStorage"),
        .target(name: "InkSpaceOCR", path: "swift/Sources/InkSpaceOCR"),
        .target(name: "InkSpaceExcelPictures", path: "swift/Sources/InkSpaceExcelPictures"),
        .target(name: "InkSpaceScanPDF", dependencies: ["InkSpaceStorage"], path: "swift/Sources/InkSpaceScanPDF"),
        .target(name: "InkSpacePreferences", path: "swift/Sources/InkSpacePreferences"),
        .target(name: "InkSpaceWritingAids", path: "swift/Sources/InkSpaceWritingAids"),
        .testTarget(name: "InkSpaceModuleTests", dependencies: ["InkSpaceTextHistory", "InkSpaceOutline", "InkSpaceSubtitles", "InkSpacePaths", "InkSpaceGeometry", "InkSpaceStudy", "InkSpaceChecklist", "InkSpacePDFRecords", "InkSpaceMediaTimeline", "InkSpaceAI", "InkSpaceWebClips", "InkSpaceSpeechText", "InkSpaceStorage", "InkSpaceOCR", "InkSpaceExcelPictures", "InkSpaceScanPDF"], path: "swift/Tests/InkSpaceModuleTests")
    ]
)

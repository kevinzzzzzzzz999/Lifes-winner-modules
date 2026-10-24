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
        .target(name: "InkSpaceTextHistory"),
        .target(name: "InkSpaceOutline"),
        .target(name: "InkSpaceSubtitles"),
        .target(name: "InkSpacePaths"),
        .target(name: "InkSpaceGeometry"),
        .target(name: "InkSpaceStudy", dependencies: ["InkSpacePaths"]),
        .target(name: "InkSpaceChecklist", resources: [.process("Resources")]),
        .target(name: "InkSpacePDFRecords"),
        .target(name: "InkSpaceMediaTimeline"),
        .target(name: "InkSpaceAI"),
        .target(name: "InkSpaceWebClips"),
        .target(name: "InkSpaceSpeechText"),
        .target(name: "InkSpaceStorage", dependencies: ["InkSpacePaths"]),
        .target(name: "InkSpaceOCR"),
        .target(name: "InkSpaceExcelPictures"),
        .target(name: "InkSpaceScanPDF", dependencies: ["InkSpaceStorage"]),
        .target(name: "InkSpacePreferences"),
        .target(name: "InkSpaceWritingAids"),
        .testTarget(name: "InkSpaceModuleTests", dependencies: ["InkSpaceTextHistory", "InkSpaceOutline", "InkSpaceSubtitles", "InkSpacePaths", "InkSpaceGeometry", "InkSpaceStudy", "InkSpaceChecklist", "InkSpacePDFRecords", "InkSpaceMediaTimeline", "InkSpaceAI", "InkSpaceWebClips", "InkSpaceSpeechText", "InkSpaceStorage", "InkSpaceOCR", "InkSpaceExcelPictures", "InkSpaceScanPDF"])
    ]
)

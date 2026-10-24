// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "WritingAidsExample",
    platforms: [.macOS(.v13)],
    products: [.executable(name: "WritingAidsDemo", targets: ["WritingAidsDemo"])],
    dependencies: [.package(name: "InkSpaceModules", path: "../..")],
    targets: [
        .executableTarget(name: "WritingAidsDemo", dependencies: [.product(name: "InkSpaceWritingAids", package: "InkSpaceModules")]),
        .testTarget(name: "WritingAidsTests", dependencies: [.product(name: "InkSpaceWritingAids", package: "InkSpaceModules")])
    ]
)

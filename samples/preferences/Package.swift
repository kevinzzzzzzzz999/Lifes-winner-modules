// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "InkSpacePreferencesExample",
    platforms: [.macOS(.v13)],
    products: [.executable(name: "InkSpacePreferencesDemo", targets: ["InkSpacePreferencesDemo"])],
    dependencies: [.package(name: "InkSpaceModules", path: "../..")],
    targets: [
        .executableTarget(name: "InkSpacePreferencesDemo", dependencies: [.product(name: "InkSpacePreferences", package: "InkSpaceModules")]),
        .testTarget(name: "InkSpacePreferencesTests", dependencies: [.product(name: "InkSpacePreferences", package: "InkSpaceModules")])
    ]
)

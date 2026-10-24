// Copyright (c) 2026 InkSpace contributors. MIT License.
// Adapted from Documents/VaultPathResolver.swift in the complete application.
import Foundation

/// Shared Foundation-only resolver so the exact production path guard can be tested on macOS.
public enum VaultPathResolver {
    public static func resolve(relativePath: String, within authorizedRoot: URL) -> URL? {
        guard authorizedRoot.isFileURL, !relativePath.isEmpty, !relativePath.hasPrefix("/"),
              !relativePath.contains("\\"), !relativePath.contains("\0") else { return nil }
        let components = relativePath.split(separator: "/", omittingEmptySubsequences: false)
        guard components.allSatisfy({ !$0.isEmpty && $0 != "." && $0 != ".." }) else { return nil }
        let root = authorizedRoot.standardizedFileURL.resolvingSymlinksInPath()
        let candidate = root.appendingPathComponent(relativePath).standardizedFileURL.resolvingSymlinksInPath()
        let rootComponents = root.pathComponents
        guard candidate.pathComponents.count > rootComponents.count,
              Array(candidate.pathComponents.prefix(rootComponents.count)) == rootComponents else { return nil }
        guard FileManager.default.fileExists(atPath: candidate.path) else { return nil }
        return candidate
    }
}

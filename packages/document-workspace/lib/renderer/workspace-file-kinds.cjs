Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/workspace-file-kinds.ts
function matchesWorkspaceFile(entry, kind) {
	if (entry.kind === "folder") return true;
	if (entry.kind === "unsupported" || entry.kind === "video") return false;
	const path = entry.path.toLowerCase();
	if (/\.(inkcheck|inkcalendar|inkcut)\.json$/.test(path)) return false;
	if (kind === "ocr") return /\.(pdf|png|jpe?g)$/.test(path);
	if (kind === "reviews") return true;
	if (kind === "originals") return entry.kind !== "board";
	if (kind === "md") return /\.(md|markdown)$/.test(path);
	return path.endsWith("." + kind);
}
//#endregion
exports.matchesWorkspaceFile = matchesWorkspaceFile;

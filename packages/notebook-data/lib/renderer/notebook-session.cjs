Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/notebook-session.ts
const finite = (value, max = 1e9) => typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(0, value)) : 0;
const index = (value, max = 1e6) => Math.floor(finite(value, max));
const offset = (value) => typeof value === "number" && Number.isFinite(value) ? Math.min(1e9, Math.max(-1e9, value)) : 0;
const cellID = (value) => typeof value === "string" && value.length > 0 && value.length <= 200 ? value : void 0;
const flags = (value) => value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).filter(([key, flag]) => key.length <= 200 && typeof flag === "boolean").slice(0, 2e3)) : {};
/** Copy and bound values so stale UI or a foreign object cannot retain documents. */
function normalizeNotebookSession(value, cellCount) {
	const source = value && typeof value === "object" ? value : {};
	const max = cellCount === void 0 ? 1e6 : Math.max(0, index(cellCount) - 1);
	const selection = source.editorSelection, viewport = source.viewportAnchor;
	return {
		schemaVersion: 1,
		selected: index(source.selected, max),
		anchor: index(source.anchor, max),
		...cellID(source.selectedCellID) ? { selectedCellID: source.selectedCellID } : {},
		...cellID(source.anchorCellID) ? { anchorCellID: source.anchorCellID } : {},
		editing: source.editing === true,
		raw: source.raw === true,
		scrollTop: finite(source.scrollTop),
		scrollLeft: finite(source.scrollLeft),
		...selection && typeof selection === "object" ? { editorSelection: {
			cellIndex: index(selection.cellIndex, max),
			...cellID(selection.cellID) ? { cellID: selection.cellID } : {},
			anchor: index(selection.anchor, 2097152),
			head: index(selection.head, 2097152),
			scrollTop: finite(selection.scrollTop),
			scrollLeft: finite(selection.scrollLeft)
		} } : {},
		...viewport && typeof viewport === "object" ? { viewportAnchor: {
			cellIndex: index(viewport.cellIndex, max),
			...cellID(viewport.cellID) ? { cellID: viewport.cellID } : {},
			offset: offset(viewport.offset)
		} } : {},
		...typeof source.outlineOpen === "boolean" ? { outlineOpen: source.outlineOpen } : {},
		...Array.isArray(source.outlineCollapsedIDs) ? { outlineCollapsedIDs: [...new Set(source.outlineCollapsedIDs.filter((value) => typeof value === "string" && value.length > 0 && value.length <= 400))].slice(0, 2e3) } : {},
		lineNumbers: flags(source.lineNumbers),
		hiddenOutputs: flags(source.hiddenOutputs),
		scrollOutputs: flags(source.scrollOutputs)
	};
}
function restoreNotebookSession(value, cellIDs) {
	const session = normalizeNotebookSession(value, cellIDs.length);
	const selected = session.selectedCellID ? cellIDs.indexOf(session.selectedCellID) : -1, anchor = session.anchorCellID ? cellIDs.indexOf(session.anchorCellID) : -1;
	if (selected >= 0) session.selected = selected;
	if (anchor >= 0) session.anchor = anchor;
	if (session.editorSelection?.cellID) {
		const found = cellIDs.indexOf(session.editorSelection.cellID);
		if (found >= 0) session.editorSelection.cellIndex = found;
		else delete session.editorSelection;
	}
	if (!cellIDs.length) delete session.viewportAnchor;
	else if (session.viewportAnchor?.cellID) {
		const found = cellIDs.indexOf(session.viewportAnchor.cellID);
		if (found >= 0) session.viewportAnchor.cellIndex = found;
		else {
			delete session.viewportAnchor.cellID;
			session.viewportAnchor.offset = 0;
		}
	}
	return session;
}
/** Compensate for content-visibility changing earlier cells' measured heights. */
function notebookViewportScroll(value) {
	const next = finite(value.scrollTop) + offset(value.cellTop) - offset(value.viewportTop) - offset(value.offset);
	return Math.max(0, Math.min(finite(value.maxScrollTop), next));
}
const notebookSessionKey = (vaultId, path) => JSON.stringify([vaultId, path]);
/** Hidden pages own no editor DOM. Only open notebook tabs keep small snapshots. */
function retainNotebookSessions(store, files) {
	const keys = new Set(files.map((file) => notebookSessionKey(file.vaultId, file.path)));
	for (const key of store.keys()) if (!keys.has(key)) store.delete(key);
}
function remapNotebookSessions(store, vaultId, moves, removed) {
	const ordered = moves.filter((move) => move.from && move.to && move.from !== move.to).slice().sort((a, b) => b.from.length - a.from.length), within = (value, parent) => value === parent || value.startsWith(parent + "/");
	const migrated = [];
	for (const [key, value] of store) {
		let identity;
		try {
			identity = JSON.parse(key);
		} catch {
			continue;
		}
		if (!Array.isArray(identity) || identity[0] !== vaultId || typeof identity[1] !== "string") continue;
		store.delete(key);
		const path = identity[1];
		if (removed.some((parent) => parent && within(path, parent))) continue;
		const move = ordered.find((move) => within(path, move.from));
		migrated.push([notebookSessionKey(vaultId, move ? move.to + path.slice(move.from.length) : path), value]);
	}
	for (const [key, value] of migrated) store.set(key, value);
}
//#endregion
exports.normalizeNotebookSession = normalizeNotebookSession;
exports.notebookSessionKey = notebookSessionKey;
exports.notebookViewportScroll = notebookViewportScroll;
exports.remapNotebookSessions = remapNotebookSessions;
exports.restoreNotebookSession = restoreNotebookSession;
exports.retainNotebookSessions = retainNotebookSessions;

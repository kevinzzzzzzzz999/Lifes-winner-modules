Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/board-merge-tabs.ts
/** Only the unchanged merged snapshot is eligible for transaction-wide undo. */
function boardMergeUndoState(tabs, vaultId, result) {
	const current = tabs.find((tab) => tab.vaultId === vaultId && tab.file.path === result.path);
	if (!current) return "closed";
	return current.dirty || current.file.sha256 !== result.sha256 || current.draft !== JSON.stringify(result.board) ? "changed" : "ready";
}
/** Accept disk success only while the destination editor is still the snapshot
* inspected before the operation. A late edit or closed tab is kept intact. */
function acceptBoardMergeResult(tabs, vaultId, expected, observed, result) {
	const current = tabs.find((tab) => tab.vaultId === vaultId && tab.file.path === expected.path);
	if (!current && observed || current && (current.dirty || current.file.sha256 !== expected.sha256 || current.draft !== (observed?.draft ?? JSON.stringify(expected.board)))) return {
		tabs,
		accepted: false
	};
	const next = {
		...current || {},
		vaultId,
		file: result,
		draft: JSON.stringify(result.board),
		dirty: false
	};
	return {
		tabs: [...tabs.filter((tab) => !(tab.vaultId === vaultId && tab.file.path === expected.path)), next],
		accepted: true
	};
}
//#endregion
exports.acceptBoardMergeResult = acceptBoardMergeResult;
exports.boardMergeUndoState = boardMergeUndoState;

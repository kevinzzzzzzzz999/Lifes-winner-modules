Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/PDFWorkspaceState.ts
const scopes = /* @__PURE__ */ new Map();
function setPDFWorkspaceBusy(id, vaultId, path, busy) {
	const changed = scopes.get(id)?.busy !== busy;
	scopes.set(id, {
		vaultId,
		path,
		busy
	});
	if (changed) window.dispatchEvent(new Event("inkspace-pdf-workspace-busy"));
}
function clearPDFWorkspaceScope(id) {
	const busy = scopes.get(id)?.busy;
	scopes.delete(id);
	if (busy) window.dispatchEvent(new Event("inkspace-pdf-workspace-busy"));
}
function pdfWorkspaceBusy(vaultId, path) {
	return [...scopes.values()].some((s) => s.busy && (!vaultId || s.vaultId === vaultId) && (!path || s.path === path));
}
//#endregion
exports.clearPDFWorkspaceScope = clearPDFWorkspaceScope;
exports.pdfWorkspaceBusy = pdfWorkspaceBusy;
exports.setPDFWorkspaceBusy = setPDFWorkspaceBusy;

Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/external-open-tabs.ts
/** Finder activates an existing tab even if a read raced a local edit. */
function retainExternalTab(tabs, loaded) {
	return tabs.some((tab) => tab.vaultId === loaded.vaultId && tab.file.path === loaded.file.path) ? tabs : [...tabs, loaded];
}
//#endregion
exports.retainExternalTab = retainExternalTab;

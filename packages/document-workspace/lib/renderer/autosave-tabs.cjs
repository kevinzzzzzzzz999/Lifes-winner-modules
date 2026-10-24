Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/autosave-tabs.ts
async function autosaveTabs(readTabs, save) {
	const pending = readTabs().filter((tab) => tab.dirty).map((tab) => ({
		vaultId: tab.vaultId,
		path: tab.file.path
	}));
	let failed = false, firstError;
	for (const key of pending) {
		const latest = readTabs().find((tab) => tab.vaultId === key.vaultId && tab.file.path === key.path);
		if (!latest?.dirty) continue;
		try {
			await save(latest);
		} catch (error) {
			if (!failed) {
				failed = true;
				firstError = error;
			}
		}
	}
	if (failed) throw firstError;
}
//#endregion
exports.autosaveTabs = autosaveTabs;

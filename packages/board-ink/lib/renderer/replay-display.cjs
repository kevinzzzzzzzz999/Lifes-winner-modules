Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/replay-display.ts
const replayDisplayModes = ["progressive", "dimmed"];
const futureInkOpacity = .18;
function replayDisplayMode(value) {
	return replayDisplayModes.includes(value) ? value : "dimmed";
}
function replayInkOpacity(mode, revealed) {
	return revealed ? 1 : mode === "dimmed" ? futureInkOpacity : 0;
}
//#endregion
exports.futureInkOpacity = futureInkOpacity;
exports.replayDisplayMode = replayDisplayMode;
exports.replayDisplayModes = replayDisplayModes;
exports.replayInkOpacity = replayInkOpacity;

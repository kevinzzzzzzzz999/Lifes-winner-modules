Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/office-preparation-deadline.ts
const OFFICE_PREPARATION_TIMEOUT_MS = 15e3;
/** Bounds preparation only. Capture/decode cannot always be interrupted by the
* platform, so every continuation must checkpoint before its next side effect. */
function beginOfficePreparation(prepare, timeoutMs = OFFICE_PREPARATION_TIMEOUT_MS) {
	let settled = false, rejectStop = () => {};
	const interrupted = new Promise((_resolve, reject) => {
		rejectStop = reject;
	});
	const stop = (code) => {
		if (settled) return;
		settled = true;
		rejectStop(Error(code));
	};
	const checkpoint = () => {
		if (settled) throw Error("CANCELLED");
	};
	const timer = setTimeout(() => stop("OFFICE_PREPARATION_TIMEOUT"), timeoutMs);
	return {
		promise: Promise.race([Promise.resolve().then(() => {
			checkpoint();
			return prepare(checkpoint);
		}), interrupted]).finally(() => {
			settled = true;
			clearTimeout(timer);
		}),
		cancel: () => stop("CANCELLED")
	};
}
//#endregion
exports.OFFICE_PREPARATION_TIMEOUT_MS = OFFICE_PREPARATION_TIMEOUT_MS;
exports.beginOfficePreparation = beginOfficePreparation;

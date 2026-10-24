Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/ocr-capture.ts
/** Shared on-demand OCR pixel budgets. These do not run while writing. */
const OCR_MAX_DIMENSION = 4096;
const OCR_MAX_PIXELS = 12e6;
const OCR_MAX_DATA_URL = 8388608;
function ocrCaptureScale(width, height, preferred = 3) {
	if (![
		width,
		height,
		preferred
	].every(Number.isFinite) || width <= 0 || height <= 0 || preferred <= 0) throw Error("INVALID_GEOMETRY");
	return Math.min(preferred, OCR_MAX_DIMENSION / width, OCR_MAX_DIMENSION / height, Math.sqrt(OCR_MAX_PIXELS / (width * height)));
}
function boundedOCRPNG(canvas) {
	for (let attempt = 0; attempt < 9; attempt++) {
		const value = canvas.toDataURL("image/png");
		if (value.length <= 8388608) return value;
		const smaller = document.createElement("canvas");
		smaller.width = Math.max(1, Math.floor(canvas.width * .8));
		smaller.height = Math.max(1, Math.floor(canvas.height * .8));
		try {
			smaller.getContext("2d").drawImage(canvas, 0, 0, smaller.width, smaller.height);
			canvas.width = smaller.width;
			canvas.height = smaller.height;
			canvas.getContext("2d").drawImage(smaller, 0, 0);
		} finally {
			smaller.width = 0;
			smaller.height = 0;
		}
	}
	throw Error("TOO_LARGE");
}
function selectDOMWordAt(root, point) {
	const doc = document;
	const caret = doc.caretPositionFromPoint?.(point.x, point.y);
	let range = caret ? document.createRange() : doc.caretRangeFromPoint?.(point.x, point.y);
	if (caret && range) {
		range.setStart(caret.offsetNode, caret.offset);
		range.collapse(true);
	}
	if (!range || !root.contains(range.startContainer)) return;
	const selection = window.getSelection();
	selection?.removeAllRanges();
	selection?.addRange(range);
	if (range.collapsed) {
		selection?.modify("move", "backward", "word");
		selection?.modify("extend", "forward", "word");
	}
}
//#endregion
exports.OCR_MAX_DATA_URL = OCR_MAX_DATA_URL;
exports.OCR_MAX_DIMENSION = OCR_MAX_DIMENSION;
exports.OCR_MAX_PIXELS = OCR_MAX_PIXELS;
exports.boundedOCRPNG = boundedOCRPNG;
exports.ocrCaptureScale = ocrCaptureScale;
exports.selectDOMWordAt = selectDOMWordAt;

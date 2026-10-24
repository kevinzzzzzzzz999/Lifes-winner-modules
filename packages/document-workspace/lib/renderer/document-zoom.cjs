Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/document-zoom.ts
const MIN_DOCUMENT_ZOOM = .25;
const MAX_DOCUMENT_ZOOM = 4;
function clampDocumentZoom(value) {
	return Number.isFinite(value) ? Math.max(MIN_DOCUMENT_ZOOM, Math.min(4, value)) : 1;
}
function documentWheelZoom(zoom, delta, mode, height) {
	if (!Number.isFinite(delta)) return clampDocumentZoom(zoom);
	const pixels = delta * (mode === 1 ? 16 : mode === 2 ? Math.max(1, height) : 1);
	return clampDocumentZoom(clampDocumentZoom(zoom) * Math.exp(-Math.max(-300, Math.min(300, pixels)) * .002));
}
function documentZoomShift(anchor, rect, zoom) {
	return {
		x: rect.left + anchor.x * zoom - anchor.clientX,
		y: rect.top + anchor.y * zoom - anchor.clientY
	};
}
//#endregion
exports.MAX_DOCUMENT_ZOOM = MAX_DOCUMENT_ZOOM;
exports.MIN_DOCUMENT_ZOOM = MIN_DOCUMENT_ZOOM;
exports.clampDocumentZoom = clampDocumentZoom;
exports.documentWheelZoom = documentWheelZoom;
exports.documentZoomShift = documentZoomShift;

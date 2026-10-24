Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/board-merge-placement.ts
const MERGE_WORLD_LIMIT = 8e6;
function validMergeBounds(rect) {
	return [
		rect.x,
		rect.y,
		rect.width,
		rect.height
	].every(Number.isFinite) && rect.width > 0 && rect.height > 0 && rect.width <= 8e6 && rect.height <= 8e6;
}
/** Placement is the union's upper-left corner; no source coordinates are changed here. */
function clampMergePosition(point, bounds) {
	if (!validMergeBounds(bounds) || ![point.x, point.y].every(Number.isFinite)) throw Error("Invalid merge placement");
	return {
		x: Math.max(0, Math.min(MERGE_WORLD_LIMIT - bounds.width, point.x)),
		y: Math.max(0, Math.min(MERGE_WORLD_LIMIT - bounds.height, point.y))
	};
}
function defaultMergePosition(source, target) {
	return clampMergePosition(target ? {
		x: Math.max(0, target.x),
		y: target.y + target.height + 120
	} : {
		x: 120,
		y: 120
	}, source);
}
function mergePlacementCamera(source, point, target) {
	const x = Math.min(point.x, target?.x ?? point.x), y = Math.min(point.y, target?.y ?? point.y), right = Math.max(point.x + source.width, target ? target.x + target.width : 0), bottom = Math.max(point.y + source.height, target ? target.y + target.height : 0);
	return {
		x: (x + right) / 2,
		y: (y + bottom) / 2,
		zoom: Math.max(1e-5, Math.min(1, 800 / Math.max(1, right - x), 460 / Math.max(1, bottom - y)))
	};
}
/** Previews stay bounded even when the actual source contains millions of points. */
function mergePreviewPlan(bounds, pointCount) {
	const scale = Math.min(1, 1400 / Math.max(bounds.width, bounds.height));
	return {
		width: Math.max(1, Math.ceil(bounds.width * scale)),
		height: Math.max(1, Math.ceil(bounds.height * scale)),
		scale,
		stride: Math.max(1, Math.ceil(pointCount / 18e4))
	};
}
//#endregion
exports.MERGE_WORLD_LIMIT = MERGE_WORLD_LIMIT;
exports.clampMergePosition = clampMergePosition;
exports.defaultMergePosition = defaultMergePosition;
exports.mergePlacementCamera = mergePlacementCamera;
exports.mergePreviewPlan = mergePreviewPlan;
exports.validMergeBounds = validMergeBounds;

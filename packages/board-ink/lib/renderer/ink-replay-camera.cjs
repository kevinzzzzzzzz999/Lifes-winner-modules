Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/ink-replay-camera.ts
const REPLAY_BACKGROUND_LIMITS = {
	pdf: 4,
	image: 4,
	text: 20,
	assets: 24,
	requests: 2,
	pixels: 8e6
};
const replayIntersects = (a, b) => a.x + a.width >= b.x && a.y + a.height >= b.y && a.x <= b.x + b.width && a.y <= b.y + b.height;
function replayItems(raw) {
	return Array.isArray(raw) ? raw.filter((i) => !!i && typeof i.id === "string" && [
		i.x,
		i.y,
		i.width,
		i.height
	].every(Number.isFinite) && i.width > 0 && i.height > 0) : [];
}
function replayStrokeBounds(entry) {
	let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
	for (const p of entry.stroke.points) {
		if (p.length < 3 || !p.slice(0, 3).every(Number.isFinite)) continue;
		const r = Math.max(0, p[2]) / 2;
		left = Math.min(left, p[0] - r);
		top = Math.min(top, p[1] - r);
		right = Math.max(right, p[0] + r);
		bottom = Math.max(bottom, p[1] + r);
	}
	return Number.isFinite(left) ? {
		x: left,
		y: top,
		width: Math.max(1, right - left),
		height: Math.max(1, bottom - top)
	} : {
		x: 0,
		y: 0,
		width: 1,
		height: 1
	};
}
/** Gap frames stay with the last completed pen, not a future page. */
function replayCursor(entries, elapsed) {
	if (!entries.length) return null;
	let lo = 0, hi = entries.length;
	while (lo < hi) {
		const mid = lo + hi >>> 1;
		if (entries[mid].end <= elapsed) lo = mid + 1;
		else hi = mid;
	}
	const completed = lo, index = Math.min(entries.length - 1, completed < entries.length && entries[completed].start > elapsed ? Math.max(0, completed - 1) : completed), entry = entries[index];
	const progress = Math.max(0, Math.min(1, (elapsed - entry.start) / (entry.end - entry.start))), position = (entry.stroke.points.length - 1) * progress, a = entry.stroke.points[Math.floor(position)], b = entry.stroke.points[Math.min(entry.stroke.points.length - 1, Math.floor(position) + 1)], t = position - Math.floor(position);
	return {
		index,
		completed,
		progress,
		point: {
			x: a[0] + (b[0] - a[0]) * t,
			y: a[1] + (b[1] - a[1]) * t
		}
	};
}
function replayPage(items, point) {
	return items.filter((i) => i.kind === "pdfPage" && point.x >= i.x && point.x <= i.x + i.width && point.y >= i.y && point.y <= i.y + i.height).sort((a, b) => a.width * a.height - b.width * b.height)[0];
}
function replayWorld(camera, size) {
	return {
		x: camera.x - size.width / 2 / camera.zoom,
		y: camera.y - size.height / 2 / camera.zoom,
		width: size.width / camera.zoom,
		height: size.height / camera.zoom
	};
}
function replayPosition(rect, camera, size) {
	return {
		x: (rect.x - camera.x) * camera.zoom + size.width / 2,
		y: (rect.y - camera.y) * camera.zoom + size.height / 2,
		width: rect.width * camera.zoom,
		height: rect.height * camera.zoom
	};
}
function locateReplay(point, page, size) {
	const zoom = page ? Math.max(.7, Math.min(1.5, (size.width - 64) / page.width, (size.height - 64) / page.height)) : 1.5;
	const axis = (p, start, length, visible) => length <= visible ? start + length / 2 : Math.max(start + visible / 2, Math.min(start + length - visible / 2, p));
	return {
		x: page ? axis(point.x, page.x, page.width, Math.max(1, size.width - 48) / zoom) : point.x,
		y: page ? axis(point.y, page.y, page.height, Math.max(1, size.height - 48) / zoom) : point.y,
		zoom
	};
}
function followReplay(camera, point, page, previousPageID, size) {
	const margin = Math.min(72, size.width / 5, size.height / 5) / camera.zoom, world = replayWorld(camera, size);
	if (page?.id === previousPageID && point.x >= world.x + margin && point.x <= world.x + world.width - margin && point.y >= world.y + margin && point.y <= world.y + world.height - margin) return camera;
	return locateReplay(point, page, size);
}
function overviewReplay(rects, size) {
	if (!rects.length) return {
		x: 0,
		y: 0,
		zoom: 1
	};
	let x = Infinity, y = Infinity, r = -Infinity, b = -Infinity;
	for (const rect of rects) {
		x = Math.min(x, rect.x);
		y = Math.min(y, rect.y);
		r = Math.max(r, rect.x + rect.width);
		b = Math.max(b, rect.y + rect.height);
	}
	return {
		x: (x + r) / 2,
		y: (y + b) / 2,
		zoom: Math.max(1e-6, Math.min(1.5, Math.max(1, size.width - 64) / Math.max(1, r - x), Math.max(1, size.height - 64) / Math.max(1, b - y)))
	};
}
function zoomReplay(camera, size, point, factor) {
	const zoom = Math.max(1e-6, Math.min(8, camera.zoom * factor)), x = camera.x + (point.x - size.width / 2) / camera.zoom, y = camera.y + (point.y - size.height / 2) / camera.zoom;
	return {
		x: x - (point.x - size.width / 2) / zoom,
		y: y - (point.y - size.height / 2) / zoom,
		zoom
	};
}
function replayBackgroundPlan(items, camera, size) {
	const world = replayWorld(camera, size), visible = items.filter((i) => replayIntersects(i, world)), distance = (i) => Math.hypot(i.x + i.width / 2 - camera.x, i.y + i.height / 2 - camera.y), ordered = [...visible].sort((a, b) => distance(a) - distance(b));
	const pdf = ordered.filter((i) => i.kind === "pdfPage").slice(0, REPLAY_BACKGROUND_LIMITS.pdf), images = ordered.filter((i) => i.kind === "document" && /\.(png|jpe?g)$/i.test(i.sourcePath || "")).slice(0, REPLAY_BACKGROUND_LIMITS.image), others = ordered.filter((i) => i.kind !== "pdfPage" && !(i.kind === "document" && /\.(png|jpe?g)$/i.test(i.sourcePath || "")) && i.kind !== "inkGroup").slice(0, REPLAY_BACKGROUND_LIMITS.text);
	return {
		visible,
		details: [
			...pdf,
			...images,
			...others
		],
		pdf
	};
}
//#endregion
exports.REPLAY_BACKGROUND_LIMITS = REPLAY_BACKGROUND_LIMITS;
exports.followReplay = followReplay;
exports.locateReplay = locateReplay;
exports.overviewReplay = overviewReplay;
exports.replayBackgroundPlan = replayBackgroundPlan;
exports.replayCursor = replayCursor;
exports.replayIntersects = replayIntersects;
exports.replayItems = replayItems;
exports.replayPage = replayPage;
exports.replayPosition = replayPosition;
exports.replayStrokeBounds = replayStrokeBounds;
exports.replayWorld = replayWorld;
exports.zoomReplay = zoomReplay;

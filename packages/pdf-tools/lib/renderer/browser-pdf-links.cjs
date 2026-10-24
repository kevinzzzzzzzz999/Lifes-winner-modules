Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/browser-pdf-links.ts
function pdfWebLinkRegions(annotations, viewport) {
	if (!Number.isFinite(viewport.width) || !Number.isFinite(viewport.height) || viewport.width <= 0 || viewport.height <= 0) return [];
	const links = [];
	for (const raw of annotations.slice(0, 2e3)) {
		if (!raw || typeof raw !== "object") continue;
		const item = raw;
		if (item.subtype !== "Link" || typeof item.url !== "string" || item.url.length > 2048 || /[\x00-\x20\x7f]/.test(item.url) || !Array.isArray(item.rect) || item.rect.length !== 4 || !item.rect.every(Number.isFinite)) continue;
		let url;
		try {
			url = new URL(item.url);
		} catch {
			continue;
		}
		if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) continue;
		const source = item.rect, rect = [...viewport.convertToViewportPoint(source[0], source[1]), ...viewport.convertToViewportPoint(source[2], source[3])];
		if (rect.length !== 4 || !rect.every(Number.isFinite)) continue;
		const x1 = Math.max(0, Math.min(rect[0], rect[2])), y1 = Math.max(0, Math.min(rect[1], rect[3])), x2 = Math.min(viewport.width, Math.max(rect[0], rect[2])), y2 = Math.min(viewport.height, Math.max(rect[1], rect[3]));
		if (x2 <= x1 || y2 <= y1) continue;
		links.push({
			url: url.href,
			left: x1 / viewport.width * 100,
			top: y1 / viewport.height * 100,
			width: (x2 - x1) / viewport.width * 100,
			height: (y2 - y1) / viewport.height * 100
		});
		if (links.length >= 512) break;
	}
	return links;
}
//#endregion
exports.pdfWebLinkRegions = pdfWebLinkRegions;

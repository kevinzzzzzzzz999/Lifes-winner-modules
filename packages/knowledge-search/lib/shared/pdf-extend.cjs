Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/shared/pdf-extend.ts
function extendHeight(block, width) {
	return block.mode === "inline" ? block.height * width : block.mode === "collapsed" ? 32 : 40;
}
function orderedBlocks(blocks, page) {
	return blocks.filter((b) => b.page === page).sort((a, b) => a.anchorY - b.anchorY || (a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
function originalToExtended(y, ratio, blocks, width) {
	return y * ratio * width + blocks.filter((b) => b.anchorY <= y).reduce((v, b) => v + extendHeight(b, width), 0);
}
function extendedToOriginal(y, ratio, blocks, width) {
	let added = 0;
	for (const b of blocks) {
		const start = b.anchorY * ratio * width + added, h = extendHeight(b, width);
		if (y >= start && y < start + h) return {
			blockID: b.id,
			y: (y - start) / width
		};
		if (y < start) break;
		added += h;
	}
	return { y: Math.max(0, Math.min(1, (y - added) / (ratio * width))) };
}
//#endregion
exports.extendHeight = extendHeight;
exports.extendedToOriginal = extendedToOriginal;
exports.orderedBlocks = orderedBlocks;
exports.originalToExtended = originalToExtended;

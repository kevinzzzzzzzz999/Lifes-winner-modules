Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/board-pdf-progressive.ts
const pixels = (frame) => frame.region.pixelWidth * frame.region.pixelHeight;
function createPDFDetailState(region) {
	return {
		active: {
			id: 1,
			region
		},
		latest: region,
		nextID: 2
	};
}
function requestPDFDetail(state, region) {
	const budget = region.pixelBudget ?? Infinity;
	const front = state.front && pixels(state.front) <= budget ? state.front : void 0;
	const active = state.active && pixels(state.active) <= budget ? state.active : void 0;
	if (active) return state.latest.key === region.key && front === state.front && active === state.active ? state : {
		...state,
		front,
		active,
		latest: region
	};
	if (front && pdfDetailCoversRequest(front.region, region) && pdfDetailFrameScore(front.region, region).density + 1e-6 >= Math.min(region.pixelWidth / region.width, region.pixelHeight / region.height) || state.failedKey === region.key) return {
		...state,
		front,
		active: void 0,
		latest: region
	};
	return {
		...state,
		front,
		active: {
			id: state.nextID,
			region
		},
		latest: region,
		nextID: state.nextID + 1,
		failedKey: void 0
	};
}
function finishPDFDetail(state, id, succeeded) {
	if (state.active?.id !== id) return state;
	const front = succeeded ? choosePDFDetailFront(state.front, state.active, state.latest) : state.front;
	const failedKey = succeeded ? void 0 : state.active.region.key;
	return requestPDFDetail({
		...state,
		front,
		active: void 0,
		failedKey
	}, state.latest);
}
/** Map an old crop with its original page dimensions into the current page. */
function pdfDetailFrameScale(frame, current) {
	return {
		x: current.pageWidth / frame.pageWidth,
		y: current.pageHeight / frame.pageHeight
	};
}
function pdfDetailFrameScore(frame, current) {
	const scale = pdfDetailFrameScale(frame, current), x = frame.x * scale.x, y = frame.y * scale.y, width = frame.width * scale.x, height = frame.height * scale.y;
	return {
		coverage: Math.max(0, Math.min(x + width, current.x + current.width) - Math.max(x, current.x)) * Math.max(0, Math.min(y + height, current.y + current.height) - Math.max(y, current.y)) / (current.width * current.height),
		density: Math.min(frame.pixelWidth / width, frame.pixelHeight / height)
	};
}
function choosePDFDetailFront(front, candidate, current) {
	const next = pdfDetailFrameScore(candidate.region, current);
	if (!front) return next.coverage > 0 ? candidate : void 0;
	const previous = pdfDetailFrameScore(front.region, current), epsilon = 1e-6;
	if (next.coverage > previous.coverage + epsilon) return candidate;
	if (previous.coverage > next.coverage + epsilon || next.coverage === 0) return front;
	if (next.density > previous.density + epsilon) return candidate;
	if (previous.density > next.density + epsilon) return front;
	return candidate.region.key === current.key && front.region.key !== current.key ? candidate : front;
}
function pdfDetailCoversRequest(frame, current) {
	if (!frame) return false;
	const scale = pdfDetailFrameScale(frame, current), epsilon = .01;
	return frame.x * scale.x <= current.x + epsilon && frame.y * scale.y <= current.y + epsilon && (frame.x + frame.width) * scale.x + epsilon >= current.x + current.width && (frame.y + frame.height) * scale.y + epsilon >= current.y + current.height;
}
//#endregion
exports.createPDFDetailState = createPDFDetailState;
exports.finishPDFDetail = finishPDFDetail;
exports.pdfDetailCoversRequest = pdfDetailCoversRequest;
exports.pdfDetailFrameScale = pdfDetailFrameScale;
exports.pdfDetailFrameScore = pdfDetailFrameScore;
exports.requestPDFDetail = requestPDFDetail;

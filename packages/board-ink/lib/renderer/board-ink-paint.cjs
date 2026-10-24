Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let open_source_inkspace_desktop_src_renderer_board_ink_clip = require("./board-ink-clip.cjs");
//#region open-source/inkspace/desktop/src/renderer/board-ink-paint.ts
/** Paint one preview stroke without letting its mask affect later strokes. */
function paintBoardInkStroke(context, stroke, stride = 1) {
	const step = Math.max(1, Math.ceil(stride));
	if (!Number.isFinite(step) || stroke.opacity === 0 || stroke.clipPath?.length === 0) return;
	const masked = stroke.clipPath !== void 0;
	if (masked) context.save();
	try {
		if (stroke.clipPath !== void 0) (0, open_source_inkspace_desktop_src_renderer_board_ink_clip.applyBoardInkClip)(context, stroke.clipPath);
		context.strokeStyle = /^#[0-9a-f]{6}$/i.test(stroke.color) ? stroke.color : "#243b38";
		context.fillStyle = context.strokeStyle;
		context.globalAlpha = stroke.opacity;
		context.lineCap = "round";
		context.lineJoin = "round";
		for (let index = 0; index < stroke.points.length; index += step) {
			const a = stroke.points[index], b = stroke.points[Math.min(index + step, stroke.points.length - 1)];
			context.lineWidth = (a[2] + b[2]) / 2;
			context.beginPath();
			context.moveTo(a[0], a[1]);
			context.lineTo(b[0], b[1]);
			context.stroke();
			if (index === stroke.points.length - 1 || stroke.points.length === 1) {
				context.beginPath();
				context.arc(a[0], a[1], a[2] / 2, 0, Math.PI * 2);
				context.fill();
			}
		}
	} finally {
		if (masked) context.restore();
	}
}
//#endregion
exports.paintBoardInkStroke = paintBoardInkStroke;

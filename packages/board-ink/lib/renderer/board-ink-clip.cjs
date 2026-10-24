Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/board-ink-clip.ts
const MAX_COMMANDS = 1e4;
const MAX_COORDINATE = 8e6;
const COMMAND_LENGTHS = [
	3,
	3,
	5,
	7,
	1
];
function fail() {
	throw Error("笔迹裁剪数据无效。 / Invalid ink clip geometry.");
}
function coordinate(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > MAX_COORDINATE) fail();
	return value;
}
function commands(value) {
	if (!Array.isArray(value) || value.length > MAX_COMMANDS) fail();
	const path = [];
	for (let index = 0; index < value.length; index++) {
		const raw = value[index];
		if (!Array.isArray(raw)) fail();
		const operation = raw[0];
		if (typeof operation !== "number" || !Number.isInteger(operation) || operation < 0 || operation > 4 || raw.length !== COMMAND_LENGTHS[operation]) fail();
		if (index === 0 && operation !== 0) fail();
		const copy = [operation];
		for (let index = 1; index < raw.length; index++) copy.push(coordinate(raw[index]));
		path.push(copy);
	}
	return path;
}
function number(value) {
	return String(Object.is(value, -0) ? 0 : value);
}
/** An empty command list is an empty mask, which hides the entire stroke. */
function boardInkClipPath(value, offset = {
	x: 0,
	y: 0
}) {
	const path = commands(value);
	if (!Number.isFinite(offset.x) || !Number.isFinite(offset.y)) fail();
	const x = offset.x, y = offset.y;
	return path.map((command) => {
		const point = (index) => `${number(command[index] - x)} ${number(command[index + 1] - y)}`;
		switch (command[0]) {
			case 0: return `M${point(1)}`;
			case 1: return `L${point(1)}`;
			case 2: return `Q${point(1)} ${point(3)}`;
			case 3: return `C${point(1)} ${point(3)} ${point(5)}`;
			case 4: return "Z";
		}
	}).join("");
}
/** Caller owns save/restore and any existing transform. Validation is atomic. */
function applyBoardInkClip(ctx, value) {
	const path = commands(value);
	ctx.beginPath();
	for (const command of path) switch (command[0]) {
		case 0:
			ctx.moveTo(command[1], command[2]);
			break;
		case 1:
			ctx.lineTo(command[1], command[2]);
			break;
		case 2:
			ctx.quadraticCurveTo(command[1], command[2], command[3], command[4]);
			break;
		case 3:
			ctx.bezierCurveTo(command[1], command[2], command[3], command[4], command[5], command[6]);
			break;
		case 4: ctx.closePath();
	}
	ctx.clip("nonzero");
}
/** Control-point bounds conservatively enclose every curve in the mask. */
function boardInkClipBounds(value) {
	const path = commands(value);
	let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
	let x = 0, y = 0, startX = 0, startY = 0, hasSegment = false;
	const include = (x, y) => {
		left = Math.min(left, x);
		top = Math.min(top, y);
		right = Math.max(right, x);
		bottom = Math.max(bottom, y);
	};
	for (const command of path) switch (command[0]) {
		case 0:
			x = startX = command[1];
			y = startY = command[2];
			hasSegment = false;
			break;
		case 1:
		case 2:
		case 3:
			include(x, y);
			for (let index = 1; index < command.length; index += 2) include(command[index], command[index + 1]);
			x = command[command.length - 2];
			y = command[command.length - 1];
			hasSegment = true;
			break;
		case 4:
			if (hasSegment) {
				include(x, y);
				include(startX, startY);
			}
			x = startX;
			y = startY;
	}
	return Number.isFinite(left) ? {
		x: left,
		y: top,
		width: right - left,
		height: bottom - top
	} : null;
}
/** Bounds match the rendered pressure disks, intersected with an optional mask. */
function boardInkStrokeBounds(stroke) {
	if (!stroke || !Array.isArray(stroke.points)) fail();
	if (stroke.opacity !== void 0 && (typeof stroke.opacity !== "number" || !Number.isFinite(stroke.opacity) || stroke.opacity < 0 || stroke.opacity > 1)) fail();
	const clip = stroke.clipPath === void 0 ? void 0 : boardInkClipBounds(stroke.clipPath);
	let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
	for (const point of stroke.points) {
		if (!Array.isArray(point) || point.length !== 3) fail();
		const x = coordinate(point[0]), y = coordinate(point[1]), width = point[2];
		if (typeof width !== "number" || !Number.isFinite(width) || width <= 0 || width > 1e4) fail();
		const radius = width / 2;
		left = Math.min(left, x - radius);
		top = Math.min(top, y - radius);
		right = Math.max(right, x + radius);
		bottom = Math.max(bottom, y + radius);
	}
	if (stroke.points.length === 0 || stroke.opacity === 0 || clip === null) return null;
	if (clip !== void 0) {
		left = Math.max(left, clip.x);
		top = Math.max(top, clip.y);
		right = Math.min(right, clip.x + clip.width);
		bottom = Math.min(bottom, clip.y + clip.height);
		if (left >= right || top >= bottom) return null;
	}
	return {
		x: left,
		y: top,
		width: right - left,
		height: bottom - top
	};
}
//#endregion
exports.applyBoardInkClip = applyBoardInkClip;
exports.boardInkClipBounds = boardInkClipBounds;
exports.boardInkClipPath = boardInkClipPath;
exports.boardInkStrokeBounds = boardInkStrokeBounds;

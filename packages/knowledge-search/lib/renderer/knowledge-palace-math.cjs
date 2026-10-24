Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/knowledge-palace-math.ts
const initialCamera = {
	yaw: -32,
	pitch: 42,
	zoom: 1
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/** Decimal MB: geometry is logarithmic, the displayed number stays the actual bytes. */
function buildingHeight(bytes) {
	return 22 + Math.min(132, Math.log10(1 + Math.max(0, bytes) / 1e6) * 48);
}
function buildingWidth(categories) {
	return 54 + Math.min(54, Math.log2(1 + Math.max(0, categories)) * 12);
}
function formatBytes(bytes) {
	return (Math.max(0, bytes) / 1e6).toLocaleString(void 0, { maximumFractionDigits: bytes < 1e3 ? 6 : bytes < 1e6 ? 3 : 2 }) + " MB";
}
function cuboid(x, y, z, w, h, d) {
	return [
		{
			x,
			y,
			z
		},
		{
			x: x + w,
			y,
			z
		},
		{
			x: x + w,
			y,
			z: z + d
		},
		{
			x,
			y,
			z: z + d
		},
		{
			x,
			y: y + h,
			z
		},
		{
			x: x + w,
			y: y + h,
			z
		},
		{
			x: x + w,
			y: y + h,
			z: z + d
		},
		{
			x,
			y: y + h,
			z: z + d
		}
	];
}
const cubeFaces = [
	[
		0,
		1,
		5,
		4
	],
	[
		1,
		2,
		6,
		5
	],
	[
		2,
		3,
		7,
		6
	],
	[
		3,
		0,
		4,
		7
	],
	[
		4,
		5,
		6,
		7
	]
];
function palaceProjector(width, height, floors, camera) {
	const yaw = camera.yaw * Math.PI / 180, pitch = camera.pitch * Math.PI / 180, centerY = (floors - 1) * 250 / 2 + 45, distance = 1500 + (floors - 1) * 260;
	const raw = (p) => {
		const x = p.x * Math.cos(yaw) - p.z * Math.sin(yaw), z = p.x * Math.sin(yaw) + p.z * Math.cos(yaw), y = p.y - centerY, depth = z * Math.cos(pitch) + y * Math.sin(pitch), scale = distance / Math.max(300, distance - depth);
		return {
			x: x * scale,
			y: (-y * Math.cos(pitch) + z * Math.sin(pitch)) * scale,
			depth
		};
	};
	const corners = cuboid(-350, -18, -320, 700, (floors - 1) * 250 + 190, 640).map(raw), xs = corners.map((p) => p.x), ys = corners.map((p) => p.y), minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
	const available = Math.max(200, width - (width >= 620 ? 200 : 0)), fit = Math.min((available - 32) / (maxX - minX), Math.max(160, height - 46) / (maxY - minY)) * clamp(camera.zoom, .45, 2.8), cx = available / 2, cy = height / 2;
	return (p) => {
		const v = raw(p);
		return {
			x: cx + (v.x - (minX + maxX) / 2) * fit,
			y: cy + (v.y - (minY + maxY) / 2) * fit,
			depth: v.depth
		};
	};
}
//#endregion
exports.buildingHeight = buildingHeight;
exports.buildingWidth = buildingWidth;
exports.clamp = clamp;
exports.cubeFaces = cubeFaces;
exports.cuboid = cuboid;
exports.formatBytes = formatBytes;
exports.initialCamera = initialCamera;
exports.palaceProjector = palaceProjector;

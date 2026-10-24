Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/knowledge-walk-math.ts
const WALK_LIMITS = Object.freeze({
	buildings: 24,
	columns: 4,
	grid: 380,
	radius: 11,
	speed: 150,
	maxSpeed: 360,
	maxFrameSeconds: .1,
	maxInteractionDistance: 110
});
const EPSILON = 1e-7;
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const bounded = (value, min, max) => Math.max(min, Math.min(max, finite(value, min)));
const amount = (value) => Math.max(0, finite(value));
const distanceSquared = (a, b) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2;
const radiusFor = (world) => bounded(world.radius, 6, 24);
function walkYaw(yaw) {
	return ((finite(yaw) + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
}
/** Stable local variation only: no document content, network or random state. */
function walkPathSeed(path) {
	let hash = 2166136261;
	for (let i = 0; i < path.length; i++) {
		hash ^= path.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}
function walkBuildingHeight(bytes, files, known = true) {
	if (!known) return 35;
	return 35 + Math.min(445, Math.log10(1 + amount(bytes) / 1e6) * 100 + Math.log2(1 + amount(files)) * 16);
}
function walkBuildingWidth(subfolders) {
	return 170 + Math.min(90, Math.log2(1 + amount(subfolders)) * 20);
}
/** Input order is the existing folder order; this function never reorders files.
* x/z are the minimum ground-corner, y=0. Every door faces south (+z).
* At maximum footprints the grid leaves 120 units between building walls.
*/
function buildWalkWorld(entries, stats) {
	const selected = [], seen = /* @__PURE__ */ new Set();
	for (let i = 0; i < Math.min(entries.length, 2400) && selected.length < WALK_LIMITS.buildings; i++) {
		const entry = entries[i];
		if (!entry || typeof entry.path !== "string" || !entry.path || seen.has(entry.path)) continue;
		seen.add(entry.path);
		selected.push(entry);
	}
	const columns = Math.min(WALK_LIMITS.columns, Math.max(1, selected.length)), rows = Math.max(1, Math.ceil(selected.length / columns));
	const buildings = selected.map((entry, index) => {
		const stat = stats[entry.path], folder = entry.kind === "folder", seed = walkPathSeed(entry.path);
		const known = folder ? stat?.known === true && [
			stat.bytes,
			stat.files,
			stat.directories
		].every((value) => Number.isFinite(value) && value >= 0) : Number.isFinite(entry.bytes) && entry.bytes >= 0;
		const bytes = known ? amount(folder ? stat.bytes : entry.bytes) : null, files = known ? folder ? amount(stat.files) : 1 : null;
		const width = walkBuildingWidth(folder && known ? stat.directories : 0), depth = 170 + seed % 10 * 10;
		const x = (index % columns - (columns - 1) / 2) * WALK_LIMITS.grid - width / 2;
		const z = (Math.floor(index / columns) - (rows - 1) / 2) * WALK_LIMITS.grid - depth / 2;
		const hue = seed % 360;
		return {
			entry,
			x,
			z,
			width,
			depth,
			height: walkBuildingHeight(bytes ?? 0, files ?? 0, known),
			door: {
				x: x + width / 2,
				z: z + depth
			},
			seed,
			style: {
				variant: (seed >>> 9) % 5,
				hue,
				accentHue: (hue + 35 + (seed >>> 18) % 70) % 360
			},
			known,
			lowerBound: folder && known && (stat.complete !== true || stat.scanning === true),
			bytes,
			files
		};
	});
	const halfWidth = columns * WALK_LIMITS.grid / 2 + 80, halfDepth = rows * WALK_LIMITS.grid / 2 + 80;
	const bounds = {
		minX: -halfWidth,
		maxX: halfWidth,
		minZ: -halfDepth,
		maxZ: halfDepth
	};
	return {
		buildings,
		bounds,
		spawn: {
			x: 0,
			z: bounds.maxZ - 45,
			yaw: 0
		},
		radius: WALK_LIMITS.radius
	};
}
function clearWalkInput() {
	return {
		forward: 0,
		strafe: 0
	};
}
/** KeyboardEvent.code values. Caller clears held keys on blur/panel/modal changes. */
function walkInputFromKeys(keys) {
	return {
		forward: Number(keys.has("KeyW") || keys.has("ArrowUp")) - Number(keys.has("KeyS") || keys.has("ArrowDown")),
		strafe: Number(keys.has("KeyD") || keys.has("ArrowRight")) - Number(keys.has("KeyA") || keys.has("ArrowLeft"))
	};
}
function insideGround(world, p, radius) {
	const b = world.bounds;
	return p.x >= b.minX + radius - EPSILON && p.x <= b.maxX - radius + EPSILON && p.z >= b.minZ + radius - EPSILON && p.z <= b.maxZ - radius + EPSILON;
}
function isWalkPositionFree(world, p) {
	const radius = radiusFor(world);
	if (!Number.isFinite(p.x) || !Number.isFinite(p.z) || !insideGround(world, p, radius)) return false;
	for (const b of world.buildings) {
		const x = Math.max(b.x, Math.min(b.x + b.width, p.x)), z = Math.max(b.z, Math.min(b.z + b.depth, p.z));
		if ((p.x - x) ** 2 + (p.z - z) ** 2 < radius * radius - EPSILON) return false;
	}
	return true;
}
/** A metadata refresh may increase a footprint under a stationary avatar.
* Restore to the nearest clear edge; generated worlds always have clear roads.
*/
function settleWalkPlayer(world, player) {
	const r = radiusFor(world), b = world.bounds, yaw = walkYaw(player.yaw);
	const p = {
		x: bounded(finite(player.x, world.spawn.x), b.minX + r, b.maxX - r),
		z: bounded(finite(player.z, world.spawn.z), b.minZ + r, b.maxZ - r),
		yaw
	};
	if (isWalkPositionFree(world, p)) return p;
	const candidates = [world.spawn];
	for (const building of world.buildings) candidates.push({
		x: building.x - r,
		z: p.z
	}, {
		x: building.x + building.width + r,
		z: p.z
	}, {
		x: p.x,
		z: building.z - r
	}, {
		x: p.x,
		z: building.z + building.depth + r
	});
	return {
		...candidates.filter((value) => isWalkPositionFree(world, value)).sort((a, c) => distanceSquared(a, p) - distanceSquared(c, p))[0] ?? world.spawn,
		yaw
	};
}
/** Exact axis sweep against circle-expanded boxes. The rounded-corner padding
* depends on the other coordinate, so even a thin wall cannot be skipped.
*/
function slideAxis(world, p, delta, axis) {
	if (!delta) return p;
	const r = radiusFor(world), other = axis === "x" ? "z" : "x", bounds = world.bounds;
	const low = axis === "x" ? bounds.minX : bounds.minZ, high = axis === "x" ? bounds.maxX : bounds.maxZ;
	let destination = bounded(p[axis] + delta, low + r, high - r);
	for (const building of world.buildings) {
		const near = building[other], far = near + (other === "x" ? building.width : building.depth);
		const perpendicular = Math.max(near - p[other], 0, p[other] - far);
		if (perpendicular >= r) continue;
		const pad = Math.sqrt(Math.max(0, r * r - perpendicular * perpendicular));
		const start = building[axis] - pad, end = building[axis] + (axis === "x" ? building.width : building.depth) + pad;
		if (delta > 0 && p[axis] <= start + EPSILON && destination > start) destination = Math.min(destination, start);
		if (delta < 0 && p[axis] >= end - EPSILON && destination < end) destination = Math.max(destination, end);
	}
	return {
		...p,
		[axis]: destination
	};
}
/** dt is seconds, capped to 100 ms: resuming a hidden window never teleports.
* No input state is retained. Camera/actor yaw can be supplied independently.
*/
function stepWalk(world, player, input, dtSeconds, options = {}) {
	const origin = settleWalkPlayer(world, player), yaw = walkYaw(options.yaw ?? origin.yaw);
	const dt = bounded(dtSeconds, 0, WALK_LIMITS.maxFrameSeconds), speed = bounded(options.speed ?? WALK_LIMITS.speed, 0, WALK_LIMITS.maxSpeed);
	const forward = bounded(finite(input.forward), -1, 1), strafe = bounded(finite(input.strafe), -1, 1), length = Math.max(1, Math.hypot(forward, strafe));
	const distance = speed * dt, dx = (Math.sin(yaw) * forward + Math.cos(yaw) * strafe) / length * distance, dz = (-Math.cos(yaw) * forward + Math.sin(yaw) * strafe) / length * distance;
	const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (radiusFor(world) / 2)));
	let result = origin;
	for (let step = 0; step < steps; step++) {
		result = slideAxis(world, result, dx / steps, "x");
		result = slideAxis(world, result, dz / steps, "z");
	}
	return {
		x: result.x,
		z: result.z,
		yaw
	};
}
function intersectsSegment(a, c, b) {
	let low = 0, high = 1;
	for (const axis of ["x", "z"]) {
		const delta = c[axis] - a[axis], min = b[axis], max = min + (axis === "x" ? b.width : b.depth);
		if (Math.abs(delta) < EPSILON) {
			if (a[axis] <= min || a[axis] >= max) return false;
			continue;
		}
		const t1 = (min - a[axis]) / delta, t2 = (max - a[axis]) / delta;
		low = Math.max(low, Math.min(t1, t2));
		high = Math.min(high, Math.max(t1, t2));
		if (low >= high - EPSILON) return false;
	}
	return high > EPSILON && low < .9999999;
}
/** Only a nearby, visible south-facing door/file entrance is actionable. */
function nearbyWalkTarget(world, player, maxDistance = 55) {
	if (!isWalkPositionFree(world, player)) return null;
	const limit = bounded(maxDistance, 0, WALK_LIMITS.maxInteractionDistance), yaw = walkYaw(player.yaw), radius = radiusFor(world);
	let result = null, best = Infinity;
	for (const building of world.buildings) {
		if (player.z < building.door.z + radius - EPSILON) continue;
		const dx = building.door.x - player.x, dz = building.door.z - player.z, distance = Math.hypot(dx, dz);
		if (distance > limit || distance <= EPSILON || (Math.sin(yaw) * dx - Math.cos(yaw) * dz) / distance < .35) continue;
		if (world.buildings.some((other) => other !== building && intersectsSegment(player, building.door, other))) continue;
		if (distance < best - EPSILON || Math.abs(distance - best) <= EPSILON && building.entry.path < (result?.entry.path ?? "")) {
			result = building;
			best = distance;
		}
	}
	return result;
}
//#endregion
exports.WALK_LIMITS = WALK_LIMITS;
exports.buildWalkWorld = buildWalkWorld;
exports.clearWalkInput = clearWalkInput;
exports.isWalkPositionFree = isWalkPositionFree;
exports.nearbyWalkTarget = nearbyWalkTarget;
exports.settleWalkPlayer = settleWalkPlayer;
exports.stepWalk = stepWalk;
exports.walkBuildingHeight = walkBuildingHeight;
exports.walkBuildingWidth = walkBuildingWidth;
exports.walkInputFromKeys = walkInputFromKeys;
exports.walkPathSeed = walkPathSeed;
exports.walkYaw = walkYaw;

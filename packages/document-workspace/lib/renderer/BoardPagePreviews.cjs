Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/BoardPagePreviews.ts
const PREVIEW_LIMITS = {
	concurrency: 2,
	bytes: 33554432,
	entries: 4096
};
function previewEdge(width, height, zoom) {
	const short = Math.min(width, height) * zoom, long = Math.max(width, height) * zoom;
	if (!Number.isFinite(short) || !Number.isFinite(long) || short < 2 || long < 3) return null;
	return long <= 24 ? 32 : long <= 56 ? 64 : long <= 112 ? 128 : 192;
}
function previewAwait(promise, signal) {
	if (signal.aborted) return Promise.reject(new DOMException("Cancelled", "AbortError"));
	return new Promise((resolve, reject) => {
		const abort = () => reject(new DOMException("Cancelled", "AbortError"));
		signal.addEventListener("abort", abort, { once: true });
		promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
	});
}
function previewKey(sourcePath, page) {
	return JSON.stringify([sourcePath, page]);
}
function planPreviewRequests(requests, limits) {
	const unique = /* @__PURE__ */ new Map();
	for (const request of requests) {
		const old = unique.get(request.key);
		if (!old || old.edge < request.edge) unique.set(request.key, { ...request });
	}
	let planned = [...unique.values()].sort((a, b) => a.priority - b.priority).slice(0, limits.entries);
	while (planned.reduce((n, r) => n + r.edge * r.edge * 4, 0) > limits.bytes && planned.some((r) => r.edge > 16)) planned = planned.map((r) => ({
		...r,
		edge: Math.max(16, r.edge / 2)
	}));
	let bytes = 0;
	return planned.filter((r) => {
		bytes += r.edge * r.edge * 4;
		return bytes <= limits.bytes;
	});
}
var BoardPagePreviews = class {
	render;
	limits;
	tiles = /* @__PURE__ */ new Map();
	desired = /* @__PURE__ */ new Map();
	active = /* @__PURE__ */ new Map();
	errors = /* @__PURE__ */ new Set();
	listeners = /* @__PURE__ */ new Set();
	timer;
	closed = false;
	stats = {
		active: 0,
		peakActive: 0,
		queued: 0,
		tiles: 0,
		bytes: 0,
		peakBytes: 0,
		completed: 0,
		cancelled: 0,
		failed: 0,
		evicted: 0
	};
	constructor(render, limits = PREVIEW_LIMITS) {
		this.render = render;
		this.limits = limits;
	}
	subscribe(callback) {
		this.listeners.add(callback);
		return () => {
			this.listeners.delete(callback);
		};
	}
	snapshot() {
		return {
			...this.stats,
			active: this.active.size,
			queued: this.pending().length,
			tiles: this.tiles.size
		};
	}
	peek(key) {
		return this.closed ? void 0 : this.tiles.get(key);
	}
	update(requests) {
		if (this.closed) return;
		this.desired = /* @__PURE__ */ new Map();
		for (const request of planPreviewRequests(requests, this.limits)) {
			const old = this.desired.get(request.key);
			if (!old || old.edge < request.edge) this.desired.set(request.key, request);
		}
		for (const [key, job] of this.active) if (!this.desired.has(key) && !job.abort.signal.aborted) {
			job.abort.abort();
			this.stats.cancelled++;
		}
		for (const key of this.desired.keys()) {
			const tile = this.tiles.get(key);
			if (tile) {
				this.tiles.delete(key);
				this.tiles.set(key, tile);
			}
		}
		this.pump();
		this.notify();
	}
	pending() {
		return [...this.desired.values()].filter((r) => !this.active.has(r.key) && !this.errors.has(r.key) && (this.tiles.get(r.key)?.edge || 0) < r.edge).sort((a, b) => a.priority - b.priority);
	}
	notify() {
		if (this.closed || this.timer) return;
		this.timer = setTimeout(() => {
			this.timer = void 0;
			if (!this.closed) for (const fn of this.listeners) fn();
		}, 64);
	}
	discard(tile) {
		tile.canvas.width = 0;
		tile.canvas.height = 0;
	}
	store(key, tile) {
		const bytes = tile.canvas.width * tile.canvas.height * 4, old = this.tiles.get(key);
		if (old) {
			this.stats.bytes -= old.canvas.width * old.canvas.height * 4;
			this.tiles.delete(key);
			this.discard(old);
		}
		if (bytes > this.limits.bytes) {
			this.discard(tile);
			this.errors.add(key);
			this.stats.failed++;
			return;
		}
		while (this.tiles.size && (this.stats.bytes + bytes > this.limits.bytes || this.tiles.size >= this.limits.entries)) {
			const oldest = this.tiles.keys().next().value, value = this.tiles.get(oldest);
			this.stats.bytes -= value.canvas.width * value.canvas.height * 4;
			this.tiles.delete(oldest);
			this.discard(value);
			this.stats.evicted++;
		}
		this.tiles.set(key, tile);
		this.stats.bytes += bytes;
		this.stats.peakBytes = Math.max(this.stats.peakBytes, this.stats.bytes);
		this.stats.completed++;
	}
	pump() {
		if (this.closed) return;
		for (const request of this.pending()) {
			if (this.active.size >= this.limits.concurrency) break;
			const job = {
				request,
				abort: new AbortController()
			};
			this.active.set(request.key, job);
			this.stats.peakActive = Math.max(this.stats.peakActive, this.active.size);
			this.render(request, job.abort.signal).then((tile) => {
				if (this.closed || job.abort.signal.aborted || !this.desired.has(request.key)) {
					this.discard(tile);
					return;
				}
				this.store(request.key, tile);
			}).catch((error) => {
				if (!this.closed && !job.abort.signal.aborted) {
					this.errors.add(request.key);
					this.stats.failed++;
				}
			}).finally(() => {
				this.active.delete(request.key);
				this.notify();
				if (!this.closed) setTimeout(() => this.pump(), 0);
			});
		}
	}
	dispose() {
		if (this.closed) return;
		this.closed = true;
		if (this.timer) clearTimeout(this.timer);
		for (const job of this.active.values()) job.abort.abort();
		for (const tile of this.tiles.values()) this.discard(tile);
		this.tiles.clear();
		this.desired.clear();
		this.listeners.clear();
		this.stats.bytes = 0;
	}
};
//#endregion
exports.BoardPagePreviews = BoardPagePreviews;
exports.PREVIEW_LIMITS = PREVIEW_LIMITS;
exports.planPreviewRequests = planPreviewRequests;
exports.previewAwait = previewAwait;
exports.previewEdge = previewEdge;
exports.previewKey = previewKey;

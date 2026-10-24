Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/child-board-session.ts
const unwrap = (result) => {
	if (!result.ok) throw Error(result.error.message);
	return result.value;
};
const allSessions = /* @__PURE__ */ new Map();
const busyListeners = /* @__PURE__ */ new Set();
const publishBusy = () => {
	for (const listener of busyListeners) listener();
};
function childSessionsBusy() {
	return [...allSessions.values()].some((s) => s.snapshot().busy || s.snapshot().drafts > 0);
}
function subscribeChildSessions(listener) {
	busyListeners.add(listener);
	return () => {
		busyListeners.delete(listener);
	};
}
function childPathBusy(vaultId, path) {
	const s = allSessions.get(JSON.stringify([vaultId, path]));
	return !!s && (s.snapshot().busy || s.snapshot().drafts > 0);
}
function childSession(vaultId, path) {
	const key = JSON.stringify([vaultId, path]);
	let value = allSessions.get(key);
	if (!value) {
		value = new ChildBoardSession(window.desktop, vaultId, path, publishBusy);
		allSessions.set(key, value);
		const idle = [...allSessions.entries()].filter(([k, s]) => k !== key && s.isIdle());
		for (const [k] of idle.slice(0, Math.max(0, idle.length - 3))) allSessions.delete(k);
	}
	return value;
}
/** Duplicate portals share the same latest SHA, write lock, watch and refresh queue. */
var ChildBoardSession = class {
	state = {
		file: null,
		loading: false,
		busy: false,
		drafts: 0,
		error: "",
		revision: 0
	};
	listeners = /* @__PURE__ */ new Set();
	reading = null;
	refreshAfter = false;
	writeEpoch = 0;
	stopWatch = null;
	interval = null;
	focus = null;
	api;
	vaultId;
	path;
	changed;
	constructor(api, vaultId, path, changed = () => {}) {
		this.api = api;
		this.vaultId = vaultId;
		this.path = path;
		this.changed = changed;
	}
	snapshot = () => this.state;
	isIdle = () => this.listeners.size === 0 && !this.state.busy && !this.state.drafts && !this.reading;
	publish(patch) {
		this.state = {
			...this.state,
			...patch,
			revision: this.state.revision + 1
		};
		for (const f of this.listeners) f();
		this.changed();
	}
	subscribe = (listener) => {
		this.listeners.add(listener);
		if (this.listeners.size === 1) this.start();
		return () => {
			this.listeners.delete(listener);
			if (!this.listeners.size) this.stop();
		};
	};
	start() {
		this.stopWatch = this.api.onVaultChange((event) => {
			if (event.vaultId === this.vaultId && (event.rescan || event.paths.includes(this.path) || [
				"resume",
				"unlock",
				"poll"
			].includes(event.reason))) this.refresh();
		});
		if (typeof window !== "undefined") {
			this.focus = () => void this.refresh();
			window.addEventListener("focus", this.focus);
			this.interval = setInterval(() => {
				if (!document.hidden) this.refresh();
			}, 6e4);
		}
		this.refresh();
	}
	stop() {
		this.stopWatch?.();
		this.stopWatch = null;
		if (this.interval) clearInterval(this.interval);
		this.interval = null;
		if (this.focus && typeof window !== "undefined") window.removeEventListener("focus", this.focus);
		this.focus = null;
	}
	setDraft(active) {
		this.publish({ drafts: Math.max(0, this.state.drafts + (active ? 1 : -1)) });
		if (!this.state.drafts && this.refreshAfter) {
			this.refreshAfter = false;
			this.refresh();
		}
	}
	async refresh() {
		if (this.state.busy || this.state.drafts) {
			this.refreshAfter = true;
			return;
		}
		if (this.reading) return this.reading;
		const previous = this.state.file?.sha256, epoch = this.writeEpoch;
		this.publish({ loading: !this.state.file });
		this.reading = (async () => {
			try {
				const file = unwrap(await this.api.readFile({
					vaultId: this.vaultId,
					path: this.path
				}));
				if (this.state.busy || this.state.drafts || epoch !== this.writeEpoch || this.state.file?.sha256 !== previous) {
					this.refreshAfter = true;
					return;
				}
				if (file.kind !== "board" || !file.board) throw Error("The linked file is not a board.");
				if (file.sha256 !== previous) this.publish({
					file,
					error: ""
				});
				else if (this.state.error) this.publish({ error: "" });
			} catch (e) {
				this.publish({ error: e instanceof Error ? e.message : String(e) });
			} finally {
				this.reading = null;
				this.publish({ loading: false });
				if (this.refreshAfter && !this.state.busy && !this.state.drafts) {
					this.refreshAfter = false;
					queueMicrotask(() => void this.refresh());
				}
			}
		})();
		return this.reading;
	}
	async mutate(write, before) {
		if (this.state.busy) throw Error("This child board is already saving.");
		if (!this.state.file) throw Error("The child board is not ready.");
		const current = this.state.file;
		this.writeEpoch++;
		this.publish({
			busy: true,
			error: ""
		});
		try {
			await before?.();
			const saved = unwrap(await write(current));
			if (saved.kind !== "board" || !saved.board) throw Error("The child board response was invalid.");
			this.publish({
				file: saved,
				error: ""
			});
			return saved;
		} catch (e) {
			const error = e instanceof Error ? e.message : String(e);
			this.publish({ error });
			throw e;
		} finally {
			this.publish({ busy: false });
			if (this.refreshAfter && !this.state.drafts) {
				this.refreshAfter = false;
				this.refresh();
			}
		}
	}
};
//#endregion
exports.ChildBoardSession = ChildBoardSession;
exports.childPathBusy = childPathBusy;
exports.childSession = childSession;
exports.childSessionsBusy = childSessionsBusy;
exports.subscribeChildSessions = subscribeChildSessions;

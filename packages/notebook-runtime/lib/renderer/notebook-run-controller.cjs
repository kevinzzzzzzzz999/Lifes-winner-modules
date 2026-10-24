Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/notebook-run-controller.ts
const notebookKey = (vaultId, path) => vaultId + "\0" + path;
/** Runtime ownership outlives an editor pane. Restart never reads/replaces a draft. */
var NotebookRunController = class {
	states = {};
	active = /* @__PURE__ */ new Map();
	known = /* @__PURE__ */ new Map();
	restarts = /* @__PURE__ */ new Map();
	unsubscribe;
	disposed = false;
	options;
	constructor(options) {
		this.options = options;
	}
	update = (key, patch) => {
		if (this.disposed) return;
		const state = {
			...this.states[key] || {
				running: false,
				kernelAlive: false
			},
			...patch
		};
		this.states[key] = state;
		this.options.changed(key, state);
	};
	flush = (key) => {
		const run = this.active.get(key), file = this.known.get(key);
		if (!run || !file) return;
		clearTimeout(run.timer);
		run.timer = void 0;
		const events = run.pending.slice();
		if (events.length) {
			this.options.apply(file.vaultId, file.path, events, run.source);
			run.pending.splice(0, events.length);
		}
	};
	receive = (event) => {
		if (this.disposed) return;
		const key = notebookKey(event.vaultId, event.path), run = this.active.get(key), file = this.known.get(key);
		if (!run) {
			if (event.kind === "run-end" && event.kernelAlive === false && file?.runId === event.runId && (!file.kernelId || file.kernelId === event.kernelId)) this.update(key, {
				running: false,
				kernelAlive: false,
				cellIndex: void 0,
				reason: event.reason || "failed"
			});
			return;
		}
		if (run.runId !== event.runId) return;
		if (file) {
			file.runId = event.runId;
			if (event.kernelId) file.kernelId = event.kernelId;
		}
		if (event.kind === "run-end") {
			this.flush(key);
			this.active.delete(key);
			this.update(key, {
				running: false,
				kernelAlive: event.kernelAlive === true,
				cellIndex: void 0,
				reason: event.reason || "completed"
			});
			return;
		}
		run.pending.push(event);
		if (event.kind === "cell-start") this.update(key, {
			cellIndex: event.cellIndex,
			kernelAlive: true
		});
		if (event.kind === "cell-end") this.flush(key);
		else if (!run.timer) run.timer = setTimeout(() => this.flush(key), 70);
	};
	connect = () => {
		this.disposed = false;
		this.unsubscribe?.();
		this.unsubscribe = this.options.api.onNotebookEvent?.(this.receive);
		return this.dispose;
	};
	execute = async (vaultId, path, cellIndices) => {
		const key = notebookKey(vaultId, path);
		if (this.disposed || this.active.has(key) || this.restarts.has(key)) return;
		const runId = crypto.randomUUID(), record = {
			runId,
			source: "",
			phase: "preparing",
			pending: []
		};
		this.active.set(key, record);
		this.known.set(key, {
			...this.known.get(key),
			vaultId,
			path
		});
		this.update(key, {
			running: true,
			error: void 0,
			reason: void 0
		});
		try {
			const source = await this.options.prepare(vaultId, path);
			if (this.active.get(key) !== record || this.disposed) return;
			record.source = source.text || "";
			record.phase = "submitted";
			const result = await this.options.api.runNotebookCells({
				vaultId,
				path,
				expectedSHA256: source.sha256,
				runId,
				cellIndices
			});
			if (!result.ok) throw Error(result.error.message);
			const file = this.known.get(key);
			if (file && (this.active.get(key) === record || file.runId === runId)) {
				file.runId = runId;
				file.kernelId = result.value.kernelId;
			}
		} catch (error) {
			if (this.active.get(key) === record) {
				this.flush(key);
				this.active.delete(key);
				this.update(key, {
					running: false,
					error: error instanceof Error ? error.message : String(error),
					reason: "failed"
				});
			}
		}
	};
	interrupt = async (vaultId, path) => {
		const key = notebookKey(vaultId, path);
		if (this.restarts.has(key)) return;
		const run = this.active.get(key);
		if (run?.phase === "preparing") {
			clearTimeout(run.timer);
			this.active.delete(key);
			this.update(key, {
				running: false,
				cellIndex: void 0,
				reason: "cancelled"
			});
			return;
		}
		const result = await this.options.api.interruptNotebook({
			vaultId,
			path
		});
		if (!result.ok) throw Error(result.error.message);
	};
	restart = (vaultId, path) => {
		const key = notebookKey(vaultId, path), existing = this.restarts.get(key);
		if (existing?.promise) return existing.promise;
		if (this.disposed) return Promise.resolve();
		const token = {};
		this.restarts.set(key, token);
		this.update(key, {
			restarting: true,
			error: void 0
		});
		token.promise = (async () => {
			try {
				this.flush(key);
				const run = this.active.get(key);
				if (run?.phase === "preparing") {
					clearTimeout(run.timer);
					this.active.delete(key);
					this.update(key, {
						running: false,
						cellIndex: void 0
					});
				}
				const result = await this.options.api.restartNotebook({
					vaultId,
					path
				});
				if (!result.ok) throw Error(result.error.message);
				if (this.disposed || this.restarts.get(key) !== token) return;
				this.flush(key);
				const current = this.active.get(key);
				if (current) clearTimeout(current.timer);
				this.active.delete(key);
				this.known.set(key, {
					vaultId,
					path
				});
				this.update(key, {
					running: false,
					restarting: false,
					kernelAlive: false,
					cellIndex: void 0,
					reason: "restarted",
					error: void 0
				});
			} catch (error) {
				if (!this.disposed && this.restarts.get(key) === token) this.update(key, {
					restarting: false,
					running: this.active.has(key),
					error: (error instanceof Error ? error.message : String(error)) + " · 代码和已有输出仍保留。 / Code and existing outputs are retained."
				});
				throw error;
			} finally {
				if (this.restarts.get(key) === token) this.restarts.delete(key);
			}
		})();
		return token.promise;
	};
	close = async (vaultId, path) => {
		const key = notebookKey(vaultId, path), restart = this.restarts.get(key)?.promise;
		if (restart) await restart.catch(() => {});
		this.flush(key);
		const run = this.active.get(key);
		if (run) clearTimeout(run.timer);
		this.active.delete(key);
		this.known.delete(key);
		const result = await this.options.api.closeNotebook({
			vaultId,
			path
		});
		if (!result.ok) throw Error(result.error.message);
		delete this.states[key];
		if (!this.disposed) this.options.changed(key, void 0);
	};
	isRunning = (vaultId, path) => vaultId && path ? this.active.has(notebookKey(vaultId, path)) || this.restarts.has(notebookKey(vaultId, path)) : this.active.size > 0 || this.restarts.size > 0;
	dispose = () => {
		if (this.disposed) return;
		this.disposed = true;
		this.unsubscribe?.();
		this.unsubscribe = void 0;
		for (const [key, file] of this.known) {
			const run = this.active.get(key);
			if (run) clearTimeout(run.timer);
			this.options.api.closeNotebook?.({
				vaultId: file.vaultId,
				path: file.path
			}).catch(() => {});
		}
		this.active.clear();
		this.known.clear();
		this.restarts.clear();
	};
};
//#endregion
exports.NotebookRunController = NotebookRunController;
exports.notebookKey = notebookKey;

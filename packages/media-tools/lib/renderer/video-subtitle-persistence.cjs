Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/video-subtitle-persistence.ts
/** One captured video identity, one ordered CAS writer. Pending user edits may
* finish after their view disappears, but can never be retargeted to a new video. */
var VideoSubtitlePersistence = class {
	value;
	sha256;
	phase;
	error;
	dirty = false;
	revision = 0;
	busy = false;
	started = false;
	listeners = /* @__PURE__ */ new Set();
	transport;
	constructor(transport) {
		this.transport = transport;
		this.phase = transport ? "loading" : "unavailable";
	}
	snapshot() {
		return {
			value: this.value,
			phase: this.phase,
			dirty: this.dirty,
			error: this.error
		};
	}
	subscribe(listener) {
		this.listeners.add(listener);
		listener(this.snapshot());
		return () => {
			this.listeners.delete(listener);
		};
	}
	emit() {
		const state = this.snapshot();
		for (const listener of this.listeners) listener(state);
	}
	start() {
		if (this.started) return;
		this.started = true;
		if (this.transport) this.read();
	}
	edit(value) {
		this.revision++;
		this.value = value;
		this.error = void 0;
		if (!this.transport) {
			this.dirty = false;
			this.phase = "unavailable";
			this.emit();
			return;
		}
		this.dirty = true;
		this.phase = "saving";
		this.emit();
		this.start();
		this.pump();
	}
	async read() {
		if (!this.transport || this.busy) return;
		this.busy = true;
		let succeeded = false;
		this.phase = this.dirty ? "saving" : "loading";
		this.error = void 0;
		this.emit();
		try {
			const result = await this.transport.read();
			if (!result.ok) throw Error(result.error.code);
			this.sha256 = result.value.sha256;
			if (!this.dirty) this.value = result.value.subtitle;
			succeeded = true;
			this.phase = this.dirty ? "saving" : this.value ? "saved" : "idle";
		} catch (error) {
			this.error = error instanceof Error ? error.message : "SUBTITLE_READ_FAILED";
			this.phase = this.error === "CONFLICT" ? "conflict" : "error";
		} finally {
			this.busy = false;
			this.emit();
			if (succeeded && this.dirty) this.pump();
		}
	}
	async pump() {
		if (!this.transport || this.busy || !this.dirty) return;
		if (this.sha256 === void 0) {
			if (this.phase !== "error" && this.phase !== "conflict") this.read();
			return;
		}
		this.busy = true;
		this.phase = "saving";
		this.error = void 0;
		const revision = this.revision, value = this.value ?? null, expectedSHA256 = this.sha256;
		this.emit();
		let succeeded = false;
		try {
			const result = await this.transport.save(value, expectedSHA256);
			if (!result.ok) throw Error(result.error.code);
			this.sha256 = result.value.sha256;
			succeeded = true;
			if (revision === this.revision) {
				this.value = result.value.subtitle;
				this.dirty = false;
				this.phase = "saved";
			}
		} catch (error) {
			this.error = error instanceof Error ? error.message : "SUBTITLE_SAVE_FAILED";
			this.phase = this.error === "CONFLICT" ? "conflict" : "error";
		} finally {
			this.busy = false;
			this.emit();
			if (succeeded && this.dirty) this.pump();
		}
	}
	retry() {
		if (this.busy || !this.transport) return;
		if (this.sha256 === void 0 || !this.dirty) this.read();
		else this.pump();
	}
	refresh() {
		if (!this.busy && !this.dirty && this.phase !== "error" && this.phase !== "conflict") this.read();
	}
	/** The explicit Replace saved subtitles action authorizes using the newest
	* disk version. A second concurrent change still fails the following CAS. */
	replaceAfterConflict() {
		if (this.busy || !this.dirty) return;
		this.read();
	}
	reloadSaved() {
		if (this.busy || !this.transport) return;
		this.revision++;
		this.dirty = false;
		this.read();
	}
};
//#endregion
exports.VideoSubtitlePersistence = VideoSubtitlePersistence;

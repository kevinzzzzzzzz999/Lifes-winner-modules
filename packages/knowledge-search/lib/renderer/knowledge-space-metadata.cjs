Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/knowledge-space-metadata.ts
const SCAN_BUDGET = {
	directories: 48,
	entries: 12e3,
	milliseconds: 8e3,
	concurrent: 4
};
const cancelled = () => new DOMException("Cancelled", "AbortError");
let running = 0;
const queue = [];
function pump() {
	while (running < 4 && queue.length) queue.shift()();
}
function limitedDirectoryRead(vaultId, path, signal) {
	return new Promise((resolve, reject) => {
		let completed = false;
		const finish = (error, value) => {
			if (completed) return;
			completed = true;
			clearTimeout(timer);
			signal.removeEventListener("abort", abort);
			if (error) reject(error);
			else resolve(value);
		};
		const abort = () => finish(cancelled());
		const timer = setTimeout(() => finish(Error("Directory timeout")), 12e3);
		signal.addEventListener("abort", abort, { once: true });
		queue.push(() => {
			if (completed || signal.aborted) {
				finish(cancelled());
				pump();
				return;
			}
			running++;
			window.desktop.listDirectory({
				vaultId,
				path
			}).then((result) => {
				if (!result.ok) throw Error("Directory unavailable");
				finish(null, result.value);
			}).catch((error) => finish(error)).finally(() => {
				running--;
				pump();
			});
		});
		pump();
	});
}
async function scanFolderStats(entries, read, signal, update) {
	const stats = {}, jobs = [], pending = /* @__PURE__ */ new Map(), seen = /* @__PURE__ */ new Set();
	let calls = 0, readEntries = 0;
	const deadline = Date.now() + SCAN_BUDGET.milliseconds;
	for (const e of entries) if (e.kind === "folder") {
		stats[e.path] = {
			bytes: 0,
			directories: 0,
			files: 0,
			known: false,
			complete: true,
			scanning: true
		};
		pending.set(e.path, 1);
		jobs.push({
			path: e.path,
			owner: e.path,
			root: true
		});
	} else stats[e.path] = {
		bytes: e.bytes,
		directories: 0,
		files: 1,
		known: true,
		complete: true,
		scanning: false
	};
	const emit = () => {
		if (!signal.aborted) update(Object.fromEntries(Object.entries(stats).map(([k, v]) => [k, { ...v }])));
	};
	emit();
	const worker = async () => {
		while (jobs.length && !signal.aborted) {
			const job = jobs.shift(), s = stats[job.owner];
			if (calls >= SCAN_BUDGET.directories || readEntries >= SCAN_BUDGET.entries || Date.now() >= deadline) {
				s.complete = false;
				pending.set(job.owner, pending.get(job.owner) - 1);
				continue;
			}
			calls++;
			try {
				const listing = await read(job.path);
				if (signal.aborted) return;
				s.known = true;
				if (listing.warnings?.length) s.complete = false;
				if (job.root) s.directories = listing.entries.filter((e) => e.kind === "folder").length;
				for (const e of listing.entries) {
					if (++readEntries > SCAN_BUDGET.entries) {
						s.complete = false;
						break;
					}
					if (e.path.split("/").slice(0, -1).join("/") !== job.path || seen.has(e.path)) {
						s.complete = false;
						continue;
					}
					seen.add(e.path);
					if (e.kind === "folder") {
						if (e.name.startsWith(".") || e.name === "node_modules") {
							s.complete = false;
							continue;
						}
						jobs.push({
							path: e.path,
							owner: job.owner,
							root: false
						});
						pending.set(job.owner, pending.get(job.owner) + 1);
					} else if (Number.isSafeInteger(e.bytes) && e.bytes >= 0 && Number.isSafeInteger(s.bytes + e.bytes)) {
						s.bytes += e.bytes;
						s.files++;
					} else s.complete = false;
				}
			} catch {
				if (signal.aborted) return;
				s.complete = false;
			}
			pending.set(job.owner, pending.get(job.owner) - 1);
			s.scanning = (pending.get(job.owner) || 0) > 0;
			emit();
		}
	};
	await Promise.all(Array.from({ length: 4 }, () => worker()));
	for (const [p, s] of Object.entries(stats)) {
		s.scanning = false;
		if ((pending.get(p) || 0) > 0) s.complete = false;
	}
	emit();
}
//#endregion
exports.SCAN_BUDGET = SCAN_BUDGET;
exports.limitedDirectoryRead = limitedDirectoryRead;
exports.scanFolderStats = scanFolderStats;

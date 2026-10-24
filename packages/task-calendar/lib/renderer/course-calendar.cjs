Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let open_source_inkspace_desktop_src_renderer_course_checklist_ts = require("./course-checklist.cjs");
//#region open-source/inkspace/desktop/src/renderer/course-calendar.ts
const CALENDAR_SCAN_LIMITS = Object.freeze({
	directories: 1024,
	files: 128,
	depth: 12,
	bytes: 8388608,
	tasks: 1e4,
	milliseconds: 12e3,
	operationMilliseconds: 5e3
});
var CalendarDataError = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.name = "CalendarDataError";
		this.code = code;
	}
};
const unwrap = (result) => {
	if (!result.ok) throw new CalendarDataError(result.error.code, result.error.message);
	return result.value;
};
const parentOf = (path) => path.split("/").slice(0, -1).join("/");
function isCalendarFolder(path) {
	return path === "" || !/[\\\u0000-\u001f\u007f]/.test(path) && path.split("/").every((part) => !!part && !part.startsWith(".") && part !== "." && part !== "..");
}
function localCalendarDate(date = /* @__PURE__ */ new Date()) {
	if (!Number.isFinite(date.getTime())) throw new CalendarDataError("INVALID_DATE", "Invalid calendar date.");
	const key = `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
	if (!(0, open_source_inkspace_desktop_src_renderer_course_checklist_ts.isChecklistDate)(key)) throw new CalendarDataError("INVALID_DATE", "Invalid calendar date.");
	return key;
}
/** UTC is used only for arithmetic on literal components, never to interpret a local instant. */
function dateComponents(key) {
	if (!(0, open_source_inkspace_desktop_src_renderer_course_checklist_ts.isChecklistDate)(key)) throw new CalendarDataError("INVALID_DATE", "Invalid calendar date.");
	const [y, m, d] = key.split("-").map(Number), date = /* @__PURE__ */ new Date(0);
	date.setUTCFullYear(y, m - 1, d);
	date.setUTCHours(12, 0, 0, 0);
	return date;
}
function utcKey(date) {
	return `${String(date.getUTCFullYear()).padStart(4, "0")}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}
function shiftCalendarMonth(month, offset) {
	if (!Number.isInteger(offset)) throw new CalendarDataError("INVALID_DATE", "Invalid month offset.");
	const date = dateComponents(month + "-01");
	date.setUTCMonth(date.getUTCMonth() + offset);
	const key = utcKey(date);
	if (!(0, open_source_inkspace_desktop_src_renderer_course_checklist_ts.isChecklistDate)(key)) return month;
	return key.slice(0, 7);
}
function calendarMonthDays(month) {
	const first = dateComponents(month + "-01"), weekday = (first.getUTCDay() + 6) % 7;
	first.setUTCDate(first.getUTCDate() - weekday);
	return Array.from({ length: 42 }, (_, i) => {
		const day = new Date(first);
		day.setUTCDate(day.getUTCDate() + i);
		const date = utcKey(day);
		return {
			date: (0, open_source_inkspace_desktop_src_renderer_course_checklist_ts.isChecklistDate)(date) ? date : "",
			inMonth: date.slice(0, 7) === month
		};
	});
}
function calendarTasks(snapshots) {
	return snapshots.flatMap((s) => s.doc.tasks.filter((task) => !task.archivedAt).map((task) => ({
		key: JSON.stringify([s.path, task.id.toLowerCase()]),
		path: s.path,
		folder: s.folder,
		course: s.doc.title,
		task
	}))).sort((a, b) => (a.task.dueDate || "9999-99-99").localeCompare(b.task.dueDate || "9999-99-99") || a.course.localeCompare(b.course) || a.task.text.localeCompare(b.task.text));
}
const pendingByAPI = /* @__PURE__ */ new WeakMap();
function boundedOperation(api, key, start, timeout) {
	let pending = pendingByAPI.get(api);
	if (!pending) {
		pending = /* @__PURE__ */ new Map();
		pendingByAPI.set(api, pending);
	}
	let work = pending.get(key);
	if (!work) {
		if (pending.size >= 2) return Promise.reject(new CalendarDataError("PENDING", "A cloud read is still pending."));
		work = Promise.resolve().then(start);
		pending.set(key, work);
		const current = work;
		work.then(() => {
			if (pending.get(key) === current) pending.delete(key);
		}, () => {
			if (pending.get(key) === current) pending.delete(key);
		});
	}
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new CalendarDataError("TIMEOUT", "The cloud folder is not ready yet.")), Math.max(1, timeout));
		work.then((value) => {
			clearTimeout(timer);
			resolve(value);
		}, (error) => {
			clearTimeout(timer);
			reject(error);
		});
	});
}
/** Only checklist JSON is read. Symlink/hardlink and canonical-root checks remain in VaultService. */
async function scanCourseChecklists(api, vaultId, folder = "", options = {}) {
	if (!isCalendarFolder(folder)) throw new CalendarDataError("PATH", "Invalid course folder.");
	const limits = { ...CALENDAR_SCAN_LIMITS };
	for (const key of Object.keys(limits)) {
		const n = options[key];
		if (n !== void 0 && Number.isFinite(n)) limits[key] = Math.max(1, Math.min(limits[key], Math.floor(n)));
	}
	const result = {
		snapshots: [],
		issues: [],
		partial: false,
		directories: 0,
		files: 0
	};
	const issue = (code, path, detail) => {
		result.partial = true;
		if (result.issues.length < 50) result.issues.push({
			code,
			path,
			...detail ? { detail } : {}
		});
	};
	const queue = [{
		path: folder,
		depth: 0
	}], seen = /* @__PURE__ */ new Set(), candidates = [], deadline = Date.now() + limits.milliseconds;
	const run = (key, fn) => {
		const remaining = deadline - Date.now();
		if (remaining <= 0) return Promise.reject(new CalendarDataError("TIMEOUT", "Calendar scan time limit."));
		return boundedOperation(api, vaultId + ":" + key, fn, Math.min(limits.operationMilliseconds, remaining));
	};
	let stop = false;
	while (queue.length && !stop) {
		if (result.directories >= limits.directories) {
			issue("limit", folder, "directories");
			break;
		}
		const current = queue.shift();
		if (seen.has(current.path)) continue;
		seen.add(current.path);
		result.directories++;
		try {
			const listing = unwrap(await run("list:" + current.path, () => api.listDirectory({
				vaultId,
				path: current.path
			})));
			if (listing.path !== current.path) {
				issue("boundary", current.path);
				continue;
			}
			if (listing.warnings.length) issue("unavailable", current.path, listing.warnings.slice(0, 3).join(" · "));
			for (const entry of listing.entries) {
				if (entry.name.startsWith(".")) continue;
				const expected = current.path ? current.path + "/" + entry.name : entry.name;
				if (!isCalendarFolder(entry.path) || entry.name.includes("/") || entry.path !== expected) {
					issue("boundary", current.path);
					continue;
				}
				if (entry.kind === "folder") {
					if (current.depth >= limits.depth) issue("limit", entry.path, "depth");
					else if (queue.length + result.directories >= limits.directories) issue("limit", entry.path, "directories");
					else queue.push({
						path: entry.path,
						depth: current.depth + 1
					});
				} else if (entry.name.toLowerCase().endsWith(".inkcheck.json")) {
					if (candidates.length >= limits.files) {
						issue("limit", entry.path, "files");
						continue;
					}
					if (!Number.isFinite(entry.bytes) || entry.bytes < 0 || entry.bytes > open_source_inkspace_desktop_src_renderer_course_checklist_ts.CHECKLIST_LIMITS.bytes) {
						issue("invalid", entry.path, "size");
						continue;
					}
					candidates.push(entry);
				}
			}
		} catch (error) {
			const e = error;
			issue(e.code === "TIMEOUT" || e.code === "PENDING" ? "timeout" : "unavailable", current.path, e.message);
			if (e.code === "TIMEOUT" || e.code === "PENDING") stop = true;
		}
	}
	let bytes = 0, tasks = 0;
	for (const entry of candidates) {
		if (Date.now() >= deadline) {
			issue("timeout", entry.path);
			break;
		}
		if (bytes + entry.bytes > limits.bytes) {
			issue("limit", entry.path, "bytes");
			break;
		}
		result.files++;
		try {
			const file = unwrap(await run("read:" + entry.path, () => api.readFile({
				vaultId,
				path: entry.path
			})));
			if (file.path !== entry.path || typeof file.text !== "string" || !/^[0-9a-f]{64}$/i.test(file.sha256)) {
				issue("invalid", entry.path, "snapshot");
				continue;
			}
			const actualBytes = new TextEncoder().encode(file.text).byteLength;
			if (bytes + actualBytes > limits.bytes) {
				issue("limit", entry.path, "bytes");
				break;
			}
			bytes += actualBytes;
			const doc = (0, open_source_inkspace_desktop_src_renderer_course_checklist_ts.parseChecklist)(file.text);
			if (tasks + doc.tasks.length > limits.tasks) {
				issue("limit", entry.path, "tasks");
				break;
			}
			tasks += doc.tasks.length;
			result.snapshots.push({
				path: entry.path,
				folder: parentOf(entry.path),
				doc,
				sha: file.sha256
			});
		} catch (error) {
			const e = error;
			issue(e.code === "TIMEOUT" || e.code === "PENDING" ? "timeout" : e.code?.startsWith("INVALID") || [
				"UNSUPPORTED_SCHEMA",
				"TOO_LARGE",
				"DUPLICATE_ID"
			].includes(e.code || "") ? "invalid" : "unavailable", entry.path, e.message);
			if (e.code === "TIMEOUT" || e.code === "PENDING") break;
		}
	}
	return result;
}
async function saveCalendarTask(api, vaultId, snapshot, taskID, patch, options = {}) {
	const next = (0, open_source_inkspace_desktop_src_renderer_course_checklist_ts.updateTask)(snapshot.doc, taskID, patch, options), text = (0, open_source_inkspace_desktop_src_renderer_course_checklist_ts.serializeChecklist)(next);
	const saved = unwrap(await api.saveText({
		vaultId,
		path: snapshot.path,
		expectedSHA256: snapshot.sha,
		text
	}));
	return {
		...snapshot,
		doc: next,
		sha: saved.sha256
	};
}
//#endregion
exports.CALENDAR_SCAN_LIMITS = CALENDAR_SCAN_LIMITS;
exports.CalendarDataError = CalendarDataError;
exports.calendarMonthDays = calendarMonthDays;
exports.calendarTasks = calendarTasks;
exports.isCalendarFolder = isCalendarFolder;
exports.localCalendarDate = localCalendarDate;
exports.saveCalendarTask = saveCalendarTask;
exports.scanCourseChecklists = scanCourseChecklists;
exports.shiftCalendarMonth = shiftCalendarMonth;

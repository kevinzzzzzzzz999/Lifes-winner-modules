Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let open_source_inkspace_desktop_src_renderer_calendar_model = require("./calendar-model.cjs");
//#region open-source/inkspace/desktop/src/renderer/calendar-store.ts
const CALENDAR_FILE = "人生赢家日历.inkcalendar.json";
const LIMIT = 4194304;
const TIMEOUT = 17e3;
const reads = /* @__PURE__ */ new WeakMap();
const saves = /* @__PURE__ */ new WeakMap();
function unwrap(result) {
	if (!result.ok) throw Object.assign(new Error(result.error.message), { code: result.error.code });
	return result.value;
}
function bound(work, message) {
	let timer;
	return Promise.race([work, new Promise((_, reject) => {
		timer = setTimeout(() => reject(Object.assign(new Error(message), { code: "FILE_SCAN_TIMEOUT" })), TIMEOUT);
	})]).finally(() => clearTimeout(timer));
}
function jobs(map, api) {
	let value = map.get(api);
	if (!value) {
		value = /* @__PURE__ */ new Map();
		map.set(api, value);
	}
	return value;
}
function checked(doc) {
	if (doc.events.length > 5e3) throw new Error("日程超过 5000 项，无法保存。 / Calendar exceeds 5000 events.");
	return doc;
}
function readCalendar(api, vaultId) {
	const pending = jobs(reads, api);
	let work = pending.get(vaultId);
	if (!work) {
		work = (async () => {
			const file = unwrap(await api.readCalendarFile({ vaultId }));
			if (file === null) return {
				doc: (0, open_source_inkspace_desktop_src_renderer_calendar_model.newCalendarDocument)(),
				sha: null
			};
			if (file.kind !== "text" || typeof file.text !== "string") throw new Error("无法读取日历内容。 / The calendar file is not text.");
			if (file.bytes > LIMIT || new TextEncoder().encode(file.text).length > LIMIT) throw new Error("日历文件超过 4 MiB。 / Calendar exceeds 4 MiB.");
			return {
				doc: checked((0, open_source_inkspace_desktop_src_renderer_calendar_model.parseCalendar)(file.text)),
				sha: file.sha256
			};
		})();
		pending.set(vaultId, work);
		work.finally(() => {
			if (pending.get(vaultId) === work) pending.delete(vaultId);
		}).catch(() => {});
	}
	return bound(work, "读取日历超时。请等待 iCloud 下载完成后重试。 / Calendar read timed out. Wait for the cloud download, then retry.");
}
function saveCalendar(api, vaultId, snapshot, doc) {
	const pending = jobs(saves, api);
	if (pending.has(vaultId)) return Promise.reject(/* @__PURE__ */ new Error("上一次日历保存仍在进行，请稍后重新读取。 / The previous calendar save is still running. Reload after it finishes."));
	let text;
	try {
		text = (0, open_source_inkspace_desktop_src_renderer_calendar_model.serializeCalendar)(checked(doc));
		if (new TextEncoder().encode(text).length > LIMIT) throw new Error("日历文件超过 4 MiB。 / Calendar exceeds 4 MiB.");
	} catch (error) {
		return Promise.reject(error);
	}
	const next = (0, open_source_inkspace_desktop_src_renderer_calendar_model.parseCalendar)(text);
	const work = (async () => {
		const result = snapshot.sha === null ? unwrap(await api.createTextFile({
			vaultId,
			parentPath: "",
			name: CALENDAR_FILE,
			content: text
		})) : unwrap(await api.saveText({
			vaultId,
			path: CALENDAR_FILE,
			expectedSHA256: snapshot.sha,
			text
		}));
		const resultSnapshot = {
			doc: next,
			sha: result.sha256
		};
		jobs(reads, api).delete(vaultId);
		if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("winner-calendar-saved", { detail: { vaultId } }));
		return resultSnapshot;
	})();
	pending.set(vaultId, work);
	work.finally(() => {
		if (pending.get(vaultId) === work) pending.delete(vaultId);
	}).catch(() => {});
	return bound(work, "日历保存尚未完成。请等待后重新读取核实，再次保存可能造成冲突。 / Saving is still pending. Reload to verify before saving again.");
}
//#endregion
exports.CALENDAR_FILE = CALENDAR_FILE;
exports.readCalendar = readCalendar;
exports.saveCalendar = saveCalendar;

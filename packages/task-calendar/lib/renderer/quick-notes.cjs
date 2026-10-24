Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let open_source_inkspace_desktop_src_renderer_course_checklist_ts = require("./course-checklist.cjs");
//#region open-source/inkspace/desktop/src/renderer/quick-notes.ts
/** Quick notes use the existing checklist contract; there is no second task store. */
const QUICK_NOTES_PATH = "便签清单.inkcheck.json";
var QuickNotesError = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.name = "QuickNotesError";
		this.code = code;
	}
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Use local calendar components. UTC slicing changes the deadline near midnight. */
function quickNoteLocalDate(now = /* @__PURE__ */ new Date()) {
	if (!Number.isFinite(now.getTime())) throw new QuickNotesError("INVALID_DATE", "Invalid capture date.");
	return `${String(now.getFullYear()).padStart(4, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function newQuickNoteDraft() {
	return {
		schemaVersion: 1,
		id: crypto.randomUUID(),
		text: ""
	};
}
function parseQuickNoteDraft(raw) {
	if (raw === null) return null;
	const value = JSON.parse(raw);
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new QuickNotesError("INVALID_DRAFT", "Invalid quick note draft.");
	const d = value;
	if (d.schemaVersion !== 1 || typeof d.id !== "string" || !uuid.test(d.id) || typeof d.text !== "string" || d.editingId !== void 0 && (typeof d.editingId !== "string" || !uuid.test(d.editingId) || typeof d.baseText !== "string")) throw new QuickNotesError("INVALID_DRAFT", "Invalid quick note draft.");
	return {
		schemaVersion: 1,
		id: d.id,
		text: d.text,
		...typeof d.editingId === "string" ? {
			editingId: d.editingId,
			baseText: d.baseText
		} : {}
	};
}
const quickNoteDraftKey = (identity) => "inkspace.quick-notes.draft.v1:" + encodeURIComponent(identity);
function quickNoteIsDirty(draft) {
	return draft.editingId ? draft.text !== draft.baseText : !!draft.text;
}
function copy(doc) {
	return (0, open_source_inkspace_desktop_src_renderer_course_checklist_ts.parseChecklist)((0, open_source_inkspace_desktop_src_renderer_course_checklist_ts.serializeChecklist)(doc));
}
/** The stable draft ID makes a retry after an uncertain write idempotent. */
function addQuickNote(doc, draft, now = /* @__PURE__ */ new Date()) {
	const next = copy(doc), existing = next.tasks.find((t) => t.id.toLowerCase() === draft.id.toLowerCase());
	if (existing) {
		const origin = existing.quickNote;
		if (origin?.feature === "quick-notes" && origin.requestId === draft.id && existing.text === draft.text) return {
			doc: next,
			task: existing,
			added: false
		};
		throw new QuickNotesError("ALREADY_RECORDED", "这条便签已记录或已在清单修改。请打开清单核对；输入仍保留。 / This note was already recorded or edited in the checklist. Review it there; your draft is kept.");
	}
	const stamp = now.toISOString(), day = quickNoteLocalDate(now);
	const task = (0, open_source_inkspace_desktop_src_renderer_course_checklist_ts.newTask)(draft.text, "便签", {
		id: draft.id,
		now: stamp,
		dueDate: day
	});
	task.quickNote = {
		feature: "quick-notes",
		version: 1,
		requestId: draft.id,
		capturedLocalDate: day,
		defaultDeadline: "end-of-local-day"
	};
	next.tasks.push(task);
	next.updatedAt = stamp;
	(0, open_source_inkspace_desktop_src_renderer_course_checklist_ts.serializeChecklist)(next);
	return {
		doc: next,
		task,
		added: true
	};
}
function editQuickNote(doc, draft, now = /* @__PURE__ */ new Date()) {
	const task = doc.tasks.find((t) => t.id.toLowerCase() === draft.editingId?.toLowerCase());
	if (!task) throw new QuickNotesError("NOT_FOUND", "这条便签已不存在，输入仍保留。 / This note no longer exists; your draft is kept.");
	if (task.text !== draft.baseText && task.text !== draft.text) throw new QuickNotesError("CONFLICT", "便签内容已在别处修改，输入仍保留。请在清单核对后重新编辑。 / This note changed elsewhere. Your draft is kept; review it in the checklist before editing again.");
	return (0, open_source_inkspace_desktop_src_renderer_course_checklist_ts.updateTask)(doc, task.id, { text: draft.text }, { now: now.toISOString() });
}
/** Array order is authoritative for both quick notes and the existing checklist. */
function moveQuickNote(doc, id, direction, visibleIds, now = /* @__PURE__ */ new Date()) {
	const next = copy(doc), keys = visibleIds.map((v) => v.toLowerCase()), key = id.toLowerCase(), at = keys.indexOf(key), target = at + direction;
	if (new Set(keys).size !== keys.length || keys.some((v) => !next.tasks.some((t) => t.id.toLowerCase() === v))) throw new QuickNotesError("CONFLICT", "排序内容已变化，请重新读取。 / The list changed; refresh before sorting.");
	if (at < 0 || target < 0 || target >= keys.length) return next;
	const from = next.tasks.findIndex((t) => t.id.toLowerCase() === key), to = next.tasks.findIndex((t) => t.id.toLowerCase() === keys[target]);
	[next.tasks[from], next.tasks[to]] = [next.tasks[to], next.tasks[from]];
	next.updatedAt = now.toISOString();
	(0, open_source_inkspace_desktop_src_renderer_course_checklist_ts.serializeChecklist)(next);
	return next;
}
function requireOK(result) {
	if (result.ok) return result.value;
	throw new QuickNotesError(result.error.code, ["CONFLICT", "EXISTS"].includes(result.error.code) ? "便签清单已变化。请重新读取后再试，输入仍保留。 / The checklist changed. Refresh and retry; your draft is kept." : result.error.message);
}
async function readQuickNotes(io, vaultId) {
	const result = await io.readFile({
		vaultId,
		path: QUICK_NOTES_PATH
	});
	if (!result.ok && result.error.code === "NOT_FOUND") return null;
	const file = requireOK(result);
	return {
		doc: (0, open_source_inkspace_desktop_src_renderer_course_checklist_ts.parseChecklist)(file.text || ""),
		sha: file.sha256
	};
}
async function writeQuickNotes(io, vaultId, next, before) {
	const text = (0, open_source_inkspace_desktop_src_renderer_course_checklist_ts.serializeChecklist)(next);
	if (before) return {
		doc: next,
		sha: requireOK(await io.saveText({
			vaultId,
			path: QUICK_NOTES_PATH,
			expectedSHA256: before.sha,
			text
		})).sha256
	};
	return {
		doc: next,
		sha: requireOK(await io.createTextFile({
			vaultId,
			parentPath: "",
			name: QUICK_NOTES_PATH,
			content: text
		})).sha256
	};
}
/** Read before each append, then CAS. Never retry an overwrite automatically. */
async function recordQuickNote(io, vaultId, draft, now = /* @__PURE__ */ new Date()) {
	const before = await readQuickNotes(io, vaultId), result = addQuickNote(before?.doc || (0, open_source_inkspace_desktop_src_renderer_course_checklist_ts.createChecklist)("便签清单", void 0, now.toISOString()), draft, now);
	return {
		snapshot: result.added ? await writeQuickNotes(io, vaultId, result.doc, before) : before,
		task: result.task,
		added: result.added
	};
}
//#endregion
exports.QUICK_NOTES_PATH = QUICK_NOTES_PATH;
exports.QuickNotesError = QuickNotesError;
exports.addQuickNote = addQuickNote;
exports.editQuickNote = editQuickNote;
exports.moveQuickNote = moveQuickNote;
exports.newQuickNoteDraft = newQuickNoteDraft;
exports.parseQuickNoteDraft = parseQuickNoteDraft;
exports.quickNoteDraftKey = quickNoteDraftKey;
exports.quickNoteIsDirty = quickNoteIsDirty;
exports.quickNoteLocalDate = quickNoteLocalDate;
exports.readQuickNotes = readQuickNotes;
exports.recordQuickNote = recordQuickNote;
exports.writeQuickNotes = writeQuickNotes;

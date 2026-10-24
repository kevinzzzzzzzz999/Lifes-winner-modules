Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/shared/notebook-format.ts
/** Local nbformat 4 model. Unknown JSON fields are retained, never executed here.
* Limits are UTF-8 bytes: 128 MiB file, 32 MiB sources, 8 MiB per cell,
* 64 MiB outputs + attachments; at most 1,000 cells / 10,000 outputs,
* 250,000 JSON values and 100 nesting levels.
* https://nbformat.readthedocs.io/en/latest/format_description.html
*/
const NOTEBOOK_LIMITS = Object.freeze({
	fileBytes: 134217728,
	sourceBytes: 33554432,
	cellSourceBytes: 8388608,
	outputBytes: 67108864,
	cells: 1e3,
	outputs: 1e4,
	cellOutputs: 1e3,
	jsonDepth: 100,
	jsonNodes: 25e4
});
var NotebookFormatError = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.name = "NotebookFormatError";
		this.code = code;
	}
};
const utf8 = new TextEncoder();
const bytes = (value) => utf8.encode(value).byteLength;
const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const multiline = (value) => typeof value === "string" || Array.isArray(value) && value.every((part) => typeof part === "string");
const count = (value) => value === null || typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const validId = (value) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(value);
const knownTypes = /* @__PURE__ */ new Set([
	"code",
	"markdown",
	"raw"
]);
const knownOutputs = /* @__PURE__ */ new Set([
	"stream",
	"display_data",
	"execute_result",
	"error"
]);
function fail(code, message) {
	throw new NotebookFormatError(code, message);
}
const jsonBytes = (value) => bytes(JSON.stringify(value));
/** Iterative check also rejects cycles/non-JSON programmatic edits before save. */
function checkJSON(value) {
	const stack = [{
		value,
		depth: 0
	}];
	const ancestors = /* @__PURE__ */ new Set();
	let nodes = 0;
	while (stack.length) {
		const item = stack.pop();
		if (item.exit) {
			ancestors.delete(item.value);
			continue;
		}
		if (++nodes > NOTEBOOK_LIMITS.jsonNodes) fail("json-complexity", "Notebook 的数据项过多，请先清理输出或拆分。");
		if (item.depth > NOTEBOOK_LIMITS.jsonDepth) fail("json-depth", "Notebook 的嵌套层数过多，未修改原文件。");
		if (item.value === null || typeof item.value === "string" || typeof item.value === "boolean") continue;
		if (typeof item.value === "number" && Number.isFinite(item.value)) continue;
		if (typeof item.value !== "object") fail("invalid-json-value", "Notebook 含有不能保存为 JSON 的内容。");
		const object = item.value;
		if (ancestors.has(object)) fail("cyclic-json", "Notebook 含有循环引用，未保存。");
		const proto = Object.getPrototypeOf(object);
		if (!Array.isArray(object) && proto !== Object.prototype && proto !== null) fail("invalid-json-value", "Notebook 含有不能保存为 JSON 的对象。");
		if (Array.isArray(object) && object.length > NOTEBOOK_LIMITS.jsonNodes - nodes) fail("json-complexity", "Notebook 的数据项过多，请先清理输出或拆分。");
		ancestors.add(object);
		stack.push({
			value: object,
			depth: item.depth,
			exit: true
		});
		const children = Object.values(object);
		if (children.length + nodes + stack.length > NOTEBOOK_LIMITS.jsonNodes) fail("json-complexity", "Notebook 的数据项过多，请先清理输出或拆分。");
		for (const child of children) stack.push({
			value: child,
			depth: item.depth + 1
		});
	}
}
function notebookCellSource(cell) {
	return typeof cell.source === "string" ? cell.source : cell.source.join("");
}
function notebookMultilineText(value) {
	return multiline(value) ? typeof value === "string" ? value : value.join("") : "";
}
/** Index disambiguates malformed duplicate IDs without altering a file on open. */
function notebookCellKey(cell, index) {
	return `${index}:${validId(cell.id) ? cell.id : "cell"}`;
}
function validateOutput(output, cellIndex) {
	const where = `第 ${cellIndex + 1} 个单元格的输出`;
	if (!record(output) || typeof output.output_type !== "string" || !output.output_type) fail("invalid-output", `${where}格式不正确。`);
	if (output.metadata !== void 0 && !record(output.metadata)) fail("invalid-output", `${where}的 metadata 必须是对象。`);
	switch (output.output_type) {
		case "stream":
			if (typeof output.name !== "string" || !multiline(output.text)) fail("invalid-output", `${where}缺少有效的文本。`);
			break;
		case "display_data":
		case "execute_result":
			if (!record(output.data)) fail("invalid-output", `${where}的 data 必须是对象。`);
			if (output.output_type === "execute_result" && (output.execution_count === null || !count(output.execution_count))) fail("invalid-output", `${where}的执行次数不正确。`);
			break;
		case "error": if (typeof output.ename !== "string" || typeof output.evalue !== "string" || !Array.isArray(output.traceback) || !output.traceback.every((line) => typeof line === "string")) fail("invalid-output", `${where}的错误信息不完整。`);
	}
}
function notebookStats(notebook) {
	const stats = {
		cells: notebook.cells.length,
		codeCells: 0,
		markdownCells: 0,
		rawCells: 0,
		unknownCells: 0,
		sourceBytes: 0,
		outputBytes: 0,
		attachmentBytes: 0,
		outputCount: 0
	};
	for (const cell of notebook.cells) {
		if (cell.cell_type === "code") stats.codeCells++;
		else if (cell.cell_type === "markdown") stats.markdownCells++;
		else if (cell.cell_type === "raw") stats.rawCells++;
		else stats.unknownCells++;
		stats.sourceBytes += bytes(notebookCellSource(cell));
		if (Array.isArray(cell.outputs)) {
			stats.outputCount += cell.outputs.length;
			stats.outputBytes += jsonBytes(cell.outputs);
		}
		if (cell.attachments !== void 0) stats.attachmentBytes += jsonBytes(cell.attachments);
	}
	return stats;
}
/** Validates structure while permitting future 4.x fields, cell types and outputs. */
function validateNotebook(value) {
	if (!record(value)) fail("invalid-notebook", "这个文件不是有效的 Jupyter Notebook。");
	if (value.nbformat !== 4) fail("unsupported-version", `目前支持 nbformat 4；这个文件的版本为 ${String(value.nbformat)}。未修改原文件，请先在 Jupyter 中转换为版本 4。`);
	if (typeof value.nbformat_minor !== "number" || !Number.isSafeInteger(value.nbformat_minor) || value.nbformat_minor < 0) fail("invalid-version", "Notebook 的 nbformat_minor 必须是非负整数。");
	if (!record(value.metadata) || !Array.isArray(value.cells)) fail("invalid-notebook", "Notebook 必须包含 metadata 对象和 cells 列表。");
	if (value.cells.length > NOTEBOOK_LIMITS.cells) fail("cell-limit", "这个 Notebook 超过 1,000 个单元格，请先在 Jupyter 中拆分后打开。");
	checkJSON(value);
	value.cells.forEach((cell, index) => {
		if (!record(cell) || typeof cell.cell_type !== "string" || !cell.cell_type || !record(cell.metadata) || !multiline(cell.source)) fail("invalid-cell", `第 ${index + 1} 个单元格缺少有效的类型、metadata 或 source。`);
		if (bytes(typeof cell.source === "string" ? cell.source : cell.source.join("")) > NOTEBOOK_LIMITS.cellSourceBytes) fail("cell-source-limit", `第 ${index + 1} 个单元格超过 8 MiB，请先拆分。`);
		if (cell.attachments !== void 0 && !record(cell.attachments)) fail("invalid-attachments", `第 ${index + 1} 个单元格的 attachments 必须是对象。`);
		if (cell.cell_type === "code" && (!Array.isArray(cell.outputs) || !count(cell.execution_count))) fail("invalid-code-cell", `第 ${index + 1} 个代码单元格缺少 outputs 或有效的 execution_count。`);
		if (cell.outputs !== void 0) {
			if (!Array.isArray(cell.outputs)) fail("invalid-output", `第 ${index + 1} 个单元格的 outputs 必须是列表。`);
			if (cell.outputs.length > NOTEBOOK_LIMITS.cellOutputs) fail("output-count-limit", `第 ${index + 1} 个单元格超过 1,000 条输出，请先在 Jupyter 中清理输出。`);
			cell.outputs.forEach((output) => validateOutput(output, index));
		}
	});
	const stats = notebookStats(value);
	if (stats.sourceBytes > NOTEBOOK_LIMITS.sourceBytes) fail("source-limit", "Notebook 的代码和文字超过 32 MiB，请先拆分。");
	if (stats.outputBytes + stats.attachmentBytes > NOTEBOOK_LIMITS.outputBytes) fail("output-size-limit", "Notebook 的输出和附件超过 64 MiB，请先在 Jupyter 中清理或拆分。");
	if (stats.outputCount > NOTEBOOK_LIMITS.outputs) fail("output-count-limit", "Notebook 超过 10,000 条输出，请先在 Jupyter 中清理输出。");
	if (jsonBytes(value) > NOTEBOOK_LIMITS.fileBytes) fail("file-limit", "Notebook 超过 128 MiB，请先在 Jupyter 中清理输出或拆分。");
}
function parseNotebook(text) {
	if (bytes(text) > NOTEBOOK_LIMITS.fileBytes) fail("file-limit", "Notebook 超过 128 MiB，请先在 Jupyter 中清理输出或拆分。");
	let value;
	try {
		value = JSON.parse(text.charCodeAt(0) === 65279 ? text.slice(1) : text);
	} catch {
		fail("invalid-json", "Notebook 的 JSON 格式不完整或不正确，未修改原文件。");
	}
	validateNotebook(value);
	return value;
}
function notebookWarnings(notebook) {
	const result = [], used = /* @__PURE__ */ new Set();
	notebook.cells.forEach((cell, cellIndex) => {
		if (notebook.nbformat_minor >= 5 && (!validId(cell.id) || used.has(cell.id))) result.push({
			code: "cell-id-repair",
			cellIndex,
			message: `第 ${cellIndex + 1} 个单元格的 ID 缺失、无效或重复；保存时将生成唯一 ID。`
		});
		if (validId(cell.id)) used.add(cell.id);
		if (!knownTypes.has(cell.cell_type)) result.push({
			code: "unknown-cell",
			cellIndex,
			message: `第 ${cellIndex + 1} 个单元格的类型 ${cell.cell_type} 暂不支持编辑或运行；保存时保留。`
		});
		if (cell.outputs?.some((output) => !knownOutputs.has(output.output_type))) result.push({
			code: "unknown-output",
			cellIndex,
			message: `第 ${cellIndex + 1} 个单元格含有暂不支持显示的输出；保存时保留。`
		});
	});
	return result;
}
function freshId(used, index) {
	const base = `inkspace-cell-${index + 1}`;
	let id = base, suffix = 1;
	while (used.has(id)) id = `${base}-${suffix++}`;
	used.add(id);
	return id;
}
/** Preserve the first occurrence of every valid ID, even one appearing later. */
function prepareNotebookForSave(notebook) {
	validateNotebook(notebook);
	if (notebook.nbformat_minor < 5) return notebook;
	const reserved = new Set(notebook.cells.map((cell) => cell.id).filter(validId)), seen = /* @__PURE__ */ new Set();
	let changed = false;
	const cells = notebook.cells.map((cell, index) => {
		if (validId(cell.id) && !seen.has(cell.id)) {
			seen.add(cell.id);
			return cell;
		}
		changed = true;
		return {
			...cell,
			id: freshId(reserved, index)
		};
	});
	return changed ? {
		...notebook,
		cells
	} : notebook;
}
function serializeNotebook(notebook) {
	const text = JSON.stringify(prepareNotebookForSave(notebook), null, 1) + "\n";
	if (bytes(text) > NOTEBOOK_LIMITS.fileBytes) fail("file-limit", "保存后的 Notebook 超过 128 MiB，请先清理输出或拆分。");
	return text;
}
function makeCell(type, id, source = "") {
	return type === "code" ? {
		cell_type: type,
		id,
		metadata: {},
		source,
		outputs: [],
		execution_count: null
	} : {
		cell_type: type,
		id,
		metadata: {},
		source
	};
}
function createNotebook() {
	return {
		nbformat: 4,
		nbformat_minor: 5,
		metadata: {
			kernelspec: {
				display_name: "Python 3",
				language: "python",
				name: "python3"
			},
			language_info: { name: "python" }
		},
		cells: [makeCell("markdown", "inkspace-cell-1", "# Notebook\n"), makeCell("code", "inkspace-cell-2")]
	};
}
function at(notebook, index) {
	if (!Number.isInteger(index) || index < 0 || index >= notebook.cells.length) fail("cell-not-found", "这个单元格已不存在，请重新选择。");
	return notebook.cells[index];
}
function replace(notebook, index, cell) {
	const cells = [...notebook.cells];
	cells[index] = cell;
	return {
		...notebook,
		cells
	};
}
function updateNotebookCell(notebook, index, patch) {
	const old = at(notebook, index);
	if (!knownTypes.has(old.cell_type)) fail("unsupported-cell", "这个扩展单元格暂不支持编辑；它的内容会保留。");
	if (patch.source !== void 0 && typeof patch.source !== "string") fail("invalid-source", "单元格内容必须是文本。");
	if (patch.cell_type !== void 0 && !knownTypes.has(patch.cell_type)) fail("unsupported-cell", "请选择代码、Markdown 或原始文本单元格。");
	const type = patch.cell_type ?? old.cell_type, source = patch.source ?? notebookCellSource(old);
	if (type === old.cell_type && source === notebookCellSource(old)) return notebook;
	const size = bytes(source);
	if (size > NOTEBOOK_LIMITS.cellSourceBytes) fail("cell-source-limit", "一个单元格最多 8 MiB，请拆分后输入。");
	if (notebook.cells.reduce((sum, cell, i) => sum + (i === index ? size : bytes(notebookCellSource(cell))), 0) > NOTEBOOK_LIMITS.sourceBytes) fail("source-limit", "Notebook 的代码和文字最多 32 MiB，请先拆分。");
	const next = {
		...old,
		cell_type: type,
		source
	};
	if (type === "code" && old.cell_type !== "code") {
		next.outputs = [];
		next.execution_count = null;
	} else if (type !== "code" && old.cell_type === "code") {
		delete next.outputs;
		delete next.execution_count;
	}
	return replace(notebook, index, next);
}
function addNotebookCell(notebook, type = "code", afterIndex = notebook.cells.length - 1) {
	if (!knownTypes.has(type)) fail("unsupported-cell", "请选择代码、Markdown 或原始文本单元格。");
	if (notebook.cells.length >= NOTEBOOK_LIMITS.cells) fail("cell-limit", "每个 Notebook 最多 1,000 个单元格。");
	if (!Number.isInteger(afterIndex) || afterIndex < -1 || afterIndex >= notebook.cells.length) fail("cell-not-found", "无法在这个位置添加单元格。");
	const cells = [...notebook.cells], id = freshId(new Set(cells.map((cell) => cell.id).filter(validId)), cells.length);
	cells.splice(afterIndex + 1, 0, makeCell(type, id));
	return {
		...notebook,
		cells
	};
}
function removeNotebookCell(notebook, index) {
	at(notebook, index);
	return {
		...notebook,
		cells: notebook.cells.filter((_, i) => i !== index)
	};
}
function moveNotebookCell(notebook, from, to) {
	at(notebook, from);
	at(notebook, to);
	if (from === to) return notebook;
	const cells = [...notebook.cells], [cell] = cells.splice(from, 1);
	cells.splice(to, 0, cell);
	return {
		...notebook,
		cells
	};
}
function clearNotebookOutputs(notebook, index) {
	if (index !== void 0) at(notebook, index);
	let changed = false;
	const cells = notebook.cells.map((cell, i) => {
		if (cell.cell_type !== "code" || index !== void 0 && i !== index || !cell.outputs?.length && cell.execution_count === null) return cell;
		changed = true;
		return {
			...cell,
			outputs: [],
			execution_count: null
		};
	});
	return changed ? {
		...notebook,
		cells
	} : notebook;
}
function setNotebookCellOutputs(notebook, index, outputs, executionCount) {
	const cell = at(notebook, index);
	if (cell.cell_type !== "code") fail("unsupported-cell", "只能为代码单元格写入运行结果。");
	if (!count(executionCount)) fail("invalid-execution-count", "运行结果的执行次数不正确。");
	const next = replace(notebook, index, {
		...cell,
		outputs,
		execution_count: executionCount
	});
	validateNotebook(next);
	return next;
}
//#endregion
exports.NOTEBOOK_LIMITS = NOTEBOOK_LIMITS;
exports.NotebookFormatError = NotebookFormatError;
exports.addNotebookCell = addNotebookCell;
exports.clearNotebookOutputs = clearNotebookOutputs;
exports.createNotebook = createNotebook;
exports.moveNotebookCell = moveNotebookCell;
exports.notebookCellKey = notebookCellKey;
exports.notebookCellSource = notebookCellSource;
exports.notebookMultilineText = notebookMultilineText;
exports.notebookStats = notebookStats;
exports.notebookWarnings = notebookWarnings;
exports.parseNotebook = parseNotebook;
exports.prepareNotebookForSave = prepareNotebookForSave;
exports.removeNotebookCell = removeNotebookCell;
exports.serializeNotebook = serializeNotebook;
exports.setNotebookCellOutputs = setNotebookCellOutputs;
exports.updateNotebookCell = updateNotebookCell;
exports.validateNotebook = validateNotebook;

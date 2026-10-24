Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let open_source_inkspace_desktop_src_shared_notebook_format = require("../shared/notebook-format.cjs");
//#region open-source/inkspace/desktop/src/renderer/notebook-actions.ts
/** Notebook commands are immutable so a multi-cell operation is one undo step. */
function selectedCellIndices(length, active, anchor = active) {
	const lo = Math.max(0, Math.min(active, anchor)), hi = Math.min(length - 1, Math.max(active, anchor));
	return Array.from({ length: Math.max(0, hi - lo + 1) }, (_, i) => lo + i);
}
function pasteNotebookCells(doc, cells, index) {
	const pasted = structuredClone(cells).map((cell) => ({
		...cell,
		id: crypto.randomUUID()
	}));
	return {
		...doc,
		cells: [
			...doc.cells.slice(0, index),
			...pasted,
			...doc.cells.slice(index)
		]
	};
}
function splitNotebookCell(doc, index, offset) {
	const cell = doc.cells[index], source = (0, open_source_inkspace_desktop_src_shared_notebook_format.notebookCellSource)(cell);
	if (![
		"code",
		"markdown",
		"raw"
	].includes(cell.cell_type)) throw Error("Cannot split this cell type.");
	const position = Math.max(0, Math.min(offset, source.length));
	const left = {
		...cell,
		source: source.slice(0, position)
	}, right = {
		...structuredClone(cell),
		id: crypto.randomUUID(),
		source: source.slice(position)
	};
	for (const c of [left, right]) if (c.cell_type === "code") {
		c.outputs = [];
		c.execution_count = null;
	}
	return {
		...doc,
		cells: [
			...doc.cells.slice(0, index),
			left,
			right,
			...doc.cells.slice(index + 1)
		]
	};
}
function mergeNotebookCells(doc, indices) {
	if (indices.length < 2) return doc;
	const selected = indices.map((i) => doc.cells[i]);
	if (selected.some((c) => ![
		"code",
		"markdown",
		"raw"
	].includes(c.cell_type))) throw Error("Unknown cell types cannot be merged.");
	const source = selected.map(open_source_inkspace_desktop_src_shared_notebook_format.notebookCellSource).join("\n\n");
	let next = (0, open_source_inkspace_desktop_src_shared_notebook_format.updateNotebookCell)(doc, indices[0], { source });
	const first = { ...next.cells[indices[0]] };
	const attachments = {};
	for (const c of selected) for (const [name, data] of Object.entries(c.attachments || {})) {
		if (name in attachments && JSON.stringify(attachments[name]) !== JSON.stringify(data)) throw Error("Rename conflicting attachment names before merging cells. / 请先重命名重复的附件。");
		attachments[name] = data;
	}
	if (Object.keys(attachments).length) first.attachments = attachments;
	first.metadata = {
		...first.metadata,
		inkspaceMergedCellMetadata: selected.slice(1).map((c) => ({
			id: c.id || null,
			cell_type: c.cell_type,
			metadata: c.metadata
		}))
	};
	const remove = new Set(indices.slice(1));
	return {
		...next,
		cells: next.cells.map((c, i) => i === indices[0] ? first : c).filter((_, i) => !remove.has(i))
	};
}
function insertNotebookCode(doc, after, source) {
	return (0, open_source_inkspace_desktop_src_shared_notebook_format.updateNotebookCell)((0, open_source_inkspace_desktop_src_shared_notebook_format.addNotebookCell)(doc, "code", after), after + 1, { source });
}
function relativeNotebookDataPath(notebookPath, dataPath) {
	const parent = notebookPath.split("/").slice(0, -1), target = dataPath.split("/");
	let shared = 0;
	while (parent[shared] !== void 0 && parent[shared] === target[shared]) shared++;
	return [...parent.slice(shared).map(() => ".."), ...target.slice(shared)].join("/");
}
function notebookDataFileKind(path) {
	return /\.(csv|tsv)$/i.test(path) ? "csv" : /\.(xlsx|xlsm|xls)$/i.test(path) ? "excel" : null;
}
/** Workbook identity includes its worksheet; CSV identity remains its original path. */
function notebookDataIdentity(item) {
	return JSON.stringify(item.kind === "excel" ? [
		"excel",
		item.path,
		item.sheet
	] : ["csv", item.path]);
}
const pythonKeywords = new Set("False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case type".split(" "));
function validCSVVariable(value) {
	return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value) && !pythonKeywords.has(value) && value !== "pd";
}
/** Conservatively reserve every code identifier, including function arguments. */
function notebookIdentifiers(doc) {
	return [...new Set(doc.cells.filter((cell) => cell.cell_type === "code").flatMap((cell) => (0, open_source_inkspace_desktop_src_shared_notebook_format.notebookCellSource)(cell).match(/[A-Za-z_][A-Za-z0-9_]*/g) || []))];
}
function csvVariableName(dataPath, reserved = []) {
	const occupied = new Set(reserved);
	if (!occupied.has("df")) return "df";
	const base = "df_" + (dataPath.split("/").at(-1).replace(/\.(csv|tsv|xlsx|xlsm|xls)$/i, "").replace(/[^A-Za-z0-9_]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 64) || "table");
	let name = base, index = 2;
	while (occupied.has(name)) name = base + "_" + index++;
	return name;
}
function excelVariableName(dataPath, sheet, reserved = []) {
	return csvVariableName(dataPath.split("/").at(-1).replace(/\.(xlsx|xlsm|xls)$/i, "") + "_" + sheet + ".csv", /* @__PURE__ */ new Set(["df", ...reserved]));
}
function csvReadCode(notebookPath, dataPath, separator, encoding, variable = "data", header = true) {
	if (!validCSVVariable(variable)) throw Error("Choose a valid, independent Python variable name. / 请输入有效的独立 Python 变量名。");
	if (![
		",",
		"	",
		";",
		"|",
		"auto"
	].includes(separator) || ![
		"utf-8-sig",
		"gb18030",
		"utf-16",
		"latin1"
	].includes(encoding)) throw Error("Invalid CSV delimiter or encoding. / CSV 分隔符或编码无效。");
	const relative = relativeNotebookDataPath(notebookPath, dataPath);
	return `import pandas as pd\n\n${variable} = pd.read_csv(${JSON.stringify(relative)}, sep=${separator === "auto" ? "None, engine=\"python\"" : JSON.stringify(separator)}, encoding=${JSON.stringify(encoding)}${header === false ? ", header=None" : ""})\n${variable}.head()`;
}
function excelReadCode(notebookPath, dataPath, sheet, header = true, variable = "data") {
	if (!validCSVVariable(variable)) throw Error("Choose a valid, independent Python variable name. / 请输入有效的独立 Python 变量名。");
	if (notebookDataFileKind(dataPath) !== "excel" || typeof sheet !== "string" || !sheet.length || sheet.includes("\0") || typeof header !== "boolean") throw Error("Choose a valid Excel workbook and worksheet. / 请选择有效的 Excel 文件和工作表。");
	const engine = /\.xls$/i.test(dataPath) ? "xlrd" : "openpyxl", relative = relativeNotebookDataPath(notebookPath, dataPath);
	return `import pandas as pd\n\n${variable} = pd.read_excel(${JSON.stringify(relative)}, sheet_name=${JSON.stringify(sheet)}, header=${header ? "0" : "None"}, engine=${JSON.stringify(engine)})\n${variable}.head()`;
}
function notebookDataReadCodes(notebookPath, items, reserved = [], legacyAlias = false) {
	if (!items.length) throw Error("Choose at least one CSV file or Excel worksheet. / 请至少选择一个 CSV 文件或 Excel 工作表。");
	const occupied = new Set(reserved), paths = /* @__PURE__ */ new Set();
	return items.map((item, index) => {
		const identity = notebookDataIdentity(item);
		if (paths.has(identity) || occupied.has(item.variable)) throw Error("Data sources and variable names must be independent. / 数据来源和变量名不能重复或覆盖现有变量。");
		paths.add(identity);
		occupied.add(item.variable);
		let code = item.kind === "excel" ? excelReadCode(notebookPath, item.path, item.sheet, item.header, item.variable) : csvReadCode(notebookPath, item.path, item.separator, item.encoding, item.variable, item.header ?? true);
		if (item.kind !== "excel" && legacyAlias && index === 0 && items.length === 1 && item.variable === "df" && !occupied.has("data")) code = code.replace("\ndf.head()", "\n# Compatibility with existing CSV export code\ndata = df\ndf.head()");
		return code;
	});
}
/** Existing CSV integrations keep their signature and compatibility alias. */
function csvReadCodes(notebookPath, items, reserved = [], legacyAlias = false) {
	return notebookDataReadCodes(notebookPath, items, reserved, legacyAlias);
}
function notebookCSVVariables(doc) {
	const names = /* @__PURE__ */ new Set();
	for (const cell of doc.cells) if (cell.cell_type === "code") for (const line of (0, open_source_inkspace_desktop_src_shared_notebook_format.notebookCellSource)(cell).split("\n")) {
		const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*pd\.read_(?:csv|excel)\s*\(/);
		if (match && validCSVVariable(match[1])) names.add(match[1]);
	}
	return [...names];
}
function csvExportCode(name = "results.csv", variable = "data") {
	if (!validCSVVariable(variable)) throw Error("Choose the DataFrame variable to export. / 请选择要导出的 DataFrame 变量。");
	return `from pathlib import Path\n\noutput_path = Path(${JSON.stringify(name)})\n${variable}.to_csv(output_path, index=False, encoding="utf-8-sig", mode="x")\nprint(output_path.resolve())`;
}
//#endregion
exports.csvExportCode = csvExportCode;
exports.csvReadCode = csvReadCode;
exports.csvReadCodes = csvReadCodes;
exports.csvVariableName = csvVariableName;
exports.excelReadCode = excelReadCode;
exports.excelVariableName = excelVariableName;
exports.insertNotebookCode = insertNotebookCode;
exports.mergeNotebookCells = mergeNotebookCells;
exports.notebookCSVVariables = notebookCSVVariables;
exports.notebookDataFileKind = notebookDataFileKind;
exports.notebookDataIdentity = notebookDataIdentity;
exports.notebookDataReadCodes = notebookDataReadCodes;
exports.notebookIdentifiers = notebookIdentifiers;
exports.pasteNotebookCells = pasteNotebookCells;
exports.relativeNotebookDataPath = relativeNotebookDataPath;
exports.selectedCellIndices = selectedCellIndices;
exports.splitNotebookCell = splitNotebookCell;
exports.validCSVVariable = validCSVVariable;

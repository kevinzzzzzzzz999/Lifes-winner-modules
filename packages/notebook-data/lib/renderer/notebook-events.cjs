Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let open_source_inkspace_desktop_src_shared_notebook_format = require("../shared/notebook-format.cjs");
//#region open-source/inkspace/desktop/src/renderer/notebook-events.ts
/** Apply only outputs for the exact cell sources submitted to this run. */
function applyNotebookEvents(current, submitted, events, deferredClear) {
	const doc = (0, open_source_inkspace_desktop_src_shared_notebook_format.parseNotebook)(current), source = (0, open_source_inkspace_desktop_src_shared_notebook_format.parseNotebook)(submitted);
	if (doc.cells.length !== source.cells.length || doc.cells.some((cell, i) => cell.cell_type !== source.cells[i].cell_type || (0, open_source_inkspace_desktop_src_shared_notebook_format.notebookCellSource)(cell) !== (0, open_source_inkspace_desktop_src_shared_notebook_format.notebookCellSource)(source.cells[i]))) throw Error("Notebook source changed while running; current edits were preserved.");
	const next = {
		...doc,
		cells: doc.cells.map((c) => ({
			...c,
			outputs: c.outputs ? [...c.outputs] : void 0
		}))
	};
	for (const cell of next.cells) if (cell.outputs === void 0) delete cell.outputs;
	for (const event of events) {
		const index = event.cellIndex;
		if (index === void 0 || !Number.isInteger(index) || index < 0 || index >= next.cells.length) continue;
		const cell = next.cells[index];
		if (cell.cell_type !== "code") continue;
		if (event.kind === "cell-start") {
			cell.outputs = [];
			cell.execution_count = event.executionCount ?? null;
			deferredClear.delete(index);
		} else if (event.kind === "clear-output") {
			if (event.wait) deferredClear.add(index);
			else {
				cell.outputs = [];
				deferredClear.delete(index);
			}
		} else if (event.kind === "output" && event.output) {
			if (deferredClear.delete(index)) cell.outputs = [];
			const outputs = cell.outputs || [], output = event.output, last = outputs.at(-1);
			if (output.output_type === "stream" && last?.output_type === "stream" && output.name === last.name) outputs[outputs.length - 1] = {
				...last,
				text: (0, open_source_inkspace_desktop_src_shared_notebook_format.notebookMultilineText)(last.text) + (0, open_source_inkspace_desktop_src_shared_notebook_format.notebookMultilineText)(output.text)
			};
			else outputs.push(output);
			cell.outputs = outputs;
		} else if (event.kind === "cell-end" && event.executionCount !== void 0) cell.execution_count = event.executionCount;
	}
	return (0, open_source_inkspace_desktop_src_shared_notebook_format.serializeNotebook)(next);
}
//#endregion
exports.applyNotebookEvents = applyNotebookEvents;

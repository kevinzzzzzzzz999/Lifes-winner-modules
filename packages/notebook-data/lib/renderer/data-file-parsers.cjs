Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/data-file-parsers.ts
/** Read-only RFC 4180-style scan. Storage is bounded independently of row count. */
function parseDelimited(text, delimiter, options = {}) {
	const start = Math.max(0, Math.trunc(options.startRow || 0)), limit = Math.min(1e3, Math.max(0, options.maxRows ?? 100)), maxCols = Math.min(200, Math.max(1, options.maxColumns ?? 100)), maxChars = Math.min(2e4, Math.max(1, options.maxCellChars ?? 2e3));
	const result = {
		rows: [],
		firstRow: [],
		rowCount: 0,
		columnCount: 0,
		inconsistentRows: 0,
		malformed: false,
		truncatedCells: false
	};
	let row = [], field = "", column = 0, quoted = false, closed = false, fieldStart = true, rowStarted = false, firstColumns = 0;
	const retain = () => result.rowCount === 0 || result.rowCount >= start && result.rowCount < start + limit;
	const append = (value) => {
		if (retain() && column < maxCols) {
			if (field.length < maxChars) field += value.slice(0, maxChars - field.length);
			else result.truncatedCells = true;
		}
	};
	const endField = () => {
		if (retain() && column < maxCols) row.push(field);
		column++;
		field = "";
		fieldStart = true;
		closed = false;
	};
	const endRow = () => {
		endField();
		if (result.rowCount === 0) {
			result.firstRow = row;
			firstColumns = column;
		} else if (column !== firstColumns) result.inconsistentRows++;
		if (result.rowCount >= start && result.rowCount < start + limit) result.rows.push({
			index: result.rowCount,
			cells: row
		});
		result.rowCount++;
		result.columnCount = Math.max(result.columnCount, column);
		column = 0;
		row = [];
		rowStarted = false;
	};
	for (let i = text.charCodeAt(0) === 65279 ? 1 : 0; i < text.length; i++) {
		const c = text[i];
		rowStarted = true;
		if (quoted) {
			if (c === "\"") {
				if (text[i + 1] === "\"") {
					append("\"");
					i++;
				} else {
					quoted = false;
					closed = true;
				}
			} else append(c);
			continue;
		}
		if (c === delimiter) {
			endField();
			continue;
		}
		if (c === "\n" || c === "\r") {
			endRow();
			if (c === "\r" && text[i + 1] === "\n") i++;
			if (options.scanRows && result.rowCount >= options.scanRows) return result;
			continue;
		}
		if (c === "\"" && fieldStart) {
			quoted = true;
			fieldStart = false;
			continue;
		}
		if (closed || c === "\"") result.malformed = true;
		fieldStart = false;
		append(c);
	}
	if (quoted) result.malformed = true;
	if (rowStarted || column > 0) endRow();
	return result;
}
function detectDelimiter(text) {
	const candidates = [
		",",
		"	",
		";",
		"|"
	];
	let best = ",", score = 0;
	for (const delimiter of candidates) {
		const sample = parseDelimited(text.slice(0, 262144), delimiter, {
			maxRows: 32,
			scanRows: 32,
			maxCellChars: 1
		});
		const widths = sample.rows.map((row) => row.cells.length);
		const frequencies = /* @__PURE__ */ new Map();
		for (const width of widths) if (width > 1) frequencies.set(width, (frequencies.get(width) || 0) + 1);
		for (const [width, count] of frequencies) {
			const candidate = count / Math.max(1, widths.length) * 100 + Math.min(10, width) - Number(sample.malformed) * 2;
			if (candidate > score) {
				score = candidate;
				best = delimiter;
			}
		}
	}
	return best;
}
//#endregion
exports.detectDelimiter = detectDelimiter;
exports.parseDelimited = parseDelimited;

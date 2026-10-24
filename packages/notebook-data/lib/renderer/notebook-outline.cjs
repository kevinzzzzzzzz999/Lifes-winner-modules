Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let marked = require("marked");
//#region open-source/inkspace/desktop/src/renderer/notebook-outline.ts
const entityNames = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: "\"",
	apos: "'",
	nbsp: " "
};
function decodeEntities(text) {
	return text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (raw, name) => {
		if (name[0] !== "#") return entityNames[name.toLowerCase()] || raw;
		const value = name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : Number(name.slice(1));
		return value >= 32 && value <= 1114111 && !(value >= 55296 && value <= 57343) ? String.fromCodePoint(value) : "";
	});
}
/** Read inline token labels, never href/src, attributes, or raw HTML. */
function inlineText(tokens) {
	let text = "", unsafeTag = "";
	for (const token of tokens) {
		if (token.type === "html") {
			const html = token.raw.trim();
			if (/^<(script|style|iframe|object|template)\b/i.test(html)) unsafeTag = /^<(\w+)/.exec(html)?.[1].toLowerCase() || "";
			if (unsafeTag && new RegExp(`</${unsafeTag}\\s*>`, "i").test(html)) unsafeTag = "";
			continue;
		}
		if (unsafeTag) continue;
		if ("tokens" in token && Array.isArray(token.tokens)) text += inlineText(token.tokens);
		else if ("text" in token && typeof token.text === "string") text += token.text;
		else if (token.type === "br") text += " ";
	}
	return text;
}
/** Use the same Markdown lexer as the reader: fenced/indented code and HTML blocks stay opaque. */
function buildNotebookOutline(cells) {
	const result = [], parents = [];
	const counts = /* @__PURE__ */ new Map();
	for (const cell of cells) if (cell.id) counts.set(cell.id, (counts.get(cell.id) || 0) + 1);
	cells.forEach((cell, cellIndex) => {
		if (cell.cell_type !== "markdown") return;
		const source = typeof cell.source === "string" ? cell.source : cell.source.join("");
		const cellID = cell.id && counts.get(cell.id) === 1 ? cell.id : void 0;
		let headingIndex = 0;
		const walk = (tokens) => {
			for (const token of tokens) if (token.type === "heading") {
				const level = token.depth;
				const text = decodeEntities(inlineText(token.tokens || marked.Lexer.lexInline(token.text))).replace(/\s+/g, " ").trim();
				const ordinal = headingIndex++;
				if (!text) continue;
				while (parents.length && parents[parents.length - 1].level >= level) parents.pop();
				const parent = parents[parents.length - 1];
				const heading = {
					id: `${cellID ? "id:" + cellID : "index:" + cellIndex}:${ordinal}`,
					cellIndex,
					...cellID ? { cellID } : {},
					headingIndex: ordinal,
					level,
					depth: parents.length,
					text,
					...parent ? { parentID: parent.id } : {},
					hasChildren: false
				};
				if (parent) parent.hasChildren = true;
				result.push(heading);
				parents.push(heading);
			} else if (token.type === "blockquote") walk(token.tokens || []);
			else if (token.type === "list") for (const item of token.items) walk(item.tokens);
		};
		walk(marked.Lexer.lex(source, { gfm: true }));
	});
	return result;
}
/** Linear filtering remains bounded by the document's heading count; no recursive UI tree. */
function visibleNotebookHeadings(headings, collapsedIDs) {
	const collapsed = new Set(collapsedIDs), hidden = /* @__PURE__ */ new Set();
	return headings.filter((heading) => {
		if (heading.parentID && (collapsed.has(heading.parentID) || hidden.has(heading.parentID))) {
			hidden.add(heading.id);
			return false;
		}
		return true;
	});
}
/** A cell without a heading belongs to the last preceding section. */
function notebookReadingHeading(headings, cellIndex, headingIndex = Infinity) {
	let current;
	for (const heading of headings) {
		if (heading.cellIndex > cellIndex || heading.cellIndex === cellIndex && heading.headingIndex > headingIndex) break;
		current = heading;
	}
	return current;
}
//#endregion
exports.buildNotebookOutline = buildNotebookOutline;
exports.notebookReadingHeading = notebookReadingHeading;
exports.visibleNotebookHeadings = visibleNotebookHeadings;

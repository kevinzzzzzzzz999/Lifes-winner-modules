// Pure text/workspace rules. Browser ES module; no network or runtime packages.
export const MAX_BYTES = 512 * 1024;
export const MAX_TABS = 12;
export const MAX_DRAFTS = 24;
export const MAX_DRAFT_BYTES = 3 * 1024 * 1024;
export const TEXT_EXTENSIONS = Object.freeze(['txt', 'md', 'markdown', 'json', 'csv', 'tsv', 'log', 'html', 'htm', 'xml', 'yaml', 'yml', 'css', 'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'py', 'swift', 'tex', 'ipynb', 'sql', 'toml', 'ini', 'cfg']);
const encoder = new TextEncoder();

export class DocumentError extends Error {
  constructor(code, message) { super(message); this.name = 'DocumentError'; this.code = code; }
}
function fail(code, message) { throw new DocumentError(code, message); }
export function validName(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 160 || /[\x00-\x1f\x7f-\x9f/\\:]/u.test(value)) {
    fail('NAME', '请输入不超过 160 个字符的文件名，不要包含斜线或控制字符。');
  }
  return value.trim().normalize('NFC');
}
export function textBytes(text) {
  if (typeof text !== 'string') fail('TEXT', '这不是可读取的文本。');
  const size = encoder.encode(text).byteLength;
  if (size > MAX_BYTES) fail('LARGE', '文本超过 512 KiB，请选择或保留更小的文本。');
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/u.test(text)) fail('BINARY', '文件含有非文本内容，当前只支持 UTF-8 文本。请用适合的软件打开此类型。');
  // Unpaired surrogates would be silently replaced by TextEncoder.
  if (typeof text.isWellFormed === 'function' && !text.isWellFormed()) fail('ENCODING', '文本包含无法保存的字符，请重新输入这一段。');
  return size;
}
function binarySignature(bytes) {
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 24));
  return /^(%PDF-|\{\\rtf|GIF8[79]a|RIFF|OggS|SQLite format 3)/u.test(head)
    || (bytes[0] === 0x50 && bytes[1] === 0x4b && [3, 5, 7].includes(bytes[2]))
    || (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
    || (bytes[0] === 0xff && bytes[1] === 0xd8);
}
export function decodeSelectedBytes(name, value) {
  name = validName(name);
  const extension = name.split('.').at(-1).toLowerCase();
  if (!name.includes('.') || name.startsWith('.') || !TEXT_EXTENSIONS.includes(extension)) {
    fail('TYPE', '当前只支持常见文本、Markdown、代码和 Notebook 源文件。请用适合的软件打开此类型。');
  }
  if (!(value instanceof Uint8Array) && !(value instanceof ArrayBuffer)) fail('FILE', '没有收到有效的文本文件数据，请重新选择。');
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  if (bytes.byteLength > MAX_BYTES) fail('LARGE', '文件超过 512 KiB，请选择较小的文本文件。');
  if (binarySignature(bytes)) fail('BINARY', '这看起来是 PDF、图片或其他非文本文件。当前只支持 UTF-8 文本预览。');
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { fail('ENCODING', '无法按 UTF-8 读取。请先在原软件中另存为 UTF-8 文本。'); }
  textBytes(text);
  return { name, text, bytes: bytes.byteLength };
}
export async function readSelectedFile(file) {
  if (!file || !Number.isSafeInteger(file.size) || file.size < 0) fail('FILE', '没有收到有效文件，请重新选择。');
  if (file.size > MAX_BYTES) fail('LARGE', '文件超过 512 KiB，请选择较小的文本文件。');
  // Reject unknown filenames before asking the browser to read any content.
  decodeSelectedBytes(file.name, new Uint8Array());
  let buffer;
  try { buffer = await file.arrayBuffer(); }
  catch { fail('READ', '文件暂时无法读取。请先在“文件”中下载到本机，再重试。'); }
  return decodeSelectedBytes(file.name, buffer);
}
export function exportFilename(name, fallback = '文档') {
  name = validName(name);
  const base = name.replace(/\.[^.]+$/u, '').replace(/^\.+/u, '').trim() || validName(fallback);
  return base + '.txt';
}
export function createTextBlob(text) { textBytes(text); return new Blob([encoder.encode(text)], { type: 'text/plain;charset=utf-8' }); }
export function makeDocument({ name = '未命名.txt', text = '', id = crypto.randomUUID(), savedId = null, isNew = false } = {}) {
  textBytes(text);
  return { id, name: validName(name), text, savedId, baselineText: text, baselineName: validName(name), isNew, editing: isNew };
}
export function isDirty(document) { return document.isNew || document.text !== document.baselineText || document.name !== document.baselineName; }
export function markSaved(document, id) {
  document.savedId = id; document.baselineText = document.text; document.baselineName = document.name; document.isNew = false;
}
export class Workspace {
  constructor() { this.documents = []; this.activeId = null; }
  get active() { return this.documents.find(document => document.id === this.activeId) || null; }
  add(document) {
    if (this.documents.length >= MAX_TABS) fail('TABS', '最多同时打开 12 份文档。请先关闭一个标签，再打开其他文件。');
    this.documents.push(document); this.activeId = document.id; return document;
  }
  import(payload) {
    const existing = this.documents.find(document => document.name === payload.name && document.text === payload.text);
    if (existing) { this.activeId = existing.id; return existing; }
    return this.add(makeDocument(payload));
  }
  openDraft(record) {
    const existing = this.documents.find(document => document.savedId === record.id);
    if (existing) { this.activeId = existing.id; return existing; }
    return this.add(makeDocument({ name: record.name, text: record.text, savedId: record.id }));
  }
  close(id, discard = false) {
    const index = this.documents.findIndex(document => document.id === id);
    if (index < 0) return;
    if (isDirty(this.documents[index]) && !discard) fail('UNSAVED', '这份副本还有未保存的修改。');
    this.documents.splice(index, 1);
    if (this.activeId === id) this.activeId = this.documents[Math.min(index, this.documents.length - 1)]?.id || null;
  }
}
export function validateDrafts(value) {
  if (!Array.isArray(value) || value.length > MAX_DRAFTS) fail('STORAGE', '本机草稿数据无法读取。请保留已打开的内容并导出，稍后重试。');
  let total = 0;
  const ids = new Set();
  const output = value.map(record => {
    if (!record || typeof record !== 'object' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/iu.test(record.id) || ids.has(record.id) || typeof record.updatedAt !== 'string' || !Number.isFinite(Date.parse(record.updatedAt))) {
      fail('STORAGE', '本机草稿数据无法读取，请从已导出的文本文件重新打开。');
    }
    ids.add(record.id); total += textBytes(record.text);
    return { id: record.id, name: validName(record.name), text: record.text, updatedAt: record.updatedAt };
  });
  if (total > MAX_DRAFT_BYTES) fail('STORAGE', '本机草稿总量超过 3 MiB。请先导出并删除不需要的草稿。');
  return output;
}
export function upsertDraft(records, document, now = new Date().toISOString()) {
  const id = document.savedId || document.id;
  const next = records.filter(record => record.id !== id);
  next.unshift({ id, name: validName(document.name), text: document.text, updatedAt: now });
  return { records: validateDrafts(next), id };
}
export function formatSize(bytes) { return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KiB`; }

// Display-only localization. Error codes, stored records and filenames stay compatible.
const ENGLISH_ERRORS = Object.freeze({
  NAME: 'Use a name of up to 160 characters without path separators or control characters.',
  TEXT: 'This is not readable text.',
  LARGE: 'Text must be 512 KiB or smaller. Choose a smaller file or reduce the content; previous data is kept.',
  BINARY: 'This file contains non-text data. Use a suitable app; this workbench reads UTF-8 text only.',
  ENCODING: 'This is not valid UTF-8. Save a UTF-8 text copy in the original app, then try again.',
  TYPE: 'Choose a supported text, Markdown, code or Notebook source file. Open other formats in a suitable app.',
  FILE: 'No valid file data was received. Please select the file again.',
  READ: 'The file cannot be read right now. Download it in Files first, then try again.',
  TABS: 'Up to 12 documents can be open. Close a tab before opening another file.',
  UNSAVED: 'This copy has unsaved changes.',
  STORAGE: 'Local drafts are invalid or exceed 24 drafts / 3 MiB. Export important text and remove unused drafts.',
  NO_DOCUMENT: 'Open or create a text document first.',
  STORAGE_READ: 'Local drafts cannot be read. You can still open, edit and export text; existing drafts will not be overwritten.',
  SAVE: 'Saving failed. Browser storage is unavailable or full. Export to Files before checking storage space.',
  DELETE: 'Deletion failed; the saved draft is still kept. Check browser storage and try again.',
  EXPORT: 'Export is unavailable. Tap again or use Share / Save to Files.',
  SHARE: 'Sharing is unavailable. Tap Share again or use Export .txt to keep a copy.'
});
export function errorText(error, language = 'zh') {
  if (language === 'en') return ENGLISH_ERRORS[error?.code] || 'The action could not be completed. Please try again.';
  return error instanceof Error ? error.message : '暂时无法完成，请重试。';
}

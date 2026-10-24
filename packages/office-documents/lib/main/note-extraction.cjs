'use strict';
// The original application App.tsx extraction/margin-note workflow, separated
// into pure document plans and explicit host callbacks. No application globals.
const path = require('node:path');
const { fail } = require('./errors.cjs');
const { validateModel } = require('./editable-document-model.cjs');
const MAX_NOTE_TEXT = 2 * 1024 * 1024;

function sourceIdentity(input) {
  const sourcePath = input?.path;
  if (typeof sourcePath !== 'string' || !sourcePath || sourcePath.length > 4096 ||
      sourcePath.startsWith('/') || /[\\\u0000-\u001f]/.test(sourcePath) ||
      sourcePath.split('/').some(p => !p || p === '.' || p === '..')) fail('INVALID_REQUEST');
  const name = input.name ?? path.posix.basename(sourcePath);
  if (typeof name !== 'string' || !name || name.length > 1024 || /[/\\\u0000-\u001f]/.test(name)) fail('INVALID_REQUEST');
  return { path: sourcePath, name, parentPath: path.posix.dirname(sourcePath) === '.' ? '' : path.posix.dirname(sourcePath) };
}
function sourceHeading(name, language) {
  return '# ' + name + '\n\n[' + (language === 'zh' ? '原文件' : 'Source file') + '](' + encodeURIComponent(name) + ')\n\n';
}
function modelMarkdown(value) {
  const model = validateModel(value);
  const blocks = values => values.map(b => (b.kind === 'heading' ? '## ' : b.kind === 'bullet' ? '- ' : '') + b.text).join('\n\n');
  return model.format === 'pptx'
    ? model.slides.map(s => '# ' + s.title + '\n\n' + blocks(s.blocks)).join('\n\n---\n\n')
    : '# ' + model.title + '\n\n' + blocks(model.blocks);
}
function extractedNoteDocument(input) {
  const source = sourceIdentity(input);
  const text = input.text;
  if (typeof text !== 'string' || !text.trim() || text.includes('\0')) fail('INVALID_TEXT');
  if (Buffer.byteLength(text, 'utf8') > MAX_NOTE_TEXT) fail('TOO_LARGE');
  const truncated = input.truncated === true;
  const warning = truncated ? (input.language === 'zh' ? '> 提取达到长度限制，以下不是完整原文。\n\n' : '> Extraction reached its limit; this is not the complete source.\n\n') : '';
  return { parentPath: source.parentPath, name: source.name + (input.language === 'zh' ? '.提取.md' : '.extracted.md'),
    content: sourceHeading(source.name, input.language) + warning + text, truncated };
}
async function extractNote(input, host = {}) {
  sourceIdentity(input);
  let extracted;
  if (input.model) extracted = { text: modelMarkdown(input.model), truncated: false };
  else if (typeof input.text === 'string') extracted = { text: input.text, truncated: input.truncated === true };
  else if (input.kind === 'pdf' && typeof host.extractPDFText === 'function') extracted = await host.extractPDFText(input);
  else if (typeof input.html === 'string' && typeof host.htmlToText === 'function') extracted = { text: await host.htmlToText(input.html), truncated: false };
  else fail('INVALID_REQUEST');
  const document = extractedNoteDocument({ ...input, ...extracted });
  if (typeof host.createTextFile === 'function') return { ...document, created: await host.createTextFile(document) };
  return document;
}
function marginNoteDocument(input) {
  const source = sourceIdentity(input);
  return { parentPath: source.parentPath, name: source.name + '.notes.md', content: sourceHeading(source.name, input.language) };
}
function appendMarginImage(text, image) {
  if (typeof text !== 'string' || typeof image?.name !== 'string' || !image.name || /[/\\\u0000-\u001f]/.test(image.name)) fail('INVALID_REQUEST');
  const result = text + '\n\n![' + image.name.replace(/[\[\]]/g, '') + '](' + encodeURIComponent(image.name) + ')\n';
  if (Buffer.byteLength(result, 'utf8') > MAX_NOTE_TEXT) fail('TOO_LARGE');
  return result;
}
module.exports = { extractNote, extractedNoteDocument, modelMarkdown, marginNoteDocument, appendMarginImage, MAX_NOTE_TEXT };

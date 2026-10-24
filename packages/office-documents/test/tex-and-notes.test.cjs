'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const tools = require('..');
const notes = tools.noteExtraction;
const hash = data => crypto.createHash('sha256').update(data).digest('hex');

test('editable-document extraction preserves headings and source references', async () => {
  const result = await notes.extractNote({ path: 'documents/Example.docx', language: 'en', model: {
    version: 1, format: 'docx', title: 'Notes', blocks: [{ kind: 'heading', text: 'Topic' }, { kind: 'bullet', text: 'Point' }]
  }});
  assert.equal(result.parentPath, 'documents');
  assert.equal(result.name, 'Example.docx.extracted.md');
  assert.match(result.content, /\[Source file\]\(Example.docx\)/);
  assert.match(result.content, /## Topic\n\n- Point/);
});
test('PDF extraction uses an explicit host parser and reports truncated content', async () => {
  let saved = 0;
  const result = await notes.extractNote({ path: 'Example.pdf', kind: 'pdf', language: 'zh' }, {
    extractPDFText: async request => { assert.equal(request.path, 'Example.pdf'); return { text: 'Synthetic paragraph', truncated: true }; },
    createTextFile: async document => { saved++; return { path: document.name }; }
  });
  assert.equal(saved, 1); assert.equal(result.parentPath, '');
  assert.equal(result.created.path, 'Example.pdf.提取.md');
  assert.match(result.content, /不是完整原文/);
});
test('HTML extraction and margin documents work without application state', async () => {
  const result = await notes.extractNote({ path: 'Folder/Example.html', html: '<p>Text</p>' }, { htmlToText: html => html.replace(/<[^>]*>/g, '') });
  assert.match(result.content, /\n\nText$/);
  const margin = notes.marginNoteDocument({ path: 'Folder/My file.pdf' });
  assert.equal(margin.name, 'My file.pdf.notes.md');
  assert.match(margin.content, /My%20file.pdf/);
  assert.match(notes.appendMarginImage(margin.content, { name: 'figure 1.png' }), /figure%201.png/);
});
test('empty extraction never publishes a file, and missing parser is explicit', async () => {
  let published = false;
  await assert.rejects(notes.extractNote({ path: 'scan.pdf', kind: 'pdf' }, { extractPDFText: async () => ({ text: '' }), createTextFile: () => { published = true; } }), { code: 'INVALID_TEXT' });
  assert.equal(published, false);
  await assert.rejects(notes.extractNote({ path: 'scan.pdf', kind: 'pdf' }), { code: 'INVALID_REQUEST' });
});
test('document plans reject escaping paths and oversize text', () => {
  for (const p of ['../private.pdf', '/absolute.pdf', 'a/../b.pdf', 'a\\b.pdf']) assert.throws(() => notes.marginNoteDocument({ path: p }), { code: 'INVALID_REQUEST' });
  assert.throws(() => notes.extractedNoteDocument({ path: 'a.pdf', text: 'x'.repeat(notes.MAX_NOTE_TEXT + 1) }), { code: 'TOO_LARGE' });
});
test('editable PDF creation and reading preserve the original document model', async () => {
  const { PDFDocument } = require('pdf-lib');
  const model = { version: 1, format: 'pdf', title: 'Example', blocks: [{ kind: 'paragraph', text: 'Independent PDF' }] };
  const bytes = await tools.pdf.createEditablePDF(model, async value => {
    const pdf = await PDFDocument.create(); pdf.addPage().drawText(value.title); return pdf.save();
  });
  assert.deepEqual(await tools.pdf.readPDFModel(bytes), model);
  assert.equal(await tools.pdf.readPDFModel(Buffer.concat([bytes, Buffer.from('\nchanged')])), null);
});
test('PDF APIs make renderer requirements explicit and do not import Electron', async () => {
  const model = { version: 1, format: 'pdf', title: 'Example', blocks: [] };
  await assert.rejects(tools.pdf.createEditablePDF(model), { code: 'EXPORT_FAILED' });
  await assert.rejects(tools.pdf.printDocumentPDF(model), { code: 'EXPORT_FAILED' });
  assert.equal(await tools.pdf.readPDFModel(Buffer.from('%PDF-1.7\nordinary')), null);
});
test('TeX service exposes explicit runtime availability without touching source', async () => {
  const service = new tools.tex.TexService({ runtimePath: path.join(os.tmpdir(), 'no-such-inkspace-runtime'), dataDirectory: os.tmpdir(), vaultService: {} });
  assert.deepEqual(await service.info(), { available: false });
  assert.equal((await service.compile({ path: 'a.tex', expectedSHA256: '0'.repeat(64) })).path, null);
  service.dispose();
});
test('TeX cache seeding rejects links and preserves existing cache bytes', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'inkspace-tex-cache-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
  const source = path.join(root, 'source'), dest = path.join(root, 'dest'); await fs.mkdir(source); await fs.mkdir(dest);
  await fs.writeFile(path.join(source, 'cached'), 'new'); await fs.writeFile(path.join(dest, 'cached'), 'existing');
  await tools.tex.seedLatexCache(source, dest); assert.equal(await fs.readFile(path.join(dest, 'cached'), 'utf8'), 'existing');
  await fs.symlink(path.join(source, 'cached'), path.join(source, 'link'));
  await assert.rejects(tools.tex.seedLatexCache(source, dest));
});
test('TeX process adapter publishes a new PDF and protects a changed source snapshot', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'inkspace-tex-process-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
  const runtime = path.join(root, 'synthetic-compiler');
  // This validates the process/publication protocol, not the real Tectonic engine.
  await fs.writeFile(runtime, '#!' + process.execPath + '\n' + "const fs=require('node:fs'),path=require('node:path');const a=process.argv.slice(2);if(!a.includes('--untrusted')||process.env.TECTONIC_UNTRUSTED_MODE!=='1')process.exit(2);fs.writeFileSync(path.join(a[a.indexOf('--outdir')+1],'source.pdf'),'%PDF-1.7\\nsynthetic\\n%%EOF');", { mode: 0o700 });
  const data = Buffer.from('Synthetic TeX source'); let writes = [];
  const service = new tools.tex.TexService({ runtimePath: runtime, dataDirectory: root, vaultService: {
    snapshot: async () => ({ data, sha256: hash(data) }),
    createData: async (id, parent, name, bytes) => { writes.push({ id, parent, name, bytes }); return { path: parent + '/' + name }; }
  }});
  const result = await service.compile({ vaultId: 'synthetic', path: 'docs/a.tex', expectedSHA256: hash(data) });
  assert.equal(writes.length, 1); assert.match(result.path, /^docs\/a\.compiled-/); assert.equal(writes[0].bytes.subarray(0, 5).toString(), '%PDF-');
  await assert.rejects(service.compile({ vaultId: 'synthetic', path: 'docs/a.tex', expectedSHA256: '0'.repeat(64) }), { code: 'CONFLICT' });
  assert.equal(writes.length, 1); service.dispose();
});

// Run: node tests.mjs. No npm packages or browser globals are needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
// logic.js is a browser module. A data URL makes this test independent of the
// enclosing workspace's package.json module setting.
const source = await readFile(new URL('./logic.js', import.meta.url), 'utf8');
const api = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const bytes = value => new TextEncoder().encode(value);
const id = index => `11111111-1111-4111-8111-${String(index).padStart(12, '0')}`;
const record = (index, text = 'Synthetic') => ({ id: id(index), name: `note-${index}.txt`, text, updatedAt: '2026-01-01T00:00:00.000Z' });

test('UTF-8 Chinese, emoji, tabs/newlines, empty file and BOM decode correctly', () => {
  assert.equal(api.decodeSelectedBytes('笔记.MD', bytes('中文 🙂\tline\r\n')).text, '中文 🙂\tline\r\n');
  assert.equal(api.decodeSelectedBytes('empty.txt', new Uint8Array()).text, '');
  assert.equal(api.decodeSelectedBytes('bom.txt', new Uint8Array([239,187,191,65])).text, 'A');
});
test('512 KiB boundary uses encoded bytes, including multibyte text', () => {
  assert.equal(api.decodeSelectedBytes('limit.txt', new Uint8Array(api.MAX_BYTES).fill(65)).bytes, api.MAX_BYTES);
  assert.throws(() => api.decodeSelectedBytes('large.txt', new Uint8Array(api.MAX_BYTES + 1)), { code: 'LARGE' });
  assert.throws(() => api.textBytes('中'.repeat(180000)), { code: 'LARGE' });
});
test('unknown and binary extensions are rejected before content is read', async () => {
  let reads = 0;
  await assert.rejects(api.readSelectedFile({ name: 'sample.pdf', size: 20, arrayBuffer() { reads++; return bytes('PDF'); } }), { code: 'TYPE' });
  await assert.rejects(api.readSelectedFile({ name: 'large.txt', size: api.MAX_BYTES + 1, arrayBuffer() { reads++; } }), { code: 'LARGE' });
  assert.equal(reads, 0);
  for (const name of ['notes', '.env', 'archive.zip', 'picture.png']) assert.throws(() => api.decodeSelectedBytes(name, bytes('Synthetic')), { code: 'TYPE' });
});
test('renamed PDF, rich text, GIF, ZIP, PNG and NUL content are rejected', () => {
  for (const data of [bytes('%PDF-1.7'), bytes('{\\rtf1 Synthetic}'), bytes('GIF89a'), new Uint8Array([80,75,3,4,1]), new Uint8Array([137,80,78,71]), bytes('text\0binary')]) {
    assert.throws(() => api.decodeSelectedBytes('renamed.txt', data), { code: 'BINARY' });
  }
});
test('malformed UTF-8 and UTF-16 input fail without replacement-character decoding', () => {
  for (const data of [new Uint8Array([255,254,65,0]), new Uint8Array([0xc3,0x28]), new Uint8Array([0xe2,0x82])]) {
    assert.throws(() => api.decodeSelectedBytes('bad.txt', data), { code: 'ENCODING' });
  }
});
test('control characters are rejected while HTML and Markdown remain literal text', () => {
  for (const data of ['A\u0001B', 'A\u007fB', 'A\u0081B']) assert.throws(() => api.textBytes(data), { code: 'BINARY' });
  const html = '<script>globalThis.pwned=true</script><img src=x onerror=alert(1)>';
  assert.equal(api.decodeSelectedBytes('source.html', bytes(html)).text, html);
  assert.equal(api.decodeSelectedBytes('note.md', bytes('# Title')).text, '# Title');
});
test('read errors are actionable and post-read size is revalidated', async () => {
  await assert.rejects(api.readSelectedFile({ name: 'cloud.txt', size: 1, arrayBuffer: async () => { throw Error('provider'); } }), { code: 'READ' });
  await assert.rejects(api.readSelectedFile({ name: 'growth.txt', size: 1, arrayBuffer: async () => new Uint8Array(api.MAX_BYTES + 1).buffer }), { code: 'LARGE' });
  assert.equal((await api.readSelectedFile({ name: 'fine.txt', size: 2, arrayBuffer: async () => bytes('OK').buffer })).text, 'OK');
});
test('names cannot introduce paths or controls; export always creates a plain .txt copy', () => {
  for (const name of ['../note.txt', 'a\\b.txt', 'a\nb.txt', '', 'x'.repeat(161)]) assert.throws(() => api.validName(name), { code: 'NAME' });
  assert.equal(api.exportFilename('source.html'), 'source.txt');
  assert.equal(api.exportFilename('笔记.md'), '笔记.txt');
});
test('export Blob is UTF-8 plain text with exact literal contents', async () => {
  const text = '<script>literal</script>\n中文'; const blob = api.createTextBlob(text);
  assert.equal(blob.type, 'text/plain;charset=utf-8'); assert.equal(await blob.text(), text); assert.equal(blob.size, bytes(text).length);
});
test('workspace import deduplicates without replacing another draft', () => {
  const workspace = new api.Workspace(); const first = workspace.import({ name: 'one.md', text: 'One' });
  workspace.import({ name: 'two.txt', text: 'Two' });
  assert.equal(workspace.import({ name: 'one.md', text: 'One' }).id, first.id); assert.equal(workspace.documents.length, 2);
  first.text = 'Unsaved change'; workspace.import({ name: 'one.md', text: 'One' }); assert.equal(first.text, 'Unsaved change'); assert.equal(workspace.documents.length, 3);
});
test('saved draft reopening focuses existing unsaved content rather than overwriting it', () => {
  const workspace = new api.Workspace(); const first = workspace.openDraft(record(1)); first.text = 'Unsaved';
  assert.equal(workspace.openDraft(record(1)), first); assert.equal(first.text, 'Unsaved'); assert.equal(workspace.documents.length, 1);
});
test('tab limit and dirty-close protection preserve data', () => {
  const workspace = new api.Workspace();
  for (let index = 0; index < api.MAX_TABS; index++) workspace.add(api.makeDocument({ id: id(index), isNew: true }));
  assert.throws(() => workspace.add(api.makeDocument()), { code: 'TABS' });
  const first = workspace.documents[0]; assert.throws(() => workspace.close(first.id), { code: 'UNSAVED' });
  workspace.close(first.id, true); assert.equal(workspace.documents.length, api.MAX_TABS - 1);
});
test('new/edited copies are dirty and become clean only after successful save marking', () => {
  const document = api.makeDocument({ id: id(1), isNew: true }); assert.equal(api.isDirty(document), true);
  api.markSaved(document, id(1)); assert.equal(api.isDirty(document), false);
  document.text = 'Changed'; assert.equal(api.isDirty(document), true); api.markSaved(document, id(1)); assert.equal(api.isDirty(document), false);
});
test('draft storage has a strict own-record schema and rejects corrupt IDs/duplicates', () => {
  assert.equal(api.validateDrafts([record(1)])[0].text, 'Synthetic');
  for (const value of [null, {}, [record(1), record(1)], [{ ...record(1), id: '-'.repeat(36) }], [{ ...record(1), updatedAt: 'invalid' }], [{ ...record(1), name: '../secret.txt' }]]) assert.throws(() => api.validateDrafts(value));
  const output = api.validateDrafts([{ ...record(1), externalPath: 'synthetic-unused' }])[0]; assert.equal(Object.hasOwn(output, 'externalPath'), false);
});
test('draft count and aggregate text capacity are bounded', () => {
  assert.throws(() => api.validateDrafts(Array.from({ length: api.MAX_DRAFTS + 1 }, (_, index) => record(index))), { code: 'STORAGE' });
  assert.throws(() => api.validateDrafts(Array.from({ length: 7 }, (_, index) => record(index, 'A'.repeat(api.MAX_BYTES)))), { code: 'STORAGE' });
});
test('upsert returns a new record collection and never marks visible document saved itself', () => {
  const document = api.makeDocument({ id: id(1), name: 'local.txt', text: 'Content', isNew: true });
  const original = [record(2)]; const result = api.upsertDraft(original, document, '2026-01-01T00:00:00.000Z');
  assert.equal(original.length, 1); assert.equal(result.records.length, 2); assert.equal(result.records[0].id, document.id); assert.equal(document.savedId, null); assert.equal(api.isDirty(document), true);
});

test('unexpected data containers cannot bypass the bounded byte decoder', () => {
  for (const value of [undefined, null, 1024 * 1024 * 1024, { length: 900000000 }]) assert.throws(() => api.decodeSelectedBytes('note.txt', value), { code: 'FILE' });
});

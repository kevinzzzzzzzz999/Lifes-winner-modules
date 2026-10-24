import { loadLocal, saveLocal, saveFile, shareFile, notify } from '../shared.js';
import { Workspace, makeDocument, readSelectedFile, textBytes, isDirty, markSaved, validateDrafts, upsertDraft, createTextBlob, exportFilename, formatSize, validName, MAX_TABS } from './logic.js';

const DRAFT_KEY = 'documents-drafts-v1';
const workspace = new Workspace();
const $ = id => document.getElementById(id);
let drafts = [];
let storageReadable = true;
let importing = false;

function status(message, error = false) {
  $('status').textContent = message;
  $('status').classList.toggle('error', error);
}
function report(error) {
  const message = error instanceof Error ? error.message : '暂时无法完成，请重试。';
  status(message, true); notify(message, true);
}
function attempt(action) { try { const value = action(); if (value?.catch) value.catch(report); } catch (error) { report(error); } }
function element(tag, text, className) {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  if (className) result.className = className;
  return result;
}
function current() {
  const document = workspace.active;
  if (!document) throw new Error('请先打开或新建一份文本。');
  return document;
}
function selectDocument(id) { workspace.activeId = id; render(); }
function closeDocument(id) {
  const document = workspace.documents.find(item => item.id === id);
  if (!document) return;
  if (isDirty(document) && !window.confirm('这份副本还有未保存的修改。关闭后，这些修改会丢失。仍要关闭吗？')) return;
  workspace.close(id, true); render();
  status('已关闭标签。原文件和已保存的草稿不受影响。');
}
function renderTabs() {
  const children = workspace.documents.map(document => {
    const group = element('div', undefined, 'document-tab');
    const selected = document.id === workspace.activeId;
    group.classList.toggle('selected', selected);
    const tab = element('button', document.name + (isDirty(document) ? ' ·' : ''), 'tab-select');
    tab.type = 'button'; tab.setAttribute('role', 'tab'); tab.setAttribute('aria-selected', String(selected));
    tab.setAttribute('aria-controls', 'document-panel'); tab.tabIndex = selected ? 0 : -1;
    tab.addEventListener('click', () => selectDocument(document.id));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = workspace.documents.indexOf(document), count = workspace.documents.length;
      const target = event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + count) % count;
      selectDocument(workspace.documents[target].id);
      $('tabs').querySelector('[aria-selected="true"]')?.focus();
    });
    const close = element('button', '×', 'tab-close'); close.type = 'button'; close.setAttribute('aria-label', '关闭 ' + document.name);
    close.addEventListener('click', () => closeDocument(document.id));
    group.append(tab, close); return group;
  });
  $('tabs').replaceChildren(...children);
}
function refreshDocumentInfo() {
  const document = workspace.active;
  if (!document) return;
  $('document-name').textContent = document.name;
  const mode = document.editing ? '正在编辑副本' : '只读预览';
  const saved = isDirty(document) ? '有未保存的修改' : document.savedId ? '本机已保存' : '原文件未修改';
  $('document-meta').textContent = `${formatSize(textBytes(document.text))} · ${mode} · ${saved}`;
  const tab = $('tabs').querySelector('[aria-selected="true"]');
  if (tab) tab.textContent = document.name + (isDirty(document) ? ' ·' : '');
}
function render() {
  const document = workspace.active;
  $('welcome').hidden = !!document; $('workspace').hidden = !document;
  renderTabs();
  if (!document) return;
  $('preview-text').textContent = document.text;
  $('editor-text').value = document.text;
  $('document-filename').value = document.name;
  $('preview-text').hidden = document.editing;
  $('editor-text').hidden = !document.editing;
  $('name-field').hidden = !document.editing;
  $('edit-copy').textContent = document.editing ? '完成编辑' : '编辑副本';
  refreshDocumentInfo();
}
function renderDrafts() {
  $('draft-count').textContent = String(drafts.length);
  $('no-drafts').hidden = drafts.length > 0;
  $('saved-list').replaceChildren(...drafts.map(record => {
    const row = element('li');
    const open = element('button', undefined, 'saved-open'); open.type = 'button';
    open.append(element('span', record.name), element('small', new Date(record.updatedAt).toLocaleDateString('zh-CN') + ' · ' + formatSize(textBytes(record.text))));
    open.addEventListener('click', () => attempt(() => { workspace.openDraft(record); render(); status('已打开本机草稿。编辑后请再次保存。'); }));
    const remove = element('button', '×', 'delete-draft'); remove.type = 'button'; remove.setAttribute('aria-label', '删除本机草稿 ' + record.name);
    remove.addEventListener('click', () => attempt(() => deleteDraft(record.id)));
    row.append(open, remove); return row;
  }));
}
function newDocument() {
  workspace.add(makeDocument({ isNew: true })); render();
  status('新文本只在当前页面。请点击“保存到本机”或导出到“文件”。');
  $('editor-text').focus();
}
async function importFiles(files) {
  if (!files || importing || !files.length) return;
  importing = true; $('open-files').disabled = true; $('welcome-open').disabled = true;
  const selected = [...files].slice(0, MAX_TABS);
  let success = 0; const errors = [];
  try {
    for (const file of selected) {
      try {
        const payload = await readSelectedFile(file);
        workspace.import(payload); success += 1;
      } catch (error) { errors.push(`${file.name}: ${error instanceof Error ? error.message : '无法读取'}`); }
    }
    if (files.length > MAX_TABS) errors.push('一次最多处理 12 份选择，请分批打开。');
    render();
    if (errors.length) {
      status(`${success ? `已打开 ${success} 份。` : ''}${errors.slice(0, 3).join('；')}${errors.length > 3 ? '；其余文件请分批重试。' : ''}`, true);
    } else status(`已打开 ${success} 份文本。当前只读预览，原文件不会被覆盖。`);
  } finally {
    importing = false; $('open-files').disabled = false; $('welcome-open').disabled = false; $('file-input').value = '';
  }
}
function toggleEditing() {
  const document = current(); document.editing = !document.editing; render();
  status(document.editing ? '正在编辑副本；原文件不受影响。完成后请保存到本机或导出。' : isDirty(document) ? '已返回预览，修改仍在当前页面。请保存到本机或导出。' : '只读预览。');
  if (document.editing) $('editor-text').focus();
}
function editText() {
  const document = current();
  try { textBytes($('editor-text').value); document.text = $('editor-text').value; refreshDocumentInfo(); }
  catch (error) { $('editor-text').value = document.text; report(error); }
}
function editName() {
  const document = current();
  try { document.name = validName($('document-filename').value); refreshDocumentInfo(); }
  catch (error) { $('document-filename').value = document.name; report(error); }
}
function saveDraft() {
  if (!storageReadable) throw new Error('之前的本机草稿无法读取。为避免覆盖，请先导出当前文本，再检查浏览器存储设置。');
  const document = current(); const result = upsertDraft(drafts, document);
  // Update the visible saved state only after storage actually succeeds.
  try { saveLocal(DRAFT_KEY, result.records); } catch { throw new Error('没有保存成功。当前浏览器存储不可用或已满，请先导出到“文件”，再检查存储空间。'); }
  drafts = result.records; markSaved(document, result.id);
  renderDrafts(); refreshDocumentInfo();
  status('已保存到当前设备。清理网站数据或系统回收存储可能删除草稿，重要内容请导出。');
  notify('已保存到本机');
}
function deleteDraft(id) {
  if (!storageReadable) throw new Error('本机草稿暂时不可用，请稍后重试。');
  const record = drafts.find(item => item.id === id);
  if (!record || !window.confirm(`删除“${record.name}”的本机草稿？此操作不能恢复，已导出的文件不受影响。`)) return;
  const next = drafts.filter(item => item.id !== id);
  try { saveLocal(DRAFT_KEY, next); } catch { throw new Error('删除未完成，本机草稿仍保留。请检查浏览器存储设置后重试。'); }
  drafts = next;
  for (const document of workspace.documents) {
    if (document.savedId === id) { document.savedId = null; document.isNew = true; }
  }
  renderDrafts(); render(); status('已删除本机保存。当前已打开的副本仍保留，关闭前可以再次保存或导出。');
}
function exportText() {
  const document = current();
  try { saveFile(createTextBlob(document.text), exportFilename(document.name)); }
  catch { throw new Error('暂时无法导出。请再点一次，或使用“分享 / 存到文件”。'); }
  status('已准备 .txt 下载副本。请查看浏览器下载，或用“分享 / 存到文件”选择保存位置。');
}
async function shareText() {
  const document = current();
  // Call the shared helper immediately from the user click, preserving iOS activation.
  let result;
  try { result = await shareFile(createTextBlob(document.text), exportFilename(document.name), '文档工作台文本副本'); }
  catch { throw new Error('暂时无法分享。请重新点击分享，或使用“导出 .txt”保存副本。'); }
  status(result === 'shared' ? '分享操作已完成。原文件没有修改。' : result === 'cancelled' ? '已取消分享，当前文本仍保留。' : '此浏览器不支持文件分享，已改为下载 .txt 副本。');
}
function setup() {
  try { const value = loadLocal(DRAFT_KEY); drafts = value === null ? [] : validateDrafts(value); }
  catch { storageReadable = false; status('本机草稿暂时无法读取。你仍可打开、编辑和导出文本；当前不会覆盖已有草稿。', true); }
  renderDrafts(); render();
  if (window.matchMedia('(min-width: 900px)').matches) $('saved-library').open = true;
  for (const id of ['open-files', 'welcome-open']) $(id).addEventListener('click', () => $('file-input').click());
  $('file-input').addEventListener('change', () => attempt(() => importFiles($('file-input').files)));
  $('new-document').addEventListener('click', () => attempt(newDocument));
  $('edit-copy').addEventListener('click', () => attempt(toggleEditing));
  $('editor-text').addEventListener('input', () => attempt(editText));
  $('document-filename').addEventListener('change', () => attempt(editName));
  $('save-draft').addEventListener('click', () => attempt(saveDraft));
  $('export-file').addEventListener('click', () => attempt(exportText));
  $('share-file').addEventListener('click', () => attempt(shareText));
  window.addEventListener('beforeunload', event => {
    if (workspace.documents.some(isDirty)) { event.preventDefault(); event.returnValue = ''; }
  });
}
setup();

import { loadLocal, saveLocal, saveFile, shareFile, notify, getLanguage, t } from '../shared.js';
import { DocumentError, errorText, Workspace, makeDocument, readSelectedFile, textBytes, isDirty, markSaved, validateDrafts, upsertDraft, createTextBlob, exportFilename, formatSize, validName, MAX_TABS } from './logic.js';

const DRAFT_KEY = 'documents-drafts-v1';
const workspace = new Workspace();
const $ = id => document.getElementById(id);
let drafts = [];
let storageReadable = true;
let importing = false;
let statusState = { zh: '原文件只读打开，编辑始终发生在副本中。', en: 'Originals open read-only. All edits happen in copies.', error: false };
let noticeState = null;

function refreshStatus() {
  $('status').textContent = t(statusState.zh, statusState.en);
  $('status').classList.toggle('error', statusState.error);
}
function status(zh, en, error = false) {
  statusState = { zh, en, error }; refreshStatus();
}
function notice(zh, en, error = false) {
  noticeState = { zh, en, error, displayed: t(zh, en) };
  notify(noticeState.displayed, error);
}
function report(error) {
  const zh = errorText(error, 'zh'), en = errorText(error, 'en');
  status(zh, en, true); notice(zh, en, true);
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
  if (!document) throw new DocumentError('NO_DOCUMENT', '请先打开或新建一份文本。');
  return document;
}
function selectDocument(id) { workspace.activeId = id; render(); }
function closeDocument(id) {
  const document = workspace.documents.find(item => item.id === id);
  if (!document) return;
  if (isDirty(document) && !window.confirm(t('这份副本还有未保存的修改。关闭后，这些修改会丢失。仍要关闭吗？', 'This copy has unsaved changes. Closing it will discard them. Close anyway?'))) return;
  workspace.close(id, true); render();
  status('已关闭标签。原文件和已保存的草稿不受影响。', 'Tab closed. Originals and saved drafts are unchanged.');
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
    const close = element('button', '×', 'tab-close'); close.type = 'button'; close.setAttribute('aria-label', t('关闭 ', 'Close ') + document.name);
    close.addEventListener('click', () => closeDocument(document.id));
    group.append(tab, close); return group;
  });
  $('tabs').replaceChildren(...children);
}
function refreshDocumentInfo() {
  const document = workspace.active;
  if (!document) return;
  $('document-name').textContent = document.name;
  const mode = document.editing ? t('正在编辑副本', 'Editing a copy') : t('只读预览', 'Read-only preview');
  const saved = isDirty(document) ? t('有未保存的修改', 'Unsaved changes') : document.savedId ? t('本机已保存', 'Saved locally') : t('原文件未修改', 'Original unchanged');
  $('document-meta').textContent = `${formatSize(textBytes(document.text))} · ${mode} · ${saved}`;
  $('edit-copy').textContent = document.editing ? t('完成编辑', 'Finish editing') : t('编辑副本', 'Edit copy');
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
  refreshDocumentInfo();
}
function renderDrafts() {
  $('draft-count').textContent = String(drafts.length);
  $('no-drafts').hidden = drafts.length > 0;
  $('saved-list').replaceChildren(...drafts.map(record => {
    const row = element('li');
    const open = element('button', undefined, 'saved-open'); open.type = 'button';
    open.append(element('span', record.name), element('small', new Date(record.updatedAt).toLocaleDateString(getLanguage() === 'en' ? 'en' : 'zh-CN') + ' · ' + formatSize(textBytes(record.text))));
    open.addEventListener('click', () => attempt(() => { workspace.openDraft(record); render(); status('已打开本机草稿。编辑后请再次保存。', 'Local draft opened. Save again after editing.'); }));
    const remove = element('button', '×', 'delete-draft'); remove.type = 'button'; remove.setAttribute('aria-label', t('删除本机草稿 ', 'Delete local draft ') + record.name);
    remove.addEventListener('click', () => attempt(() => deleteDraft(record.id)));
    row.append(open, remove); return row;
  }));
}
function newDocument() {
  workspace.add(makeDocument({ name: t('未命名.txt', 'Untitled.txt'), isNew: true })); render();
  status('新文本只在当前页面。请点击“保存到本机”或导出到“文件”。', 'This new text is only in this page. Choose Save locally or export it to Files.');
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
      } catch (error) { errors.push({ zh: `${file.name}: ${errorText(error, 'zh')}`, en: `${file.name}: ${errorText(error, 'en')}` }); }
    }
    if (files.length > MAX_TABS) errors.push({ zh: '一次最多处理 12 份选择，请分批打开。', en: 'Up to 12 selections are processed at once. Open the remaining files in another batch.' });
    render();
    if (errors.length) {
      const zh = `${success ? `已打开 ${success} 份。` : ''}${errors.slice(0, 3).map(item => item.zh).join('；')}${errors.length > 3 ? '；其余文件请分批重试。' : ''}`;
      const en = `${success ? `Opened ${success}. ` : ''}${errors.slice(0, 3).map(item => item.en).join('; ')}${errors.length > 3 ? '; Retry the remaining files in another batch.' : ''}`;
      status(zh, en, true);
    } else status(`已打开 ${success} 份文本。当前只读预览，原文件不会被覆盖。`, `Opened ${success} text ${success === 1 ? 'file' : 'files'}. Preview is read-only; originals will not be overwritten.`);
  } finally {
    importing = false; $('open-files').disabled = false; $('welcome-open').disabled = false; $('file-input').value = '';
  }
}
function toggleEditing() {
  const document = current(); document.editing = !document.editing; render();
  if (document.editing) status('正在编辑副本；原文件不受影响。完成后请保存到本机或导出。', 'Editing a copy; the original is unchanged. Save locally or export when finished.');
  else if (isDirty(document)) status('已返回预览，修改仍在当前页面。请保存到本机或导出。', 'Back in preview. Changes remain in this page; save locally or export them.');
  else status('只读预览。', 'Read-only preview.');
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
  if (!storageReadable) throw new DocumentError('STORAGE_READ', '之前的本机草稿无法读取。为避免覆盖，请先导出当前文本，再检查浏览器存储设置。');
  const document = current(); const result = upsertDraft(drafts, document);
  // Update the visible saved state only after storage actually succeeds.
  try { saveLocal(DRAFT_KEY, result.records); } catch { throw new DocumentError('SAVE', '没有保存成功。当前浏览器存储不可用或已满，请先导出到“文件”，再检查存储空间。'); }
  drafts = result.records; markSaved(document, result.id);
  renderDrafts(); refreshDocumentInfo();
  status('已保存到当前设备。清理网站数据或系统回收存储可能删除草稿，重要内容请导出。', 'Saved on this device. Site-data removal or storage cleanup can delete drafts; export important work.');
  notice('已保存到本机', 'Saved locally');
}
function deleteDraft(id) {
  if (!storageReadable) throw new DocumentError('STORAGE_READ', '本机草稿暂时不可用，请稍后重试。');
  const record = drafts.find(item => item.id === id);
  if (!record || !window.confirm(t(`删除“${record.name}”的本机草稿？此操作不能恢复，已导出的文件不受影响。`, `Delete the local draft “${record.name}”? This cannot be undone. Exported files are unchanged.`))) return;
  const next = drafts.filter(item => item.id !== id);
  try { saveLocal(DRAFT_KEY, next); } catch { throw new DocumentError('DELETE', '删除未完成，本机草稿仍保留。请检查浏览器存储设置后重试。'); }
  drafts = next;
  for (const document of workspace.documents) {
    if (document.savedId === id) { document.savedId = null; document.isNew = true; }
  }
  renderDrafts(); render(); status('已删除本机保存。当前已打开的副本仍保留，关闭前可以再次保存或导出。', 'Local draft deleted. Open copies are still here; save or export them before closing.');
}
function exportText() {
  const document = current();
  try { saveFile(createTextBlob(document.text), exportFilename(document.name, t('文档', 'Document'))); }
  catch { throw new DocumentError('EXPORT', '暂时无法导出。请再点一次，或使用“分享 / 存到文件”。'); }
  status('已准备 .txt 下载副本。请查看浏览器下载，或用“分享 / 存到文件”选择保存位置。', 'A .txt download copy is ready. Check browser downloads, or choose Share / Save to Files.');
}
async function shareText() {
  const document = current();
  // Call the shared helper immediately from the user click, preserving iOS activation.
  let result;
  try { result = await shareFile(createTextBlob(document.text), exportFilename(document.name, t('文档', 'Document')), t('文档工作台文本副本', 'Document Workbench text copy')); }
  catch { throw new DocumentError('SHARE', '暂时无法分享。请重新点击分享，或使用“导出 .txt”保存副本。'); }
  if (result === 'shared') status('分享操作已完成。原文件没有修改。', 'Sharing completed. The original is unchanged.');
  else if (result === 'cancelled') status('已取消分享，当前文本仍保留。', 'Sharing cancelled. Your current text is still here.');
  else status('此浏览器不支持文件分享，已改为下载 .txt 副本。', 'File sharing is unavailable in this browser. A .txt copy was downloaded instead.');
}
function renderLanguage() {
  for (const node of document.querySelectorAll('[data-zh][data-en]')) node.textContent = t(node.dataset.zh, node.dataset.en);
  for (const node of document.querySelectorAll('[data-aria-zh][data-aria-en]')) node.setAttribute('aria-label', t(node.dataset.ariaZh, node.dataset.ariaEn));
  document.title = t('文档工作台', 'Document Workbench') + " · Life's winner";
  document.documentElement.lang = getLanguage() === 'en' ? 'en' : 'zh-CN';
  $('preview-text').dataset.emptyLabel = t('这份文本目前为空', 'This text is empty.');
  // Translate labels only. Never rewrite the editor, name input or document model
  // during language changes: selection, composing text and unsaved copies survive.
  renderTabs(); renderDrafts(); refreshDocumentInfo(); refreshStatus();
  const toast = $('shared-status');
  if (noticeState && toast && !toast.hidden && toast.textContent === noticeState.displayed) {
    noticeState.displayed = t(noticeState.zh, noticeState.en); toast.textContent = noticeState.displayed;
  }
}
function setup() {
  try { const value = loadLocal(DRAFT_KEY); drafts = value === null ? [] : validateDrafts(value); }
  catch { storageReadable = false; status('本机草稿暂时无法读取。你仍可打开、编辑和导出文本；当前不会覆盖已有草稿。', 'Local drafts cannot be read. You can still open, edit and export text; existing drafts will not be overwritten.', true); }
  renderLanguage(); render();
  window.addEventListener('life-winner-languagechange', renderLanguage);
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

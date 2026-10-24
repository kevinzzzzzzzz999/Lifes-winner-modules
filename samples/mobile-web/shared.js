// Local-only helpers. No content, identity, analytics or diagnostics leave the device.
const MAX_LOCAL_BYTES = 8 * 1024 * 1024;
const PREFIX = 'inkspace-mobile:';
const APP_IDS = ['writing','preferences','documents'];
const APP_ID = document.documentElement.dataset.app;
function appScope() { return new URL('./' + APP_ID + '/', import.meta.url); }
function storageKey(key) {
  if (typeof key !== 'string' || !/^[a-z0-9._-]{1,80}$/i.test(key)) throw new Error('无效的本机存储名称');
  if (!APP_IDS.includes(APP_ID) || !key.startsWith(APP_ID + '-')) throw new Error('此工具不能读取其他工具的草稿');
  return PREFIX + key;
}
export function loadLocal(key) {
  const raw = localStorage.getItem(storageKey(key));
  if (raw === null) return null;
  if (new Blob([raw]).size > MAX_LOCAL_BYTES) throw new Error('本机草稿过大，请先导出备份');
  return JSON.parse(raw);
}
export function saveLocal(key, value) {
  const raw = JSON.stringify(value);
  if (typeof raw !== 'string' || new Blob([raw]).size > MAX_LOCAL_BYTES) throw new Error('本机草稿超过 8 MiB，请先导出备份');
  localStorage.setItem(storageKey(key), raw);
}
export function removeLocal(key) { localStorage.removeItem(storageKey(key)); }
function fileName(name) {
  return String(name || 'document.txt').replace(/[\\/\x00-\x1f\x7f]/g, '_').slice(0,180) || 'document.txt';
}
export function saveFile(blob, filename) {
  if (!(blob instanceof Blob)) throw new Error('无法导出此文件');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = fileName(filename); anchor.rel = 'noopener';
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export async function shareFile(blob, filename, title = '导出文件') {
  if (!(blob instanceof Blob)) throw new Error('无法分享此文件');
  const file = new File([blob], fileName(filename), {type:blob.type || 'application/octet-stream'});
  if (navigator.share && navigator.canShare?.({files:[file]})) {
    try { await navigator.share({files:[file], title}); return 'shared'; }
    catch(error) { if (error?.name === 'AbortError') return 'cancelled'; throw error; }
  }
  saveFile(blob, filename); return 'downloaded';
}
let notificationTimer;
export function notify(message, isError=false) {
  let status = document.getElementById('shared-status');
  if (!status) { status=document.createElement('p'); status.id='shared-status'; status.className='shared-toast'; status.setAttribute('role','status'); status.setAttribute('aria-live','polite'); document.body.append(status); }
  status.textContent=String(message); status.classList.toggle('is-error',!!isError); status.hidden=false;
  clearTimeout(notificationTimer); notificationTimer=setTimeout(()=>{status.hidden=true;},isError?12000:6000);
}
let installDialog;
export function installHelp() {
  if (!installDialog) {
    installDialog=document.createElement('dialog'); installDialog.className='install-dialog';
    const heading=document.createElement('h2'); heading.textContent='安装到主屏幕'; heading.id='install-title';
    installDialog.setAttribute('aria-labelledby', heading.id);
    const steps=document.createElement('ol');
    ['用 iPhone 或 iPad 的 Safari 打开当前工具链接。','点 Safari 的分享按钮，选择「添加到主屏幕」。如果没有显示，向下滑动分享列表。','如有「作为网页 App 打开」选项，请保持开启，再点「添加」。','回到主屏幕点新图标。首次联网打开，等页面显示「可离线使用」。'].forEach(text=>{const li=document.createElement('li');li.textContent=text;steps.append(li);});
    const note=document.createElement('p'); note.textContent='三个工具分别安装。无需 Apple 开发者账号或编译工具。草稿只在当前设备/浏览器中；安装前已有草稿请先导出，安装后再打开。清除网站数据、卸载或系统回收存储可能清除草稿，请定期导出重要文件。';
    const close=document.createElement('button'); close.textContent='知道了'; close.className='primary'; close.addEventListener('click',()=>installDialog.close());
    installDialog.append(heading,steps,note,close); document.body.append(installDialog);
  }
  installDialog.showModal();
}
function offlineStatus(text) { document.querySelectorAll('[data-offline-status]').forEach(el=>{el.textContent=text;}); }
export async function checkForUpdates() {
  try {
    const registration=await navigator.serviceWorker?.getRegistration(appScope());
    if (!registration) { notify('首次使用请联网打开，等待离线准备完成'); return; }
    await registration.update();
    notify(registration.waiting ? '新版本已准备。先保存或导出，然后关闭当前工具的所有窗口，再重新打开。' : '已检查更新；发布的新版本会在安全关闭后生效。');
  } catch { notify('暂时无法检查更新，当前离线版本仍可继续使用。',true); }
}
async function prepareOffline() {
  if (!APP_IDS.includes(APP_ID)) return;
  if (!('serviceWorker' in navigator) || !window.isSecureContext) { offlineStatus('当前环境无法准备离线；请使用正式 HTTPS 链接'); return; }
  offlineStatus('正在准备离线…');
  try {
    const registration=await navigator.serviceWorker.register(new URL('./sw.js?app=' + APP_ID, import.meta.url),{scope:appScope().pathname,updateViaCache:'none'});
    const report=()=>{ if(registration.waiting) offlineStatus('可离线使用 · 有更新，保存后关闭重开'); else if(registration.active && navigator.serviceWorker.controller?.state === 'activated') offlineStatus('可离线使用'); };
    report();
    navigator.serviceWorker.addEventListener('controllerchange',report);
    registration.active?.addEventListener('statechange',report);
    registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'||worker.state==='activated')report();if(worker.state==='redundant'&&!registration.active)offlineStatus('离线准备失败，请联网重开');});});
    navigator.serviceWorker.ready.then(()=>report());
  } catch { offlineStatus('离线准备未完成，请联网重试'); }
}
function setup() {
  document.querySelectorAll('[data-install]').forEach(el=>el.addEventListener('click',installHelp));
  document.querySelectorAll('[data-check-updates]').forEach(el=>el.addEventListener('click',checkForUpdates));
  prepareOffline();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();

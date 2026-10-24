// Local-only helpers. No content, identity, analytics or diagnostics leave the device.
const MAX_LOCAL_BYTES = 8 * 1024 * 1024;
const PREFIX = 'inkspace-mobile:';
const APP_IDS = ['writing','preferences','documents'];
const UI_IDS = [...APP_IDS,'portal'];
const APP_ID = document.documentElement.dataset.app;
function appScope() { return new URL('./' + APP_ID + '/', import.meta.url); }
function storageKey(key) {
  if (typeof key !== 'string' || !/^[a-z0-9._-]{1,80}$/i.test(key)) throw new Error('无效的本机存储名称');
  if (!UI_IDS.includes(APP_ID) || !key.startsWith(APP_ID + '-')) throw new Error('此工具不能读取其他工具的草稿');
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
let selectedLanguage;
export function getLanguage() {
  if (selectedLanguage) return selectedLanguage;
  try { const saved=loadLocal(APP_ID+'-language'); if(saved==='zh'||saved==='en')selectedLanguage=saved; } catch {}
  return selectedLanguage || (navigator.language?.toLowerCase().startsWith('zh')?'zh':'en');
}
export function t(zh,en) { return getLanguage()==='en'?en:zh; }
function updateLanguageControls() {
  const lang=getLanguage(); document.documentElement.lang=lang==='zh'?'zh-CN':'en';
  document.querySelectorAll('[data-language]').forEach(el=>{el.textContent=lang==='zh'?'English':'中文';el.setAttribute('aria-label',lang==='zh'?'Switch to English':'切换到中文');});
  const manifest=document.querySelector('link[rel="manifest"]');
  if(manifest)manifest.href=lang==='en'?'./manifest-en.json':'./manifest.json';
  const title=document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if(title){const names={writing:['书写画板','Writing'],preferences:['偏好方案','Preferences'],documents:['文档工作台','Documents']};if(names[APP_ID])title.content=names[APP_ID][lang==='en'?1:0];}
}
export function setLanguage(lang) {
  if(lang!=='zh'&&lang!=='en')return;
  const previous=getLanguage(); selectedLanguage=lang;
  try { saveLocal(APP_ID+'-language',lang); } catch {}
  if(installDialog){installDialog.close();installDialog.remove();installDialog=null;}
  updateLanguageControls(); offlineStatus(lastOfflineStatus);
  if(previous!==lang)window.dispatchEvent(new CustomEvent('life-winner-languagechange',{detail:{language:lang}}));
}
function fileName(name) {
  return String(name || 'document.txt').replace(/[\\/\x00-\x1f\x7f]/g, '_').slice(0,180) || 'document.txt';
}
export function saveFile(blob, filename) {
  if (!(blob instanceof Blob)) throw new Error(t('无法导出此文件','This file cannot be exported.'));
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = fileName(filename); anchor.rel = 'noopener';
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export async function shareFile(blob, filename, title = '导出文件') {
  if (!(blob instanceof Blob)) throw new Error(t('无法分享此文件','This file cannot be shared.'));
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
    const heading=document.createElement('h2'); heading.textContent=t('安装到主屏幕','Add to Home Screen'); heading.id='install-title';
    installDialog.setAttribute('aria-labelledby',heading.id);
    const steps=document.createElement('ol');
    [t('用 iPhone 或 iPad 的 Safari 打开当前工具链接。','Open this tool in Safari on your iPhone or iPad.'),t('点 Safari 的分享按钮，选择「添加到主屏幕」。如果没有显示，向下滑动分享列表。','Tap Safari’s Share button, then Add to Home Screen. Scroll down the share menu if needed.'),t('如有「作为网页 App 打开」选项，请保持开启，再点「添加」。','If Open as Web App is shown, leave it enabled, then tap Add.'),t('回到主屏幕点新图标。首次联网打开，等页面显示「可离线使用」。','Open the new Home Screen icon while online. Wait until Ready for offline use appears.')].forEach(text=>{const li=document.createElement('li');li.textContent=text;steps.append(li);});
    const note=document.createElement('p');note.textContent=t('三个工具分别安装。无需开发者账号或编译工具。草稿只在当前设备/浏览器中；安装前已有草稿请先导出，安装后再打开。清除网站数据、卸载或系统回收存储可能清除草稿，请定期导出重要文件。','Install each tool separately. No developer account or build tools are needed. Drafts stay in this device/browser. Export existing drafts before installing, then import them in the installed app. Website data removal, uninstalling or system storage cleanup can erase drafts; export important work regularly.');
    const close=document.createElement('button');close.textContent=t('知道了','Got it');close.className='primary';close.addEventListener('click',()=>installDialog.close());
    installDialog.append(heading,steps,note,close);document.body.append(installDialog);
  }
  installDialog.showModal();
}
let lastOfflineStatus='正在准备离线…';
const OFFLINE_EN={'正在准备离线…':'Preparing offline use…','可离线使用':'Ready for offline use','可离线使用 · 有更新，保存后关闭重开':'Offline ready · Update available; save, close and reopen','当前环境无法准备离线；请使用正式 HTTPS 链接':'Offline setup requires the published HTTPS link.','离线准备失败，请联网重开':'Offline setup failed. Reopen while online.','离线准备未完成，请联网重试':'Offline setup is incomplete. Reopen while online.'};
function offlineStatus(text) { lastOfflineStatus=text;document.querySelectorAll('[data-offline-status]').forEach(el=>{el.textContent=getLanguage()==='en'?(OFFLINE_EN[text]||text):text;}); }
export async function checkForUpdates() {
  try {
    const registration=await navigator.serviceWorker?.getRegistration(appScope());
    if (!registration) { notify(t('首次使用请联网打开，等待离线准备完成','Open online for the first use and wait for offline setup.')); return; }
    await registration.update();
    notify(registration.waiting ? t('新版本已准备。先保存或导出，然后关闭当前工具的所有窗口，再重新打开。','An update is ready. Save or export, close all windows of this tool, then reopen.') : t('已检查更新；发布的新版本会在安全关闭后生效。','Checked for updates. New versions take effect after you safely close the app.'));
  } catch { notify(t('暂时无法检查更新，当前离线版本仍可继续使用。','Cannot check for updates right now. Your current offline version can still be used.'),true); }
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
  updateLanguageControls();
  document.querySelectorAll('[data-language]').forEach(el=>el.addEventListener('click',()=>setLanguage(getLanguage()==='zh'?'en':'zh')));
  document.querySelectorAll('[data-install]').forEach(el=>el.addEventListener('click',installHelp));
  document.querySelectorAll('[data-check-updates]').forEach(el=>el.addEventListener('click',checkForUpdates));
  prepareOffline();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();

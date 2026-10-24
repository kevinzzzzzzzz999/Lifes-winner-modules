"use strict";
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {app,BrowserWindow,ipcMain,dialog,protocol,session,Menu}=require('electron');
const {WindowContexts,DocumentCapabilities,ExternalDocumentOpen,DocumentTabs,HomeLaunchState,RENDERER_URL,DEMO_SCHEME,parseOpenURL,routeOpenURL,kindOf,publicError,fail,selectDocument}=require('../../index.cjs');
// This demo never reads the full application's profile or saves workspace paths.
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'inkspace-shell-demo-'));
app.setPath('userData',profile);app.setPath('sessionData',path.join(profile,'session'));
app.setName('Application Shell Demo');
protocol.registerSchemesAsPrivileged([{scheme:'inkspace-shell-ui',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
const windows=new WindowContexts(),vaults=new DocumentCapabilities();
const external=new ExternalDocumentOpen();
let ready=false;const pendingURLs=[];
// Install the operating-system entry points synchronously, before app.ready.
app.on('open-file',(event,file)=>{event.preventDefault();external.enqueue(file);});
function handleURL(value){if(!ready){if(pendingURLs.length<256)pendingURLs.push(value);return;}routeOpenURL(value,{vaults,windows,external,reveal,createWindow}).catch(error=>external.report(error));}
app.on('open-url',(event,url)=>{event.preventDefault();handleURL(url);});
function processArguments(argv){for(const arg of argv){if(arg.startsWith(DEMO_SCHEME+':'))handleURL(arg);else if(path.isAbsolute(arg)&&kindOf(arg)!=='unsupported')external.enqueue(arg);}}
// An ephemeral profile intentionally gives each independent CLI launch its own
// session. Embedders using one dedicated persistent profile can add Electron's
// requestSingleInstanceLock and forward second-instance arguments here.
app.on('second-instance',(_event,argv)=>{processArguments(argv);const context=windows.focused();if(context)reveal(context);});
function reveal(context){if(windows.alive(context)){if(context.window.isMinimized())context.window.restore();context.window.show();context.window.focus();}return context;}
function tabs(context){return windows.service('tabs',()=>new DocumentTabs(),context);}
function home(context){return windows.service('home',()=>new HomeLaunchState(),context);}
function snapshot(context){return{vault:context.activeVault,tabs:tabs(context).tabs,active:tabs(context).active,showsHome:home(context).showsHome};}
function createWindow(initialVault=null){
 const window=new BrowserWindow({width:1160,height:780,minWidth:620,minHeight:420,show:false,title:'Application Shell Demo',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,webSecurity:true,webviewTag:false,allowRunningInsecureContent:false,partition:'inkspace-shell-demo'}});
 const context=windows.add(window,initialVault);if(initialVault)home(context).continueToWorkspace();
 window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 window.webContents.on('will-navigate',event=>event.preventDefault());window.webContents.on('will-attach-webview',event=>event.preventDefault());
 window.webContents.on('did-start-navigation',(_event,_url,_inPlace,isMainFrame)=>{if(isMainFrame)external.reset(context);});
 window.webContents.on('render-process-gone',()=>external.reset(context));
 window.on('focus',()=>{windows.lastActive=context;home(context).phaseChanged('active');});
 window.on('closed',()=>{external.remove(context);windows.remove(context);});
 window.once('ready-to-show',()=>window.show());
 window.loadURL(RENDERER_URL);return context;
}
function handler(name,operation){ipcMain.handle('shell:'+name,async(event,value)=>{try{return await windows.invoke(event,value,async(input,context)=>{const result=await operation(input,context);windows.current();return{ok:true,value:result};});}catch(error){return{ok:false,error:publicError(error)};}});}
async function nativeChoice(context,properties){if(context.dialogBusy)fail('BUSY');context.dialogBusy=true;try{const result=await dialog.showOpenDialog(context.window,{properties});windows.current();return result;}finally{context.dialogBusy=false;}}
handler('state',(_input,context)=>snapshot(context));
handler('newWindow',()=>{createWindow();return{opened:true};});
handler('chooseFolder',async(_input,context)=>{const result=await nativeChoice(context,['openDirectory']);if(result.canceled)return{cancelled:true};if(result.filePaths?.length!==1)fail('INVALID_REQUEST');const vault=await vaults.grantVault(result.filePaths[0]);windows.current();reveal(createWindow(vault));return{opened:true};});
handler('chooseDocument',async(_input,context)=>{if(context.dialogBusy)fail('BUSY');context.dialogBusy=true;try{const selected=await selectDocument({dialog,window:context.window});windows.current();if(selected)external.enqueue(selected);return{opened:Boolean(selected)};}finally{context.dialogBusy=false;}});
handler('listDirectory',async(value,context)=>{if(!value||!context.grants.has(value.vaultId))fail('PERMISSION_DENIED');return vaults.list(value.vaultId,value.path||'');});
handler('openDocument',async(value,context)=>{if(!value||!context.grants.has(value.vaultId))fail('PERMISSION_DENIED');const result=await tabs(context).open(value.vaultId,value.path,(id,relative)=>vaults.read(id,relative));windows.current();if(result.opened){windows.activate(value.vaultId,context);home(context).continueToWorkspace();}return{...result,state:snapshot(context)};});
handler('activateTab',(value,context)=>{tabs(context).activate(value?.key);return snapshot(context);});
handler('closeTab',(value,context)=>{tabs(context).close(value?.key);return snapshot(context);});
handler('quickSwitch',(value,context)=>tabs(context).quickSwitch(value?.query||''));
handler('home',(_value,context)=>{home(context).showHome();return snapshot(context);});
handler('continue',(_value,context)=>{home(context).continueToWorkspace();return snapshot(context);});
handler('externalOpenRequests',(_value,context)=>external.list(context));
handler('acknowledgeExternalOpen',(value,context)=>external.acknowledge(context,value?.id));
handler('moveExternalOpenToNewWindow',(value,context)=>external.moveToNewWindow(context,value?.id));
handler('openURL',async(value,context)=>{const route=parseOpenURL(value?.url);if(!context.grants.has(route.vaultId))fail('PERMISSION_DENIED');return routeOpenURL(value.url,{vaults,windows,external,reveal,createWindow});});
function installMenu(){const focused=()=>windows.focused();Menu.setApplicationMenu(Menu.buildFromTemplate([...(process.platform==='darwin'?[{role:'appMenu'}]:[]),{label:'File / 文件',submenu:[{label:'New window / 新窗口',accelerator:'CommandOrControl+N',click:()=>createWindow()},{label:'Open document / 打开文档…',accelerator:'CommandOrControl+O',click:()=>windows.send(focused(),'shell:command','chooseDocument')},{label:'Open workspace in new window / 打开工作区…',accelerator:'CommandOrControl+Shift+O',click:()=>windows.send(focused(),'shell:command','chooseFolder')},{type:'separator'},{role:process.platform==='darwin'?'close':'quit'}]},{role:'editMenu'},{label:'Navigate / 导航',submenu:[{label:'Quick switch / 快速切换',accelerator:'CommandOrControl+K',click:()=>windows.send(focused(),'shell:command','quickSwitch')}]},{role:'windowMenu'}]));}
app.whenReady().then(async()=>{
 const ses=session.fromPartition('inkspace-shell-demo');ses.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));ses.setPermissionCheckHandler(()=>false);
 // Only these three bundled resources can be served. Chosen documents are read
 // via the bounded capability API, never through a generic file:// endpoint.
 const assets=new Map([['/index.html',['index.html','text/html']],['/renderer.js',['renderer.js','text/javascript']],['/styles.css',['styles.css','text/css']]]);
 ses.protocol.handle('inkspace-shell-ui',async request=>{try{const url=new URL(request.url),asset=assets.get(url.pathname);if(request.method!=='GET'||url.hostname!=='ui'||url.username||url.password||url.port||url.search||url.hash||!asset)return new Response('Not found',{status:404});return new Response(await fsp.readFile(path.join(__dirname,'ui',asset[0])),{headers:{'Content-Type':asset[1]+'; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'none'; img-src 'none'; object-src 'none'; base-uri 'none'; frame-src 'none'; form-action 'none'"}});}catch{return new Response('Not found',{status:404});}});
 ready=true;await external.configure({vaults,windows,createWindow,reveal});installMenu();processArguments(process.argv.slice(2));
 await external.idle();if(!windows.windows.size)createWindow();
 for(const url of pendingURLs.splice(0))handleURL(url);
}).catch(()=>app.quit());
app.on('activate',()=>{const context=windows.focused();if(context)reveal(context);else if(ready)createWindow();});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
app.on('quit',()=>{try{fs.rmSync(profile,{recursive:true,force:true});}catch{}});
// No setAsDefaultProtocolClient call: this demo never changes OS associations.

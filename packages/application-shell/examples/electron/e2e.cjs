"use strict";
// Real Electron process, renderer, IPC and filesystem. The native picker UI is
// replaced in the trusted test process with synthetic selections; no renderer
// test backdoor or pre-existing user files are involved.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {_electron}=require('playwright');
async function main(){
 const temporary=await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()),'shell-e2e-'));
 const workspace=path.join(temporary,'Synthetic workspace'),outside=path.join(temporary,'Separate documents');await fs.mkdir(workspace);await fs.mkdir(outside);await fs.mkdir(path.join(workspace,'nested'));
 await fs.writeFile(path.join(workspace,'one.md'),'# One\nSynthetic document one.');await fs.writeFile(path.join(workspace,'two.txt'),'Synthetic document two.');await fs.writeFile(path.join(workspace,'nested','child.md'),'Nested synthetic child.');await fs.writeFile(path.join(outside,'solo.txt'),'Individually selected document.');await fs.writeFile(path.join(outside,'sibling.txt'),'Never authorized sibling.');
 const environment={...process.env};delete environment.ELECTRON_RUN_AS_NODE;delete environment.NODE_PATH;delete environment.NODE_OPTIONS;
 const application=await _electron.launch({args:[__dirname],env:environment,timeout:30000});
 const errors=[];const watch=page=>{page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});};application.on('window',watch);
 const checks=[];
 try{
  const home=await application.firstWindow();watch(home);await home.locator('#status').waitFor();assert.equal(await home.title(),'Application Shell Demo');assert.equal(home.url(),'inkspace-shell-ui://ui/index.html');assert.equal(await home.locator('#welcome').isVisible(),true);checks.push('page identity, meaningful home screen');
  // Mock only the trusted Electron dialog result, then use the actual UI.
  await application.evaluate(({dialog},selected)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[selected]});},workspace);
  const next=application.waitForEvent('window');await home.locator('#open-folder').click();const page=await next;await page.locator('#files button').filter({hasText:'one.md'}).waitFor();
  await page.locator('#files button').filter({hasText:'one.md'}).click();await page.locator('#preview').filter({hasText:'Synthetic document one.'}).waitFor();checks.push('workspace picker adapter -> real directory listing -> real UTF-8 preview');
  await page.locator('#files button').filter({hasText:'two.txt'}).click();await page.locator('#preview').filter({hasText:'Synthetic document two.'}).waitFor();
  await page.locator('#quick-switch').click();await page.locator('#switch-query').fill('one');await page.locator('#switch-results button').click();await page.locator('#preview').filter({hasText:'Synthetic document one.'}).waitFor();assert.equal(await page.locator('[role=tab]').count(),2);checks.push('document tabs, filtered quick switch, duplicate focus');
  await page.locator('#files button').filter({hasText:'nested'}).click();await page.locator('#files button').filter({hasText:'child.md'}).click();await page.locator('#preview').filter({hasText:'Nested synthetic child.'}).waitFor();checks.push('nested workspace traversal');
  await page.locator('#home').click();await application.evaluate(({app})=>app.emit('activate'));assert.equal(await page.locator('#welcome').isVisible(),true);await page.locator('#continue').click();assert.equal(await page.locator('#preview').textContent(),'Nested synthetic child.');checks.push('home overlay and app activation preserve reading state');
  const vault=await page.evaluate(async()=> (await window.applicationShell.state()).vault);
  await application.evaluate(({app},id)=>{app.emit('open-url',{preventDefault(){}},`inkspace-shell-demo://open?workspace=${id}&path=two.txt`);},vault.id);await page.locator('#preview').filter({hasText:'Synthetic document two.'}).waitFor();checks.push('system open-url route reuses authorized workspace');
  const before=application.windows().length;await application.evaluate(({app},file)=>{app.emit('open-file',{preventDefault(){}},file);},path.join(workspace,'one.md'));await page.locator('#preview').filter({hasText:'Synthetic document one.'}).waitFor();assert.equal(application.windows().length,before);await page.reload();await page.locator('#preview').filter({hasText:'Synthetic document one.'}).waitFor();assert.equal(await page.evaluate(async()=> (await window.applicationShell.externalOpenRequests()).length),0);checks.push('system open-file route, request acknowledgement, renderer reload');
  const newWindow=application.waitForEvent('window');await page.locator('#new-window').click();const blank=await newWindow;await blank.locator('#welcome').waitFor();const denied=await blank.evaluate(async id=>{try{await window.applicationShell.listDirectory({vaultId:id,path:''});return 'unexpected';}catch(error){return error.message;}},vault.id);assert.match(denied,/does not have permission/);checks.push('multiple real windows and cross-window permission denial');
  await application.evaluate(({dialog},selected)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[selected]});},path.join(outside,'solo.txt'));
  const selectedWindow=application.waitForEvent('window');await blank.locator('#open-file').click();const single=await selectedWindow;await single.locator('#preview').filter({hasText:'Individually selected document.'}).waitFor();assert.equal(await single.locator('#files button').count(),1);const sibling=await single.evaluate(async()=>{const state=await window.applicationShell.state();try{await window.applicationShell.openDocument({vaultId:state.vault.id,path:'sibling.txt'});return 'unexpected';}catch(error){return error.message;}});assert.match(sibling,/does not have permission/);checks.push('single-document selection grants no sibling access');
  const preferences=await application.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().map(w=>w.webContents.getLastWebPreferences()));for(const value of preferences){assert.equal(value.sandbox,true);assert.equal(value.contextIsolation,true);assert.equal(value.nodeIntegration,false);assert.equal(value.webSecurity,true);}assert.equal(await page.evaluate(()=>typeof window.require),'undefined');const popup=await page.evaluate(()=>window.open('https://example.invalid/')===null);assert.equal(popup,true);checks.push('sandbox, isolated bridge, no renderer Node access, popup denial');
  if(process.env.SHELL_QA_SCREENSHOT)await page.screenshot({path:process.env.SHELL_QA_SCREENSHOT.replace(/\.png$/, '-desktop.png')});
  await page.setViewportSize({width:700,height:600});await page.locator('#quick-switch').click();await page.locator('#switcher').waitFor();await page.locator('#switch-close').click();checks.push('compact viewport controls');
  if(process.env.SHELL_QA_SCREENSHOT)await page.screenshot({path:process.env.SHELL_QA_SCREENSHOT});
  assert.deepEqual(errors,[]);checks.push('no renderer exceptions or console errors');
  console.log(JSON.stringify({status:'passed',electron:require('electron/package.json').version,playwright:require('playwright/package.json').version,checks,nativePickerUI:'not automated; only its trusted selection result is substituted',systemAssociations:'unchanged; open-file/open-url events injected without registration',data:'synthetic files in a new temporary directory'},null,2));
 }finally{await application.close();await fs.rm(temporary,{recursive:true,force:true});}
}
main().catch(error=>{console.error(error);process.exitCode=1;});

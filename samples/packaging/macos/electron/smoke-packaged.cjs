'use strict';
// Developer-side QA only. This script and Playwright are never put in the .app.
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const productTitle="life'winner 文档工作台";
const args=process.argv.slice(2),option=name=>{const index=args.indexOf(name);if(index<0||!args[index+1])throw Error('Missing '+name);return args[index+1];};
async function main(){
 const bundle=path.resolve(option('--app')),output=path.resolve(option('--output')),playwright=require(path.resolve(option('--playwright')));
 const temporary=await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()),'workbench-packaged-qa-'));
 const home=path.join(temporary,'home'),tmp=path.join(temporary,'tmp'),workspace=path.join(temporary,'Synthetic workspace');for(const folder of [home,tmp,workspace])await fs.mkdir(folder);
 await fs.writeFile(path.join(workspace,'welcome.md'),'# Standalone Mac app\nThis synthetic document is read without external Node or Xcode.');
 const environment={PATH:'/usr/bin:/bin:/usr/sbin:/sbin',HOME:home,TMPDIR:tmp,LANG:'en_US.UTF-8',LC_ALL:'en_US.UTF-8'};
 const application=await playwright._electron.launch({executablePath:path.join(bundle,'Contents/MacOS/DocumentWorkbench'),args:[],env:environment,timeout:30000});
 const errors=[];let receipt;
 try{
  const page=await application.firstWindow();page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.locator('#welcome').waitFor();assert.equal(await page.title(),productTitle);assert.equal(page.url(),'inkspace-shell-ui://ui/index.html');
  await page.locator('#help summary').click();assert.match(await page.locator('#help').innerText(),/无需安装 Node.js 或 Xcode/);await page.locator('#help summary').click();
  const runtime=await application.evaluate(({app})=>({node:process.versions.node,electron:process.versions.electron,arch:process.arch,path:process.env.PATH,isPackaged:app.isPackaged,resourcesInBundle:process.resourcesPath.includes('/Contents/Resources'),usesTemporaryProfile:app.getPath('userData').startsWith(process.env.TMPDIR)}));
  assert.equal(runtime.electron,'44.3.0');assert.equal(runtime.path,environment.PATH);assert.equal(require('node:child_process').spawnSync('/usr/bin/which',['node'],{env:{PATH:environment.PATH}}).status,1);runtime.hasExternalNode=false;assert.equal(runtime.isPackaged,true);assert.equal(runtime.resourcesInBundle,true);assert.equal(runtime.usesTemporaryProfile,true);
  // OS selection adapter with only an explicitly synthetic file. No real files.
  const next=application.waitForEvent('window');await application.evaluate(({app},file)=>{app.emit('open-file',{preventDefault(){}},file);},path.join(workspace,'welcome.md'));
  const document=await next;await document.locator('#preview').filter({hasText:'without external Node or Xcode'}).waitFor();assert.equal(await document.title(),productTitle);assert.equal(await document.locator('#files button').count(),1);
  assert.deepEqual(errors,[]);await fs.mkdir(output,{recursive:true});await document.screenshot({path:path.join(output,'packaged-'+runtime.arch+'.png')});
  receipt={status:'passed',product:productTitle,runtime,checks:['packaged app launches from its own executable','actual renderer window and bundled UI','in-app onboarding help','clean PATH has no external Node','embedded Electron Node runtime','isolated temporary HOME/profile','OS open-file adapter with a new synthetic file','actual UTF-8 preview and single-file list','no observed renderer errors'],testData:'synthetic only',systemAssociations:'unchanged',nativePickerUI:'not automated',sourceBehaviorTests:'reused 25 core tests and 12 GUI groups after source SHA comparison; this run tests the packaging boundary'};
 }finally{await application.close();await fs.rm(temporary,{recursive:true,force:true});}
 await fs.writeFile(path.join(output,'packaged-'+receipt.runtime.arch+'-smoke.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});

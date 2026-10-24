'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {extensions:{BrowserExtensions}}=require('..');

async function fixture(t,{confirm=1,cancel=false,linked=false}={}){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'inkspace-extension-package-'));
 t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const source=path.join(root,'source'),directory=path.join(root,'state');
 await fs.mkdir(source);await fs.mkdir(directory);
 await fs.writeFile(path.join(source,'manifest.json'),JSON.stringify({manifest_version:3,name:'Synthetic extension',version:'1.0',permissions:['storage'],content_scripts:[{matches:['https://example.test/*'],js:['content.js']}]}));
 await fs.writeFile(path.join(source,'content.js'),'// synthetic content script\n');
 if(linked){await fs.writeFile(path.join(root,'outside.txt'),'preserve');await fs.symlink(path.join(root,'outside.txt'),path.join(source,'linked.txt'));}
 const loads=[],removed=[],prompts=[];
 const session={extensions:{async loadExtension(folder,options){loads.push({folder,options});return{id:'synthetic-id-'+loads.length};},removeExtension(id){removed.push(id);}}};
 const dialog={async showOpenDialog(){return{canceled:cancel,filePaths:[source]};},async showMessageBox(_window,options){prompts.push(options);return{response:confirm};}};
 const manager=new BrowserExtensions({session,directory,dialog,getWindow:()=>undefined});
 await manager.initialize();return{root,source,directory,loads,removed,prompts,session,dialog,manager};
}

test('standalone extension manager installs a reviewed snapshot and persists its state',async t=>{
 const f=await fixture(t);const list=await f.manager.action('install');
 assert.equal(list.length,1);assert.equal(list[0].enabled,true);assert.equal(f.loads.length,1);
 assert.deepEqual(f.loads[0].options,{allowFileAccess:false});
 assert.ok(list[0].permissions.includes('permissions: storage'));assert.equal(f.prompts.length,1);
 const owned=path.join(f.directory,list[0].key,'content.js');
 await fs.writeFile(path.join(f.source,'content.js'),'changed original');
 assert.equal(await fs.readFile(owned,'utf8'),'// synthetic content script\n');
 const restored=new BrowserExtensions({session:f.session,directory:f.directory,dialog:f.dialog,getWindow:()=>undefined});
 await restored.initialize();assert.equal(restored.list()[0].enabled,true);assert.equal(f.loads.length,2);
});

test('standalone extension manager toggles and removes only its installed snapshot',async t=>{
 const f=await fixture(t);const [entry]=await f.manager.action('install');
 await f.manager.action('toggle',entry.key);assert.equal(f.manager.list()[0].enabled,false);assert.equal(f.removed.length,1);
 await f.manager.action('toggle',entry.key);assert.equal(f.manager.list()[0].enabled,true);assert.equal(f.loads.length,2);
 assert.deepEqual(await f.manager.action('remove',entry.key),[]);
 await assert.rejects(fs.stat(path.join(f.directory,entry.key)),{code:'ENOENT'});
 assert.equal(await fs.readFile(path.join(f.source,'content.js'),'utf8'),'// synthetic content script\n');
});

test('cancel and explicit rejection do not load or retain an extension',async t=>{
 for(const options of [{cancel:true},{confirm:0}]){
  const f=await fixture(t,options);assert.deepEqual(await f.manager.action('install'),[]);
  assert.equal(f.loads.length,0);assert.deepEqual(await fs.readdir(f.directory),[]);
 }
});

test('a linked source is rejected without changing its outside target',async t=>{
 const f=await fixture(t,{linked:true});
 await assert.rejects(f.manager.action('install'),{code:'PATH_DENIED'});
 assert.equal(f.loads.length,0);assert.equal(await fs.readFile(path.join(f.root,'outside.txt'),'utf8'),'preserve');
 assert.deepEqual(await fs.readdir(f.directory),[]);
});

test('unsupported manifest and unknown actions fail without a browser load',async t=>{
 const f=await fixture(t);await fs.writeFile(path.join(f.source,'manifest.json'),JSON.stringify({manifest_version:9,name:'Synthetic',version:'1'}));
 await assert.rejects(f.manager.action('install'),{code:'INVALID_REQUEST'});
 await assert.rejects(f.manager.action('toggle','missing'),{code:'INVALID_REQUEST'});
 assert.equal(f.loads.length,0);assert.deepEqual(await fs.readdir(f.directory),[]);
});

"use strict";
const fs=require('node:fs/promises');
const {constants}=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {fail}=require('./errors.cjs');
const MAX_PREVIEW_BYTES=512*1024;
const DOCUMENT_EXTENSIONS=['ipynb','json','md','markdown','tex','py','js','ts','txt','html','htm','css','cjs','mjs','jsx','tsx','swift','csv','tsv','pdf','png','jpg','jpeg','doc','docx','pptx','xls','xlsx','xlsm','mp4','mov','m4v'];
const TEXT_EXTENSIONS=new Set('ipynb json md markdown tex py js ts txt html htm css cjs mjs jsx tsx swift csv tsv'.split(' '));
function relativePath(value,{empty=false}={}){
 if(empty&&value==='')return '';
 if(typeof value!=='string'||!value||value.length>2048||/[\x00-\x1f\x7f-\x9f\\]/.test(value)||path.posix.isAbsolute(value))fail('PATH_DENIED');
 const parts=value.split('/');if(parts.some(part=>!part||part==='.'||part==='..'||part.startsWith('.'))||parts.some(part=>part.includes(':')))fail('PATH_DENIED');return value;
}
function selectedPath(value){if(typeof value!=='string'||!value||value.length>4096||/[\x00-\x1f\x7f-\x9f]/.test(value)||!path.isAbsolute(value)||path.resolve(value)!==value)fail('PATH_DENIED');return value;}
function kindOf(file){const ext=path.extname(file).slice(1).toLowerCase();return !DOCUMENT_EXTENSIONS.includes(ext)?'unsupported':TEXT_EXTENSIONS.has(ext)?'text':'binary';}
function fileWithin(root,file){const rel=path.relative(root,file);if(!rel||rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel))return null;try{return relativePath(rel.split(path.sep).join('/'));}catch{return null;}}
async function inspectDocument(value){const selected=selectedPath(value),stat=await fs.lstat(selected);if(stat.isSymbolicLink()||!stat.isFile()||stat.nlink!==1)fail('PATH_DENIED');if(kindOf(selected)==='unsupported')fail('UNSUPPORTED');const directory=await fs.realpath(path.dirname(selected)),file=path.join(directory,path.basename(selected));if(await fs.realpath(selected)!==file)fail('PATH_DENIED');relativePath(path.basename(file));return{file,directory};}
// Host-only capabilities. Renderer callers receive UUIDs and relative names.
// A selected document grants that one file; selecting a folder grants its tree.
class DocumentCapabilities{
 constructor(){this.vaults=new Map();}
 descriptor(id){const value=this.vaults.get(id);if(!value)fail('PERMISSION_DENIED');return{id,name:value.name,kind:value.allowed?'document':'workspace'};}
 async grantVault(selected){selectedPath(selected);const stat=await fs.lstat(selected),root=await fs.realpath(selected);if(stat.isSymbolicLink()||!stat.isDirectory()||root!==selected)fail('PATH_DENIED');const existing=[...this.vaults.entries()].find(([,v])=>!v.allowed&&v.root===root&&v.dev===stat.dev&&v.ino===stat.ino);if(existing)return this.descriptor(existing[0]);const id=crypto.randomUUID();this.vaults.set(id,{root,dev:stat.dev,ino:stat.ino,name:path.basename(root)||'Workspace',allowed:null});return this.descriptor(id);}
 async grantDocument(selected){const{file,directory}=await inspectDocument(selected),name=path.basename(file),stat=await fs.stat(directory),fileStat=await fs.stat(file);const existing=[...this.vaults.entries()].find(([,v])=>v.root===directory&&v.allowed?.has(name)&&v.fileDev===fileStat.dev&&v.fileIno===fileStat.ino);if(existing)return this.descriptor(existing[0]);const id=crypto.randomUUID();this.vaults.set(id,{root:directory,dev:stat.dev,ino:stat.ino,name,allowed:new Set([name]),fileDev:fileStat.dev,fileIno:fileStat.ino});return this.descriptor(id);}
 async resolve(id,relative,{directory=false}={}){
  const grant=this.vaults.get(id);if(!grant)fail('PERMISSION_DENIED');relativePath(relative,{empty:directory});if(grant.allowed&&!grant.allowed.has(relative))fail('PERMISSION_DENIED');
  const rootStat=await fs.lstat(grant.root);if(rootStat.isSymbolicLink()||!rootStat.isDirectory()||rootStat.dev!==grant.dev||rootStat.ino!==grant.ino||await fs.realpath(grant.root)!==grant.root)fail('PATH_DENIED');
  let target=grant.root,stat=rootStat;for(const part of relative?relative.split('/'):[]){target=path.join(target,part);stat=await fs.lstat(target);if(stat.isSymbolicLink())fail('PATH_DENIED');}
  if(await fs.realpath(target)!==target)fail('PATH_DENIED');
  if(directory?!stat.isDirectory():!stat.isFile()||stat.nlink!==1)fail('PATH_DENIED');
  if(grant.allowed&&(stat.dev!==grant.fileDev||stat.ino!==grant.fileIno))fail('PATH_DENIED');return{path:target,stat};
 }
 async list(id,relative=''){
  const grant=this.vaults.get(id);if(!grant)fail('PERMISSION_DENIED');
  if(grant.allowed){if(relative)fail('PERMISSION_DENIED');const out=[];for(const name of grant.allowed){await this.resolve(id,name);out.push({name,path:name,kind:kindOf(name)});}return out;}
  const{path:directory}=await this.resolve(id,relative,{directory:true}),entries=await fs.readdir(directory,{withFileTypes:true});
  if(entries.length>4096)fail('TOO_LARGE');return entries.filter(entry=>!entry.name.startsWith('.')&&!entry.isSymbolicLink()&&(entry.isDirectory()||kindOf(entry.name)!=='unsupported')).map(entry=>({name:entry.name,path:relative?relative+'/'+entry.name:entry.name,kind:entry.isDirectory()?'directory':kindOf(entry.name)})).sort((a,b)=>Number(b.kind==='directory')-Number(a.kind==='directory')||a.name.localeCompare(b.name));
 }
 async read(id,relative){
  const{path:target,stat}=await this.resolve(id,relative),kind=kindOf(relative);if(kind==='unsupported')fail('UNSUPPORTED');
  if(kind==='binary')return{path:relative,kind,size:stat.size,hostEditorRequired:true};
  if(stat.size>MAX_PREVIEW_BYTES)fail('TOO_LARGE');const handle=await fs.open(target,constants.O_RDONLY|constants.O_NOFOLLOW);
  try{const opened=await handle.stat();if(opened.dev!==stat.dev||opened.ino!==stat.ino||opened.nlink!==1||opened.size>MAX_PREVIEW_BYTES)fail('PATH_DENIED');const chunks=[],buffer=Buffer.alloc(64*1024);let total=0;while(true){const{bytesRead}=await handle.read(buffer,0,buffer.length,null);if(!bytesRead)break;total+=bytesRead;if(total>MAX_PREVIEW_BYTES)fail('TOO_LARGE');chunks.push(Buffer.from(buffer.subarray(0,bytesRead)));}let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks));}catch{fail('INVALID_TEXT');}return{path:relative,kind,text,size:total};}finally{await handle.close();}
 }
}
module.exports={DocumentCapabilities,relativePath,selectedPath,kindOf,fileWithin,inspectDocument,DOCUMENT_EXTENSIONS,MAX_PREVIEW_BYTES};

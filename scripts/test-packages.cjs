#!/usr/bin/env node
'use strict';
// Copy every package outside the checkout and expose only declared dependencies.
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
const {builtinModules,createRequire}=require('node:module');
const root=path.resolve(__dirname,'..');
const catalogPath=path.join(root,'modules.json');
const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
const installed=process.env.INKSPACE_TEST_DEPENDENCIES||path.join(root,'node_modules');
const lookup=createRequire(path.join(root,'package.json'));
const builtins=new Set(builtinModules.flatMap(name=>[name,'node:'+name]));
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'inkspace-module-packages-'));
const record=process.argv.includes('--record');
const packageFlag=process.argv.indexOf('--package');
const selected=packageFlag<0?catalog.packages:catalog.packages.filter(entry=>entry.id===process.argv[packageFlag+1]);
if(!selected.length)throw Error('Unknown package selection.');
let failed=0,totalTests=0,totalSkipped=0;

function dependencyRoot(name){
 const candidate=path.join(installed,name);
 if(fs.existsSync(path.join(candidate,'package.json')))return fs.realpathSync(candidate);
 let current;
 try{current=path.dirname(lookup.resolve(name));}catch{throw Error('Missing installed dependency: '+name+'. Run npm install or set INKSPACE_TEST_DEPENDENCIES.');}
 while(path.dirname(current)!==current){
  const metadata=path.join(current,'package.json');
  if(fs.existsSync(metadata)&&JSON.parse(fs.readFileSync(metadata,'utf8')).name===name)return current;
  current=path.dirname(current);
 }
 throw Error('Cannot locate declared dependency: '+name);
}
function walk(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{const file=path.join(directory,entry.name);if(entry.isSymbolicLink())throw Error('Package source contains a symbolic link.');return entry.isDirectory()?walk(file):[file];});}
function checkImports(packageRoot,metadata){
 for(const file of walk(packageRoot)){
  const relative=path.relative(packageRoot,file);
  if(!(relative==='index.cjs'||relative.startsWith('lib'+path.sep))||!['.cjs','.js'].includes(path.extname(file)))continue;
  for(const match of fs.readFileSync(file,'utf8').matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g)){
   const target=match[1];
   if(target.startsWith('.')){
    const resolved=path.resolve(path.dirname(file),target);
    if(resolved!==packageRoot&&!resolved.startsWith(packageRoot+path.sep))throw Error('Relative import escapes its package: '+relative);
    if(!['','.cjs','.js','.json'].some(suffix=>fs.existsSync(resolved+suffix)))throw Error('Missing package resource required by '+relative);
   }else if(!builtins.has(target)){
    const dependency=target.startsWith('@')?target.split('/').slice(0,2).join('/'):target.split('/')[0];
    if(!Object.hasOwn(metadata.dependencies||{},dependency))throw Error('Undeclared dependency '+dependency+' in '+relative);
   }
  }
 }
}
function cleanOutput(value){let text=String(value||'');for(const location of [temporary,root,installed,os.homedir()])text=text.split(location).join('[local]');return text;}
try{
 for(const entry of selected){
  const packageSource=path.join(root,entry.path),copy=path.join(temporary,entry.id);
  let result;
  try{
   const metadata=JSON.parse(fs.readFileSync(path.join(packageSource,'package.json'),'utf8'));
   checkImports(packageSource,metadata);
   fs.cpSync(packageSource,copy,{recursive:true,filter:source=>!['node_modules','.git'].includes(path.basename(source))});
   for(const name of Object.keys(metadata.dependencies||{})){
    const target=path.join(copy,'node_modules',name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.symlinkSync(dependencyRoot(name),target,process.platform==='win32'?'junction':'dir');
   }
   const loaded=spawnSync(process.execPath,['-e','const api=require(process.argv[1]);if(!api||!Object.keys(api).length)throw Error("Empty package API");',copy],{cwd:temporary,encoding:'utf8',timeout:30000});
   if(loaded.status!==0)throw Error('Isolated package require failed.\n'+cleanOutput(loaded.stderr));
   const testRoot=path.join(copy,'test');
   const tests=fs.readdirSync(testRoot).filter(name=>name.endsWith('.test.cjs')).sort().map(name=>path.join(testRoot,name));
   if(!tests.length)throw Error('Package has no behavioral tests.');
   const execution=spawnSync(process.execPath,['--test','--test-reporter=tap',...tests],{cwd:temporary,env:{...process.env},encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024});
   const text=(execution.stdout||'')+'\n'+(execution.stderr||'');
   const counts=Object.fromEntries([...text.matchAll(/^# (tests|pass|fail|cancelled|skipped) (\d+)$/gm)].map(match=>[match[1],Number(match[2])]));
   result={status:execution.status===0?'passed':'failed',isolatedRequire:true,packageImports:'contained',...counts};
   if(execution.status!==0){failed++;const lines=text.split('\n'),blocks=[];let capturing=false;for(const line of lines){if(line.startsWith('not ok '))capturing=true;else if(line.startsWith('# Subtest:')||line.startsWith('ok ')||line.startsWith('1..'))capturing=false;if(capturing)blocks.push(line);}console.error(entry.id+': FAILED\n'+cleanOutput(blocks.length?blocks.join('\n'):text).slice(-6000));}
   else console.log(entry.id+': passed ('+(counts.tests||0)+' tests, '+(counts.skipped||0)+' skipped)');
   totalTests+=counts.tests||0;totalSkipped+=counts.skipped||0;
  }catch(error){failed++;result={status:'failed',reason:cleanOutput(error.message)};console.error(entry.id+': '+cleanOutput(error.message));}
  if(record)entry.verification=result;
 }
 if(record){const bad=catalog.packages.filter(entry=>entry.verification.status!=='passed').length;catalog.verification={status:bad?'incomplete':'passed',packages:catalog.packages.length,failedOrPendingPackages:bad,tests:catalog.packages.reduce((sum,entry)=>sum+(entry.verification.tests||0),0),skipped:catalog.packages.reduce((sum,entry)=>sum+(entry.verification.skipped||0),0),isolatedOutsideRepository:true,dependencyMode:'Only declared installed npm dependencies were made available; no network installation was performed.'};fs.writeFileSync(catalogPath,JSON.stringify(catalog,null,2)+'\n');}
 console.log(JSON.stringify({packages:selected.length,failedPackages:failed,tests:totalTests,skipped:totalSkipped,isolatedOutsideRepository:true}));
 process.exitCode=failed?1:0;
}finally{fs.rmSync(temporary,{recursive:true,force:true});}

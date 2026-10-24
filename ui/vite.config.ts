import {defineConfig,type Plugin} from 'vite';
import {resolve,dirname,basename} from 'node:path';
import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs';
const entries=['index','host','editor','knowledge','documents','notebook','planning','pdf','board','media','study','tools'];
function bundledLicenses():Plugin{return{name:'bundled-dependency-notices',generateBundle(){
 const packages=new Map<string,{name:string;version:string;license:string;directory:string}>();
 for(const id of this.getModuleIds()){
  const filename=id.split('?')[0];if(!filename.includes('node_modules')||filename.startsWith('\0'))continue;
  let directory=dirname(filename);
  while(directory!==dirname(directory)){
   const manifest=resolve(directory,'package.json');if(existsSync(manifest)){try{const record=JSON.parse(readFileSync(manifest,'utf8'));if(record.name&&record.version){packages.set(directory,{name:record.name,version:record.version,license:record.license||'See notices',directory});break;}}catch{}}
   directory=dirname(directory);
  }
 }
 const records=[];
 for(const record of packages.values()){
  const name=record.name.replaceAll('/','_');let notices=0;
  for(const file of readdirSync(record.directory))if(/^(?:licen[sc]e|notice|copying|authors)(?:\.|$|[-_])/i.test(file)&&statSync(resolve(record.directory,file)).isFile()){
   this.emitFile({type:'asset',fileName:`licenses/${name}/${basename(file)}`,source:readFileSync(resolve(record.directory,file))});notices++;
  }
  if(!notices){
   const metadata=JSON.parse(readFileSync(resolve(record.directory,'package.json'),'utf8'));
   this.emitFile({type:'asset',fileName:`licenses/${name}/package-license-metadata.json`,source:JSON.stringify(Object.fromEntries(['name','version','license','author','contributors','repository','homepage'].filter(key=>metadata[key]!==undefined).map(key=>[key,metadata[key]])),null,2)});notices++;
   const readme=readdirSync(record.directory).find(file=>/^readme(?:\.|$)/i.test(file)&&statSync(resolve(record.directory,file)).isFile());
   if(readme)this.emitFile({type:'asset',fileName:`licenses/${name}/${basename(readme)}`,source:readFileSync(resolve(record.directory,readme))});
  }
  records.push({name:record.name,version:record.version,license:record.license,notices});
 }
 this.emitFile({type:'asset',fileName:'licenses/dependencies.json',source:JSON.stringify(records.sort((a,b)=>a.name.localeCompare(b.name)),null,2)});
}}}
export default defineConfig({plugins:[bundledLicenses()],build:{lib:{entry:Object.fromEntries(entries.map(name=>[name,resolve(import.meta.dirname,'src/entries/'+name+(name==='host'||name==='index'?'.ts':'.tsx'))])),formats:['es'],fileName:(_format,name)=>name+'.js',cssFileName:'style'},rollupOptions:{external:['react','react-dom','react/jsx-runtime','react-dom/client'],output:{banner:'"use client";'}},target:'es2022',emptyOutDir:true},publicDir:false});

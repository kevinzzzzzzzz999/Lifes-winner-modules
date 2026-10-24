import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import * as UI from '../dist/index.js';
import '../dist/style.css';
const params=new URLSearchParams(location.search),entry=params.get('entry')||'CodeEditor';
const noop=()=>{},asyncNoop=async()=>{};
const noteID='00000000-0000-0000-0000-000000000001';
const originalBoard={schemaVersion:1,id:'00000000-0000-0000-0000-000000000010',writerID:'00000000-0000-0000-0000-000000000011',title:'Synthetic board',revision:0,createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z',canvasWidth:8000000,canvasHeight:8000000,viewport:{x:4000000,y:4000000,zoom:1},items:[{id:noteID,kind:'text',x:3999800,y:3999900,width:300,height:120,title:'Example node',text:'Synthetic note',textFormat:'markdown'}],edges:[],pins:[]};
const entries=[{path:'Notes',name:'Notes',kind:'folder',bytes:0},{path:'sample.md',name:'sample.md',kind:'text',bytes:20}];
const stats={Notes:{known:true,complete:true,scanning:false,bytes:1024,files:1,directories:0}};
const files=new Map<string,string>();const subscribers=new Set<(event:any)=>void>();let writes=0;
function ok(value:any){return{ok:true,value}}function failed(code:string,message:string){return{ok:false,error:{code,message}}}
async function fingerprint(text:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),n=>n.toString(16).padStart(2,'0')).join('')}
async function opened(path:string){const text=files.get(path);if(text===undefined)return failed('NOT_FOUND','Synthetic file is absent');return ok({path,name:path.split('/').at(-1),kind:'text',text,sha256:await fingerprint(text),bytes:new TextEncoder().encode(text).length,encoding:{bom:false,newline:'lf'}})}
function publish(path:string){for(const listener of subscribers)listener({vaultId:'synthetic',paths:[path],rescan:false,reviewsChanged:false})}
const translation={available:false,hasKey:false,locked:false,hasStoredSettings:false,provider:'openai',model:'',providers:[]};
const adapter:any={
 async listDirectory({path}:any){return ok({path,parent:path?'':null,entries:path?[]:[...entries,...[...files.keys()].map(path=>({path,name:path,kind:'text',bytes:files.get(path)!.length}))],warnings:[]})},
 async getFolderOrder(){return ok({paths:[]})},async setFolderOrder({paths}:any){return ok({paths})},
 readFile:({path}:any)=>opened(path),async createTextFile({parentPath,name,content}:any){const path=[parentPath,name].filter(Boolean).join('/');if(files.has(path))return failed('EXISTS','Synthetic file exists');files.set(path,content);writes++;publish(path);return opened(path)},
 async saveText({path,expectedSHA256,text}:any){const before=files.get(path);if(before===undefined||await fingerprint(before)!==expectedSHA256)return failed('CONFLICT','Synthetic file changed');files.set(path,text);writes++;publish(path);return ok({sha256:await fingerprint(text),bytes:new TextEncoder().encode(text).length,backupId:'synthetic'})},
 onVaultChange(listener:any){subscribers.add(listener);return()=>subscribers.delete(listener)},
 async readCalendarFile(){const path='人生赢家日历.inkcalendar.json';return files.has(path)?opened(path):ok(null)},
 async calendarReminderStatus(){return ok({status:'unsupported',scheduled:0,permission:'system-managed'})},async consumeCalendarReminder(){return ok(null)},async scheduleCalendarReminders(){return ok({status:'unsupported',scheduled:0,permission:'system-managed'})},onCalendarReminder(){return noop},onCalendarReminderStatus(){return noop},
 async notebookInfo(){return ok({available:false,pythonVersion:'',engine:'IPython',packages:{},maxKernelCount:0,timeoutSeconds:0,sandboxed:false})},
 async mediaEditorInfo(){return ok({available:false,reason:'This browser smoke has no FFmpeg host.'})},onMediaEditorEvent(){return noop},
 async translationInfo(){return ok(translation)},async getAssetUrl(){return ok({url:'/sample.pdf',sha256:'a'.repeat(64)})},
 async readStudy(){return ok({boardID:originalBoard.id,cards:[],warnings:[]})},async appendStudy(){return failed('UNAVAILABLE','No study persistence supplied in this fixture')},
 async getVideoUrl(){return failed('UNAVAILABLE','No media source is supplied in this fixture')},async releaseVideoUrl(){return ok({released:true})},async getVideoSubtitles(){return ok({subtitle:null,sha256:null})},async saveVideoSubtitles(){return failed('UNAVAILABLE','No subtitle persistence supplied in this fixture')},
 async localOCRInfo(){return ok({available:false,maxPages:10,pdfMiB:256,imageMiB:64,timeoutSeconds:90})},async recognizeLocalOCR(){return failed('UNAVAILABLE','No Apple Vision host in browser')},async cancelLocalOCR(){return ok({cancelled:true})},
 async importNoteExchange(){return failed('UNAVAILABLE','No file picker supplied')},async exportNoteExchange(){return failed('UNAVAILABLE','No file picker supplied')}
};
if(params.get('host')==='provided')UI.configureInkSpaceHost(adapter);
// Sentinel globals prove the component library never falls back to the complete App bridge.
for(const key of ['desktop','inkspace'])Object.defineProperty(window,key,{get(){throw new Error('Implicit complete-App bridge was accessed')},configurable:true});
function Fixture(){
 const [text,setText]=useState('print(1)'),[marginText,setMarginText]=useState('# Margin note\n\nA synthetic annotation.'),[marginPosition,setMarginPosition]=useState<'right'|'bottom'>('right'),[board,setBoard]=useState<any>(originalBoard),[box,setBox]=useState<any>({text:'Editable note',textFormat:'markdown'}),[document,setDocument]=useState<any>({version:1,format:'docx',title:'Example document',blocks:[{kind:'paragraph',text:'Editable paragraph'}]}),[result,setResult]=useState('Ready');
 const changed=(value:any)=>{setResult(typeof value==='string'?value:JSON.stringify(value));};
 const common:any={language:'en',vault:{id:'synthetic',name:'Synthetic workspace'},vaultId:'synthetic',path:'sample.inkspace.json',onClose:()=>setResult('Closed'),onSaved:()=>setResult('Saved'),onChanged:asyncNoop,onOpen:changed,onOpenSource:changed,onOpenChecklist:changed,onImported:noop,onPrepare:asyncNoop,onStateChange:noop,onLocate:changed,onSource:asyncNoop,onOutlineChange:asyncNoop,onSelect:changed,onOpenOriginal:changed,onDelete:changed,onReload:noop,onToggle:noop,onMove:asyncNoop,onTrash:asyncNoop,onRestore:asyncNoop};
 const props:any={
 CodeEditor:{path:'sample.py',value:text,onChange:(v:string)=>{setText(v);changed(v)}},TextBoxEditor:{...common,value:box,onChange:(v:any)=>{setBox(v);changed(v)}},
 KnowledgeGraph:{...common,nodes:[{id:'one',path:'sample.md',label:'Example note'}],edges:[]},MindMapEditor:{...common,board,onChange:(v:any)=>{setBoard(v);changed(v)}},
 MemoryPalace:{floors:[{path:'',entries}],route:[''],current:'',stats,width:1000,height:650,zh:false,arranging:false,onReorder:changed,onFloor:changed,onActivate:changed},
 KnowledgeWalkthrough:{entries,stats,current:'',width:1000,height:650,zh:false,onActivate:changed,onParent:changed,onExit:changed},KnowledgeSpace:{...common,onOpen:changed},
 DocumentPreview:{...common,text:'# Example heading\n\nSynthetic Markdown.',format:'md'},FormulaView:{text:'x^2 + 1'},CsvPreview:{...common,text:'name,value\nExample,2'},HtmlPreview:{...common,text:'<h1>Example HTML</h1><p>Synthetic body</p>',title:'Example HTML'},StructuredDocumentEditor:{...common,value:document,onChange:(v:any)=>{setDocument(v);changed(v)}},
 MarginNotes:{language:'en',path:'notes/margin.md',text:marginText,dirty:true,position:marginPosition,onChange:(v:string)=>{setMarginText(v);changed(v)},onSave:()=>setResult('Margin saved: '+marginText),onImage:()=>setResult('Image insertion callback'),onClose:()=>setResult('Margin closed'),onPosition:()=>setMarginPosition(v=>v==='right'?'bottom':'right')},
 PDFPage:{url:'/sample.pdf',page:1,width:700},PDFReader:{...common,url:'/sample.pdf'},BoardViewer:{...common,raw:board},InkReplay:{...common,board},
 NotebookEditor:{...common,value:JSON.stringify({nbformat:4,nbformat_minor:5,metadata:{},cells:[{id:'example',cell_type:'code',source:['print(1)'],metadata:{},outputs:[],execution_count:null}]}),onChange:changed,onRun:()=>setResult('Execution callback invoked; no Python claimed'),onInterrupt:noop,onRestart:noop,onSave:noop},
 QuickNotes:common,CourseChecklist:common,Calendar:common,MediaEditor:{...common,open:true,request:{vaultId:'synthetic',nonce:1}},VideoPlayer:{...common,path:'sample.mp4'},StudyPanel:{...common,board},
 ReviewPanel:{...common,reviews:[],warnings:[],truncated:false,error:'',loading:false,deleting:null,visible:true,currentPath:'sample.inkspace.json',currentSHA:'a'.repeat(64)},
 LocalOCR:{...common,path:'sample.pdf'},NoteExchange:{...common,initialFolder:''},FileManagement:{...common,action:{kind:'move',paths:['sample.md']}},TranslationSettings:common,MathWorkbench:{...common,open:true,sourceURL:'/math-lab/simple.html'}
 };
 const Component=(UI as any)[entry];if(!Component)throw new Error('Unknown independent entry: '+entry);
 (window as any).smokeState={writes,files:()=>[...files.entries()],entry};
 return <><output id="result" data-testid="fixture-result">{entry}: {result}</output><main id="fixture"><Component {...props[entry]}/></main></>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);

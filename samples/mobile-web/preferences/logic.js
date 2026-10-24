// Standalone, local-only preference plans. No DOM, storage or network is used
// unless the caller supplies storage callbacks to PreferencesSession.
export const DOMAIN = 'org.inkspace.tools.preferences';
export const STORAGE_KEY = 'preferences-plan.v1';
export const MAX_BYTES = 65536;
export const TOOLBAR = [
  ['undo','撤销','Undo','↶'],['redo','重做','Redo','↷'],['reviews','待批注','Reviews','◷'],
  ['assistant','AI 网页','AI website','✧'],['locateFiles','定位资料','Locate files','⌕'],
  ['lastInk','最后一笔','Last ink','⌁'],['selectText','选择文字','Select text','T'],
  ['copyText','复制文字','Copy text','⧉'],['translation','圈选翻译','Translate','文'],
  ['viewOptions','缩放定位','Zoom & locate','⊕'],['penPalette','笔与颜色','Pens','✎'],
  ['ruler','直尺','Ruler','▱'],['boardTools','白板工具','Board tools','▦'],['readAloud','朗读','Read aloud','♪']
];
export const PEN_KINDS = ['pen','fountainPen','monoline','pencil','marker','watercolor','crayon','reed'];
export const ACTIONS = ['system','eraser','previous','palette','attributes','none'];
export const SHAPES = ['off','circle','ellipse','rectangle','triangle','arrow','axes'];
export const SEEK_INTERVALS = [1,3,5,15,30];
export const PLAYBACK_RATES = [0.25,0.5,0.75,1,1.25,1.5,1.75,2];
const encoder = new TextEncoder();
const clone = value => JSON.parse(JSON.stringify(value));
const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export class PlanError extends Error { constructor(message) { super(message); this.name = 'PlanError'; } }
function fail(field) { throw new PlanError(`方案字段无效或不完整：${field}。当前方案未改变。`); }
function record(value, keys, field, optional=[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype,null].includes(Object.getPrototypeOf(value))) fail(field);
  if (Object.keys(value).some(key => !keys.includes(key) && !optional.includes(key)) || keys.some(key => !Object.hasOwn(value,key))) fail(field);
  return value;
}
function choice(value, options, field) { if (!options.includes(value)) fail(field); return value; }
function number(value, min, max, field, integer=false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || integer && !Number.isInteger(value)) fail(field);
  return value;
}
function boolean(value, field) { if (typeof value !== 'boolean') fail(field); return value; }
function uuid(value, field) { if (typeof value !== 'string' || !uuidPattern.test(value)) fail(field); return value.toUpperCase(); }
function hex(value, field) { if (typeof value !== 'string' || !/^#[a-f0-9]{6}$/i.test(value)) fail(field); return value.toUpperCase(); }
function wellFormed(value) {
  for (let i=0;i<value.length;i++) {
    const c=value.charCodeAt(i);
    if (c>=0xD800 && c<=0xDBFF) { const next=value.charCodeAt(++i); if (!(next>=0xDC00 && next<=0xDFFF)) return false; }
    else if (c>=0xDC00 && c<=0xDFFF) return false;
  }
  return true;
}
function namedPen(value, index) {
  const field=`savedPens.pens[${index}]`;
  record(value,['id','name','kind','red','green','blue','alpha','width'],field);
  if (typeof value.name!=='string' || !value.name.trim() || !wellFormed(value.name) || encoder.encode(value.name).length>256) fail(field+'.name');
  return {id:uuid(value.id,field+'.id'),name:value.name,kind:choice(value.kind,PEN_KINDS,field+'.kind'),
    red:number(value.red,0,1,field+'.red'),green:number(value.green,0,1,field+'.green'),blue:number(value.blue,0,1,field+'.blue'),
    alpha:number(value.alpha,0,1,field+'.alpha'),width:number(value.width,Number.MIN_VALUE,Number.MAX_VALUE,field+'.width')};
}

export function defaultPlan() {
  const styles=[['Ballpoint','pen',2,0,0,0],['Fountain pen','fountainPen',4,0,0,0],['Monoline','monoline',2,0,0,0],
    ['Pencil','pencil',3,1/3,1/3,1/3],['Marker','marker',18,1,0.8,0],['Watercolor','watercolor',12,0,0.478,1],['Crayon','crayon',8,1,0.584,0]];
  const pens=styles.map(([name,kind,width,red,green,blue],i)=>({id:`00000000-0000-0000-0000-${String(i+1).padStart(12,'0')}`,name,kind,width,red,green,blue,alpha:1}));
  return {formatVersion:1,domain:DOMAIN,preferences:{version:1,language:'system',
    panels:{version:1,leftWidth:280,rightWidth:480,leftOpen:true},toolbar:{hiddenMask:0},
    gestures:{doubleTap:'system',squeeze:'system'},holdLine:{isEnabled:true,holdDuration:0.65},geometry:{shape:'off'},
    dock:{edge:'bottom',isMinimized:false,usesSystemPalette:false},savedPens:{pens},
    palette:{version:1,entries:[{kind:'pen',penID:pens[0].id},{kind:'eraser'},{kind:'lasso'},{kind:'ruler'},...pens.slice(1).map(p=>({kind:'pen',penID:p.id}))]},
    playback:{seekInterval:5,playbackRate:1,replayMode:'dimmed',subtitles:{fontSize:20,textColor:'#FFFFFF',strokeColor:'#000000',strokeWidth:0,backgroundColor:'#000000',backgroundOpacity:0.78}},
    aiWebsite:'chatgpt',translationService:'openAI'}};
}

/// Validate every known field before returning a fresh canonical value. Swift's
/// optional selectedID may be missing/null; all other fields are required.
export function validatePlan(input) {
  record(input,['formatVersion','domain','preferences'],'plan');
  if (input.formatVersion!==1) throw new PlanError('不支持此方案版本。当前方案未改变。');
  if (input.domain!==DOMAIN) throw new PlanError('这不是本工具的方案文件。当前方案未改变。');
  const p=record(input.preferences,['version','language','panels','toolbar','gestures','holdLine','geometry','dock','savedPens','palette','playback','aiWebsite','translationService'],'preferences');
  if (p.version!==1) throw new PlanError('不支持此设置版本。当前方案未改变。');
  const panels=record(p.panels,['version','leftWidth','rightWidth','leftOpen'],'panels');
  if (panels.version!==1) fail('panels.version');
  const toolbar=record(p.toolbar,['hiddenMask'],'toolbar');
  const gestures=record(p.gestures,['doubleTap','squeeze'],'gestures');
  const hold=record(p.holdLine,['isEnabled','holdDuration'],'holdLine');
  const geometry=record(p.geometry,['shape'],'geometry');
  const dock=record(p.dock,['edge','isMinimized','usesSystemPalette'],'dock');
  const saved=record(p.savedPens,['pens'],'savedPens',['selectedID']);
  if (!Array.isArray(saved.pens) || saved.pens.length>256) fail('savedPens.pens');
  const pens=saved.pens.map(namedPen),ids=new Set(pens.map(pen=>pen.id));
  if (ids.size!==pens.length) fail('savedPens.pens duplicate id');
  let selectedID;
  if (saved.selectedID!==undefined && saved.selectedID!==null) { selectedID=uuid(saved.selectedID,'savedPens.selectedID'); if (!ids.has(selectedID)) fail('savedPens.selectedID'); }
  const palette=record(p.palette,['version','entries'],'palette');
  if (palette.version!==1 || !Array.isArray(palette.entries) || palette.entries.length>259) fail('palette');
  const seen=new Set(),usedPens=new Set();
  const entries=palette.entries.map((entry,i)=>{
    if (!entry || typeof entry!=='object') fail(`palette.entries[${i}]`);
    choice(entry.kind,['pen','eraser','lasso','ruler'],`palette.entries[${i}].kind`);
    record(entry,entry.kind==='pen'?['kind','penID']:['kind'],`palette.entries[${i}]`);
    const result=entry.kind==='pen'?{kind:'pen',penID:uuid(entry.penID,`palette.entries[${i}].penID`)}:{kind:entry.kind};
    const key=result.kind==='pen'?'pen:'+result.penID:result.kind;
    if (seen.has(key)) fail('palette duplicate entry'); seen.add(key);
    if (result.kind==='pen') { if (!ids.has(result.penID)) fail('palette unknown pen'); usedPens.add(result.penID); }
    return result;
  });
  if (usedPens.size!==ids.size) fail('palette missing pen');
  const playback=record(p.playback,['seekInterval','playbackRate','replayMode','subtitles'],'playback');
  const sub=record(playback.subtitles,['fontSize','textColor','strokeColor','strokeWidth','backgroundColor','backgroundOpacity'],'subtitles');
  const out={formatVersion:1,domain:DOMAIN,preferences:{version:1,language:choice(p.language,['system','zh','en'],'language'),
    panels:{version:1,leftWidth:number(panels.leftWidth,200,520,'panels.leftWidth'),rightWidth:number(panels.rightWidth,320,960,'panels.rightWidth'),leftOpen:boolean(panels.leftOpen,'panels.leftOpen')},
    toolbar:{hiddenMask:number(toolbar.hiddenMask,0,(1<<TOOLBAR.length)-1,'toolbar.hiddenMask',true)},
    gestures:{doubleTap:choice(gestures.doubleTap,ACTIONS,'gestures.doubleTap'),squeeze:choice(gestures.squeeze,ACTIONS,'gestures.squeeze')},
    holdLine:{isEnabled:boolean(hold.isEnabled,'holdLine.isEnabled'),holdDuration:number(hold.holdDuration,0.35,1.5,'holdLine.holdDuration')},
    geometry:{shape:choice(geometry.shape,SHAPES,'geometry.shape')},dock:{edge:choice(dock.edge,['top','bottom','left','right'],'dock.edge'),isMinimized:boolean(dock.isMinimized,'dock.isMinimized'),usesSystemPalette:boolean(dock.usesSystemPalette,'dock.usesSystemPalette')},
    savedPens:selectedID?{pens,selectedID}:{pens},palette:{version:1,entries},
    playback:{seekInterval:choice(playback.seekInterval,SEEK_INTERVALS,'playback.seekInterval'),playbackRate:choice(playback.playbackRate,PLAYBACK_RATES,'playback.playbackRate'),replayMode:choice(playback.replayMode,['progressive','dimmed'],'playback.replayMode'),
      subtitles:{fontSize:number(sub.fontSize,12,48,'subtitles.fontSize'),textColor:hex(sub.textColor,'subtitles.textColor'),strokeColor:hex(sub.strokeColor,'subtitles.strokeColor'),strokeWidth:number(sub.strokeWidth,0,4,'subtitles.strokeWidth'),backgroundColor:hex(sub.backgroundColor,'subtitles.backgroundColor'),backgroundOpacity:number(sub.backgroundOpacity,0,1,'subtitles.backgroundOpacity')}},
    aiWebsite:choice(p.aiWebsite,['chatgpt','deepseek','claude','gemini'],'aiWebsite'),translationService:choice(p.translationService,['openAI','deepSeek','gemini'],'translationService')}};
  return out;
}
export function serializePlan(value) {
  const text=JSON.stringify(validatePlan(value),null,2);
  if (encoder.encode(text).length>MAX_BYTES) throw new PlanError('方案超过64 KiB，请减少笔预设或名称长度。当前方案未改变。');
  return text;
}
export function parsePlan(text) {
  if (typeof text!=='string' || encoder.encode(text).length>MAX_BYTES) throw new PlanError('方案超过64 KiB或不是文本。当前方案未改变。');
  let input;try {input=JSON.parse(text);} catch {throw new PlanError('文件不是有效的JSON方案。当前方案未改变。');}
  const value=validatePlan(input);serializePlan(value);return value;
}
export function parsePlanBytes(input) {
  const bytes=input instanceof Uint8Array?input:input instanceof ArrayBuffer?new Uint8Array(input):null;
  if(!bytes||bytes.byteLength>MAX_BYTES)throw new PlanError('文件超过64 KiB或不是有效文件。当前方案未改变。');
  let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new PlanError('文件不是完整的UTF-8文本。当前方案未改变。');}
  return parsePlan(text);
}
export function reconcilePalette(p) {
  const ids=new Set(p.savedPens.pens.map(pen=>pen.id.toUpperCase()));
  p.palette.entries=p.palette.entries.filter(e=>e.kind!=='pen'||ids.has(e.penID.toUpperCase()));
  const installed=new Set(p.palette.entries.filter(e=>e.kind==='pen').map(e=>e.penID.toUpperCase()));
  const added=p.savedPens.pens.filter(pen=>!installed.has(pen.id.toUpperCase())).map(pen=>({kind:'pen',penID:pen.id}));
  let at=0;p.palette.entries.forEach((entry,i)=>{if(entry.kind==='pen')at=i+1;});p.palette.entries.splice(at,0,...added);
}
export function toolbarVisible(p,index) { return (p.toolbar.hiddenMask & (1<<index))===0; }
export function penColor(pen) { return '#'+[pen.red,pen.green,pen.blue].map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('').toUpperCase(); }
export function resolvedLanguage(value, preferred='zh') { return value==='system'?(preferred.toLowerCase().startsWith('zh')?'zh':'en'):value; }

export class PreferencesSession {
  constructor({read,write,key=STORAGE_KEY}={}) { this.read=read;this.write=write;this.key=key;this.value=validatePlan(defaultPlan());this.saved=clone(this.value);this.hasSaved=false;this.revision=0; }
  get dirty() {return JSON.stringify(this.value)!==JSON.stringify(this.saved);}
  load() {
    const raw=this.read?.(this.key);
    const candidate=raw==null?validatePlan(defaultPlan()):parsePlan(JSON.stringify(raw));
    this.value=candidate;this.saved=clone(candidate);this.hasSaved=raw!=null;this.revision++;return this.value;
  }
  edit(change) { const candidate=clone(this.value);change(candidate.preferences);const next=parsePlan(serializePlan(candidate));this.value=next;this.revision++;return next; }
  importText(text) {const candidate=parsePlan(text);this.value=candidate;this.revision++;return candidate;}
  importBytes(bytes) {const candidate=parsePlanBytes(bytes);this.value=candidate;this.revision++;return candidate;}
  exportText() {return serializePlan(this.value);}
  save() {const candidate=parsePlan(this.exportText());if(typeof this.write!=='function')throw new PlanError('本机保存暂不可用，请先导出方案。');this.write(this.key,candidate);this.value=candidate;this.saved=clone(candidate);this.hasSaved=true;this.revision++;return candidate;}
  reset() {this.value=validatePlan(defaultPlan());this.revision++;return this.value;}
}

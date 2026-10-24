import assert from 'node:assert/strict';
import {defaultPlan,validatePlan,parsePlan,parsePlanBytes,serializePlan,PreferencesSession,DOMAIN,MAX_BYTES,reconcilePalette,toolbarVisible,penColor,resolvedLanguage} from './logic.js';

let passed=0;
function test(name,run){run();passed++;process.stdout.write('PASS '+name+'\n');}
const copy=value=>JSON.parse(JSON.stringify(value));
function invalid(change){const value=defaultPlan();change(value);assert.throws(()=>validatePlan(value));}
function memory(initial=null){let stored=initial,writes=0;return {read:()=>copy(stored),write:(_key,value)=>{stored=copy(value);writes++;},get stored(){return stored;},get writes(){return writes;}};}

test('Mac-compatible defaults, domain and round trip',()=>{
 const value=defaultPlan();assert.equal(value.domain,DOMAIN);assert.equal(value.preferences.savedPens.pens.length,7);
 assert.deepEqual(parsePlan(serializePlan(value)),validatePlan(value));assert.equal(value.preferences.palette.entries.length,10);
});
test('optional nil selectedID matches Swift encoding',()=>{
 const value=defaultPlan();value.preferences.savedPens.selectedID=null;const result=parsePlan(JSON.stringify(value));
 assert.equal(Object.hasOwn(result.preferences.savedPens,'selectedID'),false);
});
test('UUIDs canonicalize without treating case as different pens',()=>{
 const value=defaultPlan(),id='ABCDEFAB-1234-5678-9012-123456789ABC';value.preferences.savedPens.pens[0].id=id.toLowerCase();value.preferences.savedPens.selectedID=id.toLowerCase();value.preferences.palette.entries[0].penID=id;
 const result=validatePlan(value);assert.equal(result.preferences.savedPens.pens[0].id,id);assert.equal(result.preferences.savedPens.selectedID,id);
});
test('every envelope/snapshot property is required',()=>{
 for(const key of Object.keys(defaultPlan()))invalid(value=>{delete value[key];});
 for(const key of Object.keys(defaultPlan().preferences))invalid(value=>{delete value.preferences[key];});
});
test('nested required fields cannot silently fall back',()=>{
 for(const path of ['panels','toolbar','gestures','holdLine','geometry','dock','palette','playback'])for(const key of Object.keys(defaultPlan().preferences[path]))invalid(value=>{delete value.preferences[path][key];});
 for(const key of Object.keys(defaultPlan().preferences.playback.subtitles))invalid(value=>{delete value.preferences.playback.subtitles[key];});
 for(const key of Object.keys(defaultPlan().preferences.savedPens.pens[0]))invalid(value=>{delete value.preferences.savedPens.pens[0][key];});
});
test('unknown versions/domains/fields are rejected',()=>{
 for(const change of [v=>{v.formatVersion=2;},v=>{v.domain='com.example.other';},v=>{v.preferences.version=2;},v=>{v.preferences.panels.version=2;},v=>{v.preferences.palette.version=2;},v=>{v.privateData='no';},v=>{v.preferences.gestures.command='execute';}])invalid(change);
});
test('prototype-shaped and wrongly typed objects are rejected',()=>{
 invalid(v=>{v.preferences.panels=Object.create({version:1});});invalid(v=>{v.preferences.panels.leftOpen='true';});invalid(v=>{v.preferences.savedPens.pens={};});
 assert.throws(()=>parsePlan('{"__proto__":{},"formatVersion":1}'));assert.equal({}.polluted,undefined);
});
test('all numeric ranges reject non-finite or out-of-range data',()=>{
 for(const number of [NaN,Infinity,-Infinity,-1])invalid(v=>{v.preferences.savedPens.pens[0].width=number;});
 invalid(v=>{v.preferences.panels.leftWidth=199;});invalid(v=>{v.preferences.panels.rightWidth=961;});
 invalid(v=>{v.preferences.toolbar.hiddenMask=1<<20;});invalid(v=>{v.preferences.toolbar.hiddenMask=1.2;});
 invalid(v=>{v.preferences.holdLine.holdDuration=0.2;});invalid(v=>{v.preferences.playback.subtitles.fontSize=49;});
 invalid(v=>{v.preferences.playback.subtitles.backgroundOpacity=1.01;});invalid(v=>{v.preferences.playback.subtitles.strokeWidth=-1;});
});
test('all choice enums are checked',()=>{
 for(const change of [v=>{v.preferences.language='fr';},v=>{v.preferences.gestures.doubleTap='execute';},v=>{v.preferences.gestures.squeeze='tap';},v=>{v.preferences.geometry.shape='star';},v=>{v.preferences.dock.edge='middle';},v=>{v.preferences.savedPens.pens[0].kind='code';},v=>{v.preferences.playback.replayMode='opaque';},v=>{v.preferences.aiWebsite='server';},v=>{v.preferences.translationService='server';},v=>{v.preferences.playback.seekInterval=7;},v=>{v.preferences.playback.playbackRate=3;}])invalid(change);
});
test('pen identities, colors, names and selected references are checked',()=>{
 invalid(v=>{v.preferences.savedPens.pens[1].id=v.preferences.savedPens.pens[0].id;});
 invalid(v=>{v.preferences.savedPens.pens[0].id='not-a-uuid';});invalid(v=>{v.preferences.savedPens.selectedID='FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF';});
 invalid(v=>{v.preferences.savedPens.pens[0].red=2;});invalid(v=>{v.preferences.savedPens.pens[0].name=' ';});invalid(v=>{v.preferences.savedPens.pens[0].name='字'.repeat(86);});invalid(v=>{v.preferences.savedPens.pens[0].name='\ud800';});
});
test('palette cannot duplicate, lose or reference missing pens',()=>{
 invalid(v=>{v.preferences.palette.entries.push({kind:'eraser'});});invalid(v=>{v.preferences.palette.entries[0].penID='FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF';});invalid(v=>{v.preferences.palette.entries.shift();});invalid(v=>{v.preferences.palette.entries[1].penID=v.preferences.savedPens.pens[0].id;});
});
test('intentional utility omissions and empty pen lists remain valid',()=>{
 const value=defaultPlan();value.preferences.palette.entries=value.preferences.palette.entries.filter(e=>e.kind==='pen');assert.equal(validatePlan(value).preferences.palette.entries.length,7);
 value.preferences.savedPens.pens=[];delete value.preferences.savedPens.selectedID;value.preferences.palette.entries=[];assert.equal(validatePlan(value).preferences.palette.entries.length,0);
});
test('palette reconciliation retains omissions and adds/removes only pens',()=>{
 const p=defaultPlan().preferences;p.palette.entries=p.palette.entries.filter(e=>e.kind!=='eraser');p.savedPens.pens.shift();
 p.savedPens.pens.push({...p.savedPens.pens[0],id:'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF',name:'New'});reconcilePalette(p);
 assert.equal(p.palette.entries.some(e=>e.kind==='eraser'),false);assert.equal(p.palette.entries.some(e=>e.penID==='00000000-0000-0000-0000-000000000001'),false);assert.equal(p.palette.entries.some(e=>e.penID==='FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF'),true);
 validatePlan({formatVersion:1,domain:DOMAIN,preferences:p});
});
test('subtitle colors are constrained and canonicalized',()=>{
 const value=defaultPlan();value.preferences.playback.subtitles.textColor='#aabbcc';assert.equal(validatePlan(value).preferences.playback.subtitles.textColor,'#AABBCC');
 invalid(v=>{v.preferences.playback.subtitles.textColor='url(https://example.invalid)';});invalid(v=>{v.preferences.playback.subtitles.strokeColor='#fff';});
});
test('malformed, oversized and excessive-count files are rejected',()=>{
 assert.throws(()=>parsePlan('broken'));assert.throws(()=>parsePlan(' '.repeat(MAX_BYTES+1)));
 invalid(v=>{v.preferences.savedPens.pens=Array(257).fill(v.preferences.savedPens.pens[0]);});invalid(v=>{v.preferences.palette.entries=Array(260).fill({kind:'eraser'});});
});
test('file bytes require complete UTF-8 and preserve the current plan on failure',()=>{
 const session=new PreferencesSession();session.edit(p=>{p.language='en';});const before=copy(session.value);
 assert.throws(()=>session.importBytes(new Uint8Array([0xff,0xfe,0x7b])));assert.deepEqual(session.value,before);
 const encoded=new TextEncoder().encode(serializePlan(defaultPlan()));assert.deepEqual(parsePlanBytes(encoded),validatePlan(defaultPlan()));
 assert.throws(()=>parsePlanBytes(new Uint8Array(MAX_BYTES+1)));
});
test('UTF-8 bytes, not character count, enforce total plan limit',()=>{
 const value=defaultPlan(),base=copy(value.preferences.savedPens.pens[0]);value.preferences.savedPens.pens=Array.from({length:160},(_,i)=>({...base,id:`11111111-1111-1111-1111-${String(i).padStart(12,'0')}`,name:'字'.repeat(80)}));value.preferences.palette.entries=value.preferences.savedPens.pens.map(pen=>({kind:'pen',penID:pen.id}));assert.throws(()=>serializePlan(value));
});
test('save and a new session reopen only the supplied local storage key',()=>{
 const storage=memory(),session=new PreferencesSession({...storage,key:'preferences-private-test'});session.load();assert.equal(storage.writes,0);
 session.edit(p=>{p.language='en';p.panels.leftWidth=404;});session.save();assert.equal(storage.writes,1);
 const reopened=new PreferencesSession({...storage,key:'preferences-private-test'});reopened.load();assert.equal(reopened.value.preferences.panels.leftWidth,404);assert.equal(reopened.value.preferences.language,'en');assert.equal(reopened.dirty,false);
});
test('failed imports leave current, saved and persistent bytes unchanged',()=>{
 const storage=memory(),session=new PreferencesSession(storage);session.edit(p=>{p.language='zh';});session.save();session.edit(p=>{p.panels.leftWidth=390;});const current=copy(session.value),saved=copy(storage.stored),writes=storage.writes;
 for(const text of ['bad',JSON.stringify({...defaultPlan(),formatVersion:99}),JSON.stringify({...defaultPlan(),preferences:{}}),' '.repeat(MAX_BYTES+1)]){assert.throws(()=>session.importText(text));assert.deepEqual(session.value,current);assert.deepEqual(storage.stored,saved);assert.equal(storage.writes,writes);}
});
test('valid import edits preview until explicit save',()=>{
 const storage=memory(),session=new PreferencesSession(storage);session.save();const incoming=defaultPlan();incoming.preferences.language='en';session.importText(serializePlan(incoming));assert.equal(session.value.preferences.language,'en');assert.equal(storage.stored.preferences.language,'system');assert.equal(session.dirty,true);session.save();assert.equal(storage.stored.preferences.language,'en');
});
test('quota failures and corrupted reloads preserve current state',()=>{
 const session=new PreferencesSession({read:()=>({bad:true}),write:()=>{throw new Error('quota');}});session.edit(p=>{p.language='en';});const current=copy(session.value);assert.throws(()=>session.load());assert.deepEqual(session.value,current);assert.throws(()=>session.save());assert.deepEqual(session.value,current);assert.equal(session.hasSaved,false);
});
test('reset is preview-only and does not erase persistent plan',()=>{
 const storage=memory(),session=new PreferencesSession(storage);session.edit(p=>{p.language='en';});session.save();session.reset();assert.equal(session.value.preferences.language,'system');assert.equal(storage.stored.preferences.language,'en');assert.equal(session.dirty,true);session.load();assert.equal(session.value.preferences.language,'en');
});
test('failed edits are transactional and helpers match the plan',()=>{
 const session=new PreferencesSession();const current=copy(session.value);assert.throws(()=>session.edit(p=>{p.panels.leftWidth=1;}));assert.deepEqual(session.value,current);
 session.edit(p=>{p.toolbar.hiddenMask=1<<11;});assert.equal(toolbarVisible(session.value.preferences,11),false);assert.equal(penColor({red:1,green:0,blue:0}),'#FF0000');assert.equal(resolvedLanguage('system','en-US'),'en');
});
console.log(JSON.stringify({suite:'preferences-pwa',passed,failed:0,network:false,dependencies:0}));

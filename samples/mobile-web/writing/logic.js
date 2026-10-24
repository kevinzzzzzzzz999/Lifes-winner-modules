// Pure, bounded document/geometry operations. The fitting rules are ported from
// InkSpaceWritingAids (HeldGeometry, StrokeGeometry, HighlighterUnderlay).
export const LIMITS = Object.freeze({bytes:8*1024*1024, inputPoints:4096, fitPoints:2048, outputPoints:65537, points:200000, strokes:500, tapes:500, cards:100});
const finite = Number.isFinite;
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
const colorOK = v => typeof v==='string' && /^#[0-9a-f]{6}$/i.test(v);
const fail = message => { throw new Error(message); };
// Error presentation is separate from the versioned document and fitting rules.
const ERROR_MESSAGES = Object.freeze({
  '这不是支持的书写画板文件；当前画板已保留。':'This is not a supported Writing file. Your current board has been kept.',
  '画板范围无效。':'The board dimensions are invalid.',
  '画板内容超过数量上限。':'The board contains too many items.',
  '内容标识重复或无效。':'An item identifier is invalid or duplicated.',
  '笔迹点数无效。':'A stroke has an invalid number of points.',
  '画板笔迹太多，请导出后另建画板。':'The board has too many stroke points. Export a backup, then start a new board.',
  '笔迹超出画板范围。':'A stroke extends beyond the board.',
  '笔迹样式无效。':'A stroke style is invalid.',
  '笔迹类型无效。':'A stroke type is invalid.',
  '胶带状态无效。':'A tape state is invalid.',
  '文字卡范围或内容无效。':'A text card has invalid content or dimensions.',
  '文件超过 8 MiB，请减少内容或分成多个画板。':'The file exceeds 8 MiB. Reduce the content or split it into separate boards.',
  '文件超过 8 MiB。':'The file exceeds 8 MiB.',
  '无法生成波浪线。':'A wave cannot be generated from this stroke.',
  '线条太短。':'The stroke is too short.',
  '波浪线过长。':'The wave is too long.',
  '波浪线需要留出画板边距。':'Leave space around the wave inside the board.',
  '请围出一个区域再填色。':'Draw around an area before filling it.',
  '填色轮廓无效。':'The fill outline is invalid.',
  '填色轮廓太小或无效。':'The fill outline is too small or invalid.',
  '剪贴板内容无效。':'The internal clipboard content is invalid.',
  '读取期间画板已改变，请重试打开。':'The board changed while the file was being read. Open it again.',
  '无效的本机存储名称':'The local storage name is invalid.',
  '此工具不能读取其他工具的草稿':'This tool cannot read another tool’s drafts.',
  '本机草稿过大，请先导出备份':'The local draft is too large. Export a backup first.',
  '本机草稿超过 8 MiB，请先导出备份':'The local draft exceeds 8 MiB. Export a backup first.',
  '无法导出此文件':'This file cannot be exported.',
  '无法分享此文件':'This file cannot be shared.'
});
export function localizeError(error,language='zh') {
  const message=typeof error==='string'?error:error?.message;
  const pair=Object.entries(ERROR_MESSAGES).find(([zh,en])=>message===zh||message===en);
  if(pair)return pair[language==='en'?1:0];
  if(error?.name==='SyntaxError')return language==='en'?'The file is not valid JSON. Your current board has been kept.':'文件不是有效的 JSON，当前画板已保留。';
  if(error?.name==='QuotaExceededError')return language==='en'?'Device storage is full. Your board is still in memory; export a backup.':'设备存储空间不足；画板仍在内存中，请导出备份。';
  return language==='en'?'The operation could not be completed. Your board has been kept; try again or export a backup.':'操作未完成，画板仍保留；请重试或导出备份。';
}
export function newID() { return globalThis.crypto?.randomUUID?.() || `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`; }
export function emptyDocument() { return {format:'inkspace-writing-web',version:1,width:1200,height:1600,strokes:[],tapes:[],cards:[]}; }
export function validateDocument(input) {
  if(!input || input.format!=='inkspace-writing-web' || input.version!==1) fail('这不是支持的书写画板文件；当前画板已保留。');
  if(!finite(input.width)||!finite(input.height)||input.width<200||input.height<200||input.width>8000||input.height>8000) fail('画板范围无效。');
  if(!Array.isArray(input.strokes)||!Array.isArray(input.tapes)||!Array.isArray(input.cards)||input.strokes.length>LIMITS.strokes||input.tapes.length>LIMITS.tapes||input.cards.length>LIMITS.cards) fail('画板内容超过数量上限。');
  const ids=new Set(); let total=0;
  function id(value) { if(typeof value!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(value)||ids.has(value))fail('内容标识重复或无效。');ids.add(value);return value; }
  function points(values,max) {
    if(!Array.isArray(values)||values.length<1||values.length>max)fail('笔迹点数无效。');
    total+=values.length;if(total>LIMITS.points)fail('画板笔迹太多，请导出后另建画板。');
    return values.map(p=>{if(!p||!finite(p.x)||!finite(p.y)||p.x<0||p.y<0||p.x>input.width||p.y>input.height)fail('笔迹超出画板范围。');return {x:p.x,y:p.y};});
  }
  function line(value,max) {
    if(!value||!finite(value.width)||value.width<0.1||value.width>512||!colorOK(value.color))fail('笔迹样式无效。');
    return {id:id(value.id),points:points(value.points,max),width:value.width,color:value.color.toLowerCase()};
  }
  const strokes=input.strokes.map(s=>{const value=line(s,LIMITS.outputPoints);if(typeof s.fill!=='boolean'||typeof s.highlight!=='boolean')fail('笔迹类型无效。');return {...value,fill:s.fill,highlight:s.highlight};});
  const tapes=input.tapes.map(t=>{const value=line(t,LIMITS.inputPoints);if(typeof t.revealed!=='boolean')fail('胶带状态无效。');return {...value,revealed:t.revealed};});
  const cards=input.cards.map(c=>{
    if(!c||typeof c.text!=='string'||!c.text.trim()||c.text.length>20000||!colorOK(c.color)||![c.x,c.y,c.width,c.height,c.font].every(finite)||c.font<12||c.font>160||c.width<40||c.height<24||c.x<0||c.y<0||c.x+c.width>input.width||c.y+c.height>input.height)fail('文字卡范围或内容无效。');
    return {id:id(c.id),text:c.text,x:c.x,y:c.y,width:c.width,height:c.height,font:c.font,color:c.color.toLowerCase()};
  });
  return {format:'inkspace-writing-web',version:1,width:input.width,height:input.height,strokes,tapes,cards};
}
export function serializeDocument(doc) { const text=JSON.stringify(validateDocument(doc));if(new TextEncoder().encode(text).length>LIMITS.bytes)fail('文件超过 8 MiB，请减少内容或分成多个画板。');return text; }
export function parseDocument(text) { if(typeof text!=='string'||new TextEncoder().encode(text).length>LIMITS.bytes)fail('文件超过 8 MiB。');return validateDocument(JSON.parse(text)); }
export function fitLine(points,minimumLength=36) {
  if(points.length<3||points.length>LIMITS.fitPoints||!finite(minimumLength)||minimumLength<=0||!points.every(p=>finite(p.x)&&finite(p.y)))return null;
  const start=points[0],end=points.at(-1),dx=end.x-start.x,dy=end.y-start.y,len=Math.hypot(dx,dy);
  if(!finite(len)||len<minimumLength)return null;
  const tolerance=Math.min(22,Math.max(4,len*.04));let traveled=0,previous=start,furthest=0;
  for(const p of points) {traveled+=distance(p,previous);const along=((p.x-start.x)*dx+(p.y-start.y)*dy)/len,across=Math.abs((p.x-start.x)*dy-(p.y-start.y)*dx)/len;if(across>tolerance||along< -tolerance||along>len+tolerance||along<furthest-4)return null;furthest=Math.max(furthest,along);previous=p;}
  return traveled<=len*1.18?[{...start},{...end}]:null;
}
function area(points) {return points.reduce((sum,a,i)=>{const b=points[(i+1)%points.length];return sum+(a.x*b.y-b.x*a.y)/2;},0);}
function box(points) {let x=Infinity,y=Infinity,right=-Infinity,bottom=-Infinity;for(const p of points){x=Math.min(x,p.x);y=Math.min(y,p.y);right=Math.max(right,p.x);bottom=Math.max(bottom,p.y);}return {x,y,width:right-x,height:bottom-y};}
function project(p,a,b) {const dx=b.x-a.x,dy=b.y-a.y,sq=dx*dx+dy*dy,t=sq?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/sq,0,1):0;return {x:a.x+t*dx,y:a.y+t*dy};}
function segmentDistance(p,a,b) {return distance(p,project(p,a,b));}
function closedPolygon(vertices,p) {let index=0,best=Infinity;vertices.forEach((a,i)=>{const d=segmentDistance(p,a,vertices[(i+1)%vertices.length]);if(d<best){index=i;best=d;}});const start=project(p,vertices[index],vertices[(index+1)%vertices.length]);return [start,...vertices.map((_,i)=>vertices[(index+i+1)%vertices.length]),{...start}];}
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
function hull(points) {const sorted=[...points].sort((a,b)=>a.x-b.x||a.y-b.y),lo=[],hi=[];for(const p of sorted){while(lo.length>=2&&cross(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p);}for(const p of sorted.reverse()){while(hi.length>=2&&cross(hi.at(-2),hi.at(-1),p)<=0)hi.pop();hi.push(p);}return [...lo.slice(0,-1),...hi.slice(0,-1)];}
function axisCoordinate(values,midpoint) {const sorted=[...values].sort((a,b)=>a-b);let start=0,bs=0,be=0;for(let end=0;end<sorted.length;end++){while(sorted[end]-sorted[start]>8)start++;if(end-start>be-bs||(end-start===be-bs&&Math.abs(sorted[Math.floor((start+end)/2)]-midpoint)<Math.abs(sorted[Math.floor((bs+be)/2)]-midpoint))){bs=start;be=end;}}return sorted[Math.floor((bs+be)/2)];}
export function fitShape(points,kind) {
  if(!['circle','ellipse','rectangle','triangle','arrow','axes'].includes(kind)||points.length<3||points.length>LIMITS.fitPoints||!points.every(p=>finite(p.x)&&finite(p.y)))return null;
  const start=points[0],end=points.at(-1),b=box(points),diag=Math.hypot(b.width,b.height);
  if(kind==='arrow') {const line=fitLine(points,48);if(!line)return null;const dx=end.x-start.x,dy=end.y-start.y,len=Math.hypot(dx,dy),head=Math.min(28,Math.max(12,len*.2)),ux=dx/len,uy=dy/len;return [start,end,{x:end.x-ux*head-uy*head*.55,y:end.y-uy*head+ux*head*.55},end,{x:end.x-ux*head+uy*head*.55,y:end.y-uy*head-ux*head*.55}];}
  if(kind==='axes') {const center={x:axisCoordinate(points.map(p=>p.x),b.x+b.width/2),y:axisCoordinate(points.map(p=>p.y),b.y+b.height/2)};if(points.length<6||b.width<48||b.height<48||diag>20000||center.x<b.x+16||center.x>b.x+b.width-24||center.y<b.y+24||center.y>b.y+b.height-16||!points.every(p=>Math.min(Math.abs(p.x-center.x),Math.abs(p.y-center.y))<=Math.max(10,diag*.12)))return null;const left={x:b.x,y:center.y},right={x:b.x+b.width,y:center.y},top={x:center.x,y:b.y},bottom={x:center.x,y:b.y+b.height},head=Math.min(24,Math.max(10,Math.min(b.width,b.height)*.14));return [left,right,{x:right.x-head,y:right.y+head*.55},right,{x:right.x-head,y:right.y-head*.55},right,center,top,{x:top.x-head*.55,y:top.y+head},top,{x:top.x+head*.55,y:top.y+head},top,bottom];}
  if(points.length<6||b.width<28||b.height<28||!finite(diag)||diag>20000||distance(start,end)>Math.max(14,diag*.2))return null;
  const signed=area(points);if(Math.abs(signed)<b.width*b.height*.18)return null;const forward=signed>=0?1:-1;
  if(kind==='circle'||kind==='ellipse') {if(Math.max(b.width,b.height)/Math.min(b.width,b.height)>(kind==='circle'?1.65:8))return null;const cx=b.x+b.width/2,cy=b.y+b.height/2,rx=b.width/2,ry=b.height/2;if(!points.every(p=>{const r=Math.hypot((p.x-cx)/rx,(p.y-cy)/ry);return r>=.45&&r<=1.55;}))return null;let turn=0,prior=Math.atan2((start.y-cy)/ry,(start.x-cx)/rx);for(const p of points.slice(1)){const angle=Math.atan2((p.y-cy)/ry,(p.x-cx)/rx);let delta=angle-prior;while(delta>Math.PI)delta-=Math.PI*2;while(delta< -Math.PI)delta+=Math.PI*2;if(delta*forward< -.2)return null;turn+=delta;prior=angle;}if(Math.abs(turn)<Math.PI*1.5||Math.abs(turn)>Math.PI*2.7)return null;const r=(rx+ry)/2,xr=kind==='circle'?r:rx,yr=kind==='circle'?r:ry,angle=Math.atan2((start.y-cy)/ry,(start.x-cx)/rx),output=Array.from({length:97},(_,i)=>({x:cx+Math.cos(angle+forward*i/96*Math.PI*2)*xr,y:cy+Math.sin(angle+forward*i/96*Math.PI*2)*yr}));output[96]={...output[0]};return output;}
  if(kind==='rectangle') {const tolerance=Math.max(10,diag*.16);if(!points.every(p=>Math.min(Math.abs(p.x-b.x),Math.abs(p.x-b.x-b.width),Math.abs(p.y-b.y),Math.abs(p.y-b.y-b.height))<=tolerance))return null;const corners=[{x:b.x,y:b.y},{x:b.x+b.width,y:b.y},{x:b.x+b.width,y:b.y+b.height},{x:b.x,y:b.y+b.height}];if(forward<0)corners.reverse();return closedPolygon(corners,start);}
  let vertices=hull(points);while(vertices.length>3){let best=0,smallest=Infinity;vertices.forEach((p,i)=>{const value=Math.abs(cross(vertices[(i+vertices.length-1)%vertices.length],p,vertices[(i+1)%vertices.length]));if(value<smallest){smallest=value;best=i;}});vertices.splice(best,1);}if(vertices.length!==3||Math.abs(area(vertices))<b.width*b.height*.2||!points.every(p=>Math.min(...vertices.map((a,i)=>segmentDistance(p,a,vertices[(i+1)%3])))<=Math.max(10,diag*.14)))return null;if(forward<0)vertices.reverse();return closedPolygon(vertices,start);
}
export function wavePoints(points,{width=3,wavelength=24,amplitude=5,worldWidth=1200,worldHeight=1600}={}) {
  const input=points.filter((p,i)=>i===0||distance(p,points[i-1])>0);
  if(input.length<2||input.length>LIMITS.inputPoints||![width,wavelength,amplitude,worldWidth,worldHeight].every(finite)||width<=0||wavelength<2||amplitude<=0||amplitude>wavelength/2)fail('无法生成波浪线。');
  const cumulative=[0];for(let i=1;i<input.length;i++)cumulative.push(cumulative.at(-1)+distance(input[i-1],input[i]));const length=cumulative.at(-1);if(!finite(length)||length<Math.max(2,width/2))fail('线条太短。');const cycles=Math.max(1,Math.round(length/wavelength)),count=Math.max(25,Math.ceil(cycles*24));if(count>=LIMITS.outputPoints)fail('波浪线过长。');let index=1;const output=[];for(let i=0;i<=count;i++){const d=length*i/count;while(index<cumulative.length-1&&cumulative[index]<d)index++;const a=input[index-1],b=input[index],segment=cumulative[index]-cumulative[index-1],t=(d-cumulative[index-1])/segment,offset=Math.sin(Math.PI*2*cycles*d/length)*amplitude;const p={x:a.x+(b.x-a.x)*t-(b.y-a.y)/segment*offset,y:a.y+(b.y-a.y)*t+(b.x-a.x)/segment*offset};if(!finite(p.x)||!finite(p.y)||p.x<width/2||p.y<width/2||p.x+width/2>worldWidth||p.y+width/2>worldHeight)fail('波浪线需要留出画板边距。');output.push(p);}return output;
}
export function fillPolygon(points) {if(points.length<3||points.length>LIMITS.inputPoints||!points.every(p=>finite(p.x)&&finite(p.y)))fail('请围出一个区域再填色。');const polygon=points.filter((p,i)=>i===0||distance(p,points[i-1])>0);if(distance(polygon[0],polygon.at(-1))===0)polygon.pop();if(polygon.length<3)fail('填色轮廓无效。');const b=box(polygon);if(b.width<=1||b.height<=1||b.width>4096||b.height>4096||Math.abs(area(polygon.map(p=>({x:p.x-b.x,y:p.y-b.y}))))<1)fail('填色轮廓太小或无效。');return polygon;}
export function appendStroke(doc,stroke,highlightsBelow=true) {const next={...doc,strokes:[...doc.strokes,stroke]};if(stroke.highlight&&highlightsBelow){const first=doc.strokes.findIndex(s=>!s.highlight);if(first>=0){next.strokes.pop();next.strokes.splice(first,0,stroke);}}return validateDocument(next);}
export function allItems(doc) {return [...doc.strokes.map(item=>({kind:'strokes',item})),...doc.cards.map(item=>({kind:'cards',item})),...doc.tapes.map(item=>({kind:'tapes',item}))];}
export function itemBounds(item) {if('text' in item)return {x:item.x,y:item.y,width:item.width,height:item.height};const b=box(item.points),pad=item.width/2;return {x:b.x-pad,y:b.y-pad,width:b.width+pad*2,height:b.height+pad*2};}
export function selectionBounds(doc,ids) {let result=null;for(const {item} of allItems(doc)){if(!ids.has(item.id))continue;const b=itemBounds(item);if(!result)result={...b};else {const right=Math.max(result.x+result.width,b.x+b.width),bottom=Math.max(result.y+result.height,b.y+b.height);result.x=Math.min(result.x,b.x);result.y=Math.min(result.y,b.y);result.width=right-result.x;result.height=bottom-result.y;}}return result;}
export function intersects(a,b) {return a.x<=b.x+b.width&&a.x+a.width>=b.x&&a.y<=b.y+b.height&&a.y+a.height>=b.y;}
export function contains(b,p,padding=0) {return p.x>=b.x-padding&&p.y>=b.y-padding&&p.x<=b.x+b.width+padding&&p.y<=b.y+b.height+padding;}
export function hitTape(t,p,tolerance=0) {if(t.points.length===1)return distance(t.points[0],p)<=t.width/2+tolerance;return t.points.slice(1).some((point,i)=>segmentDistance(p,t.points[i],point)<=t.width/2+tolerance);}
export function hitItem(doc,p,tolerance=8) {for(const {item} of allItems(doc).reverse()){if('text' in item?contains(itemBounds(item),p,tolerance):hitTape(item,p,tolerance))return item.id;}return null;}
export function clampTranslation(doc,ids,dx,dy) {let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;for(const {item} of allItems(doc)){if(!ids.has(item.id))continue;const b='text' in item?itemBounds(item):box(item.points);left=Math.min(left,b.x);top=Math.min(top,b.y);right=Math.max(right,b.x+b.width);bottom=Math.max(bottom,b.y+b.height);}if(!finite(left)||!finite(dx)||!finite(dy))return {dx:0,dy:0};return {dx:clamp(dx,-left,doc.width-right),dy:clamp(dy,-top,doc.height-bottom)};}
function shifted(item,dx,dy) {return 'text' in item?{...item,x:item.x+dx,y:item.y+dy}:{...item,points:item.points.map(p=>({x:p.x+dx,y:p.y+dy}))};}
export function translateSelection(doc,ids,dx,dy) {const delta=clampTranslation(doc,ids,dx,dy),next={...doc};for(const kind of ['strokes','tapes','cards'])next[kind]=doc[kind].map(item=>ids.has(item.id)?shifted(item,delta.dx,delta.dy):item);return validateDocument(next);}
export function copySelection(doc,ids) {return allItems(doc).filter(({item})=>ids.has(item.id)).map(({kind,item})=>({kind,item:JSON.parse(JSON.stringify(item))}));}
export function pasteSelection(doc,clipboard,anchor=null,idFactory=newID) {
  if(!Array.isArray(clipboard)||!clipboard.length)return {document:doc,ids:new Set()};
  const clone={...doc,strokes:[...doc.strokes],tapes:[...doc.tapes],cards:[...doc.cards]},ids=new Set();
  for(const entry of clipboard){if(!['strokes','tapes','cards'].includes(entry.kind))fail('剪贴板内容无效。');const item=JSON.parse(JSON.stringify(entry.item));item.id=idFactory();ids.add(item.id);clone[entry.kind].push(item);}
  const valid=validateDocument(clone),b=selectionBounds(valid,ids),dx=anchor?anchor.x-b.x:35,dy=anchor?anchor.y-b.y:35;
  return {document:translateSelection(valid,ids,dx,dy),ids};
}
export function removeSelection(doc,ids) {return {...doc,strokes:doc.strokes.filter(s=>!ids.has(s.id)),tapes:doc.tapes.filter(t=>!ids.has(t.id)),cards:doc.cards.filter(c=>!ids.has(c.id))};}

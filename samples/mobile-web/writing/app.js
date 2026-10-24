import {loadLocal,saveLocal,removeLocal,saveFile,shareFile,notify,getLanguage,t} from '../shared.js';
import * as L from './logic.js';

const $=id=>document.getElementById(id),canvas=$('drawing-canvas'),ctx=canvas.getContext('2d'),wrap=$('canvas-wrap');
const KEY='writing-draft-v1';
let doc=L.emptyDocument(),tool='pen',selected=new Set(),clipboard=[],history=[],historyBytes=0;
let active=null,view={scale:1,x:0,y:0,width:0,height:0},lasers=[],pasteAnchor=null,lastWorld=null;
let saveTimer=null,frame=null,localBlocked=false,longPress=null,revision=0;

// These messages describe controls, never saved card content or format identifiers.
const ENGLISH = Object.freeze({
  "安装": "Install",
  "书写画板 · Life's winner Writing": "Writing · Life's winner",
  "书写画板": "Writing",
  "书写工具": "Writing tools",
  "✎ 画笔": "✎ Pen",
  "□ 形状": "□ Shape",
  "↖ 选择": "↖ Select",
  "T 文字": "T Text",
  "╱ 停留直线": "╱ Held line",
  "▰ 高亮": "▰ Highlight",
  "∿ 波浪": "∿ Wave",
  "▨ 填色": "▨ Fill",
  "▬ 胶带": "▬ Tape",
  "◉ 揭开": "◉ Reveal",
  "• 激光": "• Laser",
  "↶ 撤销": "↶ Undo",
  "▱ 打开": "▱ Open",
  "↥ 导出": "↥ Export",
  "更多文件操作": "More file actions",
  "分享 JSON": "Share JSON",
  "保存到本机": "Save on device",
  "载入示例": "Load example",
  "新画板": "New board",
  "颜色": "Color",
  "笔迹颜色": "Stroke color",
  "粗细": "Width",
  "笔迹粗细": "Stroke width",
  "细": "Fine",
  "中": "Medium",
  "粗": "Thick",
  "特粗": "Extra thick",
  "形状": "Shape",
  "矩形": "Rectangle",
  "圆": "Circle",
  "椭圆": "Ellipse",
  "三角形": "Triangle",
  "箭头": "Arrow",
  "坐标轴": "Axes",
  "新高亮置底": "Place new highlights below ink",
  "复制副本": "Duplicate",
  "粘贴": "Paste",
  "删除": "Delete",
  "书写画板：使用画笔绘画，使用选择工具框选和拖动内容": "Writing canvas: draw with Pen; use Select to select and move items.",
  "用手指或 Apple Pencil 书写；重要内容请导出备份。": "Draw with a finger or Apple Pencil. Export important work as a backup.",
  "ⓘ 帮助": "ⓘ Help",
  "在这里粘贴副本": "Paste copy here",
  "添加文字卡": "Add a text card",
  "在这里打字；支持的 iPad 可使用系统随手写。应用不上传文字，也不提供自己的手写识别。": "Type here, or use system Scribble on a supported iPad. Text is not uploaded; the app does not provide its own handwriting recognition.",
  "文字": "Text",
  "写下你的想法…": "Write your thoughts…",
  "取消": "Cancel",
  "添加到画板": "Add to board",
  "书写画板使用帮助": "Writing help",
  "愿每个使用这些开源工具的人，都成为各自的 Life's winner。": "May everyone using these open-source tools become their own Life's winner.",
  "工具行可左右滑动。手指与 Apple Pencil 都能绘画；颜色和粗细可调。": "Swipe the tool row horizontally. Draw with a finger or Apple Pencil, and choose a color and width.",
  "直线／形状：画出大致轮廓，停住约 0.65 秒；出现绿色预览后松开。形状需明确选择，圆、椭圆、矩形、三角形需闭合。不符合时保留原笔迹。": "Held line / Shape: draw an approximate outline and pause for about 0.65 seconds. Release after the green preview appears. Choose the shape explicitly; circles, ellipses, rectangles and triangles must close. Unmatched strokes stay as drawn.",
  "高亮／波浪／填色：高亮可置于已有普通笔迹下；填色在松开时闭合轮廓。靠近边缘的波浪若无法生成，会保留原笔迹。": "Highlight / Wave / Fill: place new highlights beneath ordinary ink. Fill closes the outline when released. If a wave cannot fit near an edge, the original stroke is kept.",
  "胶带／揭开：画遮挡条，再用揭开工具点它；底下的原内容不会被删除。激光松开后消失，不写入文件。": "Tape / Reveal: draw a cover strip, then tap it with Reveal. Content underneath is retained. Laser trails disappear after release and are not saved.",
  "选择／复制／移动：点选或拖出矩形框。拖动蓝色框可移动，移动中的副本一直可见。点“复制副本”立即生成并选中副本；继续拖动蓝框即可。选择模式长按画布可粘贴内部剪贴板。": "Select / Duplicate / Move: tap an item or drag a selection rectangle. Drag the blue box to move; the moving copy stays visible. Duplicate immediately creates and selects a new copy. In Select mode, long-press the canvas to paste from the internal clipboard.",
  "文字：使用顶部文字按钮，文字卡可在选择模式移动或删除。": "Text: use the Text button. Move or delete text cards in Select mode.",
  "保存与文件": "Saving and files",
  "每次编辑后尝试保存当前设备的草稿。用“导出”保存 JSON 文件；“打开”可恢复此工具导出的画板。“更多 → 分享 JSON”可通过系统分享。打开或新建前可先导出；撤销最多保留最近 20 步，受内存上限约束。": "The app attempts to save a device draft after each edit. Export saves a JSON file; Open restores files exported by this tool. More → Share JSON uses system sharing. Export important work before opening or starting a board. Undo keeps up to 20 recent steps within a memory budget.",
  "本机草稿不是永久备份。清除网站数据、卸载、隐私模式或系统回收存储可能清除它；请定期导出。Safari 页面与主屏幕 App 的存储可能分开，安装前先导出，安装后再打开。数据不会自动跨设备同步。": "A device draft is not a permanent backup. Clearing site data, uninstalling, private browsing or system storage cleanup can remove it. Export regularly. Safari and the Home Screen app may use separate storage: export before installation, then reopen the file. Data does not automatically sync between devices.",
  "范围与隐私": "Scope and privacy",
  "这是独立矢量画板，无账号、统计或内容上传，不读取原笔记应用数据。单条输入最多 4,096 点，总笔迹／胶带点数最多 200,000；文件最多 8 MiB。没有原生 PencilKit 压力纹理、橡皮擦、无限缩放或完整套索。内部剪贴板只在此窗口，页面关闭后清空。": "This independent vector board has no account, analytics or content uploads, and does not read the original notes app. Limits: 4,096 input points per stroke, 200,000 total ink/tape points and 8 MiB per file. There is no native PencilKit pressure texture, eraser, infinite zoom or full lasso. The internal clipboard belongs to this window and is cleared when it closes.",
  "首次联网打开并显示“可离线使用”后，可添加到主屏幕。查看更新前先保存或导出。": "Open online first and wait for “Ready offline”, then add the tool to your Home Screen. Save or export before checking for updates.",
  "检查更新": "Check for updates",
  "知道了": "Done",
  "只保存在本机": "Only stored on this device",
  "已保存到本机": "Saved on this device",
  "正在保存…": "Saving…",
  "本机保存失败，请导出": "Device save failed; please export",
  "旧草稿已保留，暂不覆盖": "Old draft kept; not overwritten",
  "框选内容，或点选后拖动": "Select an item or drag a selection box",
  "旧本机草稿无法读取，尚未覆盖；请先导出当前内容，或明确新建画板。": "The old device draft could not be read and has not been overwritten. Export your current work, or explicitly start a new board.",
  "当前画板已保存到此设备；重要内容请另行导出。": "This board is saved on this device. Export important work as a separate backup.",
  "画出所选轮廓，停住约 0.65 秒；绿色预览出现后松开。": "Draw the selected outline and pause for about 0.65 seconds. Release after the green preview appears.",
  "画一条大致直线，停住约 0.65 秒后松开。": "Draw an approximate straight line, pause for about 0.65 seconds, then release.",
  "点选或框选；复制副本后直接拖动蓝框，可看见移动位置。": "Tap or box-select. Duplicate, then drag the blue box; the new position stays visible.",
  "点胶带可揭开或重新遮挡；底下的内容保持不变。": "Tap tape to reveal or cover it again. Content underneath is retained.",
  "激光松开后消失，不写入导出文件。": "Laser trails disappear after release and are not included in exported files.",
  "在白色画板内绘画；每次编辑后尝试保存本机草稿。": "Draw inside the white board. The app attempts to save a device draft after each edit.",
  "绿色预览已拟合，松开即可生成。": "The green fitted preview is ready. Release to create it.",
  "这条笔迹太长，未提交；请分段绘制。": "This stroke is too long and was not added. Draw it in shorter sections.",
  "已移动，副本位置已保存。": "Moved. The new position has been saved.",
  "胶带已切换，原内容保持不变。": "Tape visibility changed. The original content is retained.",
  "胶带已添加，使用“揭开”工具点它。": "Tape added. Tap it with Reveal.",
  "笔迹已添加。": "Stroke added.",
  "未检测到符合条件的停留轮廓，已保留原笔迹。": "No matching held outline was detected. The original stroke has been kept.",
  "波浪需要足够长度与边距，已保留原笔迹。": "The wave needs more length or space from the edge. The original stroke has been kept.",
  "本次触控已取消，未改变原内容。": "This touch was cancelled. Existing content is unchanged.",
  "已撤销。": "Undone.",
  "副本已选中；拖动蓝框可移动，预览始终显示新位置。": "The copy is selected. Drag its blue box; the preview follows the new position.",
  "已删除选中内容，可撤销。": "Selected items deleted. You can undo this.",
  "请先输入文字。": "Enter some text first.",
  "文字太多，请分成较小的文字卡。": "There is too much text. Split it into smaller cards.",
  "文字卡已添加，可拖动蓝框移动。": "Text card added. Drag the blue box to move it.",
  "已请求导出 JSON；请在系统界面选择保存位置。": "JSON export requested. Choose a save location in the system interface.",
  "已交给系统分享。": "Sent to system sharing.",
  "此浏览器不支持文件分享，已改为导出。": "File sharing is unavailable in this browser. The file was exported instead.",
  "打开文件会替换当前画板和本机草稿。重要内容请先导出。继续吗？": "Opening a file will replace the current board and device draft. Export important work first. Continue?",
  "画板已打开；当前设备的草稿已更新。": "Board opened. This device’s draft has been updated.",
  "这会替换当前画板和本机草稿。请先导出重要内容。继续吗？": "This will replace the current board and device draft. Export important work first. Continue?",
  "新画板已准备，可撤销上一步。": "A new board is ready. You can undo the previous step.",
  "虚构示例：选择蓝框后复制并拖动；胶带可揭开。": "Synthetic example: select, duplicate and drag the blue box. Tape can be revealed.",
  "已载入虚构示例；可试用选择、复制与揭开。": "Synthetic example loaded. Try selecting, duplicating and revealing tape."
});
let lastStatus='用手指或 Apple Pencil 书写；重要内容请导出备份。',lastStatusError=false;
let saveState='只保存在本机',textError='';
function translate(value) {
  if(!value)return '';
  if(typeof value==='object') {
    if(value.kind==='open-error')return t('打开失败：','Open failed: ')+L.localizeError(value.error,getLanguage())+t(' 当前画板仍保留。',' Your current board is still here.');
    if(value.kind==='draft-error')return t('本机草稿无法读取：','Could not read the device draft: ')+L.localizeError(value.error,getLanguage());
    return L.localizeError(value,getLanguage());
  }
  if(Object.hasOwn(ENGLISH,value))return t(value,ENGLISH[value]);
  const selection=/^已选 (\d+) 项，拖动蓝框移动$/.exec(value);
  if(selection)return t(value,`${selection[1]} selected · drag the blue box`);
  return L.localizeError(value,getLanguage());
}
const textBindings=[...document.querySelectorAll('[data-i18n]')].map(el=>({el,zh:el.textContent.trim()}));
const attributeBindings=[...document.querySelectorAll('[data-i18n-aria],[data-i18n-placeholder]')].flatMap(el=>[['data-i18n-aria','aria-label'],['data-i18n-placeholder','placeholder']].filter(([marker])=>el.hasAttribute(marker)).map(([,attribute])=>({el,attribute,zh:el.getAttribute(attribute)})));
for(const {zh} of [...textBindings,...attributeBindings])if(!Object.hasOwn(ENGLISH,zh))throw new Error('Missing Writing interface translation');
function renderStatus(retranslateToast=false){const prior=$('drawing-status').textContent,next=translate(lastStatus);$('drawing-status').textContent=next;$('drawing-status').classList.toggle('is-error',lastStatusError);const toast=$('shared-status');if(retranslateToast&&toast&&!toast.hidden&&toast.textContent===prior){toast.textContent=next;toast.classList.toggle('is-error',lastStatusError);}}
function setSaveState(value){saveState=value;$('save-status').textContent=translate(value);}
function setTextError(value){textError=value;$('text-error').textContent=translate(value);}
function applyLanguage(){document.documentElement.lang=getLanguage()==='zh'?'zh-CN':'en';for(const {el,zh} of textBindings)el.textContent=translate(zh);for(const {el,attribute,zh} of attributeBindings)el.setAttribute(attribute,translate(zh));renderStatus(true);setSaveState(saveState);setTextError(textError);updateButtons();requestPaint();}
window.addEventListener('life-winner-languagechange',applyLanguage);

function status(text,error=false) {const toast=$('shared-status');if(!error&&toast?.textContent===$('drawing-status').textContent)toast.hidden=true;lastStatus=text;lastStatusError=error;renderStatus();if(error)notify(translate(text),true);}
function updateButtons() {$('undo-button').disabled=!history.length;$('copy-button').disabled=!selected.size;$('delete-button').disabled=!selected.size;$('paste-button').disabled=!clipboard.length;$('selection-count').textContent=translate(selected.size?`已选 ${selected.size} 项，拖动蓝框移动`:'框选内容，或点选后拖动');}
function requestPaint(){if(frame===null)frame=requestAnimationFrame(paint);}
function world(p){return {x:(p.x-view.x)/view.scale,y:(p.y-view.y)/view.scale};}
function screen(p){return {x:p.x*view.scale+view.x,y:p.y*view.scale+view.y};}
function inside(p){return p.x>=0&&p.y>=0&&p.x<=doc.width&&p.y<=doc.height;}
function pointFromEvent(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
function cancelGesture(){active=null;clearTimeout(longPress);longPress=null;requestPaint();}
function saveDraft(manual=false){clearTimeout(saveTimer);if(localBlocked){status('旧本机草稿无法读取，尚未覆盖；请先导出当前内容，或明确新建画板。',true);return;}try{L.serializeDocument(doc);saveLocal(KEY,doc);setSaveState('已保存到本机');if(manual)status('当前画板已保存到此设备；重要内容请另行导出。');}catch(e){setSaveState('本机保存失败，请导出');status(e,true);}}
function scheduleSave(){setSaveState('正在保存…');clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveDraft(),400);}
function commit(next){const validated=L.validateDocument(next),old=L.serializeDocument(doc);L.serializeDocument(validated);history.push(old);historyBytes+=new Blob([old]).size;while(history.length>20||(historyBytes>6*1024*1024&&history.length>1)){historyBytes-=new Blob([history.shift()]).size;}doc=validated;revision++;selected=new Set([...selected].filter(id=>L.allItems(doc).some(e=>e.item.id===id)));scheduleSave();updateButtons();requestPaint();}
function setTool(next){cancelGesture();$('paste-menu').hidden=true;tool=next;document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===tool)));$('shape-option').hidden=tool!=='shape';$('highlight-option').hidden=tool!=='highlight';$('selection-actions').hidden=tool!=='select';if(tool!=='select')selected.clear();updateButtons();status({shape:'画出所选轮廓，停住约 0.65 秒；绿色预览出现后松开。',line:'画一条大致直线，停住约 0.65 秒后松开。',select:'点选或框选；复制副本后直接拖动蓝框，可看见移动位置。',reveal:'点胶带可揭开或重新遮挡；底下的内容保持不变。',laser:'激光松开后消失，不写入导出文件。'}[tool]||'在白色画板内绘画；每次编辑后尝试保存本机草稿。');requestPaint();}
function linePath(points,close=false){ctx.beginPath();if(!points.length)return;ctx.moveTo(points[0].x,points[0].y);if(points.length===1)ctx.lineTo(points[0].x+.01,points[0].y);else for(const p of points.slice(1))ctx.lineTo(p.x,p.y);if(close)ctx.closePath();}
function textLines(text,font,width){const capacity=Math.max(1,Math.floor((width-24)/(font*.62))),lines=[];for(const raw of text.split('\n')){let line='',units=0;for(const char of raw){const size=char.codePointAt(0)>255?2:1;if(units+size>capacity&&line){lines.push(line);line='';units=0;}line+=char;units+=size;}lines.push(line);}return lines;}
function drawItem(kind,item,opacity=1,delta={dx:0,dy:0}){ctx.save();ctx.globalAlpha=opacity;ctx.translate(delta.dx,delta.dy);ctx.lineCap='round';ctx.lineJoin='round';if(kind==='cards'){ctx.fillStyle='#f3f7ff';ctx.strokeStyle='#b8cdf6';ctx.lineWidth=1.5/view.scale;ctx.fillRect(item.x,item.y,item.width,item.height);ctx.strokeRect(item.x,item.y,item.width,item.height);ctx.beginPath();ctx.rect(item.x+8,item.y+6,item.width-16,item.height-12);ctx.clip();ctx.fillStyle=item.color;ctx.font=`${item.font}px -apple-system, BlinkMacSystemFont, sans-serif`;ctx.textBaseline='top';textLines(item.text,item.font,item.width).forEach((line,i)=>ctx.fillText(line,item.x+12,item.y+10+i*item.font*1.35));}else if(kind==='tapes'){if(!item.revealed){ctx.strokeStyle=item.color;ctx.lineWidth=item.width;linePath(item.points);ctx.stroke();}}else{ctx.fillStyle=item.color;ctx.strokeStyle=item.color;ctx.lineWidth=item.width;linePath(item.points,item.fill);if(item.fill){ctx.globalAlpha*=.3;ctx.fill('nonzero');}else{if(item.highlight)ctx.globalAlpha*=.34;ctx.stroke();}}ctx.restore();}
function selectionRect(bounds,delta={dx:0,dy:0},dashed=true){if(!bounds)return;const pad=5/view.scale,x=Math.max(0,bounds.x+delta.dx-pad),y=Math.max(0,bounds.y+delta.dy-pad),right=Math.min(doc.width,bounds.x+delta.dx+bounds.width+pad),bottom=Math.min(doc.height,bounds.y+delta.dy+bounds.height+pad);ctx.save();ctx.lineWidth=1.6/view.scale;ctx.strokeStyle='#2563eb';ctx.fillStyle='#2563eb0a';ctx.setLineDash(dashed?[6/view.scale,4/view.scale]:[]);ctx.fillRect(x,y,right-x,bottom-y);ctx.strokeRect(x,y,right-x,bottom-y);ctx.setLineDash([]);for(const p of [{x,y},{x:right,y},{x,y:bottom},{x:right,y:bottom}]){const size=7/view.scale;ctx.fillStyle='white';ctx.fillRect(p.x-size/2,p.y-size/2,size,size);ctx.strokeRect(p.x-size/2,p.y-size/2,size,size);}ctx.restore();}
function paint(time){frame=null;const dpr=Math.min(devicePixelRatio||1,3);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,view.width,view.height);ctx.fillStyle='#f6f8fc';ctx.fillRect(0,0,view.width,view.height);ctx.translate(view.x,view.y);ctx.scale(view.scale,view.scale);ctx.fillStyle='white';ctx.fillRect(0,0,doc.width,doc.height);ctx.save();ctx.beginPath();ctx.rect(0,0,doc.width,doc.height);ctx.clip();
  const moving=active?.kind==='move',delta=moving?active.delta:{dx:0,dy:0};
  for(const {kind,item} of L.allItems(doc))drawItem(kind,item,moving&&selected.has(item.id)?.18:1);
  if(moving)for(const {kind,item} of L.allItems(doc))if(selected.has(item.id))drawItem(kind,item,1,delta);
  lasers=lasers.filter(l=>time-l.start<800);for(const l of lasers){ctx.save();ctx.strokeStyle='#ef4444';ctx.globalAlpha=1-(time-l.start)/800;ctx.lineWidth=3/view.scale;ctx.lineCap='round';ctx.lineJoin='round';linePath(l.points);ctx.stroke();ctx.restore();}
  if(active?.kind==='draw'){if((tool==='line'||tool==='shape')&&!active.fit&&time-active.lastMovement>=650&&active.lastFitAttempt!==active.screen.length){active.lastFitAttempt=active.screen.length;const result=tool==='line'?L.fitLine(active.screen):L.fitShape(active.screen,$('shape-kind').value);if(result){const candidate=result.map(world);if(candidate.every(inside)){active.fit=candidate;status('绿色预览已拟合，松开即可生成。');}}}let points=active.fit||active.points;if(tool==='wave')try{points=L.wavePoints(points,{width:active.width,wavelength:24/view.scale,amplitude:5/view.scale,worldWidth:doc.width,worldHeight:doc.height});}catch{}ctx.save();ctx.strokeStyle=active.fit?'#169b62':tool==='laser'?'#ef4444':active.color;ctx.fillStyle=active.color;ctx.lineWidth=tool==='tape'?Math.max(20/view.scale,active.width*6):tool==='highlight'?active.width*5:active.width;ctx.lineCap='round';ctx.lineJoin='round';if(tool==='highlight')ctx.globalAlpha=.34;if(tool==='fill'){ctx.globalAlpha=.2;linePath(points,true);ctx.fill();ctx.globalAlpha=1;}linePath(points);ctx.stroke();ctx.restore();}
  if(active?.kind==='box'){const r=active.box;ctx.save();ctx.strokeStyle='#2563eb';ctx.fillStyle='#2563eb15';ctx.lineWidth=1.5/view.scale;ctx.setLineDash([6/view.scale,4/view.scale]);ctx.fillRect(r.x,r.y,r.width,r.height);ctx.strokeRect(r.x,r.y,r.width,r.height);ctx.restore();}else if(selected.size)selectionRect(L.selectionBounds(doc,selected),delta);
  ctx.restore();if(lasers.length||active?.kind==='draw')requestPaint();}
function resize(){const r=canvas.getBoundingClientRect();if(active)cancelGesture();const dpr=Math.min(devicePixelRatio||1,3);canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));const scale=Math.max(.001,Math.min((r.width-16)/doc.width,(r.height-16)/doc.height));view={width:r.width,height:r.height,scale,x:(r.width-doc.width*scale)/2,y:(r.height-doc.height*scale)/2};requestPaint();}
function showPasteMenu(e,p){pasteAnchor=p;const menu=$('paste-menu');menu.hidden=false;menu.style.left=`${Math.min(innerWidth-190,Math.max(8,e.clientX))}px`;menu.style.top=`${Math.min(innerHeight-70,Math.max(8,e.clientY))}px`;if(active)active.kind='context';requestPaint();}
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;if(active)return;const s=pointFromEvent(e),p=world(s);if(!inside(p))return;e.preventDefault();$('paste-menu').hidden=true;lastWorld=p;try{canvas.setPointerCapture(e.pointerId);}catch{}const common={pointer:e.pointerId,start:p,last:p,startScreen:s,screen:[s],points:[p],anchor:s,lastMovement:performance.now(),fit:null,color:$('ink-color').value,width:Number($('ink-width').value)/view.scale};if(tool==='select'){const b=L.selectionBounds(doc,selected);if(b&&L.contains(b,p,10/view.scale)){active={...common,kind:'move',delta:{dx:0,dy:0}};}else{const hit=L.hitItem(doc,p,7/view.scale);if(hit){selected=new Set([hit]);active={...common,kind:'move',delta:{dx:0,dy:0}};}else{selected.clear();active={...common,kind:'box',box:{x:p.x,y:p.y,width:0,height:0}};}}if(clipboard.length)longPress=setTimeout(()=>{if(active&&Math.hypot(active.last.x-p.x,active.last.y-p.y)*view.scale<6)showPasteMenu(e,p);},550);}else if(tool==='reveal')active={...common,kind:'reveal'};else active={...common,kind:'draw'};updateButtons();requestPaint();},{passive:false});
canvas.addEventListener('pointermove',e=>{if(!active||e.pointerId!==active.pointer)return;e.preventDefault();const coalesced=e.getCoalescedEvents?.();const events=coalesced?.length?coalesced:[e];for(const event of events){const s=pointFromEvent(event),raw=world(s),p={x:Math.max(0,Math.min(doc.width,raw.x)),y:Math.max(0,Math.min(doc.height,raw.y))};active.last=p;if(Math.hypot(s.x-active.startScreen.x,s.y-active.startScreen.y)>6){clearTimeout(longPress);longPress=null;}if(active.kind==='move'){active.delta=L.clampTranslation(doc,selected,p.x-active.start.x,p.y-active.start.y);}else if(active.kind==='box'){active.box={x:Math.min(p.x,active.start.x),y:Math.min(p.y,active.start.y),width:Math.abs(p.x-active.start.x),height:Math.abs(p.y-active.start.y)};}else if(active.kind==='draw'){if(Math.hypot(s.x-active.anchor.x,s.y-active.anchor.y)>2){active.lastMovement=performance.now();active.anchor=s;active.fit=null;active.lastFitAttempt=null;}const prior=active.screen.at(-1);if(Math.hypot(s.x-prior.x,s.y-prior.y)>=.75){if(active.points.length>=L.LIMITS.inputPoints){cancelGesture();status('这条笔迹太长，未提交；请分段绘制。',true);return;}active.screen.push(s);active.points.push(p);}}}requestPaint();},{passive:false});
canvas.addEventListener('pointerup',e=>{if(!active||e.pointerId!==active.pointer)return;e.preventDefault();clearTimeout(longPress);const a=active;active=null;try{if(a.kind==='move'){if(Math.abs(a.delta.dx)+Math.abs(a.delta.dy)>.01){commit(L.translateSelection(doc,selected,a.delta.dx,a.delta.dy));status('已移动，副本位置已保存。');}}else if(a.kind==='box'){selected=new Set(L.allItems(doc).filter(({item})=>L.intersects(L.itemBounds(item),a.box)).map(({item})=>item.id));}else if(a.kind==='reveal'){const tape=[...doc.tapes].reverse().find(t=>L.hitTape(t,a.last,6/view.scale));if(tape){commit({...doc,tapes:doc.tapes.map(t=>t.id===tape.id?{...t,revealed:!t.revealed}:t)});status('胶带已切换，原内容保持不变。');}}else if(a.kind==='draw'){let points=a.fit||a.points;if(tool==='laser'){lasers.push({points,start:performance.now()});lasers=lasers.slice(-12);}else if(tool==='tape'){commit({...doc,tapes:[...doc.tapes,{id:L.newID(),points,width:Math.max(20/view.scale,a.width*6),color:a.color,revealed:false}]});status('胶带已添加，使用“揭开”工具点它。');}else{let message='笔迹已添加。';if((tool==='line'||tool==='shape')&&!a.fit)message='未检测到符合条件的停留轮廓，已保留原笔迹。';if(tool==='wave')try{points=L.wavePoints(points,{width:a.width,wavelength:24/view.scale,amplitude:5/view.scale,worldWidth:doc.width,worldHeight:doc.height});}catch{message='波浪需要足够长度与边距，已保留原笔迹。';}if(tool==='fill')points=L.fillPolygon(points);commit(L.appendStroke(doc,{id:L.newID(),points,width:tool==='highlight'?a.width*5:a.width,color:a.color,fill:tool==='fill',highlight:tool==='highlight'},$('highlight-below').checked));status(message);}}}catch(error){status(error,true);}updateButtons();requestPaint();});
canvas.addEventListener('pointercancel',()=>{cancelGesture();status('本次触控已取消，未改变原内容。');});
canvas.addEventListener('lostpointercapture',()=>{if(active)cancelGesture();});
document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool)));
$('shape-kind').addEventListener('change',()=>cancelGesture());
$('undo-button').addEventListener('click',()=>{if(!history.length)return;cancelGesture();const previous=history.pop();historyBytes-=new Blob([previous]).size;doc=L.parseDocument(previous);revision++;selected.clear();scheduleSave();resize();updateButtons();status('已撤销。');});
function paste(anchor=null){if(!clipboard.length)return;try{const result=L.pasteSelection(doc,clipboard,anchor);commit(result.document);selected=result.ids;setTool('select');selected=result.ids;updateButtons();requestPaint();status('副本已选中；拖动蓝框可移动，预览始终显示新位置。');}catch(e){status(e,true);}}
$('copy-button').addEventListener('click',()=>{clipboard=L.copySelection(doc,selected);paste();});
$('paste-button').addEventListener('click',()=>paste());
$('paste-here-button').addEventListener('click',()=>{$('paste-menu').hidden=true;paste(pasteAnchor);});
$('delete-button').addEventListener('click',()=>{if(selected.size){commit(L.removeSelection(doc,selected));selected.clear();updateButtons();requestPaint();status('已删除选中内容，可撤销。');}});
document.addEventListener('pointerdown',e=>{if(!$('paste-menu').contains(e.target)&&e.target!==canvas)$('paste-menu').hidden=true;});
$('text-button').addEventListener('click',()=>{cancelGesture();setTextError('');$('text-dialog').showModal();$('card-text').focus();});
$('add-text-button').addEventListener('click',e=>{e.preventDefault();const text=$('card-text').value.trim();if(!text){setTextError('请先输入文字。');return;}const font=48,width=Math.min(660,doc.width-32),height=textLines(text,font,width).length*font*1.35+24;if(height>doc.height-32){setTextError('文字太多，请分成较小的文字卡。');return;}const anchor=lastWorld||{x:doc.width/2,y:doc.height/2},card={id:L.newID(),text,font,width,height,color:$('ink-color').value,x:Math.max(16,Math.min(doc.width-width-16,anchor.x)),y:Math.max(16,Math.min(doc.height-height-16,anchor.y))};try{commit({...doc,cards:[...doc.cards,card]});$('card-text').value='';$('text-dialog').close();setTool('select');selected=new Set([card.id]);updateButtons();requestPaint();status('文字卡已添加，可拖动蓝框移动。');}catch(error){setTextError(error);}});
function exportBlob(){return new Blob([L.serializeDocument(doc)],{type:'application/json'});}
$('export-button').addEventListener('click',()=>{try{saveFile(exportBlob(),'life-winner-writing.json');status('已请求导出 JSON；请在系统界面选择保存位置。');}catch(e){status(e,true);}});
$('share-button').addEventListener('click',async()=>{document.querySelector('.more-menu').open=false;try{const result=await shareFile(exportBlob(),'life-winner-writing.json',translate('书写画板'));if(result!=='cancelled')status(result==='shared'?'已交给系统分享。':'此浏览器不支持文件分享，已改为导出。');}catch(e){status(e,true);}});
$('save-button').addEventListener('click',()=>{document.querySelector('.more-menu').open=false;saveDraft(true);});
$('open-button').addEventListener('click',()=>{if((L.allItems(doc).length||localBlocked)&&!confirm(translate('打开文件会替换当前画板和本机草稿。重要内容请先导出。继续吗？')))return;cancelGesture();$('open-file').value='';$('open-file').click();});
$('open-file').addEventListener('change',async()=>{const file=$('open-file').files[0];if(!file)return;try{if(file.size>L.LIMITS.bytes)throw new Error('文件超过 8 MiB。');const expected=revision;const next=L.parseDocument(await file.text());if(expected!==revision||active)throw new Error('读取期间画板已改变，请重试打开。');cancelGesture();commit(next);localBlocked=false;selected.clear();lasers=[];resize();saveDraft();status('画板已打开；当前设备的草稿已更新。');}catch(e){status({kind:'open-error',error:e},true);}});
function replaceBoard(next,message){if((L.allItems(doc).length||localBlocked)&&!confirm(translate('这会替换当前画板和本机草稿。请先导出重要内容。继续吗？')))return;cancelGesture();commit(next);localBlocked=false;selected.clear();lasers=[];resize();saveDraft();status(message);document.querySelector('.more-menu').open=false;}
$('new-button').addEventListener('click',()=>replaceBoard(L.emptyDocument(),'新画板已准备，可撤销上一步。'));
$('example-button').addEventListener('click',()=>{const next=L.emptyDocument();next.strokes=[{id:L.newID(),points:[{x:140,y:300},{x:500,y:220},{x:860,y:400}],width:12,color:'#2563eb',fill:false,highlight:false}];next.tapes=[{id:L.newID(),points:[{x:200,y:700},{x:900,y:700}],width:80,color:'#2563eb',revealed:false}];next.cards=[{id:L.newID(),text:translate('虚构示例：选择蓝框后复制并拖动；胶带可揭开。'),x:140,y:980,width:850,height:200,font:44,color:'#142339'}];replaceBoard(next,'已载入虚构示例；可试用选择、复制与揭开。');});
$('help-button').addEventListener('click',()=>{$('help-dialog').showModal();});$('close-help-button').addEventListener('click',()=>$('help-dialog').close());
document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();$('undo-button').click();}if(e.key==='Escape'){cancelGesture();$('paste-menu').hidden=true;selected.clear();updateButtons();requestPaint();}});
try{const stored=loadLocal(KEY);if(stored)doc=L.validateDocument(stored);}catch(e){localBlocked=true;setSaveState('旧草稿已保留，暂不覆盖');status({kind:'draft-error',error:e},true);}
applyLanguage();new ResizeObserver(resize).observe(wrap);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelGesture();if(saveTimer)saveDraft();}});updateButtons();resize();

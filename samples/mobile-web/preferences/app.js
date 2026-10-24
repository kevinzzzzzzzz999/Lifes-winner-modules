import {loadLocal,saveLocal,saveFile,shareFile,getLanguage,setLanguage} from '../shared.js';
import {PreferencesSession,PlanError,planErrorMessage,TOOLBAR,PEN_KINDS,ACTIONS,SHAPES,SEEK_INTERVALS,PLAYBACK_RATES,MAX_BYTES,reconcilePalette,toolbarVisible,penColor,resolvedLanguage} from './logic.js';

const session=new PreferencesSession({read:loadLocal,write:saveLocal});
let activeTab='appearance',storageProblem=false,fieldNumber=0,importTicket=0,adoptingPlanLanguage=false;
let strokes=[],redoStrokes=[],activeStroke=null,showGrid=false,previewExpanded=false,showSampleStroke=true;
const canvas=document.getElementById('preview-canvas'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id),p=()=>session.value.preferences;
const language=()=>getLanguage();
const l=(zh,en)=>language()==='en'?en:zh;
function adoptPlanLanguage() {
  // Loading/importing a plan changes its current UI preview, never its stored bytes.
  // The guard prevents the shell's synchronous language event from editing it again.
  adoptingPlanLanguage=true;
  try {setLanguage(resolvedLanguage(p().language,navigator.language||'zh'));}
  finally {adoptingPlanLanguage=false;}
}
function adoptStartupLanguage() {
  let remembered;
  try {remembered=loadLocal('preferences-language');} catch { /* A damaged UI preference must not prevent opening a valid plan. */ }
  if(remembered!=='zh'&&remembered!=='en'){adoptPlanLanguage();return;}
  // Keep the remembered interface choice in the current preview only. The saved
  // plan, including its previous language and every other field, stays untouched.
  if(resolvedLanguage(p().language,navigator.language||'zh')!==remembered)session.edit(value=>{value.language=remembered;});
  adoptingPlanLanguage=true;
  try {setLanguage(remembered);} finally {adoptingPlanLanguage=false;}
}
function node(tag,className='',text) {const value=document.createElement(tag);if(className)value.className=className;if(text!==undefined)value.textContent=text;return value;}
function status(text,error=false) {$('plan-status').textContent=text;$('plan-status').classList.toggle('is-error',error);}
function dirtyStatus() {status(session.dirty?l('尚未保存 · 只在当前预览中修改','Unsaved changes · current preview only'):session.hasSaved?l('已读取本机方案','Loaded from this device'):l('默认方案 · 点保存可留在本机','Default plan · Save to keep on this device'));}
function report(error) {status(planErrorMessage(error,language()),true);}
function selectedPen() {return p().savedPens.pens.find(pen=>pen.id===p().savedPens.selectedID)||p().savedPens.pens[0]||null;}
function edit(change,rerender=false) {
  try {session.edit(change);dirtyStatus();if(rerender)renderAll();else updatePreview();return true;}
  catch(error){report(error);return false;}
}
function section(parent,title) {const box=node('div','settings-section');box.append(node('h2','',title));parent.append(box);return box;}
function help(parent,text) {parent.append(node('p','help',text));}
function details(parent,title) {const item=node('details','advanced-options');item.append(node('summary','',title));parent.append(item);return item;}
function label(title,input,description) {
  const item=node('div','field'),id='preference-field-'+(++fieldNumber);input.id=id;
  const heading=node('label','field-label',title);heading.htmlFor=id;item.append(heading,input);
  if(description)item.append(node('small','',description));return item;
}
function select(parent,title,value,choices,onChange,description) {
  const input=node('select');for(const [key,name] of choices){const option=node('option','',name);option.value=String(key);input.append(option);}input.value=String(value);
  input.addEventListener('change',()=>{if(onChange(input.value)===false)input.value=String(value);});parent.append(label(title,input,description));return input;
}
function toggle(parent,title,value,onChange) {
  const row=node('label','toggle-field'),input=node('input');input.type='checkbox';input.checked=value;row.append(node('span','',title),input);
  input.addEventListener('change',()=>{if(onChange(input.checked)===false)input.checked=!input.checked;});parent.append(row);return input;
}
function range(parent,title,value,min,max,step,onChange,unit='') {
  const row=node('div','field'),heading=node('div','range-heading'),id='preference-field-'+(++fieldNumber),name=node('label','field-label',title),output=node('output','',String(value)+unit),input=node('input');
  name.htmlFor=id;input.type='range';input.id=id;input.min=String(min);input.max=String(max);input.step=String(step);input.value=String(value);output.htmlFor=id;
  heading.append(name,output);row.append(heading,input);parent.append(row);
  input.addEventListener('input',()=>{const next=Number(Number(input.value).toFixed(4));if(onChange(next)!==false)output.textContent=String(next)+unit;});return input;
}
function color(parent,title,value,onChange) {
  const row=node('div','field color-field'),input=node('input'),id='preference-field-'+(++fieldNumber),name=node('label','field-label',title);name.htmlFor=id;input.id=id;input.type='color';input.value=value;
  input.addEventListener('input',()=>onChange(input.value));row.append(name,input);parent.append(row);return input;
}
function button(parent,title,onClick,className='') {const value=node('button',className,title);value.type='button';value.addEventListener('click',onClick);parent.append(value);return value;}
function penEdit(change,rerender=false) {const id=selectedPen()?.id;if(!id)return false;return edit(value=>{const pen=value.savedPens.pens.find(pen=>pen.id===id);if(pen)change(pen);},rerender);}
function setPenHex(value) {return penEdit(pen=>{pen.red=parseInt(value.slice(1,3),16)/255;pen.green=parseInt(value.slice(3,5),16)/255;pen.blue=parseInt(value.slice(5,7),16)/255;});}

function renderAppearance() {
  const parent=$('group-appearance');parent.replaceChildren();
  const general=section(parent,l('界面与方案语言','Interface and plan language'));
  select(general,l('使用语言','Language'),p().language,[['system',l('跟随系统','Follow system')],['zh','简体中文'],['en','English']],value=>{if(!edit(p=>{p.language=value;}))return false;adoptPlanLanguage();renderAll();dirtyStatus();return true;});
  help(general,l('右上角可随时切换中英文；切换同时修改当前方案语言，点保存后才保留方案，不会清空未保存修改或试写。','Switch English or Chinese in the header at any time. It also changes the current plan language; Save keeps the plan. Your unsaved edits and preview ink remain.'));
  const dock=section(parent,l('预览工具栏位置','Preview toolbar position')),row=node('div','choice-row');
  for(const [value,zh,en] of [['top','顶部','Top'],['bottom','底部','Bottom'],['left','左侧','Left'],['right','右侧','Right']]) {
    const choice=button(row,l(zh,en),()=>{previewExpanded=false;edit(p=>{p.dock.edge=value;},true);});choice.setAttribute('aria-pressed',String(p().dock.edge===value));
  }dock.append(row);
  const pen=selectedPen(),colors=section(parent,l('试写笔色','Preview pen color'));
  if(pen)color(colors,l('当前笔颜色','Current pen color'),penColor(pen),setPenHex);else help(colors,l('工具栏页可添加一支笔。','Add a pen on the Tools tab.'));
  help(colors,l('改变的是这支笔，不是系统主题；颜色用于之后的试写。','This changes the current pen, not the system theme. It applies to new preview strokes.'));
  const extra=details(parent,l('布局宽度与其他选项','Layout widths and other options'));
  toggle(extra,l('显示文件侧栏','Show file sidebar'),p().panels.leftOpen,value=>edit(p=>{p.panels.leftOpen=value;}));
  range(extra,l('文件侧栏宽度','File sidebar width'),p().panels.leftWidth,200,520,1,value=>edit(p=>{p.panels.leftWidth=value;}));
  range(extra,l('助手侧栏宽度','Assistant sidebar width'),p().panels.rightWidth,320,960,1,value=>edit(p=>{p.panels.rightWidth=value;}));
  toggle(extra,l('默认收起预览笔栏','Start with a compact palette'),p().dock.isMinimized,value=>{previewExpanded=false;return edit(p=>{p.dock.isMinimized=value;});});
  help(extra,l('侧栏尺寸保存在方案中，供接入的工作区使用；这个小画板只演示工具栏位置。','Sidebar sizes are saved for a host workspace. This small canvas demonstrates palette placement.'));
}
function renderTools() {
  const parent=$('group-tools');parent.replaceChildren();
  const visibility=section(parent,l('工具栏按钮','Toolbar buttons'));
  const groups=[['书写','Writing',[0,1,10,11,12]],['阅读','Reading',[6,7,8,13]],['通用','General',[2,3,4,5,9]]];
  for(const [zh,en,indices] of groups){const group=details(visibility,l(zh,en));if(zh==='书写')group.open=true;
    for(const i of indices)toggle(group,l(TOOLBAR[i][1],TOOLBAR[i][2]),toolbarVisible(p(),i),visible=>edit(p=>{if(visible)p.toolbar.hiddenMask&=~(1<<i);else p.toolbar.hiddenMask|=(1<<i);}));}
  button(visibility,l('显示全部按钮','Show all buttons'),()=>edit(p=>{p.toolbar.hiddenMask=0;},true));
  help(visibility,l('试写区会展示可用的书写按钮。其他按钮保存为方案选项，本工具不执行AI、翻译或朗读。','The preview uses writing controls. Other choices are exported settings; this tool does not run AI, translation or speech.'));
  const pens=section(parent,l('笔预设','Saved pens'));
  if(p().savedPens.pens.length){select(pens,l('编辑这支笔','Edit pen'),selectedPen().id,p().savedPens.pens.map(pen=>[pen.id,pen.name]),id=>edit(p=>{p.savedPens.selectedID=id;},true));const current=selectedPen();
    const name=node('input');name.type='text';name.value=current.name;name.maxLength=256;name.addEventListener('change',()=>{if(!penEdit(pen=>{pen.name=name.value;},true))name.value=current.name;});pens.append(label(l('名称','Name'),name));
    const names=['圆珠笔','钢笔','单线笔','铅笔','荧光笔','水彩笔','蜡笔','书法笔'],english=['Ballpoint','Fountain pen','Monoline','Pencil','Marker','Watercolor','Crayon','Calligraphy pen'];
    select(pens,l('笔类型','Pen kind'),current.kind,PEN_KINDS.map((kind,i)=>[kind,l(names[i],english[i])]),value=>penEdit(pen=>{pen.kind=value;}),l('网页试写使用矢量线条，不模拟PencilKit纹理。','The web preview draws vector lines rather than PencilKit textures.'));
    const width=node('input');width.type='number';width.min='0.1';width.step='0.5';width.inputMode='decimal';width.value=String(current.width);width.addEventListener('change',()=>{if(!penEdit(pen=>{pen.width=Number(width.value);}))width.value=String(current.width);});pens.append(label(l('粗细','Width'),width,l('试写区最多显示32px粗线，方案保留输入值。','The preview caps display at 32px; the plan retains your value.')));
    color(pens,l('笔颜色','Pen color'),penColor(current),setPenHex);range(pens,l('不透明度','Opacity'),current.alpha,0,1,0.01,value=>penEdit(pen=>{pen.alpha=value;}));
  }else help(pens,l('当前笔列表为空。可添加示例笔。','Your pen list is empty. Add a sample pen.'));
  const actions=node('div','pen-actions');button(actions,l('添加一支笔','Add a pen'),()=>{
    if(p().savedPens.pens.length>=256){report(new PlanError('最多保留256支笔。','A plan can hold up to 256 pens.'));return;}
    edit(p=>{const id=crypto.randomUUID().toUpperCase();p.savedPens.pens.push({id,name:l('新笔','New pen'),kind:'pen',red:0.145,green:0.388,blue:0.922,alpha:1,width:2});p.savedPens.selectedID=id;reconcilePalette(p);},true);
  });const remove=button(actions,l('删除当前笔','Remove current pen'),()=>{
    const id=selectedPen()?.id;if(!id)return;edit(p=>{const index=p.savedPens.pens.findIndex(pen=>pen.id===id);p.savedPens.pens.splice(index,1);if(p.savedPens.selectedID===id){if(p.savedPens.pens.length)p.savedPens.selectedID=p.savedPens.pens[Math.min(index,p.savedPens.pens.length-1)].id;else delete p.savedPens.selectedID;}reconcilePalette(p);},true);
  });remove.disabled=!selectedPen();pens.append(actions);
  const order=details(parent,l('混排笔栏顺序','Mixed palette order')),list=node('ul','palette-list');
  help(order,l('完整混排顺序保存在方案中，供原生笔栏接入。小试写区仅使用上面的常用书写按钮。','The full mixed order is saved for a native palette host. This small preview uses the common writing controls above.'));
  p().palette.entries.forEach((entry,index)=>{const row=node('li'),name=entry.kind==='pen'?p().savedPens.pens.find(pen=>pen.id===entry.penID)?.name:({eraser:l('橡皮擦','Eraser'),lasso:l('套索','Lasso'),ruler:l('直尺','Ruler')})[entry.kind];row.append(node('span','entry-name',name));
    const move=offset=>edit(p=>{const [item]=p.palette.entries.splice(index,1);p.palette.entries.splice(index+offset,0,item);},true);
    const up=button(row,'↑',()=>move(-1));up.disabled=index===0;up.setAttribute('aria-label',l('上移 ','Move up ')+name);
    const down=button(row,'↓',()=>move(1));down.disabled=index===p().palette.entries.length-1;down.setAttribute('aria-label',l('下移 ','Move down ')+name);
    if(entry.kind!=='pen')button(row,l('隐藏','Hide'),()=>edit(p=>{p.palette.entries.splice(index,1);},true));list.append(row);
  });order.append(list);const restore=node('div','utility-restore');
  for(const [kind,zh,en] of [['eraser','橡皮擦','eraser'],['lasso','套索','lasso'],['ruler','直尺','ruler']])if(!p().palette.entries.some(e=>e.kind===kind))button(restore,l('恢复'+zh,'Restore '+en),()=>edit(p=>{p.palette.entries.push({kind});},true));order.append(restore);
}
function renderGestures() {
  const parent=$('group-gestures');parent.replaceChildren();const actions=section(parent,l('Pencil操作选项','Pencil action preferences'));
  const titles=['跟随系统','切换橡皮擦','上一个工具','显示笔栏','颜色与粗细','不执行操作'],english=['Follow system','Switch eraser','Previous tool','Show palette','Color and width','No action'];
  for(const [key,zh,en] of [['doubleTap','双击','Double-tap'],['squeeze','握压','Squeeze']])select(actions,l(zh,en),p().gestures[key],ACTIONS.map((a,i)=>[a,l(titles[i],english[i])]),value=>edit(p=>{p.gestures[key]=value;}));
  toggle(actions,l('使用系统笔栏（方案选项）','Request system palette (plan only)'),p().dock.usesSystemPalette,value=>edit(p=>{p.dock.usesSystemPalette=value;}));
  help(actions,l('这些值仅保存在方案中。网页不会修改系统手势，也不会接管Apple Pencil双击或握压。','These choices are saved in the plan. This page does not change system gestures or handle Apple Pencil double-tap/squeeze.'));
  const hold=section(parent,l('停留与形状辅助','Hold and shape assistance'));
  toggle(hold,l('停留辅助直线','Hold for a straight line'),p().holdLine.isEnabled,value=>edit(p=>{p.holdLine.isEnabled=value;}));
  range(hold,l('停留秒数','Hold duration (seconds)'),p().holdLine.holdDuration,0.35,1.5,0.05,value=>edit(p=>{p.holdLine.holdDuration=value;}));
  const names=['关闭','圆形','椭圆','矩形','三角形','箭头','坐标轴'],shapeNames=['Off','Circle','Ellipse','Rectangle','Triangle','Arrow','Axes'];select(hold,l('几何模式','Geometry mode'),p().geometry.shape,SHAPES.map((shape,i)=>[shape,l(names[i],shapeNames[i])]),value=>edit(p=>{p.geometry.shape=value;}));
  help(hold,l('停留与形状参数供书写组件接入；下方小试写区仅演示笔色、粗细和工具栏。','Hold and shape parameters are for a writing host. The small preview demonstrates pen style and toolbar layout.'));
}
function renderPlayback() {
  const parent=$('group-playback');parent.replaceChildren();const play=section(parent,l('播放方案','Playback preferences'));
  select(play,l('快进步长','Seek interval'),p().playback.seekInterval,SEEK_INTERVALS.map(v=>[v,String(v)+l('秒',' seconds')]),value=>edit(p=>{p.playback.seekInterval=Number(value);}));
  select(play,l('播放速度','Playback rate'),p().playback.playbackRate,PLAYBACK_RATES.map(v=>[v,String(v)+'×']),value=>edit(p=>{p.playback.playbackRate=Number(value);}));
  select(play,l('笔迹回放显示','Ink replay display'),p().playback.replayMode,[['progressive',l('逐步显示','Progressive')],['dimmed',l('未来笔迹淡化','Dim future ink')]],value=>edit(p=>{p.playback.replayMode=value;}));
  const subs=section(parent,l('字幕外观','Subtitle appearance'));
  range(subs,l('字号','Font size'),p().playback.subtitles.fontSize,12,48,1,value=>edit(p=>{p.playback.subtitles.fontSize=value;}));
  color(subs,l('文字颜色','Text color'),p().playback.subtitles.textColor,value=>edit(p=>{p.playback.subtitles.textColor=value;}));
  color(subs,l('描边颜色','Outline color'),p().playback.subtitles.strokeColor,value=>edit(p=>{p.playback.subtitles.strokeColor=value;}));
  range(subs,l('描边粗细','Outline width'),p().playback.subtitles.strokeWidth,0,4,0.5,value=>edit(p=>{p.playback.subtitles.strokeWidth=value;}));
  color(subs,l('背景颜色','Background color'),p().playback.subtitles.backgroundColor,value=>edit(p=>{p.playback.subtitles.backgroundColor=value;}));
  range(subs,l('背景不透明度','Background opacity'),p().playback.subtitles.backgroundOpacity,0,1,0.01,value=>edit(p=>{p.playback.subtitles.backgroundOpacity=value;}));
  const service=section(parent,l('服务选择','Service choices'));
  select(service,l('AI网页服务','AI website'),p().aiWebsite,[['chatgpt','ChatGPT'],['deepseek','DeepSeek'],['claude','Claude'],['gemini','Gemini']],value=>edit(p=>{p.aiWebsite=value;}));
  select(service,l('翻译服务','Translation service'),p().translationService,[['openAI','OpenAI'],['deepSeek','DeepSeek'],['gemini','Gemini']],value=>edit(p=>{p.translationService=value;}));
  help(service,l('这里只保存选项，不播放视频、不联网翻译或调用AI，也不收集账号和密钥。','These are settings only: no playback, AI or translation calls, accounts or keys.'));
}

function setTab(tab,refresh=true) {
  activeTab=tab;if(refresh)({appearance:renderAppearance,tools:renderTools,gestures:renderGestures,playback:renderPlayback})[tab]();
  for(const value of ['appearance','tools','gestures','playback']){const selected=value===tab,button=$('tab-'+value);button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;$('group-'+value).hidden=!selected;}updatePreview();
}
function renderLabels() {
  $('app-title').textContent=l('偏好方案','Preferences');document.documentElement.lang=language()==='zh'?'zh-CN':'en';
  document.title=l("偏好方案 · Life's winner","Preferences · Life's winner");
  $('back-link').textContent=l("Life's winner 工具","Life's winner tools");
  $('settings-tabs').setAttribute('aria-label',l('设置类别','Settings categories'));
  $('preview-toolbar').setAttribute('aria-label',l('本应用预览工具栏','This app’s preview toolbar'));
  canvas.setAttribute('aria-label',l('偏好方案试写区，可用手指或笔试写','Preferences preview canvas; draw with a finger or pen'));
  $('plan-file').setAttribute('aria-label',l('导入JSON方案','Import a JSON plan'));
  document.querySelector('[data-install]').textContent=l('安装','Install');
  document.querySelector('[data-check-updates]').textContent=l('检查更新','Check updates');
  for(const [id,zh,en] of [['tab-appearance','外观','Appearance'],['tab-tools','工具栏','Tools'],['tab-gestures','手势','Gestures'],['tab-playback','播放','Playback'],['save-plan','保存本机','Save'],['import-plan','导入','Import'],['export-plan','导出','Export'],['share-plan','分享','Share'],['reload-plan','重新读取','Reload'],['reset-plan','恢复默认','Reset defaults'],['preview-title','实时预览','Live preview'],['clear-preview','清空试写','Clear preview'],['help-summary','怎样保存和使用','Saving and using plans']])$(id).textContent=l(zh,en);
  $('scope-note').textContent=l('只调整当前工具与导出方案，不改变系统或原完整版软件设置。','Only this tool and its exported plan are affected, not system settings or the original full application.');
  $('preview-help').textContent=l('可在小画板试写，试用撤销、笔色与辅助线。试写内容不保存到方案。','Try drawing, undo, pen color and guide lines here. Preview strokes are not saved in the plan.');
  $('subtitle-sample').textContent=l('字幕预览：文字清楚，画面保持可见。','Subtitle preview: clear text and a visible picture.');
  $('help-content').replaceChildren();
  for(const [zh,en] of [
    ['点“保存本机”保留方案，重新打开当前工具会读取。浏览器数据被清理、卸载或系统回收时可能丢失，请定期导出JSON备份。','Save keeps the plan in this browser. Website data cleanup, uninstalling or storage eviction may remove it; export regular JSON backups.'],
    ['导入先检查完整字段、版本、笔ID与引用、64 KiB大小限制，失败不替换当前方案。成功导入后仍需保存。','Imports check the full schema, version, pen references and 64 KiB limit. A rejected file never replaces the current plan. Save after a successful import.'],
    ['分享将由你选择接收位置；不支持系统文件分享时改为下载。导出方案不包含试写笔迹。','You choose the destination for sharing. A download is offered when file sharing is unavailable. Plans do not contain preview ink.'],
    ['使用与Mac独立偏好方案相同的版本1格式。网页会拒绝缺字段、未知字段或超出允许范围的文件，不自动修正损坏数据。不会读取原App的偏好。','Version 1 matches the standalone Mac plan. The web app rejects missing/unknown fields and out-of-range values instead of repairing damaged data. It never reads the original App preferences.'],
    ['中英文切换保留所有未保存方案值、当前设置页和试写线条。切换本身不保存方案；导入、重新读取和恢复默认会采用该方案的语言。','Switching languages preserves unsaved plan values, the current tab and preview strokes. Switching does not save the plan; Import, Reload and Reset apply the language of that plan.'],
    ['希望每一个使用我开源功能的人，都是各自的 Life\'s winner。','I hope everyone who uses these open-source tools becomes Life\'s winner in their own way.']])$('help-content').append(node('p','',l(zh,en)));
}
function renderAll() {fieldNumber=0;renderLabels();renderAppearance();renderTools();renderGestures();renderPlayback();setTab(activeTab,false);updatePreview();}

function updatePreview() {
  $('preview-layout').dataset.edge=p().dock.edge;
  const toolbar=$('preview-toolbar');toolbar.replaceChildren();
  if(p().dock.isMinimized&&!previewExpanded)button(toolbar,l('展开','Expand'),()=>{previewExpanded=true;updatePreview();});
  else {
    for(const index of [0,1,10,11,12])if(toolbarVisible(p(),index)){
      const action=button(toolbar,TOOLBAR[index][3],()=>{
        if(index===0&&strokes.length){redoStrokes.push(strokes.pop());}
        else if(index===1&&redoStrokes.length){strokes.push(redoStrokes.pop());}
        else if(index===10&&p().savedPens.pens.length){const pens=p().savedPens.pens,at=pens.findIndex(pen=>pen.id===selectedPen()?.id);edit(p=>{p.savedPens.selectedID=p.savedPens.pens[(at+1)%pens.length].id;});}
        else if(index===11)showGrid=!showGrid;
        else if(index===12){setTab('tools');$('group-tools').scrollIntoView({block:'start'});}
        updatePreview();
      });action.title=l(TOOLBAR[index][1],TOOLBAR[index][2]);action.setAttribute('aria-label',l(TOOLBAR[index][1],TOOLBAR[index][2]));
      if(index===0)action.disabled=!strokes.length;if(index===1)action.disabled=!redoStrokes.length;if(index===10)action.disabled=!selectedPen();if(index===11)action.setAttribute('aria-pressed',String(showGrid));
    }
    if(!toolbar.childElementCount)toolbar.append(node('span','help',l('预览按钮已隐藏，可到工具栏页恢复。','Preview controls are hidden; restore them on Tools.')));
  }
  const pen=selectedPen();$('preview-pen-name').textContent=pen?l('当前试写笔：','Preview pen: ')+pen.name+l(' · 只在此页试写',' · this page only'):l('没有笔预设，可到工具栏页添加。','No pen preset; add one on Tools.');
  $('subtitle-preview').hidden=activeTab!=='playback';const sub=p().playback.subtitles,sample=$('subtitle-sample'),rgb=[1,3,5].map(i=>parseInt(sub.backgroundColor.slice(i,i+2),16));
  sample.style.fontSize=sub.fontSize+'px';sample.style.color=sub.textColor;sample.style.webkitTextStroke=sub.strokeWidth+'px '+sub.strokeColor;sample.style.backgroundColor=`rgba(${rgb.join(',')},${sub.backgroundOpacity})`;
  drawPreview();
}
function drawPreview() {
  const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height||!ctx)return;
  const dpr=Math.min(3,window.devicePixelRatio||1),width=rect.width,height=rect.height,w=Math.round(width*dpr),h=Math.round(height*dpr);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
  if(showGrid){ctx.lineWidth=1;ctx.strokeStyle='#e6edf7';ctx.beginPath();for(let x=16;x<width;x+=20){ctx.moveTo(x,0);ctx.lineTo(x,height);}for(let y=16;y<height;y+=20){ctx.moveTo(0,y);ctx.lineTo(width,y);}ctx.stroke();}
  const draw=stroke=>{ctx.strokeStyle=stroke.color;ctx.fillStyle=stroke.color;ctx.lineWidth=stroke.width;ctx.globalAlpha=stroke.alpha;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();stroke.points.forEach(([x,y],i)=>i?ctx.lineTo(x*width,y*height):ctx.moveTo(x*width,y*height));if(stroke.points.length===1){const [x,y]=stroke.points[0];ctx.arc(x*width,y*height,stroke.width/2,0,Math.PI*2);ctx.fill();}else ctx.stroke();ctx.globalAlpha=1;};
  if(showSampleStroke&&!strokes.length&&!activeStroke){const pen=selectedPen();if(pen)draw({points:Array.from({length:50},(_,i)=>[0.1+i/49*0.8,0.52-Math.sin(i/49*Math.PI*2)*0.17]),width:Math.max(0.5,Math.min(32,pen.width)),color:penColor(pen),alpha:pen.alpha});}
  strokes.forEach(draw);if(activeStroke)draw(activeStroke);
}
function point(event){const r=canvas.getBoundingClientRect();return [Math.min(1,Math.max(0,(event.clientX-r.left)/r.width)),Math.min(1,Math.max(0,(event.clientY-r.top)/r.height))];}
canvas.addEventListener('pointerdown',event=>{const pen=selectedPen();if(!pen||activeStroke||event.isPrimary===false||event.pointerType==='mouse'&&event.button!==0)return;event.preventDefault();showSampleStroke=false;canvas.setPointerCapture(event.pointerId);activeStroke={pointer:event.pointerId,points:[point(event)],color:penColor(pen),alpha:pen.alpha,width:Math.max(0.5,Math.min(32,pen.width))};drawPreview();});
canvas.addEventListener('pointermove',event=>{if(activeStroke?.pointer!==event.pointerId)return;event.preventDefault();if(activeStroke.points.length<512)activeStroke.points.push(point(event));drawPreview();});
canvas.addEventListener('pointerup',event=>{if(activeStroke?.pointer!==event.pointerId)return;strokes.push(activeStroke);if(strokes.length>20)strokes.shift();activeStroke=null;redoStrokes=[];if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);updatePreview();});
for(const eventName of ['pointercancel','lostpointercapture'])canvas.addEventListener(eventName,event=>{if(activeStroke?.pointer===event.pointerId){activeStroke=null;drawPreview();}});
new ResizeObserver(drawPreview).observe(canvas);
$('clear-preview').addEventListener('click',()=>{strokes=[];redoStrokes=[];activeStroke=null;showSampleStroke=false;updatePreview();});
window.addEventListener('life-winner-languagechange',()=>{
  if(adoptingPlanLanguage)return;
  // Change one preview field transactionally; keep all other edits and ink in place.
  if(!edit(value=>{value.language=getLanguage();}))return;
  renderAll();dirtyStatus();
});
document.querySelectorAll('[data-tab]').forEach((button,index,all)=>{button.addEventListener('click',()=>setTab(button.dataset.tab));button.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%all.length;else if(event.key==='ArrowLeft')next=(index+all.length-1)%all.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=all.length-1;else return;event.preventDefault();setTab(all[next].dataset.tab);all[next].focus();});});

$('save-plan').addEventListener('click',()=>{
  if(storageProblem&&!confirm(l('本机旧方案无法读取。保存当前方案会替换它，是否继续？','The previous stored plan could not be read. Replace it with the current plan?')))return;
  try{session.save();storageProblem=false;renderAll();status(l('已保存到当前设备和浏览器','Saved on this device and browser'));}catch(error){report(new PlanError('本机保存失败，当前方案仍保留。请导出备份。','Local save failed; the current plan is preserved. Export a backup.'));}
});
$('reload-plan').addEventListener('click',()=>{if(session.dirty&&!confirm(l('重新读取会放弃当前未保存修改，继续？','Reload and discard unsaved changes?')))return;try{session.load();storageProblem=false;adoptPlanLanguage();renderAll();dirtyStatus();}catch(error){storageProblem=true;report(error);}});
$('reset-plan').addEventListener('click',()=>{if(!confirm(l('恢复默认会替换当前预览，尚不会覆盖本机已保存方案。继续？','Replace the current preview with defaults? The saved plan will not change until you Save.')))return;session.reset();previewExpanded=false;adoptPlanLanguage();renderAll();status(l('已恢复默认预览 · 点保存才会保留','Default preview restored · Save to keep'));});
$('import-plan').addEventListener('click',()=>{if(session.dirty&&!confirm(l('导入会替换当前未保存预览，继续？','Import a plan and replace the current unsaved preview?')))return;$('plan-file').click();});
$('plan-file').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;const ticket=++importTicket,revision=session.revision;
  try{if(file.size>MAX_BYTES)throw new PlanError('文件超过64 KiB，当前方案未改变。','The file exceeds 64 KiB; the current plan is unchanged.');const bytes=new Uint8Array(await file.arrayBuffer());if(ticket!==importTicket)return;if(revision!==session.revision&&!confirm(l('读取文件时方案又有修改，仍要导入？','The plan changed while reading. Import anyway?')))return;session.importBytes(bytes);previewExpanded=false;adoptPlanLanguage();renderAll();status(l('导入成功 · 点保存可留在本机','Imported · Save to keep on this device'));}
  catch(error){report(error);}finally{event.target.value='';}
});
function planBlob(){return new Blob([session.exportText()],{type:'application/json;charset=utf-8'});}
$('export-plan').addEventListener('click',()=>{try{saveFile(planBlob(),'life-winner-preferences-plan.json');status(l('已准备导出，请在下载或文件中保留JSON','Export prepared; keep the JSON in Downloads or Files'));}catch(error){report(error);}});
$('share-plan').addEventListener('click',async()=>{try{const result=await shareFile(planBlob(),'life-winner-preferences-plan.json',l('偏好方案','Preferences plan'));if(result==='shared')status(l('已交给系统分享，目的地由你选择','Handed to system sharing; you choose the destination'));else if(result==='downloaded')status(l('当前不支持文件分享，已准备下载','File sharing unavailable; a download is ready'));else status(l('已取消分享，当前方案未改变','Sharing cancelled; the plan is unchanged'));}catch(error){report(error);}});
try{session.load();adoptStartupLanguage();dirtyStatus();}catch(error){storageProblem=true;status(l('本机旧方案无法读取，暂用默认预览；原数据未被覆盖。','Stored plan could not be read. Showing defaults without overwriting it.'),true);}
renderAll();

import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {mkdtemp,readFile,realpath,writeFile,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {PDFDocument,StandardFonts} from 'pdf-lib';
const {chromium}=await import(process.env.INKSPACE_PLAYWRIGHT_MODULE||'playwright');
const ui=fileURLToPath(new URL('../',import.meta.url));
const built=spawnSync(process.execPath,[path.join(ui,'scripts/build.mjs')],{cwd:ui,encoding:'utf8'});if(built.status!==0)throw new Error(built.stdout+built.stderr);
// Resolve our public exports from a separate strict TS project, without Vite's
// ambient *.css declaration or the library's own source declaration shims.
const typeConsumer=await mkdtemp(path.join(ui,'.type-consumer-'));
try{
 await writeFile(path.join(typeConsumer,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'ES2022',module:'ESNext',moduleResolution:'Bundler',jsx:'react-jsx',strict:true,skipLibCheck:false,noEmit:true,types:['react','react-dom'],lib:['DOM','DOM.Iterable','ES2022']},files:['probe.tsx']}));
 await writeFile(path.join(typeConsumer,'probe.tsx'),`import * as Library from '@inkspace/ui';\nimport {CodeEditor} from '@inkspace/ui/editor';\nimport {MarginNotes} from '@inkspace/ui/documents';\nimport '@inkspace/ui/style.css';\nconst content=<><CodeEditor path="demo.py" value="print(1)" onChange={()=>{}}/><MarginNotes language="en" path="notes/margin.md" text="Notes" dirty={false} position="right" onChange={()=>{}} onSave={()=>{}} onImage={()=>{}} onClose={()=>{}} onPosition={()=>{}}/></>;\nvoid content;void Library;\n`);
 const require=createRequire(import.meta.url),tsc=path.resolve(path.dirname(require.resolve('typescript')),'../bin/tsc');
 const consumerCheck=spawnSync(process.execPath,[tsc,'-p',path.join(typeConsumer,'tsconfig.json')],{cwd:ui,encoding:'utf8'});
 if(consumerCheck.status!==0)throw new Error('Public package declaration consumer failed:\n'+consumerCheck.stdout+consumerCheck.stderr);
}finally{await rm(typeConsumer,{recursive:true,force:true});}
const temp=await mkdtemp(path.join(os.tmpdir(),'inkspace-ui-smoke-'));
const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica);pdf.addPage([500,700]).drawText('Independent PDF example',{x:40,y:650,font,size:18});const pdfBytes=Buffer.from(await pdf.save());
const server=await createServer({configFile:false,root:ui,cacheDir:path.join(temp,'vite-cache'),publicDir:false,optimizeDeps:{include:['react','react-dom','react-dom/client','react/jsx-runtime','react/jsx-dev-runtime'],noDiscovery:true},server:{host:'127.0.0.1',port:0,strictPort:true,fs:{allow:[ui,await realpath(path.join(ui,'node_modules'))]}},plugins:[{name:'synthetic-pdf',configureServer(server){server.middlewares.use('/sample.pdf',(_request,response)=>{response.setHeader('Content-Type','application/pdf');response.end(pdfBytes);});server.middlewares.use('/math-lab',async(request,response)=>{const file=(request.url||'').split('?')[0].replace(/^\//,'');if(!['simple.html','index.html','engine.js','simple-core.js','simple.js','app.js','simple.css','style.css'].includes(file)){response.statusCode=404;response.end();return;}response.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'text/javascript');response.end(await readFile(path.join(ui,'dist/math-lab',file)));});}}]});
await server.listen();const port=server.httpServer.address().port,url=`http://127.0.0.1:${port}/smoke/index.html`;
const browser=await chromium.launch({headless:true,...(process.env.INKSPACE_BROWSER_CHANNEL?{channel:process.env.INKSPACE_BROWSER_CHANNEL}:{})});let checks=0;
const pure=['CodeEditor','TextBoxEditor','KnowledgeGraph','MindMapEditor','MemoryPalace','KnowledgeWalkthrough','DocumentPreview','FormulaView','CsvPreview','HtmlPreview','StructuredDocumentEditor','MarginNotes','PDFPage','ReviewPanel','MathWorkbench'];
const hosted=['KnowledgeSpace','NotebookEditor','QuickNotes','CourseChecklist','Calendar','MediaEditor','PDFReader','BoardViewer','InkReplay','StudyPanel','VideoPlayer','LocalOCR','NoteExchange','FileManagement','TranslationSettings'];
const errors=[];const pages=[];
async function pageFor(entry,host='none'){
 const page=await browser.newPage({viewport:{width:1280,height:900}});pages.push(page);page.on('pageerror',error=>errors.push(`${entry}: ${error.message}`));page.on('console',message=>{if(message.type()==='error')errors.push(`${entry}: ${message.text()}`)});
 await page.route('**/*',route=>{const value=route.request().url();if(value.startsWith(`http://127.0.0.1:${port}/`)||value.startsWith('data:')||value.startsWith('blob:'))return route.continue();errors.push(`${entry}: unexpected remote request`);return route.abort();});
 await page.goto(`${url}?entry=${entry}&host=${host}`,{waitUntil:'networkidle'});assert.equal(await page.title(),"Life's winner UI independent smoke");await page.locator('[data-inkspace-module]').waitFor();assert.equal(await page.locator('vite-error-overlay').count(),0);return page;
}
try{
 for(const entry of pure){const page=await pageFor(entry);assert.equal(await page.locator('[data-inkspace-ui-error="render"]').count(),0,entry);assert.equal(await page.locator('[data-inkspace-host-error="configuration"]').count(),0,entry);if(entry==='PDFPage')await page.locator('canvas[data-pdf-ready="true"]').waitFor();
  if(entry==='CodeEditor'){await page.locator('.cm-content').fill('print("changed")');await page.waitForFunction(()=>document.querySelector('#result')?.textContent?.includes('changed'));}
  if(entry==='MarginNotes'){
   await page.locator('.cm-content').fill('# Margin note\n\nUpdated annotation.');
   await page.waitForFunction(()=>document.querySelector('#result')?.textContent?.includes('Updated annotation.'));
   await page.getByRole('button',{name:'Read & images',exact:true}).click();
   assert.match(await page.locator('.margin-content').innerText(),/Updated annotation/);
   await page.getByRole('button',{name:'Save margin notes',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('#result')?.textContent?.includes('Margin saved:'));
   await page.getByRole('button',{name:'Place beside / below',exact:true}).click();
   assert.ok((await page.locator('[aria-label="Margin notes"]').getAttribute('class')).includes('bottom'));
   await page.getByRole('button',{name:'Insert image',exact:true}).click();
   assert.match(await page.locator('#result').innerText(),/Image insertion callback/);
   await page.screenshot({path:path.join(temp,'margin-notes.png')});
  }
  if(entry==='MemoryPalace'){await page.getByRole('button',{name:'sample.md',exact:true}).press('Enter');await page.waitForFunction(()=>document.querySelector('#result')?.textContent?.includes('sample.md'));}
  if(entry==='KnowledgeWalkthrough'){await page.getByTestId('city-first-person').click();assert.equal(await page.getByTestId('knowledge-city').getAttribute('data-camera-mode'),'first');await page.screenshot({path:path.join(temp,'walkthrough.png')});}
  if(entry==='MathWorkbench'){const frame=page.frameLocator('iframe');await frame.locator('body').waitFor();assert.ok((await frame.locator('body').innerText()).length>20);}
  checks++;await page.close();
 }
 for(const entry of hosted){const page=await pageFor(entry);await page.locator('[data-inkspace-host-error="configuration"]').waitFor();assert.match(await page.locator('[role="alert"]').innerText(),/No full-app fallback or sample data/);checks++;await page.close();}
 for(const entry of hosted){const page=await pageFor(entry,'provided');assert.equal(await page.locator('[data-inkspace-host-error="configuration"]').count(),0,entry);assert.equal(await page.locator('[data-inkspace-ui-error="render"]').count(),0,entry);
  if(entry==='QuickNotes'){await page.getByRole('textbox',{name:'Note text'}).fill('A standalone saved note');await page.getByTestId('quick-note-save').click();await page.locator('.quick-note-item').filter({hasText:'A standalone saved note'}).waitFor();assert.ok(await page.evaluate(()=>window.smokeState.files().some(([,text])=>text.includes('A standalone saved note'))));await page.screenshot({path:path.join(temp,'quick-notes.png')});}
  if(entry==='KnowledgeSpace'){await page.getByTestId('space-3d').click();await page.getByTestId('palace').waitFor();}
  checks++;await page.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({status:'passed',publicPackageTypeConsumer:'passed',mountChecks:checks,entries:pure.length+hosted.length,pure:pure.length,hosted:hosted.length,browser:'Playwright (Browser plugin not available)',viewports:['1280x900'],evidenceDirectory:temp,limits:'Host fixtures use isolated synthetic memory storage; no Python, FFmpeg, native OCR, AI account or private vault execution claimed.'}));
}finally{for(const page of pages)if(!page.isClosed())await page.close();await browser.close();await server.close();}

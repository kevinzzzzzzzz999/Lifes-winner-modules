'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');const fs=require('node:fs');const fsp=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const tools=require('..');
test('standalone API preserves useful behavior',async()=>{
const model={version:1,format:'docx',title:'Example',blocks:[{kind:'paragraph',text:'A < B'}]};const bytes=await tools.office.createOffice(model);assert.deepEqual(await tools.office.readOfficeModel(bytes,'docx'),model);const preview=await tools.docxPreview.previewDocx(bytes);assert.ok(preview.html.includes('A &lt; B'));assert.equal(tools.model.xml('<x>'),'&lt;x&gt;');
});

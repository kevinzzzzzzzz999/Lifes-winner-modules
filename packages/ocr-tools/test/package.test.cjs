'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');const fs=require('node:fs');const fsp=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const tools=require('..');
test('standalone API preserves useful behavior',async()=>{
assert.deepEqual(tools.service.target({vaultId:'fixture',path:'example.pdf'}),{vaultId:'fixture',path:'example.pdf',ext:'.pdf'});assert.throws(()=>tools.service.target({vaultId:'fixture',path:'../escape.pdf'}));const scale=tools.capture.ocrCaptureScale(10000,10000,3);assert.ok(scale>0&&scale<=.4096);
});

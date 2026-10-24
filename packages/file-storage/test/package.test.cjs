'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');const fs=require('node:fs');const fsp=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const tools=require('..');
test('standalone API preserves useful behavior',async()=>{
const dir=await fsp.mkdtemp(path.join(os.tmpdir(),'storage-module-test-'));try{const target=path.join(dir,'example.txt');await tools.storage.durableWrite(target,Buffer.from('first'));await assert.rejects(tools.storage.durableWrite(target,Buffer.from('second')));assert.equal(await fsp.readFile(target,'utf8'),'first');assert.equal(tools.paths.relativePath('notes/example.md'),'notes/example.md');assert.throws(()=>tools.paths.relativePath('../escape'));assert.equal(tools.storage.utf8(Buffer.from('a\r\nb')).encoding.newline,'crlf');}finally{await fsp.rm(dir,{recursive:true,force:true});}
});

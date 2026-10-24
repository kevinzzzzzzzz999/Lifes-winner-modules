'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');const fs=require('node:fs');const fsp=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const tools=require('..');
test('standalone API preserves useful behavior',async()=>{
const nodes=tools.outline.parseOutline('# Example\n## Section');assert.equal(nodes.length,2);assert.equal(nodes[1].parent,0);assert.equal(tools.archives.crc32(Buffer.from('123456789')),0xcbf43926);assert.throws(()=>tools.outline.parseOutline('unstructured text'));
});

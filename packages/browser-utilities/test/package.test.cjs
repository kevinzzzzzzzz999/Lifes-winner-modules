'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');const fs=require('node:fs');const fsp=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const tools=require('..');
test('standalone API preserves useful behavior',async()=>{
assert.equal(tools.urls.webURL('https://example.test'),'https://example.test/');assert.throws(()=>tools.urls.webURL('https://user:password@example.test/'));assert.throws(()=>tools.urls.webURL('file:///synthetic/example.txt'));assert.equal(typeof tools.sessions.BrowserStateStore,'function');assert.equal(typeof tools.pageHealth.pageHealthScript,'function');
});

'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');const fs=require('node:fs');const fsp=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const tools=require('..');
test('standalone API preserves useful behavior',async()=>{
const request=tools.service.selection({requestId:crypto.randomUUID(),target:'en',text:'Example'});assert.equal(request.text,'Example');assert.throws(()=>tools.service.selection({requestId:crypto.randomUUID(),target:'en',text:''}));assert.ok(tools.service.PROVIDERS.openai.endpoint.startsWith('https://'));
});

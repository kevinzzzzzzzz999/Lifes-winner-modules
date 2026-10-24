'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');const fs=require('node:fs');const fsp=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const tools=require('..');
test('standalone API preserves useful behavior',async()=>{
assert.deepEqual(tools.model.clozes('Example {{answer}}'),['answer']);assert.throws(()=>tools.model.clozes('Example {{}}'));assert.equal(typeof tools.model.projectEvents,'function');assert.equal(typeof tools.transferModel.parse,'function');
});

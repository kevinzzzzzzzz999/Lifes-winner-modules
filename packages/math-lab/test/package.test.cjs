'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');const fs=require('node:fs');const fsp=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const tools=require('..');
test('standalone API preserves useful behavior',async()=>{
const f=tools.engine.compile('x*x');assert.equal(f({x:3}),9);assert.equal(tools.engine.describe([1,2,3]).mean,2);assert.ok(Math.abs(tools.engine.npv(.1,[-100,110]))<1e-10);assert.throws(()=>tools.engine.compile('constructor(1)'));
});

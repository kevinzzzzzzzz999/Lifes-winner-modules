'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');const fs=require('node:fs');const fsp=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const tools=require('..');
test('standalone API preserves useful behavior',async()=>{
const data=Buffer.from(JSON.stringify({nbformat:4,metadata:{language_info:{name:'python'}},cells:[{cell_type:'code',source:['1+','1'],metadata:{},outputs:[],execution_count:null}]}));assert.deepEqual(tools.notebooks.readCells(data,[0]),[{index:0,source:'1+1'}]);assert.throws(()=>tools.notebooks.readCells(data,[0,0]));assert.equal(typeof tools.python.PythonService,'function');assert.ok(fs.existsSync(path.join(__dirname,'../resources/kernel.py')));
});

'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');const fs=require('node:fs');const fsp=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const tools=require('..');
test('standalone API preserves useful behavior',async()=>{
const state=tools.layers.projectRecords([]);assert.deepEqual(state.layers,[]);assert.deepEqual(state.annotations,[]);assert.ok(tools.layers.sidecarPath('example.pdf').includes('example.pdf'));assert.throws(()=>tools.layers.sidecarPath('../escape.pdf'));assert.deepEqual(tools.extensionModel.projectEvents([]).heads,[]);
});

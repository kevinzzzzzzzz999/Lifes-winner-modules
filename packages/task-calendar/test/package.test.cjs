'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');const fs=require('node:fs');const fsp=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const tools=require('..');
test('standalone API preserves useful behavior',async()=>{
const list=tools.checklists.createChecklist('Example');const updated=tools.checklists.addTask(list,'Read example');assert.equal(updated.tasks.length,1);assert.equal(list.tasks.length,0);assert.deepEqual(tools.checklists.parseChecklist(tools.checklists.serializeChecklist(updated)),updated);const done=tools.checklists.toggleTask(updated,updated.tasks[0].id);assert.equal(done.tasks[0].done,true);
});

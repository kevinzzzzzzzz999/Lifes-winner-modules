'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');const fs=require('node:fs');const fsp=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const tools=require('..');
test('standalone API preserves useful behavior',async()=>{
const board=tools.elements.newBoard('Example',crypto.randomUUID());board.extension={retained:true};assert.equal(tools.validation.validateBoard(board),board);assert.deepEqual(tools.json.parseBoardJSON(JSON.stringify(board)),board);assert.throws(()=>tools.validation.validateBoard({...board,canvasWidth:0}));
});

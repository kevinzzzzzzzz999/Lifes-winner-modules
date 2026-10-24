'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');const fs=require('node:fs');const fsp=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const tools=require('..');
test('standalone API preserves useful behavior',async()=>{
const ink={version:1,extra:'preserve',strokes:[{points:[[1,2,3]],color:'#000000',width:2}]};const translated=tools.merge.translateWeb(ink,10,20);assert.deepEqual(translated.strokes[0].points,[[11,22,3]]);assert.equal(translated.extra,'preserve');assert.deepEqual(ink.strokes[0].points,[[1,2,3]]);assert.equal(tools.sessions.boardMergeUndoState([], 'fixture', {path:'example.inkspace.json'}),'closed');
});

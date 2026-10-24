'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');const fs=require('node:fs');const fsp=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const tools=require('..');
test('standalone API preserves useful behavior',async()=>{
assert.equal(tools.placement.validMergeBounds({x:0,y:0,width:100,height:100}),true);assert.equal(tools.placement.validMergeBounds({x:0,y:0,width:-1,height:100}),false);const replay=tools.replay.inkReplay([{points:[[0,0,2],[10,10,2]],color:'#000000',opacity:1}]);assert.equal(replay.pointCount,2);assert.ok(replay.total>0);
});

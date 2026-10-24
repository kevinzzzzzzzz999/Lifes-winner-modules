'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');const fs=require('node:fs');const fsp=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const tools=require('..');
test('standalone API preserves useful behavior',async()=>{
assert.deepEqual(tools.links.tagsOf('Example #sample'),['sample']);const links=tools.links.rawLinks('[[second]] [First](first.md)');assert.equal(links.length,2);const index=tools.links.makeIndex([{path:'first.md'},{path:'second.md'}]);assert.deepEqual(tools.links.resolveLink({kind:'wiki',target:'second'},'first.md',index),{path:'second.md'});assert.equal(tools.links.rawLinks('```\n[[hidden]]\n```').length,0);
});

'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');const fs=require('node:fs');const fsp=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const tools=require('..');
test('standalone API preserves useful behavior',async()=>{
assert.equal(tools.format.clipDuration({start:0,end:10,speed:2}),5);assert.equal(tools.subtitleFormat.timestamp('00:00:01,250'),1.25);assert.doesNotThrow(()=>tools.subtitleFormat.validateSubtitleFormat('example.srt','1\n00:00:01,000 --> 00:00:02,000\nExample'));assert.throws(()=>tools.subtitleFormat.validateSubtitleFormat('example.srt','1\n00:00:02,000 --> 00:00:01,000\nExample'));
});

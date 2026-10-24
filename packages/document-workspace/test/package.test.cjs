'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');const fs=require('node:fs');const fsp=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const tools=require('..');
test('standalone API preserves useful behavior',async()=>{
const anchor=tools.links.internalFileAnchor('inkspace://open?file=notes%2Fexample.md');assert.equal(tools.links.internalFilePathFromAnchor(anchor),'notes/example.md');assert.equal(tools.links.internalFilePathFromURL('https://example.test/'),null);assert.equal(tools.zoom.clampDocumentZoom(10),4);assert.equal(tools.zoom.clampDocumentZoom(-1),.25);
});

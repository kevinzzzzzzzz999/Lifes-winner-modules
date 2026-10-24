'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {mathExport:{decodeMathExport}}=require('..');
const payload=(name,mime,data)=>({name,mime,dataBase64:Buffer.from(data).toString('base64')});

test('independent worksheet export preserves JSON and CSV data',()=>{
 const json=decodeMathExport(payload('worksheet.json','application/json','{"answer":42}'));
 assert.equal(json.name,'worksheet.json');assert.equal(json.extension,'json');assert.deepEqual(JSON.parse(json.data),{answer:42});
 const csv=decodeMathExport(payload('table.csv','text/csv','x,y\n1,2\n'));
 assert.equal(csv.data.toString('utf8'),'x,y\n1,2\n');assert.equal(csv.name,'table.csv');
});

test('PNG output is bounded content and its suggested name cannot become a path',()=>{
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6XQAAAAASUVORK5CYII=','base64');
 const output=decodeMathExport(payload('../../worksheet.png','image/png',png));
 assert.deepEqual(output.data,png);assert.equal(output.extension,'png');assert.ok(!/[\\/]/.test(output.name));assert.ok(!output.name.startsWith('.'));
 assert.throws(()=>decodeMathExport(payload('bad.png','image/png','not a PNG')));
});

test('malformed encodings, unexpected fields, unsupported types and broken text fail',()=>{
 for(const value of [
  {name:'x',mime:'text/html',dataBase64:'YQ=='},
  {name:'x',mime:'text/csv',dataBase64:'YQ'},
  {name:'x',mime:'text/csv',dataBase64:'Y Q=='},
  {...payload('x','text/csv','ok'),destination:'elsewhere'},
  payload('x','application/json','{"broken":'),
  payload('x','text/csv',Buffer.from([0xff])),
  payload('x','text/csv',''),
 ])assert.throws(()=>decodeMathExport(value));
});

test('oversized content fails before publication',()=>{
 assert.throws(()=>decodeMathExport(payload('large.csv','text/csv',Buffer.alloc(8*1024*1024+1,65))));
});

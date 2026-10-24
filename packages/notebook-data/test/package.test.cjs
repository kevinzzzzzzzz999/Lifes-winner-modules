'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');const fs=require('node:fs');const fsp=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const tools=require('..');
test('standalone API preserves useful behavior',async()=>{
const parsed=tools.delimited.parseDelimited('name,count\nexample,2',',');assert.equal(parsed.rowCount,2);assert.deepEqual(parsed.firstRow,['name','count']);const XLSX=require('../lib/vendor/excel/xlsx.full.min.js');const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([['name','count'],['example',2]]),'Data');const data=Buffer.from(XLSX.write(book,{type:'buffer',bookType:'xlsx'}));const result=await tools.workbooks.notebookDataInfo({snapshot:async()=>({data})},{vaultId:'fixture',path:'example.xlsx'});assert.equal(result.sheets[0].name,'Data');
});

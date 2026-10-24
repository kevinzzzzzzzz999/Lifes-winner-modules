'use strict';
const {PDFDocument}=require('pdf-lib');
const MAX_BYTES=128*1024*1024,MAX_DOCUMENTS=128,MAX_PAGES=20000;
function invalid(message){const error=new Error(message);error.code='INVALID_PDF_REQUEST';throw error;}
function bytes(value){if(!(value instanceof Uint8Array)||!value.length||value.length>MAX_BYTES)invalid('Expected bounded PDF bytes.');return value;}
async function save(output){const value=await output.save({useObjectStreams:false,addDefaultPage:false,updateFieldAppearances:false});if(value.length>MAX_BYTES)invalid('Output PDF exceeds its limit.');return Buffer.from(value);}
async function mergePDFs(inputs){
 if(!Array.isArray(inputs)||!inputs.length||inputs.length>MAX_DOCUMENTS)invalid('Expected 1..128 input PDFs.');
 const output=await PDFDocument.create();let pages=0,total=0;
 for(const input of inputs){const data=bytes(input);total+=data.length;if(total>MAX_BYTES)invalid('Combined input exceeds its limit.');const source=await PDFDocument.load(data,{updateMetadata:false});pages+=source.getPageCount();if(pages>MAX_PAGES)invalid('Too many pages.');for(const page of await output.copyPages(source,source.getPageIndices()))output.addPage(page);}
 return save(output);
}
async function extractPDFPages(input,indices){
 const source=await PDFDocument.load(bytes(input),{updateMetadata:false});
 if(!Array.isArray(indices)||!indices.length||indices.length>MAX_PAGES||new Set(indices).size!==indices.length||indices.some(value=>!Number.isInteger(value)||value<0||value>=source.getPageCount()))invalid('Expected unique in-range zero-based page indices.');
 const output=await PDFDocument.create();for(const page of await output.copyPages(source,indices))output.addPage(page);return save(output);
}
async function splitPDF(input,groups){if(!Array.isArray(groups)||!groups.length||groups.length>MAX_DOCUMENTS)invalid('Expected 1..128 page groups.');const outputs=[];for(const group of groups)outputs.push(await extractPDFPages(input,group));return outputs;}
module.exports={mergePDFs,extractPDFPages,splitPDF};

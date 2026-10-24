'use strict';
// Original standalone primitives extracted from the application vault service.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {fail}=require('./errors.cjs');
const {relativePath}=require('./vault-path.cjs');
const TEXT=new Set(['.md','.markdown','.tex','.py','.js','.ts','.txt','.json','.html','.htm','.csv','.tsv','.ipynb']);
const VIDEO=new Set(['.mp4','.mov','.m4v']);
const MEDIA=new Set(['.pdf','.png','.jpg','.jpeg']);
const MAX_TEXT=4*1024*1024,MAX_NOTEBOOK=128*1024*1024,MAX_BOARD=64*1024*1024,MAX_MEDIA=128*1024*1024,MAX_DOCX=16*1024*1024;
const textLimit=name=>path.extname(name).toLowerCase()==='.ipynb'?MAX_NOTEBOOK:MAX_TEXT;
const digest=data=>crypto.createHash('sha256').update(data).digest('hex');
function kindOf(name){const lower=name.toLowerCase();if(lower.endsWith('.inkspace.json'))return 'board';const ext=path.extname(lower);return VIDEO.has(ext)?'video':TEXT.has(ext)?'text':MEDIA.has(ext)?'media':['.doc','.docx'].includes(ext)?'docx':ext==='.pptx'?'pptx':['.xls','.xlsx','.xlsm'].includes(ext)?'spreadsheet':'unsupported';}
function utf8(data){const bom=data.subarray(0,3).equals(Buffer.from([239,187,191]));let text;try{text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bom?data.subarray(3):data);}catch{fail('INVALID_TEXT');}if(text.includes('\0'))fail('INVALID_TEXT');const crlf=(text.match(/\r\n/g)||[]).length;const lf=(text.match(/(?<!\r)\n/g)||[]).length;return {text,encoding:{bom,newline:crlf?(lf?'mixed':'crlf'):'lf'}};}
async function durableWrite(file,data,mode=0o600){const handle=await fs.open(file,'wx',mode);try{await handle.writeFile(data);await handle.sync();}finally{await handle.close();}}
module.exports={relativePath,kindOf,digest,utf8,durableWrite,MAX_TEXT,MAX_NOTEBOOK,textLimit};

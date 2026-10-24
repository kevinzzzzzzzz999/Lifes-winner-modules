'use strict';
// Exact UTF-8 and exclusive durable-write primitives from the original vault service.
const fs=require('node:fs/promises');
const {fail}=require('./errors.cjs');
function utf8(data){const bom=data.subarray(0,3).equals(Buffer.from([239,187,191]));let text;try{text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bom?data.subarray(3):data);}catch{fail('INVALID_TEXT');}if(text.includes('\0'))fail('INVALID_TEXT');const crlf=(text.match(/\r\n/g)||[]).length;const lf=(text.match(/(?<!\r)\n/g)||[]).length;return {text,encoding:{bom,newline:crlf?(lf?'mixed':'crlf'):'lf'}};}
async function durableWrite(file,data,mode=0o600){const handle=await fs.open(file,'wx',mode);try{await handle.writeFile(data);await handle.sync();}finally{await handle.close();}}
module.exports={utf8,durableWrite};

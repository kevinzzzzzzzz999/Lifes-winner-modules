"use strict";
const {fail}=require('./errors.cjs');
const RENDERER_URL='inkspace-shell-ui://ui/index.html';
function trustedURL(value,rendererURL=RENDERER_URL){try{const url=new URL(value),expected=new URL(rendererURL);return !url.username&&!url.password&&!url.port&&url.protocol===expected.protocol&&url.hostname===expected.hostname&&url.pathname===expected.pathname&&!url.search&&!url.hash;}catch{return false;}}
function validateSender(event,contents,rendererURL=RENDERER_URL){if(event.sender!==contents||event.senderFrame!==contents.mainFrame||!trustedURL(event.senderFrame?.url,rendererURL))fail('PERMISSION_DENIED');}
module.exports={RENDERER_URL,trustedURL,validateSender};

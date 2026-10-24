"use strict";
const {relativePath}=require('./capabilities.cjs');
const {fail}=require('./errors.cjs');
const DEMO_SCHEME='inkspace-shell-demo';
function parseOpenURL(value,{scheme=DEMO_SCHEME}={}){
 if(typeof value!=='string'||value.length>4096)fail('INVALID_REQUEST');let url;try{url=new URL(value);}catch{fail('INVALID_REQUEST');}
 if(url.protocol!==scheme+':'||url.hostname!=='open'||url.username||url.password||url.port||url.hash||!['','/'].includes(url.pathname))fail('INVALID_REQUEST');
 if([...url.searchParams.keys()].some(key=>!['workspace','path'].includes(key))||url.searchParams.getAll('workspace').length!==1||url.searchParams.getAll('path').length!==1)fail('INVALID_REQUEST');
 const vaultId=url.searchParams.get('workspace');if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(vaultId))fail('INVALID_REQUEST');return{vaultId,path:relativePath(url.searchParams.get('path'))};
}
async function routeOpenURL(value,{vaults,windows,external,reveal,createWindow}){const route=parseOpenURL(value);await vaults.resolve(route.vaultId,route.path);const vault=vaults.descriptor(route.vaultId);let context=windows.forVault(vault.id);if(!context)context=createWindow(vault);windows.grant(vault,context);external.deliver(reveal(context),{vault,path:route.path});return{opened:true};}
module.exports={DEMO_SCHEME,parseOpenURL,routeOpenURL};

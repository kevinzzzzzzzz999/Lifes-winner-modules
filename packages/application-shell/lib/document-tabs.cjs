"use strict";
const {fail}=require('./main/errors.cjs');
// Adapted from App.tsx: duplicate tabs focus immediately; late reads cannot
// replace the newest selection; dirty tabs require an explicit close decision.
class DocumentTabs{
 constructor(){this.tabs=[];this.active=null;this.epoch=0;}
 key(vaultId,path){return JSON.stringify([vaultId,path]);}
 async open(vaultId,path,load){const key=this.key(vaultId,path),epoch=++this.epoch;const existing=this.tabs.find(tab=>tab.key===key);if(existing){this.active=key;return{opened:true,existing:true,tab:existing};}const document=await load(vaultId,path);if(epoch!==this.epoch)return{opened:false,superseded:true};const tab={key,vaultId,path,document,dirty:false};this.tabs.push(tab);this.active=key;return{opened:true,existing:false,tab};}
 activate(key){if(!this.tabs.some(tab=>tab.key===key))fail('INVALID_REQUEST');++this.epoch;this.active=key;}
 markDirty(key,dirty=true){const tab=this.tabs.find(tab=>tab.key===key);if(!tab)fail('INVALID_REQUEST');tab.dirty=Boolean(dirty);}
 close(key,{discard=false}={}){const index=this.tabs.findIndex(tab=>tab.key===key);if(index<0)return false;if(this.tabs[index].dirty&&!discard)fail('DIRTY_DOCUMENT');++this.epoch;this.tabs.splice(index,1);if(this.active===key)this.active=this.tabs[Math.min(index,this.tabs.length-1)]?.key||null;return true;}
 dispose(){++this.epoch;this.tabs=[];this.active=null;}
 current(){return this.tabs.find(tab=>tab.key===this.active)||null;}
 quickSwitch(query=''){if(typeof query!=='string'||query.length>256)fail('INVALID_REQUEST');const value=query.toLocaleLowerCase();return this.tabs.filter(tab=>tab.path.toLocaleLowerCase().includes(value)).map(({key,path,vaultId,dirty})=>({key,path,vaultId,dirty}));}
}
// Port of the pure KnowledgeHomeLaunchState in ios/InkSpace/InkSpaceApp.swift.
class HomeLaunchState{
 constructor(){this.showsHome=true;this.hasOpenedWorkspace=false;}
 continueToWorkspace(){this.hasOpenedWorkspace=true;this.showsHome=false;}
 showHome(){this.showsHome=true;}
 receivedExternalNavigation(phase='active'){if(!['active','inactive','background'].includes(phase))fail('INVALID_REQUEST');this.continueToWorkspace();}
 phaseChanged(phase){if(!['active','inactive','background'].includes(phase))fail('INVALID_REQUEST');if(phase==='active'&&!this.hasOpenedWorkspace)this.showsHome=true;}
}
module.exports={DocumentTabs,HomeLaunchState};

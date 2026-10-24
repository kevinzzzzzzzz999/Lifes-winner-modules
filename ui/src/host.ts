import type {DesktopAPI} from './shared/desktop-api';

/** Explicit browser-realm adapter. No window.desktop/inkspace lookup or Electron import. */
export type InkSpaceHostAdapter = Partial<DesktopAPI>;
export type HostCapability = keyof DesktopAPI;
export type HostFailure = {capability:string;message:string};
let adapter: InkSpaceHostAdapter | undefined;
let adapterIdentity: InkSpaceHostAdapter | undefined;
let lastFailure: HostFailure | null = null;
const listeners = new Set<()=>void>();
const unavailable = new Map<string, (...args:unknown[])=>unknown>();
function publish(capability:string) {
 const message = `Life's winner host capability unavailable: ${capability}. Configure this capability explicitly; no full-app fallback is used.`;
 if(lastFailure?.capability!==capability){lastFailure={capability,message};for(const listener of listeners)listener();}
 return {ok:false as const,error:{code:'HOST_CAPABILITY_UNAVAILABLE',message}};
}
/** Call once before mounting. One immutable adapter per JS realm supports multiple vault IDs. */
export function configureInkSpaceHost(value:InkSpaceHostAdapter):void {
 if(!value||typeof value!=='object')throw new TypeError('An explicit host adapter object is required.');
 if(adapterIdentity&&adapterIdentity!==value)throw new Error("The Life's winner host cannot be replaced in this JavaScript realm. Use a new realm for another host.");
 if(adapterIdentity===value)return;
 adapterIdentity=value;
 const bound:Record<string,unknown>={};
 for(const key of Reflect.ownKeys(value)){if(typeof key!=='string')continue;const method=value[key as HostCapability];if(typeof method==='function')bound[key]=method.bind(value);}
 adapter=Object.freeze(bound) as InkSpaceHostAdapter;
 for(const listener of listeners)listener();
}
export function hasInkSpaceHostCapability(key:HostCapability):boolean {return typeof adapter?.[key]==='function';}
export function inkSpaceHostConfigured():boolean {return adapter!==undefined;}
export function getLastHostFailure():HostFailure|null {return lastFailure;}
export function subscribeHostFailures(listener:()=>void):()=>void {listeners.add(listener);return()=>{listeners.delete(listener);};}
export function clearHostFailure():void {lastFailure=null;for(const listener of listeners)listener();}
const proxy=new Proxy({} as DesktopAPI,{get(_target,key){
 if(typeof key!=='string')return undefined;
 const supplied=adapter?.[key as HostCapability];if(typeof supplied==='function')return supplied;
 let fail=unavailable.get(key);if(!fail){fail=(..._args:unknown[])=>{const failure=publish(key);return key.startsWith('on')?()=>{}:Promise.resolve(failure);};unavailable.set(key,fail);}
 return fail;
}});
/** Internal accessor shared by copied UI helpers. Missing calls report explicit failure, never data. */
export function getInkSpaceHost():DesktopAPI {return proxy;}
export type {DesktopAPI,ApiResult} from './shared/desktop-api';

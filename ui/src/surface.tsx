import {Component,useSyncExternalStore,type ComponentType,type ReactNode} from 'react';
import {clearHostFailure,getLastHostFailure,hasInkSpaceHostCapability,inkSpaceHostConfigured,subscribeHostFailures,type HostCapability} from './host';
export class SurfaceErrorBoundary extends Component<{children:ReactNode;name:string},{error:string|null}>{
 state:{error:string|null}={error:null};
 static getDerivedStateFromError(error:unknown){return{error:error instanceof Error?error.message:String(error)}}
 render(){return this.state.error?<div role="alert" data-inkspace-ui-error="render">{this.props.name} could not render: {this.state.error}</div>:this.props.children;}
}
function HostFailureBanner(){const failure=useSyncExternalStore(subscribeHostFailures,getLastHostFailure,()=>null);return failure?<div className="inkspace-ui-host-error" role="alert" data-inkspace-host-error={failure.capability}>{failure.message}<button onClick={clearHostFailure}>Dismiss</button></div>:null;}
/** requirements are checked before mounting the original component, so missing hosts are never mocked. */
export function surface<P extends object>(Original:ComponentType<P>,name:string,requirements:readonly HostCapability[]=[],requiresHost=false):ComponentType<P>{
 function InkSpaceSurface(props:P){
  useSyncExternalStore(subscribeHostFailures,inkSpaceHostConfigured,()=>false);
  const missing=requirements.filter(key=>!hasInkSpaceHostCapability(key));
  const blocked=requiresHost&&!inkSpaceHostConfigured()||missing.length>0;
  return <section className="inkspace-ui" data-inkspace-module={name}>
   {blocked?<div className="inkspace-ui-host-error" role="alert" data-inkspace-host-error="configuration">{name}: host adapter not configured or missing required capabilities: {missing.join(', ')||'explicit host adapter'}. No full-app fallback or sample data is used.</div>:<SurfaceErrorBoundary name={name}><HostFailureBanner/><Original {...props}/></SurfaceErrorBoundary>}
  </section>;
 }
 InkSpaceSurface.displayName=`InkSpace(${name})`;return InkSpaceSurface;
}

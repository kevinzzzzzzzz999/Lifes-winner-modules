# Explicit UI host contract

The library never reads `window.desktop` or `window.inkspace`, and it does not import Electron IPC, the complete app entry, or its private file grants. Source references were replaced by the module accessor in `src/host.ts`.

## Configure explicitly

Call `configureInkSpaceHost(adapter)` **before mounting hosted surfaces**. `InkSpaceHostAdapter` is a partial, typed set of the methods in `DesktopAPI`; see `src/shared/desktop-api.ts` and the generated declarations. Supply plain object methods that delegate only to capabilities your application intentionally grants.

```ts
import {configureInkSpaceHost, type InkSpaceHostAdapter} from '@inkspace/ui/host';

const adapter: InkSpaceHostAdapter = {
  listDirectory: request => yourAuthorizedStorage.listDirectory(request),
  getFolderOrder: request => yourAuthorizedStorage.getFolderOrder(request),
  setFolderOrder: request => yourAuthorizedStorage.setFolderOrder(request),
};
configureInkSpaceHost(adapter);
```

This configures one immutable adapter per JavaScript realm. It supports multiple workspace IDs through request arguments. It is not a per-component context provider; replacing the adapter is rejected to prevent mounted or asynchronous components from being redirected to another host. Use another realm if you need unrelated host implementations.

## Return and subscription shapes

Async methods return `Promise<{ok:true,value:T} | {ok:false,error:{code:string,message:string}}>` according to the exact method signature. Never resolve a save with success until your persistence and expected-digest checks have actually completed. A declined picker returns the method's specified cancellation value, not a fabricated saved file.

`on...` methods subscribe a callback and synchronously return an unsubscribe function. Dispose subscriptions on component unmount. Emit only actual changes from your storage/runtime. Workspace IDs and relative source paths are inputs to authorized host methods, not permission grants created by the UI.

The copied helpers retain original formats, expected-SHA guards, read/write coordination and cancellation assumptions. Implementing an HTTP or file adapter requires maintaining these guarantees; merely returning a matching object does not make storage safe.

## Missing abilities fail visibly

Each hosted surface checks its initial required capabilities before mounting. Missing configuration renders an alert stating that no full-app fallback or sample data is used. Additional operations with an unimplemented method publish a visible host-failure banner and return `HOST_CAPABILITY_UNAVAILABLE`. A missing event subscription reports the same failure and installs no subscription. It never supplies fabricated records, runtime results, keys or saved files.

Prop-driven surfaces can render without host configuration. If a file/attachment/external operation is requested later, it follows the same explicit-failure behavior. Rendering a text-only graph does not prove attachment rendering or file persistence.

## Capability families

- Files/planning: `listDirectory`, `readFile`, `createTextFile`, `saveText`, `onVaultChange`, optional calendar import/export/reminders and trash/move operations.
- Board/PDF: resource URLs, source identity, board/text mutations, layers/reviews, PDF extension records, excerpt and export capabilities.
- Notebook: runtime information, file/data inspection and caller-provided run/interrupt/restart/save callbacks. Python remains outside the UI.
- Media: preview leases and release, actual source URLs, export job events, cancellation and persistent project operations. FFmpeg/AVFoundation remains outside the UI.
- OCR/translation: actual availability and user-selected provider/runtime, cancellation and separately authorized saving. No shared API keys or automatic AI submission are supplied.

The smoke adapter is an isolated synthetic fixture in `smoke/main.tsx`, not a production backend. Its file writes really modify its own in-memory store with digest checks; unavailable Python, FFmpeg, OCR, AI and file pickers are reported unavailable. None of those unavailable services are claimed to execute during smoke validation.

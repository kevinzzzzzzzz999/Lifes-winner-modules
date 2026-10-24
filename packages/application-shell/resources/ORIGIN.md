# Source mapping / 原始源码映射

Original paths below are relative to the public full application repository. They contain no local development paths. The three small original main-process modules are also included verbatim under `sources/main/` for comparison. Adapted runnable code is under `lib/` and `examples/electron/`.

| Original file | SHA-256 | Extracted behavior and changes |
|---|---|---|
| `desktop/src/main/window-contexts.cjs` | `6b043d478e35d2427376ada7c8bb054831d986afe2b8954193e8514eafdb8650` | WindowContexts, ScopedIPCRouter: AsyncLocalStorage origin, exact sender grants, per-window services/disposal; renderer URL is parameterized and App-only service fields removed. |
| `desktop/src/main/external-document-open.cjs` | `2c1654a44ba8d92db5d9bd4a9b25b9d903b6c3497bcd0648a3512ed8dbe7e81b` | ExternalDocumentOpen, selectDocument, inspectDocument, fileWithin: Early OS-open queue, per-window ready/ack mailboxes, matching workspace/new-window routing. Recent-folder persistence removed; a file selection grants only the selected file. |
| `desktop/src/main/document-menu.cjs` | `d482bc4dbf523ce33f1a2cb8e9958db7374989f3c45b48800bbd50822f628883` | installDocumentMenu: Native document/folder accelerators and preserving existing menus; identifiers receive a standalone prefix. |
| `desktop/src/main/main.cjs` | `a3a28b245eb87573c09ec9a5539947473f73906d594c00e8759c79748eed05a1` | createWindow, handler, open-file, second-instance, activate: Standalone example adapts the real lifecycle and sender-validated IPC pattern, internal asset protocol and restrictive BrowserWindow settings. Domain services are explicit host integration points. |
| `desktop/src/preload/preload.cjs` | `be24f225763dc2c5b71e7be07a78284c4b3007a526fa066b3e4dd64ee742b570` | invoke, externalOpenRequests, acknowledgeExternalOpen, moveExternalOpenToNewWindow: Explicit capability bridge; no generic ipcRenderer, arbitrary command or original domain API exported. |
| `desktop/src/renderer/App.tsx` | `da7c93025343dfb09d4564aa0406487046f35428e42c3b2277852e233d2f7c89` | open, external request pump, quick switch: DocumentTabs adapts duplicate-focus and request-epoch semantics. Demo uses a plain read-only preview, not the original advanced editor. |
| `ios/InkSpace/InkSpaceApp.swift` | `01b30fd3fa59e8f73a89623e0d7bfeba4abe9b42337d1afa46f2852a7a67e193` | KnowledgeHomeLaunchState, WorkspaceSceneRoot: HomeLaunchState ports the pure route transitions. It does not claim to be a native SwiftUI scene implementation. |

The small capability store is a new host adapter for the extracted window/open-request core. It replaces the original full VaultService dependency with selected-file or selected-folder read-only grants. The demo UI, bounded plain-text preview and E2E test are new integration examples. / 新增权限适配器代替原大型 VaultService，示例界面与真实进程测试为独立接入示例。

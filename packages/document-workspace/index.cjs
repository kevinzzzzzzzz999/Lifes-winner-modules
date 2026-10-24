'use strict';
// Standalone package: no imports from the complete application.
module.exports={
 "links":require("./lib/shared/internal-file-links.cjs"),
 "tree":require("./lib/renderer/file-tree-management.cjs"),
 "kinds":require("./lib/renderer/workspace-file-kinds.cjs"),
 "tabs":require("./lib/renderer/external-open-tabs.cjs"),
 "autosave":require("./lib/renderer/autosave-tabs.cjs"),
 "zoom":require("./lib/renderer/document-zoom.cjs"),
 "workspace":require("./lib/renderer/PDFWorkspaceState.cjs"),
 "pagePreviews":require("./lib/renderer/BoardPagePreviews.cjs"),
 "shortcuts":require("./lib/renderer/app-shortcuts.cjs"),
 "menus":require("./lib/main/document-menu.cjs"),
 "contextMenu":require("./lib/main/editable-context-menu.cjs"),
 "richText":require("./lib/renderer/clipboard-rich-text.cjs"),
 "math":require("./lib/renderer/rich-text-math.cjs"),
 "exportView":require("./lib/renderer/export-view.cjs"),
 "externalOpen":require("./lib/main/external-document-open.cjs"),
 "preparationDeadline":require("./lib/renderer/office-preparation-deadline.cjs")
};

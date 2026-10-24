'use strict';
// Standalone package: no imports from the complete application.
module.exports={
 "urls":require("./lib/main/browser-security.cjs"),
 "routing":require("./lib/main/browser-link-routing.cjs"),
 "sessions":require("./lib/main/browser-state.cjs"),
 "web":require("./lib/main/board-web-url.cjs"),
 "network":require("./lib/main/board-web-network.cjs"),
 "providers":require("./lib/main/ai-web-providers.cjs"),
 "pageHealth":require("./lib/main/ai-page-health.cjs"),
 "downloads":require("./lib/main/ai-downloads.cjs"),
 "mediaPermissions":require("./lib/main/ai-media-permissions.cjs"),
 "images":require("./lib/main/ai-image-transfer.cjs"),
 "extensions":require("./lib/main/browser-extensions.cjs")
};

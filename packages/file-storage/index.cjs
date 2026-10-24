'use strict';
// Standalone package: no imports from the complete application.
module.exports={
 "paths":require("./lib/main/vault-path.cjs"),
 "storage":require("./lib/main/vault-service.cjs"),
 "streams":require("./lib/main/exchange-stream.cjs"),
 "identity":require("./lib/main/exchange-file-identity.cjs"),
 "exports":require("./lib/main/source-file-export.cjs"),
 "recent":require("./lib/main/recent-vaults.cjs"),
 "diagnostics":require("./lib/main/diagnostics.cjs"),
 "actions":require("./lib/main/file-context-actions.cjs"),
 "watchLifecycle":require("./lib/main/vault-watch-lifecycle.cjs"),
 "fileManagement":require("./lib/main/vault-file-management.cjs"),
 "watch":require("./lib/main/vault-watch.cjs")
};

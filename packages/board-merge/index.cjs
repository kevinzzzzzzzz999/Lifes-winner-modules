'use strict';
// Standalone package: no imports from the complete application.
module.exports={
 "merge":require("./lib/main/board-merge.cjs"),
 "history":require("./lib/main/board-history-service.cjs"),
 "sessions":require("./lib/renderer/board-merge-tabs.cjs"),
 "childSession":require("./lib/renderer/child-board-session.cjs")
};

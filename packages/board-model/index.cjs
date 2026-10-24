'use strict';
// Standalone package: no imports from the complete application.
module.exports={
 "json":require("./lib/main/board-json.cjs"),
 "validation":require("./lib/main/board-validation.cjs"),
 "elements":require("./lib/main/board-elements.cjs"),
 "navigation":require("./lib/main/board-navigation.cjs"),
 "childLinks":require("./lib/main/board-child-links.cjs"),
 "webURLs":require("./lib/main/board-web-url.cjs"),
 "operations":require("./lib/main/board-operations.cjs"),
 "paste":require("./lib/main/board-paste.cjs"),
 "fileCards":require("./lib/main/board-file-cards.cjs"),
 "sourceResolver":require("./lib/main/board-source-resolver.cjs")
};

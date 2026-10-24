'use strict';
// Standalone package: no imports from the complete application.
module.exports={
 "workbooks":require("./lib/main/notebook-data.cjs"),
 "delimited":require("./lib/renderer/data-file-parsers.cjs"),
 "format":require("./lib/shared/notebook-format.cjs"),
 "actions":require("./lib/renderer/notebook-actions.cjs"),
 "outline":require("./lib/renderer/notebook-outline.cjs"),
 "html":require("./lib/renderer/notebook-html-format.cjs"),
 "sessions":require("./lib/renderer/notebook-session.cjs"),
 "events":require("./lib/renderer/notebook-events.cjs")
};

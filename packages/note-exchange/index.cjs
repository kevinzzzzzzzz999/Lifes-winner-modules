'use strict';
// Standalone package: no imports from the complete application.
module.exports={
 "exchange":require("./lib/main/note-exchange.cjs"),
 "outline":require("./lib/main/note-outline.cjs"),
 "archives":require("./lib/main/boardnotes-zip.cjs"),
 "objects":require("./lib/main/boardnotes-objects.cjs"),
 "format":require("./lib/main/boardnotes-format.cjs")
};

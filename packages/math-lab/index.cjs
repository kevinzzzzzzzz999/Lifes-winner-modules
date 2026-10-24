'use strict';
// Standalone package: no imports from the complete application.
module.exports={
 "engine":require("./lib/math-lab/engine.js"),
 "simple":require("./lib/math-lab/simple-core.js"),
 "mathExport":require("./lib/main/math-export.cjs")
};

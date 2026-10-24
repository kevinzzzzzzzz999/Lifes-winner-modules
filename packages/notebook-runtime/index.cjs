'use strict';
// Standalone package: no imports from the complete application.
module.exports={
 "notebooks":require("./lib/main/notebook-service.cjs"),
 "python":require("./lib/main/python-service.cjs"),
 "runController":require("./lib/renderer/notebook-run-controller.cjs")
};

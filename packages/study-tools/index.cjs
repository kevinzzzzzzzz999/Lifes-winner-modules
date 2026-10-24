'use strict';
// Standalone package: no imports from the complete application.
module.exports={
 "model":require("./lib/main/study-model.cjs"),
 "store":require("./lib/main/study-service.cjs"),
 "transferModel":require("./lib/main/study-transfer-model.cjs"),
 "transfer":require("./lib/main/study-transfer-service.cjs"),
 "reviews":require("./lib/main/review-service.cjs"),
 "outline":require("./lib/renderer/study-outline.cjs")
};

'use strict';
// Standalone package: no imports from the complete application.
module.exports={
 "service":require("./lib/main/local-ocr-service.cjs"),
 "images":require("./lib/main/image-import.cjs"),
 "capture":require("./lib/renderer/ocr-capture.cjs")
};

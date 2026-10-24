'use strict';
// Standalone package: no imports from the complete application.
module.exports={
 "layers":require("./lib/main/pdf-layer-service.cjs"),
 "nativeInk":require("./lib/main/pdf-native-ink.cjs"),
 "extensionModel":require("./lib/main/pdf-extend-model.cjs"),
 "extensionStore":require("./lib/main/pdf-extend-service.cjs")
};

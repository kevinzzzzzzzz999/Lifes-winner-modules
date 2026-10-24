'use strict';
// Standalone package: no imports from the complete application.
module.exports={
 "links":require("./lib/main/knowledge-service.cjs"),
 "palace":require("./lib/renderer/knowledge-palace-math.cjs"),
 "metadata":require("./lib/renderer/knowledge-space-metadata.cjs"),
 "walkMath":require("./lib/renderer/knowledge-walk-math.cjs"),
 "walkRenderer":require("./lib/renderer/knowledge-walk-renderer.cjs"),
 "walkGL":require("./lib/renderer/knowledge-walk-gl.cjs")
};

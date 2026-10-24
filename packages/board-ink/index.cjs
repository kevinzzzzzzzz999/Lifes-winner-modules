'use strict';
// Standalone package: no imports from the complete application.
module.exports={
 "placement":require("./lib/renderer/board-merge-placement.cjs"),
 "clip":require("./lib/renderer/board-ink-clip.cjs"),
 "paint":require("./lib/renderer/board-ink-paint.cjs"),
 "exportInk":require("./lib/renderer/board-export-ink.cjs"),
 "replay":require("./lib/renderer/ink-replay.cjs"),
 "replayCamera":require("./lib/renderer/ink-replay-camera.cjs"),
 "replayPaint":require("./lib/renderer/replay-paint.cjs"),
 "replayDisplay":require("./lib/renderer/replay-display.cjs"),
 "pdfResolution":require("./lib/renderer/board-pdf-resolution.cjs"),
 "pdfProgressive":require("./lib/renderer/board-pdf-progressive.cjs"),
 "childModel":require("./lib/renderer/child-board-model.cjs")
};

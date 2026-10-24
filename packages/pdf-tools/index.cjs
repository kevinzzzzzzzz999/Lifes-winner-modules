'use strict';
// Standalone package: no imports from the complete application.
module.exports={
 "preview":require("./lib/main/board-pdf-preview.cjs"),
 "oneNote":require("./lib/main/onenote-pdf.cjs"),
 "geometry":require("./lib/main/onenote-geometry-guard.cjs"),
 "hd":require("./lib/main/onenote-hd.cjs"),
 "zoom":require("./lib/renderer/pdf-reader-zoom.cjs"),
 "capture":require("./lib/renderer/pdf-selection-capture.cjs"),
 "browserLinks":require("./lib/renderer/browser-pdf-links.cjs"),
 "translationExport":require("./lib/main/pdf-translation-export.cjs")
};
Object.assign(module.exports,require('./lib/pdf-documents.cjs'));

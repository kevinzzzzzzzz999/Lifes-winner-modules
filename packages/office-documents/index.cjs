'use strict';
// Standalone package: no imports from the complete application.
module.exports={
 "model":require("./lib/main/editable-document-model.cjs"),
 "office":require("./lib/main/editable-office.cjs"),
 "docxPreview":require("./lib/main/docx-preview.cjs"),
 "images":require("./lib/main/office-embedded-images.cjs"),
 "legacyDoc":require("./lib/main/legacy-doc-preview.cjs"),
 "tex":require("./lib/main/tex-service.cjs"),
 "noteExtraction":require("./lib/main/note-extraction.cjs"),
 "pdf":require("./lib/main/document-pdf.cjs")
};

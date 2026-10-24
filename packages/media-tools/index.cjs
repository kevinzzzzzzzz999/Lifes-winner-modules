'use strict';
// Standalone package: no imports from the complete application.
module.exports={
 "format":require("./lib/main/media-editor-format.cjs"),
 "compose":require("./lib/main/media-editor-compose.cjs"),
 "captions":require("./lib/main/media-editor-captions.cjs"),
 "subtitleFormat":require("./lib/main/subtitle-format-validation.cjs"),
 "subtitles":require("./lib/main/video-subtitles.cjs"),
 "video":require("./lib/main/video-service.cjs"),
 "controls":require("./lib/renderer/video-controls.cjs"),
 "subtitlePersistence":require("./lib/renderer/video-subtitle-persistence.cjs"),
 "editorModel":require("./lib/renderer/media-editor-model.cjs")
};

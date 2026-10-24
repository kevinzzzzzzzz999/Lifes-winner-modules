Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region open-source/inkspace/desktop/src/renderer/app-shortcuts.ts
const plain = (event, key) => !event.defaultPrevented && !event.isComposing && event.keyCode !== 229 && !event.altKey && !event.shiftKey && !event.repeat && event.key.toLowerCase() === key;
const isSaveShortcut = (event) => plain(event, "s") && event.metaKey !== event.ctrlKey;
const isQuickOpenShortcut = (event, platform) => plain(event, "k") && (/Mac|iPhone|iPad/i.test(platform) ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey);
//#endregion
exports.isQuickOpenShortcut = isQuickOpenShortcut;
exports.isSaveShortcut = isSaveShortcut;

Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let open_source_inkspace_desktop_src_renderer_course_checklist = require("./course-checklist.cjs");
//#region open-source/inkspace/desktop/src/renderer/checklist-location.ts
/** Navigation context is not a storage choice. Explicit file links keep their original identity. */
function initialChecklistLocation(_contextFolder = "", explicitPath) {
	const path = explicitPath ?? open_source_inkspace_desktop_src_renderer_course_checklist.CHECKLIST_FILENAME;
	const parts = path.split("/");
	return {
		folder: parts.slice(0, -1).join("/"),
		name: parts.at(-1),
		path
	};
}
/** Creating a new list must never inherit a browsed course/week folder. Existing-file saves are separate. */
function checklistCreationLocation(folder, name = open_source_inkspace_desktop_src_renderer_course_checklist.CHECKLIST_FILENAME) {
	if (folder) throw new Error("新清单只能保存在资料库主文件夹；旧清单仍可在原位置编辑。 / New checklists belong in the library’s main folder; existing lists can still be edited in place.");
	return {
		parentPath: "",
		name
	};
}
//#endregion
exports.checklistCreationLocation = checklistCreationLocation;
exports.initialChecklistLocation = initialChecklistLocation;

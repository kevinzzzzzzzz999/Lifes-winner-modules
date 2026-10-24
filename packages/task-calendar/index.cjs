'use strict';
// Standalone package: no imports from the complete application.
module.exports={
 "calendar":require("./lib/renderer/calendar-model.cjs"),
 "ics":require("./lib/renderer/calendar-ics.cjs"),
 "checklists":require("./lib/renderer/course-checklist.cjs"),
 "checklistLocations":require("./lib/renderer/checklist-location.cjs"),
 "quickNotes":require("./lib/renderer/quick-notes.cjs"),
 "courseCalendar":require("./lib/renderer/course-calendar.cjs"),
 "calendarStore":require("./lib/renderer/calendar-store.cjs"),
 "calendarFiles":require("./lib/main/calendar-service.cjs")
};

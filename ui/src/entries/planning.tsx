import '../foundation.css';
import Notes from '../renderer/QuickNotes';import Checklist from '../renderer/CourseChecklist';import CalendarView from '../renderer/Calendar';import {surface} from '../surface';
export const QuickNotes=surface(Notes,'quick-notes',['readFile','createTextFile','saveText','onVaultChange'],true);
export const CourseChecklist=surface(Checklist,'course-checklist',['readFile','listDirectory','createTextFile','saveText','onVaultChange'],true);
export const Calendar=surface(CalendarView,'calendar',['readCalendarFile','readFile','listDirectory','createTextFile','saveText','onVaultChange'],true);

import '../foundation.css';
import OCR from '../renderer/LocalOCRDialog';import Exchange from '../renderer/NoteExchange';import Management from '../renderer/FileManagementDialog';import Translation from '../renderer/TranslationSettings';import Calculator from '../renderer/MathWorkbench';import {surface} from '../surface';
export const LocalOCR=surface(OCR,'local-ocr',['localOCRInfo','recognizeLocalOCR','cancelLocalOCR'],true);
export const NoteExchange=surface(Exchange,'note-exchange',['listDirectory','importNoteExchange','exportNoteExchange'],true);
export const FileManagement=surface(Management,'file-management',['listDirectory'],true);
export const TranslationSettings=surface(Translation,'translation-settings',['translationInfo'],true);
export const MathWorkbench=surface(Calculator,'math-workbench');

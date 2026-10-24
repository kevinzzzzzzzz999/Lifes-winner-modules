import '../foundation.css';
import Preview,{Formula} from '../renderer/DocumentPreview';import {CsvPreview as Table,HtmlPreview as Html} from '../renderer/DataFilePreview';import Standalone from '../renderer/StandaloneDocumentEditor';
import {surface} from '../surface';
import MarginPanel from '../renderer/MarginPanel';
export const DocumentPreview=surface(Preview,'document-preview');
export const FormulaView=surface(Formula,'formula');
export const CsvPreview=surface(Table,'csv-preview');
export const HtmlPreview=surface(Html,'html-preview');
export const StructuredDocumentEditor=surface(Standalone,'structured-document-editor');
/** Document margin editor; storage, image picking and placement are caller callbacks. */
export const MarginNotes=surface(MarginPanel,'margin-notes');

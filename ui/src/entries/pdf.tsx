import '../foundation.css';
import Reader,{PDFPage as Page} from '../renderer/PDFViewer';import {surface} from '../surface';
export const PDFPage=surface(Page,'pdf-page');
export const PDFReader=surface(Reader,'pdf-reader',['translationInfo'],true);
export type {PDFReaderState} from '../renderer/PDFViewer';

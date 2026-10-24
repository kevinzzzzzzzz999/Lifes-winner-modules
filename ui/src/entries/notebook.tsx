import '../foundation.css';
import Notebook from '../renderer/NotebookEditor';import {surface} from '../surface';
export const NotebookEditor=surface(Notebook,'notebook-editor',['notebookInfo'],true);
export type {NotebookEditorSession} from '../renderer/notebook-session';

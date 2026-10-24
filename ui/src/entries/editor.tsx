import '../foundation.css';
import Editor from '../renderer/EditorPane';
import TextBox from '../renderer/TextBoxEditor';
import {surface} from '../surface';
export const CodeEditor=surface(Editor,'code-editor');
export const TextBoxEditor=surface(TextBox,'text-box');
export type CodeEditorProps=React.ComponentProps<typeof Editor>;

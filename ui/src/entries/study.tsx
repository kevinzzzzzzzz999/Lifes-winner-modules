import '../foundation.css';
import Study from '../renderer/StudyPanel';import Reviews from '../renderer/ReviewPanel';import {surface} from '../surface';
export const StudyPanel=surface(Study,'study-panel',['readStudy','appendStudy','onVaultChange'],true);
export const ReviewPanel=surface(Reviews,'review-panel');

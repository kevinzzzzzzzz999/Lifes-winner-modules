import '../foundation.css';
import Editor from '../renderer/MediaEditor';import Video from '../renderer/VideoPlayer';import {surface} from '../surface';
export const MediaEditor=surface(Editor,'media-editor',['mediaEditorInfo','onMediaEditorEvent'],true);
export const VideoPlayer=surface(Video,'video-player',['getVideoUrl','releaseVideoUrl','getVideoSubtitles','saveVideoSubtitles'],true);

import '../foundation.css';
import Board from '../renderer/BoardViewer';import Replay from '../renderer/InkReplayDialog';import {surface} from '../surface';
export const BoardViewer=surface(Board,'board-viewer',['getAssetUrl'],true);
export const InkReplay=surface(Replay,'ink-replay',['getAssetUrl'],true);
export type {BoardViewerProps} from '../renderer/BoardViewer';

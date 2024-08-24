import {ICue} from './cue';

export interface ISegment {
  duration: number;
  cues: ICue[];
}

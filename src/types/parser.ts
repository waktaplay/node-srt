/* eslint-disable @typescript-eslint/no-explicit-any */

import {IParsedCue} from './cue';
import {ParserError} from './exceptions/parser';

export interface IBaseParsedObject {
  valid: boolean;
  cues: IParsedCue[];
}

export interface IParsedObject extends IBaseParsedObject {
  strict: boolean;
  errors: (ParserError | any)[];
}

export interface IParsedCueObject {
  cues: IParsedCue[];
  errors: (ParserError | any)[];
}

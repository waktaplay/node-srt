/* eslint-disable @typescript-eslint/no-explicit-any */

import {ICue} from './cue';
import {ParserError} from './exceptions/parser';

export interface IBaseParsedObject {
  valid: boolean;
  cues: ICue[];
}

export interface IParsedObject extends IBaseParsedObject {
  strict: boolean;
  errors: (ParserError | any)[];
}

export interface IParsedCueObject {
  cues: ICue[];
  errors: (ParserError | any)[];
}

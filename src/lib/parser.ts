'use strict';

import {ICue} from '../types/cue';
import {ParserError} from '../types/exceptions/parser';
import {IParsedCueObject, IParsedObject} from '../types/parser';

/**
 * See spec: https://www.w3.org/TR/webvtt1/#file-structure
 */

const TIMESTAMP_REGEXP = /([0-9]{1,2})?:?([0-9]{2}):([0-9]{2}\.[0-9]{2,3})/;

export function parse(
  input: string,
  {strict}: {strict?: boolean} = {}
): IParsedObject {
  if (strict === undefined) strict = true;

  input = input.trim();
  input = input.replace(/\r\n/g, '\n');
  input = input.replace(/\r/g, '\n');

  const parts = input.split('\n\n');

  // nothing of interests, return early
  if (parts.length === 0 || input === '') {
    return {valid: true, strict, cues: [], errors: []};
  }

  const {cues, errors} = parseCues(parts, strict);

  if (strict && errors.length > 0) {
    throw errors[0];
  }

  return {valid: errors.length === 0, strict, cues, errors};
}

function parseCues(cues: string[], strict = true): IParsedCueObject {
  const errors: (ParserError | unknown)[] = [];

  const parsedCues = cues
    .map((cue, i) => {
      try {
        return parseCue(cue, i, strict);
      } catch (e: ParserError | unknown) {
        errors.push(e);
        return null;
      }
    })
    .filter(x => !!x) as ICue[];

  return {
    cues: parsedCues,
    errors,
  };
}

/**
 * Parse a single cue block.
 *
 * @param {string} cue A single content for the cue
 * @param {number} i Index of cue in array
 *
 * @returns {object} cue Cue object with start, end, text and styles.
 *                       Null if it's a note
 */
function parseCue(cue: string, i: number, strict: boolean): ICue | null {
  let identifier = '';

  let start = 0;
  let end = 0.01;

  let text = '';
  let styles = '';

  // split and remove empty lines
  const lines = cue.split('\n').filter(x => x !== '');

  if (lines.length > 0 && lines[0].trim().startsWith('NOTE')) return null;

  if (lines.length === 1 && !lines[0].includes('-->')) {
    throw new ParserError(`Cue identifier cannot be standalone (cue #${i})`);
  }

  if (
    lines.length > 1 &&
    !(lines[0].includes('-->') || lines[1].includes('-->'))
  ) {
    throw new ParserError(
      `Cue identifier needs to be followed by timestamp (cue #${i})`
    );
  }

  if (lines.length > 1 && lines[1].includes('-->')) {
    identifier = lines.shift() ?? '';
  }

  const times = typeof lines[0] === 'string' ? lines[0].split(' --> ') : [];

  if (
    times.length !== 2 ||
    !validTimestamp(times[0]) ||
    !validTimestamp(times[1])
  ) {
    console.log('times', times);
    console.log('lines', lines);
    throw new ParserError(`Invalid cue timestamp (cue #${i})`);
  }

  start = parseTimestamp(times[0]);
  end = parseTimestamp(times[1]);

  if (strict) {
    if (start > end) {
      throw new ParserError(`Start timestamp greater than end (cue #${i})`);
    }

    if (end <= start) {
      throw new ParserError(`End must be greater than start (cue #${i})`);
    }
  }

  if (!strict && end < start) {
    throw new ParserError(
      `End must be greater or equal to start when not strict (cue #${i})`
    );
  }

  // TODO better style validation
  styles = times[1].replace(TIMESTAMP_REGEXP, '').trim();

  lines.shift();

  text = lines.join('\n');

  if (!text) return null;
  return {identifier, start, end, text, styles};
}

function validTimestamp(timestamp: string): boolean {
  return TIMESTAMP_REGEXP.test(timestamp);
}

function parseTimestamp(timestamp: string): number {
  const matches = timestamp.match(TIMESTAMP_REGEXP);

  let secs = parseFloat(matches?.[1] || '0') * 60 * 60; // hours
  secs += parseFloat(matches?.[2] || '0') * 60; // mins
  secs += parseFloat(matches?.[3] || '0'); // secs
  // secs += parseFloat(matches?.[4] || '0'); // ms
  return secs;
}

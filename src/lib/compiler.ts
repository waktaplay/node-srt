'use strict';

import type {ICue} from '../types/cue';
import type {IBaseParsedObject} from '../types/parser';

import {CompilerError} from '../types/exceptions/compiler';

/**
 * See spec: https://www.w3.org/TR/webvtt1/#file-structure
 */

export function compile(input: IBaseParsedObject): string {
  if (!input.valid) {
    throw new CompilerError('Input must be valid');
  }

  if (input && (!input.cues || input.cues.length < 1)) {
    return '';
  }

  let output = '';

  let lastTime: number | null = null;

  input.cues.forEach((cue, index) => {
    if (lastTime && lastTime > parseFloat(cue.start.toString())) {
      throw new CompilerError(
        `Cue number ${index} is not in chronological order`
      );
    }

    lastTime = parseFloat(cue.start.toString());

    output += compileCue(cue);
    output += '\n\n';
  });

  return output.slice(0, -1);
}

/**
 * Compile a single cue block.
 *
 * @param {array} cue Array of content for the cue
 *
 * @returns {object} cue Cue object with start, end, text and styles.
 *                       Null if it's a note
 */
function compileCue(cue: ICue): string {
  if (isNaN(Number(cue.start))) {
    throw new CompilerError(`Cue malformed: null start value.
    ${JSON.stringify(cue)}`);
  }

  if (isNaN(Number(cue.end))) {
    throw new CompilerError(`Cue malformed: null end value.
    ${JSON.stringify(cue)}`);
  }

  if (cue.start >= cue.end) {
    throw new CompilerError(`Cue malformed: start timestamp greater than end
    ${JSON.stringify(cue)}`);
  }

  let output = '';

  if (cue.identifier !== null && cue.identifier.toString().length > 0) {
    output += `${cue.identifier}\n`;
  }

  const startTimestamp = convertTimestamp(Number(cue.start));
  const endTimestamp = convertTimestamp(Number(cue.end));

  output += `${startTimestamp} --> ${endTimestamp}`;
  output += cue.styles ? ` ${cue.styles}` : '';
  output += `\n${cue.text}`;

  return output;
}

function convertTimestamp(time: number): string {
  const hours = calculateHours(time).toString().padStart(2, '0');
  const minutes = calculateMinutes(time).toString().padStart(2, '0');
  const seconds = calculateSeconds(time).toString().padStart(2, '0');
  const milliseconds = calculateMs(time).toString().padStart(3, '0');

  return `${hours}:${minutes}:${seconds},${milliseconds}`;
}

function calculateHours(time: number): number {
  return Math.floor(time / 60 / 60);
}

function calculateMinutes(time: number): number {
  return Math.floor(time / 60) % 60;
}

function calculateSeconds(time: number): number {
  return Math.floor(time % 60);
}

function calculateMs(time: number): number {
  return Math.floor((Math.round((time % 1) * 10000) / 10000) * 1000);
}

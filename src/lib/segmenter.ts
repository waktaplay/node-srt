'use strict';

import {ICue} from '../types/cue';
import {ISegment} from '../types/segmenter';
import {parse} from './parser';

export function segment(input: string, segmentLength = 10): ISegment[] {
  const parsed = parse(input);
  const segments: {duration: number; cues: ICue[]}[] = [];

  let cues: ICue[] = [];
  let queuedCue: ICue | null = null;
  let currentSegmentDuration = 0;
  let totalSegmentsDuration = 0;

  /**
   * One pass segmenting of cues
   */
  parsed.cues.forEach((cue, i) => {
    const firstCue = i === 0;
    const lastCue = i === parsed.cues.length - 1;

    const start = Number(cue.start);
    const end = Number(cue.end);

    const nextStart = lastCue ? Infinity : Number(parsed.cues[i + 1].start);
    const cueLength = firstCue ? end : end - start;
    const silence = firstCue ? 0 : start - Number(parsed.cues[i - 1].end);

    currentSegmentDuration = currentSegmentDuration + cueLength + silence;

    debug('------------');
    debug(`Cue #${i}, segment #${segments.length + 1}`);
    debug(`Start ${start}`);
    debug(`End ${end}`);
    debug(`Length ${cueLength}`);
    debug(`Total segment duration = ${totalSegmentsDuration}`);
    debug(`Current segment duration = ${currentSegmentDuration}`);
    debug(`Start of next = ${nextStart}`);

    // if there's a boundary cue queued, push and clear queue
    if (queuedCue) {
      cues.push(queuedCue);
      currentSegmentDuration += Number(queuedCue.end) - totalSegmentsDuration;
      queuedCue = null;
    }

    cues.push(cue);

    // if a cue passes a segment boundary, it appears in both
    let shouldQueue =
      nextStart - end < segmentLength &&
      silence < segmentLength &&
      currentSegmentDuration > segmentLength;

    if (
      shouldSegment(totalSegmentsDuration, segmentLength, nextStart, silence)
    ) {
      const duration = segmentDuration(
        lastCue,
        end,
        segmentLength,
        currentSegmentDuration,
        totalSegmentsDuration
      );

      segments.push({duration, cues});

      totalSegmentsDuration += duration;
      currentSegmentDuration = 0;
      cues = [];
    } else {
      shouldQueue = false;
    }

    if (shouldQueue) {
      queuedCue = cue;
    }
  });

  return segments;
}

function shouldSegment(
  total: number,
  length: number,
  nextStart: number,
  silence: number
): boolean {
  // this is stupid, but gets one case fixed...
  const x = alignToSegmentLength(silence, length);
  const nextCueIsInNextSegment = silence <= length || x + total < nextStart;

  return nextCueIsInNextSegment && nextStart - total >= length;
}

function segmentDuration(
  lastCue: boolean,
  end: number,
  length: number,
  currentSegment: number,
  totalSegments: number
): number {
  let duration = length;

  if (currentSegment > length) {
    duration = alignToSegmentLength(currentSegment - length, length);
  }

  // make sure the last cue covers the whole time of the cues
  if (lastCue) {
    duration = parseFloat((end - totalSegments).toFixed(2));
  } else {
    duration = Math.round(duration);
  }

  return duration;
}

function alignToSegmentLength(n: number, segmentLength: number): number {
  n += segmentLength - (n % segmentLength);
  return n;
}

const debugging = false;

function debug(m: string): void {
  if (debugging) {
    console.log(m);
  }
}

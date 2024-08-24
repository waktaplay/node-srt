'use strict';

import {ICue} from '../types/cue';
import {IHlsSegment} from '../types/hls';
import {ISegment} from '../types/segmenter';
import {segment} from './segmenter';

function hlsSegment(
  input: string,
  segmentLength: number,
  startOffset = 900000
): IHlsSegment[] {
  const segments = segment(input, segmentLength);
  const result: IHlsSegment[] = [];

  segments.forEach((seg, i) => {
    const content = `X-TIMESTAMP-MAP=MPEGTS:${startOffset},LOCAL:00:00:00.000

${printableCues(seg.cues)}
`;
    const filename = generateSegmentFilename(i);
    result.push({filename, content});
  });

  return result;
}

function hlsSegmentPlaylist(input: string, segmentLength: number): string {
  const segmented = segment(input, segmentLength);

  const printable = printableSegments(segmented);
  const longestSegment = Math.round(findLongestSegment(segmented));

  const template = `#EXTM3U
#EXT-X-TARGETDURATION:${longestSegment}
#EXT-X-VERSION:3
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
${printable}
#EXT-X-ENDLIST
`;
  return template;
}

function generateSegmentFilename(index: number): string {
  return `${index}.srt`;
}

function printableSegments(segments: ISegment[]): string {
  const result: string[] = [];
  segments.forEach((seg, i) => {
    result.push(`#EXTINF:${seg.duration.toFixed(5)},
${generateSegmentFilename(i)}`);
  });

  return result.join('\n');
}

function findLongestSegment(segments: ISegment[]): number {
  let max = 0;
  segments.forEach(seg => {
    if (seg.duration > max) {
      max = seg.duration;
    }
  });

  return max;
}

function printableCues(cues: ICue[]): string {
  const result: string[] = [];
  cues.forEach(cue => {
    result.push(printableCue(cue));
  });

  return result.join('\n\n');
}

function printableCue(cue: ICue): string {
  const printable: string[] = [];

  if (cue.identifier) printable.push(cue.identifier.toString());

  const start = printableTimestamp(Number(cue.start));
  const end = printableTimestamp(Number(cue.end));

  const styles = cue.styles ? `${cue.styles}` : '';

  // always add a space after end timestamp, otherwise JWPlayer will not
  // handle cues correctly
  printable.push(`${start} --> ${end} ${styles}`);
  printable.push(cue.text);

  return printable.join('\n');
}

function printableTimestamp(timestamp: number): string {
  const ms = Math.round((timestamp % 1) * 1000) / 1000;
  timestamp = Math.round(timestamp - ms);

  const hours = Math.floor(timestamp / 3600);
  const mins = Math.floor((timestamp - hours * 3600) / 60);
  const secs = timestamp - hours * 3600 - mins * 60;

  // TODO hours aren't required by spec, but we include them, should be config
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${(ms * 1000).toString().padStart(3, '0')}`;
}

export {hlsSegment, hlsSegmentPlaylist};

'use strict';

import {describe, expect, it} from '@jest/globals';

import * as fs from 'fs';

import {parse} from '../src/lib/parser';
import {ParserError} from '../src/types/exceptions/parser';

describe('SRT parser', () => {
  it('should fail parsing cue with standalone identifier', () => {
    const input = `1
`;

    expect(() => {
      parse(input);
    }).toThrow(ParserError);
  });

  it('should fail parsing cue with identifier but no timestamp', () => {
    const input = `1
a`;

    expect(() => {
      parse(input);
    }).toThrow(ParserError);
  });

  it('should fail parsing cue with illegal timestamp', () => {
    const input = `1
0 --> 0
a`;

    expect(() => {
      parse(input);
    }).toThrow(ParserError);
  });

  it('should fail parsing cue with no min in timestamp', () => {
    const input = `00:00.001 --> 00:00.000
a`;

    expect(() => {
      parse(input);
    }).toThrow(ParserError);
  });

  it('should parse cue with legal timestamp and id', () => {
    const input = `1
00:00.000 --> 00:00.001
a`;

    expect(parse(input).cues[0].start).toBe(0);
    expect(parse(input).cues[0].end).toBe(0.001);
  });

  it('should parse cue with legal timestamp, no id and text', () => {
    const input = `00:00.000 --> 00:00.001
a`;

    expect(parse(input).cues[0].start).toBe(0);
    expect(parse(input).cues[0].end).toBe(0.001);
  });

  it('should return parsed data about a single cue', () => {
    const input = `1
00:00.000 --> 00:01.001 align:start line:0%
a
b`;
    const parsed = {
      identifier: '1',
      start: 0,
      end: 1.001,
      text: 'a\nb',
      styles: 'align:start line:0%',
    };
    const res = parse(input);

    expect(res.cues[0]).toEqual(parsed);
  });

  it('should parse cue with mins & hours in timestamp', () => {
    const input = `1
10:00.000 --> 01:00:00.000
a`;

    expect(parse(input).cues[0].start).toBe(600);
    expect(parse(input).cues[0].end).toBe(3600);
  });

  it('should parse intersecting cues', () => {
    const input = `00:00:00.000 --> 00:00:12.000
a


00:00:01.000 --> 00:00:13.000
b`;

    expect(parse(input).cues).toHaveLength(2);
    expect(parse(input).cues[0].start).toBe(0);
    expect(parse(input).cues[0].end).toBe(12);
    expect(parse(input).cues[1].start).toBe(1);
    expect(parse(input).cues[1].end).toBe(13);
  });

  it('should fail parsing if start equal to end', () => {
    const input = `00:00:00.000 --> 00:00:00.000
a`;

    expect(() => {
      parse(input);
    }).toThrow(ParserError);
  });

  it('should parse cue with trailing lines', () => {
    const input = `00:00.000 --> 00:00.001
a

`;

    expect(parse(input).cues[0].start).toBe(0);
    expect(parse(input).cues[0].end).toBe(0.001);
  });

  it('should parse cue with one digit hours in timestamp', () => {
    const input = `59:16.403 --> 1:04:13.283
Chapter 17`;

    expect(parse(input).cues[0].start).toBe(3556.403);
    expect(parse(input).cues[0].end).toBe(3853.283);
  });

  it('should allow NOTE for comments', () => {
    const input = `NOTE
    This translation was done by Kyle so that
    some friends can watch it with their parents.

    1
    00:02:15.000 --> 00:02:20.000
    - Ta en kopp varmt te.
    - Det är inte varmt.

    2
    00:02:20.000 --> 00:02:25.000
    - Har en kopp te.
    - Det smakar som te.

    NOTE This last line may not translate well.

    3
    00:02:25.000 --> 00:02:30.000
    - Ta en kopp`;

    expect(parse(input).cues).toHaveLength(3);
  });

  it('should not create any cues when blank', () => {
    const input = '';

    expect(parse(input).cues).toHaveLength(0);
  });

  it('should skip blank text cues', () => {
    const input = `00:00.000 --> 00:00.001

    3
    00:02:25.000 --> 00:02:30.000
    - Ta en kopp`;

    expect(parse(input).cues).toHaveLength(1);
  });

  it('should not return meta by default', () => {
    const input = `1
00:00.000 --> 00:00.001`;

    const result = parse(input);

    expect(result).toHaveProperty('valid', true);
    expect(result).not.toHaveProperty('meta');
  });

  it('should return strict as default true', () => {
    const input = `1
    00:00.000 --> 00:00.001`;

    const result = parse(input);

    expect(result).toHaveProperty('valid', true);
    expect(result).toHaveProperty('strict', true);
  });

  it('should accept strict as an option and return it in the result', () => {
    const options = {strict: false};

    const input = `1
    00:00.000 --> 00:00.001`;

    const result = parse(input, options);

    expect(result).toHaveProperty('valid', true);
    expect(result).toHaveProperty('strict', false);
  });

  it('should parse malformed cues if strict mode is false', () => {
    const options = {strict: false};

    const input = `MALFORMEDCUE -->
This text is from a malformed cue. It should not be processed.

1
00:00.000 --> 00:00.001
test`;

    const result = parse(input, options);

    expect(result).toHaveProperty('valid', false);
    expect(result).toHaveProperty('strict', false);
    expect(result.cues.length).toBe(1);
    expect(result.cues[0].start).toBe(0);
    expect(result.cues[0].end).toBe(0.001);
    expect(result.cues[0].text).toBe('test');
  });

  it('should error when parsing a cue w/start end in strict', () => {
    const input = `00:00.002 --> 00:00.001
a`;

    const options = {strict: false};

    const result = parse(input, options);

    expect(result).toHaveProperty('valid', false);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].message).toBe(
      'End must be greater or equal to start when not strict (cue #0)'
    );
  });

  it('should parse cues w/equal start and end with strict parsing off', () => {
    const input = `230
00:03:15.400 --> 00:03:15.400 T:5% S:20% L:70% A:middle
Text Position: 5%
`;

    const options = {strict: false};

    const result = parse(input, options);

    expect(result).toHaveProperty('valid', true);
  });

  it('should parse the acid.srt file w/o errors w/strict parsing off', () => {
    const input = fs.readFileSync('./test/data/acid.srt').toString('utf8');

    const options = {strict: false};

    const result = parse(input, options);

    expect(result).toHaveProperty('valid', false);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].message).toBe('Invalid cue timestamp (cue #14)');
  });

  it('should parse cue w/o round-off', () => {
    const input = `01:24:39.06 --> 01:24:40.060
a`;

    expect(parse(input).cues[0].start).toBe(5079.06);
    expect(parse(input).cues[0].end).toBe(5080.06);
  });

  it('should not throw unhandled error on malformed input in non strict mode', () => {
    const input = `1096
01:45:13.056 --> 01:45:14.390



...mission.
`;

    const result = parse(input, {strict: false});

    expect(result).toHaveProperty('valid', false);
    expect(result.errors.length).toBe(2);
    expect(result.errors[0].message).toBe('Invalid cue timestamp (cue #1)');
    expect(result.errors[1].message).toBe(
      'Cue identifier cannot be standalone (cue #2)'
    );
  });

  it('should throw a handled error not an unhandled one on malformed input', () => {
    const input = `1096
01:45:13.056 --> 01:45:14.390



...mission.
`;

    expect(() => {
      parse(input);
    }).toThrow(ParserError);
  });
});

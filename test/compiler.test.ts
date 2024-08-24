'use strict';

import {describe, expect, it} from '@jest/globals';

import {compile} from '../src/lib/compiler';
import {parse} from '../src/lib/parser';
import {CompilerError} from '../src/types/exceptions/compiler';

describe('SRT compiler', () => {
  it('should compile empty object', () => {
    expect(() => {
      compile({
        cues: [],
        valid: true,
      });
    }).not.toThrow(CompilerError);
  });

  it('should compile object', () => {
    expect(() => {
      compile({
        cues: [
          {
            end: 1,
            identifier: '',
            start: 0,
            styles: '',
            text: 'Hello world!',
          },
        ],
        valid: true,
      });
    }).not.toThrow(CompilerError);
  });

  it('should not compile invalid cue', () => {
    expect(() => {
      compile({
        cues: [
          {
            end: 1,
            identifier: '',
            start: 0,
            styles: '',
            text: 'Hello world!',
          },
        ],
        valid: false,
      });
    }).toThrow(CompilerError);
  });

  it('should compile string identifier', () => {
    expect(() => {
      compile({
        cues: [
          {
            end: 1,
            identifier: 'chance',
            start: 0,
            styles: '',
            text: 'Hello world!',
          },
        ],
        valid: true,
      });
    }).not.toThrow(CompilerError);
  });

  it('should compile empty identifier', () => {
    expect(() => {
      compile({
        cues: [
          {
            end: 1,
            identifier: '',
            start: 0,
            styles: '',
            text: 'Hello world!',
          },
        ],
        valid: true,
      });
    }).not.toThrow(CompilerError);
  });

  it('should compile null identifier', () => {
    expect(() => {
      compile({
        cues: [
          {
            end: 1,
            identifier: null,
            start: 0,
            styles: '',
            text: 'Hello world!',
          },
        ],
        valid: true,
      });
    }).not.toThrow(CompilerError);
  });

  it('should compile numeric identifier', () => {
    expect(() => {
      compile({
        cues: [
          {
            end: 1,
            identifier: 1,
            start: 0,
            styles: '',
            text: 'Hello world!',
          },
        ],
        valid: true,
      });
    }).not.toThrow(CompilerError);
  });

  it('should compile cues with numeric start', () => {
    expect(() => {
      compile({
        cues: [
          {
            end: 1,
            identifier: '',
            start: 0,
            styles: '',
            text: 'Hello world!',
          },
        ],
        valid: true,
      });
    }).not.toThrow(CompilerError);
  });

  it('should compile cues with numeric end', () => {
    expect(() => {
      compile({
        cues: [
          {
            end: 1,
            identifier: '',
            start: 0,
            styles: '',
            text: 'Hello world!',
          },
        ],
        valid: true,
      });
    }).not.toThrow(CompilerError);
  });

  it('should not compile equal start and end times', () => {
    expect(() => {
      compile({
        cues: [
          {
            end: 1,
            identifier: '',
            start: 1,
            styles: '',
            text: 'Hello world!',
          },
        ],
        valid: true,
      });
    }).toThrow(CompilerError);
  });

  it('should compile properly', () => {
    const input = {
      cues: [
        {
          end: 140,
          identifier: '1',
          start: 135.001,
          styles: '',
          text: 'Ta en kopp varmt te.\nDet är inte varmt.',
        },
        {
          end: 145,
          identifier: '2',
          start: 140,
          styles: '',
          text: 'Har en kopp te.\nDet smakar som te.',
        },
        {
          end: 150,
          identifier: '3',
          start: 145,
          styles: '',
          text: 'Ta en kopp',
        },
      ],
      valid: true,
    };
    const output = `1
00:02:15,001 --> 00:02:20,000
Ta en kopp varmt te.
Det är inte varmt.

2
00:02:20,000 --> 00:02:25,000
Har en kopp te.
Det smakar som te.

3
00:02:25,000 --> 00:02:30,000
Ta en kopp
`;

    expect(compile(input)).toBe(output);
  });

  it('should compile with accurate milliseconds', () => {
    const input = {
      cues: [
        {
          end: 1199.539,
          identifier: '1',
          start: 1199.529,
          styles: '',
          text: 'Ta en kopp varmt te.\nDet är inte varmt.',
        },
        {
          end: 1199.549,
          identifier: '2',
          start: 1199.539,
          styles: '',
          text: 'Har en kopp te.\nDet smakar som te.',
        },
        {
          end: 1199.558,
          identifier: '3',
          start: 1199.549,
          styles: '',
          text: 'Ta en kopp',
        },
      ],
      valid: true,
    };
    const output = `1
00:19:59,529 --> 00:19:59,539
Ta en kopp varmt te.
Det är inte varmt.

2
00:19:59,539 --> 00:19:59,549
Har en kopp te.
Det smakar som te.

3
00:19:59,549 --> 00:19:59,558
Ta en kopp
`;

    expect(compile(input)).toBe(output);
  });

  it('should round properly', () => {
    const input = {
      cues: [
        {
          end: 140.0001,
          identifier: '1',
          start: 135.9999,
          styles: '',
          text: 'Ta en kopp varmt te.\nDet är inte varmt.',
        },
      ],
      valid: true,
    };
    const output = `1
00:02:15,999 --> 00:02:20,000
Ta en kopp varmt te.
Det är inte varmt.
`;

    expect(compile(input)).toBe(output);
  });

  it('should compile string start and end times', () => {
    expect(() => {
      compile({
        cues: [
          {
            end: 1,
            identifier: '',
            start: 0,
            styles: '',
            text: 'Hello world!',
          },
        ],
        valid: true,
      });
    }).not.toThrow(CompilerError);
  });

  it('should be reversible', () => {
    const input = `1
00:02:15,001 --> 00:02:20,000
Ta en kopp varmt te.
Det är inte varmt.

2
00:02:20,000 --> 00:02:25,000
Har en kopp te.
Det smakar som te.

3
00:02:25,000 --> 00:02:30,000
Ta en kopp
`;
    expect(compile(parse(input))).toBe(input);
  });

  it('should not compile NaN start', () => {
    expect(() => {
      compile({
        cues: [
          {
            end: 1,
            identifier: '',
            start: NaN,
            styles: '',
            text: 'Hello world!',
          },
        ],
        valid: true,
      });
    }).toThrow(CompilerError);
  });

  it('should not compile NaN end', () => {
    expect(() => {
      compile({
        cues: [
          {
            end: NaN,
            identifier: '',
            start: 1,
            styles: '',
            text: 'Hello world!',
          },
        ],
        valid: true,
      });
    }).toThrow(CompilerError);
  });

  it('should compile styles', () => {
    const input = {
      cues: [
        {
          end: 140,
          identifier: '1',
          start: 135.001,
          styles: 'align:start line:0%',
          text: 'Hello world',
        },
      ],
      valid: true,
    };
    const output = `1
00:02:15,001 --> 00:02:20,000 align:start line:0%
Hello world
`;

    expect(compile(input)).toBe(output);
  });

  it('should not compile cues in non-chronological order', () => {
    const input = {
      valid: true,
      cues: [
        {
          identifier: '',
          start: 30,
          end: 31,
          text: 'This is a subtitle',
          styles: 'align:start line:0%',
        },
        {
          identifier: '',
          start: 0,
          end: 1,
          text: 'Hello world!',
          styles: '',
        },
      ],
    };

    expect(() => {
      compile(input);
    }).toThrow(CompilerError);
  });

  it('should allow cues that overlap in time', () => {
    const input = {
      valid: true,
      cues: [
        {
          identifier: '',
          start: 1,
          end: 5,
          text: 'This is a subtitle',
          styles: 'align:start line:0%',
        },
        {
          identifier: '',
          start: 3,
          end: 7,
          text: 'Hello world!',
          styles: '',
        },
      ],
    };

    expect(() => {
      compile(input);
    }).not.toThrow(CompilerError);
  });
});

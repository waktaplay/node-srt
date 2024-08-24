'use strict';

import {describe, expect, it} from '@jest/globals';

import {parse} from '../src/lib/parser';
import {segment} from '../src/lib/segmenter';

describe('SRT segment', () => {
  it('should not segment a single cue', () => {
    const input = `00:00.000 --> 00:05.000
a`;
    const parsed = parse(input);
    const segmented = segment(input, 10);

    expect(parsed.cues).toHaveLength(1);
    expect(segmented).toHaveLength(1);

    expect(segmented[0].cues[0]).toEqual(parsed.cues[0]);
  });

  it('should return correct duration for single cue w/start > 0', () => {
    const input = `00:11.000 --> 00:15.000
a`;
    const segmented = segment(input, 10);

    expect(segmented[0].duration).toBe(15);
  });

  it('should segment a short playlist in two w/correct duration', () => {
    const input = `00:00.000 --> 00:10.000
a

00:10.000 --> 00:19.000
a`;
    const parsed = parse(input);
    const segmented = segment(input);

    expect(parsed.cues).toHaveLength(2);
    expect(segmented).toHaveLength(2);
    expect(segmented[0].duration).toBe(10);
    expect(segmented[0].cues[0]).toEqual(parsed.cues[0]);
    expect(segmented[1].duration).toBe(9);
    expect(segmented[1].cues[0]).toEqual(parsed.cues[1]);
  });

  it('should segment a short playlist in two w/silence between', () => {
    const input = `00:00.000 --> 00:01.000
a

00:11.000 --> 00:20.000
b`;
    const parsed = parse(input);
    const segmented = segment(input);

    expect(parsed.cues).toHaveLength(2);
    expect(segmented).toHaveLength(2);
    expect(segmented[0].duration).toBe(10);
    expect(segmented[0].cues[0]).toEqual(parsed.cues[0]);
    expect(segmented[1].duration).toBe(10);
    expect(segmented[1].cues[0]).toEqual(parsed.cues[1]);
  });

  it('should skip empty cues in segmenting', () => {
    const input = `00:00.000 --> 00:01.000

01:11.000 --> 01:20.000
b`;
    const parsed = parse(input);
    const segmented = segment(input);

    expect(parsed.cues).toHaveLength(1);
    expect(segmented).toHaveLength(1);
    expect(segmented[0].duration).toBe(80);
    expect(segmented[0].cues[0]).toEqual(parsed.cues[0]);
  });

  it('should have cue that passes boundaries in two segments', () => {
    const input = `00:00.000 --> 00:11.000
a

00:11.000 --> 00:20.000
b`;
    const parsed = parse(input);
    const segmented = segment(input, 10);

    expect(parsed.cues).toHaveLength(2);
    expect(segmented).toHaveLength(2);
    expect(segmented[0].cues).toHaveLength(1);
    expect(segmented[0].cues[0]).toEqual(parsed.cues[0]);
    expect(segmented[1].cues).toHaveLength(2);
    expect(segmented[1].cues[0]).toEqual(parsed.cues[0]);
    expect(segmented[1].cues[1]).toEqual(parsed.cues[1]);
  });

  it('should have corrct duration if boundary cues', () => {
    const input = `00:11.000 --> 00:20.100
a

00:20.100 --> 00:22.000
b`;
    const parsed = parse(input);
    const segmented = segment(input, 10);

    expect(parsed.cues).toHaveLength(2);
    expect(segmented).toHaveLength(2);
    expect(segmented[0].duration).toBe(20);
    expect(segmented[0].cues).toHaveLength(1);
    expect(segmented[0].cues[0]).toEqual(parsed.cues[0]);
    expect(segmented[1].duration).toBe(2);
    expect(segmented[1].cues).toHaveLength(2);
    expect(segmented[1].cues[0]).toEqual(parsed.cues[0]);
    expect(segmented[1].cues[1]).toEqual(parsed.cues[1]);
  });

  it('should segment four cues w/two boundaries', () => {
    const input = `00:00.000 --> 00:05.000
a

00:05.000 --> 00:11.000
b

00:11.000 --> 00:21.000
c

00:21.000 --> 00:31.000
d`;
    const parsed = parse(input);
    const segs = segment(input, 10);

    expect(parsed.cues).toHaveLength(4);
    expect(segs).toHaveLength(3);
    expect(segs[0].duration).toBe(10);
    expect(segs[0].cues).toHaveLength(2);
    expect(segs[0].cues[0]).toEqual(parsed.cues[0]);
    expect(segs[0].cues[1]).toEqual(parsed.cues[1]);

    expect(segs[1].duration).toBe(10);
    expect(segs[1].cues).toHaveLength(2);
    expect(segs[1].cues[0]).toEqual(parsed.cues[1]);
    expect(segs[1].cues[1]).toEqual(parsed.cues[2]);

    expect(segs[2].duration).toBe(11);
    expect(segs[2].cues).toHaveLength(2);
    expect(segs[2].cues[0]).toEqual(parsed.cues[2]);
    expect(segs[2].cues[1]).toEqual(parsed.cues[3]);
  });

  it('should have correct durations for segments on boundary', () => {
    const input = `00:00:09.000 --> 00:00:19.000
a

00:00:19.000 --> 00:00:20.000
b`;
    const parsed = parse(input);
    const segmented = segment(input);

    expect(parsed.cues).toHaveLength(2);
    expect(segmented).toHaveLength(2);
    expect(segmented[0].duration).toBe(10);
    expect(segmented[0].cues[0]).toEqual(parsed.cues[0]);
    expect(segmented[1].duration).toBe(10);
    expect(segmented[1].cues[0]).toEqual(parsed.cues[0]);
    expect(segmented[1].cues[1]).toEqual(parsed.cues[1]);
  });

  it('should have right durations for segs on boundary w/longer end', () => {
    const input = `00:00:09.000 --> 00:00:19.000
a

00:00:19.000 --> 00:00:25.000
b`;
    const parsed = parse(input);
    const segmented = segment(input);

    expect(parsed.cues).toHaveLength(2);
    expect(segmented).toHaveLength(2);
    expect(segmented[0].duration).toBe(10);
    expect(segmented[0].cues[0]).toEqual(parsed.cues[0]);
    expect(segmented[1].duration).toBe(15);
    expect(segmented[1].cues[0]).toEqual(parsed.cues[0]);
    expect(segmented[1].cues[1]).toEqual(parsed.cues[1]);
  });

  it('should segment correctly if silence between four cues', () => {
    const input = `00:00:00.000 --> 00:00:01.000
a

00:00:30.000 --> 00:00:31.000
b

00:01:00.000 --> 00:01:01.000
c

00:01:50.000 --> 00:01:51.000
d`;
    const parsed = parse(input);
    const segmented = segment(input);

    expect(parsed.cues).toHaveLength(4);
    expect(segmented).toHaveLength(4);
    expect(segmented[0].duration).toBe(10);
    expect(segmented[0].cues[0]).toEqual(parsed.cues[0]);
    expect(segmented[1].duration).toBe(30);
    expect(segmented[1].cues[0]).toEqual(parsed.cues[1]);
    expect(segmented[2].duration).toBe(30);
    expect(segmented[2].cues[0]).toEqual(parsed.cues[2]);
    expect(segmented[3].duration).toBe(41);
    expect(segmented[3].cues[0]).toEqual(parsed.cues[3]);
  });

  it('should segment correctly when passing hours', () => {
    const input = `00:59:00.000 --> 00:59:10.000
a

00:59:59.000 --> 01:00:11.000
b`;
    const parsed = parse(input);
    const segmented = segment(input);

    expect(parsed.cues).toHaveLength(2);
    expect(segmented).toHaveLength(2);
    expect(segmented[0].duration).toBe(3550);
    expect(segmented[0].cues[0]).toEqual(parsed.cues[0]);
    expect(segmented[1].duration).toBe(61);
    expect(segmented[1].cues[0]).toEqual(parsed.cues[1]);
  });

  it('should group many cues together in a segment', () => {
    const input = `00:00:00.000 --> 00:00:11.360
a

00:00:11.430 --> 00:00:13.110
b

00:00:13.230 --> 00:00:15.430
c

00:00:15.520 --> 00:00:17.640
d

00:00:17.720 --> 00:00:19.950
e

00:01:43.840 --> 00:01:46.800
f`;

    const parsed = parse(input);
    const segmented = segment(input);

    expect(parsed.cues).toHaveLength(6);
    expect(segmented).toHaveLength(3);
    expect(segmented[0].duration).toBe(10);
    expect(segmented[0].cues[0]).toEqual(parsed.cues[0]);
    expect(segmented[1].duration).toBe(10);
    expect(segmented[1].cues.length).toBe(5);
    expect(segmented[1].cues[0]).toEqual(parsed.cues[0]);
    expect(segmented[1].cues[1]).toEqual(parsed.cues[1]);
    expect(segmented[1].cues[2]).toEqual(parsed.cues[2]);
    expect(segmented[1].cues[3]).toEqual(parsed.cues[3]);
    expect(segmented[1].cues[4]).toEqual(parsed.cues[4]);
    expect(segmented[2].duration).toBe(86.8);
    expect(segmented[2].cues[0]).toEqual(parsed.cues[5]);
  });

  it('should segment a longer playlist correctly', () => {
    const input = `00:00:01.800 --> 00:00:05.160
0

00:00:05.400 --> 00:00:07.560
1

00:00:07.640 --> 00:00:09.600
2

00:00:09.720 --> 00:00:11.360
3

00:00:11.430 --> 00:00:13.110
4

00:00:13.230 --> 00:00:15.430
5

00:00:15.520 --> 00:00:17.640
6

00:00:17.720 --> 00:00:19.950
7

00:00:20.040 --> 00:00:23.760
8

00:00:23.870 --> 00:00:26.320
9

00:00:26.400 --> 00:00:28.560
10

00:00:28.640 --> 00:00:30.870
11`;

    const parsed = parse(input);
    const segmented = segment(input);

    expect(parsed.cues).toHaveLength(12);
    expect(segmented).toHaveLength(3);
    expect(segmented[0].duration).toBe(10);
    expect(segmented[0].cues.length).toBe(4);
    expect(segmented[0].cues[0]).toEqual(parsed.cues[0]);
    expect(segmented[0].cues[1]).toEqual(parsed.cues[1]);
    expect(segmented[0].cues[2]).toEqual(parsed.cues[2]);
    expect(segmented[0].cues[3]).toEqual(parsed.cues[3]);

    expect(segmented[1].duration).toBe(10);
    expect(segmented[1].cues.length).toBe(5);
    expect(segmented[1].cues[0]).toEqual(parsed.cues[3]);
    expect(segmented[1].cues[1]).toEqual(parsed.cues[4]);
    expect(segmented[1].cues[2]).toEqual(parsed.cues[5]);
    expect(segmented[1].cues[3]).toEqual(parsed.cues[6]);
    expect(segmented[1].cues[4]).toEqual(parsed.cues[7]);

    expect(segmented[2].duration).toBe(10.87);
    expect(segmented[2].cues.length).toBe(4);
    expect(segmented[2].cues[0]).toEqual(parsed.cues[8]);
    expect(segmented[2].cues[1]).toEqual(parsed.cues[9]);
    expect(segmented[2].cues[2]).toEqual(parsed.cues[10]);
    expect(segmented[2].cues[3]).toEqual(parsed.cues[11]);
  });

  it('should segment an even longer playlist correctly', () => {
    const input = `00:00:01.800 --> 00:00:05.160
0

00:00:05.400 --> 00:00:07.560
1

00:00:07.640 --> 00:00:09.600
2

00:00:09.720 --> 00:00:11.360
3

00:00:11.430 --> 00:00:13.110
4

00:00:13.230 --> 00:00:15.430
5

00:00:15.520 --> 00:00:17.640
6

00:00:17.720 --> 00:00:19.950
7

00:00:20.040 --> 00:00:23.760
8

00:00:23.870 --> 00:00:26.320
9

00:00:26.400 --> 00:00:28.560
10

00:00:28.640 --> 00:00:30.870
11

00:00:30.950 --> 00:00:33.230
12

00:00:33.320 --> 00:00:35.000
13

00:00:35.080 --> 00:00:37.400
14

00:00:37.520 --> 00:00:39.400
15

00:00:39.520 --> 00:00:42.600
16

00:00:42.720 --> 00:00:46.000
17

00:00:46.110 --> 00:00:48.200
18

00:00:48.280 --> 00:00:49.640
19

00:00:49.680 --> 00:00:52.600
20

00:00:52.680 --> 00:00:55.000
21

00:00:55.400 --> 00:00:56.470
22

00:00:58.720 --> 00:01:00.110
23

00:01:03.160 --> 00:01:04.200
24

00:01:43.840 --> 00:01:46.800
25

00:01:50.430 --> 00:01:53.110
26

00:01:54.840 --> 00:01:56.160
27

00:01:58.470 --> 00:02:02.840
28

00:02:03.840 --> 00:02:05.560
29

00:02:06.760 --> 00:02:07.720
30

00:02:07.800 --> 00:02:11.280
31

00:02:11.400 --> 00:02:14.320
32

00:02:14.430 --> 00:02:15.470
33

00:02:15.600 --> 00:02:17.920
34

00:02:18.000 --> 00:02:20.520
35

00:02:20.600 --> 00:02:23.110
36

00:02:23.200 --> 00:02:25.840
37

00:02:25.950 --> 00:02:29.800
38

00:02:29.870 --> 00:02:31.230
39

00:02:31.320 --> 00:02:33.280
40

00:02:33.560 --> 00:02:37.160
41

00:02:37.360 --> 00:02:39.560
42`;

    const parsed = parse(input);
    const segmented = segment(input);

    expect(parsed.cues).toHaveLength(43);
    expect(segmented).toHaveLength(13);

    expect(segmented[0].duration).toBe(10);
    expect(segmented[0].cues.length).toBe(4);

    expect(segmented[1].duration).toBe(10);
    expect(segmented[1].cues.length).toBe(5);

    expect(segmented[2].duration).toBe(10);
    expect(segmented[2].cues.length).toBe(4);

    expect(segmented[3].duration).toBe(10);
    expect(segmented[3].cues.length).toBe(6);

    expect(segmented[4].duration).toBe(10);
    expect(segmented[4].cues.length).toBe(5);

    expect(segmented[5].duration).toBe(10);
    expect(segmented[5].cues.length).toBe(4);
    expect(segmented[5].cues[0]).toEqual(parsed.cues[20]);

    expect(segmented[6].duration).toBe(10);
    expect(segmented[6].cues.length).toBe(2);

    expect(segmented[7].duration).toBe(40);
    expect(segmented[7].cues.length).toBe(1);
    expect(segmented[7].cues[0]).toEqual(parsed.cues[25]);

    expect(segmented[8].duration).toBe(10);
    expect(segmented[8].cues.length).toBe(3);
    expect(segmented[8].cues[0]).toEqual(parsed.cues[26]);

    expect(segmented[9].duration).toBe(10);
    expect(segmented[9].cues.length).toBe(4);

    expect(segmented[10].duration).toBe(10);
    expect(segmented[10].cues.length).toBe(5);

    expect(segmented[11].duration).toBe(10);
    expect(segmented[11].cues.length).toBe(5);

    expect(segmented[12].duration).toBe(9.56);
    expect(segmented[12].cues.length).toBe(4);
  });

  it('should segment correctly with silence in middle', () => {
    const input = `00:05:49.720 --> 00:05:53.160
0

00:05:53.280 --> 00:05:55.400
1

00:06:00.470 --> 00:06:04.040
2

00:06:05.160 --> 00:06:06.800
3

00:06:45.640 --> 00:06:48.600
4

00:06:48.680 --> 00:06:51.230
5

00:06:51.320 --> 00:06:54.230
6

00:06:54.760 --> 00:06:56.320
7

00:06:56.430 --> 00:06:58.040
8

00:06:58.080 --> 00:06:59.600
9

00:06:59.680 --> 00:07:02.160
10`;

    const parsed = parse(input);
    const segmented = segment(input);

    expect(parsed.cues).toHaveLength(11);
    expect(segmented).toHaveLength(5);
    expect(segmented[0].duration).toBe(350);
    expect(segmented[0].cues.length).toBe(1);

    expect(segmented[1].duration).toBe(10);
    expect(segmented[1].cues.length).toBe(2);

    expect(segmented[2].duration).toBe(10);
    expect(segmented[2].cues.length).toBe(2);

    expect(segmented[3].duration).toBe(40);
    expect(segmented[3].cues.length).toBe(2);

    expect(segmented[4].duration).toBe(12.16);
    expect(segmented[4].cues.length).toBe(6);
  });

  it('should allow cues to intersect', () => {
    const input = `00:00:00.000 --> 00:00:12.000
a

00:00:01.000 --> 00:00:13.000
b`;
    const parsed = parse(input);
    const segmented = segment(input);

    expect(parsed.cues).toHaveLength(2);
    expect(segmented).toHaveLength(1);
    expect(segmented[0].duration).toBe(13);
    expect(segmented[0].cues).toHaveLength(2);
    expect(segmented[0].cues[0]).toEqual(parsed.cues[0]);
    expect(segmented[0].cues[1]).toEqual(parsed.cues[1]);
  });
});

# Subrip (.srt) compiler/parser/segmenter with Typescript support

Compiles, parses Subrip files, segments and generates HLS playlists for them.

[![CircleCI](https://circleci.com/gh/waktaplay/node-srt-ts.svg?style=svg)](https://circleci.com/gh/waktaplay/node-srt-ts)
[![npm version](https://badgen.net/npm/v/node-srt-ts)](https://www.npmjs.com/package/node-srt-ts)
[![npm downloads](https://img.shields.io/npm/dt/node-srt-ts.svg?style=flat-square)](https://www.npmjs.com/package/node-srt-ts)

This is a sister package to [osk/node-webvtt](https://github.com/osk/node-webvtt) and forked from [goatandsheep/node-srt](https://github.com/goatandsheep/node-srt).

## Usage

For a Subrip file:

```text
1
00:00:00.000 --> 00:00:01.000
Hello world!

2
00:00:30.000 --> 00:00:31.000 align:start line:0%
This is a subtitle

3
00:01:00.000 --> 00:01:01.000
Foo

4
00:01:50.000 --> 00:01:51.000
Bar
```

We can parse, segment and create HLS playlists, and compile back to Subrip format:

```ts
import { parse, compile, hlsSegmentPlaylist, hlsSegment } from 'node-srt-ts';

const segmentDuration = 10; // default to 10
const startOffset = 0; // Starting MPEG TS offset to be used in timestamp map, default 900000

const parsed = parse(input);
const compile = compile(input);
const segmented = parse(input, segmentDuration);
const playlist = hlsSegmentPlaylist(input, segmentDuration);
const segments = hlsSegment(input, segmentDuration, startOffset);
```

### Parsing

Parses the Subrip file and returns an object with `valid === true` if parsed correctly and an array of cues parsed.

Each cue can have:

* `identifier` - Id, if any of the cue
* `start` - Start time of cue in seconds
* `end` - End time of cue in seconds
* `text` - Text of the subtitle
* `styles` - If any of the cue

If the Subrip file is invalid, the parser will throw a `ParserError` exception. So for safety, calls to `parse` should be in `try catch`.

For the above example we'd get:

```json
{
   "valid":true,
   "cues":[
      {
         "identifier":"",
         "start":0,
         "end":1,
         "text":"Hello world!",
         "styles":""
      },
      {
         "identifier":"",
         "start":30,
         "end":31,
         "text":"This is a subtitle",
         "styles":"align:start line:0%"
      },
      {
         "identifier":"",
         "start":60,
         "end":61,
         "text":"Foo",
         "styles":""
      },
      {
         "identifier":"",
         "start":110,
         "end":111,
         "text":"Bar",
         "styles":""
      }
   ]
}
```

By default the parser is strict. It will throw errors if:

* If any cue is malformed in any way

Setting the option parameter of `strict` to `false` will allow files with malformed cues to be parsed. The resulting object will have `valid === false` and all errors in an `errors` array.

If `strict` is set to `false`, the parser will also not categorize it as an error if a cue starts and ends at the same time. This might be the correct behaviour but changing would introduce a breaking change in version 1.x.

### Metadata
By passing `{ meta: true }` to the `parse` method, these metadata will be returned as an object called `meta`. For example, parsing the above example:

```javascript
parse(subrip, { meta: true });
```

would return the following:

```json
{
   "valid":true,
   "meta":{
      "Kind": "captions",
      "Language": "en"
   },
   "cues":[
      {
         "identifier":"",
         "start":0,
         "end":1,
         "text":"Hello world!",
         "styles":""
      }
   ]
}
```

If no metadata is available, `meta` will be set to `null` in the result if the option is specified.

### Compiling

Compiles JSON from the above format back into a Subrip string. If a `meta` key is in the input,
it will be compiled as well. The `meta` value must be an object and each key and value must be a string.

If the object is missing any attributes, the compiler will throw a `CompilerError` exception. So
for safety, calls to `compile` should be in `try catch`.

```javascript
const input = {
  meta: {
    Kind: 'captions',
    Language: 'en'
  },
  cues: [{
    end: 140,
    identifier: '1',
    start: 135.001,
    text: 'Hello world',
    styles: ''
  }],
  valid: true
};

const result = compile(input);

/*
1
00:02:15.001 --> 00:02:20.000
Hello world
*/
```

### Segmenting

Segments a subtitle according to how it should be segmented for HLS subtitles.

* Does a one pass of the cues for segmenting, this might have been a good idea or bad, only time will tell
* The One and Only Source of Truth is Apple's `mediasubtitlesegmenter` CLI

For the above example:

```javascript
[
    { duration: 10, cues: [ [Object] ] },
    { duration: 30, cues: [ [Object] ] },
    { duration: 30, cues: [ [Object] ] },
    { duration: 41, cues: [ [Object] ] }
]
```

### HLS playlist

Creates a subtitle playlist. For the above:

```text
#EXTM3U
#EXT-X-TARGETDURATION:41
#EXT-X-VERSION:3
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:10.00000,
0.srt
#EXTINF:30.00000,
1.srt
#EXTINF:30.00000,
2.srt
#EXTINF:41.00000,
3.srt
#EXT-X-ENDLIST
```

### HLS Segments

Creates a list of HLS segments for the subtitles, returning an array of them with `filename` and `content`.

```json
[
   {
      "filename":"0.srt",
      "content":"X-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000\n\n1\n00:00:00.000 --> 00:00:01.000\nHello world!\n"
   },
   {
      "filename":"1.srt",
      "content":"X-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000\n\n2\n00:00:30.000 --> 00:00:31.000 align:start line:0%\nThis is a subtitle\n"
   },
   {
      "filename":"2.srt",
      "content":"X-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000\n\n3\n00:01:00.000 --> 00:01:01.000\nFoo\n"
   },
   {
      "filename":"3.srt",
      "content":"X-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000\n\n4\n00:01:50.000 --> 00:01:51.000\nBar\n"
   }
]
```

## Development

This has been written with TDD so we've got a good coverage of the features.

```bash
pnpm install
pnpm test
```

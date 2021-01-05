'use strict';
/* eslint no-trailing-spaces: 0 */

const fs = require('fs');
const chai = require('chai');
chai.should();

const hls = require('../lib/hls');

describe('WebVTT HLS segmenter', () => {
  it('should generate playlist for a simple subtitles file', () => {
    const input = `00:00.000 --> 00:10.000
a

00:10.000 --> 00:20.000
a`;
    const expectedPlaylist = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-VERSION:3
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:10.00000,
0.srt
#EXTINF:10.00000,
1.srt
#EXT-X-ENDLIST
`;
    const generated = hls.hlsSegmentPlaylist(input, 10);

    generated.should.equal(expectedPlaylist);
  });

  it('should generate segments for a simple subtitles file', () => {
    const input = `1
01:01:01.800 --> 01:12:19.999 align:start line:0%
a

2
05:59:59.000 --> 05:59:59.999
b`;
    const expectedFirstSegment = `X-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000

1
01:01:01.800 --> 01:12:19.999 align:start line:0%
a
`;

    const expectedSecondSegment = `X-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000

2
05:59:59.000 --> 05:59:59.999 
b
`;

    const generated = hls.hlsSegment(input, 3);

    generated[0].filename.should.equal('0.srt');
    generated[0].content.should.equal(expectedFirstSegment);
    generated[1].filename.should.equal('1.srt');
    generated[1].content.should.equal(expectedSecondSegment);
  });

  it('should generate allow for setting starting offset of segments', () => {
    const input = `00:00:00.000 --> 01:00:00.000 
a
`;
    const expectedSegment = `X-TIMESTAMP-MAP=MPEGTS:0,LOCAL:00:00:00.000

00:00:00.000 --> 01:00:00.000 
a
`;

    const generated = hls.hlsSegment(input, 3, 0);

    generated[0].filename.should.equal('0.srt');
    generated[0].content.should.equal(expectedSegment);
  });

  it.skip('should generate correct playlist, compared to apple tool', () => {
    const input = fs.readFileSync('./test/data/subs1.srt');
    const expectedPlaylist = fs.readFileSync('./test/data/playlist1.m3u8');

    const generated = hls.hlsSegmentPlaylist(input.toString(), 10);

    generated.should.equal(expectedPlaylist.toString());
  });

  it('should round target duration up to second', () => {
    const input = `00:00.000 --> 00:10.000
a

00:10.000 --> 00:22.500
a`;
    const expectedPlaylist = `#EXTM3U
#EXT-X-TARGETDURATION:13
#EXT-X-VERSION:3
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:10.00000,
0.srt
#EXTINF:12.50000,
1.srt
#EXT-X-ENDLIST
`;
    const generated = hls.hlsSegmentPlaylist(input, 10);

    generated.should.equal(expectedPlaylist);
  });
});

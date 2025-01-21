const playlist = [
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    "",
    // 1080p variant
    '#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,CODECS="avc1.42e01e,mp4a.40.2",AUDIO="audio-aac-128k"',
    "1080p/playlist.m3u8",
    "",
    // 720p variant
    '#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720,CODECS="avc1.42e01e,mp4a.40.2",AUDIO="audio-aac-128k"',
    "720p/playlist.m3u8",
    "",
    // 320p variant
    '#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=568x320,CODECS="avc1.42e01e,mp4a.40.2",AUDIO="audio-aac-128k"',
    "320p/playlist.m3u8",
].join("\n");

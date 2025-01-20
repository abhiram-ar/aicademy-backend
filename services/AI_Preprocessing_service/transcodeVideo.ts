import fs, { glob, globSync } from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

type Resolution = { height: number; bitrate: string; name: string };

const RESOLUTIONS: Resolution[] = [
    { height: 1080, bitrate: "5000k", name: "1080p" },
    { height: 720, bitrate: "2800k", name: "720p" },
    { height: 320, bitrate: "800k", name: "320p" },
];

class TranscodingJob {
    inputPath: string;
    outputDir: string;
    jobId: string;
    s3Bucket: "pending" | "failed" | "completed";
    status: string;
    s3Prefix: any;
    uploadedFiles: never[];
    completedStreams: number;

    constructor(inputPath, outputDir, jobId, s3Bucket, s3Prefix) {
        this.inputPath = inputPath;
        this.outputDir = outputDir;
        this.jobId = jobId;
        this.s3Bucket = s3Bucket;
        this.status = "pending";
        this.s3Prefix = s3Prefix;
        this.completedStreams = 0;
        this.uploadedFiles = [];
    }

    async start() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        //masterplaylist
        // const masterplaylist = this.createMasterPlaylist();
        // fs.writeFileSync(path.join(this.outputDir, "master.m3u8"), masterplaylist);

        // single thread for the entire process
        // for (let resolution of RESOLUTIONS) {
        //     await this.transcodeToResulution(resolution);
        // }
        //-a thread for a resolution - do if this service is running on separate instance
        // await Promise.all(RESOLUTIONS.map((resolution) => this.transcodeToResulution(resolution)));

        // upload all files to s3
        await this.uploadToS3();
        //try catch
    }

    transcodeToResulution(resolution: Resolution) {
        const resolutionDir = path.join(this.outputDir, resolution.name);
        if (!fs.existsSync(resolutionDir)) {
            fs.mkdirSync(resolutionDir, { recursive: true });
        }

        return new Promise<void>((resolve, reject) => {
            ffmpeg(this.inputPath)
                .outputOption([
                    "-c:v libx264", // Use H.264 codec for video
                    "-threads 8", // limit ffmpeg to use one thread
                    "-profile:v baseline", // Baseline profile for compatibility
                    "-preset fast", // Encoding speed/quality tradeoff
                    "-crf 23", // Constant Rate Factor for quality control (lower = better)
                    "-g 48", // Group of Pictures (GOP) size, keyframes every 48 frames - 24fps
                    `-vf scale=-2:${resolution.height}`, // Scale to target height, maintain aspect ratio
                    `-b:v ${resolution.bitrate}`, // Target bitrate
                    "-maxrate",
                    resolution.bitrate, // Maximum bitrate to control spikes
                    "-bufsize",
                    `${parseInt(resolution.bitrate) * 2}k`, // Decoder buffer size
                    "-c:a aac", // AAC audio codec
                    "-b:a 128k", // Audio bitrate
                    "-ac 2", // Stereo audio
                    "-ar 48000", // Audio sample rate
                    "-hls_time 6", // Segment duration in seconds
                    "-hls_playlist_type vod", // VOD playlist (not live)
                    "-hls_segment_filename",
                    path.join(resolutionDir, `segment_%03d_${resolution.name}.ts`), // TS segment naming
                    "-hls_flags independent_segments", // Ensure each segment is decodable independently
                ])
                .output(path.join(resolutionDir, "playlist.m3u8"))
                .on("progress", (progress) =>
                    console.log(
                        `video processing| ${resolution.name} | ${progress.percent?.toFixed(
                            2
                        )}% completed`
                    )
                )
                .on("end", () => {
                    this.completedStreams++;
                    resolve();
                })
                .on("error", (err) => {
                    console.log(`error while transcoding to resolution ${resolution.name}`);
                    reject(err);
                })
                .run();
        });
    }

    createMasterPlaylist() {
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

        return playlist;
    }

    // calculateWidth(height: number) {
    //     return Math.round((height * 16) / 9);
    // }

    async uploadToS3() {}
}

const job = new TranscodingJob(
    "/home/abhiram/Bootcamp/week-10/AIcademy/backend/temp/downloads/elon.mp4",
    "/home/abhiram/Bootcamp/week-10/AIcademy/backend/temp/downloads/transcoded",
    "",
    "",
    ""
);

job.start();
// job.createMasterPlaylist();

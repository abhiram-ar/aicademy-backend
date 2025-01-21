import fs, { readFileSync } from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { glob } from "glob";
import mime from "mime";
import s3 from "../aws.S3Client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { logErrorMessage } from "../../utils/log";

type Resolution = { height: number; bitrate: string; name: string };

const RESOLUTIONS: Resolution[] = [
    { height: 1080, bitrate: "5000k", name: "1080p" },
    { height: 720, bitrate: "2800k", name: "720p" },
    { height: 320, bitrate: "800k", name: "320p" },
];

class TranscodingJob {
    inputPath: string;
    outputDir: string;
    s3Bucket: string;
    status: "pending" | "failed" | "completed";
    s3Prefix: string;
    uploadedFiles: { localPath: string; s3Key: string }[];
    completedStreams: number;
    masterFileKey: string | undefined;

    constructor(inputPath: string, outputDir: string, s3Bucket: string, s3Prefix: string) {
        this.inputPath = inputPath;
        this.outputDir = outputDir;
        this.s3Bucket = s3Bucket;
        this.status = "pending";
        this.s3Prefix = s3Prefix;
        this.completedStreams = 0;
        this.uploadedFiles = [];
        this.masterFileKey = undefined;
    }

    async start() {
        try {
            if (!fs.existsSync(this.outputDir)) {
                fs.mkdirSync(this.outputDir, { recursive: true });
            }

            // single thread for the entire process
            // for (let resolution of RESOLUTIONS) {
            //     await this.transcodeToResulution(resolution);
            // }

            // a thread for a resolution - do if this service is running on separate instance - microservice
            await Promise.all(
                RESOLUTIONS.map((resolution) => this.transcodeToResulution(resolution))
            );

            //masterplaylist
            const masterplaylist = this.createMasterPlaylist();
            fs.writeFileSync(path.join(this.outputDir, "master.m3u8"), masterplaylist);

            // upload all files to s3
            await this.uploadToS3();

            this.masterFileKey = path.join(this.s3Prefix, "master.m3u8");
            this.status = "completed";
        } catch (error) {
            this.status = "failed";
            logErrorMessage("error while trancoding video");
            throw error;
        }
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
                    "-threads 8", // limit ffmpeg to use one thread in monolith
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
        const individualPlaylistInto = RESOLUTIONS.flatMap((resolution) => [
            `#EXT-X-STREAM-INF:BANDWIDTH=${
                parseInt(resolution.bitrate) * 1000
            },RESOLUTION=${this.calculateWidth(resolution.height)}x${
                resolution.height
            },CODECS="avc1.42e01e,mp4a.40.2",AUDIO="audio-aac-128k"`,
            `${resolution.name}/playlist.m3u8\n`,
        ]);
        const playlist = ["#EXTM3U", "#EXT-X-VERSION:3", "", ...individualPlaylistInto].join("\n");
        return playlist;
    }

    calculateWidth(height: number) {
        return Math.round((height * 16) / 9);
    }

    async uploadToS3() {
        const files = await glob("**/*", { cwd: this.outputDir, nodir: true });
        // console.log(files);

        for (let [index, file] of files.entries()) {
            const filePath = path.join(this.outputDir, file);
            const s3Key = path.join(this.s3Prefix, file);
            const contentType = mime.lookup(filePath) || "application/octet-stream";
            const fileContent = readFileSync(filePath);

            console.log(`uploading: ${index}/${files.length}`);
            await s3.send(
                new PutObjectCommand({
                    Bucket: this.s3Bucket,
                    Key: s3Key,
                    Body: fileContent,
                    ContentType: contentType,
                    CacheControl: this.getCacheControl(file),
                })
            );

            this.uploadedFiles.push({
                localPath: filePath,
                s3Key,
            });
        }
    }

    getCacheControl(file: string) {
        if (file.endsWith(".m3u8")) return "no-cache";
        else "public, max-age:2628000"; //one month
    }
}

const job = new TranscodingJob(
    "/home/abhiram/Bootcamp/week-10/AIcademy/backend/temp/downloads/elon.mp4",
    "/home/abhiram/Bootcamp/week-10/AIcademy/backend/temp/downloads/transcoded2/",
    process.env.AWS_S3_BUCKET_NAME as string,
    "elon2"
);

job.start();
// job.createMasterPlaylist();

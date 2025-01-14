import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { logErrorMessage, logSuccess } from '../../utils/log';
import fs from 'fs/promises';

interface AudioOptions {
    format?: string; // Output format (mp3, wav, aac)
    bitrate?: string;
    sampleRate?: string;
    channels?: number;
}

export const extractAudio = async (inputPath: string, options: AudioOptions = {}) => {
    const {
        format = 'opus', // compressed but, good for realtime audio processing
        bitrate = '32k', // opus retain good speech quality even at low bit rate
        sampleRate = '16000', // 16k is good for speech to text anything above this give diminishing returns
        channels = 1, // since we are doing speech recognition dual channel is not mandatory
    } = options;

    const outputDir = path.dirname(inputPath);
    await fs.mkdir(outputDir, { recursive: true }); //make sure the dir exists
    const outputPath = path.join(outputDir, path.parse(inputPath).name) + '.' + format;

    return new Promise((resolve, reject) => {
        console.log('Starting to Audio Extraction.....');
        ffmpeg(inputPath)
            .toFormat(format)
            .withAudioBitrate(bitrate)
            .withAudioFrequency(parseInt(sampleRate))
            .withAudioChannels(channels)
            .output(outputPath)

            // handling reformat
            .on('progress', (progress) =>
                console.log(`Audio extraction: ${progress.percent?.toFixed(2)}% done`)
            )
            .on('end', () => {
                logSuccess('Audio extraction complete');
                resolve(outputPath);
            })
            .on('error', (error) => {
                logErrorMessage('error while extracting audio');
                console.log(error);
                reject(error);
            })
            .run();
    });
};

// const result = extractAudio(
//     "/home/abhiram/Bootcamp/week-10/AIcademy/backend/temp/downloads/Elon.mp4"
// )
//     .then((data) => console.log(data))
//     .catch((error) => console.log(error));

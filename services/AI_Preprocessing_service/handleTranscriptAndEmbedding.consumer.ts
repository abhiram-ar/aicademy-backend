import { donwloadFileFromS3 } from './downloadFileFromS3';
import path from 'path';
import { extractAudio } from './extractAudioFromvideo';
import { extractTranscriptFromAudio } from './extractTranscriptFromAudio';
import { preComputeEmbedding } from './preComputeEmbedding';
import fs from 'fs/promises';
import videoModel from '../../models/video.model';
import connectDB from '../../config/mongoose';
import amqp, { Channel, Connection } from 'amqplib';
import {
    logErrorMessage,
    logSuccess,
    logSuccessWithTimestamp,
    logWarning,
    logWithTimestamp,
} from './../../utils/log';

export const jobExchange = 'jobExchange';
export const transcriptAndEmbeddingRoutingKey = 'transcriptAndEmbeddingJob';
export const trancscriptAndEmbeddingQueue = 'createTranscriptAndEmbeddingJobQueue';

const handleTranscriptAndEmbedding = async () => {
    let connection: Connection;
    let channel: Channel;

    try {
        connection = await amqp.connect('amqp://localhost');
        console.log('consumer: Rabitmq connected successfully');

        channel = await connection.createChannel();
        await channel.assertExchange(jobExchange, 'direct', { durable: true });
        await channel.assertQueue(trancscriptAndEmbeddingQueue, {
            durable: true,
        });

        await channel.bindQueue(
            trancscriptAndEmbeddingQueue,
            jobExchange,
            transcriptAndEmbeddingRoutingKey
        );

        logWarning(`Waiting for messages in queue: ${trancscriptAndEmbeddingQueue}`);

        // handle one job at a time - increase this in production
        channel.prefetch(1);

        channel.consume(
            trancscriptAndEmbeddingQueue,
            async (message) => {
                if (!message) return;

                const content = JSON.parse(message.content.toString());
                logWithTimestamp(`Received new job: ${JSON.stringify(content)}`);

                try {
                    const startTime = Date.now();
                    await processJob(content.key, content.videoId);
                    const timeTaken = Date.now() - startTime;

                    channel.ack(message);
                    logSuccessWithTimestamp(
                        `Completed job: ${JSON.stringify(content)} in ${timeTaken}ms \n`
                    );
                } catch (error) {
                    logErrorMessage('error while proceesing transcript and embeddiing job');
                    logErrorMessage(error.message);
                    console.log(error);
                    // requue true in production
                    channel.nack(message, false, false);
                }
            },
            { noAck: false }
        );

        // // gradefully close connection if process is killed
        const cleanup = async () => {
            logWarning('Closing RabbitMQ connection...');
            try {
                await connection.close();
                logSuccess('RabbitMQ connection closed. Exiting process.');
                process.exit(0);
            } catch (error) {
                logErrorMessage('Error closing RabbitMQ connection');
                console.log(error);
                process.exit(1);
            }
        };
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
    } catch (error) {
        logErrorMessage('failed to start transcript and Embedding job');
        logErrorMessage(error.message);
        console.log(error);
    }
};

const processJob = async (key: string, videoId: string) => {
    let videoPath: unknown | undefined;
    let audioPath: string | undefined;
    try {
        const downloadPath = path.join(__dirname, '..', '..', 'temp', 'downloads');
        // each function can be further separted in to individual jobs in future
        videoPath = await donwloadFileFromS3(key, downloadPath);
        audioPath = await extractAudio(videoPath as string);
        const transcriptResult = await extractTranscriptFromAudio(audioPath);
        await preComputeEmbedding(transcriptResult.text, key);

        const isSuccessful = await videoModel.findByIdAndUpdate(videoId, {
            isAiReady: true,
            transcriptId: transcriptResult.id,
        });
        if (!isSuccessful) {
            throw new Error('Unable update the video DB record');
        }
        logSuccessWithTimestamp('Updated video status in DB');

        return isSuccessful;
    } catch (error) {
        throw error;
    } finally {
        // cleanup
        if (videoPath)
            await fs
                .unlink(videoPath as string)
                .then(() => console.log(`Deleted video ${videoPath}`)); //async in production

        if (audioPath)
            await fs
                .unlink(audioPath as string)
                .then(() => console.log(`Deleted Audio ${audioPath}`)); //async in production
    }
};

connectDB();
handleTranscriptAndEmbedding();

import amqp, { Channel, Connection } from 'amqplib';
import { logErrorMessage, logSuccess, logWarning } from '../utils/log';
import {
    jobExchange,
    trancscriptAndEmbeddingQueue,
    transcriptAndEmbeddingRoutingKey,
} from './createTranscriptAndEmbeddingJob.publisher';
import s3 from './aws.S3Client';
import { donwloadFileFromS3 } from '../utils/downloadFileFromS3';
import path from 'path';
import { extractAudio } from '../utils/extractAudioFromvideo';

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
                logSuccess(`Received new job: ${JSON.stringify(content)}`);

                try {
                    const startTime = Date.now();
                    await processJob(content.key);
                    const timeTaken = Date.now() - startTime;

                    channel.ack(message);
                    logSuccess(`Completed job: ${JSON.stringify(content)} in ${timeTaken}ms \n`);
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

const processJob = async (key: string) => {
    const videoPath = await donwloadFileFromS3(
        key,
        path.join(__dirname, '..', 'temp', 'downloads')
    );

    const audioPath = await extractAudio(videoPath as string);
    console.log('audio path ', audioPath);
    return '';
};

handleTranscriptAndEmbedding();

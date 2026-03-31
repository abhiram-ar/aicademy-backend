import amqp from "amqplib";
import { logErrorMessage, logWarning } from "./../../utils/log";

// becareful when exporting these constancts as the function at end of this file will get executed
const jobExchange = "jobExchange";
const transcriptAndEmbeddingRoutingKey = "transcriptAndEmbeddingJob";
const trancscriptAndEmbeddingQueue = "createTranscriptAndEmbeddingJobQueue";

let connection: amqp.ChannelModel | null = null;

export async function connectToRabbitMQ() {
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL as string);
        console.log("connected to rabbitmq successfully in createTranscriptAndEmbeddingJob publisher");
        return connection;
    } catch (error: any) {
        logErrorMessage("error while connecting to rabbitmq in createTranscriptAndEmbeddingJob publisher");
        logErrorMessage(error.message);
        console.log(error);
    }
}




export const createTranscriptAndEmbeddingJob = async (key: string, videoId: string) => {

    if (!connection) {
        logWarning("no rabbitmq connection found in createTranscriptAndEmbeddingJob publisher, trying to connect...");
        await connectToRabbitMQ();

        if (!connection) {
            logErrorMessage("failed to connect to rabbitmq in createTranscriptAndEmbeddingJob publisher");
            return;
        }
    }

    const channel = await connection.createChannel();

    try {
        const message = { key, videoId };

        await channel.assertExchange(jobExchange, "direct", { durable: true });

        // create job queue - creation of queue is itempotent
        await channel.assertQueue(trancscriptAndEmbeddingQueue, {
            durable: true,
        });

        // bind the transctiandEmbedding job to trasnsciptAndEmbeding queue with routing key as the binding key
        await channel.bindQueue(
            trancscriptAndEmbeddingQueue,
            jobExchange,
            transcriptAndEmbeddingRoutingKey
        );

        // add logging for returend messages
        channel.on("return", (msg) => {
            logErrorMessage("Message returned: " + msg.content.toString());
        });

        channel.publish(
            jobExchange,
            transcriptAndEmbeddingRoutingKey,
            Buffer.from(JSON.stringify(message)),
            { mandatory: true } //handle unrouteable message
        );
    } catch (error: any) {
        logErrorMessage("error while creating a transcript and embedding job");
        logErrorMessage(error.message);
        console.log(error);
    } finally {
        await channel.close();
    }
};

// test
// createTranscriptAndEmbeddingJob('6762d2e79e4e6d9d0f66202d/Elon.mp4');

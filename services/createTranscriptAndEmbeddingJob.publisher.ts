import amqp from "amqplib";
import { logErrorMessage, logSuccess, logWarning } from "../utils/log";

export const jobExchange = "jobExchange";
export const transcriptAndEmbeddingRoutingKey = "transcriptAndEmbeddingJob";
export const trancscriptAndEmbeddingQueue =
    "createTranscriptAndEmbeddingJobQueue";

const createTranscriptAndEmbeddingJob = async (key: string) => {
    try {
        const connection = await amqp.connect("amqp://localhost");
        logSuccess("rabbitmq connected");

        const channel = await connection.createChannel();

        const message = { key };

        // create exchange if not exist
        await channel.assertExchange(jobExchange, "direct", { durable: true });

        // create job queue
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

        // schedule job
        channel.publish(
            jobExchange,
            transcriptAndEmbeddingRoutingKey,
            Buffer.from(JSON.stringify(message)),
            { mandatory: true } //handle unrouteable message
        );

        setTimeout(async () => {
            logWarning("closing rabbit mq connection");
            await connection.close();
        }, 1000);
    } catch (error) {
        logErrorMessage("error while creating a transcript and embedding job");
        logErrorMessage(error.message);
        console.log(error);
    }
};

// test
// createTranscriptAndEmbeddingJob("6762d2e79e4e6d9d0f66202d/Elon.mp4");

createTranscriptAndEmbeddingJob("6762d2e79e4e6d9d0f66202d/Elon.mp4");

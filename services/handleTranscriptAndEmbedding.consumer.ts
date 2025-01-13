import amqp from "amqplib";
import { logErrorMessage, logSuccess, logWarning } from "../utils/log";
import {
    jobExchange,
    trancscriptAndEmbeddingQueue,
    transcriptAndEmbeddingRoutingKey,
} from "./createTranscriptAndEmbeddingJob.publisher";

const handleTranscriptAndEmbedding = async () => {
    try {
        const connection = await amqp.connect("amqp://localhost");
        console.log("consumer: Rabitmq connected successfully");

        const channel = await connection.createChannel();
        await channel.assertExchange(jobExchange, "direct", { durable: false });
        await channel.assertQueue(trancscriptAndEmbeddingQueue, {
            durable: false,
        });

        await channel.bindQueue(
            trancscriptAndEmbeddingQueue,
            jobExchange,
            transcriptAndEmbeddingRoutingKey
        );

        logSuccess(
            `Waiting for messages in queue: ${trancscriptAndEmbeddingQueue}`
        );

        // handle one job at a time - increase this in production
        channel.prefetch(1);

        channel.consume(
            trancscriptAndEmbeddingQueue,
            async (message) => {
                if (message) {
                    const content = JSON.parse(message.content.toString());
                    logSuccess(`Received job: ${JSON.stringify(content)}`);

                    try {
                        await processJob(content);
                        channel.ack(message);
                    } catch (error) {
                        logErrorMessage(
                            "error while proceesing transcript and embeddiing job"
                        );
                        logErrorMessage(error.message);
                        console.log(error);
                        channel.nack(message, false, true);
                    }
                }
            },
            { noAck: false }
        );

        // gradefully close connection if process is killed
        process.on("SIGINT", async () => {
            logWarning("Closing RabbitMQ connection...");
            try {
                await connection.close();
                logSuccess("RabbitMQ connection closed. Exiting process.");
                process.exit(0);
            } catch (error) {
                logErrorMessage("Error closing RabbitMQ connection");
                console.log(error);
                process.exit(1);
            }
        });
    } catch (error) {
        logErrorMessage("failed to start transcript and Embedding job");
        logErrorMessage(error.message);
        console.log(error);
    }
};

const processJob = (content) => {
    console.log("processing job", content);
};

handleTranscriptAndEmbedding();

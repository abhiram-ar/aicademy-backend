import { QdrantVectorStore } from "@langchain/qdrant";
import { embedding } from "../services/OpenAI";
import { logErrorMessage } from "../utils/log";

let cachedVectorStore: QdrantVectorStore | null = null;

async function connectToVectorStore() {
    try {
        if (!cachedVectorStore) {
            console.log("Initializing vector store connection...");
            cachedVectorStore = await QdrantVectorStore.fromExistingCollection(embedding, {
                url: process.env.QDRANT_URL,
                apiKey: process.env.QDRANT_API_KEY,
                collectionName: "langchainjs-test2",

            });

            await cachedVectorStore.client.createPayloadIndex("langchainjs-test2", {
                field_name: "metadata.key",
                field_schema: "keyword",
            });

            if (!cachedVectorStore.client) throw new Error("failed to connect to qdrant");

            console.log("connected to qdrant successfully");
            return cachedVectorStore;
        } else {
            console.log("using the cached vector store connection");
            return cachedVectorStore;
        }
    } catch (error) {
        logErrorMessage("Error connecting to qdrant");
        console.log(error);
        console.log("trying to reconnect to qdrant...");
        setTimeout(connectToVectorStore, 3000);
    }
}

export default connectToVectorStore();

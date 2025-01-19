import { QdrantVectorStore } from '@langchain/qdrant';
import { embedding } from '../services/OpenAI';

const vectorStore = await QdrantVectorStore.fromExistingCollection(embedding, {
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: 'langchainjs-test2',
});

export default vectorStore;

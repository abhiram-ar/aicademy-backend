import { QdrantVectorStore } from '@langchain/qdrant';
import { OpenAIEmbeddings, OpenAI, ChatOpenAI } from '@langchain/openai';
import { RunnableSequence } from '@langchain/core/runnables';
import { PromptTemplate } from '@langchain/core/prompts';

import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const embedding = new OpenAIEmbeddings({
    model: 'text-embedding-3-large',
    openAIApiKey: process.env.OPENAI_API_KEY,
});

const getAnswer = async (query: string) => {
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embedding, {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: 'langchainjs-test2',
    });

    const template = `Based on the video titled "Elon musks advise to young people". Use the following pieces of context to answer the question at the end.
    If you don't find any context to anwer the question, just say that you don't know, don't try to make up an answer also give a useful message to the user about the question if you cant comeup with the answer. 
     Question: {question}
     helpful answer: `;

    const prompt = PromptTemplate.fromTemplate(template);

    const llm = new ChatOpenAI({
        model: 'gpt-4o-mini',
        temperature: 0,
    });

    const result = await vectorStore.similaritySearch(query, 5, {
        must: [{ key: 'metadata.key', match: { value: '6762d2e79e4e6d9d0f66202d/Elon.mp4' } }],
    });
    console.log(result);

    // runnable sequence - is where the output of each state is the input to next
    const chain = RunnableSequence.from([
        {
            context: async () => {
                const results = await vectorStore.similaritySearch(query, 3, {
                    must: [{ key: 'metadata.key', match: { value: 'video2' } }],
                });
                return results.map((doc) => doc.pageContent).join('\n');
            },
            question: () => query,
        },
        prompt,
        llm,
    ]);

    const answer = await chain.invoke({});
    console.log(answer);
};

getAnswer('How to be useful in life according to elon ');

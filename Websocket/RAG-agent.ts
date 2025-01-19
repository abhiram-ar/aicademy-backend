import 'dotenv/config';
import { llm } from '../services/OpenAI';
import vectorStore from '../config/Qdrant';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Annotation, StateGraph } from '@langchain/langgraph';
import { Document } from '@langchain/core/documents';

const promptTemplate = ChatPromptTemplate.fromMessages([
    [
        'user',
        "You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question on the video titled '{title}'. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise. Question: {question} Context: {context} Answer:",
    ],
]);

// input state
const inputStateAnnotaion = Annotation.Root({
    question: Annotation<string>,
    key: Annotation<string>,
    title: Annotation<string>,
});

const stateAnnotation = Annotation.Root({
    question: Annotation<string>,
    key: Annotation<string>,
    title: Annotation<string>,
    context: Annotation<Document[]>,
    answer: Annotation<string>,
});

const retriveSimilarDocs = async (state: typeof inputStateAnnotaion.State) => {
    const retirvedDocs = await vectorStore.similaritySearch(state.question, undefined, {
        must: [{ key: 'metadata.key', match: { value: state.key } }],
    });
    return { context: retirvedDocs };
};

const generateAnswer = async (state: typeof stateAnnotation.State) => {
    const mergedDocs = state.context.map((doc) => doc.pageContent).join('\n');
    const prompt = await promptTemplate.invoke({
        title: state.title,
        question: state.question,
        context: mergedDocs,
    });

    const response = await llm.invoke(prompt);
    return { answer: response };
};

const graph = new StateGraph(stateAnnotation)
    .addNode('retrive', retriveSimilarDocs)
    .addNode('generate', generateAnswer)
    .addEdge('__start__', 'retrive')
    .addEdge('retrive', 'generate')
    .addEdge('generate', '__end__')
    .compile();

export default graph;

// const input = { question: 'which books to read' };
// graph.invoke(input).then((result) => console.log(result.answer));

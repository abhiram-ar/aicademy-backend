import { WebSocket } from 'ws';
import { logErrorMessage } from '../utils/log';
import graph from './RAG-agent';

export const handleRAGQuestion = async (msg, ws: WebSocket) => {
    try {
        const data = JSON.parse(msg as unknown as string);
        const response = await graph.invoke({
            question: data.question,
            title: data.title,
            key: data.key,
        });
        // console.log(response);

        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(response.answer)); //send answer.content to save bandwidth
    } catch (error) {
        logErrorMessage('failed to parse of send message');
        console.log(error);
        ws.send('Something went wrong!');
    }
};

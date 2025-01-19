import app from './app.ts';
import 'dotenv/config';
import connectDB from './config/mongoose.ts';
import { WebSocketServer, WebSocket } from 'ws';
import { authenticateWSClient } from './Websocket/authenticateClient.ts';
import { onPreSocketError } from './Websocket/onPreSocketError.ts';
import { IncomingMessage } from 'http';
import { logErrorMessage, logSuccess } from './utils/log.ts';
import graph from './Websocket/RAG-agent.ts';

connectDB();

const PORT = process.env.PORT || 3001;
const httpServer = app.listen(PORT, () => {
    console.log(`servers is running on port ${PORT}`);
});

const wss = new WebSocketServer({ noServer: true });

httpServer.on('upgrade', async (req, socket, head) => {
    // listen for error events which might occur during connection updrade process
    socket.on('error', (error) => onPreSocketError(error, socket));

    let client: string | undefined;
    try {
        client = await authenticateWSClient(req);
        if (!client) throw new Error('no client found');
    } catch (error) {
        console.log(error);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
        socket.removeListener('error', onPreSocketError);
        wss.emit('connection', ws, req, client);
    });
});

wss.on('connection', (ws: WebSocket, request: IncomingMessage, connectingClientUserId: string) => {
    logSuccess(`New connection established: userId:${connectingClientUserId}`);

    ws.on('error', (err) => {
        console.error('Websocket error', { message: err.message, client: connectingClientUserId });
    });

    ws.on('message', async (msg) => {
        try {
            const data = JSON.parse(msg as unknown as string);
            const response = await graph.invoke({
                question: data.question,
                title: data.title,
                key: data.key,
            });
            console.log(response);

            if (ws.readyState === WebSocket.OPEN)
                ws.send('This is your new response:' + response.answer.content);
        } catch (error) {
            logErrorMessage('failed to parse of send message');
            console.log(error);
            ws.send('Something went wrong!');
        }
    });

    ws.on('close', () => {
        console.log(`Closing websocket connection for {userId:${connectingClientUserId}}`);
        //furthur cleanup if necessary
    });
});

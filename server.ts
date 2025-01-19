import app from './app.ts';
import 'dotenv/config';
import connectDB from './config/mongoose.ts';
import { WebSocketServer, WebSocket } from 'ws';
import { authenticateWSClient } from './Websocket/authenticateClient.ts';
import { onPreSocketError } from './Websocket/onPreSocketError.ts';

connectDB();

const PORT = process.env.PORT || 3001;
const httpServer = app.listen(PORT, () => {
    console.log(`servers is running on port ${PORT}`);
});

const wss = new WebSocketServer({ noServer: true });

httpServer.on('upgrade', async (req, socket, head) => {
    socket.on('error', (error) => onPreSocketError(error, socket));

    let client: string | undefined;
    try {
        client = await authenticateWSClient(req);
        if (!client) throw new Error('no client found');
    } catch (error) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
        socket.removeListener('error', onPreSocketError);
        wss.emit('connection', ws, req, client);
    });
});

wss.on('connection', (ws, request) => {
    ws.on('error', console.error);
    ws.on('message', (msg, isBinary) => {
        console.log('recived message:' + msg);
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send('hello from server');
            }
        });
    });

    ws.on('close', () => {
        console.log('closing  ws connection');
        //cleanup
    });
});

import internal from 'stream';
import { logErrorMessage } from '../utils/log';

export const onPreSocketError = (error: Error, socket: internal.Duplex) => {
    logErrorMessage('error while upgradingn connection to websocket');
    console.log(error);
    if (!socket.destroyed) socket.destroy();
};

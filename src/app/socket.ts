/*import WebSocket from 'ws';
import console from "console";

const wss = new WebSocket.Server({ host: process.env.HOST, port: 3332 });
const connectedClients = new Set();

wss.on('connection', (ws) => {
    console.log('New client connected');

    connectedClients.add(ws); 

    ws.on('message', async (message: any) => {
        try {
            const newMessage = JSON.parse(message);
            console.log({newMessage});
            connectedClients.forEach((client) => {
                // @ts-ignore
                client.send(JSON.stringify({data: newMessage}));
                console.log("Sending messing to client with type:", newMessage.type);
            });
            
        } catch (error) {
            console.error('Error parsing message:', error);
        }    
    });
    ws.on('close', () => {
        console.log('Client disconnected');
        connectedClients.delete(ws); 
    });
});*/
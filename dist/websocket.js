"use strict";
// @ts-nocheck
const WebSocket = require("ws");
const url = require("url");
let wss;
const clients = new Set();
function setupWebSocketServer(server) {
    wss = new WebSocket.Server({ noServer: true });
    server.on("upgrade", (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit("connection", ws, request);
        });
    });
    wss.on("connection", (ws, req) => {
        console.log("Client connected to WebSocket.");
        const location = url.parse(req.url, true);
        const queryParams = location.query;
        const userUuid = queryParams.uuid;
        clients.add({
            webSocket: ws,
            uuid: userUuid,
        });
        ws.on("message", (message) => {
            console.log(`Received message: ${message}`);
            ws.send(`Echo back: ${message}`);
        });
        ws.on("close", () => {
            clients.forEach((client) => {
                if (client?.uuid === userUuid) {
                    clients.delete(client);
                }
            });
            console.log(`User: ${userUuid} has disconnected`);
        });
    });
    return wss;
}
function closeServer(server) {
    console.log("Closing HTTP server...");
    server.close(() => {
        console.log("HTTP server closed.");
    });
    console.log("Closing WebSocket connections...");
    clients.forEach((client) => {
        if (client?.webSocket?.readyState === WebSocket.OPEN) {
            client?.webSocket?.close();
        }
    });
    wss.close(() => {
        console.log("WebSocket server closed.");
    });
}
module.exports = { setupWebSocketServer, clients, closeServer, WebSocket };

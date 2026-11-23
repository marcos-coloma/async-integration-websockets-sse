
import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";

const app = express();
const server = createServer(app);

const PORT = Number(process.env.PORT) || 3000;

// HTTP
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

// WebSocket
const wss = new WebSocketServer({
    server,
    path: "/ws",
});

wss.on("connection", (socket) => {
    console.log("Participante conectado");

    socket.send(
        JSON.stringify({
        type: "welcome",
        message: "WebSocket conectado correctamente",
        })
    );

    socket.on("close", () => {
        console.log("Participante desconectado");
    });
});

// SSE
app.get("/events", (_req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.write(
        `event: connected\ndata: ${JSON.stringify({
        message: "SSE conectado correctamente",
        })}\n\n`
    );
});

server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

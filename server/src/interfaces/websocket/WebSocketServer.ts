import type { Server } from "node:http";
import { WebSocketServer as WsServer } from "ws";
import type { WebSocketConnectionHandler } from "./WebSocketConnectionHandler";

export class WebSocketServer {
    private readonly server: WsServer;

    constructor(
        httpServer: Server,
        connectionHandler: WebSocketConnectionHandler
    ) {
        this.server = new WsServer({
            server: httpServer,
            path: "/ws"
        });

        this.server.on("connection", (socket) => {
            connectionHandler.handleConnection(socket);
        });
    }
}
import type { WebSocket } from "ws";
import type { RawData } from "ws";

import type { ParticipantService } from "../../application/services/ParticipantService";
import type { WebSocketMessageHandler } from "./WebSocketMessageHandler";
import type { WebSocketBroadcaster } from "./WebSocketBroadcaster";

export interface WebSocketConnectionContext {
    participantId?: string;
}

export class WebSocketConnectionHandler {
    constructor(
        private readonly participantService: ParticipantService,
        private readonly messageHandler: WebSocketMessageHandler,
        private readonly broadcaster: WebSocketBroadcaster
    ) {}

    handleConnection(socket: WebSocket): void {
        const context: WebSocketConnectionContext = {};

        socket.on("message", (data: RawData) => {
            if (socket.readyState !== 1) return;

            void this.messageHandler.handleMessage(socket, data, context);
        });

        socket.on("close", () => {
            if (!context.participantId) return;

            this.participantService.disconnect(context.participantId);
            this.broadcaster.broadcastState();
        });
    }
}

import type { WebSocket } from "ws";
import type { RawData } from "ws";

import type { ParticipantService } from "../../application/services/ParticipantService";
import type { ProductService } from "../../application/services/ProductService";
import type { VoteService } from "../../application/services/VoteService";

import { ParticipantError } from "../../application/errors/ParticipantError";

import type { WebSocketConnectionContext } from "./WebSocketConnectionHandler";
import type { WebSocketMessageValidator } from "./WebSocketMessageValidator";
import type { WebSocketBroadcaster } from "./WebSocketBroadcaster";
import type { SSEBroadcaster } from "../sse/SSEBroadcaster";

export class WebSocketMessageHandler {
    constructor(
        private readonly participantService: ParticipantService,
        private readonly productService: ProductService,
        private readonly voteService: VoteService,
        private readonly validator: WebSocketMessageValidator,
        private readonly broadcaster: WebSocketBroadcaster,
        private readonly sseBroadcaster: SSEBroadcaster
    ) {}

    async handleMessage(
        socket: WebSocket,
        data: RawData,
        context: WebSocketConnectionContext
    ): Promise<void> {
        try {
            const validation = this.validator.validate(data);

            if (!validation.valid) {
                this.sendError(socket, validation.code, validation.message);
                return;
            }

            const message = validation.message;

            if (message.type !== "join" && !context.participantId) {
                this.sendError(
                    socket,
                    "NOT_AUTHORIZED",
                    "You must join before performing actions."
                );
                return;
            }

            switch (message.type) {
                case "join": {
                    if (context.participantId) {
                        this.sendError(
                            socket,
                            "NOT_AUTHORIZED",
                            "This connection already has a participant."
                        );
                        return;
                    }

                    const participant = this.participantService.join(message.name);

                    context.participantId = participant.id;

                    this.broadcaster.sendInitialState(socket, participant.id);
                    this.broadcastState(socket);
                    break;
                }

                case "change_name": {
                    const participant = this.participantService.changeName(
                        context.participantId!,
                        message.name
                    );

                    if (!participant) {
                        this.sendError(
                            socket,
                            "NOT_AUTHORIZED",
                            "Participant not found."
                        );
                        return;
                    }

                    this.sendActionResult(socket, "change_name", true);
                    this.broadcastState();
                    break;
                }

                case "propose_products": {
                    const result = await this.productService.proposeProducts(
                        context.participantId!,
                        message.productIds
                    );

                    this.sendActionResult(
                        socket,
                        "propose_products",
                        result.success,
                        {
                            added: result.added,
                            failed: result.failed
                        }
                    );

                    if (result.added.length > 0) {
                        this.broadcastState();
                    }
                    break;
                }

                case "vote": {
                    const result = this.voteService.vote(
                        context.participantId!,
                        message.productId
                    );

                    if (result !== "voted") {
                        this.sendError(
                            socket,
                            result === "already_voted"
                                ? "DUPLICATE_VOTE"
                                : result === "not_found"
                                    ? "NOT_FOUND"
                                    : "NOT_AUTHORIZED",
                            result
                        );
                        return;
                    }

                    this.sendActionResult(socket, "vote", true);
                    this.broadcastState();
                    break;
                }

                case "remove_vote": {
                    const result = this.voteService.removeVote(
                        context.participantId!,
                        message.productId
                    );

                    if (
                        result === "not_found" ||
                        result === "not_authorized"
                    ) {
                        this.sendError(
                            socket,
                            result === "not_found"
                                ? "NOT_FOUND"
                                : "NOT_AUTHORIZED",
                            result
                        );
                        return;
                    }

                    this.sendActionResult(socket, "remove_vote", true);

                    if (result === "removed") {
                        this.broadcastState();
                    }
                    break;
                }

                case "remove_product": {
                    const result = this.productService.removeProduct(
                        context.participantId!,
                        message.productId
                    );

                    if (result !== "removed") {
                        this.sendError(
                            socket,
                            result === "not_found"
                                ? "NOT_FOUND"
                                : "NOT_AUTHORIZED",
                            result
                        );
                        return;
                    }

                    this.sendActionResult(socket, "remove_product", true);
                    this.broadcastState();
                    break;
                }
            }
        } catch (error) {
            if (error instanceof ParticipantError) {
                this.sendError(socket, error.code, error.message);
                return;
            }

            console.error("WebSocket message handling failed:", error);

            this.sendError(
                socket,
                "INTERNAL_ERROR",
                "An unexpected server error occurred."
            );
        }
    }

    private broadcastState(exclude?: WebSocket): void {
        this.broadcaster.broadcastState(exclude);
        this.sseBroadcaster.broadcastState();
    }

    private sendActionResult(
        socket: WebSocket,
        action: string,
        success: boolean,
        details: Record<string, unknown> = {}
    ): void {
        this.send(socket, {
            type: "action_result",
            action,
            success,
            ...details
        });
    }

    private sendError(
        socket: WebSocket,
        code: string,
        message: string
    ): void {
        this.send(socket, {
            type: "error",
            code,
            message
        });
    }

    private send(socket: WebSocket, message: unknown): void {
        if (socket.readyState === 1) {
            socket.send(JSON.stringify(message));
        }
    }
}

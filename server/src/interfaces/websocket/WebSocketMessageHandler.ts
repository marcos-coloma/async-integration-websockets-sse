
import type { WebSocket, RawData } from "ws";

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

            await this.dispatchMessage(socket, message, context);
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

    private async dispatchMessage(
        socket: WebSocket,
        message: ReturnType<WebSocketMessageValidator["validate"]> extends infer R
            ? R extends { valid: true; message: infer M }
                ? M
                : never
            : never,
        context: WebSocketConnectionContext
    ): Promise<void> {
        switch (message.type) {
            case "join":
                this.handleJoin(socket, message.name, context);
                break;

            case "change_name":
                this.handleChangeName(socket, context.participantId!, message.name);
                break;

            case "propose_products":
                await this.handleProposeProducts(
                    socket,
                    context.participantId!,
                    message.productIds
                );
                break;

            case "vote":
                this.handleVote(
                    socket,
                    context.participantId!,
                    message.productId
                );
                break;

            case "remove_vote":
                this.handleRemoveVote(
                    socket,
                    context.participantId!,
                    message.productId
                );
                break;

            case "remove_product":
                this.handleRemoveProduct(
                    socket,
                    context.participantId!,
                    message.productId
                );
                break;
        }
    }

    private handleJoin(
        socket: WebSocket,
        name: string,
        context: WebSocketConnectionContext
    ): void {
        if (context.participantId) {
            this.sendError(
                socket,
                "NOT_AUTHORIZED",
                "This connection already has a participant."
            );
            return;
        }

        const participant = this.participantService.join(name);

        context.participantId = participant.id;

        this.broadcaster.sendInitialState(socket, participant.id);
        this.broadcastState(socket);
    }

    private handleChangeName(
        socket: WebSocket,
        participantId: string,
        name: string
    ): void {
        const participant = this.participantService.changeName(
            participantId,
            name
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
    }

    private async handleProposeProducts(
        socket: WebSocket,
        participantId: string,
        productIds: number[]
    ): Promise<void> {
        const result = await this.productService.proposeProducts(
            participantId,
            productIds
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
    }

    private handleVote(
        socket: WebSocket,
        participantId: string,
        productId: number
    ): void {
        const result = this.voteService.vote(participantId, productId);

        if (result !== "voted") {
            const errorCode =
                result === "already_voted"
                    ? "DUPLICATE_VOTE"
                    : result === "not_found"
                        ? "NOT_FOUND"
                        : "NOT_AUTHORIZED";

            this.sendError(socket, errorCode, result);
            return;
        }

        this.sendActionResult(socket, "vote", true);
        this.broadcastState();
    }

    private handleRemoveVote(
        socket: WebSocket,
        participantId: string,
        productId: number
    ): void {
        const result = this.voteService.removeVote(
            participantId,
            productId
        );

        if (result === "not_found" || result === "not_authorized") {
            this.sendError(
                socket,
                result === "not_found" ? "NOT_FOUND" : "NOT_AUTHORIZED",
                result
            );
            return;
        }

        this.sendActionResult(socket, "remove_vote", true);

        if (result === "removed") {
            this.broadcastState();
        }
    }

    private handleRemoveProduct(
        socket: WebSocket,
        participantId: string,
        productId: number
    ): void {
        const result = this.productService.removeProduct(
            participantId,
            productId
        );

        if (result !== "removed") {
            this.sendError(
                socket,
                result === "not_found" ? "NOT_FOUND" : "NOT_AUTHORIZED",
                result
            );
            return;
        }

        this.sendActionResult(socket, "remove_product", true);
        this.broadcastState();
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


import { afterAll, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import { createServer, type Server } from "node:http";
import { WebSocket as ClientWebSocket } from "ws";

import type { AppState } from "../../src/domain/state/AppState";
import type { CatalogProvider } from "../../src/application/ports/CatalogProvider";

import { MemoryParticipantRepository } from "../../src/infrastructure/repositories/MemoryParticipantRepository";
import { MemoryProductRepository } from "../../src/infrastructure/repositories/MemoryProductRepository";
import { MemoryVoteRepository } from "../../src/infrastructure/repositories/MemoryVoteRepository";

import { ParticipantService } from "../../src/application/services/ParticipantService";
import { ProductService } from "../../src/application/services/ProductService";
import { VoteService } from "../../src/application/services/VoteService";

import { SSEBroadcaster } from "../../src/interfaces/sse/SSEBroadcaster";
import { WebSocketBroadcaster } from "../../src/interfaces/websocket/WebSocketBroadcaster";
import { WebSocketConnectionHandler } from "../../src/interfaces/websocket/WebSocketConnectionHandler";
import { WebSocketMessageHandler } from "../../src/interfaces/websocket/WebSocketMessageHandler";
import { WebSocketMessageValidator } from "../../src/interfaces/websocket/WebSocketMessageValidator";
import { WebSocketServer } from "../../src/interfaces/websocket/WebSocketServer";

describe("WebSocket integration", () => {
    let server: Server;
    let baseUrl: string;

    const clients = new Set<ClientWebSocket>();

    beforeAll(async () => {
        const state: AppState = {
            participants: new Map(),
            products: new Map(),
            votes: []
        };

        const participantRepository = new MemoryParticipantRepository(state);
        const productRepository = new MemoryProductRepository(state);
        const voteRepository = new MemoryVoteRepository(state);

        const participantService = new ParticipantService(participantRepository);

        const catalogProvider: CatalogProvider = {
            findById: async () => {
                throw new Error("Catalog should not be called in this test");
            }
        };

        const productService = new ProductService(
            catalogProvider,
            productRepository,
            participantRepository,
            voteRepository
        );

        const voteService = new VoteService(
            voteRepository,
            productRepository,
            participantRepository
        );

        const sseBroadcaster = new SSEBroadcaster(
            participantRepository,
            productRepository,
            voteRepository
        );

        const webSocketBroadcaster = new WebSocketBroadcaster(
            participantRepository,
            productRepository,
            voteRepository
        );

        const messageHandler = new WebSocketMessageHandler(
            participantService,
            productService,
            voteService,
            new WebSocketMessageValidator(),
            webSocketBroadcaster,
            sseBroadcaster
        );

        const connectionHandler = new WebSocketConnectionHandler(
            participantService,
            messageHandler,
            webSocketBroadcaster,
            sseBroadcaster
        );

        const app = express();
        server = createServer(app);

        new WebSocketServer(server, connectionHandler);

        await new Promise<void>((resolve, reject) => {
            server.once("error", reject);
            server.listen(0, "127.0.0.1", resolve);
        });

        const address = server.address();

        if (!address || typeof address === "string") {
            throw new Error("Could not determine server address");
        }

        baseUrl = `ws://127.0.0.1:${address.port}/ws`;
    });

    afterAll(async () => {
        await Promise.all(
            Array.from(clients).map(socket =>
                new Promise<void>(resolve => {
                    if (socket.readyState === ClientWebSocket.CLOSED) {
                        resolve();
                        return;
                    }

                    socket.once("close", () => resolve());
                    socket.close();
                })
            )
        );

        await new Promise<void>((resolve, reject) => {
            server.close(error => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve();
            });
        });
    });

    function connect(): Promise<ClientWebSocket> {
        return new Promise((resolve, reject) => {
            const socket = new ClientWebSocket(baseUrl);

            clients.add(socket);

            socket.once("open", () => resolve(socket));
            socket.once("error", reject);
        });
    }

    function nextMessage(socket: ClientWebSocket): Promise<any> {
        return new Promise(resolve => {
            socket.once("message", data => {
                resolve(JSON.parse(data.toString()));
            });
        });
    }

    it("should join a participant and send the initial state", async () => {
        const socket = await connect();

        const messagePromise = nextMessage(socket);

        socket.send(JSON.stringify({
            type: "join",
            name: "Marcos"
        }));

        const message = await messagePromise;

        expect(message.type).toBe("initial_state");
        expect(message.participantId).toBeDefined();
        expect(message.participants).toHaveLength(1);
        expect(message.participants[0].name).toBe("Marcos");
        expect(message.products).toEqual([]);
        expect(message.votes).toEqual([]);
    });

    it("should reject actions before joining", async () => {
        const socket = await connect();

        const messagePromise = nextMessage(socket);

        socket.send(JSON.stringify({
            type: "vote",
            productId: 1
        }));

        const message = await messagePromise;

        expect(message.type).toBe("error");
        expect(message.code).toBe("NOT_AUTHORIZED");
    });
});

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import { createServer, type Server } from "node:http";

import type { AppState } from "../../src/domain/state/AppState";
import { MemoryParticipantRepository } from "../../src/infrastructure/repositories/MemoryParticipantRepository";
import { MemoryProductRepository } from "../../src/infrastructure/repositories/MemoryProductRepository";
import { MemoryVoteRepository } from "../../src/infrastructure/repositories/MemoryVoteRepository";
import { SSEBroadcaster } from "../../src/interfaces/sse/SSEBroadcaster";
import { SSEConnectionHandler } from "../../src/interfaces/sse/SSEConnectionHandler";

describe("SSE integration", () => {
    let server: Server;
    let baseUrl: string;
    let reader: ReadableStreamDefaultReader<Uint8Array>;

    let state: AppState;
    let broadcaster: SSEBroadcaster;

    beforeAll(async () => {
        state = {
            participants: new Map(),
            products: new Map(),
            votes: []
        };

        const participantRepository = new MemoryParticipantRepository(state);
        const productRepository = new MemoryProductRepository(state);
        const voteRepository = new MemoryVoteRepository(state);

        broadcaster = new SSEBroadcaster(
            participantRepository,
            productRepository,
            voteRepository
        );

        const app = express();
        const connectionHandler = new SSEConnectionHandler(broadcaster);

        connectionHandler.register(app);

        server = createServer(app);

        await new Promise<void>((resolve, reject) => {
            server.once("error", reject);
            server.listen(0, "127.0.0.1", resolve);
        });

        const address = server.address();

        if (!address || typeof address === "string") {
            throw new Error("Could not determine server address");
        }

        baseUrl = `http://127.0.0.1:${address.port}`;
    });

    afterAll(async () => {
        if (reader) {
            await reader.cancel();
        }

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

    it("should send the initial state and subsequent updates", async () => {
        const response = await fetch(`${baseUrl}/events`);

        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toContain("text/event-stream");

        reader = response.body!.getReader();

        const decoder = new TextDecoder();

        // Initial state
        const initialChunk = await reader.read();
        const initialEvent = decoder.decode(initialChunk.value);

        expect(initialEvent).toContain("event: initial_state");
        expect(initialEvent).toContain(
            'data: {"participants":[],"products":[],"votes":[]}'
        );

        // Simulate a state change
        state.participants.set("1", {
            id: "1",
            name: "Marcos"
        });

        broadcaster.broadcastState();

        const updateChunk = await reader.read();
        const updateEvent = decoder.decode(updateChunk.value);

        expect(updateEvent).toContain("event: state_update");
        expect(updateEvent).toContain('"name":"Marcos"');
    });
});

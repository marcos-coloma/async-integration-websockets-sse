import "dotenv/config";

import express from "express";
import { createServer } from "node:http";

import { env } from "./config/env";

// Domain
import type { AppState } from "./domain/state/AppState";

// Repositories
import { MemoryParticipantRepository } from "./infrastructure/repositories/MemoryParticipantRepository";
import { MemoryProductRepository } from "./infrastructure/repositories/MemoryProductRepository";
import { MemoryVoteRepository } from "./infrastructure/repositories/MemoryVoteRepository";

// Catalog
import { DummyJsonCatalogProvider } from "./infrastructure/catalog/DummyJsonCatalogProvider";

// Application services
import { ParticipantService } from "./application/services/ParticipantService";
import { ProductService } from "./application/services/ProductService";
import { VoteService } from "./application/services/VoteService";

// HTTP
import HealthRoutes from "./interfaces/http/HealthRoutes";

// SSE
import { SSEBroadcaster } from "./interfaces/sse/SSEBroadcaster";
import { SSEConnectionHandler } from "./interfaces/sse/SSEConnectionHandler";

// WebSocket
import { WebSocketBroadcaster } from "./interfaces/websocket/WebSocketBroadcaster";
import { WebSocketConnectionHandler } from "./interfaces/websocket/WebSocketConnectionHandler";
import { WebSocketMessageHandler } from "./interfaces/websocket/WebSocketMessageHandler";
import { WebSocketMessageValidator } from "./interfaces/websocket/WebSocketMessageValidator";
import { WebSocketServer } from "./interfaces/websocket/WebSocketServer";

// Application setup
const app = express();
const server = createServer(app);

app.use(express.json());

// Shared state
const state: AppState = {
    participants: new Map(),
    products: new Map(),
    votes: []
};

// Repositories
const participantRepository = new MemoryParticipantRepository(state);
const productRepository = new MemoryProductRepository(state);
const voteRepository = new MemoryVoteRepository(state);

// Catalog
const catalogProvider = new DummyJsonCatalogProvider();

// Application services
const participantService = new ParticipantService(
    participantRepository
);

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

// SSE
const sseBroadcaster = new SSEBroadcaster(
    participantRepository,
    productRepository,
    voteRepository
);

const sseConnectionHandler = new SSEConnectionHandler(
    sseBroadcaster
);

// WebSocket
const webSocketBroadcaster = new WebSocketBroadcaster(
    participantRepository,
    productRepository,
    voteRepository
);

const webSocketValidator = new WebSocketMessageValidator();

const webSocketMessageHandler = new WebSocketMessageHandler(
    participantService,
    productService,
    voteService,
    webSocketValidator,
    webSocketBroadcaster,
    sseBroadcaster
);

const webSocketConnectionHandler = new WebSocketConnectionHandler(
    participantService,
    webSocketMessageHandler,
    webSocketBroadcaster,
    sseBroadcaster
);

// Register interfaces
app.use(HealthRoutes);

sseConnectionHandler.register(app);

new WebSocketServer(
    server,
    webSocketConnectionHandler
);

// Start server
server.listen(env.port, () => {
    console.log(`Server listening on http://localhost:${env.port}`);
});
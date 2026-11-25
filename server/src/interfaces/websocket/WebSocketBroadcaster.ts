import type { WebSocket } from "ws";

import type { ParticipantRepository } from "../../domain/repositories/ParticipantRepository";
import type { ProductRepository } from "../../domain/repositories/ProductRepository";
import type { VoteRepository } from "../../domain/repositories/VoteRepository";

export class WebSocketBroadcaster {
    private readonly clients = new Set<WebSocket>();

    constructor(
        private readonly participantRepository: ParticipantRepository,
        private readonly productRepository: ProductRepository,
        private readonly voteRepository: VoteRepository
    ) {}

    private getState() {
        return {
            participants: this.participantRepository.findAll(),
            products: this.productRepository.findAll(),
            votes: this.voteRepository.findAll()
        };
    }

    private send(client: WebSocket, message: unknown): void {
        if (client.readyState !== 1) return;

        client.send(JSON.stringify(message));
    }

    sendInitialState(client: WebSocket, participantId: string): void {
        this.clients.add(client);

        this.send(client, {
            type: "initial_state",
            participantId,
            ...this.getState()
        });
    }

    removeClient(client: WebSocket): void {
        this.clients.delete(client);
    }

    broadcastState(exclude?: WebSocket): void {
        const state = this.getState();

        for (const client of this.clients) {
            if (client.readyState !== 1) {
                this.removeClient(client);
                continue;
            }

            if (client === exclude) continue;

            this.send(client, {
                type: "state_update",
                ...state
            });
        }
    }
}
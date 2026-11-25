import type { Response } from "express";
import type { ParticipantRepository } from "../../domain/repositories/ParticipantRepository";
import type { ProductRepository } from "../../domain/repositories/ProductRepository";
import type { VoteRepository } from "../../domain/repositories/VoteRepository";

export class SSEBroadcaster {
    private readonly clients = new Set<Response>();

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

    private sendEvent(
        client: Response,
        event: string,
        data: unknown
    ): void {
        client.write(
            `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        );
    }

    addClient(client: Response): void {
        this.clients.add(client);
        this.sendEvent(client, "initial_state", this.getState());
    }

    removeClient(client: Response): void {
        this.clients.delete(client);
    }

    broadcastState(): void {
        const state = this.getState();

        for (const client of this.clients) {
            if (client.destroyed || client.writableEnded) {
                this.removeClient(client);
                continue;
            }

            this.sendEvent(client, "state_update", state);
        }
    }
}
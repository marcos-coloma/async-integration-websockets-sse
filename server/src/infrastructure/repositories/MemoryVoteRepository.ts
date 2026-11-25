import type { Vote } from "../../domain/entities/Vote";
import type { AppState } from "../../domain/state/AppState";
import { VoteRepository } from "../../domain/repositories/VoteRepository";

export class MemoryVoteRepository implements VoteRepository {
    constructor(private readonly state: AppState) {}

    findAll(): Vote[] {
        return [...this.state.votes];
    }

    findByProductId(productId: number): Vote[] {
        return this.state.votes.filter(
            vote => vote.productId === productId
        );
    }

    findByParticipantAndProduct(
        participantId: string,
        productId: number
    ): Vote | undefined {
        return this.state.votes.find(
            vote =>
                vote.participantId === participantId &&
                vote.productId === productId
        );
    }

    save(vote: Vote): void {
        this.state.votes.push(vote);
    }

    delete(participantId: string, productId: number): boolean {
        const index = this.state.votes.findIndex(
            vote =>
                vote.participantId === participantId &&
                vote.productId === productId
        );

        if (index === -1) {
            return false;
        }

        this.state.votes.splice(index, 1);
        return true;
    }

    deleteByProductId(productId: number): number {
        const initialLength = this.state.votes.length;

        this.state.votes = this.state.votes.filter(
            vote => vote.productId !== productId
        );

        return initialLength - this.state.votes.length;
    }
}
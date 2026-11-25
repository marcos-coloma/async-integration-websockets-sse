import type { Vote } from "../entities/Vote";

export interface VoteRepository {
    findAll(): Vote[];
    findByProductId(productId: number): Vote[];
    findByParticipantAndProduct(
        participantId: string,
        productId: number
    ): Vote | undefined;
    save(vote: Vote): void;
    delete(participantId: string, productId: number): boolean;
    deleteByProductId(productId: number): number;
}
import type { Vote } from "../../domain/entities/Vote";
import type { VoteRepository } from "../../domain/repositories/VoteRepository";
import type { ProductRepository } from "../../domain/repositories/ProductRepository";
import type { ParticipantRepository } from "../../domain/repositories/ParticipantRepository";

export type VoteResult =
    | "voted"
    | "already_voted"
    | "not_found"
    | "not_authorized";

export type RemoveVoteResult =
    | "removed"
    | "not_found"
    | "not_authorized";

export class VoteService {
    constructor(
        private readonly voteRepository: VoteRepository,
        private readonly productRepository: ProductRepository,
        private readonly participantRepository: ParticipantRepository
    ) {}

    vote(participantId: string, productId: number): VoteResult {
        const participant = this.participantRepository.findById(participantId);

        if (!participant) {
            return "not_authorized";
        }

        const product = this.productRepository.findById(productId);

        if (!product) {
            return "not_found";
        }

        const existingVote =
            this.voteRepository.findByParticipantAndProduct(
                participantId,
                productId
            );

        if (existingVote) {
            return "already_voted";
        }

        const vote: Vote = {
            participantId,
            productId
        };

        this.voteRepository.save(vote);

        return "voted";
    }

    removeVote(
        participantId: string,
        productId: number
    ): RemoveVoteResult {
        const participant = this.participantRepository.findById(participantId);

        if (!participant) {
            return "not_authorized";
        }

        const product = this.productRepository.findById(productId);

        if (!product) {
            return "not_found";
        }

        this.voteRepository.delete(participantId, productId);

        return "removed";
    }
}
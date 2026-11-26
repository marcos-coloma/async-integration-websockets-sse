import { beforeEach, describe, expect, it } from "vitest";
import { VoteService } from "../../src/application/services/VoteService";
import type { AppState } from "../../src/domain/state/AppState";
import { MemoryVoteRepository } from "../../src/infrastructure/repositories/MemoryVoteRepository";
import { MemoryProductRepository } from "../../src/infrastructure/repositories/MemoryProductRepository";
import { MemoryParticipantRepository } from "../../src/infrastructure/repositories/MemoryParticipantRepository";

describe("VoteService", () => {
    let voteService: VoteService;
    let state: AppState;

    const participantId = "participant-1";
    const productId = 1;

    beforeEach(() => {
        state = {
            participants: new Map(),
            products: new Map(),
            votes: []
        };

        const voteRepository = new MemoryVoteRepository(state);
        const productRepository = new MemoryProductRepository(state);
        const participantRepository = new MemoryParticipantRepository(state);

        voteService = new VoteService(
            voteRepository,
            productRepository,
            participantRepository
        );

        state.participants.set(participantId, {
            id: participantId,
            name: "Marcos"
        });

        state.products.set(productId, {
            id: productId,
            title: "Product 1",
            price: 100,
            thumbnail: "image-1",
            proposedBy: participantId
        });
    });

    describe("vote", () => {
        it("should register a vote", () => {
            const result = voteService.vote(participantId, productId);

            expect(result).toBe("voted");
            expect(state.votes).toEqual([
                { participantId, productId }
            ]);
        });

        it("should reject votes from disconnected participants", () => {
            const result = voteService.vote("unknown", productId);

            expect(result).toBe("not_authorized");
            expect(state.votes).toHaveLength(0);
        });

        it("should reject votes for nonexistent products", () => {
            const result = voteService.vote(participantId, 999);

            expect(result).toBe("not_found");
            expect(state.votes).toHaveLength(0);
        });

        it("should prevent a participant from voting twice for the same product", () => {
            voteService.vote(participantId, productId);

            const result = voteService.vote(participantId, productId);

            expect(result).toBe("already_voted");
            expect(state.votes).toHaveLength(1);
        });

        it("should allow different participants to vote for the same product", () => {
            state.participants.set("participant-2", {
                id: "participant-2",
                name: "Pedro"
            });

            const result = voteService.vote("participant-2", productId);

            expect(result).toBe("voted");
            expect(state.votes).toHaveLength(1);
            expect(state.votes[0]).toEqual({
                participantId: "participant-2",
                productId
            });
        });
    });

    describe("removeVote", () => {
        beforeEach(() => {
            state.votes.push({
                participantId,
                productId
            });
        });

        it("should remove an existing vote", () => {
            const result = voteService.removeVote(participantId, productId);

            expect(result).toBe("removed");
            expect(state.votes).toHaveLength(0);
        });

        it("should reject vote removal from disconnected participants", () => {
            const result = voteService.removeVote("unknown", productId);

            expect(result).toBe("not_authorized");
            expect(state.votes).toHaveLength(1);
        });

        it("should reject vote removal for nonexistent products", () => {
            const result = voteService.removeVote(participantId, 999);

            expect(result).toBe("not_found");
            expect(state.votes).toHaveLength(1);
        });

        it("should return not_changed when the participant has not voted", () => {
            state.votes = [];

            const result = voteService.removeVote(participantId, productId);

            expect(result).toBe("not_changed");
            expect(state.votes).toHaveLength(0);
        });

        it("should only remove the vote belonging to the requesting participant", () => {
            state.participants.set("participant-2", {
                id: "participant-2",
                name: "Pedro"
            });

            state.votes.push({
                participantId: "participant-2",
                productId
            });

            const result = voteService.removeVote(participantId, productId);

            expect(result).toBe("removed");
            expect(state.votes).toEqual([
                {
                    participantId: "participant-2",
                    productId
                }
            ]);
        });
    });
});

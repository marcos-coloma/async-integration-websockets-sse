
import { beforeEach, describe, expect, it } from "vitest";

import { CatalogError } from "../../src/application/errors/CatalogError";
import type { CatalogProduct, CatalogProvider } from "../../src/application/ports/CatalogProvider";
import { ParticipantService } from "../../src/application/services/ParticipantService";
import { ProductService } from "../../src/application/services/ProductService";
import { VoteService } from "../../src/application/services/VoteService";
import type { AppState } from "../../src/domain/state/AppState";
import { MemoryParticipantRepository } from "../../src/infrastructure/repositories/MemoryParticipantRepository";
import { MemoryProductRepository } from "../../src/infrastructure/repositories/MemoryProductRepository";
import { MemoryVoteRepository } from "../../src/infrastructure/repositories/MemoryVoteRepository";

describe("ApplicationFlow", () => {
    let state: AppState;
    let participantService: ParticipantService;
    let productService: ProductService;
    let voteService: VoteService;

    beforeEach(() => {
        state = {
            participants: new Map(),
            products: new Map(),
            votes: []
        };

        const participantRepository = new MemoryParticipantRepository(state);
        const productRepository = new MemoryProductRepository(state);
        const voteRepository = new MemoryVoteRepository(state);

        const catalogProvider: CatalogProvider = {
            async findById(id: number): Promise<CatalogProduct> {
                if (id === 404) {
                    throw new CatalogError("NOT_FOUND", "Product not found");
                }

                return {
                    id,
                    title: `Product ${id}`,
                    price: 100,
                    thumbnail: `image-${id}`
                };
            }
        };

        participantService = new ParticipantService(participantRepository);

        productService = new ProductService(
            catalogProvider,
            productRepository,
            participantRepository,
            voteRepository
        );

        voteService = new VoteService(
            voteRepository,
            productRepository,
            participantRepository
        );
    });

    it("should complete a shared product voting flow", async () => {
        // Participants join.
        const marcos = participantService.join("Marcos");
        const pedro = participantService.join("Pedro");

        expect(participantService.getConnectedParticipants()).toHaveLength(2);

        // Marcos proposes products.
        const proposal = await productService.proposeProducts(
            marcos.id,
            [1, 2]
        );

        expect(proposal).toEqual({
            success: true,
            added: [1, 2],
            failed: []
        });

        expect(state.products.size).toBe(2);

        // Both participants vote for the products.
        expect(voteService.vote(marcos.id, 1)).toBe("voted");
        expect(voteService.vote(pedro.id, 1)).toBe("voted");
        expect(voteService.vote(pedro.id, 2)).toBe("voted");

        expect(state.votes).toHaveLength(3);

        // Pedro changes his mind and removes his vote.
        expect(voteService.removeVote(pedro.id, 1)).toBe("removed");

        expect(state.votes).toHaveLength(2);

        // Marcos disconnects.
        expect(participantService.disconnect(marcos.id)).toBe(true);
        expect(participantService.getConnectedParticipants()).toHaveLength(1);

        // Pedro can now remove Marcos's product.
        expect(productService.removeProduct(pedro.id, 1)).toBe("removed");

        expect(state.products.has(1)).toBe(false);
        expect(state.votes).toEqual([
            {
                participantId: pedro.id,
                productId: 2
            }
        ]);
    });

    it("should preserve successful proposals when some catalog products fail", async () => {
        const participant = participantService.join("Marcos");

        const result = await productService.proposeProducts(
            participant.id,
            [1, 404, 2]
        );

        expect(result).toEqual({
            success: true,
            added: [1, 2],
            failed: [
                {
                    productId: 404,
                    reason: "not_found"
                }
            ]
        });

        expect(state.products.size).toBe(2);
        expect(state.products.has(404)).toBe(false);
    });
});

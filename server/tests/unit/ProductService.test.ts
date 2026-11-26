import { beforeEach, describe, expect, it } from "vitest";
import { ProductService } from "../../src/application/services/ProductService";
import { CatalogError } from "../../src/application/errors/CatalogError";
import type { CatalogProduct, CatalogProvider } from "../../src/application/ports/CatalogProvider";
import type { AppState } from "../../src/domain/state/AppState";
import { MemoryProductRepository } from "../../src/infrastructure/repositories/MemoryProductRepository";
import { MemoryParticipantRepository } from "../../src/infrastructure/repositories/MemoryParticipantRepository";
import { MemoryVoteRepository } from "../../src/infrastructure/repositories/MemoryVoteRepository";

describe("ProductService", () => {
    let productService: ProductService;
    let state: AppState;
    let catalogLookup: (id: number) => Promise<CatalogProduct>;

    const participantId = "participant-1";

    beforeEach(() => {
        state = {
            participants: new Map(),
            products: new Map(),
            votes: []
        };

        const productRepository = new MemoryProductRepository(state);
        const participantRepository = new MemoryParticipantRepository(state);
        const voteRepository = new MemoryVoteRepository(state);

        const catalogProvider: CatalogProvider = {
            findById: id => catalogLookup(id)
        };

        catalogLookup = async id => ({
            id,
            title: `Product ${id}`,
            price: 100,
            thumbnail: `image-${id}`
        });

        productService = new ProductService(
            catalogProvider,
            productRepository,
            participantRepository,
            voteRepository
        );
    });

    describe("proposeProducts", () => {
        it("should add products from the catalog", async () => {
            const result = await productService.proposeProducts(
                participantId,
                [1, 2]
            );

            expect(result).toEqual({
                success: true,
                added: [1, 2],
                failed: []
            });

            expect(state.products.size).toBe(2);
            expect(state.products.get(1)).toMatchObject({
                id: 1,
                title: "Product 1",
                proposedBy: participantId
            });
        });

        it("should report products that were not found", async () => {
            catalogLookup = async () => {
                throw new CatalogError("NOT_FOUND", "Product not found");
            };

            const result = await productService.proposeProducts(
                participantId,
                [1]
            );

            expect(result).toEqual({
                success: false,
                added: [],
                failed: [{ productId: 1, reason: "not_found" }]
            });
        });

        it("should report catalog timeouts", async () => {
            catalogLookup = async () => {
                throw new CatalogError("TIMEOUT", "Request timed out");
            };

            const result = await productService.proposeProducts(
                participantId,
                [1]
            );

            expect(result.failed).toEqual([
                { productId: 1, reason: "timeout" }
            ]);
        });

        it("should report unavailable catalog errors", async () => {
            catalogLookup = async () => {
                throw new CatalogError("UNAVAILABLE", "Catalog unavailable");
            };

            const result = await productService.proposeProducts(
                participantId,
                [1]
            );

            expect(result.failed).toEqual([
                { productId: 1, reason: "unavailable" }
            ]);
        });

        it("should allow partial success when some products fail", async () => {
            catalogLookup = async id => {
                if (id === 2) {
                    throw new CatalogError("NOT_FOUND", "Product not found");
                }

                return {
                    id,
                    title: `Product ${id}`,
                    price: 100,
                    thumbnail: `image-${id}`
                };
            };

            const result = await productService.proposeProducts(
                participantId,
                [1, 2]
            );

            expect(result).toEqual({
                success: true,
                added: [1],
                failed: [{ productId: 2, reason: "not_found" }]
            });
        });

        it("should reject products that have already been proposed", async () => {
            state.products.set(1, {
                id: 1,
                title: "Existing product",
                price: 100,
                thumbnail: "image",
                proposedBy: participantId
            });

            const result = await productService.proposeProducts(
                participantId,
                [1]
            );

            expect(result).toEqual({
                success: false,
                added: [],
                failed: [{ productId: 1, reason: "duplicate" }]
            });
        });

        it("should reject duplicate IDs within the same request", async () => {
            const result = await productService.proposeProducts(
                participantId,
                [1, 1]
            );

            expect(result).toEqual({
                success: true,
                added: [1],
                failed: [{ productId: 1, reason: "duplicate" }]
            });

            expect(state.products.size).toBe(1);
        });
    });

    describe("removeProduct", () => {
        beforeEach(() => {
            state.participants.set(participantId, {
                id: participantId,
                name: "Marcos"
            });

            state.products.set(1, {
                id: 1,
                title: "Product 1",
                price: 100,
                thumbnail: "image-1",
                proposedBy: participantId
            });

            state.votes.push({
                participantId,
                productId: 1
            });
        });

        it("should reject removal by a participant who is not connected", () => {
            const result = productService.removeProduct("unknown", 1);

            expect(result).toBe("not_authorized");
            expect(state.products.has(1)).toBe(true);
        });

        it("should return not_found when the product does not exist", () => {
            const result = productService.removeProduct(
                participantId,
                999
            );

            expect(result).toBe("not_found");
        });

        it("should prevent another connected participant from removing a product", () => {
            state.participants.set("participant-2", {
                id: "participant-2",
                name: "Pedro"
            });

            const result = productService.removeProduct(
                "participant-2",
                1
            );

            expect(result).toBe("not_authorized");
            expect(state.products.has(1)).toBe(true);
        });

        it("should remove a product and its associated votes", () => {
            const result = productService.removeProduct(
                participantId,
                1
            );

            expect(result).toBe("removed");
            expect(state.products.has(1)).toBe(false);
            expect(state.votes).toHaveLength(0);
        });

        it("should allow removal when the original proposer is disconnected", () => {
            state.participants.delete(participantId);

            state.participants.set("participant-2", {
                id: "participant-2",
                name: "Pedro"
            });

            const result = productService.removeProduct(
                "participant-2",
                1
            );

            expect(result).toBe("removed");
            expect(state.products.has(1)).toBe(false);
        });
    });
});

import type { Product } from "../../domain/entities/Product";
import type { CatalogProvider } from "../ports/CatalogProvider";
import { CatalogError } from "../errors/CatalogError";

import type { ProductRepository } from "../../domain/repositories/ProductRepository";
import type { ParticipantRepository } from "../../domain/repositories/ParticipantRepository";
import type { VoteRepository } from "../../domain/repositories/VoteRepository";

export type ProductProposalFailureReason =
    | "not_found"
    | "timeout"
    | "duplicate"
    | "unavailable";

export interface ProductProposalFailure {
    id: number;
    reason: ProductProposalFailureReason;
}

export interface ProductProposalResult {
    success: boolean;
    added: number;
    failed: ProductProposalFailure[];
}

export type ProductRemovalResult =
    | "removed"
    | "not_found"
    | "not_authorized";

export class ProductService {
    private readonly pendingProductIds = new Set<number>();

    constructor(
        private readonly catalogProvider: CatalogProvider,
        private readonly productRepository: ProductRepository,
        private readonly participantRepository: ParticipantRepository,
        private readonly voteRepository: VoteRepository
    ) {}

    async proposeProducts(
        participantId: string,
        productIds: number[]
    ): Promise<ProductProposalResult> {
        const results = await Promise.all(
            productIds.map(async (id) => {
                if (
                    this.productRepository.findById(id) ||
                    this.pendingProductIds.has(id)
                ) {
                    return { id, reason: "duplicate" as const };
                }

                this.pendingProductIds.add(id);

                try {
                    const catalogProduct =
                        await this.catalogProvider.findById(id);

                    const product: Product = {
                        ...catalogProduct,
                        proposedBy: participantId
                    };

                    this.productRepository.save(product);

                    return null;
                } catch (error) {
                    if (error instanceof CatalogError) {
                        const reason: ProductProposalFailureReason =
                            error.code === "NOT_FOUND"
                                ? "not_found"
                                : error.code === "TIMEOUT"
                                    ? "timeout"
                                    : "unavailable";

                        return { id, reason };
                    }

                    throw error;
                } finally {
                    this.pendingProductIds.delete(id);
                }
            })
        );

        const failed = results.filter(
            (result): result is ProductProposalFailure => result !== null
        );

        const added = results.length - failed.length;

        return {
            success: added > 0,
            added,
            failed
        };
    }

    removeProduct(
        participantId: string,
        productId: number
    ): ProductRemovalResult {
        const participant =
            this.participantRepository.findById(participantId);

        if (!participant) {
            return "not_authorized";
        }

        const product = this.productRepository.findById(productId);

        if (!product) {
            return "not_found";
        }

        const proposerIsConnected =
            this.participantRepository.findById(product.proposedBy) !== undefined;

        if (
            proposerIsConnected &&
            product.proposedBy !== participantId
        ) {
            return "not_authorized";
        }

        this.productRepository.delete(productId);
        this.voteRepository.deleteByProductId(productId);

        return "removed";
    }
}
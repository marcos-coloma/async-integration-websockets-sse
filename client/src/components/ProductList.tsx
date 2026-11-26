import type { Participant, Product } from "../types/entities";
import { ProductItem } from "./ProductItem";

interface ProductListProps {
    readonly products: Product[];
    readonly participants: Participant[];
    readonly votes: {
        participantId: string;
        productId: number;
    }[];
    readonly participantId: string;
    readonly onVote: (productId: number) => void;
    readonly onRemoveVote: (productId: number) => void;
    readonly onRemoveProduct: (productId: number) => void;
}

export function ProductList({
    products,
    votes,
    participantId,
    participants,
    onVote,
    onRemoveVote,
    onRemoveProduct
}: ProductListProps) {
    if (products.length === 0) {
        return (
            <section>
                <h2>Products</h2>
                <p>No products proposed yet.</p>
            </section>
        );
    }

    return (
        <section>
            <h2>Products ({products.length})</h2>

            <ul>
                {products.map(product => {
                    const productVotes = votes.filter(
                        vote => vote.productId === product.id
                    );

                    const hasVoted = productVotes.some(
                        vote => vote.participantId === participantId
                    );

                const proposerIsConnected = participants.some(
                    participant => participant.id === product.proposedBy
                );

                const canRemove =
                    product.proposedBy === participantId ||
                    !proposerIsConnected;

                    return (
                        <ProductItem
                            key={product.id}
                            product={product}
                            voteCount={productVotes.length}
                            hasVoted={hasVoted}
                            canRemove={canRemove}
                            onVote={onVote}
                            onRemoveVote={onRemoveVote}
                            onRemoveProduct={onRemoveProduct}
                        />
                    );
                })}
            </ul>
        </section>
    );
}

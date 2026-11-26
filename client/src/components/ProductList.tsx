
import type { Participant, Product } from "../types/entities";
import "./ProductList.css";
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
    return (
        <section className="panel">
            <div className="panel-heading">
                <h2 className="section-title">
                    Products ({products.length})
                </h2>
            </div>

            {products.length === 0 ? (
                <div className="empty-state">
                    <div>
                        <strong>No products proposed yet.</strong>
                        <p>Propose the first product to get started.</p>
                    </div>
                </div>
            ) : (
                <ul className="product-list">
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
            )}
        </section>
    );
}

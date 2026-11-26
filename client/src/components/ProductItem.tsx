import type { Product } from "../types/entities";

interface ProductItemProps {
    readonly product: Product;
    readonly voteCount: number;
    readonly hasVoted: boolean;
    readonly canRemove: boolean;
    readonly onVote: (productId: number) => void;
    readonly onRemoveVote: (productId: number) => void;
    readonly onRemoveProduct: (productId: number) => void;
}

export function ProductItem({
    product,
    voteCount,
    hasVoted,
    canRemove,
    onVote,
    onRemoveVote,
    onRemoveProduct
}: ProductItemProps) {
    return (
        <li>
            <img
                src={product.thumbnail}
                alt={product.title}
                width={100}
            />

            <h3>{product.title}</h3>
            <p>Price: ${product.price}</p>
            <p>Proposed by: {product.proposedBy}</p>
            <p>Votes: {voteCount}</p>

            {hasVoted ? (
                <button onClick={() => onRemoveVote(product.id)}>
                    Remove vote
                </button>
            ) : (
                <button onClick={() => onVote(product.id)}>
                    Vote
                </button>
            )}

            {canRemove && (
                <button onClick={() => onRemoveProduct(product.id)}>
                    Remove product
                </button>
            )}
        </li>
    );
}

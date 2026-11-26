
import type { Product } from "../types/entities";
import "./ProductItem.css";

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
        <li className="product-card">
            <div className="product-image-wrap">
                <img
                    className="product-image"
                    src={product.thumbnail}
                    alt={product.title}
                    loading="lazy"
                />
            </div>

            <div className="product-info">
                <h3 className="product-title">
                    {product.title}
                </h3>

                <p className="product-price numeric">
                    ${product.price.toFixed(2)}
                </p>

                <p className="product-proposer">
                    Proposed by: {product.proposedBy}
                </p>
            </div>

            <div className="product-actions">
                <div className="vote-count">
                    Votes: {voteCount}
                </div>

                {hasVoted ? (
                    <button
                        className="btn btn-secondary"
                        onClick={() => onRemoveVote(product.id)}
                    >
                        Remove vote
                    </button>
                ) : (
                    <button
                        className="btn btn-primary"
                        onClick={() => onVote(product.id)}
                    >
                        Vote
                    </button>
                )}

                {canRemove && (
                    <button
                        className="btn btn-danger"
                        onClick={() => onRemoveProduct(product.id)}
                    >
                        Remove product
                    </button>
                )}
            </div>
        </li>
    );
}


import type { Product, Vote } from "../types/entities";
import "./RankingList.css";

interface RankingListProps {
    readonly products: Product[];
    readonly votes: Vote[];
}

export function RankingList({
    products,
    votes
}: RankingListProps) {
    const ranking = products
        .map(product => ({
            ...product,
            voteCount: votes.filter(
                vote => vote.productId === product.id
            ).length
        }))
        .sort((a, b) => b.voteCount - a.voteCount);

    if (ranking.length === 0) {
        return (
            <div className="empty-state">
                <div>
                    <strong>No products yet</strong>
                    <p>
                        The ranking will appear as soon as products
                        are proposed.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <ol className="ranking-list">
            {ranking.map((product, index) => (
                <li className="ranking-item" key={product.id}>
                    <span className="ranking-position">
                        {index + 1}
                    </span>

                    <div className="ranking-image-wrap">
                        <img
                            className="ranking-image"
                            src={product.thumbnail}
                            alt={product.title}
                            loading="lazy"
                        />
                    </div>

                    <div>
                        <h3 className="ranking-product-title">
                            {product.title}
                        </h3>

                        <p className="ranking-product-price numeric">
                            ${product.price.toFixed(2)}
                        </p>
                    </div>

                    <div className="ranking-votes">
                        <span className="ranking-votes-value">
                            {product.voteCount}
                        </span>

                        <span className="ranking-votes-label">
                            {product.voteCount === 1 ? "vote" : "votes"}
                        </span>
                    </div>
                </li>
            ))}
        </ol>
    );
}

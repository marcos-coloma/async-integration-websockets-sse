
import type { Product, Vote } from "../types/entities";

interface RankingListProps {
    readonly products: Product[];
    readonly votes: Vote[];
}

export function RankingList({ products, votes }: RankingListProps) {
    const ranking = products
        .map(product => ({
            ...product,
            voteCount: votes.filter(
                vote => vote.productId === product.id
            ).length
        }))
        .sort((a, b) => b.voteCount - a.voteCount);

    if (ranking.length === 0) {
        return <p>No products have been proposed yet.</p>;
    }

    return (
        <section>
            <h2>Product ranking</h2>

            <ol>
                {ranking.map(product => (
                    <li key={product.id}>
                        <h3>{product.title}</h3>
                        <p>Votes: {product.voteCount}</p>
                    </li>
                ))}
            </ol>
        </section>
    );
}

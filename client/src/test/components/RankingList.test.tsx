
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { RankingList } from "../../components/RankingList";
import type { Product, Vote } from "../../types/entities";

const products: Product[] = [
    {
        id: 1,
        title: "Product One",
        price: 10,
        thumbnail: "https://example.com/1.jpg",
        proposedBy: "p1"
    },
    {
        id: 2,
        title: "Product Two",
        price: 20,
        thumbnail: "https://example.com/2.jpg",
        proposedBy: "p2"
    },
    {
        id: 3,
        title: "Product Three",
        price: 30,
        thumbnail: "https://example.com/3.jpg",
        proposedBy: "p3"
    }
];

const votes: Vote[] = [
    { participantId: "p1", productId: 2 },
    { participantId: "p2", productId: 2 },
    { participantId: "p3", productId: 1 }
];

describe("RankingList", () => {
    it("should display an empty message when there are no products", () => {
        render(<RankingList products={[]} votes={[]} />);

        expect(screen.getByText("No products yet")).toBeInTheDocument();
        expect(
            screen.getByText("The ranking will appear as soon as products are proposed.")
        ).toBeInTheDocument();
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("should rank products by vote count in descending order", () => {
        render(<RankingList products={products} votes={votes} />);

        const ranking = screen.getByRole("list");
        const items = within(ranking).getAllByRole("listitem");

        expect(items).toHaveLength(3);
        expect(items[0]).toHaveTextContent("Product Two");
        expect(within(items[0]).getByText("2")).toBeInTheDocument();
        expect(within(items[0]).getByText("votes")).toBeInTheDocument();
        expect(items[1]).toHaveTextContent("Product One");
        expect(within(items[1]).getByText("1")).toBeInTheDocument();
        expect(within(items[1]).getByText("vote")).toBeInTheDocument();
        expect(items[2]).toHaveTextContent("Product Three");
        expect(within(items[2]).getByText("0")).toBeInTheDocument();
        expect(within(items[2]).getByText("votes")).toBeInTheDocument();
    });

    it("should preserve the original order when products have the same vote count", () => {
        render(<RankingList products={products} votes={[]} />);

        const items = within(screen.getByRole("list")).getAllByRole("listitem");

        expect(items[0]).toHaveTextContent("Product One");
        expect(items[1]).toHaveTextContent("Product Two");
        expect(items[2]).toHaveTextContent("Product Three");
    });

    it("should not mutate the original products array", () => {
        const originalOrder = products.map(product => product.id);

        render(<RankingList products={products} votes={votes} />);

        expect(products.map(product => product.id)).toEqual(originalOrder);
    });
});

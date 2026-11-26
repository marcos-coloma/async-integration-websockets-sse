
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductList } from "../../components/ProductList";
import type { Participant, Product, Vote } from "../../types/entities";

const products: Product[] = [
    {
        id: 1,
        title: "Product One",
        price: 10,
        thumbnail: "https://example.com/1.jpg",
        proposedBy: "participant-1"
    },
    {
        id: 2,
        title: "Product Two",
        price: 20,
        thumbnail: "https://example.com/2.jpg",
        proposedBy: "participant-2"
    }
];

const participants: Participant[] = [
    { id: "participant-1", name: "Alice" },
    { id: "participant-2", name: "Bob" }
];

const votes: Vote[] = [
    { participantId: "participant-1", productId: 1 },
    { participantId: "participant-2", productId: 1 },
    { participantId: "participant-2", productId: 2 }
];

describe("ProductList", () => {
    it("should display an empty message when there are no products", () => {
        render(
            <ProductList
                products={[]}
                participants={[]}
                votes={[]}
                participantId="participant-1"
                onVote={vi.fn()}
                onRemoveVote={vi.fn()}
                onRemoveProduct={vi.fn()}
            />
        );

        expect(screen.getByRole("heading", { name: "Products" })).toBeInTheDocument();
        expect(screen.getByText("No products proposed yet.")).toBeInTheDocument();
    });

    it("should render products and their vote counts", () => {
        render(
            <ProductList
                products={products}
                participants={participants}
                votes={votes}
                participantId="participant-1"
                onVote={vi.fn()}
                onRemoveVote={vi.fn()}
                onRemoveProduct={vi.fn()}
            />
        );

        expect(screen.getByRole("heading", { name: "Products (2)" })).toBeInTheDocument();
        expect(screen.getByText("Votes: 2")).toBeInTheDocument();
        expect(screen.getByText("Votes: 1")).toBeInTheDocument();
    });

    it("should show the correct vote action for the current participant", () => {
        render(
            <ProductList
                products={products}
                participants={participants}
                votes={votes}
                participantId="participant-1"
                onVote={vi.fn()}
                onRemoveVote={vi.fn()}
                onRemoveProduct={vi.fn()}
            />
        );

        expect(screen.getAllByRole("button", { name: "Remove vote" })).toHaveLength(1);
        expect(screen.getAllByRole("button", { name: "Vote" })).toHaveLength(1);
    });

    it("should allow removal by the proposer or when the proposer disconnected", () => {
        const { rerender } = render(
            <ProductList
                products={products}
                participants={participants}
                votes={[]}
                participantId="participant-1"
                onVote={vi.fn()}
                onRemoveVote={vi.fn()}
                onRemoveProduct={vi.fn()}
            />
        );

        // The current participant proposed product 1.
        expect(screen.getAllByRole("button", { name: "Remove product" })).toHaveLength(1);

        // The proposer of product 2 disconnected.
        rerender(
            <ProductList
                products={products}
                participants={[participants[0]]}
                votes={[]}
                participantId="participant-1"
                onVote={vi.fn()}
                onRemoveVote={vi.fn()}
                onRemoveProduct={vi.fn()}
            />
        );

        expect(screen.getAllByRole("button", { name: "Remove product" })).toHaveLength(2);
    });

    it("should call the corresponding callback when voting", async () => {
        const user = userEvent.setup();
        const onVote = vi.fn();

        render(
            <ProductList
                products={products}
                participants={participants}
                votes={[]}
                participantId="participant-1"
                onVote={onVote}
                onRemoveVote={vi.fn()}
                onRemoveProduct={vi.fn()}
            />
        );

        const voteButtons = screen.getAllByRole("button", { name: "Vote" });
        await user.click(voteButtons[0]);

        expect(onVote).toHaveBeenCalledWith(1);
    });
});

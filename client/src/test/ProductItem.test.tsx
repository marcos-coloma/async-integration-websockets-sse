import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductItem } from "../components/ProductItem";
import type { Product } from "../types/entities";

const product: Product = {
    id: 1,
    title: "Product One",
    price: 10,
    thumbnail: "https://example.com/product.jpg",
    proposedBy: "participant-1"
};

describe("ProductItem", () => {
    it("should render product information", () => {
        render(
            <ProductItem
                product={product}
                voteCount={3}
                hasVoted={false}
                canRemove={true}
                onVote={vi.fn()}
                onRemoveVote={vi.fn()}
                onRemoveProduct={vi.fn()}
            />
        );

        expect(screen.getByRole("heading", { name: "Product One" })).toBeInTheDocument();
        expect(screen.getByText("Price: $10")).toBeInTheDocument();
        expect(screen.getByText("Proposed by: participant-1")).toBeInTheDocument();
        expect(screen.getByText("Votes: 3")).toBeInTheDocument();
        expect(screen.getByRole("img", { name: "Product One" })).toHaveAttribute("src", product.thumbnail);
    });

    it("should call onVote when the participant has not voted", async () => {
        const user = userEvent.setup();
        const onVote = vi.fn();

        render(
            <ProductItem
                product={product}
                voteCount={0}
                hasVoted={false}
                canRemove={false}
                onVote={onVote}
                onRemoveVote={vi.fn()}
                onRemoveProduct={vi.fn()}
            />
        );

        await user.click(screen.getByRole("button", { name: "Vote" }));

        expect(onVote).toHaveBeenCalledOnce();
        expect(onVote).toHaveBeenCalledWith(1);
        expect(screen.queryByRole("button", { name: "Remove product" })).not.toBeInTheDocument();
    });

    it("should call onRemoveVote when the participant has already voted", async () => {
        const user = userEvent.setup();
        const onRemoveVote = vi.fn();

        render(
            <ProductItem
                product={product}
                voteCount={1}
                hasVoted={true}
                canRemove={false}
                onVote={vi.fn()}
                onRemoveVote={onRemoveVote}
                onRemoveProduct={vi.fn()}
            />
        );

        await user.click(screen.getByRole("button", { name: "Remove vote" }));

        expect(onRemoveVote).toHaveBeenCalledOnce();
        expect(onRemoveVote).toHaveBeenCalledWith(1);
        expect(screen.queryByRole("button", { name: "Vote" })).not.toBeInTheDocument();
    });

    it("should allow product removal when canRemove is true", async () => {
        const user = userEvent.setup();
        const onRemoveProduct = vi.fn();

        render(
            <ProductItem
                product={product}
                voteCount={0}
                hasVoted={false}
                canRemove={true}
                onVote={vi.fn()}
                onRemoveVote={vi.fn()}
                onRemoveProduct={onRemoveProduct}
            />
        );

        await user.click(screen.getByRole("button", { name: "Remove product" }));

        expect(onRemoveProduct).toHaveBeenCalledWith(1);
    });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductProposalForm } from "../components/ProductProposalForm";

describe("ProductProposalForm", () => {
    it("should render the proposal form", () => {
        const onPropose = vi.fn();

        render(<ProductProposalForm onPropose={onPropose} />);

        expect(
            screen.getByRole("heading", {
                name: "Propose products"
            })
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText(
                "Product IDs (separated by commas)"
            )
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: "Propose" })
        ).toBeInTheDocument();
    });

    it("should submit valid product IDs", async () => {
        const user = userEvent.setup();
        const onPropose = vi.fn();

        render(<ProductProposalForm onPropose={onPropose} />);

        const input = screen.getByLabelText(
            "Product IDs (separated by commas)"
        );

        await user.type(input, "1, 2, 3");
        await user.click(screen.getByRole("button", { name: "Propose" }));

        expect(onPropose).toHaveBeenCalledOnce();
        expect(onPropose).toHaveBeenCalledWith([1, 2, 3]);
        expect(input).toHaveValue("");
    });

    it("should remove invalid IDs and duplicates", async () => {
        const user = userEvent.setup();
        const onPropose = vi.fn();

        render(<ProductProposalForm onPropose={onPropose} />);

        await user.type(
            screen.getByLabelText(
                "Product IDs (separated by commas)"
            ),
            "1, abc, 2, 1, -3, 3.5, 3"
        );

        await user.click(screen.getByRole("button", { name: "Propose" }));

        expect(onPropose).toHaveBeenCalledWith([1, 2, 3]);
    });

    it("should not submit when there are no valid IDs", async () => {
        const user = userEvent.setup();
        const onPropose = vi.fn();

        render(<ProductProposalForm onPropose={onPropose} />);

        await user.type(
            screen.getByLabelText(
                "Product IDs (separated by commas)"
            ),
            "abc, -1, 0"
        );

        await user.click(screen.getByRole("button", { name: "Propose" }));

        expect(onPropose).not.toHaveBeenCalled();
    });

    it("should not submit more than 10 valid IDs", async () => {
        const user = userEvent.setup();
        const onPropose = vi.fn();

        render(<ProductProposalForm onPropose={onPropose} />);

        await user.type(
            screen.getByLabelText(
                "Product IDs (separated by commas)"
            ),
            "1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11"
        );

        await user.click(screen.getByRole("button", { name: "Propose" }));

        expect(onPropose).not.toHaveBeenCalled();
    });
});

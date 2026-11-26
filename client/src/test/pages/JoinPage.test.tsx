import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JoinPage } from "../../pages/JoinPage";

describe("JoinPage", () => {
    it("should render the join form", () => {
        const onJoin = vi.fn();

        render(
            <JoinPage
                status="connected"
                error={null}
                onJoin={onJoin}
            />
        );

        expect(
            screen.getByRole("heading", {
                name: "Join the shared list"
            })
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText("Your name")
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: "Join"
            })
        ).toBeInTheDocument();
    });

    it("should display connection status and server error", () => {
        const onJoin = vi.fn();

        render(
            <JoinPage
                status="disconnected"
                error="Connection failed."
                onJoin={onJoin}
            />
        );

        expect(
            screen.getByText("Connection status: disconnected")
        ).toBeInTheDocument();

        expect(
            screen.getByText("Connection failed.")
        ).toBeInTheDocument();
    });

    it("should submit a trimmed name", async () => {
        const user = userEvent.setup();
        const onJoin = vi.fn();

        render(
            <JoinPage
                status="connected"
                error={null}
                onJoin={onJoin}
            />
        );

        await user.type(
            screen.getByLabelText("Your name"),
            "  Marcos  "
        );

        await user.click(
            screen.getByRole("button", { name: "Join" })
        );

        expect(onJoin).toHaveBeenCalledOnce();
        expect(onJoin).toHaveBeenCalledWith("Marcos");
    });
});

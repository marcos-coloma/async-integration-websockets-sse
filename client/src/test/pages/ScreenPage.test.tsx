
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ScreenPage } from "../../pages/ScreenPage";
import { useScreenEvents } from "../../hooks/useScreenEvents";
import type { SharedState } from "../../types/entities";

vi.mock("../../hooks/useScreenEvents", () => ({
    useScreenEvents: vi.fn()
}));

const sharedState: SharedState = {
    participants: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" }
    ],
    products: [
        {
            id: 1,
            title: "Product One",
            price: 10,
            thumbnail: "",
            proposedBy: "p1"
        },
        {
            id: 2,
            title: "Product Two",
            price: 20,
            thumbnail: "",
            proposedBy: "p2"
        }
    ],
    votes: [
        { participantId: "p1", productId: 2 },
        { participantId: "p2", productId: 2 }
    ]
};

const mockedUseScreenEvents = vi.mocked(useScreenEvents);

describe("ScreenPage", () => {
    it("should display connection status and participants", () => {
        mockedUseScreenEvents.mockReturnValue({
            status: "connected",
            sharedState,
            connectionError: null
        });

        render(<ScreenPage />);

        expect(screen.getByRole("heading", { name: "Live product ranking" })).toBeInTheDocument();
        expect(screen.getByText("SSE connection: connected")).toBeInTheDocument();
        expect(screen.getByText("Total: 2")).toBeInTheDocument();
        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    it("should display an empty participants message", () => {
        mockedUseScreenEvents.mockReturnValue({
            status: "connected",
            sharedState: {
                participants: [],
                products: [],
                votes: []
            },
            connectionError: null
        });

        render(<ScreenPage />);

        expect(screen.getByText("Total: 0")).toBeInTheDocument();
        expect(screen.getByText("No participants connected.")).toBeInTheDocument();
        expect(screen.getByText("No products have been proposed yet.")).toBeInTheDocument();
    });

    it("should display connection errors", () => {
        mockedUseScreenEvents.mockReturnValue({
            status: "error",
            sharedState,
            connectionError: "SSE connection error. Reconnecting..."
        });

        render(<ScreenPage />);

        expect(screen.getByRole("alert")).toHaveTextContent(
            "SSE connection error. Reconnecting..."
        );
        expect(screen.getByText("SSE connection: error")).toBeInTheDocument();
    });

    it("should display the ranking using the received state", () => {
        mockedUseScreenEvents.mockReturnValue({
            status: "connected",
            sharedState,
            connectionError: null
        });

        render(<ScreenPage />);

        const ranking = screen.getByRole("heading", { name: "Product ranking" });
        expect(ranking).toBeInTheDocument();

        const rankingSection = screen
            .getByRole("heading", { name: "Product ranking" })
            .closest("section");

        const items = within(rankingSection!).getAllByRole("listitem");

        expect(items[0]).toHaveTextContent("Product Two");
        expect(items[0]).toHaveTextContent("Votes: 2");
    });
});

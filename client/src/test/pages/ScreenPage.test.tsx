
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
            thumbnail: "https://example.com/1.jpg",
            proposedBy: "p1"
        },
        {
            id: 2,
            title: "Product Two",
            price: 20,
            thumbnail: "https://example.com/2.jpg",
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

        expect(
            screen.getByRole("heading", { name: "Live product ranking" })
        ).toBeInTheDocument();
        expect(screen.getByText("connected")).toBeInTheDocument();
        expect(
            within(screen.getByText("Participants").parentElement!).getByText("2")
        ).toBeInTheDocument();
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

        expect(
            within(screen.getByText("Participants").parentElement!).getByText("0")
        ).toBeInTheDocument();
        expect(screen.getByText("No products yet")).toBeInTheDocument();
        expect(
            screen.getByText("The ranking will appear as soon as products are proposed.")
        ).toBeInTheDocument();
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
        expect(screen.getByText("error")).toBeInTheDocument();
    });

    it("should display the ranking using the received state", () => {
        mockedUseScreenEvents.mockReturnValue({
            status: "connected",
            sharedState,
            connectionError: null
        });

        render(<ScreenPage />);

        const ranking = screen.getByRole("heading", { name: "Community ranking" });
        expect(ranking).toBeInTheDocument();

        const items = within(screen.getByRole("list")).getAllByRole("listitem");

        expect(items[0]).toHaveTextContent("Product Two");
        expect(within(items[0]).getByText("2")).toBeInTheDocument();
        expect(within(items[0]).getByText("votes")).toBeInTheDocument();
    });
});

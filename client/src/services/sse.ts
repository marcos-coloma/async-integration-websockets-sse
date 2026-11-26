
import type { SSEEvent } from "../types/sse";

import type {
    Participant,
    Product,
    Vote,
    SharedState
} from "../types/entities";

export type SSEStatus =
    | "connecting"
    | "connected"
    | "disconnected"
    | "error";

interface SSEServiceHandlers {
    onEvent: (event: SSEEvent) => void;
    onStatusChange: (status: SSEStatus) => void;
    onError: (message: string) => void;
}

function getSSEUrl(): string {
    const configuredUrl = import.meta.env.VITE_SSE_URL;

    if (configuredUrl) {
        return configuredUrl;
    }

    if (import.meta.env.DEV) {
        return `http://${window.location.hostname}:3000/events`;
    }

    return `${window.location.origin}/events`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isParticipant(value: unknown): value is Participant {
    return (
        isRecord(value) &&
        typeof value.id === "string" &&
        typeof value.name === "string"
    );
}

function isProduct(value: unknown): value is Product {
    return (
        isRecord(value) &&
        typeof value.id === "number" &&
        typeof value.title === "string" &&
        typeof value.price === "number" &&
        typeof value.thumbnail === "string" &&
        typeof value.proposedBy === "string"
    );
}

function isVote(value: unknown): value is Vote {
    return (
        isRecord(value) &&
        typeof value.participantId === "string" &&
        typeof value.productId === "number"
    );
}

function isSharedState(value: unknown): value is SharedState {
    return (
        isRecord(value) &&
        Array.isArray(value.participants) &&
        value.participants.every(isParticipant) &&
        Array.isArray(value.products) &&
        value.products.every(isProduct) &&
        Array.isArray(value.votes) &&
        value.votes.every(isVote)
    );
}

export class SSEService {
    private source: EventSource | null = null;

    private readonly handlers: SSEServiceHandlers;
    private readonly url: string;

    constructor(
        handlers: SSEServiceHandlers,
        url: string = getSSEUrl()
    ) {
        this.handlers = handlers;
        this.url = url;
    }

    connect(): void {
        if (this.source) return;

        this.handlers.onStatusChange("connecting");

        try {
            const source = new EventSource(this.url);
            this.source = source;

            source.onopen = () => {
                if (this.source !== source) return;

                this.handlers.onStatusChange("connected");
            };

            source.onerror = () => {
                if (this.source !== source) return;

                this.handlers.onStatusChange("error");
                this.handlers.onError(
                    "SSE connection error. Reconnecting..."
                );
            };

            source.addEventListener(
                "initial_state",
                (event: MessageEvent<string>) => {
                    this.handleEvent("initial_state", event.data);
                }
            );

            source.addEventListener(
                "state_update",
                (event: MessageEvent<string>) => {
                    this.handleEvent("state_update", event.data);
                }
            );
        } catch {
            this.source = null;
            this.handlers.onStatusChange("error");
            this.handlers.onError(
                "Unable to establish the SSE connection."
            );
        }
    }

    close(): void {
        if (!this.source) return;

        this.source.close();
        this.source = null;

        this.handlers.onStatusChange("disconnected");
    }

    private handleEvent(
        type: SSEEvent["type"],
        data: string
    ): void {
        let parsed: unknown;

        try {
            parsed = JSON.parse(data);
        } catch {
            this.handlers.onError(
                "Received invalid JSON from the server."
            );
            return;
        }

        if (!isSharedState(parsed)) {
            this.handlers.onError(
                "Received an invalid SSE event."
            );
            return;
        }

        this.handlers.onEvent({
            type,
            participants: parsed.participants,
            products: parsed.products,
            votes: parsed.votes
        });
    }
}

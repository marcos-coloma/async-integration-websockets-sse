
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SSEService } from "../../services/sse";

class MockEventSource {
    static instances: MockEventSource[] = [];

    onopen: (() => void) | null = null;
    onerror: (() => void) | null = null;

    listeners = new Map<string, (event: MessageEvent<string>) => void>();
    close = vi.fn();

    url: string;

    constructor(url: string) {
        this.url = url;
        MockEventSource.instances.push(this);
    }
    addEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject
    ) {
        this.listeners.set(type, callback as (event: MessageEvent<string>) => void);
    }

    emit(type: string, data: string) {
        this.listeners.get(type)?.({ data } as MessageEvent<string>);
    }
}

describe("SSEService", () => {
    const handlers = {
        onEvent: vi.fn(),
        onStatusChange: vi.fn(),
        onError: vi.fn()
    };

    let service: SSEService;
    let source: MockEventSource;

    beforeEach(() => {
        vi.clearAllMocks();
        MockEventSource.instances = [];

        vi.stubGlobal(
            "EventSource",
            MockEventSource as unknown as typeof EventSource
        );

        service = new SSEService(handlers, "http://localhost:3000/events");
        service.connect();

        source = MockEventSource.instances[0];
    });

    afterEach(() => {
        service.close();
        vi.unstubAllGlobals();
    });

    it("should connect to the configured URL", () => {
        expect(source.url).toBe("http://localhost:3000/events");
        expect(handlers.onStatusChange).toHaveBeenCalledWith("connecting");
    });

    it("should notify when the connection opens", () => {
        source.onopen?.();

        expect(handlers.onStatusChange).toHaveBeenCalledWith("connected");
    });

    it("should process an initial state event", () => {
        const state = {
            participants: [{ id: "p1", name: "Alice" }],
            products: [],
            votes: []
        };

        source.emit("initial_state", JSON.stringify(state));

        expect(handlers.onEvent).toHaveBeenCalledWith({
            type: "initial_state",
            ...state
        });
    });

    it("should process a state update event", () => {
        const state = {
            participants: [],
            products: [{
                id: 1,
                title: "Product One",
                price: 10,
                thumbnail: "",
                proposedBy: "p1"
            }],
            votes: []
        };

        source.emit("state_update", JSON.stringify(state));

        expect(handlers.onEvent).toHaveBeenCalledWith({
            type: "state_update",
            ...state
        });
    });

    it("should report invalid JSON", () => {
        source.emit("initial_state", "{invalid json");

        expect(handlers.onError).toHaveBeenCalledWith(
            "Received invalid JSON from the server."
        );
    });

    it("should report invalid event data", () => {
        source.emit("state_update", JSON.stringify({
            participants: [{ id: 1, name: "Alice" }],
            products: [],
            votes: []
        }));

        expect(handlers.onError).toHaveBeenCalledWith(
            "Received an invalid SSE event."
        );
    });

    it("should report connection errors", () => {
        source.onerror?.();

        expect(handlers.onStatusChange).toHaveBeenCalledWith("error");
        expect(handlers.onError).toHaveBeenCalledWith(
            "SSE connection error. Reconnecting..."
        );
    });

    it("should close the connection", () => {
        service.close();

        expect(source.close).toHaveBeenCalledOnce();
        expect(handlers.onStatusChange).toHaveBeenLastCalledWith("disconnected");
    });
});

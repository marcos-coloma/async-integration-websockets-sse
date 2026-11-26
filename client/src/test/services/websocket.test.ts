
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WebSocketService } from "../../services/websocket";

class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    readyState = MockWebSocket.CONNECTING;
    onopen: (() => void) | null = null;
    onmessage: ((event: { data: unknown }) => void) | null = null;
    onerror: (() => void) | null = null;
    onclose: (() => void) | null = null;

    send = vi.fn();
    close = vi.fn();

    static instances: MockWebSocket[] = [];

    url: string;

    constructor(url: string) {
        this.url = url;
        MockWebSocket.instances.push(this);
    }

    open() {
        this.readyState = MockWebSocket.OPEN;
        this.onopen?.();
    }

    receive(data: unknown) {
        this.onmessage?.({ data });
    }

    fail() {
        this.onerror?.();
    }

    disconnect() {
        this.readyState = MockWebSocket.CLOSED;
        this.onclose?.();
    }
}

describe("WebSocketService", () => {
    let socket: MockWebSocket;
    let service: WebSocketService;

    const handlers = {
        onMessage: vi.fn(),
        onStatusChange: vi.fn(),
        onError: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();

        vi.stubGlobal(
            "WebSocket",
            MockWebSocket as unknown as typeof WebSocket
        );

        service = new WebSocketService(handlers, "ws://localhost:3000/ws");
        service.connect();

        socket = (service as unknown as {
            socket: MockWebSocket;
        }).socket;
    });

    afterEach(() => {
        service.close();
        vi.unstubAllGlobals();
    });

    it("should connect to the configured URL", () => {
        expect(socket.url).toBe("ws://localhost:3000/ws");
        expect(handlers.onStatusChange).toHaveBeenCalledWith("connecting");
    });

    it("should notify when the connection opens", () => {
        socket.open();

        expect(handlers.onStatusChange).toHaveBeenCalledWith("connected");
    });

    it("should send messages as JSON", () => {
        socket.open();

        const result = service.send({
            type: "join",
            name: "Alice"
        });

        expect(result).toBe(true);
        expect(socket.send).toHaveBeenCalledWith(
            JSON.stringify({ type: "join", name: "Alice" })
        );
    });

    it("should not send messages when disconnected", () => {
        expect(service.send({
            type: "join",
            name: "Alice"
        })).toBe(false);

        expect(socket.send).not.toHaveBeenCalled();
    });

    it("should process valid server messages", () => {
        socket.open();

        const message = {
            type: "initial_state",
            participantId: "p1",
            participants: [],
            products: [],
            votes: []
        };

        socket.receive(JSON.stringify(message));

        expect(handlers.onMessage).toHaveBeenCalledWith(message);
    });

    it("should report invalid JSON", () => {
        socket.open();
        socket.receive("{invalid json");

        expect(handlers.onError).toHaveBeenCalledWith(
            "Received invalid JSON from the server."
        );
    });

    it("should report invalid server messages", () => {
        socket.open();
        socket.receive(JSON.stringify({ type: "unknown" }));

        expect(handlers.onError).toHaveBeenCalledWith(
            "Received an invalid server message."
        );
    });

    it("should report connection errors", () => {
        socket.fail();

        expect(handlers.onStatusChange).toHaveBeenCalledWith("error");
        expect(handlers.onError).toHaveBeenCalledWith(
            "WebSocket connection error."
        );
    });

    it("should notify when the connection closes", () => {
        socket.open();
        socket.disconnect();

        expect(handlers.onStatusChange).toHaveBeenLastCalledWith("disconnected");
    });
});

import type {
    ClientMessage,
    ServerMessage
} from "../types/websocket";

export type WebSocketStatus =
    | "connecting"
    | "connected"
    | "disconnected"
    | "error";

interface WebSocketServiceHandlers {
    onMessage: (message: ServerMessage) => void;
    onStatusChange: (status: WebSocketStatus) => void;
    onError: (message: string) => void;
}

function getWebSocketUrl(): string {
    const configuredUrl = import.meta.env.VITE_WS_URL;

    if (configuredUrl) {
        return configuredUrl;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

    if (import.meta.env.DEV) {
        return `${protocol}//${window.location.hostname}:3000/ws`;
    }

    return `${protocol}//${window.location.host}/ws`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isServerMessage(value: unknown): value is ServerMessage {
    if (!isRecord(value) || typeof value.type !== "string") {
        return false;
    }

    switch (value.type) {
        case "initial_state":
            return (
                typeof value.participantId === "string" &&
                Array.isArray(value.participants) &&
                Array.isArray(value.products) &&
                Array.isArray(value.votes)
            );

        case "state_update":
            return (
                Array.isArray(value.participants) &&
                Array.isArray(value.products) &&
                Array.isArray(value.votes)
            );

        case "action_result":
            return (
                typeof value.action === "string" &&
                typeof value.success === "boolean"
            );

        case "error":
            return (
                typeof value.code === "string" &&
                typeof value.message === "string"
            );

        default:
            return false;
    }
}

export class WebSocketService {
    private socket: WebSocket | null = null;

    private readonly handlers: WebSocketServiceHandlers;
    private readonly url: string;

    constructor(
        handlers: WebSocketServiceHandlers,
        url: string = getWebSocketUrl()
    ) {
        this.handlers = handlers;
        this.url = url;
    }

    connect(): void {
        if (
            this.socket?.readyState === WebSocket.CONNECTING ||
            this.socket?.readyState === WebSocket.OPEN
        ) {
            return;
        }

        this.handlers.onStatusChange("connecting");

        try {
            const socket = new WebSocket(this.url);
            this.socket = socket;

            socket.onopen = () => {
                if (this.socket !== socket) return;

                this.handlers.onStatusChange("connected");
            };

            socket.onmessage = (event: MessageEvent<unknown>) => {
                if (this.socket !== socket) return;

                this.handleMessage(event.data);
            };

            socket.onerror = () => {
                if (this.socket !== socket) return;

                this.handlers.onStatusChange("error");
                this.handlers.onError("WebSocket connection error.");
            };

            socket.onclose = () => {
                if (this.socket !== socket) return;

                this.socket = null;
                this.handlers.onStatusChange("disconnected");
            };
        } catch {
            this.socket = null;
            this.handlers.onStatusChange("error");
            this.handlers.onError(
                "Unable to establish the WebSocket connection."
            );
        }
    }

    send(message: ClientMessage): boolean {
        if (this.socket?.readyState !== WebSocket.OPEN) {
            return false;
        }

        this.socket.send(JSON.stringify(message));
        return true;
    }

    close(): void {
        const socket = this.socket;

        if (!socket) return;

        this.socket = null;

        // Prevent callbacks from a connection that is being closed.
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;

        socket.close();
    }

    private handleMessage(data: unknown): void {
        if (typeof data !== "string") {
            this.handlers.onError(
                "Received a non-text WebSocket message."
            );
            return;
        }

        let parsed: unknown;

        try {
            parsed = JSON.parse(data);
        } catch {
            this.handlers.onError(
                "Received invalid JSON from the server."
            );
            return;
        }

        if (!isServerMessage(parsed)) {
            this.handlers.onError(
                "Received an invalid server message."
            );
            return;
        }

        this.handlers.onMessage(parsed);
    }
}

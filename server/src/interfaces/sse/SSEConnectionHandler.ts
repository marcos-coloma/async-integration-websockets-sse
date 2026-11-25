import type { Express } from "express";
import { SSEBroadcaster } from "./SSEBroadcaster";

export class SSEConnectionHandler {
    constructor(
        private readonly broadcaster: SSEBroadcaster
    ) {}

    register(app: Express): void {
        app.get("/events", (_req, res) => {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");

            res.flushHeaders();

            this.broadcaster.addClient(res);

            res.on("close", () => {
                this.broadcaster.removeClient(res);
            });
        });
    }
}
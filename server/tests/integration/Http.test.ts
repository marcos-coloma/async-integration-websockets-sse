
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import { createServer, type Server } from "node:http";

import HealthRoutes from "../../src/interfaces/http/HealthRoutes";

describe("HTTP integration", () => {
    let server: Server;
    let baseUrl: string;

    beforeAll(async () => {
        const app = express();

        app.use(HealthRoutes);

        server = createServer(app);

        await new Promise<void>((resolve, reject) => {
            server.once("error", reject);

            server.listen(0, "127.0.0.1", () => {
                resolve();
            });
        });

        const address = server.address();

        if (!address || typeof address === "string") {
            throw new Error("Could not determine server address");
        }

        baseUrl = `http://127.0.0.1:${address.port}`;
    });

    afterAll(async () => {
        await new Promise<void>((resolve, reject) => {
            server.close(error => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve();
            });
        });
    });

    it("should return a successful health response", async () => {
        const response = await fetch(`${baseUrl}/health`);

        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toContain("application/json");

        await expect(response.json()).resolves.toEqual({
            status: "ok"
        });
    });

    it("should return 404 for an unknown route", async () => {
        const response = await fetch(`${baseUrl}/unknown`);

        expect(response.status).toBe(404);
    });
});

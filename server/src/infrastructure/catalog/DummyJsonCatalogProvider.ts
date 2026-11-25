import { env } from "../../config/env";
import { CatalogError } from "../../application/errors/CatalogError";
import type {
    CatalogProduct,
    CatalogProvider
} from "../../application/ports/CatalogProvider";

export class DummyJsonCatalogProvider implements CatalogProvider {
    async findById(id: number): Promise<CatalogProduct> {
        const url = new URL(`${env.catalogUrl}/${id}`);

        if (env.catalogDelayMs > 0) {
            url.searchParams.set("delay", String(env.catalogDelayMs));
        }

        let response: Response;

        try {
            response = await fetch(url, {
                signal: AbortSignal.timeout(env.catalogTimeoutMs)
            });
        } catch (error) {
            if (
                error instanceof Error &&
                (error.name === "TimeoutError" || error.name === "AbortError")
            ) {
                throw new CatalogError(
                    "TIMEOUT",
                    "Catalog request timed out."
                );
            }

            throw new CatalogError(
                "UNAVAILABLE",
                "Could not connect to the catalog."
            );
        }

        if (response.status === 404) {
            throw new CatalogError(
                "NOT_FOUND",
                `Product ${id} was not found.`
            );
        }

        if (!response.ok) {
            throw new CatalogError(
                "UNAVAILABLE",
                `Catalog responded with status ${response.status}.`
            );
        }

        let data: unknown;

        try {
            data = await response.json();
        } catch {
            throw new CatalogError(
                "UNAVAILABLE",
                "Catalog returned an invalid response."
            );
        }

        if (
            typeof data !== "object" ||
            data === null ||
            !("id" in data) ||
            !("title" in data) ||
            !("price" in data) ||
            !("thumbnail" in data) ||
            typeof data.id !== "number" ||
            typeof data.title !== "string" ||
            typeof data.price !== "number" ||
            typeof data.thumbnail !== "string"
        ) {
            throw new CatalogError(
                "UNAVAILABLE",
                "Catalog returned an invalid product."
            );
        }

        return {
            id: data.id,
            title: data.title,
            price: data.price,
            thumbnail: data.thumbnail
        };
    }
}
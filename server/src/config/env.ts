function readPositiveInteger(name: string, fallback: number): number {
    const rawValue = process.env[name];

    if (rawValue === undefined || rawValue.trim() === "") {
        return fallback;
    }

    const value = Number(rawValue);

    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`${name} must be a positive integer.`);
    }

    return value;
}

function readNonNegativeInteger(name: string, fallback: number): number {
    const rawValue = process.env[name];

    if (rawValue === undefined || rawValue.trim() === "") {
        return fallback;
    }

    const value = Number(rawValue);

    if (!Number.isInteger(value) || value < 0) {
        throw new Error(`${name} must be a non-negative integer.`);
    }

    return value;
}

const catalogUrl = process.env.CATALOG_URL ?? "https://dummyjson.com/products";

try {
    new URL(catalogUrl);
} catch {
    throw new Error("CATALOG_URL must be a valid URL.");
}

export const env = {
    port: readPositiveInteger("PORT", 3000),
    catalogUrl: catalogUrl.replace(/\/$/, ""),
    catalogTimeoutMs: readPositiveInteger("CATALOG_TIMEOUT_MS", 5000),
    catalogDelayMs: readNonNegativeInteger("CATALOG_DELAY_MS", 0),
};
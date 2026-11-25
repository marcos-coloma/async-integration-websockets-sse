export type CatalogErrorCode =
    | "NOT_FOUND"
    | "TIMEOUT"
    | "UNAVAILABLE";

export class CatalogError extends Error {
    constructor(
        public readonly code: CatalogErrorCode,
        message: string
    ) {
        super(message);
        this.name = "CatalogError";
    }
}
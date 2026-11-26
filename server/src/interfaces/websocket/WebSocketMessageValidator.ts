import type { RawData } from "ws";

type ClientMessage =
    | { type: "join"; name: string }
    | { type: "change_name"; name: string }
    | { type: "propose_products"; productIds: number[] }
    | { type: "vote"; productId: number }
    | { type: "remove_vote"; productId: number }
    | { type: "remove_product"; productId: number };

type ValidationResult =
    | { valid: true; message: ClientMessage }
    | { valid: false; code: string; message: string };

const MAX_NAME_LENGTH = 20;

export class WebSocketMessageValidator {
    validate(data: RawData): ValidationResult {

        let text: string;

        if (Buffer.isBuffer(data)) {
            text = data.toString("utf-8");
        } else if (Array.isArray(data)) {
            text = Buffer.concat(data).toString("utf-8");
        } else {
            text = Buffer.from(data).toString("utf-8");
        }

        let parsed: unknown;

        try {
            parsed = JSON.parse(text);
        } catch {
            return {
                valid: false,
                code: "INVALID_JSON",
                message: "Message must contain valid JSON."
            };
        }

        if (
            typeof parsed !== "object" ||
            parsed === null ||
            !("type" in parsed) ||
            typeof parsed.type !== "string"
        ) {
            return {
                valid: false,
                code: "INVALID_MESSAGE",
                message: "Message must contain a valid type."
            };
        }

        switch (parsed.type) {
            case "join":
            case "change_name":
                if (
                    !("name" in parsed) ||
                    typeof parsed.name !== "string" ||
                    parsed.name.trim().length === 0 ||
                    parsed.name.trim().length > MAX_NAME_LENGTH
                ) {
                    return this.invalidFields();
                }
                break;

            case "propose_products":
                if (
                    !("productIds" in parsed) ||
                    !Array.isArray(parsed.productIds) ||
                    parsed.productIds.length < 1 ||
                    parsed.productIds.length > 10 ||
                    !parsed.productIds.every(
                        id =>
                            typeof id === "number" &&
                            Number.isInteger(id) &&
                            id > 0
                    )
                ) {
                    return this.invalidFields();
                }
                break;

            case "vote":
            case "remove_vote":
            case "remove_product":
                if (
                    !("productId" in parsed) ||
                    typeof parsed.productId !== "number" ||
                    !Number.isInteger(parsed.productId) ||
                    parsed.productId <= 0
                ) {
                    return this.invalidFields();
                }
                break;

            default:
                return {
                    valid: false,
                    code: "UNKNOWN_MESSAGE",
                    message: "Unknown message type."
                };
        }

        return {
            valid: true,
            message: parsed as ClientMessage
        };
    }

    private invalidFields(): ValidationResult {
        return {
            valid: false,
            code: "INVALID_FIELDS",
            message: "Message contains missing or invalid fields."
        };
    }
}
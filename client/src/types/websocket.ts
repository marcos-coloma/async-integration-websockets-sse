import type { SharedState } from "./entities";

export type ClientMessage =
    | { type: "join"; name: string }
    | { type: "change_name"; name: string }
    | { type: "propose_products"; productIds: number[] }
    | { type: "vote"; productId: number }
    | { type: "remove_vote"; productId: number }
    | { type: "remove_product"; productId: number };

export type ActionType =
    | "change_name"
    | "propose_products"
    | "vote"
    | "remove_vote"
    | "remove_product";

export type ProductProposalFailureReason =
    | "not_found"
    | "timeout"
    | "duplicate"
    | "unavailable";

export interface ProductProposalFailure {
    productId: number;
    reason: ProductProposalFailureReason;
}

export interface InitialStateMessage extends SharedState {
    type: "initial_state";
    participantId: string;
}

export interface StateUpdateMessage extends SharedState {
    type: "state_update";
}

export interface ActionResultMessage {
    type: "action_result";
    action: ActionType;
    success: boolean;
    added?: number[];
    failed?: ProductProposalFailure[];
}

export type ServerErrorCode =
    | "INVALID_JSON"
    | "INVALID_MESSAGE"
    | "UNKNOWN_MESSAGE"
    | "INVALID_FIELDS"
    | "NOT_AUTHORIZED"
    | "NAME_TAKEN"
    | "NOT_FOUND"
    | "DUPLICATE_VOTE"
    | "INTERNAL_ERROR";

export interface ErrorMessage {
    type: "error";
    code: ServerErrorCode;
    message: string;
}

export type ServerMessage =
    | InitialStateMessage
    | StateUpdateMessage
    | ActionResultMessage
    | ErrorMessage;

import type { SharedState } from "./entities";

export interface InitialStateEvent extends SharedState {
    type: "initial_state";
}

export interface StateUpdateEvent extends SharedState {
    type: "state_update";
}

export type SSEEvent =
    | InitialStateEvent
    | StateUpdateEvent;

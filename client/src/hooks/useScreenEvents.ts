
import { useCallback, useEffect, useRef, useState } from "react";

import type { SharedState } from "../types/entities";
import type { SSEEvent } from "../types/sse";

import {
    SSEService,
    type SSEStatus
} from "../services/sse";

const emptyState: SharedState = {
    participants: [],
    products: [],
    votes: []
};

export function useScreenEvents() {
    const serviceRef = useRef<SSEService | null>(null);

    const [status, setStatus] =
        useState<SSEStatus>("disconnected");

    const [sharedState, setSharedState] =
        useState<SharedState>(emptyState);

    const [connectionError, setConnectionError] =
        useState<string | null>(null);

    const handleEvent = useCallback((event: SSEEvent) => {
        switch (event.type) {
            case "initial_state":
            case "state_update":
                setSharedState({
                    participants: event.participants,
                    products: event.products,
                    votes: event.votes
                });
                break;
        }
    }, []);

    useEffect(() => {
        const service = new SSEService({
            onEvent: handleEvent,

            onStatusChange: (nextStatus) => {
                setStatus(nextStatus);

                if (nextStatus === "connected") {
                    setConnectionError(null);
                }
            },

            onError: setConnectionError
        });

        serviceRef.current = service;
        service.connect();

        return () => {
            service.close();
            serviceRef.current = null;
        };
    }, [handleEvent]);

    return {
        status,
        sharedState,
        connectionError
    };
}

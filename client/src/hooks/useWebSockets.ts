
import { useCallback, useEffect, useRef, useState } from "react";

import type { SharedState } from "../types/entities";

import type {
    ActionResultMessage,
    ClientMessage,
    ErrorMessage,
    ServerMessage
} from "../types/websocket";

import {
    WebSocketService,
    type WebSocketStatus
} from "../services/websocket";

const emptyState: SharedState = {
    participants: [],
    products: [],
    votes: []
};

export function useWebSockets() {
    const serviceRef = useRef<WebSocketService | null>(null);

    const [status, setStatus] =
        useState<WebSocketStatus>("disconnected");

    const [sharedState, setSharedState] =
        useState<SharedState>(emptyState);

    const [participantId, setParticipantId] =
        useState<string | null>(null);

    const [lastActionResult, setLastActionResult] =
        useState<ActionResultMessage | null>(null);

    const [lastError, setLastError] =
        useState<ErrorMessage | null>(null);

    const [connectionError, setConnectionError] =
        useState<string | null>(null);

    const handleMessage = useCallback((message: ServerMessage) => {
        switch (message.type) {
            case "initial_state":
                setParticipantId(message.participantId);

                setSharedState({
                    participants: message.participants,
                    products: message.products,
                    votes: message.votes
                });

                setLastError(null);
                break;

            case "state_update":
                setSharedState({
                    participants: message.participants,
                    products: message.products,
                    votes: message.votes
                });
                break;

            case "action_result":
                setLastActionResult(message);
                break;

            case "error":
                setLastError(message);
                break;
        }
    }, []);

    useEffect(() => {
        const service = new WebSocketService({
            onMessage: handleMessage,

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
    }, [handleMessage]);

    const sendMessage = useCallback(
        (message: ClientMessage): boolean => {
            setLastActionResult(null);
            setLastError(null);

            const sent = serviceRef.current?.send(message) ?? false;

            if (!sent) {
                setConnectionError("WebSocket is not connected.");
            }

            return sent;
        },
        []
    );

    const join = useCallback(
        (name: string) =>
            sendMessage({ type: "join", name }),
        [sendMessage]
    );

    const changeName = useCallback(
        (name: string) =>
            sendMessage({ type: "change_name", name }),
        [sendMessage]
    );

    const proposeProducts = useCallback(
        (productIds: number[]) =>
            sendMessage({ type: "propose_products", productIds }),
        [sendMessage]
    );

    const vote = useCallback(
        (productId: number) =>
            sendMessage({ type: "vote", productId }),
        [sendMessage]
    );

    const removeVote = useCallback(
        (productId: number) =>
            sendMessage({ type: "remove_vote", productId }),
        [sendMessage]
    );

    const removeProduct = useCallback(
        (productId: number) =>
            sendMessage({ type: "remove_product", productId }),
        [sendMessage]
    );

    return {
        status,
        sharedState,
        participantId,
        lastActionResult,
        lastError,
        connectionError,
        join,
        changeName,
        proposeProducts,
        vote,
        removeVote,
        removeProduct
    };
}

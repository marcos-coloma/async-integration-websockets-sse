import type { Participant, Product, Vote } from "../types/entities";
import type { WebSocketStatus } from "../services/websocket";
import type { ActionResultMessage, ErrorMessage } from "../types/websocket";

import { ProductProposalForm } from "../components/ProductProposalForm";
import { ProductList } from "../components/ProductList";

interface ParticipantsPageProps {
    readonly participantId: string;
    readonly participants: Participant[];
    readonly products: Product[];
    readonly votes: Vote[];
    readonly status: WebSocketStatus;
    readonly lastActionResult: ActionResultMessage | null;
    readonly lastError: ErrorMessage | null;
    readonly connectionError: string | null;
    readonly onPropose: (productIds: number[]) => void;
    readonly onVote: (productId: number) => void;
    readonly onRemoveVote: (productId: number) => void;
    readonly onRemoveProduct: (productId: number) => void;
}

export function ParticipantsPage({
    participantId,
    participants,
    products,
    votes,
    status,
    lastActionResult,
    lastError,
    connectionError,
    onPropose,
    onVote,
    onRemoveVote,
    onRemoveProduct
}: ParticipantsPageProps) {
    const currentParticipant = participants.find(
        participant => participant.id === participantId
    );

    const proposalResult =
        lastActionResult?.action === "propose_products"
            ? lastActionResult
            : null;

    return (
        <main>
            <h1>Real-time Collaboration</h1>

            <section>
                <h2>My session</h2>

                <p>
                    Connected as: {currentParticipant?.name ?? "Unknown"}
                </p>

                <p>Connection status: {status}</p>

                {(lastError || connectionError) && (
                    <p>
                        Error: {lastError?.message ?? connectionError}
                    </p>
                )}
            </section>

            <section>
                <h2>Connected participants ({participants.length})</h2>

                {participants.length === 0 ? (
                    <p>No participants connected.</p>
                ) : (
                    <ul>
                        {participants.map(participant => (
                            <li key={participant.id}>
                                {participant.name}

                                {participant.id === participantId && (
                                    <span> (You)</span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <ProductProposalForm onPropose={onPropose} />

            {proposalResult && (
                <section>
                    <h2>Proposal result</h2>

                    {proposalResult.added &&
                        proposalResult.added.length > 0 && (
                            <p>
                                Successfully added:{" "}
                                {proposalResult.added.join(", ")}
                            </p>
                        )}

                    {proposalResult.failed &&
                        proposalResult.failed.length > 0 && (
                            <>
                                <p>Failed products:</p>

                                <ul>
                                    {proposalResult.failed.map(failure => (
                                        <li key={failure.productId}>
                                            Product {failure.productId}:{" "}
                                            {failure.reason}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                </section>
            )}

            <ProductList
                products={products}
                votes={votes}
                participantId={participantId}
                participants={participants}
                onVote={onVote}
                onRemoveVote={onRemoveVote}
                onRemoveProduct={onRemoveProduct}
            />
        </main>
    );
}


import type { Participant, Product, Vote } from "../types/entities";
import "./ParticipantsPage.css";
import type { WebSocketStatus } from "../services/websocket";
import type {
    ActionResultMessage,
    ErrorMessage
} from "../types/websocket";

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
        <main className="participants-page">
            <div className="page-shell">
                <header className="participants-header">
                    <div className="page-heading">
                        <p className="eyebrow">Shared workspace</p>
                        <h1 className="page-title">
                            Real-time Collaboration
                        </h1>
                        <p className="page-description">
                            Build your list together. Propose products
                            and vote for your favorites.
                        </p>
                    </div>

                    <div className="session-card">
                        <div className="session-avatar">
                            {currentParticipant?.name
                                ?.charAt(0)
                                .toUpperCase() ?? "?"}
                        </div>

                        <div className="session-copy">
                            <span className="session-name">
                                {currentParticipant?.name ?? "Unknown"}
                            </span>
                            <span className="session-label">
                                Your session
                            </span>
                        </div>

                        <span className={`status-indicator status-${status}`}>
                            <span className="status-dot" />
                            {status}
                        </span>
                    </div>
                </header>

                {(lastError || connectionError) && (
                    <div className="feedback" role="alert">
                        {lastError?.message ?? connectionError}
                    </div>
                )}

                <div className="participants-layout">
                    <div className="participants-main-column">
                        <section className="panel">
                            <div className="panel-heading">
                                <div className="panel-heading-copy">
                                    <h2 className="section-title">
                                        Propose products
                                    </h2>
                                    <p className="section-description">
                                        Add products from the catalog
                                        using their IDs.
                                    </p>
                                </div>
                            </div>

                            <ProductProposalForm onPropose={onPropose} />
                        </section>

                        {proposalResult && (
                            <section
                                className={`feedback ${
                                    proposalResult.success
                                        ? "feedback-success"
                                        : ""
                                }`}
                            >
                                <p className="feedback-title">
                                    Proposal result
                                </p>

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
                                                {proposalResult.failed.map(
                                                    failure => (
                                                        <li key={failure.productId}>
                                                            Product{" "}
                                                            {failure.productId}:{" "}
                                                            {failure.reason}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        </>
                                    )}
                            </section>
                        )}

                        <section className="panel">
                            <div className="panel-heading">
                                <div className="panel-heading-copy">
                                    <h2 className="section-title">
                                        Shared product list
                                    </h2>
                                    <p className="section-description">
                                        Vote for the products you prefer.
                                    </p>
                                </div>

                                <span className="count-badge">
                                    {products.length}
                                </span>
                            </div>

                            <ProductList
                                products={products}
                                votes={votes}
                                participantId={participantId}
                                participants={participants}
                                onVote={onVote}
                                onRemoveVote={onRemoveVote}
                                onRemoveProduct={onRemoveProduct}
                            />
                        </section>
                    </div>

                    <aside className="participants-sidebar">
                        <section className="panel">
                            <div className="panel-heading">
                                <div className="panel-heading-copy">
                                    <h2 className="section-title">
                                        Participants
                                    </h2>
                                    <p className="section-description">
                                        People in this session
                                    </p>
                                </div>

                                <span className="count-badge">
                                    {participants.length}
                                </span>
                            </div>

                            {participants.length === 0 ? (
                                <div className="empty-state">
                                    <div>
                                        <strong>No participants yet</strong>
                                        <p>Waiting for people to join.</p>
                                    </div>
                                </div>
                            ) : (
                                <ul className="participant-list">
                                    {participants.map(participant => (
                                        <li
                                            className={`participant-chip ${
                                                participant.id === participantId
                                                    ? "participant-chip-you"
                                                    : ""
                                            }`}
                                            key={participant.id}
                                        >
                                            <span className="participant-avatar">
                                                {participant.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </span>

                                            {participant.name}

                                            {participant.id === participantId &&
                                                " (You)"}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <section className="panel">
                            <h2 className="section-title">
                                How it works
                            </h2>

                            <p className="section-description">
                                Collaborate with your group in real time.
                            </p>

                            <ul className="how-it-works-list">
                                <li>Propose products from the catalog.</li>
                                <li>Vote for the products you like.</li>
                                <li>Watch the shared ranking update.</li>
                            </ul>
                        </section>
                    </aside>
                </div>
            </div>
        </main>
    );
}

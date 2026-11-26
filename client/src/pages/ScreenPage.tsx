
import { RankingList } from "../components/RankingList";
import { useScreenEvents } from "../hooks/useScreenEvents";
import "./ScreenPage.css";

export function ScreenPage() {
    const { status, sharedState, connectionError } = useScreenEvents();

    return (
        <main className="screen-page">
            <div className="page-shell">
                <header className="screen-header">
                    <div>
                        <p className="eyebrow">
                            Realtime Collaboration
                        </p>

                        <h1 className="screen-title">
                            Live product ranking
                        </h1>

                        <p className="screen-subtitle">
                            The group's favorites, updated in real time.
                        </p>
                    </div>

                    <div className="screen-stats">
                        <div className="screen-stat">
                            <span className="screen-stat-value">
                                {sharedState.participants.length}
                            </span>
                            <span className="screen-stat-label">
                                Participants
                            </span>
                        </div>

                        <div className="screen-stat">
                            <span className="screen-stat-value">
                                {sharedState.products.length}
                            </span>
                            <span className="screen-stat-label">
                                Products
                            </span>
                        </div>

                        <div className={`status-indicator status-${status}`}>
                            <span className="status-dot" />
                            {status}
                        </div>
                    </div>
                </header>

                {connectionError && (
                    <div className="feedback" role="alert">
                        {connectionError}
                    </div>
                )}

                <section className="ranking-section">
                    <div className="panel-heading">
                        <div className="panel-heading-copy">
                            <h2 className="section-title">
                                Community ranking
                            </h2>
                            <p className="section-description">
                                Products ordered by the number of votes.
                            </p>
                        </div>

                        <span className="count-badge">
                            {sharedState.products.length}
                        </span>
                    </div>

                    <RankingList
                        products={sharedState.products}
                        votes={sharedState.votes}
                    />

                    <div className="screen-participants">
                        {sharedState.participants.map(participant => (
                            <span
                                className="screen-participant"
                                key={participant.id}
                            >
                                {participant.name}
                            </span>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}

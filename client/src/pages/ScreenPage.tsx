
import { RankingList } from "../components/RankingList";
import { useScreenEvents } from "../hooks/useScreenEvents";

export function ScreenPage() {
    const { status, sharedState, connectionError } = useScreenEvents();

    return (
        <main>
            <header>
                <h1>Live product ranking</h1>
                <p>SSE connection: {status}</p>
            </header>

            {connectionError && (
                <p role="alert">{connectionError}</p>
            )}

            <section>
                <h2>Connected participants</h2>
                <p>Total: {sharedState.participants.length}</p>

                {sharedState.participants.length === 0 ? (
                    <p>No participants connected.</p>
                ) : (
                    <ul>
                        {sharedState.participants.map(participant => (
                            <li key={participant.id}>
                                {participant.name}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <RankingList
                products={sharedState.products}
                votes={sharedState.votes}
            />
        </main>
    );
}

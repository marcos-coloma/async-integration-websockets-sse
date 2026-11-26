
import type { Participant } from "../types/entities";
import type { WebSocketStatus } from "../services/websocket";

interface ParticipantsPageProps {
    readonly participantId: string;
    readonly participants: Participant[];
    readonly status: WebSocketStatus;
}

export function ParticipantsPage({
    participantId,
    participants,
    status
}: ParticipantsPageProps) {
    const currentParticipant = participants.find(
        participant => participant.id === participantId
    );

    return (
        <main>
            <h1>Real-time Collaboration</h1>

            <section>
                <h2>My session</h2>

                <p>
                    Connected as: {currentParticipant?.name ?? "Unknown"}
                </p>

                <p>Connection status: {status}</p>
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
        </main>
    );
}

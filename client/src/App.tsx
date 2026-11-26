
import { useWebSockets } from "./hooks/useWebSockets";
import { JoinPage } from "./pages/JoinPage";
import { ParticipantsPage } from "./pages/ParticipantsPage";

function App() {
    const websocket = useWebSockets();

    if (!websocket.participantId) {
        return (
            <JoinPage
                status={websocket.status}
                error={
                    websocket.lastError?.message ??
                    websocket.connectionError
                }
                onJoin={websocket.join}
            />
        );
    }

    return (
        <ParticipantsPage
            participantId={websocket.participantId}
            participants={websocket.sharedState.participants}
            status={websocket.status}
        />
    );
}

export default App;

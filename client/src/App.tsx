
import { useWebSockets } from "./hooks/useWebSockets";
import { JoinPage } from "./pages/JoinPage";
import { ParticipantsPage } from "./pages/ParticipantsPage";
import { ScreenPage } from "./pages/ScreenPage";

function ParticipantsApp() {
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
            products={websocket.sharedState.products}
            votes={websocket.sharedState.votes}
            status={websocket.status}
            lastActionResult={websocket.lastActionResult}
            lastError={websocket.lastError}
            connectionError={websocket.connectionError}
            onPropose={websocket.proposeProducts}
            onVote={websocket.vote}
            onRemoveVote={websocket.removeVote}
            onRemoveProduct={websocket.removeProduct}
        />
    );
}

function App() {
    if (window.location.pathname === "/screen") {
        return <ScreenPage />;
    }

    return <ParticipantsApp />;
}

export default App;

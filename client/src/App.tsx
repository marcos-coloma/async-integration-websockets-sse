
import { useWebSockets } from "./hooks/useWebSockets";
import { JoinPage } from "./pages/JoinPage";

function App() {
    const websocket = useWebSockets();

    if (!websocket.participantId) {
        return (
            <JoinPage
                status={websocket.status}
                error={websocket.lastError?.message ?? websocket.connectionError}
                onJoin={websocket.join}
            />
        );
    }

    return (
        <main>
            <h1>Real-time Collaboration</h1>
            <p>Connected as participant: {websocket.participantId}</p>
        </main>
    );
}

export default App;

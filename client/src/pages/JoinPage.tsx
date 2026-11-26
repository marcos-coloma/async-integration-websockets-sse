
import { useState } from "react";

interface JoinPageProps {
    readonly status: string;
    readonly error: string | null;
    readonly onJoin: (name: string) => void;
}

export function JoinPage({
    status,
    error,
    onJoin
}: JoinPageProps) {

    const [name, setName] = useState("");
    const [validationError, setValidationError] =
        useState<string | null>(null);

    function handleSubmit(event: Parameters<
    NonNullable<React.ComponentProps<"form">["onSubmit"]>
    >[0]) {
        event.preventDefault();

        const trimmedName = name.trim();

        if (trimmedName.length < 1 || trimmedName.length > 20) {
            setValidationError(
                "Name must contain between 1 and 20 characters."
            );
            return;
        }

        setValidationError(null);
        onJoin(trimmedName);
    }

    function handleNameChange(value: string) {
        setName(value);
        setValidationError(null);
    }

    return (
        <main>
            <h1>Join the shared list</h1>

            <form onSubmit={handleSubmit}>
                <label htmlFor="participant-name">
                    Your name
                </label>

                <input
                    id="participant-name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                        handleNameChange(event.target.value)
                    }
                    maxLength={20}
                    required
                />

                <button type="submit">
                    Join
                </button>
            </form>

            <p>Connection status: {status}</p>

            {validationError && (
                <p>{validationError}</p>
            )}

            {error && (
                <p>{error}</p>
            )}
        </main>
    );
}

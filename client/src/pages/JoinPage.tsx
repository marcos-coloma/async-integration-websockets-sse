
import { useState } from "react";
import "./JoinPage.css";

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

    function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
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
        <main className="join-page">
            <section className="join-card">
                <div className="join-brand" aria-hidden="true">
                    R
                </div>

                <p className="eyebrow">Realtime Collaboration</p>

                <h1 className="join-title">
                    Join the shared list
                </h1>

                <p className="join-description">
                    Join your group, discover products and vote
                    together to decide what makes the list.
                </p>

                <form className="join-form" onSubmit={handleSubmit}>
                    <div>
                        <label
                            className="field-label"
                            htmlFor="participant-name"
                        >
                            Your name
                        </label>

                        <input
                            className="text-input"
                            id="participant-name"
                            type="text"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(event) =>
                                handleNameChange(event.target.value)
                            }
                            maxLength={20}
                            autoComplete="name"
                            required
                        />
                    </div>

                    <button className="btn btn-primary" type="submit">
                        Join session
                    </button>
                </form>

                {validationError && (
                    <p className="feedback" role="alert">
                        {validationError}
                    </p>
                )}

                {error && (
                    <p className="feedback" role="alert">
                        {error}
                    </p>
                )}

                <div className="join-footer">
                    <span className={`status-indicator status-${status}`}>
                        <span className="status-dot" />
                        {status}
                    </span>
                </div>
            </section>
        </main>
    );
}

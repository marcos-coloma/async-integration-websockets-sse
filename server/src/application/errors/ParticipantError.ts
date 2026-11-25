export type ParticipantErrorCode =
    | "INVALID_NAME"
    | "NAME_TAKEN";

export class ParticipantError extends Error {
    constructor(
        public readonly code: ParticipantErrorCode,
        message: string
    ) {
        super(message);
        this.name = "ParticipantError";
    }
}
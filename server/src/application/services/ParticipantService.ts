import { randomUUID } from "node:crypto";

import type { Participant } from "../../domain/entities/Participant";
import type { ParticipantRepository } from "../../domain/repositories/ParticipantRepository";
import { ParticipantError } from "../errors/ParticipantError";

const MAX_NAME_LENGTH = 20;

export class ParticipantService {
    constructor(
        private readonly participantRepository: ParticipantRepository
    ) {}

    private normalizeName(name: string): string {
        const normalizedName = name.trim();

        if (
            !normalizedName ||
            normalizedName.length > MAX_NAME_LENGTH
        ) {
            throw new ParticipantError(
                "INVALID_NAME",
                `Name must contain between 1 and ${MAX_NAME_LENGTH} characters.`
            );
        }

        return normalizedName;
    }

    private ensureNameIsAvailable(
        name: string,
        excludedParticipantId?: string
    ): void {
        const normalizedName = name.toLowerCase();

        const nameTaken = this.participantRepository.findAll().some(
            participant =>
                participant.id !== excludedParticipantId &&
                participant.name.toLowerCase() === normalizedName
        );

        if (nameTaken) {
            throw new ParticipantError(
                "NAME_TAKEN",
                "This participant name is already taken."
            );
        }
    }

    join(name: string): Participant {
        const normalizedName = this.normalizeName(name);

        this.ensureNameIsAvailable(normalizedName);

        const participant: Participant = {
            id: randomUUID(),
            name: normalizedName
        };

        this.participantRepository.save(participant);

        return participant;
    }

    changeName(
        participantId: string,
        name: string
    ): Participant | undefined {
        const participant = this.participantRepository.findById(participantId);

        if (!participant) {
            return undefined;
        }

        const normalizedName = this.normalizeName(name);

        this.ensureNameIsAvailable(normalizedName, participantId);

        const updatedParticipant: Participant = {
            ...participant,
            name: normalizedName
        };

        this.participantRepository.save(updatedParticipant);

        return updatedParticipant;
    }

    disconnect(participantId: string): boolean {
        return this.participantRepository.delete(participantId);
    }

    getConnectedParticipants(): Participant[] {
        return this.participantRepository.findAll();
    }
}
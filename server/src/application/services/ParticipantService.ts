import { randomUUID } from "node:crypto";

import type { Participant } from "../../domain/entities/Participant";
import type { ParticipantRepository } from "../../domain/repositories/ParticipantRepository";

export class ParticipantService {
    constructor(
        private readonly participantRepository: ParticipantRepository
    ) {}

    join(name: string): Participant {
        const normalizedName = name.trim();

        if (!normalizedName) {
            throw new Error("Participant name cannot be empty.");
        }

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

        const normalizedName = name.trim();

        if (!normalizedName) {
            throw new Error("Participant name cannot be empty.");
        }

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
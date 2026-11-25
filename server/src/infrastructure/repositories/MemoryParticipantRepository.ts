import type { Participant } from "../../domain/entities/Participant";
import type { AppState } from "../../domain/state/AppState";
import type { ParticipantRepository } from "../../domain/repositories/ParticipantRepository";

export class MemoryParticipantRepository implements ParticipantRepository {
    constructor(private readonly state: AppState) {}

    findAll(): Participant[] {
        return Array.from(this.state.participants.values());
    }

    findById(id: string): Participant | undefined {
        return this.state.participants.get(id);
    }

    save(participant: Participant): void {
        this.state.participants.set(participant.id, participant);
    }

    delete(id: string): boolean {
        return this.state.participants.delete(id);
    }
}
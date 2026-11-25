import type { Participant } from "../entities/Participant";

export interface ParticipantRepository {
    findAll(): Participant[];
    findById(id: string): Participant | undefined;
    save(participant: Participant): void;
    delete(id: string): boolean;
}
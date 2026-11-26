import { beforeEach, describe, expect, it } from "vitest";

import { ParticipantService } from "../../src/application/services/ParticipantService";
import { MemoryParticipantRepository } from "../../src/infrastructure/repositories/MemoryParticipantRepository";
import type { AppState } from "../../src/domain/state/AppState";

describe("ParticipantService", () => {
    let participantService: ParticipantService;

    beforeEach(() => {
        const state: AppState = {
            participants: new Map(),
            products: new Map(),
            votes: []
        };

        const participantRepository = new MemoryParticipantRepository(state);
        participantService = new ParticipantService(participantRepository);
    });

    describe("join", () => {
        it("should register a participant with a valid name", () => {
            const participant = participantService.join("Marcos");

            expect(participant).toMatchObject({
                name: "Marcos"
            });
            expect(participant.id).toBeDefined();
            expect(participantService.getConnectedParticipants()).toHaveLength(1);
        });

        it("should trim spaces from the participant name", () => {
            const participant = participantService.join("  Marcos  ");

            expect(participant.name).toBe("Marcos");
        });

        it("should reject an empty name", () => {
            expect(() => participantService.join("   ")).toThrow(
                "Name must contain between 1 and 20 characters."
            );
        });

        it("should reject a name longer than 20 characters", () => {
            expect(() => participantService.join("A".repeat(21))).toThrow(
                "Name must contain between 1 and 20 characters."
            );
        });

        it("should reject a duplicate name regardless of case", () => {
            participantService.join("Marcos");

            expect(() => participantService.join("MARCOS")).toThrow(
                "This participant name is already taken."
            );
        });
    });
});

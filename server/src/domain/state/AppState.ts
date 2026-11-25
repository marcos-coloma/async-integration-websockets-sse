import type { Participant } from "../entities/Participant";
import type { Product } from "../entities/Product";
import type { Vote } from "../entities/Vote";

export interface AppState {
    participants: Map<string, Participant>;
    products: Map<number, Product>;
    votes: Vote[];
}
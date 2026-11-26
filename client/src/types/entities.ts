export interface Participant {
    id: string;
    name: string;
}

export interface Product {
    id: number;
    title: string;
    price: number;
    thumbnail: string;
    proposedBy: string;
}

export interface Vote {
    participantId: string;
    productId: number;
}

export interface SharedState {
    participants: Participant[];
    products: Product[];
    votes: Vote[];
}

import type { Product } from "../../domain/entities/Product";
import type { AppState } from "../../domain/state/AppState";
import type { ProductRepository } from "../../domain/repositories/ProductRepository";

export class MemoryProductRepository implements ProductRepository {
    constructor(private readonly state: AppState) {}

    findAll(): Product[] {
        return Array.from(this.state.products.values());
    }

    findById(id: number): Product | undefined {
        return this.state.products.get(id);
    }

    save(product: Product): void {
        this.state.products.set(product.id, product);
    }

    delete(id: number): boolean {
        return this.state.products.delete(id);
    }
}
import type { Product } from "../entities/Product";

export interface ProductRepository {
    findAll(): Product[];
    findById(id: number): Product | undefined;
    save(product: Product): void;
    delete(id: number): boolean;
}
export interface CatalogProduct {
    id: number;
    title: string;
    price: number;
    thumbnail: string;
}

export interface CatalogProvider {
    findById(id: number): Promise<CatalogProduct>;
}
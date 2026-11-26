interface ProductProposalFormProps {
    readonly onPropose: (productIds: number[]) => void;
}

export function ProductProposalForm({
    onPropose
}: ProductProposalFormProps) {
    function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const value = formData.get("productIds");

        const input = typeof value === "string" ? value : "";

        const productIds = input
            .split(",")
            .map(id => Number(id.trim()))
            .filter(id => Number.isInteger(id) && id > 0);

        if (productIds.length === 0 || productIds.length > 10) {
            return;
        }

        onPropose([...new Set(productIds)]);
        event.currentTarget.reset();
    }

    return (
        <section>
            <h2>Propose products</h2>

            <form onSubmit={handleSubmit}>
                <label htmlFor="productIds">
                    Product IDs (separated by commas)
                </label>

                <input
                    id="productIds"
                    name="productIds"
                    type="text"
                    placeholder="Example: 1, 2, 3"
                    required
                />

                <button type="submit">
                    Propose
                </button>
            </form>

            <p>Enter between 1 and 10 product IDs.</p>
        </section>
    );
}

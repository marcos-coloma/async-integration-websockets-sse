
import "./ProductProposalForm.css";

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
        <form className="proposal-form" onSubmit={handleSubmit}>
            <div>
                <label className="field-label" htmlFor="productIds">
                    Product IDs
                </label>

                <div className="proposal-controls">
                    <input
                        className="text-input"
                        id="productIds"
                        name="productIds"
                        type="text"
                        placeholder="Example: 1, 2, 3"
                        required
                    />

                    <button className="btn btn-primary" type="submit">
                        Add products
                    </button>
                </div>
            </div>

            <p className="proposal-hint">
                Enter between 1 and 10 product IDs, separated by commas.
            </p>
        </form>
    );
}

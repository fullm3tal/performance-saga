/** Builds a deterministic list of fake transactions for the PERF-1 demo. */
type Transaction = {
    id: string;
    merchant: string;
    amount: number;
};

const MERCHANTS = ['Coffee Lab', 'Metro Card', 'Book Nook', 'Green Grocer', 'Cinema City', 'Fuel Stop', 'Pet Palace', 'Gym Club'];

function buildTransactions(count: number): Transaction[] {
    return Array.from({length: count}, (_, index) => ({
        id: `txn-${index}`,
        merchant: MERCHANTS[index % MERCHANTS.length],
        amount: ((index * 37) % 500) + 0.99,
    }));
}

export default buildTransactions;
export type {Transaction};

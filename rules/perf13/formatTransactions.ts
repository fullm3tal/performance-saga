/**
 * PERF-13 demo: turn a list of USD transactions into rupee strings for display.
 * Both versions return the same strings. The ❌ one asks for the exchange rate
 * and builds a number formatter inside .map(), once per transaction, even though
 * neither depends on the transaction. The ✅ one does both once, before the loop.
 */

type Transaction = {id: number; amountUSD: number};

/** Pretend user settings, stored as JSON like they would be in AsyncStorage. */
const SETTINGS_JSON = JSON.stringify({currency: 'INR', locale: 'en-IN', usdToInr: 83.25, theme: 'light', notifications: true});

/** How often each "setup" function ran. The demo and tests read this. */
const callCounts = {getExchangeRate: 0, createFormatter: 0};

function resetCallCounts() {
    callCounts.getExchangeRate = 0;
    callCounts.createFormatter = 0;
}

/** Reads the USD→INR rate from settings. Same answer every time it's called. */
function getExchangeRate(): number {
    callCounts.getExchangeRate += 1;
    return JSON.parse(SETTINGS_JSON).usdToInr;
}

/** Builds a rupee formatter. Creating an Intl formatter is famously slow. */
function createFormatter(): Intl.NumberFormat {
    callCounts.createFormatter += 1;
    return new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR'});
}

// ❌ getExchangeRate() and createFormatter() don't use `transaction`,
// yet they run again for every single item.
function formatInLoop(transactions: Transaction[]): string[] {
    return transactions.map((transaction) => {
        const rate = getExchangeRate();
        const formatter = createFormatter();
        return formatter.format(transaction.amountUSD * rate);
    });
}

// ✅ Same work, hoisted: each setup call runs once, no matter how long the list is.
function formatHoisted(transactions: Transaction[]): string[] {
    const rate = getExchangeRate();
    const formatter = createFormatter();
    return transactions.map((transaction) => formatter.format(transaction.amountUSD * rate));
}

function makeTransactions(count: number): Transaction[] {
    // Fixed amounts (no Math.random) so every run and every test sees the same data.
    return Array.from({length: count}, (_, index) => ({id: index, amountUSD: ((index * 37) % 500) + 0.99}));
}

export {callCounts, formatHoisted, formatInLoop, makeTransactions, resetCallCounts};
export type {Transaction};

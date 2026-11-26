/**
 * PERF-1: measures how many rows re-render, and how long React spends, when a
 * single row is selected in a list that spreads inside renderItem versus one
 * that passes props directly.
 */
import {fireEvent, render, screen} from '@testing-library/react-native';
import createRenderTracker, {type RenderTracker} from '@/lab/createRenderTracker';
import {Measured, RenderTrackerProvider} from '@/lab/RenderTrackerContext';
import buildTransactions from '@/rules/perf1/buildTransactions';
import TransactionList, {type RenderItemMode} from '@/rules/perf1/TransactionList';

const TRANSACTIONS = buildTransactions(50);

type TapResult = {
    mountedRows: number;
    rowsRenderedPerTap: number[];
    renderMsPerTap: number[];
};

function renderList(mode: RenderItemMode): RenderTracker {
    const tracker = createRenderTracker();
    render(
        <RenderTrackerProvider tracker={tracker}>
            <Measured id="list">
                <TransactionList
                    transactions={TRANSACTIONS}
                    mode={mode}
                />
            </Measured>
        </RenderTrackerProvider>,
    );
    return tracker;
}

const ROWS_TO_TAP = ['txn-2', 'txn-5', 'txn-7', 'txn-3', 'txn-8'];

/** Mounts the list, then selects five different rows one after another. */
function tapRows(mode: RenderItemMode): TapResult {
    const tracker = renderList(mode);
    const mountedRows = tracker.getSnapshot().totalRenders;
    const rowsRenderedPerTap: number[] = [];
    const renderMsPerTap: number[] = [];

    for (const id of ROWS_TO_TAP) {
        fireEvent.press(screen.getByTestId(`row-${id}`));
        const {reRendersSinceInteraction, commitDurationSinceInteraction} = tracker.getSnapshot();
        rowsRenderedPerTap.push(reRendersSinceInteraction);
        renderMsPerTap.push(commitDurationSinceInteraction);
    }

    screen.unmount();
    return {mountedRows, rowsRenderedPerTap, renderMsPerTap};
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/** Median is used so one slow tap (GC, a FlatList batch) does not decide the result. */
const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
};

describe('PERF-1: no spread in renderItem', () => {
    it('re-renders every mounted row on each tap when renderItem spreads the item', () => {
        const {mountedRows, rowsRenderedPerTap} = tapRows('spread');

        expect(mountedRows).toBeGreaterThan(2);
        rowsRenderedPerTap.forEach((rendered) => expect(rendered).toBe(mountedRows));
    });

    it('re-renders only the rows whose selection changed when props are passed directly', () => {
        const {rowsRenderedPerTap} = tapRows('direct');

        // First tap: only the newly selected row. After that: the old and the new selection.
        expect(rowsRenderedPerTap).toEqual([1, 2, 2, 2, 2]);
    });

    it('spends noticeably less render time when props are passed directly', () => {
        const spread = tapRows('spread');
        const direct = tapRows('direct');

        const report = {
            'mounted rows': {spread: spread.mountedRows, direct: direct.mountedRows},
            'rows rendered per tap': {spread: spread.rowsRenderedPerTap.join(' / '), direct: direct.rowsRenderedPerTap.join(' / ')},
            'render ms per tap': {
                spread: spread.renderMsPerTap.map((ms) => ms.toFixed(1)).join(' / '),
                direct: direct.renderMsPerTap.map((ms) => ms.toFixed(1)).join(' / '),
            },
            'median render ms per tap': {spread: median(spread.renderMsPerTap).toFixed(1), direct: median(direct.renderMsPerTap).toFixed(1)},
            'total render ms (5 taps)': {spread: sum(spread.renderMsPerTap).toFixed(1), direct: sum(direct.renderMsPerTap).toFixed(1)},
        };
        console.table(report);

        // Each row burns ~1 ms, so wasted renders dominate. A wide margin keeps this stable on slow CI.
        expect(median(spread.renderMsPerTap)).toBeGreaterThan(median(direct.renderMsPerTap) * 2);
    });
});

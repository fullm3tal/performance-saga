/**
 * PERF-13: both versions produce the same rupee strings. The in-loop version
 * repeats the setup (exchange rate + formatter) once per item; the hoisted
 * version does it once. These tests count the calls and compare the time.
 */
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import Perf13Screen from '@/rules/perf13/Perf13Screen';
import SimpleExample from '@/rules/perf13/SimpleExample';
import {STUDENTS, greetHoisted, greetInLoop} from '@/rules/perf13/greetStudents';
import {callCounts, formatHoisted, formatInLoop, makeTransactions, resetCallCounts} from '@/rules/perf13/formatTransactions';

function countSetupCalls(run: () => void) {
    resetCallCounts();
    run();
    return {...callCounts};
}

function averageMs(run: () => void, times = 5) {
    const start = performance.now();
    for (let i = 0; i < times; i += 1) {
        run();
    }
    return (performance.now() - start) / times;
}

describe('PERF-13: hoist iterator-independent calls', () => {
    it('both versions return exactly the same strings', () => {
        const transactions = makeTransactions(200);
        expect(formatHoisted(transactions)).toEqual(formatInLoop(transactions));
    });

    it.each([10, 100, 1_000])('with %i items, in-loop setup runs once per item; hoisted runs once', (count) => {
        const transactions = makeTransactions(count);
        expect(countSetupCalls(() => formatInLoop(transactions))).toEqual({getExchangeRate: count, createFormatter: count});
        expect(countSetupCalls(() => formatHoisted(transactions))).toEqual({getExchangeRate: 1, createFormatter: 1});
    });

    it('hoisting is much faster on a big list', () => {
        const transactions = makeTransactions(2_000);
        const inLoopMs = averageMs(() => formatInLoop(transactions));
        const hoistedMs = averageMs(() => formatHoisted(transactions));

        console.table({
            'avg ms for 2,000 rows': {'setup in loop': inLoopMs.toFixed(2), hoisted: hoistedMs.toFixed(2)},
        });

        expect(hoistedMs).toBeLessThan(inLoopMs / 3);
    });

    it('the screen shows the call counts for the chosen size', () => {
        render(<Perf13Screen />);
        fireEvent.press(screen.getByTestId('size-100'));
        fireEvent.press(screen.getByTestId('run'));
        expect(screen.getByTestId('inLoop-rate-calls')).toHaveTextContent('100×');
        expect(screen.getByTestId('inLoop-formatters')).toHaveTextContent('100×');
        expect(screen.getByTestId('hoisted-rate-calls')).toHaveTextContent('1×');
        expect(screen.getByTestId('hoisted-formatters')).toHaveTextContent('1×');
        expect(screen.getByTestId('summary')).toHaveTextContent(/Same output: yes/);
    });

    describe('simple example: greeting students', () => {
        function officeCalls(log: string[]) {
            return log.filter((line) => line.startsWith('📞')).length;
        }

        it('both versions write the same greetings', () => {
            expect(greetHoisted(STUDENTS, [])).toEqual(greetInLoop(STUDENTS, []));
        });

        it('asking inside the loop calls the office once per student; hoisted calls once', () => {
            const inLoopLog: string[] = [];
            const hoistedLog: string[] = [];
            greetInLoop(STUDENTS, inLoopLog);
            greetHoisted(STUDENTS, hoistedLog);
            expect(officeCalls(inLoopLog)).toBe(STUDENTS.length);
            expect(officeCalls(hoistedLog)).toBe(1);
            // 6 calls + 6 greetings vs 1 call + 6 greetings.
            expect(inLoopLog).toHaveLength(12);
            expect(hoistedLog).toHaveLength(7);
        });

        it('the replay finishes the hoisted version first and shows the call counts', () => {
            jest.useFakeTimers();
            render(<SimpleExample />);
            fireEvent.press(screen.getByTestId('play'));

            act(() => {
                jest.advanceTimersByTime(7 * 500);
            });
            expect(screen.getByTestId('hoisted-done')).toHaveTextContent('Finished in 7 steps (1 office call)');
            expect(screen.queryByTestId('inLoop-done')).toBeNull();
            expect(screen.getByTestId('inLoop-calls')).toHaveTextContent('📞 office calls: 4');

            act(() => {
                jest.advanceTimersByTime(5 * 500);
            });
            expect(screen.getByTestId('inLoop-done')).toHaveTextContent('Finished in 12 steps (6 office calls)');
            expect(jest.getTimerCount()).toBe(0);
            jest.useRealTimers();
        });
    });
});

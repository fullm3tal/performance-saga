/**
 * PERF-12: a setInterval with no cleanup survives after its component is gone.
 * These tests open and close the two score cards, advance fake time, and check
 * how many timers are still running and how many refreshes were wasted.
 */
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import Perf12Screen from '@/rules/perf12/Perf12Screen';
import {getState, resetTracker} from '@/rules/perf12/leakTracker';

function advanceSeconds(seconds: number) {
    act(() => {
        jest.advanceTimersByTime(seconds * 1000);
    });
}

function press(testID: string) {
    fireEvent.press(screen.getByTestId(testID));
}

/** Opens and closes both cards `times` times. */
function openAndCloseBoth(times: number) {
    for (let i = 0; i < times; i++) {
        press('leaky-toggle');
        press('clean-toggle');
        press('leaky-toggle');
        press('clean-toggle');
    }
}

describe('PERF-12: prevent memory leaks', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        resetTracker();
    });
    afterEach(() => {
        jest.useRealTimers();
    });

    it('while a card is open, both versions run exactly one timer', () => {
        render(<Perf12Screen />);
        press('leaky-toggle');
        press('clean-toggle');
        advanceSeconds(3);
        const state = getState();
        expect(state.leaky.running).toBe(1);
        expect(state.clean.running).toBe(1);
        expect(state.leaky.wastedTicks).toBe(0);
        expect(state.clean.wastedTicks).toBe(0);
    });

    it('after closing, only the leaky timer keeps running', () => {
        render(<Perf12Screen />);
        openAndCloseBoth(1);
        advanceSeconds(5);
        const state = getState();
        expect(state.leaky.running).toBe(1);
        expect(state.leaky.wastedTicks).toBe(5);
        expect(state.clean.running).toBe(0);
        expect(state.clean.wastedTicks).toBe(0);
    });

    it('every open/close leaks one more timer', () => {
        render(<Perf12Screen />);
        openAndCloseBoth(10);
        advanceSeconds(1);
        const state = getState();
        // 10 opens = 10 timers that never stop, each wasting one refresh per second.
        expect(state.leaky.running).toBe(10);
        expect(state.leaky.wastedTicks).toBe(10);
        expect(state.clean.running).toBe(0);
        expect(state.clean.wastedTicks).toBe(0);
    });

    it('the counters and log on screen show the leak', () => {
        render(<Perf12Screen />);
        openAndCloseBoth(3);
        advanceSeconds(2);
        expect(screen.getByTestId('leaky-running')).toHaveTextContent('3');
        expect(screen.getByTestId('leaky-wasted')).toHaveTextContent('6');
        expect(screen.getByTestId('clean-running')).toHaveTextContent('0');
        expect(screen.getByTestId('clean-wasted')).toHaveTextContent('0');
        expect(screen.getAllByText(/ran, but the card is closed/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Timer #3 stopped/)).toHaveLength(1);
    });

    it('Reset and leaving the screen stop every demo timer', () => {
        const {unmount} = render(<Perf12Screen />);
        openAndCloseBoth(2);
        press('reset');
        expect(getState().leaky.running).toBe(0);
        expect(getState().clean.running).toBe(0);
        openAndCloseBoth(1);
        unmount();
        expect(jest.getTimerCount()).toBe(0);
    });
});

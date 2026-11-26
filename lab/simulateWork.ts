/**
 * Blocks the JS thread for `durationMs` to stand in for real render work
 * (formatting, heavy subtrees). Only used by the demo screens so wasted renders
 * show up as measurable time instead of being lost in the noise.
 */
function simulateWork(durationMs: number) {
    const end = performance.now() + durationMs;
    while (performance.now() < end) {
        // Busy-wait on purpose: the point is to burn time during render.
    }
}

export default simulateWork;

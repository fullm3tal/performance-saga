/**
 * A tiny store that counts component renders and commit durations so a rule
 * demo can show, on screen and in tests, how much work one interaction caused.
 *
 * Renders are recorded during the render phase but listeners are only told
 * about them after React commits, so the stats panel never updates mid-render.
 */

type RenderTrackerSnapshot = {
    /** Re-renders (not first mounts) recorded since the last `startInteraction` call. */
    reRendersSinceInteraction: number;

    /** Sum of Profiler `actualDuration` since the last `startInteraction` call, in ms. */
    commitDurationSinceInteraction: number;

    /** Renders recorded since the tracker was created or reset. */
    totalRenders: number;
};

type RenderTracker = {
    recordRender: (id: string) => number;
    recordCommit: (actualDuration: number) => void;
    startInteraction: () => void;
    reset: () => void;
    getRenderCount: (id: string) => number;
    getInteractionCount: () => number;
    getSnapshot: () => RenderTrackerSnapshot;
    subscribe: (listener: () => void) => () => void;
};

const EMPTY_SNAPSHOT: RenderTrackerSnapshot = {
    reRendersSinceInteraction: 0,
    commitDurationSinceInteraction: 0,
    totalRenders: 0,
};

function createRenderTracker(): RenderTracker {
    const countsById = new Map<string, number>();
    const listeners = new Set<() => void>();
    let pending = {...EMPTY_SNAPSHOT};
    let interactionCount = 0;

    // useSyncExternalStore needs a stable object between changes, so we only
    // swap this reference when a commit or reset actually happens.
    let snapshot = {...EMPTY_SNAPSHOT};

    const publish = () => {
        snapshot = {...pending};
        listeners.forEach((listener) => listener());
    };

    return {
        recordRender: (id) => {
            const count = (countsById.get(id) ?? 0) + 1;
            countsById.set(id, count);
            // First renders are mounts (e.g. FlatList adding a batch of rows), not wasted work.
            if (count > 1) {
                pending.reRendersSinceInteraction += 1;
            }
            pending.totalRenders += 1;
            return count;
        },
        recordCommit: (actualDuration) => {
            pending.commitDurationSinceInteraction += actualDuration;
            publish();
        },
        startInteraction: () => {
            interactionCount += 1;
            pending.reRendersSinceInteraction = 0;
            pending.commitDurationSinceInteraction = 0;
        },
        reset: () => {
            countsById.clear();
            pending = {...EMPTY_SNAPSHOT};
            publish();
        },
        getRenderCount: (id) => countsById.get(id) ?? 0,
        getInteractionCount: () => interactionCount,
        getSnapshot: () => snapshot,
        subscribe: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    };
}

export default createRenderTracker;
export type {RenderTracker, RenderTrackerSnapshot};

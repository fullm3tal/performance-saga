/**
 * Shares one render tracker with every component in a rule demo, and wraps the
 * measured subtree in a React Profiler so commit time is captured too.
 */
import {createContext, Profiler, useContext, useSyncExternalStore, type ProfilerOnRenderCallback, type ReactNode} from 'react';
import type {RenderTracker, RenderTrackerSnapshot} from './createRenderTracker';

const RenderTrackerContext = createContext<RenderTracker | null>(null);

type RenderTrackerProviderProps = {
    tracker: RenderTracker;
    children: ReactNode;
};

function RenderTrackerProvider({tracker, children}: RenderTrackerProviderProps) {
    return <RenderTrackerContext.Provider value={tracker}>{children}</RenderTrackerContext.Provider>;
}

type MeasuredProps = {
    id: string;
    children: ReactNode;
};

/** Wraps the part of the tree whose commit time we want to measure. */
function Measured({id, children}: MeasuredProps) {
    const tracker = useRenderTracker();
    const recordCommit: ProfilerOnRenderCallback = (_id, _phase, actualDuration) => tracker.recordCommit(actualDuration);
    return (
        <Profiler
            id={id}
            onRender={recordCommit}
        >
            {children}
        </Profiler>
    );
}

function useRenderTracker(): RenderTracker {
    const tracker = useContext(RenderTrackerContext);
    if (!tracker) {
        throw new Error('useRenderTracker must be used inside a RenderTrackerProvider');
    }
    return tracker;
}

/** Records one render for `id` and returns how many times it has rendered so far. */
function useTrackRender(id: string): number {
    return useRenderTracker().recordRender(id);
}

function useRenderStats(): RenderTrackerSnapshot {
    const tracker = useRenderTracker();
    return useSyncExternalStore(tracker.subscribe, tracker.getSnapshot);
}

export {RenderTrackerProvider, Measured, useRenderTracker, useTrackRender, useRenderStats};

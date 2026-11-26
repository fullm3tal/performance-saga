/**
 * A "heartbeat" for the JS thread. A dot slides back and forth, moved from JS
 * on every animation frame, so it visibly stops whenever rendering blocks the
 * thread. It also reports the longest frame gap since the last tap, which is
 * how long the app felt frozen to the user.
 */
import {useEffect, useRef, useState} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import {useRenderTracker} from './RenderTrackerContext';
import labTheme from './labTheme';

const TRACK_WIDTH = 240;
const DOT_SIZE = 14;
const SWEEP_DURATION_MS = 1200;

/** Gaps shorter than this (about 3 frames at 60 fps) are not something a user notices. */
const NOTICEABLE_FREEZE_MS = 50;

function JsThreadMonitor() {
    const tracker = useRenderTracker();
    const position = useRef(new Animated.Value(0)).current;
    const [longestFreezeMs, setLongestFreezeMs] = useState(0);

    useEffect(() => {
        let frameId = 0;
        let previousFrameAt = performance.now();
        let seenInteraction = tracker.getInteractionCount();
        let longestSinceTap = 0;

        const tick = (now: number) => {
            const gap = now - previousFrameAt;
            previousFrameAt = now;

            if (tracker.getInteractionCount() !== seenInteraction) {
                seenInteraction = tracker.getInteractionCount();
                longestSinceTap = 0;
            }
            // Before the first tap, gaps come from mounting and page load, not from the rule being shown.
            if (seenInteraction > 0 && gap > longestSinceTap) {
                longestSinceTap = gap;
                // Only push to state when it is a real freeze, so the monitor itself stays cheap.
                setLongestFreezeMs(gap > NOTICEABLE_FREEZE_MS ? gap : 0);
            }

            // Ping-pong between 0 and 1. setValue without the native driver runs on JS, which is the point.
            const phase = (now % (SWEEP_DURATION_MS * 2)) / SWEEP_DURATION_MS;
            position.setValue(phase <= 1 ? phase : 2 - phase);
            frameId = requestAnimationFrame(tick);
        };

        frameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameId);
    }, [position, tracker]);

    const translateX = position.interpolate({inputRange: [0, 1], outputRange: [0, TRACK_WIDTH - DOT_SIZE]});
    const isFrozen = longestFreezeMs > 0;

    return (
        <View style={styles.container}>
            <View style={styles.track}>
                <Animated.View style={[styles.dot, {transform: [{translateX}]}]} />
            </View>
            <Text style={[styles.label, isFrozen ? styles.labelBad : styles.labelGood]}>
                {isFrozen ? `UI froze for ${Math.round(longestFreezeMs)} ms on last tap` : 'Smooth: no noticeable freeze on last tap'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        gap: labTheme.spacing.xs,
        paddingVertical: labTheme.spacing.sm,
        backgroundColor: labTheme.color.panel,
    },
    track: {
        width: TRACK_WIDTH,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        backgroundColor: labTheme.color.panelMuted,
    },
    dot: {
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        backgroundColor: labTheme.color.flash,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
    },
    labelBad: {
        color: labTheme.color.bad,
    },
    labelGood: {
        color: labTheme.color.good,
    },
});

export default JsThreadMonitor;

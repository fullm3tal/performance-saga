/**
 * Makes a component flash every time it re-renders (not on mount), the same
 * idea as React DevTools' "highlight updates", so wasted renders are visible.
 */
import {useEffect, useRef} from 'react';
import {Animated} from 'react-native';

const FLASH_DURATION_MS = 700;

function useRenderFlash(): Animated.Value {
    const opacity = useRef(new Animated.Value(0)).current;
    const hasMounted = useRef(false);

    // No dependency array on purpose: this must run after every render.
    useEffect(() => {
        if (!hasMounted.current) {
            hasMounted.current = true;
            return;
        }
        opacity.setValue(1);
        Animated.timing(opacity, {toValue: 0, duration: FLASH_DURATION_MS, useNativeDriver: true}).start();
    });

    return opacity;
}

export default useRenderFlash;

import {useFonts} from 'expo-font';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';

export default function RootLayout() {
    useFonts({SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf')});

    return (
        <>
            <StatusBar style="dark" />
            <Stack>
                <Stack.Screen
                    name="index"
                    options={{headerShown: false}}
                />
                <Stack.Screen
                    name="rules/perf-1"
                    options={{title: 'PERF-1 · No spread in renderItem'}}
                />
                <Stack.Screen
                    name="rules/perf-2"
                    options={{title: 'PERF-2 · Return early'}}
                />
                <Stack.Screen
                    name="rules/perf-5"
                    options={{title: 'PERF-5 · Shallow comparisons'}}
                />
                <Stack.Screen
                    name="rules/perf-6"
                    options={{title: 'PERF-6 · Derive state'}}
                />
                <Stack.Screen
                    name="rules/perf-7"
                    options={{title: 'PERF-7 · Reset via key'}}
                />
                <Stack.Screen
                    name="rules/perf-8"
                    options={{title: 'PERF-8 · Events in handlers'}}
                />
                <Stack.Screen
                    name="rules/perf-9"
                    options={{title: 'PERF-9 · No useEffect chains'}}
                />
                <Stack.Screen
                    name="rules/perf-10"
                    options={{title: 'PERF-10 · Parent communication'}}
                />
                <Stack.Screen
                    name="rules/perf-11"
                    options={{title: 'PERF-11 · Data selection'}}
                />
                <Stack.Screen
                    name="rules/perf-12"
                    options={{title: 'PERF-12 · Memory leaks'}}
                />
                <Stack.Screen
                    name="rules/perf-13"
                    options={{title: 'PERF-13 · Hoist loop calls'}}
                />
                <Stack.Screen
                    name="rules/perf-14"
                    options={{title: 'PERF-14 · useSyncExternalStore'}}
                />
                <Stack.Screen
                    name="rules/perf-15"
                    options={{title: 'PERF-15 · Async effect races'}}
                />
            </Stack>
        </>
    );
}

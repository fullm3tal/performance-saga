/**
 * PERF-1 playground: toggle between spreading inside renderItem and passing
 * props directly, tap rows, and watch the per-row render badges and stats.
 */
import {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import createRenderTracker from '@/lab/createRenderTracker';
import JsThreadMonitor from '@/lab/JsThreadMonitor';
import RenderStatsPanel from '@/lab/RenderStatsPanel';
import {Measured, RenderTrackerProvider} from '@/lab/RenderTrackerContext';
import labTheme from '@/lab/labTheme';
import buildTransactions from './buildTransactions';
import TransactionList, {type RenderItemMode} from './TransactionList';

const TRANSACTION_COUNT = 300;
const TRANSACTIONS = buildTransactions(TRANSACTION_COUNT);

const MODE_OPTIONS: {mode: RenderItemMode; label: string}[] = [
    {mode: 'spread', label: '❌ item={{...item, isSelected}}'},
    {mode: 'direct', label: '✅ item={item} isSelected={…}'},
];

/** How heavy each row is. Real rows with images, formatting and nested views often cost several ms. */
const ROW_COST_OPTIONS_MS = [1, 5, 10];
const DEFAULT_ROW_COST_MS = 5;

function Perf1Screen() {
    const [tracker] = useState(createRenderTracker);
    const [mode, setMode] = useState<RenderItemMode>('spread');
    const [rowCostMs, setRowCostMs] = useState(DEFAULT_ROW_COST_MS);

    const switchMode = (nextMode: RenderItemMode) => {
        if (nextMode === mode) {
            return;
        }
        tracker.reset();
        setMode(nextMode);
    };

    const changeRowCost = (nextCostMs: number) => {
        tracker.reset();
        setRowCostMs(nextCostMs);
    };

    return (
        <RenderTrackerProvider tracker={tracker}>
            <SafeAreaView
                style={styles.screen}
                edges={['bottom']}
            >
                <View style={styles.modes}>
                    {MODE_OPTIONS.map((option) => {
                        const isActive = option.mode === mode;
                        return (
                            <Pressable
                                key={option.mode}
                                testID={`mode-${option.mode}`}
                                accessibilityRole="button"
                                accessibilityState={{selected: isActive}}
                                onPress={() => switchMode(option.mode)}
                                style={[styles.modeButton, isActive && styles.modeButtonActive]}
                            >
                                <Text style={[styles.modeText, isActive && styles.modeTextActive]}>{option.label}</Text>
                            </Pressable>
                        );
                    })}
                </View>
                <View style={styles.costs}>
                    <Text style={styles.costLabel}>Work per row:</Text>
                    {ROW_COST_OPTIONS_MS.map((costMs) => {
                        const isActive = costMs === rowCostMs;
                        return (
                            <Pressable
                                key={costMs}
                                accessibilityRole="button"
                                accessibilityState={{selected: isActive}}
                                onPress={() => changeRowCost(costMs)}
                                style={[styles.costButton, isActive && styles.modeButtonActive]}
                            >
                                <Text style={[styles.costText, isActive && styles.modeTextActive]}>{costMs} ms</Text>
                            </Pressable>
                        );
                    })}
                </View>
                <Text style={styles.hint}>Tap a row. Rows flash yellow when they re-render. Watch the dot: if it stops, the UI froze.</Text>
                <JsThreadMonitor />
                <RenderStatsPanel />
                <Measured id="perf-1-list">
                    {/* The key remounts the list so each setting starts from a clean slate. */}
                    <TransactionList
                        key={`${mode}-${rowCostMs}`}
                        transactions={TRANSACTIONS}
                        mode={mode}
                        rowCostMs={rowCostMs}
                    />
                </Measured>
            </SafeAreaView>
        </RenderTrackerProvider>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: labTheme.color.background,
    },
    modes: {
        flexDirection: 'row',
        gap: labTheme.spacing.sm,
        padding: labTheme.spacing.md,
    },
    modeButton: {
        flex: 1,
        padding: labTheme.spacing.sm,
        borderRadius: labTheme.radius,
        borderWidth: 1,
        borderColor: labTheme.color.border,
        backgroundColor: labTheme.color.card,
    },
    modeButtonActive: {
        borderColor: labTheme.color.accent,
        backgroundColor: labTheme.color.selected,
    },
    modeText: {
        fontSize: 12,
        textAlign: 'center',
        color: labTheme.color.muted,
        fontFamily: 'SpaceMono',
    },
    modeTextActive: {
        color: labTheme.color.accent,
        fontWeight: '700',
    },
    costs: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: labTheme.spacing.sm,
        paddingHorizontal: labTheme.spacing.md,
        paddingBottom: labTheme.spacing.sm,
    },
    costLabel: {
        fontSize: 12,
        color: labTheme.color.muted,
    },
    costButton: {
        paddingHorizontal: labTheme.spacing.md,
        paddingVertical: labTheme.spacing.xs,
        borderRadius: labTheme.radius,
        borderWidth: 1,
        borderColor: labTheme.color.border,
        backgroundColor: labTheme.color.card,
    },
    costText: {
        fontSize: 12,
        color: labTheme.color.muted,
    },
    hint: {
        fontSize: 12,
        color: labTheme.color.muted,
        paddingHorizontal: labTheme.spacing.md,
        paddingBottom: labTheme.spacing.sm,
    },
});

export default Perf1Screen;

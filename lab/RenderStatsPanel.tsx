/**
 * Shows what the last interaction cost: how many tracked components rendered
 * and how long React spent rendering the measured subtree.
 */
import {StyleSheet, Text, View} from 'react-native';
import {useRenderStats} from './RenderTrackerContext';
import labTheme from './labTheme';

function RenderStatsPanel() {
    const {reRendersSinceInteraction, commitDurationSinceInteraction, totalRenders} = useRenderStats();

    return (
        <View style={styles.panel}>
            <View style={styles.stat}>
                <Text style={styles.value}>{reRendersSinceInteraction}</Text>
                <Text style={styles.label}>rows re-rendered since last tap</Text>
            </View>
            <View style={styles.stat}>
                <Text style={styles.value}>{commitDurationSinceInteraction.toFixed(1)} ms</Text>
                <Text style={styles.label}>render time since last tap</Text>
            </View>
            <View style={styles.stat}>
                <Text style={styles.value}>{totalRenders}</Text>
                <Text style={styles.label}>total row renders</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    panel: {
        flexDirection: 'row',
        gap: labTheme.spacing.sm,
        padding: labTheme.spacing.md,
        backgroundColor: labTheme.color.panel,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    value: {
        fontSize: 20,
        fontWeight: '700',
        color: labTheme.color.panelText,
    },
    label: {
        fontSize: 11,
        textAlign: 'center',
        color: labTheme.color.panelMuted,
    },
});

export default RenderStatsPanel;

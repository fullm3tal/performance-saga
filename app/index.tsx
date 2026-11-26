/** Home screen: lists every coding-standard rule that has a live demo. */
import {Link, type Href} from 'expo-router';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import labTheme from '@/lab/labTheme';
import ruleCatalog, {type RuleDemo} from '@/rules/ruleCatalog';

function RuleLink({rule}: {rule: RuleDemo}) {
    return (
        <Link
            href={rule.route as Href}
            asChild
        >
            <Pressable style={styles.card}>
                <Text style={styles.ruleId}>{rule.id}</Text>
                <Text style={styles.ruleTitle}>{rule.title}</Text>
            </Pressable>
        </Link>
    );
}

export default function HomeScreen() {
    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
                <Text style={styles.title}>Performance saga</Text>
                <Text style={styles.subtitle}>One coding rule at a time, measured.</Text>
            </View>
            <FlatList
                data={ruleCatalog}
                keyExtractor={(rule) => rule.id}
                renderItem={({item}) => <RuleLink rule={item} />}
                contentContainerStyle={styles.list}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: labTheme.color.background,
    },
    header: {
        padding: labTheme.spacing.lg,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: labTheme.color.text,
    },
    subtitle: {
        fontSize: 14,
        color: labTheme.color.muted,
    },
    list: {
        gap: labTheme.spacing.sm,
        paddingHorizontal: labTheme.spacing.lg,
    },
    card: {
        padding: labTheme.spacing.lg,
        borderRadius: labTheme.radius,
        backgroundColor: labTheme.color.card,
    },
    ruleId: {
        fontSize: 12,
        fontWeight: '700',
        color: labTheme.color.accent,
    },
    ruleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: labTheme.color.text,
    },
});

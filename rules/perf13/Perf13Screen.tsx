/**
 * PERF-13 demo. Part 1 is a small step-by-step replay (see SimpleExample).
 * Part 2 formats a list of transactions in rupees, once with the setup
 * calls inside .map() (❌) and once hoisted above it (✅). Pick a list size,
 * tap Run, and compare how many times the setup ran and how long it took.
 */
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  callCounts,
  formatHoisted,
  formatInLoop,
  makeTransactions,
  resetCallCounts,
  type Transaction,
} from "./formatTransactions";
import SimpleExample from "./SimpleExample";

const LIST_SIZES = [100, 1_000, 5_000];

type RunResult = {
  ms: number;
  exchangeRateCalls: number;
  formattersCreated: number;
  preview: string[];
};

/** How many formatted rows to show under each result, to prove both outputs match. */
const PREVIEW_ROWS = 3;

function measure(
  format: (transactions: Transaction[]) => string[],
  transactions: Transaction[],
): RunResult {
  resetCallCounts();
  const start = performance.now();
  const output = format(transactions);
  const ms = performance.now() - start;
  return {
    ms,
    exchangeRateCalls: callCounts.getExchangeRate,
    formattersCreated: callCounts.createFormatter,
    preview: output.slice(0, PREVIEW_ROWS),
  };
}

const VERSIONS = {
  inLoop: {
    title: "❌ Setup inside .map()",
    code: "items.map((t) => {\n  const rate = getExchangeRate();\n  const fmt = createFormatter();\n  return fmt.format(t.amount * rate);\n});",
  },
  hoisted: {
    title: "✅ Setup hoisted above .map()",
    code: "const rate = getExchangeRate();\nconst fmt = createFormatter();\nitems.map((t) => fmt.format(t.amount * rate));",
  },
};

function ResultCard({
  version,
  result,
  slowestMs,
}: {
  version: keyof typeof VERSIONS;
  result: RunResult | null;
  slowestMs: number;
}) {
  const { title, code } = VERSIONS[version];
  const barWidth = result
    ? `${Math.max(2, (result.ms / slowestMs) * 100)}%`
    : "0%";
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.code}>{code}</Text>
      {result ? (
        <>
          <View style={styles.statsRow}>
            <Stat
              testID={`${version}-rate-calls`}
              label="getExchangeRate()"
              value={result.exchangeRateCalls}
              isBad={result.exchangeRateCalls > 1}
            />
            <Stat
              testID={`${version}-formatters`}
              label="createFormatter()"
              value={result.formattersCreated}
              isBad={result.formattersCreated > 1}
            />
          </View>
          <Text testID={`${version}-ms`} style={styles.ms}>
            {result.ms.toFixed(1)} ms
          </Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.bar,
                { width: barWidth as `${number}%` },
                version === "inLoop" ? styles.barBad : styles.barGood,
              ]}
            />
          </View>
          <Text style={styles.preview}>{result.preview.join("   ")} …</Text>
        </>
      ) : (
        <Text style={styles.placeholder}>Tap Run to measure.</Text>
      )}
    </View>
  );
}

function Stat({
  testID,
  label,
  value,
  isBad,
}: {
  testID: string;
  label: string;
  value: number;
  isBad: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label} ran</Text>
      <Text testID={testID} style={[styles.statValue, isBad && styles.bad]}>
        {value.toLocaleString()}×
      </Text>
    </View>
  );
}

function Perf13Screen() {
  const [size, setSize] = useState(LIST_SIZES[1]);
  const [results, setResults] = useState<{
    inLoop: RunResult;
    hoisted: RunResult;
    sameOutput: boolean;
  } | null>(null);

  // Old results belong to the old size, so clear them when the size changes.
  const chooseSize = (option: number) => {
    setSize(option);
    setResults(null);
  };

  const run = () => {
    const transactions = makeTransactions(size);
    const inLoop = measure(formatInLoop, transactions);
    const hoisted = measure(formatHoisted, transactions);
    const sameOutput =
      formatInLoop(transactions.slice(0, 50)).join() ===
      formatHoisted(transactions.slice(0, 50)).join();
    setResults({ inLoop, hoisted, sameOutput });
  };

  const slowestMs = results
    ? Math.max(results.inLoop.ms, results.hoisted.ms, 0.001)
    : 1;

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.heading}>1. Simple example</Text>
      <SimpleExample />

      <Text style={styles.heading}>2. Real-world: 5,000 transactions</Text>
      <View style={styles.steps}>
        <Text style={styles.stepsTitle}>The task</Text>
        <Text>
          Show each USD transaction in rupees. Every row needs the same exchange
          rate and the same ₹ formatter.
        </Text>
        <Text style={styles.stepsTitle}>Try this</Text>
        <Text>1. Pick a list size.</Text>
        <Text>2. Tap Run. Both versions format the same list.</Text>
        <Text>3. Compare how many times the setup ran, and the time.</Text>
      </View>
      <View style={styles.row}>
        {LIST_SIZES.map((option) => (
          <Pressable
            key={option}
            testID={`size-${option}`}
            onPress={() => chooseSize(option)}
            style={[styles.chip, option === size && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                option === size && styles.chipTextActive,
              ]}
            >
              {option.toLocaleString()} rows
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable testID="run" onPress={run} style={styles.button}>
        <Text style={styles.buttonText}>
          Run with {size.toLocaleString()} transactions
        </Text>
      </Pressable>
      {results ? (
        <Text testID="summary" style={styles.summary}>
          Same output: {results.sameOutput ? "yes" : "NO"} · hoisted is{" "}
          {(results.inLoop.ms / Math.max(results.hoisted.ms, 0.001)).toFixed(0)}
          × faster
        </Text>
      ) : null}
      <ResultCard
        version="inLoop"
        result={results?.inLoop ?? null}
        slowestMs={slowestMs}
      />
      <ResultCard
        version="hoisted"
        result={results?.hoisted ?? null}
        slowestMs={slowestMs}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 12, backgroundColor: "#fff" },
  heading: { fontSize: 20, fontWeight: "800", marginTop: 8 },
  steps: { gap: 2, padding: 12, borderRadius: 8, backgroundColor: "#EEF3FF" },
  stepsTitle: { fontWeight: "700", marginTop: 4 },
  row: { flexDirection: "row", gap: 8 },
  chip: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2F6FED",
  },
  chipActive: { backgroundColor: "#2F6FED" },
  chipText: { color: "#2F6FED", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  button: {
    alignItems: "center",
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#2F6FED",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  summary: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  card: {
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E3E5E8",
  },
  cardTitle: { fontSize: 17, fontWeight: "700" },
  code: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#F5F6F8",
  },
  statsRow: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, padding: 8, borderRadius: 8, backgroundColor: "#F5F6F8" },
  statLabel: { fontSize: 11, fontFamily: "SpaceMono" },
  statValue: { fontSize: 24, fontWeight: "700", color: "#1E9E5A" },
  bad: { color: "#D93F3F" },
  ms: { fontSize: 22, fontWeight: "700" },
  barTrack: {
    height: 14,
    borderRadius: 7,
    backgroundColor: "#F0F1F3",
    overflow: "hidden",
  },
  bar: { height: 14, borderRadius: 7 },
  barBad: { backgroundColor: "#D93F3F" },
  barGood: { backgroundColor: "#1E9E5A" },
  preview: { fontSize: 12, color: "#555" },
  placeholder: { color: "#888" },
});

export default Perf13Screen;

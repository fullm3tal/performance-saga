/**
 * PERF-2 demo: two versions of the same product search. Both ignore queries
 * shorter than 2 characters, but one checks that AFTER preparing the whole
 * product list and one checks it BEFORE. Type in the box and compare the times.
 */
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

const MIN_QUERY_LENGTH = 2;

/** Simulates the function being called from a hot path, e.g. once per row in a 200-row list. */
const REPEAT_COUNT = 200;

const COLORS = ["Red", "Blue", "Green", "Black", "White", "Silver"];
const THINGS = ["Shoe", "Lamp", "Chair", "Phone", "Watch", "Bottle"];

const PRODUCTS: string[] = Array.from(
  { length: 50_000 },
  (_, index) =>
    `${COLORS[index % COLORS.length]} ${THINGS[index % THINGS.length]} ${index}`,
);

// ❌ PERF-2 violation: lower-cases all 50,000 products, THEN checks the query.
// For an empty or 1-letter query that work is thrown away.
export function searchCheckLate(query: string): string[] {
  const lowerCasedProducts = PRODUCTS.map((product) => product.toLowerCase());

  if (query.length < MIN_QUERY_LENGTH) {
    return [];
  }

  const needle = query.toLowerCase();
  return lowerCasedProducts.filter((product) => product.includes(needle));
}

// ✅ PERF-2: the cheap check comes first, so short queries cost nothing.
export function searchCheckEarly(query: string): string[] {
  if (query.length < MIN_QUERY_LENGTH) {
    return [];
  }

  const lowerCasedProducts = PRODUCTS.map((product) => product.toLowerCase());
  const needle = query.toLowerCase();
  return lowerCasedProducts.filter((product) => product.includes(needle));
}

/** Runs `search` `times` times and returns the total time and the result count. */
function timeSearch(
  search: (query: string) => string[],
  query: string,
  times = 1,
) {
  const start = performance.now();
  let results: string[] = [];
  for (let i = 0; i < times; i += 1) {
    results = search(query);
  }
  return { ms: performance.now() - start, count: results.length };
}

type RepeatResult = { query: string; lateMs: number; earlyMs: number };

function ResultRow({
  label,
  ms,
  count,
}: {
  label: string;
  ms: number;
  count: number;
}) {
  return (
    <View style={styles.result}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={styles.resultTime}>{ms.toFixed(1)} ms</Text>
      <Text style={styles.resultCount}>{count} results</Text>
    </View>
  );
}

function Perf2Screen() {
  const [query, setQuery] = useState("");

  const [repeatResult, setRepeatResult] = useState<RepeatResult | null>(null);

  const late = useMemo(() => timeSearch(searchCheckLate, query), [query]);
  const early = useMemo(() => timeSearch(searchCheckEarly, query), [query]);

  const runRepeated = () => {
    setRepeatResult({
      query,
      lateMs: timeSearch(searchCheckLate, query, REPEAT_COUNT).ms,
      earlyMs: timeSearch(searchCheckEarly, query, REPEAT_COUNT).ms,
    });
  };

  return (
    <View style={styles.screen}>
      <TextInput
        testID="search-input"
        value={query}
        onChangeText={setQuery}
        placeholder="Search 50,000 products, e.g. red"
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.input}
      />
      <Text style={styles.hint}>
        Clear the box or type 1 letter: nothing is searched, but one version
        still does all the work. Type 2+ letters: both do the same work.
      </Text>
      <ResultRow label="❌ Check after work" ms={late.ms} count={late.count} />
      <ResultRow label="✅ Check first" ms={early.ms} count={early.count} />

      <Pressable testID="run-repeated" onPress={runRepeated} style={styles.button}>
        <Text style={styles.buttonText}>
          Run each {REPEAT_COUNT}× (like once per row in a list)
        </Text>
      </Pressable>
      {repeatResult && (
        <View style={styles.repeat}>
          <Text style={styles.hint}>
            {REPEAT_COUNT} calls with query &quot;{repeatResult.query}&quot;:
          </Text>
          <Text style={styles.repeatLine}>
            ❌ Check after work: {repeatResult.lateMs.toFixed(0)} ms
          </Text>
          <Text style={styles.repeatLine}>
            ✅ Check first: {repeatResult.earlyMs.toFixed(0)} ms
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 12, backgroundColor: "#fff" },
  input: {
    padding: 12,
    fontSize: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  hint: { color: "#666" },
  result: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#F5F6F8",
  },
  resultLabel: { flex: 1, fontWeight: "600" },
  resultTime: { width: 90, fontSize: 18, fontWeight: "700", textAlign: "right" },
  resultCount: { width: 100, color: "#666", textAlign: "right" },
  button: {
    alignItems: "center",
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#2F6FED",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  repeat: { gap: 4 },
  repeatLine: { fontSize: 18, fontWeight: "700" },
});

export default Perf2Screen;

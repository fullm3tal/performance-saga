/**
 * PERF-10 demo: a parent shows what its child search box contains.
 * In one version the child owns the text and reports it up with useEffect.
 * In the other the parent owns the text and passes it down.
 * Type in each box and compare the parent and child render counts.
 */
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

/** Counts how many times the calling component has rendered. Demo-only. */
function useRenderCount() {
  const count = useRef(0);
  count.current += 1;
  return count.current;
}

// ---------------------------------------------------------------------------
// ❌ Child keeps its own state and pushes it to the parent in an Effect.
// Each keystroke: child renders → Effect tells parent → parent renders →
// child renders AGAIN. And for one frame the parent shows the old text.

function SearchBoxWithEffect({
  onValueChange,
}: {
  onValueChange: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    onValueChange(value);
  }, [value, onValueChange]);

  const renders = useRenderCount();
  return (
    <View style={styles.child}>
      <TextInput
        testID="effect-input"
        value={value}
        onChangeText={setValue}
        placeholder="Type here"
        style={styles.input}
      />
      <Text testID="effect-child-renders" style={styles.renders}>
        child renders: {renders}
      </Text>
    </View>
  );
}

function ParentWithEffect() {
  const [query, setQuery] = useState("");
  const renders = useRenderCount();
  return (
    <View style={styles.card}>
      <Text style={styles.title}>❌ Child reports up via useEffect</Text>
      <Text>Parent sees: &quot;{query}&quot;</Text>
      <Text testID="effect-parent-renders" style={styles.renders}>
        parent renders: {renders}
      </Text>
      <SearchBoxWithEffect onValueChange={setQuery} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// ✅ State lives in the parent; the child just shows it and reports changes.
// Each keystroke: parent renders once, child renders once.

function SearchBox({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (value: string) => void;
}) {
  const renders = useRenderCount();
  return (
    <View style={styles.child}>
      <TextInput
        testID="lifted-input"
        value={value}
        onChangeText={onChangeText}
        placeholder="Type here"
        style={styles.input}
      />
      <Text testID="lifted-child-renders" style={styles.renders}>
        child renders: {renders}
      </Text>
    </View>
  );
}

function ParentWithLiftedState() {
  const [query, setQuery] = useState("");
  const renders = useRenderCount();
  return (
    <View style={styles.card}>
      <Text style={styles.title}>✅ State lifted to parent</Text>
      <Text>Parent sees: &quot;{query}&quot;</Text>
      <Text testID="lifted-parent-renders" style={styles.renders}>
        parent renders: {renders}
      </Text>
      <SearchBox value={query} onChangeText={setQuery} />
    </View>
  );
}

function Perf10Screen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.hint}>Type the same word in both boxes.</Text>
      <ParentWithEffect />
      <ParentWithLiftedState />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 12, backgroundColor: "#fff" },
  hint: { color: "#666" },
  card: { gap: 6, padding: 12, borderRadius: 8, backgroundColor: "#F5F6F8" },
  title: { fontWeight: "700" },
  child: {
    gap: 6,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
    backgroundColor: "#fff",
  },
  input: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "#ddd" },
  renders: { fontSize: 15, color: "#D93F3F", fontWeight: "700" },
});

export default Perf10Screen;

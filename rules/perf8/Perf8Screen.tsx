/**
 * PERF-8 demo: two Buy buttons. One reacts to the tap inside useEffect, the
 * other inside the onPress handler. Tap each one 3 times and compare.
 */
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

/** Counts how many times the calling component has rendered. Demo-only. */
function useRenderCount() {
  const count = useRef(0);
  count.current += 1;
  return count.current;
}

// ❌ The tap only sets a flag; the Effect does the real work later.
// Costs an extra render per tap, and once the flag is true it stays true,
// so the 2nd and 3rd taps buy nothing.
function BuyWithEffect() {
  const [isBuying, setIsBuying] = useState(false);
  const [purchases, setPurchases] = useState(0);

  useEffect(() => {
    if (isBuying) {
      setPurchases((count) => count + 1);
      setIsBuying(false);
    }
  }, [isBuying]);

  const renders = useRenderCount();
  return (
    <View style={styles.card}>
      <Text style={styles.title}>❌ Buy in useEffect</Text>
      <Pressable
        testID="effect-buy"
        onPress={() => setIsBuying(true)}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Buy</Text>
      </Pressable>
      <Text testID="effect-purchases" style={styles.big}>
        purchases: {purchases}
      </Text>
      <Text testID="effect-renders" style={styles.renders}>
        renders: {renders}
      </Text>
    </View>
  );
}

// ✅ The tap does the work directly. One render per tap, every tap counts.
function BuyInHandler() {
  const [purchases, setPurchases] = useState(0);

  const buy = () => setPurchases((count) => count + 1);

  const renders = useRenderCount();
  return (
    <View style={styles.card}>
      <Text style={styles.title}>✅ Buy in onPress</Text>
      <Pressable testID="handler-buy" onPress={buy} style={styles.button}>
        <Text style={styles.buttonText}>Buy</Text>
      </Pressable>
      <Text testID="handler-purchases" style={styles.big}>
        purchases: {purchases}
      </Text>
      <Text testID="handler-renders" style={styles.renders}>
        renders: {renders}
      </Text>
    </View>
  );
}

function Perf8Screen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.hint}>Tap each Buy button 3 times.</Text>
      <View style={styles.cards}>
        <BuyWithEffect />
        <BuyInHandler />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 12, backgroundColor: "#fff" },
  hint: { color: "#666" },
  cards: { flexDirection: "row", gap: 8 },
  card: {
    flex: 1,
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F5F6F8",
  },
  title: { fontWeight: "700" },
  button: {
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#2F6FED",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  big: { fontSize: 20, fontWeight: "600" },
  renders: { fontSize: 16, color: "#D93F3F", fontWeight: "700" },
});

export default Perf8Screen;

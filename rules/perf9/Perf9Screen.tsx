/**
 * PERF-9 demo: a price that goes quantity → subtotal → tax → total.
 * One card links those steps with a chain of Effects, the other calculates
 * them in render. Press "Add one" and compare the render counts.
 */
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const PRICE = 10;
const TAX_RATE = 0.2;

/** Counts how many times the calling component has rendered. Demo-only. */
function useRenderCount() {
  const count = useRef(0);
  count.current += 1;
  return count.current;
}

// ❌ PERF-9 violation: each Effect sets state that triggers the next Effect.
// quantity changes → render → subtotal → render → tax → render → total → render.
function TotalWithEffectChain({ quantity }: { quantity: number }) {
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setSubtotal(quantity * PRICE);
  }, [quantity]);

  useEffect(() => {
    setTax(subtotal * TAX_RATE);
  }, [subtotal]);

  useEffect(() => {
    setTotal(subtotal + tax);
  }, [subtotal, tax]);

  const renders = useRenderCount();
  return (
    <View style={styles.card}>
      <Text style={styles.title}>❌ 3 chained useEffects</Text>
      <Text style={styles.total}>Total: ${total}</Text>
      <Text testID="chain-renders" style={styles.renders}>
        renders: {renders}
      </Text>
    </View>
  );
}

// ✅ PERF-9: every step is a plain calculation. One render per change.
function TotalCalculated({ quantity }: { quantity: number }) {
  const subtotal = quantity * PRICE;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const renders = useRenderCount();
  return (
    <View style={styles.card}>
      <Text style={styles.title}>✅ Calculated in render</Text>
      <Text style={styles.total}>Total: ${total}</Text>
      <Text testID="calculated-renders" style={styles.renders}>
        renders: {renders}
      </Text>
    </View>
  );
}

function Perf9Screen() {
  const [quantity, setQuantity] = useState(1);

  return (
    <View style={styles.screen}>
      <Text style={styles.quantity}>
        Quantity: {quantity} × ${PRICE} + {TAX_RATE * 100}% tax
      </Text>
      <Pressable
        testID="add-one"
        onPress={() => setQuantity(quantity + 1)}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Add one</Text>
      </Pressable>
      <View style={styles.cards}>
        <TotalWithEffectChain quantity={quantity} />
        <TotalCalculated quantity={quantity} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 12, backgroundColor: "#fff" },
  quantity: { fontSize: 18, fontWeight: "600" },
  button: {
    alignItems: "center",
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#2F6FED",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  cards: { flexDirection: "row", gap: 8 },
  card: {
    flex: 1,
    gap: 6,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F5F6F8",
  },
  title: { fontWeight: "700" },
  total: { fontSize: 20, fontWeight: "600" },
  renders: { fontSize: 16, color: "#D93F3F", fontWeight: "700" },
});

export default Perf9Screen;

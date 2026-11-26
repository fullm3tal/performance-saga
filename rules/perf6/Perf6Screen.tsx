/**
 * PERF-6 demo: both cards get `quantity` as a prop and show the total price.
 * Press "Add one" and compare the render counts.
 */
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const PRICE = 10;

/** Counts how many times the calling component has rendered. Demo-only. */
function useRenderCount() {
  const count = useRef(0);
  count.current += 1;
  return count.current;
}

// ❌ Copies the total into state and updates it in an Effect.
// Each change renders twice: once with the old total, then again with the new one.
function TotalWithEffect({ quantity }: { quantity: number }) {
  const [total, setTotal] = useState(0);
  useEffect(() => {
    setTotal(quantity * PRICE);
  }, [quantity]);

  const renders = useRenderCount();
  return (
    <View style={styles.card}>
      <Text style={styles.title}>❌ useState + useEffect</Text>
      <Text style={styles.total}>Total: ${total}</Text>
      <Text testID="effect-renders" style={styles.renders}>
        renders: {renders}
      </Text>
    </View>
  );
}

// ✅ Calculates the total while rendering. Each change renders once.
function TotalDerived({ quantity }: { quantity: number }) {
  const total = quantity * PRICE;

  const renders = useRenderCount();
  return (
    <View style={styles.card}>
      <Text style={styles.title}>✅ Calculated in render</Text>
      <Text style={styles.total}>Total: ${total}</Text>
      <Text testID="derived-renders" style={styles.renders}>
        renders: {renders}
      </Text>
    </View>
  );
}

function Perf6Screen() {
  const [quantity, setQuantity] = useState(1);

  return (
    <View style={styles.screen}>
      <Text style={styles.quantity}>
        Quantity: {quantity} × ${PRICE}
      </Text>
      <Pressable
        testID="add-one"
        onPress={() => setQuantity(quantity + 1)}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Add one</Text>
      </Pressable>
      <View style={styles.cards}>
        <TotalWithEffect quantity={quantity} />
        <TotalDerived quantity={quantity} />
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

export default Perf6Screen;

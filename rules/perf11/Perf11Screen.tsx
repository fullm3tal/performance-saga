/**
 * PERF-11 demo: four components read from the same Redux store.
 * Each pair shows the same thing, once with a broad/new-object selector (❌)
 * and once with a narrow selector (✅). Press the buttons and watch which
 * cards re-render.
 */
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Provider, useDispatch, useSelector } from "react-redux";
import {
  createPerf11Store,
  renameCustomer,
  toggleDarkMode,
  type RootState,
} from "./perf11Store";

/** Counts how many times the calling component has rendered. Demo-only. */
function useRenderCount() {
  const count = useRef(0);
  count.current += 1;
  return count.current;
}

function Card({
  testID,
  title,
  value,
  renders,
}: {
  testID: string;
  title: string;
  value: string;
  renders: number;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text testID={`${testID}-renders`} style={styles.renders}>
        renders: {renders}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Pair 1: show Alice's name

// ❌ Selects ALL customers. Renaming Bob gives a new byID object, so this re-renders.
function AliceNameFromCollection() {
  const customers = useSelector((state: RootState) => state.customers.byID);
  const renders = useRenderCount();
  return (
    <Card
      testID="collection"
      title="❌ state.customers.byID"
      value={customers.alice.name}
      renders={renders}
    />
  );
}

// ✅ Selects only Alice's name (a string). Re-renders only when it changes.
function AliceNameByID() {
  const name = useSelector(
    (state: RootState) => state.customers.byID.alice.name,
  );
  const renders = useRenderCount();
  return (
    <Card
      testID="by-id"
      title="✅ state.customers.byID.alice.name"
      value={name}
      renders={renders}
    />
  );
}

// ---------------------------------------------------------------------------
// Pair 2: "do we have any VIP customers?"

// ❌ filter() returns a NEW array on every action, so this re-renders after
// every single dispatch, even ones that have nothing to do with customers.
function HasVipFromArray() {
  const vips = useSelector((state: RootState) =>
    Object.values(state.customers.byID).filter((customer) => customer.isVip),
  );
  const renders = useRenderCount();
  return (
    <Card
      testID="array"
      title="❌ .filter(...) → array"
      value={vips.length > 0 ? "Has VIPs: yes" : "Has VIPs: no"}
      renders={renders}
    />
  );
}

// ✅ some() returns a boolean. true === true, so no re-render unless it flips.
function HasVipBoolean() {
  const hasVip = useSelector((state: RootState) =>
    Object.values(state.customers.byID).some((customer) => customer.isVip),
  );
  const renders = useRenderCount();
  return (
    <Card
      testID="boolean"
      title="✅ .some(...) → boolean"
      value={hasVip ? "Has VIPs: yes" : "Has VIPs: no"}
      renders={renders}
    />
  );
}

// ---------------------------------------------------------------------------

function Buttons() {
  const dispatch = useDispatch();
  // Gives every rename a new name, e.g. "Alice 1", "Alice 2".
  const renameCount = useRef(0);

  const rename = (id: string, baseName: string) => {
    renameCount.current += 1;
    dispatch(renameCustomer({ id, name: `${baseName} ${renameCount.current}` }));
  };

  const actions = [
    {
      testID: "rename-alice",
      label: "Rename Alice",
      run: () => rename("alice", "Alice"),
    },
    {
      testID: "rename-bob",
      label: "Rename Bob",
      run: () => rename("bob", "Bob"),
    },
    {
      testID: "unrelated",
      label: "Toggle dark mode",
      run: () => dispatch(toggleDarkMode()),
    },
  ];

  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Pressable
          key={action.testID}
          testID={action.testID}
          onPress={action.run}
          style={styles.button}
        >
          <Text style={styles.buttonText}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Perf11Screen() {
  const [store] = useState(createPerf11Store);

  return (
    <Provider store={store}>
      <View style={styles.screen}>
        <Buttons />
        <Text style={styles.section}>Show Alice&apos;s name</Text>
        <View style={styles.row}>
          <AliceNameFromCollection />
          <AliceNameByID />
        </View>
        <Text style={styles.section}>Do we have VIP customers?</Text>
        <View style={styles.row}>
          <HasVipFromArray />
          <HasVipBoolean />
        </View>
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 10, backgroundColor: "#fff" },
  row: { flexDirection: "row", gap: 8 },
  button: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#2F6FED",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  section: { marginTop: 8, fontSize: 16, fontWeight: "700" },
  card: {
    flex: 1,
    gap: 4,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F5F6F8",
  },
  cardTitle: { fontSize: 12, fontFamily: "SpaceMono" },
  value: { fontSize: 18, fontWeight: "600" },
  renders: { fontSize: 16, color: "#D93F3F", fontWeight: "700" },
});

export default Perf11Screen;

/**
 * PERF-1 demo: the same memoized row rendered two ways. Tap a row and look at
 * the "renders" badges: with the spread every row re-renders, without it only
 * the tapped row does.
 */
import { memo, useCallback, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

type Item = { id: string; title: string };

const ITEMS: Item[] = Array.from({ length: 100 }, (_, index) => ({
  id: String(index),
  title: `Item ${index}`,
}));

/** Counts how many times the calling component has rendered. Demo-only. */
function useRenderCount() {
  const count = useRef(0);
  count.current += 1;
  return count.current;
}

function RenderBadge({ count }: { count: number }) {
  const hasReRendered = count > 1;
  return (
    <Text style={[styles.badge, hasReRendered ? styles.bad : styles.good]}>
      renders: {count}
    </Text>
  );
}

// ❌ Receives one merged object, so its `item` prop is new on every render.
const SpreadRow = memo(function SpreadRow({
  item,
  onSelect,
}: {
  item: Item & { isSelected: boolean };
  onSelect: (id: string) => void;
}) {
  const renderCount = useRenderCount();
  return (
    <Pressable
      testID={`row-${item.id}`}
      onPress={() => onSelect(item.id)}
      style={[styles.row, item.isSelected && styles.selected]}
    >
      <Text>{item.title}</Text>
      <RenderBadge count={renderCount} />
    </Pressable>
  );
});

// ✅ Receives the original item plus a boolean, so unchanged rows skip rendering.
const DirectRow = memo(function DirectRow({
  item,
  isSelected,
  onSelect,
}: {
  item: Item;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const renderCount = useRenderCount();
  return (
    <Pressable
      testID={`row-${item.id}`}
      onPress={() => onSelect(item.id)}
      style={[styles.row, isSelected && styles.selected]}
    >
      <Text>{item.title}</Text>
      <RenderBadge count={renderCount} />
    </Pressable>
  );
});

type Mode = "spread" | "direct";

function ItemList({ mode }: { mode: Mode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Stable callback, so the only prop that can change is the item/selection.
  const onSelect = useCallback((id: string) => setSelectedId(id), []);

  return (
    <FlatList
      data={ITEMS}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) =>
        mode === "spread" ? (
          // ❌ PERF-1 violation: new object for every row, every render.
          <SpreadRow
            item={{ ...item, isSelected: item.id === selectedId }}
            onSelect={onSelect}
          />
        ) : (
          // ✅ PERF-1: pass the item as-is and the extra state as its own prop.
          <DirectRow
            item={item}
            isSelected={item.id === selectedId}
            onSelect={onSelect}
          />
        )
      }
    />
  );
}

function Perf1Screen() {
  const [mode, setMode] = useState<Mode>("spread");

  return (
    <View style={styles.screen}>
      <View style={styles.toggle}>
        <Pressable
          testID="mode-spread"
          onPress={() => setMode("spread")}
          style={[styles.button, mode === "spread" && styles.buttonActive]}
        >
          <Text>❌ With spread</Text>
        </Pressable>
        <Pressable
          testID="mode-direct"
          onPress={() => setMode("direct")}
          style={[styles.button, mode === "direct" && styles.buttonActive]}
        >
          <Text>✅ Without spread</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>Tap a row, then look at the badges.</Text>
      {/* The key remounts the list so the counters restart when you switch. */}
      <ItemList key={mode} mode={mode} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  toggle: { flexDirection: "row", gap: 8, padding: 12 },
  button: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonActive: { borderColor: "#2F6FED", backgroundColor: "#E8F0FE" },
  hint: { paddingHorizontal: 12, paddingBottom: 8, color: "#666" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  selected: { backgroundColor: "#E8F0FE" },
  badge: {
    paddingHorizontal: 8,
    borderRadius: 8,
    overflow: "hidden",
    fontWeight: "600",
  },
  good: { color: "#1E9E5A", backgroundColor: "#E6F6EC" },
  bad: { color: "#D93F3F", backgroundColor: "#FDECEC" },
});

export default Perf1Screen;

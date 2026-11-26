/**
 * PERF-17 demo: a contact screen with a note box. Typing re-renders the screen,
 * and on every render both cards answer "is Asha a favourite?". The ❌ card
 * copies all 20,000 favourite ids into a new Set first; the ✅ card looks the
 * id up directly in the object it already has. Type and compare the counters.
 */
import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  ASHA,
  FAVOURITE_COUNT,
  FAVOURITES_BY_ID,
  isFavouriteDirect,
  isFavouriteViaSet,
  lookupStats,
  resetLookupStats,
} from "./favourites";

type Variant = keyof typeof lookupStats;

const VERSIONS: Record<Variant, { title: string; code: string; check: typeof isFavouriteDirect }> = {
  withSet: {
    title: "❌ Build a Set, then ask",
    code: "const ids = new Set(\n  Object.keys(favouritesByID)\n);\nids.has(asha.id)",
    check: isFavouriteViaSet,
  },
  direct: {
    title: "✅ Ask the object directly",
    code: "!!favouritesByID[asha.id]",
    check: isFavouriteDirect,
  },
};

function FavouriteCard({ variant }: { variant: Variant }) {
  const { title, code, check } = VERSIONS[variant];
  // Demo-only render counter.
  const renders = useRef(0);
  renders.current += 1;

  const isFavourite = check(FAVOURITES_BY_ID, ASHA.id);
  const stats = lookupStats[variant];

  return (
    <View style={[styles.card, stats.idsCopied > 0 && styles.cardWrong]}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.code}>{code}</Text>
      <Text style={styles.answer}>{isFavourite ? "⭐ Asha is a favourite" : "Not a favourite"}</Text>
      <Stat testID={`${variant}-renders`} label="Renders" value={renders.current.toLocaleString()} isBad={false} />
      <Stat testID={`${variant}-copied`} label="Ids copied" value={stats.idsCopied.toLocaleString()} isBad={stats.idsCopied > 0} />
      <Stat testID={`${variant}-ms`} label="Time on lookups" value={`${stats.ms.toFixed(1)} ms`} isBad={stats.idsCopied > 0} />
    </View>
  );
}

function Stat({ testID, label, value, isBad }: { testID: string; label: string; value: string; isBad: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text testID={testID} style={[styles.statValue, isBad && styles.bad]}>
        {value}
      </Text>
    </View>
  );
}

function Perf17Screen() {
  const [note, setNote] = useState("");
  // Lets Reset give both cards fresh render counters.
  const [resetCount, setResetCount] = useState(0);

  const reset = () => {
    resetLookupStats();
    setNote("");
    setResetCount((count) => count + 1);
  };

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <View style={styles.steps}>
        <Text style={styles.stepsTitle}>The data you already have</Text>
        <Text style={styles.codeInline}>favouritesByID = {"{ 'contact-0': {...}, … }"}</Text>
        <Text>{FAVOURITE_COUNT.toLocaleString()} favourites, stored as an object keyed by id.</Text>
        <Text style={styles.stepsTitle}>The question</Text>
        <Text>Is Asha (contact-4321) a favourite? Both cards ask on every render.</Text>
        <Text style={styles.stepsTitle}>Try this</Text>
        <Text>Type a note below. Each letter re-renders the screen. Watch &quot;Ids copied&quot;.</Text>
      </View>

      <TextInput
        testID="note"
        value={note}
        onChangeText={setNote}
        placeholder="Write a note about Asha…"
        style={styles.input}
      />

      <Pressable testID="reset" onPress={reset} style={styles.button}>
        <Text style={styles.buttonText}>Reset counters</Text>
      </Pressable>

      <View style={styles.row} key={resetCount}>
        <FavouriteCard variant="withSet" />
        <FavouriteCard variant="direct" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 12, backgroundColor: "#fff" },
  steps: { gap: 2, padding: 12, borderRadius: 8, backgroundColor: "#EEF3FF" },
  stepsTitle: { fontWeight: "700", marginTop: 4 },
  codeInline: { fontFamily: "SpaceMono", fontSize: 11 },
  input: { borderWidth: 1, borderColor: "#C9CDD3", borderRadius: 8, padding: 12, fontSize: 16 },
  button: { alignItems: "center", padding: 12, borderRadius: 8, backgroundColor: "#555" },
  buttonText: { color: "#fff", fontWeight: "700" },
  row: { flexDirection: "row", gap: 8 },
  card: { flex: 1, gap: 6, padding: 10, borderRadius: 10, borderWidth: 2, borderColor: "#E3E5E8" },
  cardWrong: { borderColor: "#D93F3F", backgroundColor: "#FFF5F5" },
  cardTitle: { fontSize: 14, fontWeight: "700" },
  code: { fontFamily: "SpaceMono", fontSize: 10, padding: 6, borderRadius: 6, backgroundColor: "#F5F6F8" },
  answer: { fontWeight: "700" },
  stat: { padding: 6, borderRadius: 6, backgroundColor: "#F5F6F8" },
  statLabel: { fontSize: 11 },
  statValue: { fontSize: 20, fontWeight: "800", color: "#1E9E5A" },
  bad: { color: "#D93F3F" },
});

export default Perf17Screen;

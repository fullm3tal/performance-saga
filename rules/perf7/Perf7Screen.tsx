/**
 * PERF-7 demo: a message draft that must be cleared when you switch contact.
 * Type a message, switch contact, and compare the render counts.
 */
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

const CONTACTS = ["Alice", "Bob"];

/** Total renders per card. Module-level so the count survives a remount. Demo-only. */
export const renderCounts = { effect: 0, key: 0 };

// ❌ Clears its own state in an Effect when the contact changes.
// Switching renders twice: first with the OLD draft, then cleared.
function DraftWithEffectReset({ contact }: { contact: string }) {
  const [draft, setDraft] = useState("");
  useEffect(() => {
    setDraft("");
  }, [contact]);

  renderCounts.effect += 1;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>❌ Reset in useEffect</Text>
      <TextInput
        testID="effect-input"
        value={draft}
        onChangeText={setDraft}
        placeholder={`Message ${contact}`}
        style={styles.input}
      />
      <Text testID="effect-renders" style={styles.renders}>
        renders: {renderCounts.effect}
      </Text>
    </View>
  );
}

// ✅ No reset code at all. The parent gives it key={contact}, so a new
// contact means a brand-new component with fresh state, in one render.
function Draft({ contact }: { contact: string }) {
  const [draft, setDraft] = useState("");

  renderCounts.key += 1;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>✅ Reset with key</Text>
      <TextInput
        testID="key-input"
        value={draft}
        onChangeText={setDraft}
        placeholder={`Message ${contact}`}
        style={styles.input}
      />
      <Text testID="key-renders" style={styles.renders}>
        renders: {renderCounts.key}
      </Text>
    </View>
  );
}

function Perf7Screen() {
  const [contact, setContact] = useState(CONTACTS[0]);

  return (
    <View style={styles.screen}>
      <View style={styles.contacts}>
        {CONTACTS.map((name) => (
          <Pressable
            key={name}
            testID={`contact-${name}`}
            onPress={() => setContact(name)}
            style={[styles.contact, name === contact && styles.contactActive]}
          >
            <Text>{name}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.hint}>
        Type a message in both boxes, then switch contact.
      </Text>
      <View style={styles.cards}>
        <DraftWithEffectReset contact={contact} />
        <Draft key={contact} contact={contact} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 12, backgroundColor: "#fff" },
  contacts: { flexDirection: "row", gap: 8 },
  contact: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  contactActive: { borderColor: "#2F6FED", backgroundColor: "#E8F0FE" },
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
  input: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  renders: { fontSize: 16, color: "#D93F3F", fontWeight: "700" },
});

export default Perf7Screen;

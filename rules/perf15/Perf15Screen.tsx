/**
 * PERF-15 demo: tap a person, and two cards load that person's profile.
 * Alice's reply is slow (2.5s), Bob's is fast (0.5s). Tap Alice, then Bob:
 * Bob's reply arrives first, then Alice's old reply arrives. The ❌ card shows
 * whichever arrived last (Alice, wrong). The ✅ card ignores replies for a
 * person you're no longer looking at.
 */
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PEOPLE, REPLY_MS, fetchProfile, type Profile } from "./fakeApi";

/** Gap between the two taps that "Do it for me" makes. */
const AUTO_TAP_GAP_MS = 200;

type LogEntry = { text: string; wasIgnored: boolean };

// ❌ No cleanup: every reply that comes back gets shown, even old ones.
function ProfileWithoutCleanup({ selected }: { selected: string | null }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (selected === null) {
      return;
    }
    fetchProfile(selected).then((result) => {
      setProfile(result);
      setLog((entries) => [...entries, { text: `📨 ${result.name}'s reply → shown`, wasIgnored: false }]);
    });
  }, [selected]);

  return <ProfileCard testID="no-cleanup" title="❌ No cleanup" selected={selected} profile={profile} log={log} />;
}

// ✅ The cleanup marks the old request as "ignore", so its reply can't overwrite the new one.
function ProfileWithCleanup({ selected }: { selected: string | null }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (selected === null) {
      return;
    }
    let ignore = false;
    fetchProfile(selected).then((result) => {
      if (ignore) {
        setLog((entries) => [...entries, { text: `📨 ${result.name}'s reply → ignored (old)`, wasIgnored: true }]);
        return;
      }
      setProfile(result);
      setLog((entries) => [...entries, { text: `📨 ${result.name}'s reply → shown`, wasIgnored: false }]);
    });
    return () => {
      ignore = true;
    };
  }, [selected]);

  return <ProfileCard testID="with-cleanup" title="✅ With cleanup" selected={selected} profile={profile} log={log} />;
}

type ProfileCardProps = {
  testID: string;
  title: string;
  selected: string | null;
  profile: Profile | null;
  log: LogEntry[];
};

function ProfileCard({ testID, title, selected, profile, log }: ProfileCardProps) {
  const isMatch = profile !== null && profile.name === selected;
  let status = "Tap a person above";
  if (selected !== null && profile === null) {
    status = `⏳ Loading ${selected}…`;
  } else if (selected !== null && profile !== null) {
    status = isMatch ? "✅ Matches who you picked" : `⚠️ You picked ${selected}`;
  }

  return (
    <View style={[styles.card, selected !== null && profile !== null && !isMatch && styles.cardWrong]}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text testID={`${testID}-name`} style={styles.profileName}>
        {profile ? `${profile.emoji} ${profile.name}` : "—"}
      </Text>
      <Text style={styles.city}>{profile ? profile.city : " "}</Text>
      <Text testID={`${testID}-status`} style={[styles.status, isMatch ? styles.good : styles.bad]}>
        {status}
      </Text>
      <View style={styles.log}>
        {log.length === 0 ? <Text style={styles.logIgnored}>No replies yet</Text> : null}
        {log.map((entry, index) => (
          // Entries are only ever appended, so the position is a stable key.
          <Text key={index} style={entry.wasIgnored ? styles.logIgnored : styles.logShown}>
            {entry.text}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Perf15Screen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [taps, setTaps] = useState<string[]>([]);
  // Lets Reset give both cards a fresh start (empty profile and log).
  const [resetCount, setResetCount] = useState(0);
  const autoTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // PERF-12 again: don't leave the auto-tap timer running after leaving the screen.
  useEffect(
    () => () => {
      if (autoTapTimer.current) {
        clearTimeout(autoTapTimer.current);
      }
    },
    [],
  );

  const pick = (name: string) => {
    setSelected(name);
    setTaps((previous) => [...previous, name]);
  };

  const raceForMe = () => {
    pick("Alice");
    autoTapTimer.current = setTimeout(() => pick("Bob"), AUTO_TAP_GAP_MS);
  };

  const reset = () => {
    setSelected(null);
    setTaps([]);
    setResetCount((count) => count + 1);
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.steps}>
        <Text style={styles.stepsTitle}>Try this</Text>
        <Text>1. Tap Alice (slow reply), then quickly tap Bob (fast reply).</Text>
        <Text>2. Wait 3 seconds.</Text>
        <Text>3. You picked Bob. Which card ends up showing Alice?</Text>
      </View>

      <View style={styles.row}>
        {PEOPLE.map((name) => (
          <Pressable
            key={name}
            testID={`pick-${name}`}
            onPress={() => pick(name)}
            style={[styles.person, name === selected && styles.personActive]}
          >
            <Text style={[styles.personName, name === selected && styles.personNameActive]}>{name}</Text>
            <Text style={[styles.personDelay, name === selected && styles.personNameActive]}>
              reply in {REPLY_MS[name] / 1000}s
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.row}>
        <Pressable testID="race" onPress={raceForMe} style={styles.button}>
          <Text style={styles.buttonText}>⚡ Tap Alice → Bob for me</Text>
        </Pressable>
        <Pressable testID="reset" onPress={reset} style={[styles.button, styles.resetButton]}>
          <Text style={styles.buttonText}>Reset</Text>
        </Pressable>
      </View>

      <Text testID="taps" style={styles.taps}>
        You tapped: {taps.length === 0 ? "nobody yet" : taps.join(" → ")}
      </Text>

      <View style={styles.row} key={resetCount}>
        <ProfileWithoutCleanup selected={selected} />
        <ProfileWithCleanup selected={selected} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 12, backgroundColor: "#fff" },
  steps: { gap: 2, padding: 12, borderRadius: 8, backgroundColor: "#EEF3FF" },
  stepsTitle: { fontWeight: "700", marginBottom: 4 },
  row: { flexDirection: "row", gap: 8 },
  person: { flex: 1, alignItems: "center", padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#2F6FED" },
  personActive: { backgroundColor: "#2F6FED" },
  personName: { fontSize: 16, fontWeight: "700", color: "#2F6FED" },
  personNameActive: { color: "#fff" },
  personDelay: { fontSize: 11, color: "#2F6FED" },
  button: { flex: 2, alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 8, backgroundColor: "#2F6FED" },
  resetButton: { flex: 1, backgroundColor: "#555" },
  buttonText: { color: "#fff", fontWeight: "700", textAlign: "center" },
  taps: { fontSize: 15, fontWeight: "700" },
  card: { flex: 1, gap: 6, padding: 10, borderRadius: 10, borderWidth: 2, borderColor: "#E3E5E8" },
  cardWrong: { borderColor: "#D93F3F", backgroundColor: "#FFF5F5" },
  cardTitle: { fontSize: 12, fontFamily: "SpaceMono" },
  profileName: { fontSize: 26, fontWeight: "800" },
  city: { color: "#555" },
  status: { fontWeight: "700" },
  good: { color: "#1E9E5A" },
  bad: { color: "#D93F3F" },
  log: { gap: 3, padding: 6, borderRadius: 6, backgroundColor: "#1E1E1E" },
  logShown: { color: "#B9F6CA", fontFamily: "SpaceMono", fontSize: 10 },
  logIgnored: { color: "#9E9E9E", fontFamily: "SpaceMono", fontSize: 10 },
});

export default Perf15Screen;

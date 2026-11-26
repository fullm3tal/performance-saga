/**
 * PERF-16 demo: two copies of an "app" do the same one-time setup when they
 * start: start an analytics session and register a "notification tapped"
 * handler. The ❌ app runs that setup in a plain useEffect; the ✅ app guards it
 * with a module-level flag. Both run inside <StrictMode>, which (in development)
 * mounts every component twice on purpose, and you can also restart them.
 */
import { StrictMode, useEffect, useState, useSyncExternalStore } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { createFakeSdk, type FakeSdk } from "./fakeSdk";

const unguardedSdk = createFakeSdk();
const guardedSdk = createFakeSdk();

/** The order the pretend push notification is about. */
const ORDER_ID = 42;

function openOrderScreen(sdk: FakeSdk) {
  return (orderID: number) => sdk.log(`📦 opened Order #${orderID} screen`);
}

// ❌ Runs the setup every time this effect runs: twice under Strict Mode,
// and again every time the app component is remounted.
function UnguardedApp() {
  useEffect(() => {
    unguardedSdk.startSession();
    unguardedSdk.onNotificationTap(openOrderScreen(unguardedSdk));
  }, []);

  return <SdkPanel testID="unguarded" title="❌ No guard" sdk={unguardedSdk} />;
}

// ✅ A flag outside the component remembers that setup already happened.
let didInit = false;

function GuardedApp() {
  useEffect(() => {
    if (didInit) {
      return;
    }
    didInit = true;

    guardedSdk.startSession();
    guardedSdk.onNotificationTap(openOrderScreen(guardedSdk));
  }, []);

  return <SdkPanel testID="guarded" title="✅ didInit guard" sdk={guardedSdk} />;
}

/** Demo-only: pretend the app was closed and launched fresh. */
function resetDemo() {
  didInit = false;
  unguardedSdk.reset();
  guardedSdk.reset();
}

function SdkPanel({ testID, title, sdk }: { testID: string; title: string; sdk: FakeSdk }) {
  const state = useSyncExternalStore(sdk.subscribe, sdk.getState);
  return (
    <View style={[styles.card, state.handlers > 1 && styles.cardWrong]}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Counter testID={`${testID}-sessions`} label="Analytics sessions" value={state.sessions} />
      <Counter testID={`${testID}-handlers`} label="Tap handlers" value={state.handlers} />
      <View style={styles.log}>
        {state.log.length === 0 ? <Text style={styles.logLine}>Nothing yet</Text> : null}
        {state.log.map((line, index) => (
          // The log is rebuilt newest-first on every change, so the position is the only key.
          <Text key={index} style={line.startsWith("📦") && state.handlers > 1 ? styles.logBad : styles.logLine}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Counter({ testID, label, value }: { testID: string; label: string; value: number }) {
  return (
    <View style={styles.counter}>
      <Text style={styles.counterLabel}>{label}</Text>
      <Text testID={testID} style={[styles.counterValue, value > 1 && styles.bad]}>
        {value}
      </Text>
    </View>
  );
}

function Perf16Screen() {
  // Bumping this remounts both apps, like closing and reopening a screen that holds them.
  const [launchCount, setLaunchCount] = useState(0);

  // No reset when leaving the screen: the SDKs and `didInit` live for the whole
  // app run, like the real thing. Leave and come back: ❌ sets up again, ✅ doesn't.

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.steps}>
        <Text style={styles.stepsTitle}>The setup each app runs once at start</Text>
        <Text>• start an analytics session</Text>
        <Text>• register &quot;when a notification is tapped, open that order&quot;</Text>
        <Text style={styles.stepsTitle}>Try this</Text>
        <Text>1. Look at the counters. Both should be 1.</Text>
        <Text>2. Tap 🔔. How many order screens open?</Text>
        <Text>3. Tap Remount (or leave and come back) and tap 🔔 again.</Text>
      </View>

      <View style={styles.row}>
        <Pressable
          testID="tap-notification"
          onPress={() => {
            unguardedSdk.tapNotification(ORDER_ID);
            guardedSdk.tapNotification(ORDER_ID);
          }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>🔔 Tap notification</Text>
        </Pressable>
        <Pressable testID="remount" onPress={() => setLaunchCount((count) => count + 1)} style={styles.button}>
          <Text style={styles.buttonText}>Remount apps</Text>
        </Pressable>
      </View>
      <Pressable
        testID="reset"
        onPress={() => {
          resetDemo();
          setLaunchCount((count) => count + 1);
        }}
        style={[styles.button, styles.resetButton]}
      >
        <Text style={styles.buttonText}>Reset (fresh app launch)</Text>
      </Pressable>

      <StrictMode>
        <View style={styles.row} key={launchCount}>
          <UnguardedApp />
          <GuardedApp />
        </View>
      </StrictMode>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 12, backgroundColor: "#fff" },
  steps: { gap: 2, padding: 12, borderRadius: 8, backgroundColor: "#EEF3FF" },
  stepsTitle: { fontWeight: "700", marginTop: 4 },
  row: { flexDirection: "row", gap: 8 },
  button: { flex: 1, alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 8, backgroundColor: "#2F6FED" },
  resetButton: { backgroundColor: "#555" },
  buttonText: { color: "#fff", fontWeight: "700", textAlign: "center" },
  card: { flex: 1, gap: 8, padding: 10, borderRadius: 10, borderWidth: 2, borderColor: "#E3E5E8" },
  cardWrong: { borderColor: "#D93F3F", backgroundColor: "#FFF5F5" },
  cardTitle: { fontSize: 13, fontFamily: "SpaceMono" },
  counter: { padding: 8, borderRadius: 8, backgroundColor: "#F5F6F8" },
  counterLabel: { fontSize: 12 },
  counterValue: { fontSize: 26, fontWeight: "800", color: "#1E9E5A" },
  bad: { color: "#D93F3F" },
  log: { gap: 3, padding: 6, borderRadius: 6, backgroundColor: "#1E1E1E" },
  logLine: { color: "#B9F6CA", fontFamily: "SpaceMono", fontSize: 10 },
  logBad: { color: "#FF8A80", fontFamily: "SpaceMono", fontSize: 10 },
});

export { resetDemo };
export default Perf16Screen;

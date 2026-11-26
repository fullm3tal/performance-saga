/**
 * PERF-12 demo: a live cricket score card that refreshes itself every second.
 * Both lanes show the same card. The ❌ card starts a setInterval and never
 * stops it; the ✅ card stops it in the useEffect cleanup. Open and close each
 * card a few times and read the log: closed ❌ cards keep running in the background.
 */
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  newTimer,
  resetTracker,
  tick,
  timerStopped,
  useTrackerState,
  type Lane,
  type LaneState,
} from "./leakTracker";

/** How often a score card refreshes itself. */
const REFRESH_INTERVAL_MS = 1000;

/** Demo-only: lets a timer callback know whether its card is still on screen. */
function useIsOpenRef() {
  const isOpen = useRef(true);
  useEffect(() => {
    isOpen.current = true;
    return () => {
      isOpen.current = false;
    };
  }, []);
  return isOpen;
}

// ❌ Starts a timer when the card opens, but never stops it.
function LeakyScoreCard() {
  const [refreshes, setRefreshes] = useState(0);
  const isOpen = useIsOpenRef();

  useEffect(() => {
    const timer = newTimer("leaky");
    timer.id = setInterval(() => {
      tick(timer, isOpen.current);
      setRefreshes((count) => count + 1);
    }, REFRESH_INTERVAL_MS);
    // Missing: return () => clearInterval(timer.id);
  }, [isOpen]);

  return <ScoreCard refreshes={refreshes} />;
}

// ✅ Same card, but the cleanup stops the timer when the card closes.
function CleanScoreCard() {
  const [refreshes, setRefreshes] = useState(0);
  const isOpen = useIsOpenRef();

  useEffect(() => {
    const timer = newTimer("clean");
    timer.id = setInterval(() => {
      tick(timer, isOpen.current);
      setRefreshes((count) => count + 1);
    }, REFRESH_INTERVAL_MS);
    return () => {
      clearInterval(timer.id);
      timerStopped(timer);
    };
  }, [isOpen]);

  return <ScoreCard refreshes={refreshes} />;
}

function ScoreCard({ refreshes }: { refreshes: number }) {
  return (
    <View style={styles.scoreCard}>
      <Text style={styles.score}>🏏 IND 45/2</Text>
      <Text style={styles.refreshes}>refreshed {refreshes}×</Text>
    </View>
  );
}

const LANES: Record<
  Lane,
  { title: string; code: string; Card: () => React.JSX.Element }
> = {
  leaky: {
    title: "❌ Without cleanup",
    code: "useEffect(() => {\n  setInterval(refresh, 1000);\n}, []);",
    Card: LeakyScoreCard,
  },
  clean: {
    title: "✅ With cleanup",
    code: "useEffect(() => {\n  const id = setInterval(refresh, 1000);\n  return () => clearInterval(id);\n}, []);",
    Card: CleanScoreCard,
  },
};

function LaneView({ lane, laneState }: { lane: Lane; laneState: LaneState }) {
  const [isOpen, setIsOpen] = useState(false);
  const { title, code, Card } = LANES[lane];
  // Healthy: one timer while the card is open, none when it's closed.
  const expectedRunning = isOpen ? 1 : 0;
  const isLeaking = laneState.running > expectedRunning;

  return (
    <View style={[styles.lane, isLeaking && styles.laneLeaking]}>
      <Text style={styles.laneTitle}>{title}</Text>
      <Text style={styles.code}>{code}</Text>

      <Pressable
        testID={`${lane}-toggle`}
        onPress={() => setIsOpen((value) => !value)}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          {isOpen ? "Close score card" : "Open score card"}
        </Text>
      </Pressable>

      {isOpen ? (
        <Card />
      ) : (
        <Text style={styles.closed}>Card is closed (not on screen)</Text>
      )}

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Timers running</Text>
          <Text
            testID={`${lane}-running`}
            style={[styles.statValue, isLeaking && styles.bad]}
          >
            {laneState.running}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Wasted refreshes</Text>
          <Text
            testID={`${lane}-wasted`}
            style={[styles.statValue, laneState.wastedTicks > 0 && styles.bad]}
          >
            {laneState.wastedTicks}
          </Text>
        </View>
      </View>

      <View style={styles.log}>
        {laneState.log.length === 0 ? (
          <Text style={styles.logLine}>Log is empty. Open the card.</Text>
        ) : null}
        {laneState.log.map((line, index) => (
          // Log lines can repeat, so the position is the only stable key.
          <Text key={index} style={styles.logLine}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Perf12Screen() {
  const trackerState = useTrackerState();
  // Lets Reset also close both cards, by giving each lane a fresh key.
  const [resetCount, setResetCount] = useState(0);

  // Leaving the screen kills any leaked demo timers so they don't keep running in other demos.
  useEffect(() => resetTracker, []);

  const reset = () => {
    setResetCount((count) => count + 1);
    resetTracker();
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.steps}>
        <Text style={styles.stepsTitle}>Try this in each box</Text>
        <Text>
          1. Tap Open: one timer starts and refreshes the score every second.
        </Text>
        <Text>2. Tap Close: the card leaves the screen.</Text>
        <Text>3. Watch the log. Does the timer stop?</Text>
        <Text>4. Open and close 3 more times and compare the counters.</Text>
      </View>

      <LaneView
        key={`leaky-${resetCount}`}
        lane="leaky"
        laneState={trackerState.leaky}
      />
      <LaneView
        key={`clean-${resetCount}`}
        lane="clean"
        laneState={trackerState.clean}
      />

      <Pressable
        testID="reset"
        onPress={reset}
        style={[styles.button, styles.resetButton]}
      >
        <Text style={styles.buttonText}>Reset (stop every timer)</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 12, backgroundColor: "#fff" },
  steps: { gap: 2, padding: 12, borderRadius: 8, backgroundColor: "#EEF3FF" },
  stepsTitle: { fontWeight: "700", marginBottom: 4 },
  lane: {
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E3E5E8",
  },
  laneLeaking: { borderColor: "#D93F3F", backgroundColor: "#FFF5F5" },
  laneTitle: { fontSize: 18, fontWeight: "700" },
  code: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#F5F6F8",
  },
  button: {
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#2F6FED",
  },
  resetButton: { backgroundColor: "#555", marginBottom: 24 },
  buttonText: { color: "#fff", fontWeight: "700" },
  scoreCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#E8F7EE",
  },
  score: { fontSize: 20, fontWeight: "700" },
  refreshes: { color: "#1E9E5A", fontWeight: "600" },
  closed: { padding: 12, textAlign: "center", color: "#888" },
  statsRow: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, padding: 8, borderRadius: 8, backgroundColor: "#F5F6F8" },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 26, fontWeight: "700", color: "#1E9E5A" },
  bad: { color: "#D93F3F" },
  log: { gap: 2, padding: 8, borderRadius: 6, backgroundColor: "#1E1E1E" },
  logLine: { fontFamily: "SpaceMono", fontSize: 11, color: "#E6E6E6" },
});

export default Perf12Screen;

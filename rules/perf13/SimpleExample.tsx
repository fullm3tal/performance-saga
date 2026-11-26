/**
 * PERF-13 simple example: replays, one step at a time, what each version of
 * "greet every student" does. You can watch the ❌ version call the office
 * before every greeting, while the ✅ version calls once and then just greets.
 */
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { STUDENTS, greetHoisted, greetInLoop } from "./greetStudents";

/** How long each replayed step stays on screen before the next one appears. */
const STEP_MS = 500;

/** Runs a version once and keeps its log, which the replay walks through. */
function recordSteps(greet: (students: string[], log: string[]) => string[]) {
  const log: string[] = [];
  greet(STUDENTS, log);
  return log;
}

const LANES = [
  {
    key: "inLoop",
    title: "❌ Ask inside the loop",
    code: 'students.map((name) => {\n  const school = getSchoolName();\n  return `Hi ${name}, welcome to ${school}`;\n});',
    steps: recordSteps(greetInLoop),
  },
  {
    key: "hoisted",
    title: "✅ Ask once, before the loop",
    code: 'const school = getSchoolName();\nstudents.map((name) =>\n  `Hi ${name}, welcome to ${school}`\n);',
    steps: recordSteps(greetHoisted),
  },
];

const TOTAL_STEPS = Math.max(...LANES.map((lane) => lane.steps.length));

function isOfficeCall(step: string) {
  return step.startsWith("📞");
}

/** "1 office call" / "6 office calls". */
function countCalls(steps: string[]) {
  const calls = steps.filter(isOfficeCall).length;
  return `${calls} office ${calls === 1 ? "call" : "calls"}`;
}

function SimpleExample() {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Derived, not stored: the replay stops by itself once every step is shown.
  const isRunning = isPlaying && visibleSteps < TOTAL_STEPS;

  useEffect(() => {
    if (!isRunning) {
      return;
    }
    const id = setInterval(() => {
      setVisibleSteps((count) => Math.min(count + 1, TOTAL_STEPS));
    }, STEP_MS);
    return () => clearInterval(id);
  }, [isRunning]);

  const play = () => {
    setVisibleSteps(0);
    setIsPlaying(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.story}>
        Write &quot;Hi NAME, welcome to SCHOOL&quot; for {STUDENTS.length} students.
        The school name comes from getSchoolName(), which phones the office. The
        answer is the same for every student.
      </Text>

      <Pressable testID="play" onPress={play} style={styles.button}>
        <Text style={styles.buttonText}>
          {isRunning ? "Playing…" : "▶ Play step by step"}
        </Text>
      </Pressable>

      {LANES.map((lane) => {
        const shown = lane.steps.slice(0, visibleSteps);
        const calls = shown.filter(isOfficeCall).length;
        const isDone = visibleSteps >= lane.steps.length;
        return (
          <View key={lane.key} style={styles.lane}>
            <Text style={styles.laneTitle}>{lane.title}</Text>
            <Text style={styles.code}>{lane.code}</Text>
            <View style={styles.counters}>
              <Text testID={`${lane.key}-calls`} style={styles.counter}>
                📞 office calls: {calls}
              </Text>
              <Text testID={`${lane.key}-steps`} style={styles.counter}>
                steps: {shown.length}
              </Text>
            </View>
            <View style={styles.log}>
              {shown.length === 0 ? (
                <Text style={styles.empty}>Tap Play.</Text>
              ) : null}
              {shown.map((step, index) => (
                <Text
                  // A step's position in the replay never changes, so it's a stable key.
                  key={index}
                  style={isOfficeCall(step) ? styles.callLine : styles.greetLine}
                >
                  {step}
                </Text>
              ))}
            </View>
            {isDone && visibleSteps > 0 ? (
              <Text testID={`${lane.key}-done`} style={styles.done}>
                Finished in {lane.steps.length} steps (
                {countCalls(lane.steps)})
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  story: { fontSize: 14, lineHeight: 20 },
  button: {
    alignItems: "center",
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#2F6FED",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  lane: {
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E3E5E8",
  },
  laneTitle: { fontSize: 17, fontWeight: "700" },
  code: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#F5F6F8",
  },
  counters: { flexDirection: "row", justifyContent: "space-between" },
  counter: { fontSize: 15, fontWeight: "700" },
  log: { gap: 3, padding: 8, borderRadius: 6, backgroundColor: "#1E1E1E" },
  empty: { color: "#999", fontFamily: "SpaceMono", fontSize: 11 },
  callLine: { color: "#FF8A80", fontFamily: "SpaceMono", fontSize: 11 },
  greetLine: { color: "#B9F6CA", fontFamily: "SpaceMono", fontSize: 11 },
  done: { fontWeight: "700", color: "#1E9E5A" },
});

export default SimpleExample;

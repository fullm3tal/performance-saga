/**
 * PERF-14 demo. Each part shows the same component twice: once reading an
 * outside-React store through useEffect + useState (❌), once through
 * useSyncExternalStore (✅). Every card lists what each of its renders showed,
 * so you can see the ❌ card's first render show a wrong value.
 * Part 1: a cart badge. Part 2: a checkout screen that must know if you're online.
 */
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useCartCount, useCartCountWithEffect } from "./cartHooks";
import { addNextItem, getCount, resetCart } from "./cartStore";
import { useIsOnline, useIsOnlineWithEffect } from "./networkHooks";
import { getIsOnline, setIsOnline } from "./networkStore";

/**
 * Demo-only: remembers one line per render of the calling component.
 * `isWrong` marks a render that showed something different from the store.
 */
function useRenderLog(description: string, isWrong: boolean, truth: string) {
  const log = useRef<{ text: string; isWrong: boolean }[]>([]);
  const number = log.current.length + 1;
  log.current.push({
    text: `render #${number} → ${description}${isWrong ? ` ⚠️ wrong (${truth})` : ""}`,
    isWrong,
  });
  return log.current;
}

function RenderLog({ entries }: { entries: { text: string; isWrong: boolean }[] }) {
  return (
    <View style={styles.log}>
      {entries.map((entry, index) => (
        // Entries are only ever appended, so the position is a stable key.
        <Text key={index} style={entry.isWrong ? styles.logBad : styles.logLine}>
          {entry.text}
        </Text>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Part 1: cart badge

function Badge({ testID, title, count }: { testID: string; title: string; count: number }) {
  const actual = getCount();
  const log = useRenderLog(`showed ${count}`, count !== actual, `cart has ${actual}`);
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text testID={`${testID}-count`} style={styles.badge}>
        🛒 {count}
      </Text>
      <Text testID={`${testID}-renders`} style={styles.renderCount}>
        renders: {log.length}
      </Text>
      <RenderLog entries={log} />
    </View>
  );
}

function EffectBadge() {
  return <Badge testID="effect-badge" title="❌ useEffect + useState" count={useCartCountWithEffect()} />;
}

function SyncBadge() {
  return <Badge testID="sync-badge" title="✅ useSyncExternalStore" count={useCartCount()} />;
}

function CartExample() {
  const [mountCount, setMountCount] = useState(0);

  return (
    <View style={styles.section}>
      <Text style={styles.story}>
        The cart lives outside React and already has 3 items. Each badge shows how many. Tap Mount, then read each
        badge&apos;s render log.
      </Text>
      <View style={styles.row}>
        <Button
          testID="mount-badges"
          label={mountCount === 0 ? "Mount badges" : "Remount badges"}
          onPress={() => setMountCount((count) => count + 1)}
        />
        <Button testID="add-item" label="Add item" onPress={addNextItem} />
      </View>
      {mountCount > 0 ? (
        <View style={styles.row} key={mountCount}>
          <EffectBadge />
          <SyncBadge />
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Part 2: checkout screen, online or offline

function Checkout({ testID, title, isOnline }: { testID: string; title: string; isOnline: boolean }) {
  const actual = getIsOnline();
  const log = useRenderLog(
    isOnline ? "🟢 Online, Pay ON" : "🔴 Offline, Pay OFF",
    isOnline !== actual,
    `phone is ${actual ? "online" : "offline"}`,
  );
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text testID={`${testID}-banner`} style={[styles.banner, isOnline ? styles.bannerOnline : styles.bannerOffline]}>
        {isOnline ? "🟢 Online" : "🔴 Offline"}
      </Text>
      <View style={[styles.payButton, !isOnline && styles.payButtonDisabled]}>
        <Text style={styles.payText}>{isOnline ? "Pay ₹499" : "Pay (needs internet)"}</Text>
      </View>
      <Text testID={`${testID}-renders`} style={styles.renderCount}>
        renders: {log.length}
      </Text>
      <RenderLog entries={log} />
    </View>
  );
}

function EffectCheckout() {
  return <Checkout testID="effect-checkout" title="❌ useEffect + useState" isOnline={useIsOnlineWithEffect()} />;
}

function SyncCheckout() {
  return <Checkout testID="sync-checkout" title="✅ useSyncExternalStore" isOnline={useIsOnline()} />;
}

function OnlineExample() {
  // The Wi-Fi switch itself reads the store the right way too.
  const isOnline = useIsOnline();
  const [openCount, setOpenCount] = useState(0);

  return (
    <View style={styles.section}>
      <Text style={styles.story}>
        A checkout screen must only allow paying when the phone is online. The network status lives outside React
        (like NetInfo).
      </Text>
      <View style={styles.steps}>
        <Text>1. Turn Wi-Fi off.</Text>
        <Text>2. Open checkout.</Text>
        <Text>3. Read render #1 on each side. Which one showed &quot;Online&quot; when you were offline?</Text>
      </View>
      <View style={styles.row}>
        <Button
          testID="toggle-wifi"
          label={isOnline ? "📶 Wi-Fi on → turn off" : "🚫 Wi-Fi off → turn on"}
          onPress={() => setIsOnline(!isOnline)}
        />
        <Button
          testID="open-checkout"
          label={openCount === 0 ? "Open checkout" : "Reopen checkout"}
          onPress={() => setOpenCount((count) => count + 1)}
        />
      </View>
      {openCount > 0 ? (
        <View style={styles.row} key={openCount}>
          <EffectCheckout />
          <SyncCheckout />
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------

function Button({ testID, label, onPress }: { testID: string; label: string; onPress: () => void }) {
  return (
    <Pressable testID={testID} onPress={onPress} style={styles.button}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

function Perf14Screen() {
  // Both stores are shared modules, so start every visit from the same state.
  useEffect(
    () => () => {
      resetCart();
      setIsOnline(true);
    },
    [],
  );

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.heading}>1. Cart badge</Text>
      <CartExample />
      <Text style={styles.heading}>2. Checkout: am I online?</Text>
      <OnlineExample />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 12, backgroundColor: "#fff" },
  heading: { fontSize: 20, fontWeight: "800", marginTop: 8 },
  section: { gap: 10 },
  story: { fontSize: 14, lineHeight: 20 },
  steps: { gap: 2, padding: 10, borderRadius: 8, backgroundColor: "#EEF3FF" },
  row: { flexDirection: "row", gap: 8 },
  button: { flex: 1, alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 8, backgroundColor: "#2F6FED" },
  buttonText: { color: "#fff", fontWeight: "700", textAlign: "center" },
  card: { flex: 1, gap: 6, padding: 10, borderRadius: 10, borderWidth: 2, borderColor: "#E3E5E8" },
  cardTitle: { fontSize: 12, fontFamily: "SpaceMono" },
  badge: { fontSize: 30, fontWeight: "800" },
  banner: { padding: 8, borderRadius: 6, fontWeight: "800", textAlign: "center", overflow: "hidden" },
  bannerOnline: { backgroundColor: "#E8F7EE", color: "#1E9E5A" },
  bannerOffline: { backgroundColor: "#FDECEC", color: "#D93F3F" },
  payButton: { alignItems: "center", padding: 10, borderRadius: 6, backgroundColor: "#1E9E5A" },
  payButtonDisabled: { backgroundColor: "#B8BCC2" },
  payText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  renderCount: { fontSize: 15, fontWeight: "700" },
  log: { gap: 3, padding: 6, borderRadius: 6, backgroundColor: "#1E1E1E" },
  logLine: { color: "#B9F6CA", fontFamily: "SpaceMono", fontSize: 10 },
  logBad: { color: "#FF8A80", fontFamily: "SpaceMono", fontSize: 10 },
});

export default Perf14Screen;

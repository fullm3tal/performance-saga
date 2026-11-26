/**
 * PERF-21 demo: the same chat shown twice, from one Redux store.
 * ❌ The list reads every message and hands each row its message as a prop.
 * ✅ The list only hands each row an id, and the row reads its own message.
 * Tap ❤️ on any message (it updates both lists) and watch which rows flash.
 */
import { useState } from "react";
import { Animated, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Provider, useSelector } from "react-redux";
import createRenderTracker, { type RenderTracker } from "@/lab/createRenderTracker";
import { Measured, RenderTrackerProvider, useRenderStats, useRenderTracker, useTrackRender } from "@/lab/RenderTrackerContext";
import useRenderFlash from "@/lab/useRenderFlash";
import { createChatStore, likeMessage, type ChatState, type Message } from "./chatStore";

type OnLike = (messageID: string) => void;

// ---------------------------------------------------------------------------
// ❌ The list reads all messages and passes each row its message.

function ListPassingMessages({ onLike }: { onLike: OnLike }) {
  const ids = useSelector((state: ChatState) => state.messages.ids);
  const messagesByID = useSelector((state: ChatState) => state.messages.byID);
  const listRenders = useTrackRender("list");

  return (
    <ListShell listRenders={listRenders} testID="reads-all">
      <FlatList
        data={ids}
        extraData={messagesByID}
        scrollEnabled={false}
        renderItem={({ item }) => <RowFromProps message={messagesByID[item]} onLike={onLike} />}
      />
    </ListShell>
  );
}

function RowFromProps({ message, onLike }: { message: Message; onLike: OnLike }) {
  const renders = useTrackRender(message.id);
  return <MessageRow message={message} renders={renders} onLike={onLike} testID={`reads-all-${message.id}`} />;
}

// ---------------------------------------------------------------------------
// ✅ The list passes only ids; each row reads its own message.

function ListPassingIDs({ onLike }: { onLike: OnLike }) {
  const ids = useSelector((state: ChatState) => state.messages.ids);
  const listRenders = useTrackRender("list");

  return (
    <ListShell listRenders={listRenders} testID="reads-own">
      <FlatList
        data={ids}
        scrollEnabled={false}
        renderItem={({ item }) => <RowReadsOwnMessage messageID={item} onLike={onLike} />}
      />
    </ListShell>
  );
}

function RowReadsOwnMessage({ messageID, onLike }: { messageID: string; onLike: OnLike }) {
  const message = useSelector((state: ChatState) => state.messages.byID[messageID]);
  const renders = useTrackRender(messageID);
  return <MessageRow message={message} renders={renders} onLike={onLike} testID={`reads-own-${messageID}`} />;
}

// ---------------------------------------------------------------------------
// Shared look

function MessageRow({ message, renders, onLike, testID }: { message: Message; renders: number; onLike: OnLike; testID: string }) {
  const flash = useRenderFlash();
  return (
    <Pressable testID={testID} onPress={() => onLike(message.id)} style={styles.rowPress}>
      <View style={styles.row}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, { opacity: flash }]} />
        <View style={styles.rowText}>
          <Text style={styles.author} numberOfLines={1}>
            {message.author}
          </Text>
          <Text style={styles.text} numberOfLines={1}>
            {message.text}
          </Text>
        </View>
        <View style={styles.rowSide}>
          <Text style={styles.likes}>❤️ {message.likes}</Text>
          <Text testID={`${testID}-renders`} style={styles.renders}>
            {`renders ${renders}`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/** The part of each side the Profiler measures: list render count + the list itself. */
function ListShell({ listRenders, testID, children }: { listRenders: number; testID: string; children: React.ReactNode }) {
  return (
    <>
      <Text testID={`${testID}-list-renders`} style={styles.listRenders}>
        {`list renders: ${listRenders}`}
      </Text>
      {children}
    </>
  );
}

/** How much re-rendering the last ❤️ tap caused on this side. */
function LastTapStats({ testID }: { testID: string }) {
  const tracker = useRenderTracker();
  const { reRendersSinceInteraction } = useRenderStats();
  const hasTapped = tracker.getInteractionCount() > 0;
  return (
    <Text testID={`${testID}-last-tap`} style={[styles.lastTap, reRendersSinceInteraction > 1 && styles.bad]}>
      {hasTapped ? `last tap: ${reRendersSinceInteraction} ${reRendersSinceInteraction === 1 ? "re-render" : "re-renders"}` : "tap a ❤️"}
    </Text>
  );
}

function Side({ title, testID, tracker, children }: { title: string; testID: string; tracker: RenderTracker; children: React.ReactNode }) {
  return (
    <RenderTrackerProvider tracker={tracker}>
      <View style={styles.column}>
        <Text style={styles.columnTitle}>{title}</Text>
        {/* Outside <Measured>: its own updates must not count as list work. */}
        <LastTapStats testID={testID} />
        <Measured id={testID}>{children}</Measured>
      </View>
    </RenderTrackerProvider>
  );
}

// ---------------------------------------------------------------------------

function Perf21Screen() {
  const [store] = useState(createChatStore);
  const [readsAllTracker] = useState(createRenderTracker);
  const [readsOwnTracker] = useState(createRenderTracker);

  // This screen never re-renders (it reads nothing from the store), so `like` stays the same function.
  const like = (messageID: string) => {
    readsAllTracker.startInteraction();
    readsOwnTracker.startInteraction();
    store.dispatch(likeMessage(messageID));
  };

  return (
    <Provider store={store}>
      <View style={styles.screen}>
        <View style={styles.steps}>
          <Text>Both lists show the same chat. Tap any message to ❤️ it (both lists update).</Text>
          <Text style={styles.stepsBold}>Which rows flash? Only the one you liked should.</Text>
        </View>
        <View style={styles.columns}>
          <Side title="❌ List reads all" testID="reads-all" tracker={readsAllTracker}>
            <ListPassingMessages onLike={like} />
          </Side>
          <Side title="✅ Rows read own" testID="reads-own" tracker={readsOwnTracker}>
            <ListPassingIDs onLike={like} />
          </Side>
        </View>
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 12, gap: 10, backgroundColor: "#fff" },
  steps: { gap: 2, padding: 10, borderRadius: 8, backgroundColor: "#EEF3FF" },
  stepsBold: { fontWeight: "700" },
  columns: { flex: 1, flexDirection: "row", gap: 8 },
  column: { flex: 1, gap: 4 },
  columnTitle: { fontSize: 15, fontWeight: "800" },
  listRenders: { fontSize: 12, fontFamily: "SpaceMono" },
  lastTap: { fontSize: 14, fontWeight: "800", color: "#1E9E5A" },
  bad: { color: "#D93F3F" },
  rowPress: { marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", padding: 6, borderRadius: 6, backgroundColor: "#F5F6F8", overflow: "hidden" },
  flash: { backgroundColor: "#FF6B6B" },
  rowText: { flex: 1 },
  author: { fontSize: 12, fontWeight: "700" },
  text: { fontSize: 11, color: "#555" },
  rowSide: { alignItems: "flex-end", minWidth: 52 },
  likes: { fontSize: 12 },
  // One plain string, no custom font: Android clipped "r:1" when it was split into pieces.
  renders: { fontSize: 10, color: "#888" },
});

export default Perf21Screen;

/**
 * PERF-21 demo store: a chat with 10 messages, kept the normalized way
 * (an ordered list of ids + a byID map). Liking a message changes only that
 * message, but it does give `byID` a new reference, like any Redux update.
 */
import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";

type Message = { id: string; author: string; text: string; likes: number };

const SEED: [string, string][] = [
  ["Asha", "Morning everyone ☀️"],
  ["Bilal", "Standup in 10?"],
  ["Chen", "Running 5 min late"],
  ["Dev", "PR is up for review"],
  ["Ema", "Lunch at 1?"],
  ["Farah", "Deploy went fine 🎉"],
  ["Gita", "Who has the keys?"],
  ["Hari", "Coffee machine fixed"],
  ["Ivy", "Can someone review mine?"],
  ["Jay", "See you tomorrow 👋"],
];

function initialState() {
  const byID: Record<string, Message> = {};
  const ids = SEED.map(([author, text], index) => {
    const id = `m${index + 1}`;
    byID[id] = { id, author, text, likes: 0 };
    return id;
  });
  return { ids, byID };
}

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    likeMessage(state, action: PayloadAction<string>) {
      state.byID[action.payload].likes += 1;
    },
  },
});

function createChatStore() {
  return configureStore({ reducer: { messages: messagesSlice.reducer } });
}

type ChatState = ReturnType<ReturnType<typeof createChatStore>["getState"]>;

const { likeMessage } = messagesSlice.actions;

export { createChatStore, likeMessage };
export type { ChatState, Message };

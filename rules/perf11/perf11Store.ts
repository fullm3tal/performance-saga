/**
 * A tiny Redux store for the PERF-11 demo: three customers and one unrelated
 * setting, so we can see which components re-render after each action.
 */
import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";

type Customer = { id: string; name: string; isVip: boolean };

const customersSlice = createSlice({
  name: "customers",
  initialState: {
    byID: {
      alice: { id: "alice", name: "Alice", isVip: true },
      bob: { id: "bob", name: "Bob", isVip: false },
      carol: { id: "carol", name: "Carol", isVip: false },
    } as Record<string, Customer>,
  },
  reducers: {
    renameCustomer(state, action: PayloadAction<{ id: string; name: string }>) {
      state.byID[action.payload.id].name = action.payload.name;
    },
  },
});

const settingsSlice = createSlice({
  name: "settings",
  initialState: { isDarkMode: false },
  reducers: {
    toggleDarkMode(state) {
      state.isDarkMode = !state.isDarkMode;
    },
  },
});

function createPerf11Store() {
  return configureStore({
    reducer: {
      customers: customersSlice.reducer,
      settings: settingsSlice.reducer,
    },
  });
}

type Perf11Store = ReturnType<typeof createPerf11Store>;
type RootState = ReturnType<Perf11Store["getState"]>;

const { renameCustomer } = customersSlice.actions;
const { toggleDarkMode } = settingsSlice.actions;

export { createPerf11Store, renameCustomer, toggleDarkMode };
export type { RootState };

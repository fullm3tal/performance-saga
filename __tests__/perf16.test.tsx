/**
 * PERF-16: one-time setup in a plain useEffect runs again whenever the effect
 * re-runs (Strict Mode's deliberate double mount in development, or a
 * remount). A module-level `didInit` flag makes it run exactly once.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import Perf16Screen, { resetDemo } from "@/rules/perf16/Perf16Screen";

function count(testID: string) {
  return Number(screen.getByTestId(testID).props.children);
}

/** Order screens opened by the most recent notification tap, per side. */
function ordersOpened() {
  return screen.getAllByText("📦 opened Order #42 screen").length;
}

describe("PERF-16: guard one-time setup", () => {
  // The SDKs live for the whole app run, so start each test as a fresh launch.
  beforeEach(() => {
    resetDemo();
    render(<Perf16Screen />);
  });

  it("on first launch, Strict Mode runs the ❌ setup twice; the ✅ guard keeps it to once", () => {
    expect(count("unguarded-sessions")).toBe(2);
    expect(count("unguarded-handlers")).toBe(2);
    expect(count("guarded-sessions")).toBe(1);
    expect(count("guarded-handlers")).toBe(1);
  });

  it("one notification tap opens the order screen twice on ❌, once on ✅", () => {
    fireEvent.press(screen.getByTestId("tap-notification"));
    // 2 from the ❌ side + 1 from the ✅ side.
    expect(ordersOpened()).toBe(3);
  });

  it("every remount adds more ❌ sessions and handlers; ✅ stays at 1", () => {
    fireEvent.press(screen.getByTestId("remount"));
    fireEvent.press(screen.getByTestId("remount"));
    expect(count("unguarded-sessions")).toBe(6);
    expect(count("unguarded-handlers")).toBe(6);
    expect(count("guarded-sessions")).toBe(1);
    expect(count("guarded-handlers")).toBe(1);
  });

  it("Reset behaves like a fresh app launch", () => {
    fireEvent.press(screen.getByTestId("remount"));
    fireEvent.press(screen.getByTestId("reset"));
    expect(count("unguarded-handlers")).toBe(2);
    expect(count("guarded-handlers")).toBe(1);
  });

  it("leaving the screen and coming back: ❌ sets up again, ✅ remembers it already did", () => {
    screen.unmount();
    render(<Perf16Screen />);
    expect(count("unguarded-handlers")).toBe(4);
    expect(count("guarded-handlers")).toBe(1);
  });
});

/**
 * PERF-14: reading an external store with useEffect + useState renders a
 * wrong default first and then renders again; useSyncExternalStore renders
 * the real value the first time. Both keep up with later changes.
 * Covered twice: a cart badge, and a checkout screen that needs to know if it's online.
 */
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react-native";
import Perf14Screen from "@/rules/perf14/Perf14Screen";
import { useCartCount, useCartCountWithEffect } from "@/rules/perf14/cartHooks";
import { addNextItem, getCount, resetCart } from "@/rules/perf14/cartStore";
import { useIsOnline, useIsOnlineWithEffect } from "@/rules/perf14/networkHooks";
import { setIsOnline } from "@/rules/perf14/networkStore";

/** Records every value a hook returned, one entry per render. */
function recordRenders(useHook: () => number) {
  const values: number[] = [];
  const result = renderHook(() => {
    const value = useHook();
    values.push(value);
    return value;
  });
  return { values, ...result };
}

describe("PERF-14: useSyncExternalStore for external stores", () => {
  beforeEach(() => resetCart());

  it("❌ effect version: first render shows the wrong default, then a second render fixes it", () => {
    const { values } = recordRenders(useCartCountWithEffect);
    expect(getCount()).toBe(3);
    expect(values).toEqual([0, 3]);
  });

  it("✅ useSyncExternalStore: one render, with the right value from the start", () => {
    const { values } = recordRenders(useCartCount);
    expect(values).toEqual([3]);
  });

  it("both keep up with later changes, one render per change", () => {
    const effect = recordRenders(useCartCountWithEffect);
    const sync = recordRenders(useCartCount);
    act(() => addNextItem());
    act(() => addNextItem());
    expect(effect.result.current).toBe(5);
    expect(sync.result.current).toBe(5);
    expect(effect.values).toEqual([0, 3, 4, 5]);
    expect(sync.values).toEqual([3, 4, 5]);
  });

  it("the badges show the wrong first render only on the ❌ side", () => {
    render(<Perf14Screen />);
    fireEvent.press(screen.getByTestId("mount-badges"));
    expect(screen.getByTestId("effect-badge-renders")).toHaveTextContent("renders: 2");
    expect(screen.getByTestId("sync-badge-renders")).toHaveTextContent("renders: 1");
    expect(screen.getByText(/render #1 → showed 0 ⚠️ wrong \(cart has 3\)/)).toBeTruthy();
    expect(screen.getByTestId("effect-badge-count")).toHaveTextContent("🛒 3");
    expect(screen.getByTestId("sync-badge-count")).toHaveTextContent("🛒 3");
  });

  describe("checkout: am I online?", () => {
    beforeEach(() => setIsOnline(true));

    it("offline at mount: ❌ first says online, then corrects itself; ✅ is right first time", () => {
      setIsOnline(false);
      const effect: boolean[] = [];
      const sync: boolean[] = [];
      renderHook(() => effect.push(useIsOnlineWithEffect()));
      renderHook(() => sync.push(useIsOnline()));
      expect(effect).toEqual([true, false]);
      expect(sync).toEqual([false]);
    });

    it("online at mount: the guess happens to be right, so both render once", () => {
      const effect: boolean[] = [];
      const sync: boolean[] = [];
      renderHook(() => effect.push(useIsOnlineWithEffect()));
      renderHook(() => sync.push(useIsOnline()));
      expect(effect).toEqual([true]);
      expect(sync).toEqual([true]);
    });

    it("on screen: with Wi-Fi off, only the ❌ checkout's first render showed Pay enabled", () => {
      render(<Perf14Screen />);
      fireEvent.press(screen.getByTestId("toggle-wifi"));
      fireEvent.press(screen.getByTestId("open-checkout"));

      expect(screen.getByTestId("effect-checkout-renders")).toHaveTextContent("renders: 2");
      expect(screen.getByText(/render #1 → 🟢 Online, Pay ON ⚠️ wrong \(phone is offline\)/)).toBeTruthy();
      expect(screen.getByTestId("sync-checkout-renders")).toHaveTextContent("renders: 1");

      // After settling, both show the truth.
      expect(screen.getByTestId("effect-checkout-banner")).toHaveTextContent("🔴 Offline");
      expect(screen.getByTestId("sync-checkout-banner")).toHaveTextContent("🔴 Offline");
    });

    it("both follow Wi-Fi changes while the checkout is open", () => {
      render(<Perf14Screen />);
      fireEvent.press(screen.getByTestId("open-checkout"));
      fireEvent.press(screen.getByTestId("toggle-wifi"));
      expect(screen.getByTestId("effect-checkout-banner")).toHaveTextContent("🔴 Offline");
      expect(screen.getByTestId("sync-checkout-banner")).toHaveTextContent("🔴 Offline");
      fireEvent.press(screen.getByTestId("toggle-wifi"));
      expect(screen.getByTestId("effect-checkout-banner")).toHaveTextContent("🟢 Online");
      expect(screen.getByTestId("sync-checkout-banner")).toHaveTextContent("🟢 Online");
    });
  });
});

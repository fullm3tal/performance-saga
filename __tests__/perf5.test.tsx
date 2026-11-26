/**
 * PERF-5: both comparators skip unchanged rows and re-render the changed one,
 * but the deep one checks hundreds of thousands of fields to get there.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import Perf5Screen, {
  compareStats,
  resetCompareStats,
} from "@/rules/perf5/Perf5Screen";

type Mode = "deep" | "shallow";

/** Renders the screen in `mode`, presses `buttonId`, and returns what that update cost. */
function measurePress(mode: Mode, buttonId: string) {
  render(<Perf5Screen />);
  fireEvent.press(screen.getByTestId(`mode-${mode}`));
  resetCompareStats();
  fireEvent.press(screen.getByTestId(buttonId));
  const result = { ...compareStats };
  screen.unmount();
  return result;
}

describe("PERF-5: shallow over deep comparisons", () => {
  it("refetching identical data re-renders no rows with either comparator", () => {
    expect(measurePress("deep", "refetch").rowRenders).toBe(0);
    expect(measurePress("shallow", "refetch").rowRenders).toBe(0);
  });

  it("a real change re-renders exactly that row with either comparator", () => {
    expect(measurePress("deep", "mark-paid").rowRenders).toBe(1);
    expect(measurePress("shallow", "mark-paid").rowRenders).toBe(1);  });

  it("the deep comparator does far more work for the same outcome", () => {
    const deep = measurePress("deep", "refetch");
    const shallow = measurePress("shallow", "refetch");

    console.table({
      "fields compared": {
        deep: deep.fieldsCompared,
        shallow: shallow.fieldsCompared,
      },
      "ms comparing": { deep: deep.ms.toFixed(1), shallow: shallow.ms.toFixed(1) },
    });

    // 100 rows × 3 fields.
    expect(shallow.fieldsCompared).toBe(300);
    // 100 loans × 2,000 payments × 4 checks each (object + 3 fields), plus the loan fields.
    expect(deep.fieldsCompared).toBeGreaterThan(800_000);
    expect(deep.ms).toBeGreaterThan(shallow.ms * 10);
  });
});

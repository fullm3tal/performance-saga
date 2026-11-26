/**
 * PERF-2: both search versions return the same results, but for short queries
 * only the "check late" version does the expensive work.
 */
import { searchCheckEarly, searchCheckLate } from "@/rules/perf2/Perf2Screen";

/** Counts how many times `toLowerCase` runs while `run` executes: a direct measure of work done. */
function countLowerCaseCalls(run: () => void) {
  const spy = jest.spyOn(String.prototype, "toLowerCase");
  run();
  const calls = spy.mock.calls.length;
  spy.mockRestore();
  return calls;
}

function averageMs(run: () => void, times = 20) {
  const start = performance.now();
  for (let i = 0; i < times; i += 1) {
    run();
  }
  return (performance.now() - start) / times;
}

describe("PERF-2: return early before expensive work", () => {
  it.each(["", "r", "red", "Blue Lamp"])(
    "both versions return the same results for %p",
    (query) => {
      expect(searchCheckEarly(query)).toEqual(searchCheckLate(query));
    },
  );

  it("for a too-short query, only the late check does any work", () => {
    expect(countLowerCaseCalls(() => searchCheckLate("r"))).toBe(50_000);
    expect(countLowerCaseCalls(() => searchCheckEarly("r"))).toBe(0);
  });

  it("for a valid query, both versions do the same work", () => {
    const late = countLowerCaseCalls(() => searchCheckLate("red"));
    const early = countLowerCaseCalls(() => searchCheckEarly("red"));
    expect(early).toBe(late);
  });

  it("is much faster on short queries", () => {
    const lateMs = averageMs(() => searchCheckLate(""));
    const earlyMs = averageMs(() => searchCheckEarly(""));

    console.table({
      "avg ms for an empty query": {
        "check late": lateMs.toFixed(3),
        "check early": earlyMs.toFixed(3),
      },
    });

    expect(earlyMs).toBeLessThan(lateMs / 10);
  });
});

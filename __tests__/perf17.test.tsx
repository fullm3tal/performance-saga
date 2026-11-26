/**
 * PERF-17: both versions give the same answer. The ❌ one copies every id into
 * a new Set on each call; the ✅ one looks the id up in the object directly.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import Perf17Screen from "@/rules/perf17/Perf17Screen";
import {
  ASHA,
  FAVOURITE_COUNT,
  FAVOURITES_BY_ID,
  isFavouriteDirect,
  isFavouriteViaSet,
  lookupStats,
  resetLookupStats,
} from "@/rules/perf17/favourites";

function averageMs(run: () => void, times = 20) {
  const start = performance.now();
  for (let i = 0; i < times; i += 1) {
    run();
  }
  return (performance.now() - start) / times;
}

function numberIn(testID: string) {
  return Number(String(screen.getByTestId(testID).props.children).replace(/,/g, ""));
}

describe("PERF-17: avoid intermediate lookup layers", () => {
  beforeEach(() => resetLookupStats());

  it.each([ASHA.id, "contact-19999", "not-a-contact"])("both versions give the same answer for %p", (id) => {
    expect(isFavouriteViaSet(FAVOURITES_BY_ID, id)).toBe(isFavouriteDirect(FAVOURITES_BY_ID, id));
  });

  it("the Set version copies every id on every call; the direct version copies none", () => {
    isFavouriteViaSet(FAVOURITES_BY_ID, ASHA.id);
    isFavouriteViaSet(FAVOURITES_BY_ID, ASHA.id);
    isFavouriteDirect(FAVOURITES_BY_ID, ASHA.id);
    isFavouriteDirect(FAVOURITES_BY_ID, ASHA.id);
    expect(lookupStats.withSet.idsCopied).toBe(2 * FAVOURITE_COUNT);
    expect(lookupStats.direct.idsCopied).toBe(0);
  });

  it("the direct lookup is far faster", () => {
    const setMs = averageMs(() => isFavouriteViaSet(FAVOURITES_BY_ID, ASHA.id));
    const directMs = averageMs(() => isFavouriteDirect(FAVOURITES_BY_ID, ASHA.id));

    console.table({
      [`avg ms per check, ${FAVOURITE_COUNT.toLocaleString()} favourites`]: {
        "build Set": setMs.toFixed(3),
        direct: directMs.toFixed(4),
      },
    });

    expect(directMs).toBeLessThan(setMs / 50);
  });

  it("on screen: each typed letter copies 20,000 more ids on ❌ and none on ✅", () => {
    render(<Perf17Screen />);
    const input = screen.getByTestId("note");
    fireEvent.changeText(input, "h");
    fireEvent.changeText(input, "hi");
    fireEvent.changeText(input, "hi!");

    // First render + 3 letters = 4 renders, each one checking once.
    expect(numberIn("withSet-renders")).toBe(4);
    expect(numberIn("withSet-copied")).toBe(4 * FAVOURITE_COUNT);
    expect(numberIn("direct-renders")).toBe(4);
    expect(numberIn("direct-copied")).toBe(0);
    expect(screen.getAllByText("⭐ Asha is a favourite")).toHaveLength(2);
  });
});

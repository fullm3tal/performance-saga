/**
 * PERF-11: after each Redux action, check which of the four cards re-rendered.
 * Narrow selectors (one record, or a boolean) only re-render when their value
 * changes; broad or new-array selectors re-render on unrelated actions too.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import Perf11Screen from "@/rules/perf11/Perf11Screen";

const CARDS = ["collection", "by-id", "array", "boolean"] as const;
type Card = (typeof CARDS)[number];

function rendersOf(card: Card) {
  const text = screen.getByTestId(`${card}-renders`).props.children.join("");
  return Number(text.replace(/\D/g, ""));
}

/** Presses `button` and returns how many extra renders each card had. */
function rerendersAfter(button: string): Record<Card, number> {
  const before = Object.fromEntries(CARDS.map((card) => [card, rendersOf(card)]));
  fireEvent.press(screen.getByTestId(button));
  return Object.fromEntries(
    CARDS.map((card) => [card, rendersOf(card) - before[card]]),
  ) as Record<Card, number>;
}

describe("PERF-11: optimize data selection", () => {
  // The ❌ new-array selector intentionally returns a new reference, which
  // react-redux warns about in development. Silence that expected warning.
  beforeEach(() => jest.spyOn(console, "warn").mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it("renaming Alice: both name cards update, only the array card re-renders for VIPs", () => {
    render(<Perf11Screen />);
    expect(rerendersAfter("rename-alice")).toEqual({
      collection: 1,
      "by-id": 1,
      array: 1,
      boolean: 0,
    });
  });

  it("renaming Bob: only the broad selectors re-render", () => {
    render(<Perf11Screen />);
    expect(rerendersAfter("rename-bob")).toEqual({
      collection: 1,
      "by-id": 0,
      array: 1,
      boolean: 0,
    });
  });

  it("an unrelated action: only the new-array selector re-renders", () => {
    render(<Perf11Screen />);
    expect(rerendersAfter("unrelated")).toEqual({
      collection: 0,
      "by-id": 0,
      array: 1,
      boolean: 0,
    });
  });
});

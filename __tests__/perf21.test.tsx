/**
 * PERF-21: liking one message. When the list reads every message and passes
 * them down, the list and all 10 rows re-render. When rows read their own
 * message by id, only the liked row re-renders and the list doesn't.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import Perf21Screen from "@/rules/perf21/Perf21Screen";

const MESSAGE_IDS = Array.from({ length: 10 }, (_, index) => `m${index + 1}`);

function numberIn(testID: string) {
  return Number(String(screen.getByTestId(testID).props.children).replace(/\D/g, ""));
}

function rendersOf(testID: string) {
  return numberIn(`${testID}-renders`);
}

function listRendersOf(side: "reads-all" | "reads-own") {
  return numberIn(`${side}-list-renders`);
}

function rowRenders(side: "reads-all" | "reads-own") {
  return Object.fromEntries(MESSAGE_IDS.map((id) => [id, rendersOf(`${side}-${id}`)]));
}

describe("PERF-21: list rows read their own data", () => {
  it("on mount every row renders once on both sides", () => {
    render(<Perf21Screen />);
    expect(Object.values(rowRenders("reads-all"))).toEqual(Array(10).fill(1));
    expect(Object.values(rowRenders("reads-own"))).toEqual(Array(10).fill(1));
  });

  it("liking message 3: ❌ re-renders the list and all 10 rows; ✅ only row 3", () => {
    render(<Perf21Screen />);
    fireEvent.press(screen.getByTestId("reads-own-m3"));

    expect(listRendersOf("reads-all")).toBe(2);
    expect(Object.values(rowRenders("reads-all"))).toEqual(Array(10).fill(2));

    expect(listRendersOf("reads-own")).toBe(1);
    const own = rowRenders("reads-own");
    expect(own.m3).toBe(2);
    expect(MESSAGE_IDS.filter((id) => id !== "m3").every((id) => own[id] === 1)).toBe(true);
  });

  it("the 'last tap' counters show 11 re-renders vs 1", () => {
    render(<Perf21Screen />);
    fireEvent.press(screen.getByTestId("reads-all-m7"));
    // ❌: the list + 10 rows. ✅: just row 7.
    expect(screen.getByTestId("reads-all-last-tap")).toHaveTextContent("last tap: 11 re-renders");
    expect(screen.getByTestId("reads-own-last-tap")).toHaveTextContent("last tap: 1 re-render");
  });

  it("both lists show the same, correct like counts", () => {
    render(<Perf21Screen />);
    fireEvent.press(screen.getByTestId("reads-all-m1"));
    fireEvent.press(screen.getByTestId("reads-own-m1"));
    expect(screen.getAllByText("❤️ 2")).toHaveLength(2);
  });
});

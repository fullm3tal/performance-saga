/**
 * PERF-9: a chain of Effects re-renders once per link; calculating in render
 * reaches the same total in one render.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import Perf9Screen from "@/rules/perf9/Perf9Screen";

function rendersOf(testID: "chain-renders" | "calculated-renders") {
  const text = screen.getByTestId(testID).props.children.join("");
  return Number(text.replace("renders: ", ""));
}

describe("PERF-9: no useEffect chains", () => {
  it("each change costs 4 renders through the chain and 1 when calculated", () => {
    render(<Perf9Screen />);
    const before = {
      chain: rendersOf("chain-renders"),
      calculated: rendersOf("calculated-renders"),
    };

    fireEvent.press(screen.getByTestId("add-one"));

    // quantity → subtotal → tax → total: one render per link in the chain.
    expect(rendersOf("chain-renders") - before.chain).toBe(4);
    expect(rendersOf("calculated-renders") - before.calculated).toBe(1);

    // Same answer in the end: 2 × $10 + 20% tax.
    expect(screen.getAllByText("Total: $24")).toHaveLength(2);
  });
});

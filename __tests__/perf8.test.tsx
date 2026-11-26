/**
 * PERF-8: handling the tap in useEffect costs an extra render per tap (and
 * needs a flag reset to not drop repeat taps); handling it in onPress does not.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import Perf8Screen from "@/rules/perf8/Perf8Screen";

function tapThreeTimes(testID: string) {
  for (let i = 0; i < 3; i += 1) {
    fireEvent.press(screen.getByTestId(testID));
  }
}

describe("PERF-8: handle events in handlers", () => {
  it("useEffect version: every tap counts only because the flag is reset, at 2 renders per tap", () => {
    render(<Perf8Screen />);
    tapThreeTimes("effect-buy");

    expect(screen.getByTestId("effect-purchases")).toHaveTextContent("purchases: 3");
    // Mount + per tap: flag-on render, then purchase + flag-off batched into one render.
    expect(screen.getByTestId("effect-renders")).toHaveTextContent("renders: 7");
  });

  it("onPress version: 3 purchases from 3 taps, one render each", () => {
    render(<Perf8Screen />);
    tapThreeTimes("handler-buy");

    expect(screen.getByTestId("handler-purchases")).toHaveTextContent("purchases: 3");
    // Mount + 1 render per tap.
    expect(screen.getByTestId("handler-renders")).toHaveTextContent("renders: 4");
  });
});

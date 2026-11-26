/**
 * PERF-8: handling the tap in useEffect costs an extra render and silently
 * drops repeat taps; handling it in onPress does neither.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import Perf8Screen from "@/rules/perf8/Perf8Screen";

function tapThreeTimes(testID: string) {
  for (let i = 0; i < 3; i += 1) {
    fireEvent.press(screen.getByTestId(testID));
  }
}

describe("PERF-8: handle events in handlers", () => {
  it("useEffect version: 1 purchase from 3 taps, with an extra render", () => {
    render(<Perf8Screen />);
    tapThreeTimes("effect-buy");

    expect(screen.getByTestId("effect-purchases")).toHaveTextContent("purchases: 1");
    // Mount + flag render + purchase render. Taps 2 and 3 change nothing.
    expect(screen.getByTestId("effect-renders")).toHaveTextContent("renders: 3");
  });

  it("onPress version: 3 purchases from 3 taps, one render each", () => {
    render(<Perf8Screen />);
    tapThreeTimes("handler-buy");

    expect(screen.getByTestId("handler-purchases")).toHaveTextContent("purchases: 3");
    // Mount + 1 render per tap.
    expect(screen.getByTestId("handler-renders")).toHaveTextContent("renders: 4");
  });
});

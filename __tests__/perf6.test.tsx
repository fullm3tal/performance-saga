/**
 * PERF-6: copying a derived value into state with useEffect costs two renders
 * per change; calculating it during render costs one.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import Perf6Screen from "@/rules/perf6/Perf6Screen";

describe("PERF-6: derive state from props", () => {
  it("renders twice per change with useEffect and once when calculated", () => {
    render(<Perf6Screen />);

    // Mount: the Effect version needs a second render to show the right total.
    expect(screen.getByTestId("effect-renders")).toHaveTextContent("renders: 2");
    expect(screen.getByTestId("derived-renders")).toHaveTextContent("renders: 1");

    fireEvent.press(screen.getByTestId("add-one"));
    fireEvent.press(screen.getByTestId("add-one"));
    fireEvent.press(screen.getByTestId("add-one"));

    // 3 presses: +6 renders vs +3 renders.
    expect(screen.getByTestId("effect-renders")).toHaveTextContent("renders: 8");
    expect(screen.getByTestId("derived-renders")).toHaveTextContent("renders: 4");

    // Both end up showing the same, correct total.
    expect(screen.getAllByText("Total: $40")).toHaveLength(2);
  });
});

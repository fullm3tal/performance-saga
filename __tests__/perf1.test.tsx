/**
 * PERF-1: after tapping one row, count how many rows rendered again.
 * With the spread every mounted row re-renders; without it only the tapped row does.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import Perf1Screen from "@/rules/perf1/Perf1Screen";

function countRowsThatReRendered() {
  return screen.queryAllByText(/renders: [2-9]/).length;
}

describe("PERF-1: no spread in renderItem", () => {
  it("with spread, tapping one row re-renders every row", () => {
    render(<Perf1Screen />);
    const mountedRows = screen.getAllByText(/renders:/).length;

    fireEvent.press(screen.getByTestId("row-3"));

    expect(mountedRows).toBeGreaterThan(1);
    expect(countRowsThatReRendered()).toBe(mountedRows);
  });

  it("without spread, tapping one row re-renders only that row", () => {
    render(<Perf1Screen />);
    fireEvent.press(screen.getByTestId("mode-direct"));

    fireEvent.press(screen.getByTestId("row-3"));
    expect(countRowsThatReRendered()).toBe(1);

    // Selecting another row re-renders the old and the new selection: 2 rows total.
    fireEvent.press(screen.getByTestId("row-5"));
    expect(countRowsThatReRendered()).toBe(2);
  });
});

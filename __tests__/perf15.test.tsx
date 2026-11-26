/**
 * PERF-15: tap Alice (2.5s reply) then Bob (0.5s reply). Bob's reply arrives
 * first, Alice's arrives later. Without cleanup, Alice's late reply overwrites
 * Bob; with an ignore flag in the cleanup, it's thrown away.
 */
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import Perf15Screen from "@/rules/perf15/Perf15Screen";

/** Advances fake time and lets resolved promises run their .then callbacks. */
async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

function nameShownBy(card: "no-cleanup" | "with-cleanup") {
  return screen.getByTestId(`${card}-name`);
}

describe("PERF-15: clean up async effects", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("one tap, no race: both cards show the person you picked", async () => {
    render(<Perf15Screen />);
    fireEvent.press(screen.getByTestId("pick-Chen"));
    await advance(1200);
    expect(nameShownBy("no-cleanup")).toHaveTextContent(/Chen/);
    expect(nameShownBy("with-cleanup")).toHaveTextContent(/Chen/);
  });

  it("Alice then Bob: at first both show Bob", async () => {
    render(<Perf15Screen />);
    fireEvent.press(screen.getByTestId("pick-Alice"));
    fireEvent.press(screen.getByTestId("pick-Bob"));
    await advance(600);
    expect(nameShownBy("no-cleanup")).toHaveTextContent(/Bob/);
    expect(nameShownBy("with-cleanup")).toHaveTextContent(/Bob/);
  });

  it("…then Alice's late reply overwrites Bob only on the ❌ card", async () => {
    render(<Perf15Screen />);
    fireEvent.press(screen.getByTestId("pick-Alice"));
    fireEvent.press(screen.getByTestId("pick-Bob"));
    await advance(3000);

    expect(screen.getByTestId("taps")).toHaveTextContent("You tapped: Alice → Bob");
    expect(nameShownBy("no-cleanup")).toHaveTextContent(/Alice/);
    expect(screen.getByTestId("no-cleanup-status")).toHaveTextContent(/You picked Bob/);

    expect(nameShownBy("with-cleanup")).toHaveTextContent(/Bob/);
    expect(screen.getByTestId("with-cleanup-status")).toHaveTextContent(/Matches who you picked/);
    expect(screen.getByText("📨 Alice's reply → ignored (old)")).toBeTruthy();
  });

  it("the ⚡ button makes the same race happen", async () => {
    render(<Perf15Screen />);
    fireEvent.press(screen.getByTestId("race"));
    // Let the auto "Bob" tap render (and its cleanup run) before Alice's reply lands,
    // the same as on a real phone where React renders within milliseconds.
    await advance(200);
    await advance(2800);
    expect(nameShownBy("no-cleanup")).toHaveTextContent(/Alice/);
    expect(nameShownBy("with-cleanup")).toHaveTextContent(/Bob/);
  });
});

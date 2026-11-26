/**
 * PERF-7: both versions clear the draft when the contact changes, but the
 * useEffect reset takes two renders and the key reset takes one.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import Perf7Screen, { renderCounts } from "@/rules/perf7/Perf7Screen";

describe("PERF-7: reset via key prop", () => {
  it("clears the draft in both versions, with half the renders using key", () => {
    render(<Perf7Screen />);
    fireEvent.changeText(screen.getByTestId("effect-input"), "Hi Alice");
    fireEvent.changeText(screen.getByTestId("key-input"), "Hi Alice");

    const before = { ...renderCounts };
    fireEvent.press(screen.getByTestId("contact-Bob"));

    // Both drafts are cleared for Bob.
    expect(screen.getByTestId("effect-input").props.value).toBe("");
    expect(screen.getByTestId("key-input").props.value).toBe("");

    // Switching cost: 2 renders with the Effect, 1 with key.
    expect(renderCounts.effect - before.effect).toBe(2);
    expect(renderCounts.key - before.key).toBe(1);
  });
});

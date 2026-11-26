/**
 * PERF-10: reporting child state up with useEffect makes the child render
 * twice per keystroke; lifting the state to the parent renders it once.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import Perf10Screen from "@/rules/perf10/Perf10Screen";

function rendersOf(testID: string) {
  const text = screen.getByTestId(testID).props.children.join("");
  return Number(text.replace(/\D/g, ""));
}

function typeWord(inputTestID: string, word: string) {
  for (let i = 1; i <= word.length; i += 1) {
    fireEvent.changeText(screen.getByTestId(inputTestID), word.slice(0, i));
  }
}

describe("PERF-10: no useEffect for parent communication", () => {
  it("useEffect version: child renders twice per keystroke", () => {
    render(<Perf10Screen />);
    const before = {
      parent: rendersOf("effect-parent-renders"),
      child: rendersOf("effect-child-renders"),
    };

    typeWord("effect-input", "cat");

    expect(rendersOf("effect-parent-renders") - before.parent).toBe(3);
    expect(rendersOf("effect-child-renders") - before.child).toBe(6);
    expect(screen.getAllByText('Parent sees: "cat"')).toHaveLength(1);
  });

  it("lifted version: parent and child render once per keystroke", () => {
    render(<Perf10Screen />);
    const before = {
      parent: rendersOf("lifted-parent-renders"),
      child: rendersOf("lifted-child-renders"),
    };

    typeWord("lifted-input", "cat");

    expect(rendersOf("lifted-parent-renders") - before.parent).toBe(3);
    expect(rendersOf("lifted-child-renders") - before.child).toBe(3);
    expect(screen.getAllByText('Parent sees: "cat"')).toHaveLength(1);
  });
});

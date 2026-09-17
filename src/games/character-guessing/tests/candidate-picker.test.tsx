import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CandidatePicker } from "../components/candidate-picker";
import { nbaMvpsGame } from "../themes/nba-mvps";

// Exercise the real input handlers with explicit view states, without a DOM dependency.
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useId: () => "picker-test",
  useRef: () => ({ current: null }),
  useState: vi.fn(),
}));
beforeEach(() => vi.resetAllMocks());
const { theme, candidatePicker: config } = nbaMvpsGame;
const options = theme.characters.map((character) => ({ value: theme.name(character), label: config!.label(character), detail: config!.detail(character), searchText: config!.searchText(character) }));

function view(value = "lebron", open = true, active = -1) {
  const setOpen = vi.fn(), setActive = vi.fn(), onChange = vi.fn(), focus = vi.fn();
  vi.mocked(useState).mockReturnValueOnce([open, setOpen]).mockReturnValueOnce([active, setActive]);
  const element = CandidatePicker({ options, value, onChange, inputRef: { current: { focus } as unknown as HTMLInputElement }, placeholder: "Search", invalid: false });
  const input = element.props.children[0];
  const list = element.props.children[1];
  function key(key: string, isComposing = false) {
    const preventDefault = vi.fn();
    input.props.onKeyDown({ key, preventDefault, nativeEvent: { isComposing } });
    return preventDefault;
  }
  return { element, input, list, setOpen, setActive, onChange, focus, key };
}

describe("candidate picker controls", () => {
  it("offers four LeBron options with canonical keys and at most eight broad-search choices", () => {
    const picker = view();
    expect(picker.list.props.children).toHaveLength(4);
    expect(new Set(picker.list.props.children.map((item: { key: string }) => item.key)).size).toBe(4);
    expect(picker.input.props["aria-controls"]).toBe(picker.list.props.id);
    expect(view("a").list.props.children).toHaveLength(8);
  });
  it("supports Arrow Down/Up, active descendant and Enter selection without submitting", () => {
    const first = view("lebron", false);
    expect(first.key("ArrowDown")).toHaveBeenCalled();
    expect(first.setOpen).toHaveBeenCalledWith(true);
    expect(first.setActive).toHaveBeenCalledWith(0);
    const up = view("lebron", true, 0);
    up.key("ArrowUp");
    expect(up.setActive).toHaveBeenCalledWith(3);
    const last = view("lebron", true, 3);
    expect(last.input.props["aria-activedescendant"]).toBe("picker-test-3");
    expect(last.list.props.children[3].props.children.props["aria-selected"]).toBe(true);
    expect(last.key("Enter")).toHaveBeenCalled();
    expect(last.onChange).toHaveBeenCalledWith("LeBron James — 2012-13");
    expect(last.setOpen).toHaveBeenCalledWith(false);
    expect(last.focus).toHaveBeenCalled();
  });
  it("supports clicking a result, Escape, input edits and normal Tab behavior", () => {
    const picker = view("lebron 12-13");
    picker.list.props.children[0].props.children.props.onClick();
    expect(picker.onChange).toHaveBeenCalledWith("LeBron James — 2012-13");
    const editing = view();
    editing.input.props.onChange({ target: { value: "jordan" } });
    expect(editing.onChange).toHaveBeenCalledWith("jordan");
    expect(editing.setActive).toHaveBeenCalledWith(-1);
    expect(editing.key("Escape")).toHaveBeenCalled();
    expect(editing.setOpen).toHaveBeenCalledWith(false);
    expect(editing.key("Tab")).not.toHaveBeenCalled();
    expect(editing.key("Enter", true)).not.toHaveBeenCalled();
  });
  it("leaves unhighlighted Enter to form validation instead of choosing the first match", () => {
    const picker = view("lebron", true, -1);
    expect(picker.key("Enter")).not.toHaveBeenCalled();
    expect(picker.onChange).not.toHaveBeenCalled();
  });
});

import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Wheel } from "./Wheel";

function ManualWheel({ enabled = true }: { enabled?: boolean }) {
  const [value, setValue] = useState("?");
  const [dragging, setDragging] = useState(false);
  return (
    <>
      <Wheel letters={["c", "m", "p"]} value={value} label="First letter" enabled={enabled}
        onChange={setValue} onDraggingChange={setDragging} />
      <output>{dragging ? "dragging" : "stable"}</output>
    </>
  );
}

beforeEach(() => {
  vi.stubGlobal("PointerEvent", class extends MouseEvent {
    pointerId: number;
    isPrimary: boolean;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.isPrimary = init.isPrimary ?? true;
    }
  });
  vi.spyOn(HTMLElement.prototype, "setPointerCapture").mockImplementation(() => undefined);
  vi.spyOn(HTMLElement.prototype, "hasPointerCapture").mockReturnValue(false);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("manual wheel", () => {
  it("prevents native selection and dragging while retaining focus and wheel movement", () => {
    render(<ManualWheel />);
    const wheel = screen.getByRole("spinbutton");
    const letter = wheel.querySelector(".wheel-letter:nth-child(2)");
    if (!letter) throw new Error("Missing selected letter");
    expect(fireEvent.pointerDown(letter, {
      pointerId: 1, clientY: 100, button: 0, cancelable: true,
    })).toBe(false);
    expect(wheel).toHaveFocus();
    expect(wheel).toHaveAttribute("draggable", "false");
    expect(fireEvent.dragStart(letter, { cancelable: true })).toBe(false);
    fireEvent.pointerMove(wheel, { pointerId: 1, clientY: 60 });
    expect(wheel).toHaveAttribute("aria-valuetext", "c");
    fireEvent.pointerUp(wheel, { pointerId: 1 });
    expect(screen.getByText("stable")).toBeInTheDocument();
  });

  it("drags in both directions, removes the placeholder, wraps, and snaps on release", () => {
    render(<ManualWheel />);
    const wheel = screen.getByRole("spinbutton");
    fireEvent.pointerDown(wheel, { pointerId: 1, clientY: 200, button: 0 });
    fireEvent.pointerMove(wheel, { pointerId: 1, clientY: 160 });
    expect(wheel).toHaveAttribute("aria-valuetext", "c");
    fireEvent.pointerMove(wheel, { pointerId: 1, clientY: 200 });
    expect(wheel).toHaveAttribute("aria-valuetext", "p");
    expect(wheel).not.toHaveTextContent("?");
    fireEvent.pointerMove(wheel, { pointerId: 1, clientY: 120 });
    expect(wheel).toHaveAttribute("aria-valuetext", "m");
    fireEvent.pointerUp(wheel, { pointerId: 1, clientY: 120 });
    expect(screen.getByText("stable")).toBeInTheDocument();
    expect(wheel.firstElementChild).toHaveStyle({ transform: "translateY(-76px)" });
  });

  it("does not change the selected value on a tap or sub-threshold drag and handles cancellation", () => {
    render(<ManualWheel />);
    const wheel = screen.getByRole("spinbutton");
    fireEvent.pointerDown(wheel, { pointerId: 1, clientY: 100, button: 0 });
    fireEvent.pointerMove(wheel, { pointerId: 1, clientY: 90 });
    fireEvent.pointerCancel(wheel, { pointerId: 1 });
    expect(wheel).toHaveAttribute("aria-valuetext", "Not selected");
    expect(screen.getByText("stable")).toBeInTheDocument();
  });

  it("ignores disabled and secondary-pointer input", () => {
    const view = render(<ManualWheel enabled={false} />);
    const wheel = screen.getByRole("spinbutton");
    fireEvent.keyDown(wheel, { key: "ArrowUp" });
    fireEvent.pointerDown(wheel, { pointerId: 1, clientY: 100 });
    fireEvent.pointerMove(wheel, { pointerId: 1, clientY: 0 });
    expect(wheel).toHaveAttribute("aria-valuetext", "Not selected");
    view.rerender(<ManualWheel />);
    fireEvent.pointerDown(wheel, { pointerId: 2, isPrimary: false, clientY: 100 });
    fireEvent.pointerMove(wheel, { pointerId: 2, clientY: 0 });
    expect(wheel).toHaveAttribute("aria-valuetext", "Not selected");
  });

  it("supports keyboard movement and never reintroduces the placeholder", () => {
    render(<ManualWheel />);
    const wheel = screen.getByRole("spinbutton");
    fireEvent.keyDown(wheel, { key: "ArrowDown" });
    expect(wheel).toHaveAttribute("aria-valuetext", "p");
    fireEvent.keyDown(wheel, { key: "ArrowUp" });
    expect(wheel).toHaveAttribute("aria-valuetext", "c");
    expect(wheel).not.toHaveTextContent("?");
  });
});

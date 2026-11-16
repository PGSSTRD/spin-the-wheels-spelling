import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";

interface WheelProps {
  letters: string[];
  value: string;
  label: string;
  enabled: boolean;
  onChange: (value: string) => void;
  onDraggingChange: (dragging: boolean) => void;
}

const DRAG_STEP = 40;
const LETTER_HEIGHT = 76;

export function Wheel({ letters, value, label, enabled, onChange, onDraggingChange }: WheelProps) {
  const [offset, setOffset] = useState(0);
  const drag = useRef<{ pointerId: number; y: number; value: string } | null>(null);
  const editable = enabled && letters.length > 1;
  const currentIndex = letters.indexOf(value);

  function adjacent(selected: string, direction: number): string {
    const index = letters.indexOf(selected);
    if (index === -1) return direction > 0 ? letters[0] : letters[letters.length - 1];
    return letters[(index + direction + letters.length) % letters.length];
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (!editable || drag.current || !event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, y: event.clientY, value };
    onDraggingChange(true);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current;
    if (!editable || !active || active.pointerId !== event.pointerId) return;
    const distance = active.y - event.clientY;
    const steps = Math.trunc(distance / DRAG_STEP);
    if (steps !== 0) {
      const direction = Math.sign(steps);
      for (let step = 0; step < Math.abs(steps); step += 1) {
        active.value = adjacent(active.value, direction);
        onChange(active.value);
      }
      active.y -= steps * DRAG_STEP;
    }
    setOffset((event.clientY - active.y) * LETTER_HEIGHT / DRAG_STEP);
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    setOffset(0);
    onDraggingChange(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function keyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!editable || drag.current || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    onChange(adjacent(value, event.key === "ArrowUp" ? 1 : -1));
  }

  const previous = currentIndex < 0 ? letters[letters.length - 1] : adjacent(value, -1);
  const next = currentIndex < 0 ? letters[0] : adjacent(value, 1);

  return (
    <div
      className={`wheel-window${letters.length === 1 ? " wheel-fixed" : ""}${editable ? " wheel-editable" : ""}`}
      role={letters.length > 1 ? "spinbutton" : "img"}
      aria-label={label}
      aria-disabled={letters.length > 1 ? !editable : undefined}
      aria-valuetext={letters.length > 1 ? (value === "?" ? "Not selected" : value) : undefined}
      aria-valuenow={letters.length > 1 ? currentIndex + 1 : undefined}
      aria-valuemin={letters.length > 1 ? 0 : undefined}
      aria-valuemax={letters.length > 1 ? letters.length : undefined}
      tabIndex={editable ? 0 : -1}
      draggable={false}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onLostPointerCapture={finishDrag}
      onKeyDown={keyDown}
    >
      <div
        className="wheel-track"
        aria-hidden="true"
        style={{ transform: `translateY(${-LETTER_HEIGHT + offset}px)` }}
      >
        {[previous, value, next].map((letter, index) => (
          <span className="wheel-letter" key={index}>{letter}</span>
        ))}
      </div>
    </div>
  );
}

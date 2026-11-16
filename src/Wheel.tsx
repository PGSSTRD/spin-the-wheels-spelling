import { useEffect, useState } from "react";

interface WheelProps {
  letters: string[];
  value: string;
  spinToken: number;
  spinning: boolean;
}

const SPIN_DURATION_MS = 1500;

export function Wheel({ letters, value, spinToken, spinning }: WheelProps) {
  const [position, setPosition] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(false);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const duration = reducedMotion ? 250 : SPIN_DURATION_MS;

  useEffect(() => {
    if (!spinning || spinToken === 0) return;
    const targetIndex = letters.indexOf(value);
    if (targetIndex < 0) return;

    setTransitionEnabled(false);
    setPosition(targetIndex);
    const frame = requestAnimationFrame(() => {
      setTransitionEnabled(true);
      setPosition(letters.length * 4 + targetIndex);
    });
    const settle = window.setTimeout(() => {
      setTransitionEnabled(false);
      setPosition(letters.length * 2 + targetIndex);
    }, duration);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
    };
  }, [duration, letters, spinToken, spinning, value]);

  const repeatedLetters = Array.from({ length: 5 }, () => letters).flat();
  const itemHeight = 76;

  return (
    <div className="wheel-window" aria-hidden="true">
      <div
        className={`wheel-track${spinning ? " wheel-track-spinning" : ""}`}
        style={{
          height: `${repeatedLetters.length * itemHeight}px`,
          transform: `translateY(-${position * itemHeight}px)`,
          transition: transitionEnabled ? `transform ${duration}ms cubic-bezier(0.12, 0.72, 0.14, 1)` : "none",
        }}
      >
        {repeatedLetters.map((letter, index) => (
          <span className="wheel-letter" key={`${index}-${letter}`} style={{ height: itemHeight }}>
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
}

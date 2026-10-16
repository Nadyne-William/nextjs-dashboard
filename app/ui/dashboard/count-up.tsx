'use client';

import { useEffect, useRef, useState } from 'react';

type CountUpProps = {
  value: number;
  /** 'currency' expects cents, matching how amounts are stored. */
  format: 'currency' | 'number';
  durationMs?: number;
};

const formatters = {
  currency: (cents: number) =>
    (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
  number: (n: number) => Math.round(n).toLocaleString('en-US'),
};

/**
 * Animates a stat from 0 to its value when it first appears.
 * The server renders the final value, so the number is correct before any
 * JavaScript runs, and people who prefer reduced motion never see the animation.
 */
export function CountUp({ value, format, durationMs = 900 }: CountUpProps) {
  const [display, setDisplay] = useState(value);
  const frame = useRef<number>(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out: fast start, gentle landing
      setDisplay(value * eased);
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };

    setDisplay(0);
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [value, durationMs]);

  return (
    <span className="tabular-nums" aria-label={formatters[format](value)}>
      <span aria-hidden>{formatters[format](format === 'number' ? display : Math.round(display))}</span>
    </span>
  );
}

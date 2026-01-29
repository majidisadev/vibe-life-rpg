import { useEffect, useLayoutEffect, useRef } from "react";
import anime from "animejs";
import { cn } from "../../lib/utils";

/**
 * HP bar with anime.js width transition when current/max changes.
 */
export default function AnimatedHPBar({ current, max, className, barClassName }) {
  const barRef = useRef(null);
  const prevPctRef = useRef(null);

  const m = Math.max(1, Number(max) || 1);
  const c = Math.max(0, Math.min(m, Number(current) ?? 0));
  const pct = (c / m) * 100;

  useLayoutEffect(() => {
    if (!barRef.current) return;
    const prev = prevPctRef.current ?? pct;
    prevPctRef.current = pct;
    barRef.current.style.width = `${prev}%`;
    anime({
      targets: barRef.current,
      width: `${pct}%`,
      duration: 500,
      easing: "easeOutExpo",
    });
  }, [current, max, pct]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between text-sm">
        <span>HP</span>
        <span>{c} / {m}</span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div
          ref={barRef}
          className={cn(
            "h-full rounded-full bg-primary",
            (c / m) * 100 <= 20 && "!bg-destructive",
            barClassName
          )}
          role="progressbar"
          aria-valuenow={c}
          aria-valuemin={0}
          aria-valuemax={m}
        />
      </div>
    </div>
  );
}

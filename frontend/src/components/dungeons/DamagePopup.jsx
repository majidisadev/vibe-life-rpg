import { useEffect, useRef } from "react";
import anime from "animejs";

/**
 * Floating damage number shown on attack. Animates up, scales, and fades out.
 */
export default function DamagePopup({ value, visible, onComplete, className = "" }) {
  const innerRef = useRef(null);

  useEffect(() => {
    if (!visible || value == null || !innerRef.current) return;

    const el = innerRef.current;
    el.style.opacity = "1";
    el.style.transform = "translateY(0) scale(1.2)";

    const anim = anime({
      targets: el,
      translateY: [-20, -56],
      scale: [1.2, 1],
      opacity: [1, 0],
      duration: 800,
      easing: "easeOutExpo",
      complete: () => {
        onComplete?.();
      },
    });

    return () => anim.pause();
  }, [visible, value, onComplete]);

  if (!visible && value == null) return null;

  return (
    <div
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex justify-center ${className}`}
      aria-hidden
    >
      <span
        ref={innerRef}
        className="font-bold text-2xl md:text-3xl text-red-500 drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]"
        style={{ opacity: 0 }}
      >
        -{value}
      </span>
    </div>
  );
}

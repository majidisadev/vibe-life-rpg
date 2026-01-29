import { useEffect, useRef } from "react";
import anime from "animejs";

/**
 * Brief "Stage N" overlay when changing dungeon stage. Fade in → hold → fade out.
 */
export default function StageTransitionOverlay({ stageNumber, visible, onComplete }) {
  const bgRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    if (!visible || stageNumber == null || !bgRef.current || !textRef.current) return;

    const tl = anime.timeline({
      easing: "easeOutExpo",
      complete: () => onComplete?.(),
    });

    tl.add({
      targets: [bgRef.current, textRef.current],
      opacity: [0, 1],
      duration: 280,
    })
      .add({
        targets: [bgRef.current, textRef.current],
        opacity: 1,
        duration: 400,
      })
      .add({
        targets: [bgRef.current, textRef.current],
        opacity: [1, 0],
        duration: 280,
      });

    return () => tl.pause();
  }, [visible, stageNumber, onComplete]);

  if (!visible) return null;

  return (
    <div
      ref={bgRef}
      className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-black/70 backdrop-blur-sm"
      style={{ opacity: 0 }}
      aria-hidden
    >
      <span
        ref={textRef}
        className="text-xl font-bold text-white drop-shadow-lg"
        style={{ opacity: 0 }}
      >
        Stage {stageNumber}
      </span>
    </div>
  );
}

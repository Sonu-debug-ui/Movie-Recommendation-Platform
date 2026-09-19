// KexsioCard — Reusable wrapper that adds:
//   1. Border Runners  (animated white light streaks around the card)
//   2. 3D Tilt         (card rotates toward mouse cursor in 3D)
//   3. Pointer Glow    (soft radial glow follows mouse inside the card)
//
// Usage:
//   <KexsioCard className="auth-modal-card">
//     ...your content...
//   </KexsioCard>

import { useRef, useState, useCallback } from "react";
import "../css/KexsioCard.css";

export default function KexsioCard({
  children,
  className = "",
  style = {},
  maxTilt = 10,
  glowOpacity = 0.18,
}) {
  const stageRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glow, setGlow] = useState({ x: "50%", y: "50%" });
  const [inside, setInside] = useState(false);

  const handlePointerMove = useCallback(
    (e) => {
      if (e.pointerType === "touch") return;
      const el = stageRef.current;
      if (!el) return;
      const b = el.getBoundingClientRect();
      const rx = (e.clientX - b.left) / b.width;
      const ry = (e.clientY - b.top) / b.height;
      setTilt({
        x: (0.5 - ry) * maxTilt,
        y: (rx - 0.5) * maxTilt,
      });
      setGlow({ x: rx * 100 + "%", y: ry * 100 + "%" });
    },
    [maxTilt]
  );

  const handlePointerEnter = useCallback(() => setInside(true), []);

  const handlePointerLeave = useCallback(() => {
    setInside(false);
    setTilt({ x: 0, y: 0 });
    setGlow({ x: "50%", y: "50%" });
  }, []);

  const tiltTransform =
    "rotateX(" + tilt.x + "deg) rotateY(" + tilt.y + "deg)";

  return (
    <div className="kx-stage" ref={stageRef}>
      <div
        className="kx-tilt"
        style={{ transform: tiltTransform }}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
      >
        {/* Border runners shell */}
        <div className="kx-shell">
          <div className="kx-runners" aria-hidden="true">
            <span className="kx-runner kx-runner-top" />
            <span className="kx-runner kx-runner-right" />
            <span className="kx-runner kx-runner-bottom" />
            <span className="kx-runner kx-runner-left" />
          </div>

          {/* Card content with pointer glow */}
          <div
            className={"kx-card-inner " + className}
            style={{ position: "relative", overflow: "hidden", ...style }}
          >
            <div
              className="kx-pointer-glow"
              aria-hidden="true"
              style={{
                left: glow.x,
                top: glow.y,
                opacity: inside ? glowOpacity : 0,
              }}
            />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

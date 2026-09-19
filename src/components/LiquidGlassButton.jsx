// Light Glass Button — Originkit
// Adapted for React JSX (no TypeScript) for use in CineFlix

import * as React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const radiusFromPercent = (w, h, pct) =>
  (Math.min(w, h) / 2) * (Math.max(0, Math.min(100, pct)) / 100);

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const DEFAULT_BG = "rgba(255,255,255,0.12)";
const DEFAULT_HOVER_BG = "rgba(255,255,255,0.22)";
const DEFAULT_TEXT = "#ffffff";
const DEFAULT_HOVER_TEXT = "#ffffff";
const DEFAULT_BORDER = "rgba(255,255,255,0.35)";
const DEFAULT_HOVER_BORDER = "rgba(255,255,255,0.7)";
const DEFAULT_SHINE = "rgba(255,255,255,0.55)";
const DEFAULT_HOVER_SHINE = "rgba(255,255,255,0.85)";

export default function LiquidGlassButton({
  label = "Button",
  onClick,
  type = "button",
  disabled = false,
  rounded = 50,
  padding = "11px 26px",
  bg = DEFAULT_BG,
  hoverBg = DEFAULT_HOVER_BG,
  textColor = DEFAULT_TEXT,
  hoverText = DEFAULT_HOVER_TEXT,
  border = DEFAULT_BORDER,
  hoverBorder = DEFAULT_HOVER_BORDER,
  shine = DEFAULT_SHINE,
  hoverShine = DEFAULT_HOVER_SHINE,
  blur = 14,
  fontSize = 15,
  fontWeight = 600,
  fontFamily = "'Plus Jakarta Sans', 'Inter', sans-serif",
  icon = null,
  style = {},
  ...rest
}) {
  const btnRef = useRef(null);
  const [radiusPx, setRadiusPx] = useState(999);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  useIsoLayoutEffect(() => {
    const update = () => {
      if (!btnRef.current) return;
      const { width, height } = btnRef.current.getBoundingClientRect();
      setRadiusPx(radiusFromPercent(width, height, rounded));
    };
    update();
    const ro = new ResizeObserver(update);
    if (btnRef.current) ro.observe(btnRef.current);
    return () => ro.disconnect();
  }, [rounded]);

  const activeBg = hovered ? hoverBg : bg;
  const activeText = hovered ? hoverText : textColor;
  const activeBorder = hovered ? hoverBorder : border;
  const activeShine = hovered ? hoverShine : shine;
  const scale = pressed ? 0.96 : hovered ? 1.02 : 1;

  const buttonStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding,
    borderRadius: radiusPx,
    border: "1.5px solid " + activeBorder,
    background: activeBg,
    backdropFilter: "blur(" + blur + "px)",
    WebkitBackdropFilter: "blur(" + blur + "px)",
    color: activeText,
    fontSize,
    fontWeight,
    fontFamily,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    outline: "none",
    position: "relative",
    overflow: "hidden",
    transform: "scale(" + scale + ")",
    transition: "background 0.22s ease, border-color 0.22s ease, color 0.22s ease, transform 0.15s ease, box-shadow 0.22s ease",
    boxShadow: hovered
      ? "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 " + activeShine
      : "0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 " + activeShine,
    letterSpacing: "0.01em",
    whiteSpace: "nowrap",
    userSelect: "none",
    ...style,
  };

  return React.createElement(
    "button",
    {
      ref: btnRef,
      type,
      disabled,
      onClick: disabled ? undefined : onClick,
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => { setHovered(false); setPressed(false); },
      onMouseDown: () => setPressed(true),
      onMouseUp: () => setPressed(false),
      style: buttonStyle,
      ...rest,
    },
    icon ? React.createElement("span", { style: { lineHeight: 1 } }, icon) : null,
    label
  );
}

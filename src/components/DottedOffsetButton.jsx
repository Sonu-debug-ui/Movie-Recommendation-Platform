// Dotted Offset Button — Originkit
// Adapted for React with modern animations via motion/react

import * as React from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useAnimate, useReducedMotion } from "motion/react";

/** Rounded is a percent of the MAXIMUM possible radius — half the short side —
 *  so 100 is a true pill at any button size and 0 is a square corner. */
const radiusFromPercent = (w, h, pct) =>
  (Math.min(w, h) / 2) * (Math.max(0, Math.min(100, pct)) / 100);

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** The border object hands back either one fused width or four per-side
 *  widths, plus borderColor. */
const borderColorOf = (b) => b?.borderColor ?? "transparent";

/** The border WITHOUT its colour. The colour is animated (rest → hover). */
const borderBoxOf = (b) => {
  if (!b) return {};
  const { borderColor, ...rest } = b;
  return rest;
};

const DEFAULT_TRANSITION = {
  mass: 1,
  type: "spring",
  damping: 25,
  stiffness: 400,
};

/**
 * Dotted Button — the pill lifts up-left on hover while a hard offset shadow
 * drops in behind it, and the corners tighten.
 */
export default function DottedOffsetButton(props) {
  const {
    label = "DOTTED OFFSET",
    font = {
      variant: "Regular",
      fontSize: 16,
      textAlign: "center",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontWeight: 600,
      lineHeight: "1.4em",
      letterSpacing: "0.02em",
    },
    showText = true,
    padding = "14px 28px",
    rounded = 32,
    fill: fillProp,
    textColor: textColorProp,
    colors = {
      fill: "#e50914",
      hoverFill: "#b80710",
      textColor: "#FFFFFF",
      hoverTextColor: "#FFFFFF",
    },
    addIcon = false,
    icon = {
      side: "left",
      size: 20,
      type: "symbol",
      color: "#FFFFFF",
      image: "",
      symbol: "▶",
      padding: 0,
      rounded: 0,
      hoverColor: "#FFFFFF",
    },
    gap = 10,
    border = {
      borderColor: "rgba(255, 255, 255, 0.4)",
      borderStyle: "dashed",
      borderWidth: 2,
    },
    hover = {
      offsetX: 6,
      offsetY: 6,
      rounded: 20,
      borderColor: "#FFFFFF",
    },
    shadow = { color: "#e50914" },
    hoverRounded: hoverRoundedLegacy,
    hoverBorderColor: hoverBorderColorLegacy,
    shadowColor: shadowColorLegacy,
    shadowSide: shadowSideLegacy,
    shadowDistance: shadowDistanceLegacy,
    link = "",
    onClick,
    transition = DEFAULT_TRANSITION,
    newTab = false,
    style,
    className = "",
    children,
  } = props;

  const fill = colors?.fill ?? fillProp ?? "#e50914";
  const textColor = colors?.textColor ?? textColorProp ?? "#FFFFFF";
  const restBorderColor = borderColorOf(border);

  const {
    fill: hoverFill = colors?.hoverFill ?? "#b80710",
    textColor: hoverTextColor = colors?.hoverTextColor ?? "#FFFFFF",
    borderColor: hoverBorderColor = hoverBorderColorLegacy ?? restBorderColor,
    rounded: hoverRounded = hoverRoundedLegacy ?? 20,
    offsetX: hoverOffsetX,
    offsetY: hoverOffsetY,
  } = hover;

  const {
    color: shadowColor = shadowColorLegacy ?? "#e50914",
    side: shadowSide = shadowSideLegacy ?? "right",
    distance: shadowDistance = shadowDistanceLegacy ?? 6,
  } = shadow;

  const legacyDist = Math.max(0, Math.round(shadowDistance));
  const shadowX = Math.round(
    hoverOffsetX ?? (shadowSide === "left" ? -legacyDist : legacyDist)
  );
  const shadowY = Math.round(hoverOffsetY ?? legacyDist);

  const [scope, animate] = useAnimate();

  const [radiusBox, setRadiusBox] = useState({ w: 0, h: 0 });
  useIsoLayoutEffect(() => {
    const el = scope.current;
    if (!el) return;
    const read = () =>
      setRadiusBox((prev) =>
        prev.w === el.offsetWidth && prev.h === el.offsetHeight
          ? prev
          : { w: el.offsetWidth, h: el.offsetHeight }
      );
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scope]);

  const radiusPx = radiusFromPercent(radiusBox.w, radiusBox.h, rounded);
  const hoverRadiusPx = radiusFromPercent(
    radiusBox.w,
    radiusBox.h,
    hoverRounded
  );

  const iconRef = useRef(null);
  const hovered = useRef(false);
  const reducedMotion = useReducedMotion();

  const fontStyles = font ?? {};

  // ---- icon configuration ----
  const {
    type: iconKind = "symbol",
    symbol: iconSymbol = "▶",
    image: iconImage,
    color: iconColor = "#FFFFFF",
    hoverColor: iconHoverColor = "#FFFFFF",
    size: iconSize = 20,
    padding: iconPaddingProp = 0,
    rounded: iconRounded = 0,
    side: iconSide = "left",
  } = icon;

  const iconSrc =
    typeof iconImage === "string"
      ? iconImage
      : iconImage && iconImage.src
      ? iconImage.src
      : "";
  const iconMode = iconKind === "image" && iconSrc ? "image" : "symbol";
  const iconPx = Math.max(1, Math.round(iconSize));
  const iconPadPx = Math.max(0, Math.round(iconPaddingProp));
  const iconRadius = radiusFromPercent(iconPx, iconPx, iconRounded);
  const gapPx = Math.max(0, Math.round(gap));

  const iconEl = !addIcon ? null : iconMode === "image" ? (
    <img
      src={iconSrc}
      alt=""
      aria-hidden
      draggable={false}
      style={{
        width: iconPx,
        height: iconPx,
        margin: iconPadPx,
        objectFit: iconRadius > 0 ? "cover" : "contain",
        borderRadius: Math.min(iconRadius, iconPx / 2),
        display: "block",
        flex: "none",
        pointerEvents: "none",
      }}
    />
  ) : (
    <span
      ref={iconRef}
      aria-hidden
      style={{
        fontSize: iconPx,
        margin: iconPadPx,
        lineHeight: 1,
        color: iconColor,
        flex: "none",
        pointerEvents: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {iconSymbol}
    </span>
  );

  const apply = useCallback(
    (toHover, instant) => {
      if (!scope.current) return;
      const t = instant || reducedMotion ? { duration: 0 } : transition;

      animate(
        scope.current,
        toHover
          ? {
              x: -shadowX,
              y: -shadowY,
              borderRadius: hoverRadiusPx,
              backgroundColor: hoverFill,
              color: hoverTextColor,
              borderColor: hoverBorderColor,
              boxShadow: `${shadowX}px ${shadowY}px 0px ${shadowColor}`,
            }
          : {
              x: 0,
              y: 0,
              borderRadius: radiusPx,
              backgroundColor: fill,
              color: textColor,
              borderColor: restBorderColor,
              boxShadow: `0px 0px 0px ${shadowColor}`,
            },
        t
      );
      if (iconRef.current) {
        animate(
          iconRef.current,
          { color: toHover ? iconHoverColor : iconColor },
          t
        );
      }
    },
    [
      animate,
      scope,
      transition,
      reducedMotion,
      shadowX,
      shadowY,
      shadowColor,
      radiusPx,
      hoverRadiusPx,
      fill,
      hoverFill,
      textColor,
      hoverTextColor,
      restBorderColor,
      hoverBorderColor,
      iconColor,
      iconHoverColor,
    ]
  );

  useEffect(() => {
    apply(hovered.current, true);
  }, [apply]);

  const onEnter = () => {
    hovered.current = true;
    apply(true, false);
  };
  const onLeave = () => {
    hovered.current = false;
    apply(false, false);
  };

  const onDown = () => apply(false, false);
  const onUp = () => apply(hovered.current, false);

  const isLink = typeof link === "string" && link.length > 0;
  const Tag = isLink ? "a" : "button";
  const tagProps = {
    "aria-label": showText ? undefined : label || undefined,
    ...(isLink
      ? {
          href: link,
          target: newTab ? "_blank" : undefined,
          rel: newTab ? "noopener noreferrer" : undefined,
        }
      : { type: "button" }),
    onClick: (e) => {
      if (onClick) onClick(e);
    },
  };

  const buttonContent = children || (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: iconEl && showText ? gapPx : 0,
        flexDirection: iconSide === "right" ? "row-reverse" : "row",
      }}
    >
      {iconEl}
      {showText && <span>{label}</span>}
    </span>
  );

  return (
    <div
      className={`dotted-offset-btn-wrapper ${className}`}
      style={{
        display: "inline-block",
        boxSizing: "border-box",
        paddingLeft: Math.max(0, shadowX),
        paddingTop: Math.max(0, shadowY),
        paddingRight: Math.max(0, -shadowX),
        paddingBottom: Math.max(0, -shadowY),
        ...style,
      }}
    >
      <Tag
        {...tagProps}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
        onPointerDown={onDown}
        onPointerUp={onUp}
        style={{
          display: "inline-flex",
          width: "100%",
          height: "100%",
          padding: 0,
          border: 0,
          background: "transparent",
          color: "inherit",
          font: "inherit",
          textDecoration: "none",
          cursor: "pointer",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <span
          ref={scope}
          style={{
            display: "inline-block",
            width: "100%",
            padding,
            ...borderBoxOf(border),
            borderColor: restBorderColor,
            borderRadius: radiusPx,
            backgroundColor: fill,
            boxSizing: "border-box",
            whiteSpace: "nowrap",
            ...fontStyles,
            color: textColor,
          }}
        >
          {buttonContent}
        </span>
      </Tag>
    </div>
  );
}

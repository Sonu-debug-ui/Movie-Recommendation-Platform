import React from "react";
import PulseRoll from "./PulseRoll";
import { useSiteSettings } from "../hooks/useSiteSettings";
import "../css/Loader.css";

/**
 * CineFlix 3D Pulse Roll Loader
 * @param {object} props
 * @param {"fullscreen"|"section"|"card"|"inline"} [props.variant="section"] - Display layout
 * @param {string} [props.text="Loading..."] - Status message
 * @param {string} [props.title] - Optional title or site brand
 * @param {boolean} [props.showLogo=true] - Whether to show the CineFlix brand mark
 * @param {string} [props.baseColor="#e50914"] - Metallic base color for the discs
 * @param {string} [props.accentColor="#ffffff"] - Specular accent highlight color
 * @param {number} [props.speed=95] - Rotation/pulse speed
 * @param {number} [props.distance] - Camera distance override
 * @param {object} [props.pulse] - Pulse config overrides { count, spacing, minSize, stagger }
 * @param {number|string} [props.width] - Width override
 * @param {number|string} [props.height] - Height override
 * @param {React.CSSProperties} [props.style] - Custom wrapper styles
 */
export default function Loader({
  variant = "section",
  text = "Loading...",
  title,
  showLogo = true,
  baseColor = "#e50914",
  accentColor = "#ffffff",
  speed = 95,
  distance,
  pulse,
  width,
  height,
  style = {},
}) {
  const { siteName = "CineFlix" } = useSiteSettings();
  const displayTitle = title ?? siteName;

  // Dimensions & camera distance tailored per variant
  let canvasWidth = 240;
  let canvasHeight = 180;
  let cameraDist = 15;

  if (variant === "fullscreen") {
    canvasWidth = width || 340;
    canvasHeight = height || 240;
    cameraDist = distance || 13;
  } else if (variant === "section") {
    canvasWidth = width || 260;
    canvasHeight = height || 180;
    cameraDist = distance || 15;
  } else if (variant === "card") {
    canvasWidth = width || 190;
    canvasHeight = height || 140;
    cameraDist = distance || 17;
  } else if (variant === "inline") {
    canvasWidth = width || 100;
    canvasHeight = height || 75;
    cameraDist = distance || 21;
  }

  const containerClass = `cineflix-loader-container cineflix-loader-${variant}`;

  return (
    <div className={containerClass} style={style}>
      <div
        className="cineflix-loader-canvas-box"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <div
          className="cineflix-loader-glow"
          style={{
            background: `radial-gradient(circle, ${baseColor}44 0%, transparent 70%)`,
          }}
        />
        <PulseRoll
          background="transparent"
          baseColor={baseColor}
          accentColor={accentColor}
          speed={speed}
          distance={cameraDist}
          pulse={pulse}
          width={canvasWidth}
          height={canvasHeight}
        />
      </div>

      {(text || (showLogo && variant !== "inline")) && (
        <div className="cineflix-loader-content">
          {showLogo && variant !== "inline" && (
            <div className="cineflix-loader-logo">
              🎬 {displayTitle}
            </div>
          )}
          {text && (
            <div className="cineflix-loader-text">
              <span>{text}</span>
              <div className="cineflix-loader-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

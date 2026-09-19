import React, { useState } from "react";
import PulseRoll from "../components/PulseRoll";
import Loader from "../components/Loader";
import DottedOffsetButton from "../components/DottedOffsetButton";
import { Link } from "react-router-dom";
import "../css/Admin.css";

const PRESETS = [
  {
    name: "CineFlix Signature",
    baseColor: "#e50914",
    accentColor: "#ffffff",
    bg: "#090a0f",
  },
  {
    name: "Cyber Neon",
    baseColor: "#06b6d4",
    accentColor: "#f43f5e",
    bg: "#080c14",
  },
  {
    name: "Golden Cinema",
    baseColor: "#d97706",
    accentColor: "#fef08a",
    bg: "#0d0b07",
  },
  {
    name: "Cosmic Violet",
    baseColor: "#8b5cf6",
    accentColor: "#f472b6",
    bg: "#0c0817",
  },
  {
    name: "Obsidian Chrome",
    baseColor: "#475569",
    accentColor: "#ffffff",
    bg: "#0f172a",
  },
  {
    name: "Emerald Matrix",
    baseColor: "#059669",
    accentColor: "#6ee7b7",
    bg: "#06130d",
  },
];

export default function LoaderShowcase() {
  const [speed, setSpeed] = useState(98);
  const [distance, setDistance] = useState(15);
  const [baseColor, setBaseColor] = useState("#e50914");
  const [accentColor, setAccentColor] = useState("#ffffff");
  const [bg, setBg] = useState("#090a0f");

  const [count, setCount] = useState(10);
  const [spacing, setSpacing] = useState(100);
  const [minSize, setMinSize] = useState(30);
  const [stagger, setStagger] = useState(250);

  const [testText, setTestText] = useState("Loading blockbusters & recommendations");
  const [showFullscreenDemo, setShowFullscreenDemo] = useState(false);
  const [copied, setCopied] = useState(false);

  const activePulse = {
    count,
    spacing,
    minSize,
    stagger,
  };

  const applyPreset = (p) => {
    setBaseColor(p.baseColor);
    setAccentColor(p.accentColor);
    setBg(p.bg);
  };

  const codeSnippet = `<Loader
  variant="section"
  text="${testText}"
  baseColor="${baseColor}"
  accentColor="${accentColor}"
  speed={${speed}}
  distance={${distance}}
  pulse={{
    count: ${count},
    spacing: ${spacing},
    minSize: ${minSize},
    stagger: ${stagger},
  }}
/>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerFullscreen = () => {
    setShowFullscreenDemo(true);
    setTimeout(() => {
      setShowFullscreenDemo(false);
    }, 3500);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #090a0f 0%, #0d0f18 100%)",
        color: "#f8fafc",
        padding: "2rem 1.5rem 5rem",
        fontFamily: "'Outfit', 'Inter', sans-serif",
      }}
    >
      {/* Fullscreen Demo Modal */}
      {showFullscreenDemo && (
        <div style={{ position: "relative", zIndex: 99999 }}>
          <Loader
            variant="fullscreen"
            text="Simulating Fullscreen Route Transition..."
            baseColor={baseColor}
            accentColor={accentColor}
            speed={speed}
            distance={13}
            pulse={activePulse}
          />
          <button
            onClick={() => setShowFullscreenDemo(false)}
            style={{
              position: "fixed",
              top: "24px",
              right: "24px",
              zIndex: 100000,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              padding: "8px 18px",
              borderRadius: "20px",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              fontWeight: 600,
            }}
          >
            ✕ Close Preview
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto 2.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
            <span
              style={{
                background: "rgba(229, 9, 20, 0.15)",
                color: "#ff4d4d",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Originkit 3D WebGL
            </span>
            <span style={{ color: "#64748b", fontSize: "0.85rem" }}>• Interactive Studio</span>
          </div>
          <h1
            style={{
              fontSize: "2.2rem",
              fontWeight: 800,
              letterSpacing: "-0.8px",
              margin: 0,
              background: "linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Pulse Roll 3D Loader
          </h1>
          <p style={{ color: "#94a3b8", margin: "0.35rem 0 0", fontSize: "0.95rem" }}>
            Real-time procedural matcap shader with dynamic cylindrical yoyo pulse animation.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <DottedOffsetButton
            onClick={triggerFullscreen}
            text="🚀 Test Fullscreen"
            border={{ borderColor: "#e50914", borderWidth: 2 }}
            glowColor="rgba(229, 9, 20, 0.3)"
          />
          <Link
            to="/"
            style={{
              textDecoration: "none",
              background: "rgba(255,255,255,0.06)",
              color: "#e2e8f0",
              padding: "10px 18px",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            ← Back to CineFlix
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr)",
          gap: "2rem",
        }}
      >
        {/* Left Column: Live Canvas & Formats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {/* Main Interactive Stage */}
          <div
            style={{
              background: bg,
              borderRadius: "20px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              overflow: "hidden",
              position: "relative",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "1rem 1.5rem",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
                <span style={{ marginLeft: "8px", fontSize: "0.82rem", color: "#94a3b8", fontWeight: 600 }}>
                  Live WebGL Viewport (Matcap Shading)
                </span>
              </div>
              <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                FPS: 60 • DPR: 2x
              </span>
            </div>

            <div
              style={{
                height: "380px",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PulseRoll
                background="transparent"
                baseColor={baseColor}
                accentColor={accentColor}
                speed={speed}
                distance={distance}
                pulse={activePulse}
                width="100%"
                height="100%"
              />
            </div>

            {/* Bottom Status text */}
            <div
              style={{
                padding: "1.2rem 1.5rem",
                background: "rgba(0,0,0,0.3)",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
              }}
            >
              <div style={{ fontSize: "0.95rem", color: "#f8fafc", fontWeight: 600 }}>
                🎬 CineFlix
              </div>
              <span style={{ color: "#64748b" }}>•</span>
              <div style={{ fontSize: "0.9rem", color: "#94a3b8" }}>
                {testText}
              </div>
            </div>
          </div>

          {/* Sizing & Integration Previews */}
          <div
            style={{
              background: "rgba(18, 20, 29, 0.7)",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.06)",
              padding: "1.5rem",
            }}
          >
            <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700 }}>
              Variant Previews in CineFlix Layouts
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {/* Card Sized Loader */}
              <div
                style={{
                  background: "rgba(13, 14, 21, 0.6)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: "12px",
                  padding: "1rem",
                }}
              >
                <div style={{ fontSize: "0.78rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>
                  Card / Modal Loader
                </div>
                <Loader
                  variant="card"
                  text="Fetching movie plot..."
                  baseColor={baseColor}
                  accentColor={accentColor}
                  speed={speed}
                  pulse={activePulse}
                />
              </div>

              {/* Inline Sized Loader */}
              <div
                style={{
                  background: "rgba(13, 14, 21, 0.6)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: "12px",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: "0.78rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>
                  Compact / Pill Loader
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "140px" }}>
                  <Loader
                    variant="inline"
                    text="Syncing..."
                    baseColor={baseColor}
                    accentColor={accentColor}
                    speed={speed}
                    pulse={activePulse}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Controls & Code Export */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Preset Swatches */}
          <div
            style={{
              background: "rgba(18, 20, 29, 0.7)",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.06)",
              padding: "1.5rem",
            }}
          >
            <h3 style={{ margin: "0 0 1rem", fontSize: "1.05rem", fontWeight: 700 }}>
              Cinematic Color Presets
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem" }}>
              {PRESETS.map((p) => {
                const isActive = baseColor === p.baseColor;
                return (
                  <button
                    key={p.name}
                    onClick={() => applyPreset(p)}
                    style={{
                      background: isActive ? "rgba(229, 9, 20, 0.18)" : "rgba(255,255,255,0.04)",
                      border: isActive ? `1.5px solid ${p.baseColor}` : "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "10px",
                      padding: "10px 8px",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.2s ease",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", gap: "4px" }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: p.baseColor }} />
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: p.accentColor }} />
                    </div>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: isActive ? "#fff" : "#94a3b8" }}>
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dial Sliders */}
          <div
            style={{
              background: "rgba(18, 20, 29, 0.7)",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.06)",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.1rem",
            }}
          >
            <h3 style={{ margin: "0", fontSize: "1.05rem", fontWeight: 700 }}>
              Live Geometry & Motion Tuning
            </h3>

            {/* Speed Dial */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                <span style={{ color: "#cbd5e1" }}>Speed ({speed})</span>
                <span style={{ color: "#64748b" }}>0 - 100</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                style={{ width: "100%", accentColor: baseColor }}
              />
            </div>

            {/* Distance / Framing */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                <span style={{ color: "#cbd5e1" }}>Distance / Framing ({distance})</span>
                <span style={{ color: "#64748b" }}>World Units</span>
              </div>
              <input
                type="range"
                min={8}
                max={26}
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                style={{ width: "100%", accentColor: baseColor }}
              />
            </div>

            {/* Disc Count */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                <span style={{ color: "#cbd5e1" }}>Disc Count ({count} discs)</span>
                <span style={{ color: "#64748b" }}>3 - 18</span>
              </div>
              <input
                type="range"
                min={3}
                max={18}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                style={{ width: "100%", accentColor: baseColor }}
              />
            </div>

            {/* Spacing */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                <span style={{ color: "#cbd5e1" }}>Disc Spacing ({spacing}%)</span>
                <span style={{ color: "#64748b" }}>50% - 180%</span>
              </div>
              <input
                type="range"
                min={50}
                max={180}
                value={spacing}
                onChange={(e) => setSpacing(Number(e.target.value))}
                style={{ width: "100%", accentColor: baseColor }}
              />
            </div>

            {/* Squeeze / Min Size */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                <span style={{ color: "#cbd5e1" }}>Squeeze Pulse Min Size ({minSize}%)</span>
                <span style={{ color: "#64748b" }}>10% - 70%</span>
              </div>
              <input
                type="range"
                min={10}
                max={70}
                value={minSize}
                onChange={(e) => setMinSize(Number(e.target.value))}
                style={{ width: "100%", accentColor: baseColor }}
              />
            </div>

            {/* Stagger Delay */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                <span style={{ color: "#cbd5e1" }}>Wave Stagger ({stagger}ms)</span>
                <span style={{ color: "#64748b" }}>50ms - 500ms</span>
              </div>
              <input
                type="range"
                min={50}
                max={500}
                step={25}
                value={stagger}
                onChange={(e) => setStagger(Number(e.target.value))}
                style={{ width: "100%", accentColor: baseColor }}
              />
            </div>

            {/* Custom status message text */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "4px" }}>
                Status Message Text
              </label>
              <input
                type="text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  color: "#fff",
                  fontSize: "0.88rem",
                }}
              />
            </div>
          </div>

          {/* Ready-to-use Code Export */}
          <div
            style={{
              background: "rgba(18, 20, 29, 0.7)",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.06)",
              padding: "1.5rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>
                Code Export
              </h3>
              <button
                onClick={handleCopyCode}
                style={{
                  background: copied ? "#10b981" : "rgba(229, 9, 20, 0.2)",
                  color: copied ? "#fff" : "#fca5a5",
                  border: "1px solid " + (copied ? "#10b981" : "rgba(229, 9, 20, 0.4)"),
                  padding: "4px 12px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {copied ? "✓ Copied!" : "📋 Copy JSX"}
              </button>
            </div>
            <pre
              style={{
                background: "rgba(8, 10, 15, 0.8)",
                padding: "1rem",
                borderRadius: "8px",
                fontSize: "0.8rem",
                color: "#94a3b8",
                overflowX: "auto",
                border: "1px solid rgba(255,255,255,0.05)",
                margin: 0,
              }}
            >
              {codeSnippet}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

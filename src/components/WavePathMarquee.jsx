import {
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";

function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
}

function toNumber(value, fallback) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : fallback;
    }

    if (typeof value === "string") {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    return fallback;
}

function toDimension(value, fallback) {
    if (value === undefined) return fallback;
    return typeof value === "number" ? `${value}px` : value;
}

function preserveSvgSpaces(value) {
    return value.replace(/ /g, "\u00A0");
}

export default function WavePathMarquee({
    text = "CINEFLIX",
    separator = "✦",
    gap = 4,
    speed = 5,
    reversed = false,
    waveFrequency = 2,
    waveHeight = 8,
    textColor = "gradient",
    interactive = true,
    font = {
        fontFamily: "'Plus Jakarta Sans', Inter, -apple-system, sans-serif",
        fontSize: 18,
        fontWeight: 800,
        letterSpacing: 1,
    },
    width = "100%",
    height = "100%",
    minHeight,
    background = "transparent",
    className,
    style,
}) {
    const containerRef = useRef(null);
    const pathRef = useRef(null);
    const textPathRef = useRef(null);
    const measureTwoRef = useRef(null);
    const measureFourRef = useRef(null);

    const animationFrameRef = useRef(null);
    const previousTimeRef = useRef(null);
    const offsetRef = useRef(0);

    const speedRef = useRef(speed);
    const reversedRef = useRef(reversed);
    const unitWidthRef = useRef(0);
    const reduceMotionRef = useRef(false);

    // Interactive mouse cursor tracking & jitter refs
    const isHoveredRef = useRef(false);
    const mousePosRef = useRef({ prevX: 0, prevY: 0, speedBoost: 0 });
    const jitterRef = useRef(0);
    const [isHovered, setIsHovered] = useState(false);

    const [containerSize, setContainerSize] = useState({
        width: 150,
        height: 36,
    });

    const [unitWidth, setUnitWidth] = useState(0);
    const [measuredPathLength, setMeasuredPathLength] = useState(0);

    const generatedId = useId().replace(/[^a-zA-Z0-9]/g, "");
    const pathId = `wave-path-${generatedId}`;
    const gradientId = `wave-grad-${generatedId}`;

    const fontSizePx = toNumber(font.fontSize, 18);
    const letterSpacingPx = toNumber(font.letterSpacing, 1);

    const fontFamily =
        font.fontFamily ??
        "'Plus Jakarta Sans', Inter, Arial, sans-serif";

    const fontWeight = font.fontWeight ?? 800;
    const fontStyle = font.fontStyle ?? "normal";

    const safeText = text.trim().length > 0 ? text : "CINEFLIX";
    const safeGap = clamp(Math.round(gap), 0, 20);
    const gapCharacters = "\u00A0".repeat(safeGap);

    const repeatUnit = preserveSvgSpaces(
        `${safeText}${gapCharacters}${separator}${gapCharacters}`
    );

    const widthPx = Math.max(containerSize.width, 1);
    const heightPx = Math.max(containerSize.height, 1);

    useLayoutEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        const updateSize = (rawWidth, rawHeight) => {
            const nextWidth = Math.round(rawWidth);
            const nextHeight = Math.round(rawHeight);

            if (nextWidth <= 0 || nextHeight <= 0) return;

            setContainerSize((current) => {
                const widthChanged = Math.abs(current.width - nextWidth) > 1;
                const heightChanged = Math.abs(current.height - nextHeight) > 1;

                if (!widthChanged && !heightChanged) {
                    return current;
                }

                return {
                    width: nextWidth,
                    height: nextHeight,
                };
            });
        };

        const bounds = element.getBoundingClientRect();
        if (bounds.width > 0 && bounds.height > 0) {
            updateSize(bounds.width, bounds.height);
        }

        if (typeof ResizeObserver === "undefined") return;

        const observer = new ResizeObserver((entries) => {
            entries.forEach((entry) => {
                updateSize(
                    entry.contentRect.width,
                    entry.contentRect.height
                );
            });
        });

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    const pathGeometry = useMemo(() => {
        const centerY = heightPx / 2;

        const maximumAmplitude = Math.max(
            0,
            heightPx / 2 - fontSizePx / 3
        );

        const amplitude = clamp(
            waveHeight / 2,
            0,
            Math.max(maximumAmplitude, 1)
        );

        const controlAmplitude = amplitude * (4 / 3);

        const visibleHalfWaves = Math.max(
            2,
            Math.round(waveFrequency * 2)
        );

        const halfWaveWidth = widthPx / visibleHalfWaves;

        const overflowDistance = Math.max(
            100,
            widthPx * 0.4
        );

        const extraLeft = Math.ceil(
            overflowDistance / halfWaveWidth
        );

        const extraRight = Math.ceil(
            overflowDistance / halfWaveWidth
        );

        const totalHalfWaves =
            visibleHalfWaves + extraLeft + extraRight;

        const startX = -extraLeft * halfWaveWidth;

        const firstDirection =
            extraLeft % 2 === 0 ? -1 : 1;

        let path = `M ${startX},${centerY}`;

        for (let index = 0; index < totalHalfWaves; index++) {
            const segmentStart =
                startX + index * halfWaveWidth;

            const segmentEnd =
                segmentStart + halfWaveWidth;

            const direction =
                index % 2 === 0
                    ? firstDirection
                    : -firstDirection;

            const peakY =
                centerY + direction * controlAmplitude;

            path += `
                C
                ${segmentStart + halfWaveWidth / 3},${peakY}
                ${segmentEnd - halfWaveWidth / 3},${peakY}
                ${segmentEnd},${centerY}
            `;
        }

        const estimatedSegmentLength =
            2 *
            Math.hypot(
                halfWaveWidth / 2,
                controlAmplitude
            ) *
            1.15;

        const estimatedLength =
            totalHalfWaves *
            Math.max(
                halfWaveWidth,
                estimatedSegmentLength
            );

        return {
            path,
            estimatedLength,
        };
    }, [
        widthPx,
        heightPx,
        waveFrequency,
        waveHeight,
        fontSizePx,
    ]);

    useLayoutEffect(() => {
        const pathElement = pathRef.current;
        if (!pathElement) return;

        try {
            const length = pathElement.getTotalLength();
            if (Number.isFinite(length) && length > 0) {
                setMeasuredPathLength(length);
            }
        } catch {
            setMeasuredPathLength(0);
        }
    }, [pathGeometry.path]);

    useLayoutEffect(() => {
        const twoUnits = measureTwoRef.current;
        const fourUnits = measureFourRef.current;

        if (!twoUnits || !fourUnits) return;

        try {
            const twoLength = twoUnits.getComputedTextLength();
            const fourLength = fourUnits.getComputedTextLength();
            const measuredUnit = (fourLength - twoLength) / 2;

            if (Number.isFinite(measuredUnit) && measuredUnit > 0) {
                setUnitWidth(measuredUnit);
            }
        } catch {
            setUnitWidth(0);
        }
    }, [
        repeatUnit,
        fontSizePx,
        letterSpacingPx,
        fontFamily,
        fontWeight,
        fontStyle,
    ]);

    const estimatedUnitWidth = Math.max(
        1,
        repeatUnit.length * fontSizePx * 0.6 +
            repeatUnit.length * letterSpacingPx
    );

    const effectiveUnitWidth =
        unitWidth > 0 ? unitWidth : estimatedUnitWidth;

    const effectivePathLength = Math.max(
        measuredPathLength,
        pathGeometry.estimatedLength
    );

    const repeatCount = clamp(
        Math.ceil(effectivePathLength / effectiveUnitWidth) + 5,
        3,
        300
    );

    const repeatedText = useMemo(
        () => repeatUnit.repeat(repeatCount),
        [repeatUnit, repeatCount]
    );

    speedRef.current = Math.max(0, speed) * 5;
    reversedRef.current = reversed;
    unitWidthRef.current = unitWidth;

    useEffect(() => {
        const mediaQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );

        const updatePreference = () => {
            reduceMotionRef.current = mediaQuery.matches;
        };

        updatePreference();

        mediaQuery.addEventListener("change", updatePreference);

        return () => {
            mediaQuery.removeEventListener("change", updatePreference);
        };
    }, []);

    // Mouse Interaction Handlers for Jitter and Scrubbing
    const handleMouseEnter = (e) => {
        if (!interactive) return;
        isHoveredRef.current = true;
        setIsHovered(true);
        jitterRef.current = 1.8;
        const rect = e.currentTarget.getBoundingClientRect();
        mousePosRef.current.prevX = e.clientX - rect.left;
        mousePosRef.current.prevY = e.clientY - rect.top;
    };

    const handleMouseMove = (e) => {
        if (!interactive) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        const dx = currentX - mousePosRef.current.prevX;

        // Interactive cursor velocity influences marquee scrub & jitter intensity
        mousePosRef.current.speedBoost = clamp(
            mousePosRef.current.speedBoost + dx * 1.2,
            -80,
            80
        );

        // Active cursor movement amplifies jitter vibration
        jitterRef.current = clamp(
            jitterRef.current + Math.abs(dx) * 0.35,
            1.5,
            5.5
        );

        mousePosRef.current.prevX = currentX;
        mousePosRef.current.prevY = currentY;
    };

    const handleMouseLeave = () => {
        if (!interactive) return;
        isHoveredRef.current = false;
        setIsHovered(false);
    };

    useEffect(() => {
        const animate = (currentTime) => {
            if (previousTimeRef.current === null) {
                previousTimeRef.current = currentTime;
            }

            const deltaTime = Math.min(
                (currentTime - previousTimeRef.current) / 1000,
                1 / 30
            );

            previousTimeRef.current = currentTime;

            const pathElement = textPathRef.current;
            const currentUnitWidth = unitWidthRef.current;

            if (
                pathElement &&
                currentUnitWidth > 0 &&
                speedRef.current > 0 &&
                !reduceMotionRef.current
            ) {
                const direction = reversedRef.current ? 1 : -1;

                // Decay cursor speed boost smoothly
                mousePosRef.current.speedBoost *= 0.88;

                // Electric jitter decay / sustain
                if (isHoveredRef.current) {
                    jitterRef.current = Math.max(
                        1.5,
                        jitterRef.current * 0.94
                    );
                } else {
                    jitterRef.current *= 0.82;
                }

                const activeSpeed =
                    speedRef.current +
                    (isHoveredRef.current ? mousePosRef.current.speedBoost : 0);

                let nextOffset =
                    offsetRef.current +
                    direction * activeSpeed * deltaTime;

                nextOffset -=
                    Math.floor(nextOffset / currentUnitWidth) *
                    currentUnitWidth;

                offsetRef.current = nextOffset;

                // Calculate random electric jitter displacement when hovered
                const currentJitter =
                    jitterRef.current > 0.1
                        ? (Math.random() - 0.5) * jitterRef.current * 2
                        : 0;

                pathElement.setAttribute(
                    "startOffset",
                    `${nextOffset + currentJitter}px`
                );
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            previousTimeRef.current = null;
        };
    }, []);

    const effectiveMinHeight =
        minHeight !== undefined
            ? toDimension(minHeight, "0px")
            : height === "100vh"
            ? "240px"
            : undefined;

    const fillValue =
        textColor === "gradient" ? `url(#${gradientId})` : textColor;

    return (
        <div
            ref={containerRef}
            className={`wave-marquee-container ${className || ""}`}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                position: "relative",
                width: toDimension(width, "100%"),
                height: toDimension(height, "100%"),
                minHeight: effectiveMinHeight,
                overflow: "hidden",
                background,
                boxSizing: "border-box",
                cursor: interactive ? "pointer" : "default",
                transition: "filter 0.25s ease, transform 0.25s ease",
                filter: isHovered
                    ? "drop-shadow(0 0 8px rgba(229, 9, 20, 0.9)) drop-shadow(0 0 16px rgba(255, 77, 77, 0.6))"
                    : "none",
                ...style,
            }}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox={`0 0 ${widthPx} ${heightPx}`}
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                }}
                aria-label={text}
                role="img"
            >
                <defs>
                    <path
                        ref={pathRef}
                        id={pathId}
                        d={pathGeometry.path}
                        fill="none"
                    />
                    <linearGradient
                        id={gradientId}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                    >
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="45%" stopColor="#ff4d4d" />
                        <stop offset="100%" stopColor="#e50914" />
                    </linearGradient>
                </defs>

                <text
                    ref={measureTwoRef}
                    x="0"
                    y="-9999"
                    xmlSpace="preserve"
                    style={{
                        visibility: "hidden",
                        pointerEvents: "none",
                        fontFamily,
                        fontSize: `${fontSizePx}px`,
                        fontWeight,
                        fontStyle,
                        letterSpacing: `${letterSpacingPx}px`,
                    }}
                >
                    {repeatUnit.repeat(2)}
                </text>

                <text
                    ref={measureFourRef}
                    x="0"
                    y="-9999"
                    xmlSpace="preserve"
                    style={{
                        visibility: "hidden",
                        pointerEvents: "none",
                        fontFamily,
                        fontSize: `${fontSizePx}px`,
                        fontWeight,
                        fontStyle,
                        letterSpacing: `${letterSpacingPx}px`,
                    }}
                >
                    {repeatUnit.repeat(4)}
                </text>

                <text
                    fill={fillValue}
                    xmlSpace="preserve"
                    style={{
                        fontFamily,
                        fontSize: `${fontSizePx}px`,
                        fontWeight,
                        fontStyle,
                        letterSpacing: `${letterSpacingPx}px`,
                        userSelect: "none",
                        transition: "filter 0.2s ease",
                    }}
                >
                    <textPath
                        ref={textPathRef}
                        href={`#${pathId}`}
                        startOffset="0"
                    >
                        {repeatedText}
                    </textPath>
                </text>
            </svg>
        </div>
    );
}

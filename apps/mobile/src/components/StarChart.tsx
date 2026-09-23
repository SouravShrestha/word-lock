import { useMemo, useState } from "react";
import { Text, View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import type { StarPoint } from "@word-lock/core/game";
import { colors } from "@word-lock/tokens/native";

import { useTheme } from "@/theme/ThemeProvider";

const HEIGHT = 224;
const Y_AXIS_WIDTH = 34;
const X_AXIS_HEIGHT = 24;
const CHART_PAD_TOP = 8;
const CHART_PAD_RIGHT = 8;
const GRID_COLS = 3;
const FONT_SIZE = 9;

export function StarChart({ points }: { points: StarPoint[] }) {
  const { resolvedTheme } = useTheme();
  const palette = colors[resolvedTheme];
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onLayout = (event: LayoutChangeEvent) => {
    const next = Math.floor(event.nativeEvent.layout.width);
    setWidth((current) => (current === next ? current : next));
  };

  const data = useMemo(
    () => points.map((p) => ({ x: new Date(p.t).getTime(), stars: p.stars })),
    [points],
  );

  const domain = useMemo(() => starDomain(points), [points]);
  const ticks = useMemo(() => timeTicks(data.map((d) => d.x)), [data]);
  const yTicks = useMemo(() => starTicks(domain), [domain]);
  const withYear = useMemo(() => spansYears(data.map((d) => d.x)), [data]);

  if (width === 0) {
    return <View style={{ height: HEIGHT }} onLayout={onLayout} />;
  }

  const chartWidth = width - Y_AXIS_WIDTH - CHART_PAD_RIGHT;
  const chartHeight = HEIGHT - X_AXIS_HEIGHT - CHART_PAD_TOP;

  const [low, high] = domain;
  const valueSpan = high - low || 1;

  const xs = data.map((d) => d.x);
  const xMin = xs[0];
  const xMax = xs[xs.length - 1];
  const xSpan = xMax - xMin || 1;

  const toX = (xVal: number) => Y_AXIS_WIDTH + ((xVal - xMin) / xSpan) * chartWidth;
  const toY = (stars: number) =>
    CHART_PAD_TOP + chartHeight - ((stars - low) / valueSpan) * chartHeight;

  const coords = data.map((d) => ({ x: toX(d.x), y: toY(d.stars) }));

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = [
    linePath,
    `L ${coords[coords.length - 1].x} ${CHART_PAD_TOP + chartHeight}`,
    `L ${coords[0].x} ${CHART_PAD_TOP + chartHeight}`,
    "Z",
  ].join(" ");

  const lineColor = palette.sky;
  const hairline = palette.hairline;
  const mutedFg = palette.mutedForeground;
  const bg = palette.background;

  const gridXPositions = Array.from(
    { length: GRID_COLS + 1 },
    (_, i) => Y_AXIS_WIDTH + (i / GRID_COLS) * chartWidth,
  );
  const gridYPositions = yTicks.map((t) => toY(t));

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((e) => {
      const touchX = e.x - Y_AXIS_WIDTH;
      if (touchX < 0 || touchX > chartWidth) {
        setActiveIndex(null);
        return;
      }
      const idx = Math.round((touchX / chartWidth) * (coords.length - 1));
      setActiveIndex(Math.max(0, Math.min(coords.length - 1, idx)));
    })
    .onEnd(() => setActiveIndex(null));

  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => {
      const touchX = e.x - Y_AXIS_WIDTH;
      if (touchX < 0 || touchX > chartWidth) {
        setActiveIndex(null);
        return;
      }
      const next = Math.max(
        0,
        Math.min(coords.length - 1, Math.round((touchX / chartWidth) * (coords.length - 1))),
      );
      setActiveIndex((prev) => (prev === next ? null : next));
    });

  const composed = Gesture.Simultaneous(panGesture, tapGesture);

  const activePoint = activeIndex !== null ? data[activeIndex] : null;
  const activeCoord = activeIndex !== null ? coords[activeIndex] : null;

  return (
    <View style={{ height: HEIGHT }} onLayout={onLayout}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GestureDetector gesture={composed}>
          <View style={{ flex: 1 }}>
            <Svg width={width} height={HEIGHT}>
              <Defs>
                <LinearGradient id="starChartFade" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
                  <Stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                </LinearGradient>
              </Defs>

              {gridXPositions.map((x, i) => (
                <Line
                  key={`gc-${i}`}
                  x1={x}
                  y1={CHART_PAD_TOP}
                  x2={x}
                  y2={CHART_PAD_TOP + chartHeight}
                  stroke={hairline}
                  strokeWidth={1}
                  strokeDasharray="2 4"
                />
              ))}

              {gridYPositions.map((y, i) => (
                <Line
                  key={`gr-${i}`}
                  x1={Y_AXIS_WIDTH}
                  y1={y}
                  x2={Y_AXIS_WIDTH + chartWidth}
                  y2={y}
                  stroke={hairline}
                  strokeWidth={1}
                  strokeDasharray="2 4"
                />
              ))}

              <Path d={areaPath} fill="url(#starChartFade)" />

              <Path
                d={linePath}
                stroke={lineColor}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {activeCoord && (
                <>
                  <Line
                    x1={activeCoord.x}
                    y1={CHART_PAD_TOP}
                    x2={activeCoord.x}
                    y2={CHART_PAD_TOP + chartHeight}
                    stroke={hairline}
                    strokeWidth={1}
                  />
                  <Circle
                    cx={activeCoord.x}
                    cy={activeCoord.y}
                    r={5}
                    fill={lineColor}
                    stroke={bg}
                    strokeWidth={2}
                  />
                </>
              )}

              {yTicks.map((t, i) => (
                <SvgText
                  key={`yt-${i}`}
                  x={Y_AXIS_WIDTH - 4}
                  y={toY(t) + FONT_SIZE / 3}
                  textAnchor="end"
                  fontSize={FONT_SIZE}
                  fill={mutedFg}
                >
                  {t}
                </SvgText>
              ))}

              {ticks.map((t, i) => (
                <SvgText
                  key={`xt-${i}`}
                  x={toX(t)}
                  y={CHART_PAD_TOP + chartHeight + 16}
                  textAnchor="middle"
                  fontSize={FONT_SIZE}
                  fill={mutedFg}
                >
                  {formatTick(t, withYear)}
                </SvgText>
              ))}
            </Svg>

            {activePoint && activeCoord && (
              <TooltipBubble
                point={activePoint}
                coordX={activeCoord.x}
                coordY={activeCoord.y}
                totalWidth={width}
                bg={bg}
                fg={palette.foreground}
              />
            )}
          </View>
        </GestureDetector>
      </GestureHandlerRootView>
    </View>
  );
}

function TooltipBubble({
  point,
  coordX,
  coordY,
  totalWidth,
  fg,
  bg,
}: {
  point: { x: number; stars: number };
  coordX: number;
  coordY: number;
  totalWidth: number;
  fg: string;
  bg: string;
}) {
  const TW = 130;
  const TH = 32;
  const GAP = 8;

  let left = coordX - TW / 2;
  if (left < 0) left = 0;
  if (left + TW > totalWidth) left = totalWidth - TW;

  let top = coordY - TH - GAP;
  if (top < CHART_PAD_TOP) top = coordY + GAP + 4;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top,
        left,
        paddingHorizontal: 12,
        paddingVertical: 7,
        backgroundColor: fg,
        borderRadius: 12,
        alignContent: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          color: bg,
          fontVariant: ["tabular-nums"],
          textAlign: "center",
          fontWeight: "600",
        }}
        numberOfLines={1}
      >
        {new Date(point.x).toLocaleDateString()}
        {": "}
        <Text style={{ fontWeight: "800", fontSize: 13 }}>{point.stars}</Text>
      </Text>
    </View>
  );
}

function timeTicks(xs: number[], count = 3): number[] {
  if (xs.length < 2) return xs;
  const first = xs[0];
  const span = xs[xs.length - 1] - first;
  if (span <= 0) return [first];
  const step = span / count;
  return Array.from({ length: count }, (_, i) => Math.round(first + step * (i + 0.5)));
}

function starTicks([low, high]: [number, number], count = 4): number[] {
  const step = (high - low) / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round(low + step * i));
}

function spansYears(xs: number[]): boolean {
  if (xs.length < 2) return false;
  return new Date(xs[0]).getFullYear() !== new Date(xs[xs.length - 1]).getFullYear();
}

function formatTick(value: number, withYear: boolean): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

function starDomain(points: StarPoint[]): [number, number] {
  if (points.length === 0) return [0, 100];
  const values = points.map((p) => p.stars);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const pad = Math.max(20, (high - low) * 0.25);
  return [Math.max(0, Math.floor((low - pad) / 10) * 10), Math.ceil((high + pad) / 10) * 10];
}

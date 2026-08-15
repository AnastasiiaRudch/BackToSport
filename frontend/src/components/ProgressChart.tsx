import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, {
  Polyline,
  Line,
  Circle,
  Text as SvgText,
  Rect,
} from "react-native-svg";
import { colors, fonts, zoneColor } from "@/src/theme";

export type ProgressPoint = { value: number; zone: string; label: string };

export function ProgressChart({
  data,
  width,
}: {
  data: ProgressPoint[];
  width: number;
}) {
  const height = 200;
  const padLeft = 30;
  const padRight = 14;
  const padTop = 18;
  const padBottom = 28;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const xFor = (i: number) =>
    data.length === 1
      ? padLeft + plotW / 2
      : padLeft + (plotW * i) / (data.length - 1);
  const yFor = (v: number) => padTop + plotH * (1 - Math.max(0, Math.min(100, v)) / 100);

  const linePoints = data.map((d, i) => `${xFor(i)},${yFor(d.value)}`).join(" ");

  // Zone bands (0-75 red, 75-90 yellow, 90-100 green)
  const bands = [
    { from: 90, to: 100, color: "rgba(0,230,118,0.10)" },
    { from: 75, to: 90, color: "rgba(255,234,0,0.08)" },
    { from: 0, to: 75, color: "rgba(255,23,68,0.06)" },
  ];

  return (
    <View>
      <Svg width={width} height={height}>
        {bands.map((b, i) => {
          const y = yFor(b.to);
          const h = yFor(b.from) - yFor(b.to);
          return (
            <Rect
              key={i}
              x={padLeft}
              y={y}
              width={plotW}
              height={h}
              fill={b.color}
            />
          );
        })}

        {/* threshold lines */}
        {[90, 75].map((t) => (
          <Line
            key={t}
            x1={padLeft}
            y1={yFor(t)}
            x2={padLeft + plotW}
            y2={yFor(t)}
            stroke={colors.divider}
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}

        {/* y labels */}
        {[0, 50, 75, 90, 100].map((t) => (
          <SvgText
            key={t}
            x={padLeft - 6}
            y={yFor(t) + 3}
            fill={colors.onSurfaceTertiary}
            fontSize={9}
            fontFamily={fonts.textRegular}
            textAnchor="end"
          >
            {t}
          </SvgText>
        ))}

        {/* line */}
        {data.length > 1 && (
          <Polyline
            points={linePoints}
            fill="none"
            stroke={colors.brandPrimary}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* dots + score labels + date labels */}
        {data.map((d, i) => {
          const cx = xFor(i);
          const cy = yFor(d.value);
          const zc = zoneColor(d.zone);
          return (
            <React.Fragment key={i}>
              <Circle cx={cx} cy={cy} r={5} fill={zc} stroke={colors.surface} strokeWidth={2} />
              <SvgText
                x={cx}
                y={cy - 12}
                fill={zc}
                fontSize={12}
                fontFamily={fonts.displaySemi}
                textAnchor="middle"
              >
                {Math.round(d.value)}
              </SvgText>
              <SvgText
                x={cx}
                y={height - 8}
                fill={colors.onSurfaceTertiary}
                fontSize={9}
                fontFamily={fonts.textRegular}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={styles.legend}>
        <LegendDot color={colors.success} label="Зелёная" />
        <LegendDot color={colors.warning} label="Жёлтая" />
        <LegendDot color={colors.error} label="Красная" />
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 8,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: colors.onSurfaceTertiary, fontFamily: fonts.textRegular, fontSize: 11 },
});

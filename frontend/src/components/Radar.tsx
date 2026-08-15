import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Polygon, Line, Circle, Text as SvgText } from "react-native-svg";
import { colors, fonts } from "@/src/theme";

type Axis = { axis: string; value: number };

export function Radar({
  data,
  size = 300,
}: {
  data: Axis[];
  size?: number;
}) {
  const n = data.length;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 46;
  const levels = [0.25, 0.5, 0.75, 1];

  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const pointFor = (i: number, ratio: number) => {
    const a = angleFor(i);
    return {
      x: cx + maxR * ratio * Math.cos(a),
      y: cy + maxR * ratio * Math.cos(a - Math.PI / 2) * 0 + maxR * ratio * Math.sin(a),
    };
  };

  const gridPolygon = (ratio: number) =>
    data
      .map((_, i) => {
        const p = pointFor(i, ratio);
        return `${p.x},${p.y}`;
      })
      .join(" ");

  const valuePolygon = data
    .map((d, i) => {
      const p = pointFor(i, Math.max(0, Math.min(100, d.value)) / 100);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size}>
        {levels.map((lv, idx) => (
          <Polygon
            key={idx}
            points={gridPolygon(lv)}
            fill="none"
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}
        {data.map((_, i) => {
          const p = pointFor(i, 1);
          return (
            <Line
              key={`ax-${i}`}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke={colors.divider}
              strokeWidth={1}
            />
          );
        })}
        <Polygon
          points={valuePolygon}
          fill={colors.brandPrimary}
          fillOpacity={0.25}
          stroke={colors.brandPrimary}
          strokeWidth={2}
        />
        {data.map((d, i) => {
          const p = pointFor(i, Math.max(0, Math.min(100, d.value)) / 100);
          return (
            <Circle key={`pt-${i}`} cx={p.x} cy={p.y} r={4} fill={colors.brandPrimary} />
          );
        })}
        {data.map((d, i) => {
          const lp = pointFor(i, 1.18);
          return (
            <SvgText
              key={`lb-${i}`}
              x={lp.x}
              y={lp.y}
              fill={colors.onSurfaceSecondary}
              fontSize={11}
              fontFamily={fonts.textMedium}
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {d.axis}
            </SvgText>
          );
        })}
      </Svg>
      <View style={styles.legendRow}>
        {data.map((d) => (
          <View key={d.axis} style={styles.legendItem}>
            <Text style={styles.legendVal}>{Math.round(d.value)}</Text>
            <Text style={styles.legendLabel}>{d.axis}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
  },
  legendItem: { alignItems: "center", minWidth: 54 },
  legendVal: {
    fontFamily: fonts.displaySemi,
    fontSize: 18,
    color: colors.brandPrimary,
  },
  legendLabel: {
    fontFamily: fonts.textRegular,
    fontSize: 10,
    color: colors.onSurfaceTertiary,
  },
});

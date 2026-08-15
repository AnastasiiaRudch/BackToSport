import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { colors, fonts, zoneColor, zoneLabel } from "@/src/theme";

export function Gauge({
  score,
  zone,
  size = 220,
}: {
  score: number;
  zone: string;
  size?: number;
}) {
  const stroke = 16;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = circumference * pct;
  const color = zoneColor(zone);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${cx}, ${cy}`}>
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={colors.surfaceTertiary}
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${dash}, ${circumference}`}
          />
        </G>
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.score, { color }]}>{Math.round(score)}</Text>
        <Text style={styles.pct}>RTS SCORE</Text>
        <View style={[styles.zoneBadge, { borderColor: color }]}>
          <Text style={[styles.zoneText, { color }]}>{zoneLabel(zone)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: "absolute", alignItems: "center" },
  score: { fontFamily: fonts.displayBold, fontSize: 64, lineHeight: 68 },
  pct: {
    fontFamily: fonts.textMedium,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.onSurfaceSecondary,
    marginTop: -2,
  },
  zoneBadge: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  zoneText: { fontFamily: fonts.textSemi, fontSize: 12 },
});

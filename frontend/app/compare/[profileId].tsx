import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, radius, fonts, zoneColor } from "@/src/theme";
import { api, Assessment } from "@/src/api";
import { useI18n } from "@/src/i18n";

const COMPONENT_KEYS = ["psychology", "rom", "strength_lsi", "functional_lsi", "sport_specific"];
const METRIC_KEYS = ["flexion", "abduction", "er_rom", "ir_rom", "ash_i", "ash_y", "ash_t", "er_str", "ir_str", "ckcuest", "ybt", "mbt"];

function fmtShort(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
  } catch {
    return iso;
  }
}

function DeltaRow({
  label,
  a,
  b,
}: {
  label: string;
  a: number;
  b: number;
}) {
  const delta = Math.round(b) - Math.round(a);
  const color = delta > 0 ? colors.success : delta < 0 ? colors.error : colors.onSurfaceTertiary;
  const icon = delta > 0 ? "arrow-up" : delta < 0 ? "arrow-down" : "remove";
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel} numberOfLines={1}>{label}</Text>
      <View style={styles.rowVals}>
        <Text style={styles.valA}>{Math.round(a)}</Text>
        <Ionicons name="chevron-forward" size={12} color={colors.onSurfaceTertiary} />
        <Text style={styles.valB}>{Math.round(b)}</Text>
        <View style={[styles.deltaChip, { borderColor: color }]}>
          <Ionicons name={icon as any} size={11} color={color} />
          <Text style={[styles.deltaText, { color }]}>{Math.abs(delta)}</Text>
        </View>
      </View>
    </View>
  );
}

function Selector({
  label,
  items,
  selectedId,
  onSelect,
  testID,
}: {
  label: string;
  items: Assessment[];
  selectedId: string;
  onSelect: (id: string) => void;
  testID: string;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={styles.selLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: 2 }}
      >
        {items.map((it) => {
          const active = it.assessment_id === selectedId;
          const zc = zoneColor(it.zone);
          return (
            <Pressable
              key={it.assessment_id}
              testID={`${testID}-${it.assessment_id}`}
              onPress={() => onSelect(it.assessment_id)}
              style={[styles.selChip, active && styles.selChipActive]}
            >
              <Text style={[styles.selScore, { color: active ? colors.onBrandPrimary : zc }]}>
                {Math.round(it.rts_score)}
              </Text>
              <Text style={[styles.selDate, active && { color: colors.onBrandPrimary }]}>
                {fmtShort(it.created_at)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function Compare() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const { profileId } = useLocalSearchParams<{ profileId: string }>();

  const [items, setItems] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [aId, setAId] = useState<string>("");
  const [bId, setBId] = useState<string>("");

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ assessments: Assessment[] }>(`/assessments?profile_id=${profileId}`);
      setItems(res.assessments);
      if (res.assessments.length >= 2) {
        setBId(res.assessments[0].assessment_id); // latest
        setAId(res.assessments[1].assessment_id); // previous
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }, [profileId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const A = useMemo(() => items.find((i) => i.assessment_id === aId), [items, aId]);
  const B = useMemo(() => items.find((i) => i.assessment_id === bId), [items, bId]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="compare-back" onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("compare.title")}</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : items.length < 2 ? (
        <View style={styles.loader}>
          <Ionicons name="git-compare-outline" size={44} color={colors.onSurfaceTertiary} />
          <Text style={styles.needTwo}>{t("compare.needTwo")}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 40, gap: spacing.lg }}
          showsVerticalScrollIndicator={false}
        >
          <Selector label={t("compare.base")} items={items} selectedId={aId} onSelect={setAId} testID="sel-a" />
          <Selector label={t("compare.comp")} items={items} selectedId={bId} onSelect={setBId} testID="sel-b" />

          {A && B && (
            <>
              <View style={styles.rtsCard}>
                <Text style={styles.rtsLabel}>{t("compare.rts")}</Text>
                <View style={styles.rtsRow}>
                  <View style={styles.rtsSide}>
                    <Text style={[styles.rtsVal, { color: zoneColor(A.zone) }]}>{Math.round(A.rts_score)}</Text>
                    <Text style={styles.rtsDate}>{fmtShort(A.created_at)}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={22} color={colors.onSurfaceTertiary} />
                  <View style={styles.rtsSide}>
                    <Text style={[styles.rtsVal, { color: zoneColor(B.zone) }]}>{Math.round(B.rts_score)}</Text>
                    <Text style={styles.rtsDate}>{fmtShort(B.created_at)}</Text>
                  </View>
                  {(() => {
                    const d = Math.round(B.rts_score) - Math.round(A.rts_score);
                    const color = d > 0 ? colors.success : d < 0 ? colors.error : colors.onSurfaceTertiary;
                    const word = d > 0 ? t("compare.improved") : d < 0 ? t("compare.declined") : t("compare.same");
                    return (
                      <View style={[styles.rtsDelta, { backgroundColor: color }]}>
                        <Text style={styles.rtsDeltaVal}>{d > 0 ? `+${d}` : d}</Text>
                        <Text style={styles.rtsDeltaWord}>{word}</Text>
                      </View>
                    );
                  })()}
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t("compare.components")}</Text>
                <View style={{ marginTop: spacing.sm }}>
                  {COMPONENT_KEYS.map((k) => (
                    <DeltaRow key={k} label={t(`comp.${k}`)} a={A.components[k] ?? 0} b={B.components[k] ?? 0} />
                  ))}
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t("compare.metrics")}</Text>
                <View style={{ marginTop: spacing.sm }}>
                  {METRIC_KEYS.filter((k) => (A.detail_lsi?.[k] != null) || (B.detail_lsi?.[k] != null)).map((k) => (
                    <DeltaRow key={k} label={t(`weak.${k}`)} a={A.detail_lsi?.[k] ?? 0} b={B.detail_lsi?.[k] ?? 0} />
                  ))}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  loader: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl },
  needTwo: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 15, textAlign: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: { color: colors.onSurface, fontFamily: fonts.displaySemi, fontSize: 20 },
  selLabel: { color: colors.onSurfaceSecondary, fontFamily: fonts.textMedium, fontSize: 13 },
  selChip: {
    minWidth: 64,
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selChipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  selScore: { fontFamily: fonts.displayBold, fontSize: 22 },
  selDate: { color: colors.onSurfaceTertiary, fontFamily: fonts.textRegular, fontSize: 11, marginTop: 1 },
  rtsCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rtsLabel: { color: colors.onSurfaceSecondary, fontFamily: fonts.textMedium, fontSize: 13, marginBottom: spacing.md },
  rtsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  rtsSide: { alignItems: "center" },
  rtsVal: { fontFamily: fonts.displayBold, fontSize: 40, lineHeight: 42 },
  rtsDate: { color: colors.onSurfaceTertiary, fontFamily: fonts.textRegular, fontSize: 11 },
  rtsDelta: { borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, alignItems: "center", minWidth: 72 },
  rtsDeltaVal: { color: colors.onSuccess, fontFamily: fonts.displayBold, fontSize: 22 },
  rtsDeltaWord: { color: colors.onSuccess, fontFamily: fonts.textMedium, fontSize: 10 },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { color: colors.onSurface, fontFamily: fonts.displaySemi, fontSize: 18 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.sm,
  },
  rowLabel: { flex: 1, color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 13 },
  rowVals: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  valA: { color: colors.onSurfaceTertiary, fontFamily: fonts.displaySemi, fontSize: 16, minWidth: 26, textAlign: "right" },
  valB: { color: colors.onSurface, fontFamily: fonts.displaySemi, fontSize: 16, minWidth: 26, textAlign: "right" },
  deltaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 40,
    justifyContent: "center",
  },
  deltaText: { fontFamily: fonts.textSemi, fontSize: 12 },
});

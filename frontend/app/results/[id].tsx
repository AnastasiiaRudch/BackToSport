import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { colors, spacing, radius, fonts, zoneColor } from "@/src/theme";
import { Gauge } from "@/src/components/Gauge";
import { Radar } from "@/src/components/Radar";
import { Button, Card } from "@/src/components/ui";
import { api, Assessment, Profile } from "@/src/api";
import { generateReportHtml } from "@/src/report";
import { useI18n } from "@/src/i18n";

const COMPONENT_KEYS = ["psychology", "rom", "strength_lsi", "functional_lsi", "sport_specific"];

export default function Results() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lang, isRTL } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [a, setA] = useState<Assessment | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<{ assessment: Assessment }>(`/assessments/${id}`);
        setA(res.assessment);
        try {
          const pr = await api.get<{ profile: Profile }>(`/profiles/${res.assessment.profile_id}`);
          setProfile(pr.profile);
        } catch {}
      } catch {}
      finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const shareReport = async () => {
    if (!a) return;
    setShareMsg(null);
    setSharing(true);
    try {
      if (Platform.OS === "web") {
        setShareMsg(t("results.shareWeb"));
        return;
      }
      const html = generateReportHtml(a, profile, { t, lang, isRTL });
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: t("results.share"),
          UTI: "com.adobe.pdf",
        });
      } else {
        setShareMsg(t("results.shareUnavail"));
      }
    } catch (e) {
      setShareMsg(t("results.shareFail"));
    } finally {
      setSharing(false);
    }
  };

  if (loading || !a) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }

  const zc = zoneColor(a.zone);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          testID="results-back"
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {a.profile_name}
        </Text>
        <Pressable testID="results-share-header" onPress={shareReport} hitSlop={12} disabled={sharing}>
          <Ionicons name="share-outline" size={22} color={colors.brandPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 60, gap: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Gauge */}
        <Card style={styles.gaugeCard}>
          <Gauge score={a.rts_score} zone={a.zone} />
          <View style={[styles.adviceBox, { borderColor: zc }]}>
            <Text style={[styles.adviceText, { color: zc }]}>{t(`zoneAdvice.${a.zone}`)}</Text>
          </View>
          <Button
            testID="share-report-button"
            title={t("results.share")}
            variant="secondary"
            loading={sharing}
            onPress={shareReport}
            icon={<Ionicons name="document-text-outline" size={18} color={colors.onSurface} />}
            style={{ width: "100%" }}
          />
          {shareMsg ? <Text style={styles.shareMsg} testID="share-msg">{shareMsg}</Text> : null}
        </Card>

        {/* Radar */}
        <Card>
          <Text style={styles.sectionTitle}>{t("results.balance")}</Text>
          <View style={{ alignItems: "center", marginTop: spacing.sm }}>
            <Radar data={a.radar.map((r) => ({ ...r, axis: r.key ? t(`axis.${r.key}`) : r.axis }))} />
          </View>
        </Card>

        {/* Components */}
        <Card>
          <Text style={styles.sectionTitle}>{t("results.components")}</Text>
          <View style={{ marginTop: spacing.md, gap: spacing.md }}>
            {COMPONENT_KEYS.map((key) => {
              const val = a.components[key] ?? 0;
              return (
                <View key={key}>
                  <View style={styles.compRow}>
                    <Text style={styles.compLabel}>{t(`comp.${key}`)}</Text>
                    <Text style={styles.compVal}>{Math.round(val)}%</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.max(2, Math.min(100, val))}%`,
                          backgroundColor: val >= 90 ? colors.success : val >= 75 ? colors.warning : colors.error,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
          {a.er_ir_ratio?.operated != null && (
            <View style={styles.ratioRow}>
              <Text style={styles.ratioLabel}>{t("results.ratio")}</Text>
              <Text style={styles.ratioVal}>
                {t("results.ratioOp")} {a.er_ir_ratio.operated} · {t("results.ratioHe")} {a.er_ir_ratio.healthy ?? "—"}
              </Text>
            </View>
          )}
        </Card>

        {/* Weak links */}
        <Card>
          <Text style={styles.sectionTitle}>{t("results.weakLinks")}</Text>
          {a.weak_links.length === 0 ? (
            <View style={styles.noWeak}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={styles.noWeakText}>{t("results.noWeak")}</Text>
            </View>
          ) : (
            <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
              {a.weak_links.map((w, i) => (
                <View key={i} style={styles.weakRow}>
                  <Ionicons name="alert-circle" size={18} color={colors.error} />
                  <Text style={styles.weakName}>{w.key ? t(`weak.${w.key}`) : w.name}</Text>
                  {w.deficit != null ? (
                    <Text style={styles.weakDeficit}>−{Math.round(w.deficit)}%</Text>
                  ) : (
                    <Text style={styles.weakFlag}>{t("results.risk")}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Roadmap */}
        <Card>
          <View style={styles.roadmapHead}>
            <Text style={styles.sectionTitle}>{t("results.roadmap")}</Text>
            {a.roadmap.ai_generated ? (
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={12} color={colors.onBrandPrimary} />
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.roadmapSummary}>{a.roadmap.summary}</Text>
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            {a.roadmap.exercises.map((ex, i) => (
              <View key={i} style={styles.exCard}>
                <View style={styles.exNum}>
                  <Text style={styles.exNumText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exTitle}>{ex.title}</Text>
                  <Text style={styles.exDesc}>{ex.description}</Text>
                  {ex.target ? <Text style={styles.exTarget}>{ex.target}</Text> : null}
                </View>
              </View>
            ))}
          </View>
          <View style={styles.retestRow}>
            <Ionicons name="calendar" size={18} color={colors.brandPrimary} />
            <Text style={styles.retestText}>
              {t("results.retest")} <Text style={styles.retestDate}>{a.roadmap.retest_date}</Text>
            </Text>
          </View>
        </Card>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="medical" size={16} color={colors.warning} />
          <Text style={styles.disclaimerText}>
            {t("results.disclaimer")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  loader: { flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.md,
  },
  headerTitle: { flex: 1, textAlign: "center", color: colors.onSurface, fontFamily: fonts.displaySemi, fontSize: 20 },
  gaugeCard: { alignItems: "center", gap: spacing.md },
  adviceBox: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, width: "100%" },
  adviceText: { fontFamily: fonts.textSemi, fontSize: 14, textAlign: "center" },
  shareMsg: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 12, textAlign: "center" },
  sectionTitle: { color: colors.onSurface, fontFamily: fonts.displaySemi, fontSize: 19 },
  compRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  compLabel: { color: colors.onSurfaceSecondary, fontFamily: fonts.textMedium, fontSize: 13 },
  compVal: { color: colors.onSurface, fontFamily: fonts.displaySemi, fontSize: 16 },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceTertiary, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
  ratioRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratioLabel: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 12, flex: 1 },
  ratioVal: { color: colors.onSurface, fontFamily: fonts.textSemi, fontSize: 12 },
  noWeak: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  noWeakText: { flex: 1, color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 14 },
  weakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceTertiary,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  weakName: { flex: 1, color: colors.onSurface, fontFamily: fonts.textMedium, fontSize: 13 },
  weakDeficit: { color: colors.error, fontFamily: fonts.displaySemi, fontSize: 15 },
  weakFlag: { color: colors.error, fontFamily: fonts.textSemi, fontSize: 12 },
  roadmapHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  aiBadgeText: { color: colors.onBrandPrimary, fontFamily: fonts.textSemi, fontSize: 11 },
  roadmapSummary: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 14, lineHeight: 20, marginTop: spacing.sm },
  exCard: { flexDirection: "row", gap: spacing.md, backgroundColor: colors.surfaceTertiary, padding: spacing.md, borderRadius: radius.md },
  exNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" },
  exNumText: { color: colors.onBrandPrimary, fontFamily: fonts.displayBold, fontSize: 15 },
  exTitle: { color: colors.onSurface, fontFamily: fonts.textSemi, fontSize: 14 },
  exDesc: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 13, lineHeight: 18, marginTop: 2 },
  exTarget: { color: colors.brandPrimary, fontFamily: fonts.textMedium, fontSize: 12, marginTop: 4 },
  retestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  retestText: { color: colors.onSurface, fontFamily: fonts.textMedium, fontSize: 14 },
  retestDate: { fontFamily: fonts.displaySemi, color: colors.brandPrimary },
  disclaimer: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disclaimerText: { flex: 1, color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 12, lineHeight: 18 },
});

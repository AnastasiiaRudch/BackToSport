import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { colors, spacing, radius, fonts, zoneColor } from "@/src/theme";
import { ProLocked } from "@/src/components/ui";
import { api, Assessment } from "@/src/api";
import { useAuth } from "@/src/auth";
import { useI18n } from "@/src/i18n";

function parseRetest(s?: string): Date | null {
  if (!s) return null;
  const m = s.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const [items, setItems] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ assessments: Assessment[] }>("/assessments");
      // latest assessment per profile that has a retest_date
      const byProfile: Record<string, Assessment> = {};
      for (const a of res.assessments) {
        if (!byProfile[a.profile_id]) byProfile[a.profile_id] = a;
      }
      const list = Object.values(byProfile).filter((a) => parseRetest(a.retest_date));
      list.sort((a, b) => (parseRetest(a.retest_date)!.getTime() - parseRetest(b.retest_date)!.getTime()));
      setItems(list);
    } catch {}
    finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("calendar.title")}</Text>
          <Text style={styles.subtitle}>{t("calendar.subtitle")}</Text>
        </View>
        <View style={styles.proBadge}>
          <Ionicons name="star" size={11} color={colors.onBrandPrimary} />
          <Text style={styles.proBadgeText}>{t("pro.badge")}</Text>
        </View>
      </View>
    </View>
  );

  if (!user?.is_pro) {
    return (
      <View style={styles.root}>
        {Header}
        <ProLocked
          testID="calendar-locked"
          title={t("pro.lockedTitle")}
          text={t("pro.lockedText")}
          cta={t("pro.unlock")}
          onPress={() => router.push("/upgrade")}
        />
      </View>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <View style={styles.root}>
      {Header}
      {loading ? (
        <View style={styles.loader}><ActivityIndicator color={colors.brandPrimary} size="large" /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => a.assessment_id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 80, gap: spacing.md }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const d = parseRetest(item.retest_date)!;
            const days = Math.round((d.getTime() - today.getTime()) / 86400000);
            const overdue = days < 0;
            const statusColor = overdue ? colors.error : days <= 3 ? colors.warning : colors.brandPrimary;
            const statusText = overdue
              ? t("calendar.overdueBy", { n: Math.abs(days) })
              : days === 0
              ? t("calendar.today")
              : t("calendar.daysLeft", { n: days });
            return (
              <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
                <Pressable
                  testID={`calendar-item-${item.assessment_id}`}
                  style={styles.card}
                  onPress={() => router.push(`/results/${item.assessment_id}`)}
                >
                  <View style={[styles.dateBox, { borderColor: statusColor }]}>
                    <Text style={[styles.dateDay, { color: statusColor }]}>{String(d.getDate()).padStart(2, "0")}</Text>
                    <Text style={styles.dateMon}>{d.toLocaleDateString("en", { month: "short" }).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>{item.profile_name}</Text>
                    <Text style={styles.sub}>{t("calendar.retestFor")} · {Math.round(item.rts_score)}%</Text>
                    <View style={[styles.statusTag, { borderColor: statusColor }]}>
                      <Ionicons name={overdue ? "alert-circle" : "time-outline"} size={12} color={statusColor} />
                      <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceTertiary} />
                </Pressable>
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={44} color={colors.onSurfaceTertiary} />
              <Text style={styles.emptyText}>{t("calendar.noItems")}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  title: { color: colors.onSurface, fontFamily: fonts.displayBold, fontSize: 28 },
  subtitle: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 13, marginTop: 2 },
  proBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.brandPrimary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, marginTop: 6 },
  proBadgeText: { color: colors.onBrandPrimary, fontFamily: fonts.textSemi, fontSize: 11, letterSpacing: 1 },
  card: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  dateBox: { width: 56, height: 56, borderRadius: radius.md, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary },
  dateDay: { fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 24 },
  dateMon: { color: colors.onSurfaceTertiary, fontFamily: fonts.textMedium, fontSize: 10, letterSpacing: 1 },
  name: { color: colors.onSurface, fontFamily: fonts.textSemi, fontSize: 16 },
  sub: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 12, marginTop: 1 },
  statusTag: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start", marginTop: 6 },
  statusText: { fontFamily: fonts.textSemi, fontSize: 11 },
  empty: { alignItems: "center", paddingTop: spacing["3xl"], gap: spacing.md },
  emptyText: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 14, textAlign: "center", paddingHorizontal: spacing.xl },
});

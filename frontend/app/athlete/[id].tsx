import React, { useCallback, useState } from "react";
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

import { colors, spacing, radius, fonts, zoneColor, zoneLabel } from "@/src/theme";
import { Button } from "@/src/components/ui";
import { api, Profile, Assessment } from "@/src/api";

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function AthleteDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([
        api.get<{ profile: Profile }>(`/profiles/${id}`),
        api.get<{ assessments: Assessment[] }>(`/assessments?profile_id=${id}`),
      ]);
      setProfile(p.profile);
      setItems(a.assessments);
    } catch {}
    finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const remove = async () => {
    await api.del(`/profiles/${id}`);
    router.back();
  };

  if (loading || !profile) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }

  const zc = zoneColor(profile.latest_zone);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="back-button" onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {profile.name}
        </Text>
        <Pressable testID="delete-profile-button" onPress={remove} hitSlop={12}>
          <Ionicons name="trash-outline" size={22} color={colors.error} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 120, gap: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sport}>{profile.sport}</Text>
            <Text style={styles.surgery}>{profile.surgery_type}</Text>
            <View style={styles.metaChips}>
              <View style={styles.metaChip}>
                <Ionicons name="calendar-outline" size={13} color={colors.onSurfaceSecondary} />
                <Text style={styles.metaChipText}>{profile.time_since_surgery_weeks} нед.</Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="hand-left-outline" size={13} color={colors.onSurfaceSecondary} />
                <Text style={styles.metaChipText}>
                  Опер.: {profile.operated_arm === "left" ? "левая" : "правая"}
                </Text>
              </View>
            </View>
          </View>
          {profile.latest_rts != null ? (
            <View style={[styles.scoreBox, { borderColor: zc }]}>
              <Text style={[styles.scoreVal, { color: zc }]}>{Math.round(profile.latest_rts)}</Text>
              <Text style={styles.scoreCaption}>RTS</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.detailsCard}>
          <InfoRow label="Возраст" value={`${profile.age} лет`} />
          <InfoRow label="Пол" value={profile.sex === "male" ? "Мужской" : "Женский"} />
          {profile.weight_category ? <InfoRow label="Вес. категория" value={profile.weight_category} /> : null}
          <InfoRow label="Доминантная рука" value={profile.dominant_arm === "left" ? "Левая" : "Правая"} />
        </View>

        <Button
          testID="start-assessment-button"
          title="Начать оценку RTS"
          icon={<Ionicons name="play" size={18} color={colors.onBrandPrimary} />}
          onPress={() => router.push(`/assessment/${id}`)}
        />

        <View>
          <Text style={styles.sectionTitle}>История оценок</Text>
          {items.length === 0 ? (
            <Text style={styles.emptyText}>Тестов ещё не было. Запустите первую оценку.</Text>
          ) : (
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              {items.map((it) => {
                const c = zoneColor(it.zone);
                return (
                  <Pressable
                    key={it.assessment_id}
                    testID={`assessment-item-${it.assessment_id}`}
                    style={styles.histCard}
                    onPress={() => router.push(`/results/${it.assessment_id}`)}
                  >
                    <View style={[styles.histScore, { borderColor: c }]}>
                      <Text style={[styles.histScoreVal, { color: c }]}>{Math.round(it.rts_score)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.histZone, { color: c }]}>{zoneLabel(it.zone)}</Text>
                      <Text style={styles.histDate}>{fmtDate(it.created_at)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceTertiary} />
                  </Pressable>
                );
              })}
            </View>
          )}
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
  headerTitle: { flex: 1, color: colors.onSurface, fontFamily: fonts.displaySemi, fontSize: 20, textAlign: "center" },
  summaryCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sport: { color: colors.onSurface, fontFamily: fonts.displaySemi, fontSize: 22 },
  surgery: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 14, marginTop: 2 },
  metaChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  metaChipText: { color: colors.onSurfaceSecondary, fontFamily: fonts.textMedium, fontSize: 12 },
  scoreBox: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
  },
  scoreVal: { fontFamily: fonts.displayBold, fontSize: 32 },
  scoreCaption: { color: colors.onSurfaceTertiary, fontFamily: fonts.textMedium, fontSize: 10, letterSpacing: 1 },
  detailsCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoLabel: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 14 },
  infoValue: { color: colors.onSurface, fontFamily: fonts.textSemi, fontSize: 14 },
  sectionTitle: { color: colors.onSurface, fontFamily: fonts.displaySemi, fontSize: 20 },
  emptyText: { color: colors.onSurfaceTertiary, fontFamily: fonts.textRegular, fontSize: 14, marginTop: spacing.sm },
  histCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  histScore: {
    width: 50,
    height: 50,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
  },
  histScoreVal: { fontFamily: fonts.displayBold, fontSize: 22 },
  histZone: { fontFamily: fonts.textSemi, fontSize: 14 },
  histDate: { color: colors.onSurfaceTertiary, fontFamily: fonts.textRegular, fontSize: 12, marginTop: 2 },
});

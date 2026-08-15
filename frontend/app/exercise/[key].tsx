import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, radius, fonts } from "@/src/theme";
import { useI18n, Lang } from "@/src/i18n";
import { EXERCISES } from "@/src/exercises";

export default function ExerciseDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lang } = useI18n();
  const { key } = useLocalSearchParams<{ key: string }>();
  const ex = EXERCISES.find((e) => e.key === key);

  if (!ex) {
    return (
      <View style={styles.root}>
        <Pressable onPress={() => router.back()} style={{ padding: spacing.lg, marginTop: insets.top }}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
      </View>
    );
  }

  const c = ex.content[lang as Lang] || ex.content.en;
  const target = t(`weak.${ex.targetKey}`) === `weak.${ex.targetKey}` ? t(`axis.${ex.targetKey}`) : t(`weak.${ex.targetKey}`);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={{ uri: ex.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={["rgba(15,17,21,0.3)", "rgba(15,17,21,0.95)", colors.surface]} style={StyleSheet.absoluteFill} />
          <Pressable testID="exercise-back" onPress={() => router.back()} style={[styles.back, { top: insets.top + spacing.sm }]} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
          </Pressable>
          <View style={styles.heroText}>
            <Text style={styles.title}>{c.title}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="fitness" size={18} color={colors.brandPrimary} />
              <Text style={styles.statVal}>{ex.sets}</Text>
              <Text style={styles.statLabel}>{t("library.sets")}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="locate" size={18} color={colors.brandPrimary} />
              <Text style={styles.statVal} numberOfLines={1}>{target}</Text>
              <Text style={styles.statLabel}>{t("library.target")}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t("library.howto")}</Text>
          <Text style={styles.howto}>{c.howto}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  hero: { height: 300, justifyContent: "flex-end" },
  back: { position: "absolute", left: spacing.lg, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
  heroText: { padding: spacing.xl },
  title: { color: colors.onSurface, fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 34 },
  body: { padding: spacing.lg, gap: spacing.lg },
  statsRow: { flexDirection: "row", gap: spacing.md },
  stat: { flex: 1, backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, gap: 4, borderWidth: 1, borderColor: colors.border },
  statVal: { color: colors.onSurface, fontFamily: fonts.displaySemi, fontSize: 18 },
  statLabel: { color: colors.onSurfaceTertiary, fontFamily: fonts.textRegular, fontSize: 12 },
  sectionTitle: { color: colors.onSurface, fontFamily: fonts.displaySemi, fontSize: 20 },
  howto: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 15, lineHeight: 23 },
});

import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { colors, spacing, radius, fonts } from "@/src/theme";
import { ProLocked } from "@/src/components/ui";
import { useAuth } from "@/src/auth";
import { useI18n, Lang } from "@/src/i18n";
import { EXERCISES, LIB_CATEGORIES } from "@/src/exercises";

export default function Library() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [cat, setCat] = useState<string>("all");

  const data = cat === "all" ? EXERCISES : EXERCISES.filter((e) => e.category === cat);

  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t("library.title")}</Text>
          <Text style={styles.subtitle}>{t("library.subtitle")}</Text>
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
          testID="library-locked"
          title={t("pro.lockedTitle")}
          text={t("pro.lockedText")}
          cta={t("pro.unlock")}
          onPress={() => router.push("/upgrade")}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {Header}
      <View style={styles.chipsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {LIB_CATEGORIES.map((c) => {
            const active = cat === c;
            return (
              <Pressable
                key={c}
                testID={`lib-cat-${c}`}
                onPress={() => setCat(c)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {c === "all" ? t("library.all") : t(`library.cat_${c}`)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={data}
        keyExtractor={(e) => e.key}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 80, gap: spacing.md }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const c = item.content[lang as Lang] || item.content.en;
          return (
            <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
              <Pressable
                testID={`exercise-${item.key}`}
                style={styles.card}
                onPress={() => router.push(`/exercise/${item.key}`)}
              >
                <Image source={{ uri: item.image }} style={styles.cardImg} contentFit="cover" />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{c.title}</Text>
                  <View style={styles.cardMeta}>
                    <View style={styles.metaTag}>
                      <Ionicons name="fitness-outline" size={12} color={colors.brandPrimary} />
                      <Text style={styles.metaText}>{item.sets}</Text>
                    </View>
                    <View style={styles.metaTag}>
                      <Ionicons name="locate-outline" size={12} color={colors.onSurfaceSecondary} />
                      <Text style={styles.metaText}>{t(`weak.${item.targetKey}`) === `weak.${item.targetKey}` ? t(`axis.${item.targetKey}`) : t(`weak.${item.targetKey}`)}</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceTertiary} />
              </Pressable>
            </Animated.View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  title: { color: colors.onSurface, fontFamily: fonts.displayBold, fontSize: 28 },
  subtitle: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 13, marginTop: 2 },
  proBadge: {
    flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.brandPrimary,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, marginTop: 6,
  },
  proBadgeText: { color: colors.onBrandPrimary, fontFamily: fonts.textSemi, fontSize: 11, letterSpacing: 1 },
  chipsWrap: { height: 56, justifyContent: "center" },
  chipsRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, alignItems: "center" },
  chip: {
    flexShrink: 0, height: 36, paddingHorizontal: spacing.md, borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { color: colors.onSurfaceSecondary, fontFamily: fonts.textMedium, fontSize: 13 },
  chipTextActive: { color: colors.onBrandPrimary },
  card: {
    flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg, padding: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  cardImg: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.surfaceTertiary },
  cardBody: { flex: 1, gap: 6 },
  cardTitle: { color: colors.onSurface, fontFamily: fonts.textSemi, fontSize: 15 },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metaTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.surfaceTertiary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  metaText: { color: colors.onSurfaceSecondary, fontFamily: fonts.textMedium, fontSize: 11 },
});

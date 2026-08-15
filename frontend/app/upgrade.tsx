import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, radius, fonts } from "@/src/theme";
import { Button } from "@/src/components/ui";
import { useAuth } from "@/src/auth";
import { useI18n } from "@/src/i18n";

export default function Upgrade() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, setPro } = useAuth();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  const activate = async () => {
    const next = !user?.is_pro;
    setBusy(true);
    try {
      await setPro(next);
      if (next) router.back();
    } finally {
      setBusy(false);
    }
  };

  const features = [
    { icon: "chatbubbles", text: t("pro.f1") },
    { icon: "barbell", text: t("pro.f2") },
    { icon: "calendar", text: t("pro.f3") },
    { icon: "flash", text: t("pro.f4") },
  ] as const;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#1b2a0a", colors.surface]}
          style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}
        >
          <Pressable testID="upgrade-close" onPress={() => router.back()} style={styles.close} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.onSurface} />
          </Pressable>
          <View style={styles.badge}>
            <Ionicons name="star" size={14} color={colors.onBrandPrimary} />
            <Text style={styles.badgeText}>{t("pro.badge")}</Text>
          </View>
          <Text style={styles.title}>{t("pro.title")}</Text>
          <Text style={styles.subtitle}>{t("pro.subtitle")}</Text>
        </LinearGradient>

        <View style={styles.body}>
          {features.map((f) => (
            <View key={f.icon} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon as any} size={20} color={colors.brandPrimary} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Text style={styles.price}>{t("pro.price")}</Text>
        <Button
          testID="activate-pro-button"
          title={user?.is_pro ? t("pro.deactivate") : t("pro.cta")}
          variant={user?.is_pro ? "ghost" : "primary"}
          loading={busy}
          onPress={activate}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  hero: { paddingHorizontal: spacing.xl, paddingBottom: spacing["2xl"], gap: spacing.sm },
  close: { alignSelf: "flex-end" },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start",
    backgroundColor: colors.brandPrimary, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.pill, marginTop: spacing.md,
  },
  badgeText: { color: colors.onBrandPrimary, fontFamily: fonts.textSemi, fontSize: 12, letterSpacing: 1 },
  title: { color: colors.onSurface, fontFamily: fonts.displayBold, fontSize: 34, marginTop: spacing.sm },
  subtitle: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 15 },
  body: { padding: spacing.xl, gap: spacing.lg },
  featureRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  featureIcon: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.brandTertiary,
    alignItems: "center", justifyContent: "center",
  },
  featureText: { flex: 1, color: colors.onSurface, fontFamily: fonts.textMedium, fontSize: 15, lineHeight: 21 },
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary, borderTopWidth: 1, borderTopColor: colors.border,
  },
  price: { color: colors.onSurfaceTertiary, fontFamily: fonts.textRegular, fontSize: 12, textAlign: "center" },
});

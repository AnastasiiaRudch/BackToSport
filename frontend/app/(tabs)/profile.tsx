import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, radius, fonts } from "@/src/theme";
import { Button } from "@/src/components/ui";
import { useAuth } from "@/src/auth";
import { useI18n, LANG_META, Lang } from "@/src/i18n";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, setRole } = useAuth();
  const { t, lang, setLang } = useI18n();
  const [busy, setBusy] = useState(false);

  const changeRole = async (r: "athlete" | "trainer") => {
    if (r === user?.role) return;
    setBusy(true);
    try {
      await setRole(r);
    } finally {
      setBusy(false);
    }
  };

  const doLogout = async () => {
    await logout();
    router.replace("/auth");
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.lg,
        paddingBottom: insets.bottom + 80,
        gap: spacing.lg,
      }}
    >
      <Text style={styles.title}>{t("profile.title")}</Text>

      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={30} color={colors.brandPrimary} />
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("profile.language")}</Text>
        <View style={styles.langGrid}>
          {LANG_META.map((l) => (
            <Pressable
              key={l.key}
              testID={`lang-${l.key}`}
              onPress={() => setLang(l.key as Lang)}
              style={[styles.langChip, lang === l.key && styles.langChipActive]}
            >
              <Text style={styles.langFlag}>{l.flag}</Text>
              <Text style={[styles.langText, lang === l.key && styles.langTextActive]}>
                {l.label}
              </Text>
              {lang === l.key ? (
                <Ionicons name="checkmark-circle" size={16} color={colors.onBrandPrimary} />
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("profile.roleTitle")}</Text>
        <View style={styles.roleRow}>
          {(["athlete", "trainer"] as const).map((r) => (
            <Pressable
              key={r}
              testID={`profile-role-${r}`}
              disabled={busy}
              onPress={() => changeRole(r)}
              style={[styles.roleChip, user?.role === r && styles.roleChipActive]}
            >
              <Ionicons
                name={r === "athlete" ? "barbell" : "clipboard"}
                size={16}
                color={user?.role === r ? colors.onBrandPrimary : colors.onSurfaceSecondary}
              />
              <Text style={[styles.roleText, user?.role === r && styles.roleTextActive]}>
                {t(`role.${r}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.disclaimer}>
        <Ionicons name="medical" size={18} color={colors.warning} />
        <Text style={styles.disclaimerText}>
          {t("profile.disclaimer")}
        </Text>
      </View>

      <Button
        testID="logout-button"
        title={t("profile.logout")}
        variant="danger"
        onPress={doLogout}
      />

      <Text style={styles.version}>{t("profile.version")}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  title: { color: colors.onSurface, fontFamily: fonts.displayBold, fontSize: 30 },
  userCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  name: { color: colors.onSurface, fontFamily: fonts.displaySemi, fontSize: 22 },
  email: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 14 },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.onSurfaceSecondary, fontFamily: fonts.textMedium, fontSize: 13 },
  roleRow: { flexDirection: "row", gap: spacing.sm },
  roleChip: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleChipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  roleText: { fontFamily: fonts.textMedium, color: colors.onSurfaceSecondary, fontSize: 13 },
  roleTextActive: { color: colors.onBrandPrimary },
  langGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  langChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minWidth: "47%",
    flexGrow: 1,
    height: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langChipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  langFlag: { fontSize: 20 },
  langText: { flex: 1, fontFamily: fonts.textMedium, color: colors.onSurface, fontSize: 14 },
  langTextActive: { color: colors.onBrandPrimary, fontFamily: fonts.textSemi },
  disclaimer: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disclaimerText: {
    flex: 1,
    color: colors.onSurfaceSecondary,
    fontFamily: fonts.textRegular,
    fontSize: 13,
    lineHeight: 19,
  },
  version: {
    textAlign: "center",
    color: colors.onSurfaceTertiary,
    fontFamily: fonts.textRegular,
    fontSize: 12,
  },
});

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { colors, spacing, radius, fonts } from "@/src/theme";
import { Button, Field } from "@/src/components/ui";
import { useAuth } from "@/src/auth";

const HERO =
  "https://images.unsplash.com/photo-1711025372958-db48a4fe0ba1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzB8MHwxfHNlYXJjaHwxfHxuZW9uJTIwZ3JlZW4lMjBmaXRuZXNzJTIwYWJzdHJhY3QlMjBkYXJrJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3ODY3ODYyNzh8MA&ixlib=rb-4.1.0&q=85";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { loginEmail, registerEmail, loginGoogle } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"athlete" | "trainer">("athlete");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email || !password || (mode === "register" && !name)) {
      setError("Заполните все поля");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await loginEmail(email.trim(), password);
      } else {
        await registerEmail(email.trim(), password, name.trim(), role);
      }
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e?.message || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginGoogle();
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e?.message || "Ошибка Google входа");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.root} testID="auth-screen">
      <Image source={{ uri: HERO }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={["rgba(15,17,21,0.55)", "rgba(15,17,21,0.92)", colors.surface]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing["2xl"], paddingBottom: insets.bottom + spacing.xl },
        ]}
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View style={styles.logoBox}>
            <Ionicons name="fitness" size={26} color={colors.onBrandPrimary} />
          </View>
          <View>
            <Text style={styles.brandTitle}>SHOULDERREADY</Text>
            <Text style={styles.brandSub}>Pro RTS Analytics</Text>
          </View>
        </View>

        <Text style={styles.headline}>
          Оценка готовности плеча к возврату в спорт
        </Text>

        <View style={styles.segment}>
          <Pressable
            testID="tab-login"
            onPress={() => setMode("login")}
            style={[styles.segBtn, mode === "login" && styles.segBtnActive]}
          >
            <Text style={[styles.segText, mode === "login" && styles.segTextActive]}>
              Вход
            </Text>
          </Pressable>
          <Pressable
            testID="tab-register"
            onPress={() => setMode("register")}
            style={[styles.segBtn, mode === "register" && styles.segBtnActive]}
          >
            <Text style={[styles.segText, mode === "register" && styles.segTextActive]}>
              Регистрация
            </Text>
          </Pressable>
        </View>

        <View style={{ gap: spacing.md }}>
          {mode === "register" && (
            <Field
              testID="input-name"
              label="Имя"
              placeholder="Ваше имя"
              value={name}
              onChangeText={setName}
            />
          )}
          <Field
            testID="input-email"
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            testID="input-password"
            label="Пароль"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {mode === "register" && (
            <View style={{ gap: spacing.xs }}>
              <Text style={styles.roleLabel}>Роль</Text>
              <View style={styles.roleRow}>
                {(["athlete", "trainer"] as const).map((r) => (
                  <Pressable
                    key={r}
                    testID={`role-${r}`}
                    onPress={() => setRole(r)}
                    style={[styles.roleChip, role === r && styles.roleChipActive]}
                  >
                    <Ionicons
                      name={r === "athlete" ? "barbell" : "clipboard"}
                      size={16}
                      color={role === r ? colors.onBrandPrimary : colors.onSurfaceSecondary}
                    />
                    <Text
                      style={[styles.roleText, role === r && styles.roleTextActive]}
                    >
                      {r === "athlete" ? "Атлет" : "Тренер / физио"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {error ? (
            <Text style={styles.error} testID="auth-error">
              {error}
            </Text>
          ) : null}

          <Button
            testID="submit-button"
            title={mode === "login" ? "Войти" : "Создать аккаунт"}
            onPress={submit}
            loading={loading}
          />

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>или</Text>
            <View style={styles.orLine} />
          </View>

          <Pressable
            testID="google-button"
            onPress={google}
            style={styles.googleBtn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.onSurface} />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color={colors.onSurface} />
                <Text style={styles.googleText}>Продолжить с Google</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontFamily: fonts.displayBold,
    color: colors.onSurface,
    fontSize: 22,
    letterSpacing: 1,
  },
  brandSub: {
    fontFamily: fonts.textMedium,
    color: colors.brandPrimary,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  headline: {
    fontFamily: fonts.displaySemi,
    color: colors.onSurface,
    fontSize: 26,
    lineHeight: 30,
    marginTop: spacing.sm,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segBtn: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  segBtnActive: { backgroundColor: colors.brandPrimary },
  segText: { fontFamily: fonts.textSemi, color: colors.onSurfaceSecondary, fontSize: 15 },
  segTextActive: { color: colors.onBrandPrimary },
  roleLabel: {
    color: colors.onSurfaceSecondary,
    fontFamily: fonts.textMedium,
    fontSize: 13,
  },
  roleRow: { flexDirection: "row", gap: spacing.sm },
  roleChip: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleChipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  roleText: { fontFamily: fonts.textMedium, color: colors.onSurfaceSecondary, fontSize: 13 },
  roleTextActive: { color: colors.onBrandPrimary },
  error: { color: colors.error, fontFamily: fonts.textMedium, fontSize: 13 },
  orRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  orLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  orText: { color: colors.onSurfaceTertiary, fontFamily: fonts.textRegular },
  googleBtn: {
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceSecondary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  googleText: { fontFamily: fonts.textSemi, color: colors.onSurface, fontSize: 15 },
});

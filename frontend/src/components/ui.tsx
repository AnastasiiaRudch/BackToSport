import React from "react";
import {
  Text,
  TextProps,
  Pressable,
  PressableProps,
  View,
  ViewProps,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, spacing, radius, fonts } from "@/src/theme";

export function AppText(props: TextProps & { variant?: "display" | "body" }) {
  const { style, variant, ...rest } = props;
  return (
    <Text
      {...rest}
      style={[
        { color: colors.onSurface, fontFamily: fonts.textRegular },
        style,
      ]}
    />
  );
}

export function Card(props: ViewProps) {
  const { style, ...rest } = props;
  return <View {...rest} style={[styles.card, style]} />;
}

type BtnProps = PressableProps & {
  title: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  icon?: React.ReactNode;
};

export function Button({
  title,
  variant = "primary",
  loading,
  icon,
  disabled,
  style,
  onPress,
  ...rest
}: BtnProps) {
  const bg =
    variant === "primary"
      ? colors.brandPrimary
      : variant === "danger"
      ? colors.error
      : variant === "secondary"
      ? colors.surfaceTertiary
      : "transparent";
  const fg =
    variant === "primary"
      ? colors.onBrandPrimary
      : variant === "danger"
      ? colors.onError
      : colors.onSurface;

  return (
    <Pressable
      {...rest}
      disabled={disabled || loading}
      onPress={(e) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.(e);
      }}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderWidth: variant === "ghost" ? 1 : 0,
          borderColor: colors.border,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
        style as any,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.btnInner}>
          {icon}
          <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label?: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.onSurfaceTertiary}
        {...rest}
        style={[styles.input, style]}
      />
    </View>
  );
}

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  suffix,
  testID,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  testID?: string;
}) {
  const set = (v: number) => {
    const clamped = Math.max(min, Math.min(max, Math.round(v * 10) / 10));
    Haptics.selectionAsync().catch(() => {});
    onChange(clamped);
  };
  return (
    <View style={styles.stepper} testID={testID}>
      <Pressable
        testID={testID ? `${testID}-minus` : undefined}
        onPress={() => set(value - step)}
        style={styles.stepperBtn}
      >
        <Text style={styles.stepperSign}>−</Text>
      </Pressable>
      <TextInput
        testID={testID ? `${testID}-input` : undefined}
        value={String(value)}
        onChangeText={(t) => {
          const n = parseFloat(t.replace(",", "."));
          onChange(isNaN(n) ? 0 : n);
        }}
        keyboardType="numeric"
        style={styles.stepperValue}
      />
      {suffix ? <Text style={styles.stepperSuffix}>{suffix}</Text> : null}
      <Pressable
        testID={testID ? `${testID}-plus` : undefined}
        onPress={() => set(value + step)}
        style={styles.stepperBtn}
      >
        <Text style={styles.stepperSign}>+</Text>
      </Pressable>
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function ProLocked({
  title,
  text,
  cta,
  onPress,
  testID,
}: {
  title: string;
  text: string;
  cta: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <View style={styles.locked} testID={testID}>
      <View style={styles.lockedIcon}>
        <Ionicons name="lock-closed" size={30} color={colors.brandPrimary} />
      </View>
      <Text style={styles.lockedTitle}>{title}</Text>
      <Text style={styles.lockedText}>{text}</Text>
      <Button title={cta} onPress={onPress} testID={testID ? `${testID}-cta` : "unlock-pro"} style={{ marginTop: spacing.md, minWidth: 220 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    height: 54,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  btnInner: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  btnText: { fontFamily: fonts.textSemi, fontSize: 16 },
  label: {
    color: colors.onSurfaceSecondary,
    fontFamily: fonts.textMedium,
    fontSize: 13,
  },
  input: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 52,
    color: colors.onSurface,
    fontFamily: fonts.textRegular,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  stepperBtn: {
    width: 46,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperSign: {
    color: colors.brandPrimary,
    fontSize: 26,
    fontFamily: fonts.displayBold,
    lineHeight: 30,
  },
  stepperValue: {
    flex: 1,
    textAlign: "center",
    color: colors.onSurface,
    fontFamily: fonts.displaySemi,
    fontSize: 20,
    paddingVertical: 0,
  },
  stepperSuffix: {
    color: colors.onSurfaceTertiary,
    fontFamily: fonts.textMedium,
    fontSize: 13,
    paddingRight: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  locked: { alignItems: "center", padding: spacing.xl, gap: spacing.sm },
  lockedIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.brandTertiary,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.sm,
  },
  lockedTitle: { color: colors.onSurface, fontFamily: fonts.displaySemi, fontSize: 22, textAlign: "center" },
  lockedText: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 14, textAlign: "center", paddingHorizontal: spacing.lg },
});

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, radius, fonts } from "@/src/theme";
import { Button, Field } from "@/src/components/ui";
import { api } from "@/src/api";
import { useI18n, SPORT_KEYS, SURGERY_KEYS } from "@/src/i18n";

function Segment({
  options,
  value,
  onChange,
  testID,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  testID?: string;
}) {
  return (
    <View style={styles.segment} testID={testID}>
      {options.map((o) => (
        <Pressable
          key={o.key}
          testID={testID ? `${testID}-${o.key}` : undefined}
          onPress={() => onChange(o.key)}
          style={[styles.segBtn, value === o.key && styles.segBtnActive]}
        >
          <Text style={[styles.segText, value === o.key && styles.segTextActive]}>
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function ChipGroup({
  options,
  value,
  onChange,
  labelFor,
  testID,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  labelFor: (v: string) => string;
  testID?: string;
}) {
  return (
    <View style={styles.chipWrap} testID={testID}>
      {options.map((o) => (
        <Pressable
          key={o}
          onPress={() => onChange(o)}
          style={[styles.chip, value === o && styles.chipActive]}
        >
          <Text style={[styles.chipText, value === o && styles.chipTextActive]}>{labelFor(o)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function NewProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("male");
  const [sport, setSport] = useState(SPORT_KEYS[0]);
  const [weight, setWeight] = useState("");
  const [surgery, setSurgery] = useState(SURGERY_KEYS[0]);
  const [weeks, setWeeks] = useState("");
  const [dominant, setDominant] = useState("right");
  const [operated, setOperated] = useState("right");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setError(null);
    if (!name || !age || !weeks) {
      setError(t("np.fill"));
      return;
    }
    setSaving(true);
    try {
      await api.post("/profiles", {
        name: name.trim(),
        age: parseInt(age, 10) || 0,
        sex,
        sport,
        weight_category: weight.trim() || null,
        surgery_type: surgery,
        time_since_surgery_weeks: parseInt(weeks, 10) || 0,
        dominant_arm: dominant,
        operated_arm: operated,
      });
      router.back();
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="close-new-profile" onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("np.title")}</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140, gap: spacing.lg }}
        bottomOffset={90}
        showsVerticalScrollIndicator={false}
      >
        <Field testID="np-name" label={t("np.name")} placeholder={t("np.namePh")} value={name} onChangeText={setName} />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field testID="np-age" label={t("np.age")} placeholder={t("np.agePh")} keyboardType="numeric" value={age} onChangeText={setAge} />
          </View>
          <View style={{ flex: 1 }}>
            <Field testID="np-weight" label={t("np.weight")} placeholder={t("np.weightPh")} value={weight} onChangeText={setWeight} />
          </View>
        </View>

        <View style={{ gap: spacing.xs }}>
          <Text style={styles.label}>{t("np.sex")}</Text>
          <Segment
            testID="np-sex"
            value={sex}
            onChange={setSex}
            options={[
              { key: "male", label: t("common.male") },
              { key: "female", label: t("common.female") },
            ]}
          />
        </View>

        <View style={{ gap: spacing.xs }}>
          <Text style={styles.label}>{t("np.sport")}</Text>
          <ChipGroup testID="np-sport" options={SPORT_KEYS} value={sport} onChange={setSport} labelFor={(k) => t(`sport.${k}`)} />
        </View>

        <View style={{ gap: spacing.xs }}>
          <Text style={styles.label}>{t("np.surgery")}</Text>
          <ChipGroup testID="np-surgery" options={SURGERY_KEYS} value={surgery} onChange={setSurgery} labelFor={(k) => t(`surgery.${k}`)} />
        </View>

        <Field
          testID="np-weeks"
          label={t("np.weeks")}
          placeholder={t("np.weeksPh")}
          keyboardType="numeric"
          value={weeks}
          onChangeText={setWeeks}
        />

        <View style={{ gap: spacing.xs }}>
          <Text style={styles.label}>{t("np.dominant")}</Text>
          <Segment
            testID="np-dominant"
            value={dominant}
            onChange={setDominant}
            options={[
              { key: "left", label: t("common.left") },
              { key: "right", label: t("common.right") },
            ]}
          />
        </View>

        <View style={{ gap: spacing.xs }}>
          <Text style={styles.label}>{t("np.operated")}</Text>
          <Segment
            testID="np-operated"
            value={operated}
            onChange={setOperated}
            options={[
              { key: "left", label: t("common.left") },
              { key: "right", label: t("common.right") },
            ]}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </KeyboardAwareScrollView>

      <KeyboardStickyView>
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button testID="save-profile-button" title={t("np.save")} onPress={save} loading={saving} />
        </View>
      </KeyboardStickyView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
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
  row: { flexDirection: "row", gap: spacing.md },
  label: { color: colors.onSurfaceSecondary, fontFamily: fonts.textMedium, fontSize: 13 },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segBtn: { flex: 1, height: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.sm },
  segBtnActive: { backgroundColor: colors.brandPrimary },
  segText: { fontFamily: fonts.textMedium, color: colors.onSurfaceSecondary, fontSize: 14 },
  segTextActive: { color: colors.onBrandPrimary },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.brandTertiary, borderColor: colors.brandPrimary },
  chipText: { color: colors.onSurfaceSecondary, fontFamily: fonts.textMedium, fontSize: 13 },
  chipTextActive: { color: colors.onBrandTertiary },
  error: { color: colors.error, fontFamily: fonts.textMedium, fontSize: 13 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});

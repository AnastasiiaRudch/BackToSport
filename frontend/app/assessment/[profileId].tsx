import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, radius, fonts } from "@/src/theme";
import { Button, Stepper, Card } from "@/src/components/ui";
import { api } from "@/src/api";
import { useI18n } from "@/src/i18n";

type Side = { operated: number; healthy: number };

const BLOCKS = [
  { key: "intro", weight: "" },
  { key: "psych", weight: "15%" },
  { key: "rom", weight: "15%" },
  { key: "strength", weight: "25%" },
  { key: "functional", weight: "25%" },
  { key: "sport", weight: "20%" },
];

const ROM_METRICS = [
  { key: "rom_flexion", tkey: "flexion", unit: "deg", step: 5, def: 150 },
  { key: "rom_abduction", tkey: "abduction", unit: "deg", step: 5, def: 150 },
  { key: "rom_external_rotation", tkey: "er_rom", unit: "deg", step: 5, def: 80 },
  { key: "rom_internal_rotation", tkey: "ir_rom", unit: "deg", step: 5, def: 60 },
];

const STRENGTH_METRICS = [
  { key: "ash_i", tkey: "ash_i", unit: "kg", step: 0.5, def: 20 },
  { key: "ash_y", tkey: "ash_y", unit: "kg", step: 0.5, def: 16 },
  { key: "ash_t", tkey: "ash_t", unit: "kg", step: 0.5, def: 14 },
  { key: "dyn_er", tkey: "er_str", unit: "kg", step: 0.5, def: 12 },
  { key: "dyn_ir", tkey: "ir_str", unit: "kg", step: 0.5, def: 16 },
];

const FUNC_METRICS = [
  { key: "ckcuest", tkey: "ckcuest", unit: "touch", step: 1, def: 24 },
  { key: "ybt", tkey: "ybt", unit: "cm", step: 1, def: 90 },
  { key: "mbt", tkey: "mbt", unit: "m", step: 0.1, def: 4 },
];

const SPORT_METRICS = [
  { key: "breakfall", tkey: "breakfall" },
  { key: "static_push_pull", tkey: "static_pp" },
  { key: "sparring", tkey: "sparring" },
];

function SideInputs({
  value,
  onChange,
  metric,
  testID,
}: {
  value: Side;
  onChange: (v: Side) => void;
  metric: { label: string; suffix: string; step: number; operatedLabel: string; healthyLabel: string };
  testID: string;
}) {
  return (
    <Card style={styles.metricCard}>
      <Text style={styles.metricLabel}>{metric.label}</Text>
      <View style={styles.sideRow}>
        <View style={styles.sideCol}>
          <Text style={styles.sideCaption}>{metric.operatedLabel}</Text>
          <Stepper
            testID={`${testID}-operated`}
            value={value.operated}
            step={metric.step}
            suffix={metric.suffix}
            onChange={(v) => onChange({ ...value, operated: v })}
          />
        </View>
        <View style={styles.sideCol}>
          <Text style={styles.sideCaption}>{metric.healthyLabel}</Text>
          <Stepper
            testID={`${testID}-healthy`}
            value={value.healthy}
            step={metric.step}
            suffix={metric.suffix}
            onChange={(v) => onChange({ ...value, healthy: v })}
          />
        </View>
      </View>
      <LsiHint value={value} />
    </Card>
  );
}

function LsiHint({ value }: { value: Side }) {
  if (!value.healthy) return null;
  const lsi = Math.round((value.operated / value.healthy) * 100);
  const good = lsi >= 90;
  return (
    <Text style={[styles.lsiHint, { color: good ? colors.success : colors.warning }]}>
      LSI {lsi}%
    </Text>
  );
}

function PctSlider({
  value,
  onChange,
  testID,
}: {
  value: number;
  onChange: (v: number) => void;
  testID?: string;
}) {
  return (
    <View style={styles.sliderRow}>
      <Slider
        testID={testID}
        style={{ flex: 1, height: 40 }}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={value}
        minimumTrackTintColor={colors.brandPrimary}
        maximumTrackTintColor={colors.surfaceTertiary}
        thumbTintColor={colors.brandPrimary}
        onValueChange={onChange}
      />
      <Text style={styles.sliderVal}>{Math.round(value)}%</Text>
    </View>
  );
}

export default function Assessment() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, tArr, lang } = useI18n();
  const { profileId } = useLocalSearchParams<{ profileId: string }>();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [sirsi, setSirsi] = useState<number[]>(Array(12).fill(50));
  const [apprehension, setApprehension] = useState(false);
  const [sides, setSides] = useState<Record<string, Side>>(() => {
    const init: Record<string, Side> = {};
    [...ROM_METRICS, ...STRENGTH_METRICS, ...FUNC_METRICS].forEach((m) => {
      init[m.key] = { operated: m.def, healthy: m.def };
    });
    return init;
  });
  const [sport, setSport] = useState<Record<string, number>>({
    breakfall: 60,
    static_push_pull: 60,
    sparring: 60,
  });

  const total = BLOCKS.length;
  const block = BLOCKS[step];

  const setSide = (key: string, v: Side) => setSides((s) => ({ ...s, [key]: v }));

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload: any = {
        profile_id: profileId,
        lang,
        sirsi,
        apprehension_fear: apprehension,
        breakfall: sport.breakfall,
        static_push_pull: sport.static_push_pull,
        sparring: sport.sparring,
      };
      [...ROM_METRICS, ...STRENGTH_METRICS, ...FUNC_METRICS].forEach((m) => {
        payload[m.key] = sides[m.key];
      });
      const res = await api.post<{ assessment: { assessment_id: string } }>(
        "/assessments",
        payload,
      );
      router.replace(`/results/${res.assessment.assessment_id}`);
    } catch (e) {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (step < total - 1) setStep(step + 1);
    else submit();
  };
  const back = () => {
    if (step > 0) setStep(step - 1);
    else router.back();
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="wizard-back" onPress={back} hitSlop={12}>
          <Ionicons name={step === 0 ? "close" : "chevron-back"} size={26} color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{block.key === "intro" ? t("wizard.protocol") : t(`block.${block.key}`)}</Text>
          {block.weight ? <Text style={styles.headerWeight}>{t("wizard.weightInScore", { w: block.weight })}</Text> : null}
        </View>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.dots}>
        {BLOCKS.map((b, i) => (
          <View
            key={b.key}
            style={[
              styles.dot,
              i === step && styles.dotActive,
              i < step && styles.dotDone,
            ]}
          />
        ))}
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 130, gap: spacing.md }}
        bottomOffset={90}
        showsVerticalScrollIndicator={false}
      >
        {block.key === "intro" && (
          <View style={{ gap: spacing.md }}>
            <Card>
              <Text style={styles.introTitle}>{t("wizard.introTitle")}</Text>
              <Text style={styles.introText}>
                {t("wizard.introText")}
              </Text>
            </Card>
            {BLOCKS.slice(1).map((b) => (
              <View key={b.key} style={styles.blockRow}>
                <View style={styles.blockDot} />
                <Text style={styles.blockRowText}>{t(`block.${b.key}`)}</Text>
                <Text style={styles.blockRowWeight}>{b.weight}</Text>
              </View>
            ))}
            <View style={styles.disclaimer}>
              <Ionicons name="warning" size={16} color={colors.warning} />
              <Text style={styles.disclaimerText}>
                {t("wizard.disclaimer")}
              </Text>
            </View>
          </View>
        )}

        {block.key === "psych" && (
          <View style={{ gap: spacing.md }}>
            <Text style={styles.helper}>
              {t("wizard.psychHelper")}
            </Text>
            {tArr("sirsi").map((q, i) => (
              <Card key={i} style={styles.qCard}>
                <Text style={styles.qText}>
                  {i + 1}. {q}
                </Text>
                <PctSlider
                  testID={`sirsi-${i}`}
                  value={sirsi[i]}
                  onChange={(v) => {
                    const arr = [...sirsi];
                    arr[i] = v;
                    setSirsi(arr);
                  }}
                />
              </Card>
            ))}
          </View>
        )}

        {block.key === "rom" && (
          <View style={{ gap: spacing.md }}>
            <Text style={styles.helper}>
              {t("wizard.romHelper")}
            </Text>
            {ROM_METRICS.map((m) => (
              <SideInputs
                key={m.key}
                testID={m.key}
                metric={{ label: t(`metric.${m.tkey}`), suffix: t(`unit.${m.unit}`), step: m.step, operatedLabel: t("wizard.operated"), healthyLabel: t("wizard.healthy") }}
                value={sides[m.key]}
                onChange={(v) => setSide(m.key, v)}
              />
            ))}
            <Pressable
              testID="apprehension-toggle"
              style={styles.toggleRow}
              onPress={() => setApprehension((a) => !a)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>{t("wizard.apprTitle")}</Text>
                <Text style={styles.toggleHint}>
                  {t("wizard.apprHint")}
                </Text>
              </View>
              <View style={[styles.switch, apprehension && styles.switchOn]}>
                <View style={[styles.knob, apprehension && styles.knobOn]} />
              </View>
            </Pressable>
          </View>
        )}

        {block.key === "strength" && (
          <View style={{ gap: spacing.md }}>
            <Text style={styles.helper}>
              {t("wizard.strengthHelper")}
            </Text>
            {STRENGTH_METRICS.map((m) => (
              <SideInputs
                key={m.key}
                testID={m.key}
                metric={{ label: t(`metric.${m.tkey}`), suffix: t(`unit.${m.unit}`), step: m.step, operatedLabel: t("wizard.operated"), healthyLabel: t("wizard.healthy") }}
                value={sides[m.key]}
                onChange={(v) => setSide(m.key, v)}
              />
            ))}
          </View>
        )}

        {block.key === "functional" && (
          <View style={{ gap: spacing.md }}>
            <Text style={styles.helper}>
              {t("wizard.funcHelper")}
            </Text>
            {FUNC_METRICS.map((m) => (
              <SideInputs
                key={m.key}
                testID={m.key}
                metric={{ label: t(`metric.${m.tkey}`), suffix: t(`unit.${m.unit}`), step: m.step, operatedLabel: t("wizard.operated"), healthyLabel: t("wizard.healthy") }}
                value={sides[m.key]}
                onChange={(v) => setSide(m.key, v)}
              />
            ))}
          </View>
        )}

        {block.key === "sport" && (
          <View style={{ gap: spacing.md }}>
            <Text style={styles.helper}>
              {t("wizard.sportHelper")}
            </Text>
            {SPORT_METRICS.map((m) => (
              <Card key={m.key} style={styles.qCard}>
                <Text style={styles.qText}>{t(`sportm.${m.tkey}_l`)}</Text>
                <Text style={styles.sportHint}>{t(`sportm.${m.tkey}_h`)}</Text>
                <PctSlider
                  testID={`sport-${m.key}`}
                  value={sport[m.key]}
                  onChange={(v) => setSport((s) => ({ ...s, [m.key]: v }))}
                />
              </Card>
            ))}
          </View>
        )}
      </KeyboardAwareScrollView>

      <KeyboardStickyView>
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button
            testID="wizard-next"
            title={
              step === 0
                ? t("wizard.start")
                : step === total - 1
                ? t("wizard.calc")
                : t("wizard.next")
            }
            onPress={next}
            loading={submitting}
          />
        </View>
      </KeyboardStickyView>

      {submitting && (
        <View style={styles.overlay} testID="calc-overlay">
          <ActivityIndicator color={colors.brandPrimary} size="large" />
          <Text style={styles.overlayText}>{t("wizard.overlay")}</Text>
        </View>
      )}
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
    paddingBottom: spacing.sm,
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { color: colors.onSurface, fontFamily: fonts.displaySemi, fontSize: 18 },
  headerWeight: { color: colors.brandPrimary, fontFamily: fonts.textMedium, fontSize: 12 },
  dots: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surfaceTertiary },
  dotActive: { backgroundColor: colors.brandPrimary },
  dotDone: { backgroundColor: colors.brandSecondary },
  introTitle: { color: colors.onSurface, fontFamily: fonts.displaySemi, fontSize: 20, marginBottom: spacing.sm },
  introText: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 14, lineHeight: 20 },
  blockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  blockDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brandPrimary },
  blockRowText: { flex: 1, color: colors.onSurface, fontFamily: fonts.textMedium, fontSize: 14 },
  blockRowWeight: { color: colors.onSurfaceTertiary, fontFamily: fonts.displaySemi, fontSize: 14 },
  disclaimer: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disclaimerText: { flex: 1, color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 12, lineHeight: 17 },
  helper: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 13 },
  qCard: { gap: spacing.sm },
  qText: { color: colors.onSurface, fontFamily: fonts.textMedium, fontSize: 14, lineHeight: 20 },
  sportHint: { color: colors.onSurfaceTertiary, fontFamily: fonts.textRegular, fontSize: 12 },
  sliderRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  sliderVal: { width: 52, textAlign: "right", color: colors.brandPrimary, fontFamily: fonts.displaySemi, fontSize: 18 },
  metricCard: { gap: spacing.sm },
  metricLabel: { color: colors.onSurface, fontFamily: fonts.textSemi, fontSize: 14 },
  sideRow: { flexDirection: "row", gap: spacing.md },
  sideCol: { flex: 1, gap: spacing.xs },
  sideCaption: { color: colors.onSurfaceTertiary, fontFamily: fonts.textMedium, fontSize: 12 },
  lsiHint: { fontFamily: fonts.displaySemi, fontSize: 14, textAlign: "right" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleTitle: { color: colors.onSurface, fontFamily: fonts.textSemi, fontSize: 14 },
  toggleHint: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 12, marginTop: 2 },
  switch: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceTertiary,
    padding: 3,
    justifyContent: "center",
  },
  switchOn: { backgroundColor: colors.error },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.onSurfaceTertiary },
  knobOn: { backgroundColor: colors.onError, alignSelf: "flex-end" },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,17,21,0.92)",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  overlayText: { color: colors.onSurface, fontFamily: fonts.textMedium, fontSize: 15 },
});

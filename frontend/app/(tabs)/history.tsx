import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, radius, fonts, zoneColor, zoneLabel } from "@/src/theme";
import { api, Assessment } from "@/src/api";

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ assessments: Assessment[] }>("/assessments");
      setItems(res.assessments);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const renderItem = ({ item }: { item: Assessment }) => {
    const zc = zoneColor(item.zone);
    return (
      <Pressable
        testID={`history-card-${item.assessment_id}`}
        style={styles.card}
        onPress={() => router.push(`/results/${item.assessment_id}`)}
      >
        <View style={[styles.scoreBox, { borderColor: zc }]}>
          <Text style={[styles.scoreVal, { color: zc }]}>{Math.round(item.rts_score)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {item.profile_name}
          </Text>
          <Text style={styles.sub}>{item.sport}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.zoneTag, { borderColor: zc }]}>
              <Text style={[styles.zoneTagText, { color: zc }]}>{zoneLabel(item.zone)}</Text>
            </View>
            <Text style={styles.date}>{fmtDate(item.created_at)}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceTertiary} />
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>История тестов</Text>
      </View>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.assessment_id}
          renderItem={renderItem}
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: insets.bottom + 80,
            gap: spacing.md,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.brandPrimary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="clipboard-outline" size={48} color={colors.onSurfaceTertiary} />
              <Text style={styles.emptyTitle}>Нет проведённых тестов</Text>
              <Text style={styles.emptyText}>
                Добавьте атлета и запустите оценку RTS.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  title: { color: colors.onSurface, fontFamily: fonts.displayBold, fontSize: 30 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreBox: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
  },
  scoreVal: { fontFamily: fonts.displayBold, fontSize: 26 },
  name: { color: colors.onSurface, fontFamily: fonts.textSemi, fontSize: 16 },
  sub: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 13 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 4 },
  zoneTag: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  zoneTagText: { fontFamily: fonts.textMedium, fontSize: 11 },
  date: { color: colors.onSurfaceTertiary, fontFamily: fonts.textRegular, fontSize: 12 },
  empty: { alignItems: "center", paddingTop: spacing["3xl"], gap: spacing.sm },
  emptyTitle: { color: colors.onSurface, fontFamily: fonts.displaySemi, fontSize: 20 },
  emptyText: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 14, textAlign: "center" },
});

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, radius, fonts, zoneColor } from "@/src/theme";
import { api, Profile } from "@/src/api";
import { useAuth } from "@/src/auth";
import { useI18n } from "@/src/i18n";

const EMPTY_IMG =
  "https://images.unsplash.com/photo-1630226040750-d934f017f0e4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODl8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc3BvcnRzJTIwcmVoYWIlMjBwaHlzaW8lMjBjbGluaWN8ZW58MHx8fHwxNzg2Nzg2Mjc4fDA&ixlib=rb-4.1.0&q=85";

export default function AthletesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ profiles: Profile[] }>("/profiles");
      setProfiles(res.profiles);
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

  const renderItem = ({ item }: { item: Profile }) => {
    const zc = zoneColor(item.latest_zone);
    return (
      <Pressable
        testID={`athlete-card-${item.profile_id}`}
        style={styles.card}
        onPress={() => router.push(`/athlete/${item.profile_id}`)}
      >
        <View style={styles.cardLeft}>
          <View style={styles.avatar}>
            <Ionicons name="body" size={22} color={colors.brandPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.cardSub} numberOfLines={1}>
              {t(`sport.${item.sport}`) !== `sport.${item.sport}` ? t(`sport.${item.sport}`) : item.sport} · {t(`surgery.${item.surgery_type}`) !== `surgery.${item.surgery_type}` ? t(`surgery.${item.surgery_type}`) : item.surgery_type}
            </Text>
            <Text style={styles.cardMeta}>
              {item.time_since_surgery_weeks} {t("home.weeksAfter")} · {item.assessment_count ?? 0} {t("home.tests")}
            </Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          {item.latest_rts != null ? (
            <>
              <Text style={[styles.scoreVal, { color: zc }]}>{Math.round(item.latest_rts)}</Text>
              <View style={[styles.zoneDot, { backgroundColor: zc }]} />
            </>
          ) : (
            <Text style={styles.noScore}>—</Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View>
          <Text style={styles.hello}>{t("home.hello", { name: user?.name?.split(" ")[0] || t("role.athlete") })}</Text>
          <Text style={styles.title}>{t("home.title")}</Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            {user?.role === "trainer" ? t("role.trainerBadge") : t("role.athleteBadge")}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(p) => p.profile_id}
          renderItem={renderItem}
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: insets.bottom + 100,
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
              <Image source={{ uri: EMPTY_IMG }} style={styles.emptyImg} contentFit="cover" />
              <Text style={styles.emptyTitle}>{t("home.emptyTitle")}</Text>
              <Text style={styles.emptyText}>
                {t("home.emptyText")}
              </Text>
            </View>
          }
        />
      )}

      <Pressable
        testID="add-athlete-fab"
        style={[styles.fab, { bottom: insets.bottom + 76 }]}
        onPress={() => router.push("/athlete/new")}
      >
        <Ionicons name="add" size={28} color={colors.onBrandPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  hello: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 14 },
  title: { color: colors.onSurface, fontFamily: fonts.displayBold, fontSize: 30 },
  roleBadge: {
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  roleBadgeText: { color: colors.onBrandTertiary, fontFamily: fonts.textSemi, fontSize: 12 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: { color: colors.onSurface, fontFamily: fonts.textSemi, fontSize: 16 },
  cardSub: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 13, marginTop: 1 },
  cardMeta: { color: colors.onSurfaceTertiary, fontFamily: fonts.textRegular, fontSize: 11, marginTop: 2 },
  cardRight: { alignItems: "center", marginLeft: spacing.md },
  scoreVal: { fontFamily: fonts.displayBold, fontSize: 30 },
  zoneDot: { width: 8, height: 8, borderRadius: 4, marginTop: 2 },
  noScore: { color: colors.onSurfaceTertiary, fontFamily: fonts.displayBold, fontSize: 28 },
  empty: { alignItems: "center", paddingTop: spacing["2xl"], gap: spacing.md },
  emptyImg: { width: "100%", height: 160, borderRadius: radius.lg, opacity: 0.7 },
  emptyTitle: { color: colors.onSurface, fontFamily: fonts.displaySemi, fontSize: 22 },
  emptyText: {
    color: colors.onSurfaceSecondary,
    fontFamily: fonts.textRegular,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brandPrimary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});

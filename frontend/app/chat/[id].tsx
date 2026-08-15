import React, { useCallback, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView, KeyboardStickyView } from "react-native-keyboard-controller";
import { Platform, TextInput } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, radius, fonts } from "@/src/theme";
import { api, ChatMessage } from "@/src/api";
import { useI18n } from "@/src/i18n";

export default function Chat() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lang } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ messages: ChatMessage[] }>(`/assessments/${id}/chat`);
      setMessages(res.messages);
    } catch {}
    finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const send = async () => {
    const msg = text.trim();
    if (!msg || sending) return;
    setText("");
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setSending(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      const res = await api.post<{ messages: ChatMessage[] }>(`/assessments/${id}/chat`, { message: msg, lang });
      setMessages(res.messages);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: t("chat.disclaimer") }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="chat-back" onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t("chat.title")}</Text>
          <Text style={styles.headerSub}>{t("chat.subtitle")}</Text>
        </View>
        <View style={styles.aiDot}><Ionicons name="sparkles" size={16} color={colors.onBrandPrimary} /></View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {loading ? (
          <View style={styles.loader}><ActivityIndicator color={colors.brandPrimary} size="large" /></View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.lg }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIcon}><Ionicons name="chatbubbles-outline" size={28} color={colors.brandPrimary} /></View>
                <Text style={styles.emptyText}>{t("chat.empty")}</Text>
              </View>
            }
            renderItem={({ item }) => {
              const mine = item.role === "user";
              return (
                <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowAi]}>
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleAi]}>
                    <Text style={[styles.bubbleText, mine && { color: colors.onBrandPrimary }]}>{item.content}</Text>
                  </View>
                </View>
              );
            }}
            ListFooterComponent={
              sending ? (
                <View style={[styles.bubbleRow, styles.rowAi]}>
                  <View style={[styles.bubble, styles.bubbleAi]}>
                    <Text style={styles.thinking}>{t("chat.thinking")}</Text>
                  </View>
                </View>
              ) : null
            }
          />
        )}

        <KeyboardStickyView>
          <View style={[styles.inputBar, { paddingBottom: insets.bottom + spacing.sm }]}>
            <TextInput
              testID="chat-input"
              value={text}
              onChangeText={setText}
              placeholder={t("chat.placeholder")}
              placeholderTextColor={colors.onSurfaceTertiary}
              style={styles.input}
              multiline
            />
            <Pressable testID="chat-send" onPress={send} disabled={sending || !text.trim()} style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.5 }]}>
              <Ionicons name="arrow-up" size={22} color={colors.onBrandPrimary} />
            </Pressable>
          </View>
        </KeyboardStickyView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  headerCenter: { flex: 1 },
  headerTitle: { color: colors.onSurface, fontFamily: fonts.displaySemi, fontSize: 19 },
  headerSub: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 12 },
  aiDot: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: spacing["3xl"], gap: spacing.md },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  emptyText: { color: colors.onSurfaceSecondary, fontFamily: fonts.textRegular, fontSize: 14, textAlign: "center", paddingHorizontal: spacing.xl },
  bubbleRow: { flexDirection: "row" },
  rowMine: { justifyContent: "flex-end" },
  rowAi: { justifyContent: "flex-start" },
  bubble: { maxWidth: "84%", padding: spacing.md, borderRadius: radius.lg },
  bubbleMine: { backgroundColor: colors.brandPrimary, borderBottomRightRadius: 4 },
  bubbleAi: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { color: colors.onSurface, fontFamily: fonts.textRegular, fontSize: 14, lineHeight: 20 },
  thinking: { color: colors.onSurfaceTertiary, fontFamily: fonts.textRegular, fontSize: 14, fontStyle: "italic" },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider,
  },
  input: {
    flex: 1, maxHeight: 120, minHeight: 48, backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingTop: 12, paddingBottom: 12,
    color: colors.onSurface, fontFamily: fonts.textRegular, fontSize: 15,
    borderWidth: 1, borderColor: colors.border,
  },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" },
});

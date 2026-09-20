import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { subscribeToUserNotifications } from "@/lib/realtime";
import { supabase } from "@/lib/supabase";

type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string | null;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const loadNotifications = useCallback(
    async (isRefresh = false) => {
      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const { data, error: notificationsError } = await supabase
          .from("notifications")
          .select(
            "id, user_id, title, message, type, related_id, is_read, created_at",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (notificationsError) throw notificationsError;
        setNotifications((data ?? []) as NotificationRow[]);
      } catch (loadError) {
        if (__DEV__) console.error("Unable to load notifications:", loadError);
        setError(
          "Unable to load notifications right now. Please check your connection and try again.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user],
  );

  const markOneAsRead = useCallback(
    async (notification: NotificationRow) => {
      if (!user || notification.is_read || busy) return;

      setBusy(true);
      setError(null);

      try {
        const { error: updateError } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("id", notification.id)
          .eq("user_id", user.id);

        if (updateError) throw updateError;

        setNotifications((previous) =>
          previous.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item,
          ),
        );
      } catch (updateFailure) {
        if (__DEV__)
          console.error("Unable to mark notification as read:", updateFailure);
        setError("Unable to update this notification. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [busy, user],
  );

  const markAllAsRead = useCallback(async () => {
    if (!user || !notifications.some((item) => !item.is_read) || busy) return;

    setBusy(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (updateError) throw updateError;

      setNotifications((previous) =>
        previous.map((item) => ({ ...item, is_read: true })),
      );
    } catch (updateFailure) {
      if (__DEV__)
        console.error(
          "Unable to mark all notifications as read:",
          updateFailure,
        );
      setError("Unable to mark all notifications as read. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [busy, notifications, user]);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications]),
  );

  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToUserNotifications(user.id, () => {
      void loadNotifications(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadNotifications, user?.id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator color="#176b87" size="large" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={["#176b87"]}
            refreshing={refreshing}
            onRefresh={() => void loadNotifications(true)}
            tintColor="#176b87"
          />
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Notifications</Text>
            {unreadCount > 0 ? (
              <Text style={styles.unreadText}>{unreadCount} unread</Text>
            ) : null}
          </View>

          {unreadCount > 0 ? (
            <Pressable
              onPress={() => void markAllAsRead()}
              disabled={busy}
              style={[styles.primaryButton, busy && styles.disabledButton]}
            >
              <Text style={styles.primaryButtonText}>
                {busy ? "Updating..." : "Mark all as read"}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              onPress={() => void loadNotifications()}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>
              You&apos;re all caught up. New delivery updates will appear here.
            </Text>
          </View>
        ) : (
          notifications.map((item) => {
            const isUnread = !item.is_read;

            return (
              <Pressable
                key={item.id}
                onPress={() => void markOneAsRead(item)}
                style={[
                  styles.notificationCard,
                  isUnread ? styles.unreadCard : styles.readCard,
                ]}
              >
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  {isUnread ? <View style={styles.unreadDot} /> : null}
                </View>

                <Text style={styles.notificationMessage}>{item.message}</Text>

                {item.type ? (
                  <Text style={styles.typeText}>Type: {item.type}</Text>
                ) : null}

                <Text style={styles.timestampText}>
                  {formatDate(item.created_at)}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f8fa",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centeredContainer: {
    alignItems: "center",
    backgroundColor: "#f7f8fa",
    flex: 1,
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: "#66717f", fontSize: 16 },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: { color: "#1f2933", fontSize: 28, fontWeight: "700" },
  unreadText: {
    color: "#176b87",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: "#176b87",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.7,
  },
  errorCard: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  errorText: { color: "#9f1239", fontSize: 14 },
  retryButton: {
    backgroundColor: "#176b87",
    borderRadius: 8,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e8ebee",
    borderRadius: 12,
    borderWidth: 1,
    padding: 28,
  },
  emptyIcon: { fontSize: 28, marginBottom: 12 },
  emptyTitle: {
    color: "#1f2933",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    color: "#66717f",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  notificationCard: {
    borderColor: "#e8ebee",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  unreadCard: {
    backgroundColor: "#f5fbff",
    borderColor: "#cfe9f7",
  },
  readCard: {
    backgroundColor: "#ffffff",
  },
  notificationHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  notificationTitle: {
    color: "#1f2933",
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    marginRight: 8,
  },
  unreadDot: {
    backgroundColor: "#176b87",
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  notificationMessage: {
    color: "#475467",
    fontSize: 14,
    lineHeight: 20,
  },
  typeText: {
    color: "#66717f",
    fontSize: 12,
    marginTop: 8,
  },
  timestampText: {
    color: "#66717f",
    fontSize: 12,
    marginTop: 8,
  },
});

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Bell,
  Bike,
  Check,
  CheckCheck,
  CircleAlert,
  MapPin,
  Package,
  RefreshCw,
} from "lucide-react-native";
import { AppHeader } from "../components/AppHeader";
import { EmptyState, ErrorState } from "../components/CommonModalsAndCards";
import { useApp } from "../context/AppContext";
import type { CustomerNotification } from "../api/notifications";

const orderNotificationTypes = new Set([
  "order",
  "order_confirmed",
  "order_preparing",
  "rider_assigned",
  "rider_accepted",
  "order_picked_up",
  "out_for_delivery",
  "rider_arrived",
  "order_delivered",
  "order_cancelled",
]);

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isOrderNotification(notification: CustomerNotification) {
  return Boolean(
    notification.related_id &&
    notification.type &&
    (orderNotificationTypes.has(notification.type) ||
      notification.type.startsWith("order_")),
  );
}

function NotificationIcon({ type }: { type: string | null }) {
  if (type?.includes("rider") || type === "out_for_delivery") {
    return <Bike width={17} height={17} color="#fff" />;
  }
  if (type?.includes("address")) {
    return <MapPin width={17} height={17} color="#fff" />;
  }
  if (type?.startsWith("order") || type === "order") {
    return <Package width={17} height={17} color="#fff" />;
  }
  if (type === "security" || type === "account") {
    return <CircleAlert width={17} height={17} color="#fff" />;
  }
  return <Bell width={17} height={17} color="#fff" />;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadNotificationsCount,
    refreshNotifications,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    favorites,
  } = useApp();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    async (isPullToRefresh = false) => {
      if (isPullToRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        await refreshNotifications();
      } catch (loadError) {
        console.error("Unable to load customer notifications:", loadError);
        setError("Unable to load your notifications. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [refreshNotifications],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleNotificationPress = async (
    notification: CustomerNotification,
  ) => {
    try {
      if (!notification.is_read) {
        await handleMarkNotificationRead(notification.id);
      }
    } catch (readError) {
      console.error("Unable to mark notification as read:", readError);
      Alert.alert(
        "Notification update failed",
        "We could not mark this notification as read.",
      );
      return;
    }

    if (isOrderNotification(notification)) {
      router.push({
        pathname: "/order-details",
        params: { orderId: notification.related_id as string },
      });
    }
  };

  const handleMarkAll = async () => {
    try {
      await handleMarkAllNotificationsRead();
    } catch (markError) {
      console.error("Unable to mark all notifications as read:", markError);
      Alert.alert(
        "Notification update failed",
        "We could not mark all notifications as read.",
      );
    }
  };

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader
        currentScreen="Notifications"
        title="Notifications"
        showBack
        favoritesCount={favorites.length}
        unreadCount={unreadNotificationsCount}
      />
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void reload(true)}
            tintColor="#E86A17"
          />
        }
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 40,
          gap: 12,
        }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-extrabold text-[#2D1810]">
            Notifications ({unreadNotificationsCount} Unread)
          </Text>
          {unreadNotificationsCount > 0 ? (
            <Pressable
              onPress={() => void handleMarkAll()}
              className="flex-row items-center gap-1"
            >
              <CheckCheck width={14} height={14} color="#E86A17" />
              <Text className="text-xs text-[#E86A17] font-bold">
                Mark all as read
              </Text>
            </Pressable>
          ) : null}
        </View>

        {loading ? <ActivityIndicator size="large" color="#E86A17" /> : null}
        {error ? (
          <ErrorState message={error} onRetry={() => void reload()} />
        ) : null}
        {!loading && !error && notifications.length === 0 ? (
          <EmptyState
            icon={<Bell width={32} height={32} color="#E86A17" />}
            title="No notifications yet"
            description="Updates about your orders and account will appear here."
          />
        ) : null}
        {!loading && !error ? (
          <View className="gap-2">
            {notifications.map((notification) => (
              <Pressable
                key={notification.id}
                onPress={() => void handleNotificationPress(notification)}
                className={`flex-row items-start gap-3 p-3.5 rounded-3xl border ${
                  notification.is_read
                    ? "bg-white border-[#613D2D]/10"
                    : "bg-[#FDFBF7] border-[#E86A17]/40"
                }`}
              >
                <View
                  className={`w-9 h-9 rounded-2xl items-center justify-center ${
                    notification.is_read ? "bg-[#2D1810]" : "bg-[#E86A17]"
                  }`}
                >
                  <NotificationIcon type={notification.type} />
                </View>
                <View className="flex-1 gap-1">
                  <View className="flex-row items-start gap-2">
                    <Text
                      className={`flex-1 text-xs text-[#2D1810] ${
                        notification.is_read ? "font-bold" : "font-extrabold"
                      }`}
                    >
                      {notification.title}
                    </Text>
                    {!notification.is_read ? (
                      <View className="mt-1.5 h-2 w-2 rounded-full bg-[#E86A17]" />
                    ) : null}
                  </View>
                  <Text className="text-xs leading-relaxed text-[#613D2D]">
                    {notification.message}
                  </Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[10px] text-[#8E7668]">
                      {formatDate(notification.created_at)}
                    </Text>
                    {!notification.is_read ? (
                      <View className="flex-row items-center gap-1">
                        <Check width={12} height={12} color="#E86A17" />
                        <Text className="text-[10px] font-bold text-[#E86A17]">
                          Unread
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {!loading && !error && notifications.length > 0 ? (
          <Pressable
            onPress={() => void reload(true)}
            className="self-center flex-row items-center gap-1.5 py-2"
          >
            <RefreshCw width={14} height={14} color="#E86A17" />
            <Text className="text-xs font-bold text-[#E86A17]">
              Refresh notifications
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

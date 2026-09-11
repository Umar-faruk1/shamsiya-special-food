import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Package,
  RefreshCw,
  ShoppingBag,
} from "lucide-react-native";
import { AppHeader } from "../components/AppHeader";
import { EmptyState, ErrorState } from "../components/CommonModalsAndCards";
import { StatusBadge } from "../components/BadgesAndRatings";
import { useApp } from "../context/AppContext";
import { CustomerOrder, fetchCustomerOrders } from "../api/orders";

const terminalStatuses = new Set(["delivered", "cancelled", "failed"]);

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function money(value: number | string) {
  return `₵${Number(value).toFixed(2)}`;
}

export default function OrdersScreen() {
  const router = useRouter();
  const { favorites, authUser } = useApp();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(
    async (isRefresh = false) => {
      if (!authUser) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        setOrders(await fetchCustomerOrders());
      } catch (loadError) {
        console.error("Unable to load customer orders:", loadError);
        setError("Unable to load your orders. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authUser],
  );

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const activeOrders = orders.filter(
    (order) => !terminalStatuses.has(order.status),
  );
  const historyOrders = orders.filter((order) =>
    terminalStatuses.has(order.status),
  );
  const currentOrders = activeTab === "active" ? activeOrders : historyOrders;

  return (
    <View className="flex-1 bg-[#F7F4EE]">
      <AppHeader currentScreen="Orders" favoritesCount={favorites.length} />
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadOrders(true)}
            tintColor="#E86A17"
          />
        }
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 32,
          gap: 16,
        }}
      >
        <View className="flex-row bg-[#F4EFE6] p-1 rounded-2xl border border-[#613D2D]/12">
          <Pressable
            onPress={() => setActiveTab("active")}
            className={`flex-1 py-2 rounded-xl flex-row items-center justify-center gap-1.5 ${activeTab === "active" ? "bg-[#2D1810]" : ""}`}
          >
            <Clock
              width={14}
              height={14}
              color={activeTab === "active" ? "#fff" : "#8E7668"}
            />
            <Text
              className={`text-xs font-extrabold ${activeTab === "active" ? "text-white" : "text-[#8E7668]"}`}
            >
              Active ({activeOrders.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("history")}
            className={`flex-1 py-2 rounded-xl flex-row items-center justify-center gap-1.5 ${activeTab === "history" ? "bg-[#2D1810]" : ""}`}
          >
            <CheckCircle2
              width={14}
              height={14}
              color={activeTab === "history" ? "#fff" : "#8E7668"}
            />
            <Text
              className={`text-xs font-extrabold ${activeTab === "history" ? "text-white" : "text-[#8E7668]"}`}
            >
              History ({historyOrders.length})
            </Text>
          </Pressable>
        </View>

        {loading ? <ActivityIndicator size="large" color="#E86A17" /> : null}
        {error ? (
          <ErrorState message={error} onRetry={() => void loadOrders()} />
        ) : null}
        {!loading && !error && !currentOrders.length ? (
          <EmptyState
            icon={<ShoppingBag width={32} height={32} color="#8E7668" />}
            title="Your orders will appear here once you place an order"
            description={
              activeTab === "active"
                ? "There are no active deliveries right now."
                : "Your completed and unsuccessful orders will appear here."
            }
            actionText="Browse Menu"
            onAction={() => router.push("/(tabs)/explore")}
          />
        ) : null}
        <View className="gap-3">
          {currentOrders.map((order) => {
            const isActive = !terminalStatuses.has(order.status);
            return (
              <Pressable
                key={order.id}
                onPress={() =>
                  router.push({
                    pathname: "/order-details",
                    params: { orderId: order.id },
                  })
                }
                className="gap-3 bg-white rounded-3xl p-4 border border-[#613D2D]/12"
              >
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-row items-center gap-2">
                    <View className="w-9 h-9 rounded-2xl bg-[#F4EFE6] items-center justify-center">
                      <Package width={17} height={17} color="#E86A17" />
                    </View>
                    <View>
                      <Text className="text-xs font-extrabold text-[#2D1810]">
                        Order #{order.order_number}
                      </Text>
                      <Text className="text-[10px] text-[#8E7668]">
                        {formatDate(order.created_at)}
                      </Text>
                    </View>
                  </View>
                  <StatusBadge status={order.status} />
                </View>
                <View className="flex-row justify-between border-t border-neutral-100 pt-3">
                  <View>
                    <Text className="text-[10px] text-[#8E7668]">Payment</Text>
                    <Text className="text-xs font-bold text-[#2D1810]">
                      {order.payment_status}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-[10px] text-[#8E7668]">Total</Text>
                    <Text className="text-sm font-black text-[#E86A17]">
                      {money(order.total)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[10px] text-[#8E7668]">Rider</Text>
                    <Text className="text-xs font-bold text-[#2D1810]">
                      {order.rider_id ? "Assigned" : "Not assigned"}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center justify-end gap-1">
                  <Text className="text-xs font-bold text-[#613D2D]">
                    {isActive ? "Track order" : "View details"}
                  </Text>
                  <ChevronRight width={14} height={14} color="#613D2D" />
                </View>
              </Pressable>
            );
          })}
        </View>
        {!loading && !error && orders.length ? (
          <Pressable
            onPress={() => void loadOrders(true)}
            className="self-center flex-row items-center gap-1.5 py-2"
          >
            <RefreshCw width={14} height={14} color="#E86A17" />
            <Text className="text-xs font-bold text-[#E86A17]">
              Refresh orders
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

import { useFocusEffect, useRouter } from "expo-router";
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
import { subscribeToRiderOrders } from "@/lib/realtime";
import { supabase } from "@/lib/supabase";

export type Order = {
  id: string;
  order_number: string;
  customer_id: string;
  rider_id: string | null;
  status: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_status: string;
  payment_method: string | null;
  delivery_address: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  customer_note: string | null;
  rider_note: string | null;
  delivery_pin: string | null;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_options: unknown | null;
  notes: string | null;
  created_at: string;
};

export type CustomerProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

export type OrderWithDetails = Order & {
  items: OrderItem[];
  customer: CustomerProfile | null;
};

type SegmentKey = "available" | "active" | "completed";

const statusLabels: Record<string, string> = {
  rider_assigned: "Ready for Pickup",
  rider_accepted: "Accepted",
  picked_up: "Picked Up",
  out_for_delivery: "Out for Delivery",
  arrived: "Arrived",
  delivered: "Delivered",
  cancelled: "Cancelled",
  failed: "Failed",
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready_for_pickup: "Ready for Pickup",
  cash: "Cash",
  mobile_money: "Mobile Money",
  card: "Card",
  successful: "Successful",
  processing: "Processing",
  refunded: "Refunded",
};

function readable(value: string | null) {
  if (!value) return "Not available";
  return statusLabels[value] ?? value.replace(/_/g, " ");
}

function money(value: number) {
  return `GHS ${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatShortTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderCard({ order }: { order: OrderWithDetails }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/order/[id]", params: { id: order.id } })
      }
      style={styles.orderCard}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
          <View style={styles.timeRow}>
            <Text style={styles.timeDot}>◷</Text>
            <Text style={styles.orderTime}>
              {formatShortTime(order.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.orderMeta}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{readable(order.status)}</Text>
          </View>
          <Text style={styles.totalText}>{money(order.total)}</Text>
          <Text style={styles.paymentText}>
            {readable(order.payment_method).toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.customerRow}>
        <Text style={styles.customerName}>
          {order.customer?.full_name || "Customer"}
        </Text>
        <Text style={styles.customerPhone}>
          {order.customer?.phone || "Phone unavailable"}
        </Text>
      </View>

      <View style={styles.addressRow}>
        <Text style={styles.pinIcon}>⌾</Text>
        <Text style={styles.addressText} numberOfLines={2}>
          {order.delivery_address || "Address not available"}
        </Text>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.mutedText}>
          Delivery fee {money(order.delivery_fee)}
        </Text>
        <View style={styles.detailsButton}>
          <Text style={styles.detailsText}>View Details</Text>
          <Text style={styles.detailsChevron}>›</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [segment, setSegment] = useState<SegmentKey>("available");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  const loadOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    setSessionMessage(null);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) {
        setOrders([]);
        setSessionMessage(
          "Your session is no longer available. Please sign in again.",
        );
        return;
      }

      const { data: orderRows, error: ordersError } = await supabase
        .from("orders")
        .select(
          "id, order_number, customer_id, rider_id, status, subtotal, delivery_fee, discount, total, payment_status, payment_method, delivery_address, delivery_latitude, delivery_longitude, customer_note, rider_note, delivery_pin, accepted_at, picked_up_at, delivered_at, created_at, updated_at",
        )
        .eq("rider_id", authData.user.id)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const fetchedOrders = (orderRows ?? []) as Order[];
      const orderIds = fetchedOrders.map((order) => order.id);
      const customerIds = [
        ...new Set(fetchedOrders.map((order) => order.customer_id)),
      ];

      const [itemsResponse, customersResponse] = await Promise.all([
        orderIds.length
          ? supabase
              .from("order_items")
              .select(
                "id, order_id, menu_item_id, name, quantity, unit_price, total_price, selected_options, notes, created_at",
              )
              .in("order_id", orderIds)
          : Promise.resolve({ data: [], error: null }),
        customerIds.length
          ? supabase
              .from("profiles")
              .select("id, full_name, email, phone, avatar_url")
              .in("id", customerIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (itemsResponse.error) throw itemsResponse.error;
      if (customersResponse.error) throw customersResponse.error;

      const itemsByOrder = new Map<string, OrderItem[]>();
      for (const item of (itemsResponse.data ?? []) as OrderItem[]) {
        const current = itemsByOrder.get(item.order_id) ?? [];
        current.push(item);
        itemsByOrder.set(item.order_id, current);
      }

      const customerById = new Map(
        (customersResponse.data ?? []).map((customer) => [
          customer.id,
          customer as CustomerProfile,
        ]),
      );

      setOrders(
        fetchedOrders.map((order) => ({
          ...order,
          items: itemsByOrder.get(order.id) ?? [],
          customer: customerById.get(order.customer_id) ?? null,
        })),
      );
    } catch (loadError) {
      if (__DEV__) console.error("Unable to load rider orders:", loadError);
      setError(
        "Unable to load orders. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadOrders();
    }, [loadOrders]),
  );

  useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeToRiderOrders(user.id, () => {
      void loadOrders(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadOrders, user?.id]);

  const visibleOrders = useMemo(() => {
    if (segment === "available") {
      return orders.filter((order) => order.status === "rider_assigned");
    }
    if (segment === "active") {
      return orders.filter((order) =>
        ["rider_accepted", "picked_up", "out_for_delivery", "arrived"].includes(
          order.status,
        ),
      );
    }
    return orders.filter((order) => order.status === "delivered");
  }, [orders, segment]);

  const segmentCount = (target: SegmentKey) => {
    if (target === "available")
      return orders.filter((order) => order.status === "rider_assigned").length;
    if (target === "active") {
      return orders.filter((order) =>
        ["rider_accepted", "picked_up", "out_for_delivery", "arrived"].includes(
          order.status,
        ),
      ).length;
    }
    return orders.filter((order) => order.status === "delivered").length;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color="#f26a21" size="large" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </SafeAreaView>
    );
  }

  if (sessionMessage) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyTitle}>Session unavailable</Text>
        <Text style={styles.emptyText}>{sessionMessage}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={["#f26a21"]}
            onRefresh={() => void loadOrders(true)}
            refreshing={refreshing}
            tintColor="#f26a21"
          />
        }
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Orders</Text>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>
              {segmentCount("available")} Available
            </Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Manage incoming, active, and completed delivery tasks.
        </Text>

        <View style={styles.segmentedWrap}>
          {[
            { key: "available", label: "Available" },
            { key: "active", label: "Active" },
            { key: "completed", label: "Completed" },
          ].map((tab) => {
            const active = tab.key === segment;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setSegment(tab.key as SegmentKey)}
                style={[
                  styles.segmentButton,
                  active && styles.segmentButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    active && styles.segmentTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
                <Text
                  style={[
                    styles.segmentCount,
                    active && styles.segmentCountActive,
                  ]}
                >
                  {segmentCount(tab.key as SegmentKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error ? (
          <View style={styles.centeredSection}>
            <Text style={styles.errorTitle}>Unable to load orders</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <Pressable
              onPress={() => void loadOrders()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : visibleOrders.length === 0 ? (
          <View style={styles.centeredSection}>
            <Text style={styles.emptyTitle}>No matching orders</Text>
            <Text style={styles.emptyText}>Try another section.</Text>
          </View>
        ) : (
          visibleOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f7f5" },
  content: { paddingHorizontal: 8, paddingTop: 10, paddingBottom: 42 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f7f7f5",
  },
  loadingText: { color: "#66717f", fontSize: 16, marginTop: 12 },
  title: { color: "#1f2933", fontSize: 20, fontWeight: "700" },
  subtitle: { color: "#66717f", fontSize: 12, marginTop: 3, marginBottom: 10 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countPill: {
    backgroundColor: "#edf6ec",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  countPillText: { color: "#1f7a3d", fontSize: 12, fontWeight: "700" },
  segmentedWrap: {
    flexDirection: "row",
    backgroundColor: "#eceef1",
    borderRadius: 16,
    padding: 4,
    marginBottom: 12,
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 7,
    flexDirection: "row",
    gap: 6,
  },
  segmentButtonActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: { color: "#66717f", fontSize: 11, fontWeight: "700" },
  segmentTextActive: { color: "#f26a21" },
  segmentCount: {
    color: "#66717f",
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: "#dfe3e8",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  segmentCountActive: { backgroundColor: "#fdf0e8", color: "#f26a21" },
  orderCard: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#e6e9ed",
    padding: 12,
    marginBottom: 10,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderNumber: { color: "#1f2933", fontSize: 14, fontWeight: "700" },
  timeRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  timeDot: { color: "#8b96a3", fontSize: 12, marginRight: 5 },
  orderTime: { color: "#66717f", fontSize: 10 },
  orderMeta: { alignItems: "flex-end" },
  statusBadge: {
    backgroundColor: "#eaf5ff",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#357bd6",
    marginRight: 5,
  },
  statusText: { color: "#1e5f9b", fontSize: 10, fontWeight: "700" },
  totalText: {
    color: "#1f2933",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 6,
  },
  paymentText: { color: "#8b96a3", fontSize: 9, marginTop: 1 },
  customerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eef0f2",
    marginTop: 11,
    paddingTop: 10,
  },
  customerName: { color: "#344054", fontSize: 11, fontWeight: "700" },
  customerPhone: { color: "#66717f", fontSize: 10, fontWeight: "500" },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 7,
    backgroundColor: "#f8f9fb",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  pinIcon: { color: "#f26a21", fontSize: 14 },
  addressText: { color: "#4b5563", fontSize: 10, flex: 1 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  mutedText: { color: "#66717f", fontSize: 10 },
  detailsButton: {
    flexDirection: "row",
    backgroundColor: "#fff5ee",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#f3d4bf",
    paddingHorizontal: 11,
    paddingVertical: 8,
    alignItems: "center",
  },
  detailsText: { color: "#c45a24", fontSize: 11, fontWeight: "700" },
  detailsChevron: { color: "#f26a21", fontSize: 24, marginLeft: 4 },
  emptyTitle: { color: "#1f2933", fontSize: 18, fontWeight: "700" },
  emptyText: {
    color: "#66717f",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
  centeredSection: { alignItems: "center", paddingVertical: 36 },
  errorTitle: { color: "#1f2933", fontSize: 18, fontWeight: "700" },
  retryButton: {
    backgroundColor: "#f26a21",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 16,
  },
  retryText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
});

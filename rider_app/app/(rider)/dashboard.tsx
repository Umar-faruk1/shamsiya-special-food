import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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
import { useRiderLocation } from "@/hooks/useRiderLocation";
import { supabase } from "@/lib/supabase";

type RiderDashboardData = {
  id: string;
  approval_status: string;
  rider_status: string;
  rating: number | null;
  total_deliveries: number;
  total_earnings: number;
  is_online: boolean;
};

type DashboardOrder = {
  id: string;
  order_number: string;
  rider_id: string;
  status: string;
  total: number;
  payment_status: string;
  payment_method: string;
  delivery_address: string | null;
  created_at: string;
  updated_at: string;
};

const activeStatuses = new Set([
  "rider_assigned",
  "rider_accepted",
  "picked_up",
  "out_for_delivery",
  "arrived",
]);

const statusLabels: Record<string, string> = {
  rider_assigned: "Rider Assigned",
  rider_accepted: "Rider Accepted",
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
};

const valueLabels: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
  cash: "Cash",
  mobile_money: "Mobile Money",
  card: "Card",
  successful: "Successful",
  processing: "Processing",
  failed: "Failed",
  refunded: "Refunded",
};

function label(value: string) {
  return valueLabels[value] ?? statusLabels[value] ?? value.replace(/_/g, " ");
}

function formatCurrency(value: number) {
  return `GHS ${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function StatCard({ label: title, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <Text style={styles.statIcon}>•</Text>
      </View>
      <Text style={styles.statLabel}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { online, toggleOnline, loading: locationLoading } = useRiderLocation();
  const [rider, setRider] = useState<RiderDashboardData | null>(null);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      if (!user) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const [riderResponse, ordersResponse] = await Promise.all([
          supabase
            .from("riders")
            .select(
              "id, approval_status, rider_status, rating, total_deliveries, total_earnings, is_online",
            )
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("orders")
            .select(
              "id, order_number, rider_id, status, total, payment_status, payment_method, delivery_address, created_at, updated_at",
            )
            .eq("rider_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (riderResponse.error) throw riderResponse.error;
        if (ordersResponse.error) throw ordersResponse.error;

        setRider(riderResponse.data as RiderDashboardData | null);
        setOrders((ordersResponse.data ?? []) as DashboardOrder[]);
      } catch (loadError) {
        if (__DEV__)
          console.error("Unable to load rider dashboard:", loadError);
        setError(
          "Unable to load dashboard. Please check your connection and try again.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user],
  );

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  const activeOrders = useMemo(
    () => orders.filter((order) => activeStatuses.has(order.status)),
    [orders],
  );
  const activeOrder = activeOrders[0] ?? null;
  const completedOrders = orders.filter(
    (order) => order.status === "delivered",
  );
  const todayOrders = orders.filter((order) => {
    const created = new Date(order.created_at);
    const now = new Date();
    return created.toDateString() === now.toDateString();
  });
  const riderName =
    (typeof user?.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name) ||
    user?.email?.split("@")[0] ||
    "Rider";

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color="#f26a21" size="large" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorTitle}>Unable to load dashboard</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          onPress={() => void loadDashboard()}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!rider) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorTitle}>Rider data unavailable</Text>
        <Text style={styles.errorText}>
          We could not find your rider record.
        </Text>
        <Pressable
          onPress={() => void loadDashboard()}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const initial = riderName.trim().charAt(0).toUpperCase() || "R";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={["#f26a21"]}
            onRefresh={() => void loadDashboard(true)}
            refreshing={refreshing}
            tintColor="#f26a21"
          />
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingText}>
              {greeting()}, {riderName.split(" ")[0] || riderName}
            </Text>
            <Text style={styles.readyText}>Ready to deliver?</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.actionButton}
              onPress={() => void loadDashboard(true)}
            >
              <Text style={styles.actionIcon}>⟳</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => router.push("/notifications")}
            >
              <Text style={styles.actionIcon}>♧</Text>
            </Pressable>
            <Pressable
              style={styles.avatarButton}
              onPress={() => router.push("/profile")}
            >
              <Text style={styles.avatarText}>{initial}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusCardHeader}>
            <Text style={styles.cardLabel}>DELIVERY STATUS</Text>
            <View style={styles.gpsPill}>
              <Text style={styles.gpsText}>● Live GPS</Text>
            </View>
          </View>
          <View style={styles.statusTitleRow}>
            <View style={[styles.onlineDot, !online && styles.offlineDot]} />
            <Text style={styles.statusTitle}>
              {online ? "You're Online" : "You're Offline"}
            </Text>
          </View>
          <Text style={styles.statusText}>
            {online
              ? "You&apos;re available for delivery requests."
              : "Go online to receive delivery requests."}
          </Text>
          <Pressable
            onPress={() => void toggleOnline()}
            style={[styles.onlineToggle, !online && styles.onlineToggleMuted]}
            disabled={locationLoading}
          >
            <Text
              style={[
                styles.onlineToggleText,
                !online && styles.onlineToggleTextMuted,
              ]}
            >
              {locationLoading
                ? "Updating..."
                : online
                  ? "Go Offline"
                  : "Go Online"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.overviewHeader}>
          <Text style={styles.overviewLabel}>TODAY&apos;S OVERVIEW</Text>
          <Text style={styles.overviewLocation}>Accra Central Hub</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="Deliveries"
            value={String(todayOrders.length || rider.total_deliveries)}
          />
          <StatCard label="Completed" value={String(completedOrders.length)} />
          <StatCard
            label="Earnings"
            value={formatCurrency(rider.total_earnings)}
          />
          <StatCard label="Rating" value={(rider.rating ?? 0).toFixed(1)} />
        </View>

        {activeOrder ? (
          <View style={styles.activeCard}>
            <View style={styles.activeHeader}>
              <Text style={styles.activeTitle}>
                #{activeOrder.order_number}
              </Text>
              <Text style={styles.activeMeta}>Active delivery</Text>
              <View style={styles.statusBadgeOrange}>
                <Text style={styles.statusBadgeText}>
                  {label(activeOrder.status)}
                </Text>
              </View>
            </View>
            <View style={styles.activeContent}>
              <View>
                <Text style={styles.sectionLabel}>CUSTOMER</Text>
                <Text style={styles.valueText}>Customer</Text>
                <Text style={styles.mutedText}>Phone not available</Text>
              </View>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/order/[id]",
                    params: { id: activeOrder.id },
                  })
                }
                style={styles.phoneButton}
              >
                <Text style={styles.phoneButtonText}>☎</Text>
              </Pressable>
            </View>
            <View style={styles.metaBlock}>
              <Text style={styles.sectionLabel}>DELIVERY ADDRESS</Text>
              <Text style={styles.valueText}>
                {activeOrder.delivery_address || "Address not available"}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>DISTANCE</Text>
                <Text style={styles.summaryValue}>N/A</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>EST. TIME</Text>
                <Text style={styles.summaryValue}>N/A</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>ORDER TOTAL</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(activeOrder.total)}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/order/[id]",
                  params: { id: activeOrder.id },
                })
              }
              style={styles.activeDetailsButton}
            >
              <Text style={styles.activeDetailsText}>View Details ›</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f7f5",
  },
  content: {
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 36,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f7f7f5",
  },
  loadingText: { color: "#66717f", fontSize: 16, marginTop: 12 },
  errorTitle: { color: "#1f2933", fontSize: 22, fontWeight: "700" },
  errorText: {
    color: "#66717f",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#f26a21",
    borderRadius: 10,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  greetingText: { fontSize: 17, color: "#1f2933", fontWeight: "700" },
  readyText: { fontSize: 11, color: "#66717f", marginTop: 4 },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },
  actionIcon: { fontSize: 18, color: "#1f2933" },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f26a21",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  statusCard: {
    backgroundColor: "#effcf8",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d1f0de",
    padding: 14,
    marginBottom: 14,
  },
  statusCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 12,
    color: "#5d6b73",
    letterSpacing: 0.7,
    fontWeight: "700",
  },
  gpsPill: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gpsText: { fontSize: 11, color: "#1f2933", fontWeight: "600" },
  statusTitleRow: { flexDirection: "row", alignItems: "center" },
  onlineDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#14b87a",
    marginRight: 7,
  },
  offlineDot: { backgroundColor: "#9aa3ad" },
  statusTitle: { fontSize: 17, color: "#1f2933", fontWeight: "700" },
  statusText: { color: "#3d4a52", fontSize: 12, marginTop: 6 },
  onlineToggle: {
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderRadius: 11,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#dce8df",
    alignItems: "center",
  },
  onlineToggleMuted: {
    backgroundColor: "#f4f6f7",
    borderColor: "#e5e7eb",
  },
  onlineToggleText: { color: "#1f2933", fontSize: 13, fontWeight: "700" },
  onlineToggleTextMuted: { color: "#4b5563" },
  overviewHeader: {
    marginTop: 6,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  overviewLabel: {
    fontSize: 11,
    color: "#4b5563",
    fontWeight: "700",
    letterSpacing: 0.75,
  },
  overviewLocation: { color: "#8b96a3", fontSize: 10, fontWeight: "600" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statCard: {
    width: "48%",
    padding: 11,
    backgroundColor: "#ffffff",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 9,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#fff2eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statIcon: { color: "#f26a21", fontSize: 16, fontWeight: "700" },
  statLabel: { color: "#66717f", fontSize: 11, marginBottom: 7 },
  statValue: { color: "#1f2933", fontSize: 22, fontWeight: "700" },
  activeCard: {
    backgroundColor: "#fff4ec",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#f5d5be",
    padding: 11,
    marginTop: 10,
  },
  activeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  activeTitle: {
    fontSize: 14,
    color: "#1f2933",
    fontWeight: "700",
    flexShrink: 1,
  },
  activeMeta: { fontSize: 10, color: "#8a9199", marginRight: 8 },
  statusBadgeOrange: {
    backgroundColor: "#f26a21",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusBadgeText: { color: "#ffffff", fontSize: 11, fontWeight: "700" },
  activeContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    color: "#4b5563",
    letterSpacing: 0.7,
    fontWeight: "700",
  },
  valueText: {
    fontSize: 14,
    color: "#1f2933",
    fontWeight: "700",
    marginTop: 5,
  },
  mutedText: { fontSize: 11, color: "#66717f", marginTop: 3 },
  phoneButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  phoneButtonText: { fontSize: 18, color: "#f26a21" },
  metaBlock: { marginBottom: 12 },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f0d8c3",
    paddingTop: 10,
  },
  summaryItem: {
    flex: 1,
    marginRight: 8,
  },
  summaryLabel: { color: "#66717f", fontSize: 11, fontWeight: "700" },
  summaryValue: {
    color: "#1f2933",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 3,
  },
  activeDetailsButton: {
    backgroundColor: "#f26a21",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 12,
  },
  activeDetailsText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
});

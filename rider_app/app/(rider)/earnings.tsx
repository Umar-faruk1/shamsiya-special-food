import { useFocusEffect } from "expo-router";
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
import { supabase } from "@/lib/supabase";

type RiderSummary = {
  id: string;
  total_earnings: number | string | null;
  total_deliveries: number | string | null;
  rating: number | string | null;
};

type RiderEarning = {
  id: string;
  rider_id: string;
  order_id: string | null;
  delivery_fee: number | string | null;
  bonus: number | string | null;
  adjustment: number | string | null;
  total: number | string | null;
  status: string | null;
  created_at: string | null;
};

function formatCurrency(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return `GHS ${numeric.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatTime(value: string | null | undefined) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function dayKey(value: string | null | undefined) {
  if (!value) return "unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function EarningsScreen() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<RiderSummary | null>(null);
  const [earnings, setEarnings] = useState<RiderEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEarnings = useCallback(
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
        const [riderResponse, earningsResponse] = await Promise.all([
          supabase
            .from("riders")
            .select("id, total_earnings, total_deliveries, rating")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("rider_earnings")
            .select(
              "id, rider_id, order_id, delivery_fee, bonus, adjustment, total, status, created_at",
            )
            .eq("rider_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (riderResponse.error) throw riderResponse.error;
        if (earningsResponse.error) throw earningsResponse.error;

        setSummary((riderResponse.data as RiderSummary | null) ?? null);
        setEarnings((earningsResponse.data ?? []) as RiderEarning[]);
      } catch (loadError) {
        if (__DEV__) console.error("Unable to load rider earnings:", loadError);
        setError(
          "Unable to load your earnings right now. Please check your connection and try again.",
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
      void loadEarnings();
    }, [loadEarnings]),
  );

  const todayKey = dayKey(new Date().toISOString());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dayKey(yesterday.toISOString());
  const todayEarnings = earnings.filter(
    (entry) => dayKey(entry.created_at) === todayKey,
  );
  const yesterdayEarnings = earnings.filter(
    (entry) => dayKey(entry.created_at) === yesterdayKey,
  );
  const todayTotal = todayEarnings.reduce(
    (total, entry) => total + Number(entry.total ?? 0),
    0,
  );
  const weekTotal = earnings
    .filter((entry) => {
      if (!entry.created_at) return false;
      const date = new Date(entry.created_at);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return date >= weekStart;
    })
    .reduce((total, entry) => total + Number(entry.total ?? 0), 0);

  const renderEntry = (entry: RiderEarning) => (
    <View key={entry.id} style={styles.earningCard}>
      <View style={styles.earningIcon}>
        <Text style={styles.orderIcon}>▣</Text>
      </View>
      <View style={styles.earningMain}>
        <Text style={styles.orderLabel}>
          Delivery #{entry.order_id ? entry.order_id.slice(0, 8) : "N/A"}
        </Text>
        <Text style={styles.dateText}>
          ◷ {formatTime(entry.created_at)} · Fee{" "}
          {formatCurrency(entry.delivery_fee)}
        </Text>
      </View>
      <View style={styles.earningAmount}>
        <Text style={styles.totalValue}>{formatCurrency(entry.total)}</Text>
        {Number(entry.bonus ?? 0) > 0 ? (
          <Text style={styles.bonusText}>
            +{formatCurrency(entry.bonus)} tip
          </Text>
        ) : (
          <Text style={styles.completedText}>
            {entry.status === "paid" ? "Completed" : "Recorded"}
          </Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator color="#f26a21" size="large" />
        <Text style={styles.loadingText}>Loading earnings...</Text>
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
            onRefresh={() => void loadEarnings(true)}
            refreshing={refreshing}
            tintColor="#f26a21"
          />
        }
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Earnings</Text>
          <Pressable style={styles.payoutButton}>
            <Text style={styles.payoutText}>Payout</Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              onPress={() => void loadEarnings()}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.summaryCardDark}>
          <Text style={styles.summaryLabelDark}>TODAY&apos;S EARNINGS</Text>
          <Text style={styles.summaryValueDark}>
            {formatCurrency(todayTotal)}
          </Text>
          <Text style={styles.summaryNote}>+14% vs yesterday</Text>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBottomRow}>
            <View>
              <Text style={styles.summaryLabelDark}>This Week</Text>
              <Text style={styles.summaryValueSmall}>
                {formatCurrency(weekTotal)}
              </Text>
            </View>
            <View>
              <Text style={styles.summaryLabelDark}>Next Payout Date</Text>
              <Text style={styles.summaryPayout}>Every Monday (MoMo)</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricIconOrange}>
              <Text style={styles.metricIconText}>▣</Text>
            </View>
            <Text style={styles.metricLabel}>Completed Deliveries</Text>
            <Text style={styles.metricValue}>
              {summary ? Number(summary.total_deliveries ?? 0) : 0}
            </Text>
            <Text style={styles.metricSmall}>Total deliveries this week</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIconGreen}>
              <Text style={styles.metricIconTextGreen}>↗</Text>
            </View>
            <Text style={styles.metricLabel}>Avg per Delivery</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(
                Number(summary?.total_earnings ?? 0) /
                  Math.max(Number(summary?.total_deliveries ?? 1), 1),
              )}
            </Text>
            <Text style={styles.metricSmall}>Including delivery fee & tip</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Earnings History</Text>
        <Text style={styles.subtleText}>Itemized breakdown per delivery</Text>

        {earnings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No earnings yet</Text>
            <Text style={styles.emptyText}>
              Your rider earnings will appear here once they are recorded.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>TODAY</Text>
              <Text style={styles.dayTotal}>{formatCurrency(todayTotal)}</Text>
            </View>
            {todayEarnings.length > 0 ? (
              todayEarnings.map(renderEntry)
            ) : (
              <Text style={styles.noDayEntries}>No deliveries today</Text>
            )}
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>YESTERDAY</Text>
              <Text style={styles.dayTotal}>
                {formatCurrency(
                  yesterdayEarnings.reduce(
                    (total, entry) => total + Number(entry.total ?? 0),
                    0,
                  ),
                )}
              </Text>
            </View>
            {yesterdayEarnings.length > 0 ? (
              yesterdayEarnings.map(renderEntry)
            ) : (
              <Text style={styles.noDayEntries}>No deliveries yesterday</Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f7f5" },
  content: { paddingHorizontal: 8, paddingTop: 10, paddingBottom: 42 },
  centeredContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#f7f7f5",
    gap: 12,
  },
  loadingText: { color: "#66717f", fontSize: 16 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: "#1f2933", fontSize: 20, fontWeight: "700" },
  payoutButton: {
    backgroundColor: "#079669",
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  payoutText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  summaryCardDark: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    marginBottom: 14,
  },
  summaryLabelDark: { color: "#cbd5e1", fontSize: 12, letterSpacing: 0.8 },
  summaryValueDark: {
    color: "#ffffff",
    fontSize: 27,
    fontWeight: "700",
    marginTop: 7,
  },
  summaryNote: {
    color: "#48d99a",
    backgroundColor: "#073b35",
    borderRadius: 999,
    alignSelf: "flex-start",
    fontSize: 11,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginTop: 7,
  },
  summaryDivider: {
    backgroundColor: "#2a3548",
    height: 1,
    marginTop: 12,
    marginBottom: 11,
  },
  summaryBottomRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryValueSmall: {
    color: "#ffc400",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
  },
  summaryPayout: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryCardLight: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    width: "48%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  summaryLabel: { color: "#66717f", fontSize: 12 },
  summaryValueLight: {
    color: "#1f2933",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },
  metricGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  metricCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    width: "48%",
  },
  metricIconOrange: {
    alignSelf: "flex-end",
    backgroundColor: "#fff3eb",
    borderRadius: 8,
    padding: 6,
    marginBottom: 5,
  },
  metricIconGreen: {
    alignSelf: "flex-end",
    backgroundColor: "#edfbf5",
    borderRadius: 8,
    padding: 6,
    marginBottom: 5,
  },
  metricIconText: { color: "#f26a21", fontSize: 14 },
  metricIconTextGreen: { color: "#079669", fontSize: 16, fontWeight: "700" },
  metricLabel: { color: "#66717f", fontSize: 12 },
  metricValue: {
    color: "#1f2933",
    fontSize: 23,
    fontWeight: "700",
    marginTop: 8,
  },
  metricSmall: { color: "#66717f", fontSize: 12, marginTop: 4 },
  sectionTitle: {
    color: "#1f2933",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  subtleText: { color: "#66717f", fontSize: 11, marginBottom: 10 },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 5,
  },
  dayTitle: { color: "#66717f", fontSize: 11, fontWeight: "700" },
  dayTotal: { color: "#d65d1e", fontSize: 11, fontWeight: "700" },
  noDayEntries: { color: "#8b96a3", fontSize: 12, paddingVertical: 12 },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    backgroundColor: "#eef2f7",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  filterChipSelected: { backgroundColor: "#fff3eb" },
  filterChipText: { color: "#5a6571", fontSize: 12, fontWeight: "700" },
  filterChipTextSelected: { color: "#f26a21" },
  earningCard: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#eef0f2",
    padding: 10,
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
  },
  earningIcon: {
    backgroundColor: "#fff5ee",
    borderRadius: 8,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },
  earningMain: { flex: 1 },
  earningAmount: { alignItems: "flex-end" },
  orderIcon: { color: "#f26a21", fontSize: 15 },
  orderLabel: { color: "#1f2933", fontSize: 12, fontWeight: "700" },
  totalValue: { color: "#1f2933", fontSize: 14, fontWeight: "700" },
  dateText: { color: "#66717f", fontSize: 10, marginTop: 5 },
  bonusText: { color: "#079669", fontSize: 10, marginTop: 2 },
  completedText: { color: "#8b96a3", fontSize: 10, marginTop: 2 },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  breakdownLabel: { color: "#66717f", fontSize: 12 },
  breakdownValue: { color: "#1f2933", fontSize: 12, fontWeight: "600" },
  errorCard: {
    backgroundColor: "#fff1f2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecdd3",
    padding: 12,
    marginTop: 12,
  },
  errorText: { color: "#9f1239", fontSize: 13 },
  retryButton: {
    backgroundColor: "#f26a21",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  retryButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 18,
    marginTop: 12,
  },
  emptyTitle: { color: "#1f2933", fontSize: 16, fontWeight: "700" },
  emptyText: { color: "#66717f", fontSize: 13, marginTop: 6 },
});
